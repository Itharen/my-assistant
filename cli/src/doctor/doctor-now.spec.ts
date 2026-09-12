// ⏱️ A `ma doctor now` TESZTJEI — a pillanatkép (20. tétel, 3).
//
// > **Owner, 2026-09-12 05:33:** *„Tudjad magadat diagnosztizálni, hogy ilyenkor mi a fene
// > történik például most?"*
//
// ⭐ A HÁROM ÁLLÍTÁS, amit itt leszögezünk:
//   (a) a pillanatkép **összeáll**, és a döntés indoklása benne van;
//   (b) 🔴 egy forrás bukása ⛔ **nem buktatja** a diagnosztikát — de **látszik** a `gaps`-ben;
//   (c) 🔴 a hiányzó `moment` blokk ⛔ **nem nyugalom**: kimondjuk, hogy régi figyelő fut.

import { DoctorNow_Util } from './doctor-now.js';
import type { DoctorNowSnapshot } from './doctor-now.models.js';
import { DoctorNowRender_Util } from './doctor-now.render.js';
import type { HeartbeatStatus } from '../discord/discord.heartbeat.js';

const NOW: Date = new Date('2026-09-12T06:23:54+02:00');

/** A napló-olvasás négy mezője — a pillanatképből származtatva *(l. a forrás-modult)*. */
type ErrorReading = Pick<
  DoctorNowSnapshot,
  'lastError' | 'skippedTestErrors' | 'skippedChronicleErrors' | 'unparsedLines'
>;

/** Egy „minden rendben" életjel — a PILLANAT-blokkal együtt. */
function aliveListener(overrides: { isGateClosed?: boolean; isNoiseFlooded?: boolean } = {}): HeartbeatStatus {
  return {
    state: 'alive',
    ageMs: 8_000,
    heartbeat: {
      updatedAt: NOW.toISOString(),
      botTag: 'Honnie#6234',
      processedCount: 3,
      moment: {
        isRecognizing: false,
        isGateClosed: overrides.isGateClosed ?? false,
        isNoiseFlooded: overrides.isNoiseFlooded ?? false,
        openDetections: 0,
        processingRecordings: 0,
        noiseInWindow: 0,
        gateReason: 'Nincs folyamatban megszólalás.',
      },
    },
  };
}

/** A hat forrás, mind sikeres — a teszt ezt írja át esetenként. */
function workingSources(overrides: Partial<Parameters<typeof DoctorNow_Util.collect>[0]> = {}): Parameters<typeof DoctorNow_Util.collect>[0] {
  return {
    now: NOW,
    readBatch: async (): Promise<{ pendingCount: number; oldestAgeMs: number | null; newestAgeMs: number | null }> =>
      ({ pendingCount: 2, oldestAgeMs: 60_000, newestAgeMs: 41_000 }),
    readDecision: async (): ReturnType<Parameters<typeof DoctorNow_Util.collect>[0]['readDecision']> =>
      ({ shouldFlush: false, reason: 'ÉPP BESZÉL — folyamatban van egy megszólalás.', pendingCount: 2 }),
    readListener: async (): Promise<HeartbeatStatus> => aliveListener(),
    readRetry: async (): Promise<{ pendingCount: number; nextDueMs: number | null }> =>
      ({ pendingCount: 1, nextDueMs: 120_000 }),
    readMachine: async (): Promise<{ cpuPercent: number | null; ramUsedGb: number; ramTotalGb: number }> =>
      ({ cpuPercent: 25, ramUsedGb: 103.1, ramTotalGb: 127.1 }),
    readErrors: async (): Promise<ErrorReading> => ({
      lastError: { summary: '[MA-DISCORD-LISTENER-CRASH] 1s után kilépett.', ageMs: 29_000 },
      skippedTestErrors: 0,
      skippedChronicleErrors: 0,
      unparsedLines: 0,
    }),
    ...overrides,
  };
}

