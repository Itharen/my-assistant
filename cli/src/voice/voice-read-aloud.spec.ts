// A felolvasás-döntés tesztjei (T-59, owner 2026-09-10: „ha ott vagyok, akkor fel is olvasod").
//
// ⭐ A LEGFONTOSABB ÁLLÍTÁSOK ITT: (a) a **nyugtát** nem olvassuk fel, (b) ugyanazt **kétszer**
// nem, (c) és ha az owner **nincs bent**, egyáltalán nem — a hangot senki nem hallaná, a
// szöveg viszont akkor is ott van a csatornában.

import {
  decideReadAloud,
  parseOutboundLine,
  type OutboundLogEntry,
  type ReadAloudContext,
} from './voice-read-aloud.js';

function context(overrides: Partial<ReadAloudContext> = {}): ReadAloudContext {
  return {
    ownerPresent: true,
    alreadySpoken: new Set<string>(),
    ...overrides,
  };
}

const entry: OutboundLogEntry = {
  sentAt: '2026-09-10T18:40:00+02:00',
  kind: 'reply',
  text: 'Kész a **javítás**, 839 teszt zöld.',
};

describe('decideReadAloud — 🔴 a RUTIN kihagyás NEM hír (mérve: a napló 95%-a)', () => {

  it('a „már felolvastuk" RUTIN — ⛔ nem naplózandó esemény', () => {
    // 🔴 MÉRVE 2026-09-11 03:20: a napi akció-napló 67 408 sorából 64 088 (95%, 15 MB)
    // egyetlen sor volt: „kihagyva (…): ezt már felolvastuk". Az `fs.watch` minden
    // eseményére a TELJES naplót újraértékeljük ⇒ bejegyzések × események.
    //
    // ⚠️ És a napló VÉGTELEN retentionnal COMMITOLVA van — a zaj véglegesen a repóban marad,
    // és eltemeti a valódi jelzéseket.
    const decision = decideReadAloud(
      { sentAt: '2026-09-11T03:00:00+02:00', text: 'Szia.' },
      { ownerPresent: true, alreadySpoken: new Set(['2026-09-11T03:00:00+02:00']) },
    );

    expect(decision.speak).toBeFalse();
    expect(decision.routine).toBeTrue();
  });

  it('⭐ a MAGYARÁZÓ okok NEM rutinok — azok továbbra is naplózandók', () => {
    // ⛔ Ez nem elhallgatás: ezek bejegyzésenként EGYSZER fordulnak elő, és tényleg
    // megmagyaráznak valamit, amit különben nem értenénk.
    const notPresent = decideReadAloud(
      { sentAt: '2026-09-11T03:01:00+02:00', text: 'Szia.' },
      { ownerPresent: false, alreadySpoken: new Set<string>() },
    );
    const ack = decideReadAloud(
      { sentAt: '2026-09-11T03:02:00+02:00', text: 'ok', kind: 'ack' },
      { ownerPresent: true, alreadySpoken: new Set<string>() },
    );
    const noSpeakable = decideReadAloud(
      { sentAt: '2026-09-11T03:03:00+02:00', text: '| a | b |' },
      { ownerPresent: true, alreadySpoken: new Set<string>() },
    );

    for (const d of [notPresent, ack, noSpeakable]) {
      expect(d.speak).toBeFalse();
      expect(d.routine).toBeFalsy();
      expect(d.reason.length).toBeGreaterThan(0);
    }
  });

  it('a SIKERES felolvasás sem rutin — az elhangzás tény, amit tudni akarunk', () => {
    const decision = decideReadAloud(
      { sentAt: '2026-09-11T03:04:00+02:00', text: 'Kész a javítás.' },
      { ownerPresent: true, alreadySpoken: new Set<string>() },
    );

    expect(decision.speak).toBeTrue();
    expect(decision.routine).toBeFalsy();
  });
});

