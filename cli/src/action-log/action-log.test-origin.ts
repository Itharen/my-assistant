// 🧪 TESZT-EREDETŰ NAPLÓ-BEJEGYZÉS — a felismerés KÉT oldala EGY helyen (21. tétel).
//
// > **Owner, 2026-09-12 09:05:** *„A `doctor now` »UTOLSÓ HIBA« sora TESZT-szemetet mutat…
// > Mivel a teszteket naponta sokszor futtatjuk, az »utolsó hiba« szinte MINDIG teszt-eredetű
// > lesz. ⇒ vagy hamis riasztás, vagy megtanuljuk figyelmen kívül hagyni — és a második a
// > rosszabb, mert akkor a valódi hibát se vesszük észre."*
//
// ## 🔬 A MÉRÉS (`__agent/log/actions/2026-09-12.jsonl`, 5 992 bejegyzés)
//
// | Mit mértem | Érték |
// |---|---|
// | `kind: 'error'` bejegyzés egy nap alatt | **631** |
// | ebből **ideiglenes könyvtárra** mutató `ref` | **114** |
// | ezek mintája | `…\AppData\Local\Temp\ma-<modul>-spec-XXXXXX\broken.json` |
// | temp-es `ref` `-spec-` szakasz **nélkül** | **0** |
//
// ⇒ A szándékosan hibás fixtúrák *(`groups.spec.ts`, `presets.spec.ts`, `device-caps.spec.ts`)*
// helyesen naplóznak — csak a **közös** naplóba, és a diagnosztika rendszer-hibaként mutatta.
//
// ## 🔴 EGY HAMIS POZITÍVOT IS MÉRTEM — ezért NEM szöveg-egyezés a jel
//
// A napló **egyik VALÓDI** bejegyzése *(`actor: claude`, 09:08)* a **summary**-jában említi, hogy
// `groups.spec.ts` — a `ref`-je viszont `__agent/DEV-HANDOFF.md`:
//
// ```
// „A friss 'ma doctor now' UTOLSO HIBA sora teszt-szemetet mutat: a groups.spec.ts …"
// ```
//
// ⇒ Egy **blob- vagy summary-szintű** `*spec*` minta ezt **kiszűrte volna** — vagyis pont a
// tétel felvetését tüntette volna el. ⭐ Ezért a heurisztika **kizárólag az útvonalat** nézi, és
// **ideiglenes könyvtárat** követel.
//
// ## ⭐ A TISZTÁBB JEL: EXPLICIT MEGJELÖLÉS AZ EMITNÉL
//
// A handoff felvetette *(„pl. a teszt-futás explicit megjelölése az emitnél — az a tisztább, ha
// olcsón megoldható")*. **Megmértem, mi látszik a spec-folyamatban:**
//
// ```
// typeof globalThis.jasmine = 'object'          ⟵ ⭐ közvetlen, konfiguráció NÉLKÜL
// process.argv[1]           = …\node_modules\jasmine\bin\jasmine.js
// process.env.MA_TEST_RUN   = (nincs)           ⟵ ⛔ nem létezik, be kellene vezetni
// ```
//
// ⇒ ⛔ **Nem kellett új környezeti változó** *(ami minden futtatási módban elromolhat)*: a
// spec-keretrendszer **már ott van** a folyamatban. ⇒ A `logAction` innentől **bélyegzi** a
// bejegyzést *(`extra.testRun: true`)*.
//
// ## 🔴 MIÉRT KELL MINDKÉT JEL — a bélyeg NEM elég
//
// | Eset | Mi fogja meg |
// |---|---|
// | mostantól keletkező spec-bejegyzés | ⭐ a **bélyeg** *(pontos, nem heurisztika)* |
// | a **már meglévő** 114 tétel *(és minden régi nap)* | a **temp-útvonal** |
// | spec által **indított gyerek-folyamat** *(ott nincs `jasmine` globális)* | a **temp-útvonal** |
// | a szerver saját naplózója *(külön funkcióval ír)* | a **temp-útvonal**, ha egyszer szennyezne |
//
// ⇒ A bélyeg a **pontos** jel, az útvonal a **visszafogó**. ⛔ Egyik sem elhagyható.

/** A teszt-eredetű bejegyzés felismerése — az ÍRÓ és az OLVASÓ oldal ugyanitt. */
export class ActionLogTestOrigin_Util {

  /** Ezt a mezőt teszi a `logAction` a teszt-futásban keletkező bejegyzés `extra`-jába. */
  static readonly MARKER_FIELD: string = 'testRun';

  /**
   * 🧪 TESZT-FUTÁSBAN VAGYUNK ÉPP? *(az ÍRÓ oldal)*
   *
   * ⭐ MÉRVE, ⛔ nem feltételezve: a jasmine-folyamatban `typeof globalThis.jasmine === 'object'`,
   * és a `process.argv[1]` a `node_modules/jasmine/bin/jasmine.js`.
   *
   * ⚠️ MIÉRT KETTŐ: a globális a spec **futása** közben biztos ott van, de modul-betöltéskor
   * még nem feltétlenül. Az `argv` viszont a folyamat teljes életében stabil. ⇒ VAGY-kapcsolat.
   */
  static isTestRun(): boolean {
    // ⛔ `as` átcímkézés NÉLKÜL: az `in` operátor a `globalThis`-en közvetlenül működik.
    if ('jasmine' in globalThis) return true;

    return /node_modules[\\/]jasmine[\\/]/u.test(process.argv[1] ?? '');
  }

  /**
   * 🧪 EZ A BEJEGYZÉS TESZT-EREDETŰ? *(az OLVASÓ oldal)*
   *
   * @param entry egy napló-sor — ⭐ **szűk** bemenet: csak az `extra` és az útvonal-mezők.
   *
   * ⚠️ A `summary`-t **SZÁNDÉKOSAN NEM** vizsgáljuk: mérve egy VALÓDI bejegyzés említi a
   * `groups.spec.ts`-t a szövegében ⇒ egy szöveg-egyezés **eltüntetné** *(l. a fájl fejlécét)*.
   */
  static isTestEntry(entry: { extra?: Record<string, unknown>; ref?: string }): boolean {
    if (entry.extra?.[ActionLogTestOrigin_Util.MARKER_FIELD] === true) return true;

    const file: unknown = entry.extra?.['file'];
    const paths: string[] = [entry.ref ?? '', typeof file === 'string' ? file : ''];

    return paths.some((path: string): boolean => ActionLogTestOrigin_Util.isTempPath(path));
  }

  /**
   * Ideiglenes könyvtárra mutat-e az útvonal?
   *
   * ⚠️ MIÉRT ELÉG A `Temp` SZAKASZ: mérve **114/114** ilyen bejegyzés spec-fixtúrából jött, és
   * **0** olyan volt, ami temp-ben van, de nem spec *(a production-kód ⛔ nem naplóz temp-útvonalat)*.
   * ⭐ A `/tmp/` alak is benne van: a projekt Git-Bashből is futtatható.
   */
  private static isTempPath(path: string): boolean {
    if (!path) return false;

    return /(^|[\\/])(Temp|tmp)[\\/]/u.test(path);
  }
}