describe('DoctorNow_Util — a PILLANAT összeállítása', () => {

  it('⭐ ÖSSZEÁLL, és a döntés INDOKLÁSA benne van — ez válaszol a „miért nem megy ki"-re', async () => {
    const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect(workingSources());

    expect(snapshot.batch.pendingCount).toBe(2);
    expect(snapshot.batch.decision?.reason).toContain('ÉPP BESZÉL');
    expect(snapshot.machine.ramUsedGb).toBeCloseTo(103.1, 1);
    expect(snapshot.gaps).toEqual([]);
  });

  it('🔴 EGY FORRÁS BUKÁSA NEM buktatja a diagnosztikát — de LÁTSZIK', async () => {
    // ⛔ Egy diagnosztika sosem hasalhat el attól, hogy épp azt méri, ami elromlott.
    const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect(workingSources({
      readBatch: async (): Promise<never> => {
        throw new Error('EPERM: a köteg-fájl nem olvasható');
      },
      readMachine: async (): Promise<never> => {
        throw new Error('nincs CPU-adat');
      },
    }));

    expect(snapshot.batch.pendingCount).toBe(0);
    expect(snapshot.machine.cpuPercent).toBeNull();
    expect(snapshot.gaps.length).toBe(2);
    expect(snapshot.gaps.join(' ')).toContain('EPERM');
  });

  it('🔴 A DÖNTÉS bukása KÜLÖN kimondva — ⛔ nem „minden rendben"', async () => {
    const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect(workingSources({
      readDecision: async (): Promise<never> => {
        throw new Error('a CCAP nem válaszolt');
      },
    }));

    expect(snapshot.batch.decision).toBeNull();
    expect(snapshot.batch.decisionProblem).toContain('CCAP');
    expect(DoctorNowRender_Util.render(snapshot)).toContain('a döntés NEM mérhető');
  });

  it('🔴 A HIÁNYZÓ PILLANAT-BLOKK NEM NYUGALOM — kimondjuk, hogy régi figyelő fut', async () => {
    // ⚠️ Ez a legfontosabb állítás: egy régi figyelő mellett a kapu és a futó felismerés
    // ⛔ nem mérhető. Ha nullákat írnánk ki, az AZT állítaná, hogy „semmi nem történik".
    const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect(workingSources({
      readListener: async (): Promise<HeartbeatStatus> => ({ state: 'alive', ageMs: 5_000, heartbeat: {
        updatedAt: NOW.toISOString(),
        botTag: 'Honnie#6234',
        processedCount: 0,
      } }),
    }));

    expect(snapshot.gaps.join(' ')).toContain('NINCS pillanat-blokk');
    expect(DoctorNowRender_Util.render(snapshot)).toContain('a PILLANAT nem mérhető');
  });

  it('⛔ HALOTT FIGYELŐNÉL nem hazudunk „régi kód"-ot — ott a hiány mást jelent', async () => {
    const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect(workingSources({
      readListener: async (): Promise<HeartbeatStatus> => ({ state: 'absent' }),
    }));

    expect(snapshot.gaps.join(' ')).not.toContain('NINCS pillanat-blokk');
    expect(DoctorNowRender_Util.render(snapshot)).toContain('FIGYELŐ: absent');
  });
});

describe('DoctorNowRender_Util — a pillanatkép EGY képernyőn', () => {

  it('⭐ A LÉNYEG MIND BENNE VAN: köteg · figyelő · kapu · gép · utolsó hiba', async () => {
    const rendered: string = DoctorNowRender_Util.render(await DoctorNow_Util.collect(workingSources()));

    expect(rendered).toContain('MI TÖRTÉNIK MOST');
    expect(rendered).toContain('KÖTEG: 2 üzenet vár');
    expect(rendered).toContain('ÚJRAPRÓBÁLÁS: 1 hang vár');
    expect(rendered).toContain('FIGYELŐ: alive');
    expect(rendered).toContain('köteg-kapu');
    expect(rendered).toContain('RAM 103.1/127.1 GB');
    expect(rendered).toContain('UTOLSÓ HIBA');
    // ⭐ Egy képernyő: ⛔ nem jelentés-folyam.
    expect(rendered.split('\n').length).toBeLessThan(20);
  });

  it('🎤 A ZAJ-ÖZÖN LÁTSZIK a kapu sorában — a 19. tétel állapota diagnosztizálható', async () => {
    const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect(workingSources({
      readListener: async (): Promise<HeartbeatStatus> => aliveListener({ isNoiseFlooded: true }),
    }));

    expect(DoctorNowRender_Util.render(snapshot)).toContain('ZAJ-ÖZÖN');
  });
});

