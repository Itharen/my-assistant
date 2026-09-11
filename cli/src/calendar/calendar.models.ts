// 🗓️ EGY NAPTÁR-ESEMÉNY — **forrás-független** alak.
//
// > **Owner, 2026-09-11 12:19:** *„ahhoz, hogy az asszisztensi feladataidat jól el tudd látni,
// > ahhoz majd itt egy-két dolgot **előre kell venni**, mint például a **munkanaptár**."*
//
// ## 🔴 A MÉRT INDOK, amiért ez sürgős
//
// Ma **11:00**-kor mítingje volt. A rendszer **csak azt tudta**, hogy *van* egy míting — mert az
// owner **szóban** mondta. ⛔ **Kivel · miről · milyen platformon: semmi.** Az ébresztés lefutott,
// a **felkészítés** nem — pedig az a nagyobb érték. *(12:19-kor megismétlődött.)*
//
// ## ⭐ MIÉRT FORRÁS-FÜGGETLEN — és miért NEM Google-specifikus
//
// 🙋 **Nyitott owner-kérdés:** a **munka**naptár ugyanabban a Google-fiókban van, vagy a megbízó
// rendszerében *(Workspace / Microsoft 365)*? ⚠️ **Ez a kérdés NEM blokkolja a munkát** — de
// **eldöntené** a modul alakját, ha Google-specifikusra építenénk.
//
// ⇒ Ezért az **olvasó cserélhető**, és **ez** az alak a szerződés. Ha Microsoft lesz, egy
// `.ics`-olvasó ugyanezt a parancsot szolgálja ki, **változatlan** kimenettel.
//
// ⛔ **AMI SZÁNDÉKOSAN NINCS BENNE** *(`one-function-is-enough`)*: ismétlődés-szabály, írás,
// naptár-azonosító, szín, emlékeztető, szervező-jogosultság. Azok **külön** tételek, ha
// egyáltalán kellenek — most a kérdés az, hogy **mi van ma**.

/**
 * Egy esemény a napból.
 *
 * ⚠️ **MINDEN idő ISO-8601, offszettel** *(`2026-09-11T11:00:00+02:00`)* — ⛔ nem „11:00"
 * sztring és ⛔ nem UTC-re normalizált érték. Indok: a `Z`-re normalizált idő a naplóban
 * **két órával csúszik**, és ezt a projekt **már megfizette** *(a státusz-kivonat UTC-ben írta
 * az időt, 2026-09-08)*.
 */
export interface CalendarEvent {
  /** A forrás szerinti azonosító — a duplikáció-szűréshez és a visszakereséshez. */
  id: string;
  /** A cím. ⚠️ Üres is lehet: a naptárakban van cím nélküli esemény. */
  title: string;
  /** Kezdés — ISO-8601 offszettel. */
  startsAt: string;
  /** Vége — ISO-8601 offszettel. */
  endsAt: string;
  /**
   * 🔴 EGÉSZ NAPOS-e.
   *
   * ⚠️ MIÉRT KÜLÖN JELZŐ: az egész napos esemény a forrásban **dátum** *(`2026-09-11`)*, nem
   * időpont. Ha ezt időpontként mutatnánk, *„00:00-tól 00:00-ig"* lenne belőle — ami hamis.
   */
  isAllDay: boolean;
  /** Helyszín vagy hívás-link. ⚠️ Üres, ha a forrás nem ad. */
  location: string;
  /** A résztvevők megjelenítendő neve vagy e-mail-címe, a forrás sorrendjében. */
  attendees: string[];
}
