// 🗓️ „MI VAN MA?" — ⭐ EZ AZ EGY FUNKCIÓ.
//
// > **Owner, 2026-09-11 12:19:** *„A feladat EGY funkció: `ma calendar today` (vagy `--day <ISO>`)
// > → a nap eseményei (kezdés, vége, cím, helyszín/link, résztvevők)."*
//
// ⛔ **AMI SZÁNDÉKOSAN NINCS ITT** *(a feladat szó szerinti tiltása, `one-function-is-enough`)*:
// írás, ismétlődés-szabály, felület, értesítés, több naptár egyesítése. Azok **külön** tételek,
// ha egyáltalán kellenek.
//
// ## ⭐ MIT TESZ EZ A RÉTEG — és mit NEM
//
// **Teszi:** a nap **határait** megállapítja *(helyi idő, félig zárt ablak)*, meghívja a
// **cserélhető** olvasót, **sorba** rendezi és **olvasható sorokká** formázza az eredményt.
//
// ⛔ **Nem teszi:** nem beszél hálózattal *(azt az olvasó teszi)* és ⛔ **nem nyeli le a hibát**
// — a `CalendarToolError` **átmegy** rajta. 🔴 Ez nem lustaság, hanem a feladat kikötése: ha itt
// `catch`-elnénk és üres napot adnánk vissza, pont azt a hibát okoznánk, amit el kell kerülni.

import { CalendarDay_Util } from './calendar-day.js';
import { CalendarGoogleReader } from './calendar-google.reader.js';
import type { CalendarReader } from './calendar-reader.contract.js';
import type { CalendarEvent } from './calendar.models.js';

/** Egy nap kiolvasott képe. ⚠️ Szándékosan nem exportált *(egy export / fájl)*. */
interface CalendarDayReading {
  /** A kiolvasott nap `YYYY-MM-DD` alakban. */
  day: string;
  /** Az ablak kezdete, ISO-8601 offszettel. */
  from: string;
  /** Az ablak vége *(a következő nap 00:00)*, ISO-8601 offszettel. */
  to: string;
  /** Az események időrendben, egész naposak előre. */
  events: CalendarEvent[];
  /** Ránézésre olvasható sorok — egy sor / esemény. */
  lines: string[];
  /** 🔴 **Kimondott** összegzés — az üres nap is MONDATOT kap, ⛔ nem csak egy `0`-t. */
  summary: string;
}

/** A nap kiolvasása: határok → cserélhető olvasó → sorrend → olvasható sorok. */
export class CalendarDayService {

  /**
   * Egy nap eseményei.
   *
   * @param input `day` = `YYYY-MM-DD` *(hiányában a mai nap)*; `now` a „most" *(teszthez)*;
   *   `account` a forrás-oldali fiók; `reader` a **cserélhető** olvasó.
   * @returns a nap képe — események, sorok, és **kimondott** összegzés.
   * @throws `CalendarToolError` ha az olvasás nem volt lehetséges *(⛔ nem üres nap)*.
   */
  static async readDay(input: {
    day?: string;
    now?: Date;
    account?: string;
    reader?: CalendarReader;
  } = {}): Promise<CalendarDayReading> {
    const window = CalendarDay_Util.resolveWindow(input.day, input.now ?? new Date());
    // ⭐ A Google az ALAPÉRTELMEZETT olvasó, ⛔ nem a KIZÁRÓLAGOS: a `reader` bemenet miatt egy
    // Microsoft- vagy `.ics`-olvasó ugyanezt a parancsot szolgálja ki, változatlan kimenettel.
    const reader: CalendarReader = input.reader ?? CalendarGoogleReader;
    const raw: CalendarEvent[] = await reader.readDay({
      from: window.from,
      to: window.to,
      account: input.account,
    });
    const events: CalendarEvent[] = CalendarDay_Util.sortForDay(raw);

    return {
      day: window.day,
      from: window.from,
      to: window.to,
      events: events,
      lines: events.map((event: CalendarEvent): string => CalendarDay_Util.describeEvent(event)),
      summary: CalendarDayService.summarize(window.day, events.length),
    };
  }

  /**
   * 🔴 A **KIMONDOTT** összegzés — az üres nap is mondatot kap.
   *
   * ⚠️ MIÉRT: *„az üres naptár és a nincs-jogosultság kívülről ugyanúgy néz ki."* A hiba-oldalt
   * a dobott `CalendarToolError` fedi; ⭐ **ez** a másik fele: ha a nap tényleg üres, azt **ki is
   * mondjuk** — *„a naptár olvasható volt"* —, hogy a csend ne tűnjön hibának.
   */
  private static summarize(day: string, count: number): string {
    if (!count) {
      return `${day}: a naptár OLVASHATÓ volt, és a napon NINCS esemény.`;
    }

    return `${day}: ${count} esemény.`;
  }
}
