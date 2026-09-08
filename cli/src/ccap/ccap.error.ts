// CCAP integráció hibái — strukturált, DESKRIPTÍV hibakezelés.
//
// Owner-követelmény (2026-09-06): „kéne legyen nagyon alapos hibakezelési rendszerünk,
// ami deskriptív infót ad neked arról, hogy mi nem jó, mi hiányzik."
//
// Ezért minden hiba HÁROM dolgot hordoz, nem egyet:
//   1. `code`      — gépi azonosító (stabil, kereshető)
//   2. `message`   — mi történt
//   3. `remedy`    — MIT KELL TENNI. Ez a mező KÖTELEZŐ; enélkül a hiba csak panasz.
//
// A `remedy` nélküli hiba a `core-error-debuggable` + `error-handling.md` zero-tolerance
// szabály megsértése — ezért a típus nem is engedi elhagyni.

/** CCAP-integrációs hibakódok. Stabil kontraktus — a diagnosztika ezekre hivatkozik. */
export type CcapErrorCode =
  | 'MA-CCAP-SERVER-UNREACHABLE'
  | 'MA-CCAP-BAD-RESPONSE'
  | 'MA-CCAP-NO-SESSION-ID-ENV'
  | 'MA-CCAP-SELF-NOT-FOUND'
  | 'MA-CCAP-PROMPT-FAILED'
  // 🔴 A kézbesítési cél rögzítésének hibái — `ccap.owner-target.ts`.
  // Mért incidens 2026-09-08: az owner üzenetei a DEV sessionbe mentek.
  | 'MA-CCAP-NO-OWNER-TARGET'
  | 'MA-CCAP-OWNER-TARGET-INCOMPLETE'
  | 'MA-CCAP-OWNER-TARGET-GONE'
  | 'MA-CCAP-OWNER-TARGET-MISMATCH';

export class CcapError extends Error {
  constructor(
    public readonly code: CcapErrorCode,
    message: string,
    /** MIT KELL TENNI — kötelező, mert a tünet önmagában nem elég. */
    public readonly remedy: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'CcapError';
  }

  /** Ember által olvasható, teljes leírás — hiba + teendő egy sorban. */
  describe(): string {
    return `${this.code}: ${this.message} → ${this.remedy}`;
  }
}