describe('🧪 A TESZT-SZEMÉT KISZŰRÉSE az „utolsó hiba" sorból (21. tétel)', () => {

  it('🔴 A TESZT-EREDETŰ HIBA NEM jelenik meg fő hibaként — de a SZÁMA látszik', async () => {
    // > Owner: „⛔ NE némítsd el: ha volt kihagyott tétel, a sor mondja ki."
    const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect(workingSources({
      readErrors: async (): Promise<ErrorReading> =>
        ({ lastError: null, skippedTestErrors: 3, skippedChronicleErrors: 0, unparsedLines: 0 }),
    }));
    const rendered: string = DoctorNowRender_Util.render(snapshot);

    expect(snapshot.lastError).toBeNull();
    expect(rendered).toContain('ma nem volt VALÓDI hiba');
    expect(rendered).toContain('3 teszt-eredetű bejegyzés kihagyva');
  });

  it('⭐ VALÓDI hiba MELLETT is kimondja a kihagyottak számát', async () => {
    const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect(workingSources({
      readErrors: async (): Promise<ErrorReading> => ({
        lastError: { summary: '[MA-DISCORD-LISTENER-CRASH] 1s után kilépett.', ageMs: 29_000 },
        skippedTestErrors: 114,
        skippedChronicleErrors: 0,
        unparsedLines: 0,
      }),
    }));
    const rendered: string = DoctorNowRender_Util.render(snapshot);

    expect(rendered).toContain('MA-DISCORD-LISTENER-CRASH');
    expect(rendered).toContain('114 teszt-eredetű bejegyzés kihagyva');
  });

  it('⛔ HA NEM VOLT KIHAGYOTT TÉTEL, a sor NEM zajos — nincs „(0 kihagyva)"', async () => {
    const rendered: string = DoctorNowRender_Util.render(await DoctorNow_Util.collect(workingSources()));

    expect(rendered).not.toContain('kihagyva');
  });
});

describe('📖 A KRÓNIKA és a VAK FOLT szétválasztása (22. tétel)', () => {

  it('📖 A KRÓNIKA-BEJEGYZÉS nem rendszer-hiba — de a száma KÜLÖN látszik', async () => {
    // > Owner: „az én RETROSPEKTÍV jegyzetem… nem rendszer-hiba, hanem krónika… De a számuk
    // > itt is látszódjon, ahogy a teszteknél."
    const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect(workingSources({
      readErrors: async (): Promise<ErrorReading> =>
        ({ lastError: null, skippedTestErrors: 126, skippedChronicleErrors: 11, unparsedLines: 0 }),
    }));
    const rendered: string = DoctorNowRender_Util.render(snapshot);

    expect(snapshot.lastError).toBeNull();
    // ⭐ A KÉT SZÁM KÜLÖN: a teszt-szemét a gép zaja, a krónika a saját elemzésünk.
    expect(rendered).toContain('126 teszt-eredetű + 11 krónika bejegyzés kihagyva');
  });

  it('🔴 AZ ÉRTELMEZHETETLEN SOR A VAK FOLT — kimondva a `gaps`-ben, ⛔ nem elnyelve', async () => {
    // 🔬 Mérve 2026-09-12: 52 nap / 119 869 sorból 1 ilyen (egy kézzel írt JSONL-sorban
    // escape-eletlen `F:\Steam` útvonal). ⚠️ Kicsi, de ⛔ nem lehet néma: akár EBBEN a sorban
    // lehetne az utolsó hiba.
    const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect(workingSources({
      readErrors: async (): Promise<ErrorReading> =>
        ({ lastError: null, skippedTestErrors: 0, skippedChronicleErrors: 0, unparsedLines: 2 }),
    }));
    const rendered: string = DoctorNowRender_Util.render(snapshot);

    expect(snapshot.unparsedLines).toBe(2);
    expect(snapshot.gaps.join(' ')).toContain('2 napló-sor NEM volt JSON-ként értelmezhető');
    expect(rendered).toContain('AMIT NEM SIKERÜLT MEGMÉRNI');
  });

  it('⛔ HA NINCS VAK FOLT, nincs róla sor — a jelentés nem zajos', async () => {
    const snapshot: DoctorNowSnapshot = await DoctorNow_Util.collect(workingSources());

    expect(snapshot.unparsedLines).toBe(0);
    expect(snapshot.gaps.join(' ')).not.toContain('értelmezhető');
  });
});
