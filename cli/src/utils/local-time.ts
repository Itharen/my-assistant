// ⏰ HELYI IDŐ — egyetlen forrás minden állapot-kiíráshoz.
//
// 🔴 MÉRT HIBA (owner, 2026-09-08 08:55): a `ma status digest` fejléce
// `2026-09-08T01:02:38.765Z`-t írt, amikor **03:02** volt az owner óráján. Két óra
// eltérés — és ebből téves következtetést vont le arról, mikor történt valami.
//
// ⚠️ A `toISOString()` mindig **UTC**-t ad. Ez gépi csere-szabványnak jó, embernek olvasva
// **félrevezető**. Ezért: ami az ownernek szól, az **Europe/Budapest** szerint, és ki is
// írjuk, hogy melyik zóna — hogy soha ne kelljen fejben konvertálni.
//
// 📌 A projekt szabálya ugyanez emberi oldalon: `current/principles/time-must-be-measured.md`
// — *„minden időpont-állítás ELŐTT `date`"*. Ez annak a gépi párja.

/** A zóna, amiben az owner él. Minden ember-olvasható időpont ebben megy. */
export const DISPLAY_TIME_ZONE: string = 'Europe/Budapest';

/**
 * `HH:mm:ss` helyi idő szerint.
 *
 * Napló-sorokhoz: ott a dátum rendszerint fölösleges zaj, a másodperc viszont **kell**
 * — egy kiesés hossza másodpercekben mérhető.
 */
export function localClock(when: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(when);
}

/**
 * `YYYY-MM-DD HH:mm:ss` helyi idő szerint — dátummal együtt.
 *
 * ⚠️ **Dátum nélkül nem elég**, ha az owner egy nappal később olvassa vissza: a puszta
 * `03:02` nem mondja meg, melyik nap hajnaláról van szó.
 */
export function localStamp(when: Date = new Date()): string {
  const parts: Intl.DateTimeFormatPart[] = new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(when);

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part: Intl.DateTimeFormatPart): boolean => part.type === type)?.value ?? '';

  // ⚠️ Kézzel fűzzük össze: a `format()` kimenete futtatókörnyezet-függően vesszőzhet
  // („2026-09-08, 03:02:38"), és ez az alak stabil kell legyen — teszt is méri.
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

/**
 * A státusz-kiírások **kötelező** idő-fejléce.
 *
 * ⭐ MIÉRT VAN BENNE A ZÓNA NEVE: enélkül az owner nem tudja megkülönböztetni attól a
 * kiírástól, ami UTC-ben jött — épp ez volt a mért hiba. A címke teszi **önmagában
 * értelmezhetővé** a sort.
 */
export function localTimeHeader(when: Date = new Date()): string {
  return `⏰ ${localStamp(when)} (${DISPLAY_TIME_ZONE})`;
}

/**
 * Egy eltelt időtartam ember-olvasható alakja.
 *
 * 🔴 EZ A KIESÉS MÉRTÉKEGYSÉGE: „mennyi ideig nem voltam bent" — az owner ezt a számot
 * keresi, amikor egy beszélgetés elveszett.
 */
export function formatDuration(ms: number): string {
  const safe: number = Math.max(0, Math.round(ms / 1000));

  if (safe < 60) return `${safe} mp`;
  if (safe < 3600) return `${Math.floor(safe / 60)}p ${safe % 60}mp`;

  return `${Math.floor(safe / 3600)}ó ${Math.floor((safe % 3600) / 60)}p`;
}