describe('decideReadAloud — mikor olvassuk fel', () => {

  it('⭐ bent lévő owner + valódi válasz ⇒ FELOLVASSUK, kimondható szöveggel', () => {
    const decision = decideReadAloud(entry, context());

    expect(decision.speak).toBeTrue();
    // A markdown-dísz eltűnt: a `**javítás**`-ból „javítás" lett.
    expect(decision.text).toBe('Kész a javítás, 839 teszt zöld.');
  });

  it('MINDEN döntés visz OKOT — ⛔ a néma kihagyás nem derülne ki a naplóból', () => {
    const cases: ReadAloudContext[] = [
      context(),
      context({ ownerPresent: false }),
      context({ alreadySpoken: new Set([entry.sentAt]) }),
    ];

    for (const ctx of cases) {
      expect(decideReadAloud(entry, ctx).reason.length).toBeGreaterThan(5);
    }
  });

  describe('🔴 amit NEM olvasunk fel', () => {

    it('ha az owner NINCS bent — a hangot senki nem hallaná', () => {
      const decision = decideReadAloud(entry, context({ ownerPresent: false }));

      expect(decision.speak).toBeFalse();
      expect(decision.reason).toContain('nincs bent');
    });

    it('⛔ a NYUGTÁT (ack) nem — az nem mondanivaló, csak átvételi jelzés', () => {
      // Felolvasva csak megszakítaná azt, amit épp csinál.
      const decision = decideReadAloud({ ...entry, kind: 'ack' }, context());

      expect(decision.speak).toBeFalse();
      expect(decision.reason).toContain('nyugta');
    });

    it('⚠️ ugyanazt KÉTSZER nem — a fájl-figyelő ugyanarra az írásra több eseményt is adhat', () => {
      // Hangban a duplázás sokkal zavaróbb, mint szövegben: végig kell hallgatni.
      const decision = decideReadAloud(entry, context({ alreadySpoken: new Set([entry.sentAt]) }));

      expect(decision.speak).toBeFalse();
      expect(decision.reason).toContain('már felolvastuk');
    });

    it('ha nincs KIMONDHATÓ tartalom (csak táblázat) — nincs mit felolvasni', () => {
      const decision = decideReadAloud(
        { ...entry, text: '| a | b |\n|---|---|' },
        context(),
      );

      expect(decision.speak).toBeFalse();
      expect(decision.reason).toContain('kimondható');
    });

    it('időbélyeg nélküli bejegyzést nem — nem lehetne nyilvántartani, hogy felolvastuk-e', () => {
      expect(decideReadAloud({ sentAt: '', text: 'valami' }, context()).speak).toBeFalse();
    });
  });

  it('⚠️ a HIÁNYZÓ `kind` VÁLASZNAK számít — a régi napló-sorokon nincs `kind`', () => {
    // Ha az alapértelmezés „ack" lenne, a régi bejegyzések némán kimaradnának.
    expect(decideReadAloud({ sentAt: entry.sentAt, text: 'Szia.' }, context()).speak).toBeTrue();
  });
});

describe('parseOutboundLine — a napló-sor értelmezése', () => {

  it('a rendes sort értelmezi', () => {
    expect(parseOutboundLine('{"sentAt":"2026-09-10T18:00:00+02:00","kind":"reply","text":"x"}'))
      .toEqual({ sentAt: '2026-09-10T18:00:00+02:00', kind: 'reply', text: 'x' });
  });

  it('⚠️ a CSONKA utolsó sor `null` — ez a NORMÁLIS eset, épp írják', () => {
    expect(parseOutboundLine('{"sentAt":"2026-09-10T18:0')).toBeNull();
  });

  it('az üres sor `null`', () => {
    expect(parseOutboundLine('   ')).toBeNull();
  });

  it('⛔ az időbélyeg nélküli sor `null` — nyilvántarthatatlan lenne', () => {
    expect(parseOutboundLine('{"kind":"reply","text":"x"}')).toBeNull();
  });
});
