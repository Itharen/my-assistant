// 🧪 A TESZT-EREDETŰ NAPLÓ-BEJEGYZÉS FELISMERÉSÉNEK TESZTJEI (21. tétel).
//
// > **Owner, 2026-09-12 09:05:** *„A `doctor now` »UTOLSÓ HIBA« sora TESZT-szemetet mutat…
// > ⛔ NE némítsd el: ha volt kihagyott tétel, a sor mondja ki."*
//
// ⭐ A NÉGY ÁLLÍTÁS:
//   (a) 🧪 **ez a spec maga is teszt-futás** ⇒ az `isTestRun()` **igaz** — a bélyeg tehát él;
//   (b) a bélyegzett bejegyzés teszt-eredetű;
//   (c) a temp-útvonalas bejegyzés is *(a bélyeg előtt keletkezett 114 tétel)*;
//   (d) 🔴 **egy VALÓDI bejegyzés, ami a SZÖVEGÉBEN említ egy spec-fájlt, ⛔ NEM teszt-eredetű**
//       — ezt a hamis pozitívot **mérve** találtam a mai naplóban.

import { ActionLogTestOrigin_Util } from './action-log.test-origin.js';

describe('ActionLogTestOrigin_Util — mi számít teszt-eredetűnek', () => {

  it('🧪 EZ A SPEC MAGA IS TESZT-FUTÁS — az `isTestRun()` igaz, tehát a bélyeg ÉL', () => {
    // ⭐ A legerősebb igazolás, amit adhatunk: a jel a saját futásában bizonyít.
    // ⚠️ Ha ez elbukik, a bélyegzés csendben abbamaradt, és a `doctor now` újra teszt-szemetet
    // mutatna — épp az, amit a 21. tétel javít.
    expect(ActionLogTestOrigin_Util.isTestRun()).toBeTrue();
  });

  it('⭐ A BÉLYEGZETT bejegyzés teszt-eredetű', () => {
    expect(ActionLogTestOrigin_Util.isTestEntry({ extra: { testRun: true } })).toBeTrue();
  });

  it('⭐ A TEMP-ÚTVONALAS bejegyzés is — a bélyeg ELŐTT keletkezett 114 tétel miatt', () => {
    // A mért, valódi minta a mai naplóból:
    const ref: string = 'C:\\Users\\User\\AppData\\Local\\Temp\\ma-groups-spec-KSBgEB\\broken.json';

    expect(ActionLogTestOrigin_Util.isTestEntry({ ref: ref })).toBeTrue();
    // Git-Bash/POSIX alak is:
    expect(ActionLogTestOrigin_Util.isTestEntry({ ref: '/tmp/ma-presets-spec-1/broken.json' })).toBeTrue();
    // És ha az útvonal az `extra.file`-ban van:
    expect(ActionLogTestOrigin_Util.isTestEntry({ extra: { file: ref } })).toBeTrue();
  });

  it('🔴 POZITÍV KONTROLL: a SZÖVEGÉBEN spec-et említő VALÓDI bejegyzés ⛔ NEM teszt-eredetű', () => {
    // 🔬 MÉRT HAMIS POZITÍV (2026-09-12 09:08, `actor: claude`): egy szöveg- vagy blob-szintű
    // `*spec*` minta EZT kiszűrte volna — vagyis pont a tétel felvetését tüntette volna el.
    const real = {
      ref: '__agent/DEV-HANDOFF.md',
      extra: { note: "A friss 'ma doctor now' UTOLSO HIBA sora teszt-szemetet mutat: a groups.spec.ts …" },
    };

    expect(ActionLogTestOrigin_Util.isTestEntry(real)).toBeFalse();
  });

  it('⭐ A VALÓDI rendszer-hiba átmegy — se bélyeg, se temp-útvonal', () => {
    expect(ActionLogTestOrigin_Util.isTestEntry({
      ref: 'C:\\Users\\User\\.config\\my-assistant\\discord\\pending-inbound.jsonl',
    })).toBeFalse();
    expect(ActionLogTestOrigin_Util.isTestEntry({})).toBeFalse();
    // ⚠️ A „temp" szó egy szó BELSEJÉBEN ⛔ nem jel — csak önálló útvonal-szakaszként.
    expect(ActionLogTestOrigin_Util.isTestEntry({ ref: 'E:/projects/contemporary/data.json' })).toBeFalse();
  });
});
