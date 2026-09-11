// 🔴 A NAPTÁR-ESZKÖZ HIBÁJA — **kimondott**, kóddal és teendővel.
//
// ## ⭐ MIÉRT VAN SAJÁT HIBA-TÍPUSA
//
// > A feladat kikötése: *„hiányzó/lejárt engedélynél **kimondott** hiba, ⛔ nem üres lista — az
// > üres naptár és a nincs-jogosultság **kívülről ugyanúgy néz ki**."*
//
// Egy sima `Error` **elveszíti** azt, ami itt a lényeg: **mit tegyen** a hívó. A `remedy` mező
// ezért **kötelező része a szerződésnek** — a parancs kiírja, a JSON-boríték továbbadja, és így
// a *„nincs jogosultság"* eset **soha nem tud üres naptárként látszani**.
//
// ⛔ **Szándékosan NEM `EmailToolError`:** az az e-mail-eszköz szótára. Ugyanazt az OAuth-ot
// használjuk, de a **hibák jelentése** más — a naptár-olvasás nem e-mail-művelet
// *(`core-ssot-unified`: egy fogalom = egy hely, ⛔ nem egy hely = minden fogalom)*.

/** Strukturált naptár-hiba: stabil, grep-elhető `code` + a megoldó lépés. */
export class CalendarToolError extends Error {

  /** Stabil, grep-elhető azonosító *(`MA-CALENDAR-…`)*. */
  readonly code: string;

  /**
   * 🔴 MIT TEGYEN a hívó — ⛔ ez **nem** opcionális dísz.
   *
   * ⚠️ Enélkül a hívó a *„nincs engedély"*-t ugyanúgy *„valami elromlott"*-ként adná tovább,
   * és a felhasználó nem tudná, hogy **egy újra-engedélyezés** megoldja.
   */
  readonly remedy: string;

  /** Technikai kontextus. ⛔ Tokent, fejlécet, esemény-tartalmat SOHA nem tartalmaz. */
  readonly details?: Record<string, unknown>;

  constructor(input: {
    code: string;
    message: string;
    remedy: string;
    details?: Record<string, unknown>;
  }) {
    // 🔴 A TEENDŐ A `message`-BE IS BEKERÜL — ⛔ nem csak a `remedy` mezőbe.
    //
    // ⚠️ MIÉRT: a hívók **túlnyomó többsége** `error.message`-et ír ki *(a CLI központi
    // hibakezelője, a naplók, a `catch (err)` ágak)*. Ha a teendő **csak** egy külön mezőben
    // élne, a leggyakoribb úton **elveszne** — és pont az veszne el, ami a hibát feloldja.
    super(`${input.message} → ${input.remedy}`);
    this.name = 'CalendarToolError';
    this.code = input.code;
    this.remedy = input.remedy;
    this.details = input.details;
  }
}
