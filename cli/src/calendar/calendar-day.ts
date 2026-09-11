// 🗓️ A NAP HATÁRAI ÉS A MEGJELENÍTÉS — **tiszta döntések**, hálózat nélkül.
//
// ⭐ MIÉRT KÜLÖN MODUL: a *„mi van ma"* kérdés két dologra bomlik — **melyik nap** *(határok)* és
// **hogyan látszik** *(sorrend, formázás)*. Egyik sem igényel hálózatot, tehát **teljesen
// tesztelhető**, és a Google-olvasó cserélhető marad alatta.

import type { CalendarEvent } from './calendar.models.js';

/** A nap kezdete és vége, ISO-8601 offszettel. ⚠️ Szándékosan nem exportált. */
interface DayWindow {
  /** A nap `00:00:00` helyi időben, ISO-8601 offszettel. */
  from: string;
  /** A **következő** nap `00:00:00` helyi időben — ⚠️ félig zárt intervallum. */
  to: string;
  /** A nap `YYYY-MM-DD` alakban — a kiírásokhoz. */
  day: string;
}

/** A nap-határ és a megjelenítés döntései. */
export class CalendarDay_Util {

  /**
   * A nap határai — **helyi időben**.
   *
   * @param day `YYYY-MM-DD`, vagy `undefined` a mai napra.
   * @param now a „most" — cserélhető a teszthez.
   * @returns félig zárt intervallum: `[from, to)`.
   *
   * ⭐ **Tiszta függvény.**
   *
   * ## ⚠️ MIÉRT FÉLIG ZÁRT, ÉS MIÉRT HELYI IDŐ
   *
   * **Félig zárt** *(`to` = a KÖVETKEZŐ nap 00:00)*: egy `23:30-00:30` esemény különben
   * **kimaradna** vagy **duplán** jelenne meg. A naptár-API-k is így kérnek időintervallumot.
   *
   * **Helyi idő:** az owner a **saját napjában** él. Egy UTC-re normalizált nap-határ nyáron
   * **két órával csúszik** ⇒ a 23:00-as esemény a *„holnapra"* esne. 🔴 Ezt a projekt **már
   * megfizette**: a státusz-kivonat UTC-ben írta az időt *(2026-09-08)*.
   */
  static resolveWindow(day: string | undefined, now: Date = new Date()): DayWindow {
    const base: Date = day ? CalendarDay_Util.parseDay(day, now) : now;
    const start: Date = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
    const next: Date = new Date(start.getTime());

    // ⚠️ `setDate(+1)` ÉS NEM `+86 400 000 ms`: a nyári időszámítás váltásakor a nap **23 vagy
    // 25 órás**. A dátum-alapú léptetés ezt helyesen kezeli, a milliszekundum-összeadás nem.
    next.setDate(next.getDate() + 1);

    return {
      from: CalendarDay_Util.toIsoWithOffset(start),
      to: CalendarDay_Util.toIsoWithOffset(next),
      day: CalendarDay_Util.toDayKey(start),
    };
  }

  /**
   * Egy `YYYY-MM-DD` értelmezése **helyi** napként.
   *
   * ⛔ **NEM `new Date('2026-09-11')`**: azt a JavaScript **UTC**-ként értelmezi, tehát
   * `+02:00`-ban az **előző nap 22:00** lesz belőle. ⚠️ Ez a klasszikus egy-nappal-csúszás.
   *
   * @returns a nap déli 12 órája helyi időben *(a nap **közepe**, hogy semmilyen
   *   időzóna-eltolás ne vigye át másik napra)*; hibás bemenetnél a `fallback`.
   */
  static parseDay(day: string, fallback: Date): Date {
    const match: RegExpMatchArray | null = day.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/u);

    if (!match) return fallback;

    const year: number = Number(match[1]);
    const month: number = Number(match[2]);
    const date: number = Number(match[3]);

    // ⚠️ Az érvénytelen dátum *(pl. `2026-02-31`)* a `Date`-ben **átcsúszik** a következő
    // hónapra. ⛔ Nem hagyjuk: a visszaellenőrzés kiszűri.
    const candidate: Date = new Date(year, month - 1, date, 12, 0, 0, 0);

    if (candidate.getFullYear() !== year
      || candidate.getMonth() !== month - 1
      || candidate.getDate() !== date) {
      return fallback;
    }

    return candidate;
  }

  /** A `YYYY-MM-DD` kulcs egy dátumból, **helyi** idő szerint. */
  static toDayKey(date: Date): string {
    const year: string = String(date.getFullYear()).padStart(4, '0');
    const month: string = String(date.getMonth() + 1).padStart(2, '0');
    const day: string = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * ISO-8601 a **helyi offszettel** — ⛔ nem `Z`.
   *
   * ⚠️ A `toISOString()` **mindig UTC-t** ad. A naptár-API-knak a helyi offszet kell, és a
   * naplóban is a helyi idő olvasható. *(Ugyanaz a döntés, mint a `local-time` segédnél.)*
   */
  static toIsoWithOffset(date: Date): string {
    const offsetMinutes: number = -date.getTimezoneOffset();
    const sign: string = offsetMinutes >= 0 ? '+' : '-';
    const absolute: number = Math.abs(offsetMinutes);
    const pad = (value: number): string => String(value).padStart(2, '0');

    return `${CalendarDay_Util.toDayKey(date)}`
      + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
      + `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
  }

  /**
   * A nap eseményei **időrendben**.
   *
   * ⭐ Tiszta függvény. ⚠️ Az **egész naposak előre** kerülnek: azok a nap **keretét** adják, és
   * az owner először azt akarja látni *(szabadság, utazás)*, nem a 14:00-as hívás után.
   */
  static sortForDay(events: readonly CalendarEvent[]): CalendarEvent[] {
    return [...events].sort((left: CalendarEvent, right: CalendarEvent): number => {
      if (left.isAllDay !== right.isAllDay) return left.isAllDay ? -1 : 1;

      return left.startsAt.localeCompare(right.startsAt);
    });
  }

  /**
   * Egy esemény egysoros, **ránézésre olvasható** alakja.
   *
   * ⚠️ A **cím nélküli** esemény is látszik *(„(cím nélkül)")* — ⛔ egy üres sor azt sugallná,
   * hogy hiba van, pedig a naptárban tényleg van cím nélküli bejegyzés.
   */
  static describeEvent(event: CalendarEvent): string {
    const when: string = event.isAllDay
      ? 'egész nap'
      : `${CalendarDay_Util.clockOf(event.startsAt)}-${CalendarDay_Util.clockOf(event.endsAt)}`;
    const title: string = event.title.trim() || '(cím nélkül)';
    const where: string = event.location.trim() ? ` · ${event.location.trim()}` : '';
    const who: string = event.attendees.length
      ? ` · ${event.attendees.length} résztvevő`
      : '';

    return `${when}  ${title}${where}${who}`;
  }

  /**
   * Az `óó:pp` egy ISO-időbélyegből — ⭐ **a sztringből**, ⛔ nem `Date`-en át.
   *
   * ⚠️ MIÉRT: a `new Date(iso)` a **futó gép** időzónájába konvertál. Ha az esemény offszete
   * más *(pl. egy másik országban lévő szervező naptára)*, az átalakítás **elcsúsztatná** a
   * kiírt időt. Az ISO-alak **maga hordozza** a helyes helyi órát.
   */
  static clockOf(iso: string): string {
    const match: RegExpMatchArray | null = iso.match(/T(\d{2}):(\d{2})/u);

    return match ? `${match[1]}:${match[2]}` : '??:??';
  }
}
