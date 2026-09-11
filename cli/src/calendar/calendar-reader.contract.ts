// 🔌 A CSERÉLHETŐ NAPTÁR-OLVASÓ SZERZŐDÉSE.
//
// > **A feladat kikötése (owner, 2026-09-11 12:19):** *„A beolvasás legyen **forrás-független**
// > (egy `CalendarEvent` alak, mögötte cserélhető olvasó): még nyitott, hogy a munkanaptár
// > Google vagy Microsoft."*
//
// ## ⭐ MIÉRT EZ A HATÁR — és miért PONT itt
//
// A nyitott kérdés *(Google vagy Microsoft)* **nem blokkolja a munkát**, mert a parancs felülete
// és a kimenet alakja **mindkét esetben azonos**. ⇒ Ez a fájl az a **egyetlen pont**, amit egy új
// forrásnak ki kell szolgálnia; minden más *(nap-határ, sorrend, formázás, hibajelzés)* felette
// van és **változatlan marad**.
//
// ⚠️ **AZ IDŐABLAK A SZERZŐDÉS RÉSZE:** az olvasó a `[from, to)` **félig zárt** intervallumot
// **átfedő** eseményeket adja vissza. ⛔ Nem szűkebbet *(a 23:30-00:30-as esemény kimaradna)* és
// ⛔ nem bővebbet *(a szomszédos nap beszivárogna a „mi van ma" válaszba)*.
//
// 🔴 **ÉS AZ SEM OPCIONÁLIS, HOGY MIKOR DOB:** ha az olvasás **nem volt lehetséges**
// *(nincs engedély, lejárt token, hálózati hiba)*, az olvasó **dobjon** — ⛔ SOHA ne adjon üres
// listát. Indok: *„az üres naptár és a nincs-jogosultság kívülről ugyanúgy néz ki."* A dobott
// hiba `CalendarToolError`, ami a **teendőt** is viszi *(`calendar.error.ts`)*.

import type { CalendarEvent } from './calendar.models.js';

/** Egy naptár-forrás, amiből egy nap eseményei kiolvashatók. */
export interface CalendarReader {

  /**
   * A `[from, to)` ablakot átfedő események.
   *
   * @param input `from`/`to` ISO-8601 **offszettel**; `account` a forrás-oldali fiók.
   * @returns az események a **forrás-független** `CalendarEvent` alakban.
   * @throws `CalendarToolError` ha az olvasás nem volt lehetséges — ⛔ üres lista helyett.
   */
  readDay(input: { from: string; to: string; account?: string }): Promise<CalendarEvent[]>;
}
