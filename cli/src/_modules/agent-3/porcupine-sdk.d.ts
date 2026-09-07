// 🪶 TÍPUS-DEKLARÁCIÓ a `@picovoice/porcupine-node` helyére — a csomag TELEPÍTÉSE NÉLKÜL.
//
// 🔴 MIÉRT NEM TELEPÍTJÜK: a Picovoice Porcupine **fizetős / licenckötött** SDK
// *(hozzáférési kulcsot igényel)*. A projekt hard rule-ja:
// `current/principles/no-paid-solutions.md` — ⛔ fizetős megoldást nem javaslunk és nem
// építünk be, ha van más út.
//
// ⭐ ÉS ITT VAN MÁS ÚT — sőt, NINCS IS RÁ SZÜKSÉG:
//
//   1. **Az owner kivette a hatókörből** (2026-09-07): *„Ezzel a continuous voice feldolgozás
//      időzítéssel most ne foglalkozz. Azt majd én fogom egyelőre a mikrofonomat ki be
//      kapcsolni."* ⇒ a **mikrofon** a kapcsoló, nem egy ébresztőszó-figyelő.
//
//   2. 🔴 **A RÉGI KÓD MAGA SZÁMÍT A HIÁNYÁRA.** A `cv-recording.control-service.ts`
//      `processWithPorcupine()` metódusa **dinamikus importtal** tölti be, `try/catch`-ben,
//      és a szerző oda is írta:
//        *„Dynamic import to avoid breaking if Agent-3 is not available"*
//        *„Don't break voice processing if Porcupine fails or is not available.
//          This is expected if Agent-3 is not initialized"*
//      ⇒ Az Agent-3 hiánya **explicit módon támogatott állapot** az eredeti kódban. Nem mi
//      csonkítjuk meg — mi a szerző által megtervezett üzemmódban futtatjuk.
//
// ⚙️ AMI EBBŐL KÖVETKEZIK: a fordításhoz elég, ha a modul **típusa** feloldódik; futásidőben
// a dinamikus import elbukik, és a meglévő `catch` elnyeli — pontosan úgy, ahogy tervezve volt.
//
// ⛔ EZ NEM NÉMA CSONK: ha az ébresztőszó valaha kell, ezt a fájlt kell törölni, a csomagot
// telepíteni *(owner-döntéssel, mert fizetős)*, és akkor a valódi típusok lépnek a helyére.
// Az átemelt kód addig is **bájtra változatlan**.
//
// Terv: `__agent/plans/voice-control-transplant/hyperplan.plan.md`

declare module '@picovoice/porcupine-node' {

  /** Az ébresztőszó-felismerő — csak a felhasznált felület. */
  export class Porcupine {
    constructor(accessKey: string, keywords: unknown[], sensitivities: number[]);
    /** Gyár-metódus a beépített ébresztőszavakhoz — ezt hívja az átemelt kód. */
    static fromBuiltInKeywords(
      accessKey: string,
      keywords: unknown[],
      sensitivities?: number[],
    ): Porcupine;
    readonly frameLength: number;
    readonly sampleRate: number;
    process(frame: Int16Array): number;
    release(): void;
  }

  /** A beépített ébresztőszavak felsorolása. */
  export const BuiltinKeyword: Record<string, unknown>;
}
