// 🗓️ A GOOGLE-NAPTÁR OLVASÓJA — ⭐ csak olvas, és a MEGLÉVŐ OAuth-ot használja.
//
// ## ⭐ MIÉRT NINCS MÁSODIK OAUTH-IMPLEMENTÁCIÓ
//
// A desktop-flow *(PKCE + loopback + token-fájl + refresh)* **már él élesben** a Gmailhez
// *(`email-google-oauth.service.ts`)*. ⇒ Ez a modul **ugyanazt a tokent** kéri el, és a
// scope-listát is **ott** bővítettük — ⛔ egy második implementáció azt jelentené, hogy két
// helyen kellene igazat mondani ugyanarról a fiókról *(`core-ssot-unified`)*.
//
// ## 🔴 A HIÁNYZÓ ENGEDÉLY NEM ÜRES LISTA
//
// > A feladat kikötése: *„hiányzó/lejárt engedélynél **kimondott** hiba, ⛔ nem üres lista — az
// > üres naptár és a nincs-jogosultság **kívülről ugyanúgy néz ki**."*
//
// ⚠️ És ez **nem elméleti**: a `calendar.readonly` scope-ot **ma** adtuk a listához, tehát a
// **már meglévő** token **nem tartalmazza**. Aki most futtatja, **biztosan** ebbe fut bele.
// ⇒ Ezért a hiba **megnevezi a hiányzó scope-ot és a megoldó parancsot**.

import { getEmailGoogleAccessToken, getEmailGoogleAuthStatus } from '../email/email-google-oauth.service.js';
import { CalendarToolError } from './calendar.error.js';
import type { CalendarEvent } from './calendar.models.js';

/** A naptár-olvasás scope-ja — ⚠️ ugyanaz, mint a `GMAIL_OAUTH_SCOPES`-ban. */
const CALENDAR_SCOPE: string = 'https://www.googleapis.com/auth/calendar.readonly';

/** Az elsődleges naptár azonosítója a Google API-ban. */
const PRIMARY_CALENDAR: string = 'primary';

/**
 * A modul **külső hatásai**, bemenetként cserélhetően. ⚠️ Szándékosan nem exportált.
 *
 * ⛔ Nincs benne alapértelmezés: a hiányzó mező helyére a **valódi** implementáció kerül, tehát
 * élesben **semmit nem kell** átadni — a teszt adja át, amit mérni akar.
 */
interface CalendarGoogleDeps {
  /** A fiók engedély-állapota *(él-e a token, mely scope-okkal)*. */
  authStatus?: (account: string) => Promise<{
    authenticated: boolean;
    clientConfigured: boolean;
    scopes: string[];
  }>;
  /** Az érvényes access-token *(automatikus refresh-sel)*. */
  accessToken?: (account: string) => Promise<string>;
  /**
   * A HTTP-hívás — ⭐ **SZŰK** alak, ⛔ nem a teljes `typeof fetch`.
   *
   * ⚠️ MIÉRT SZŰK: a `typeof fetch` egy **hatalmas** felület *(`Request`, `RequestInit`,
   * teljes `Response`)*, amit egy teszt csak **átcímkézéssel** *(`as unknown as`)* tudna
   * utánozni — az pedig **elhazudná** a típust. ⇒ Itt **pontosan annyi** szerepel, amennyit a
   * modul **használ**; a valódi `fetch` ezt szerkezetileg kielégíti.
   */
  fetchImpl?: (url: string, init: { headers: Record<string, string> }) => Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
    text: () => Promise<string>;
  }>;
}

/**
 * A Google-naptár olvasója — ⭐ **egy** publikus belépési pont: `readDay`.
 *
 * ⚠️ A külső hatások **bemenetként** cserélhetők *(`deps`)*, hogy a lekérés alakja
 * *(időablak, `singleEvents`, fejléc)* és a **hiba-ágak** **hálózat nélkül** tesztelhetők
 * legyenek — 🔴 és a hiba-ágak tesztje itt nem luxus: a *„nincs engedély"* eset a **mai**,
 * biztosan előálló állapot.
 */
export class CalendarGoogleReader {

  /** A scope, ami a naptár-olvasáshoz kell — a diagnosztikához és a teszthez. */
  static readonly SCOPE: string = CALENDAR_SCOPE;

  /**
   * A nap eseményei a Google-naptárból.
   *
   * @param input a nap határai *(ISO-8601, offszettel)*, a fiók, és a cserélhető külső
   *   hatások *(engedély-állapot, token, `fetch`)*.
   * @returns az események **forrás-független** alakban.
   *
   * ## 🔴 AMIT ELŐBB ELLENŐRZÜNK — és miért ELŐBB
   *
   * A scope-ellenőrzés a **hálózati hívás ELŐTT** fut. ⚠️ Enélkül a Google `403`-at adna, amit
   * a hívó *„valami elromlott"*-ként látna — pedig a teendő **pontosan tudható**: újra kell
   * engedélyezni. ⇒ A **konkrét** hibaüzenet többet ér, mint a hű továbbadott HTTP-kód.
   */
  static async readDay(input: {
    from: string;
    to: string;
    account?: string;
    deps?: CalendarGoogleDeps;
  }): Promise<CalendarEvent[]> {
    // 🔴 AZ ALAPERTELMEZETT FIOK NEVE `default` — ⛔ NEM `primary`.
    //
    // ⚠️ MERT HIBA (2026-09-11 12:45, elo proba): `primary`-t irtam, es a parancs
    // `MA-EMAIL-CONFIG-MISSING`-gel allt le, mert olyan fiok NEM LETEZIK. A konfiguracioban
    // `default` es `sandbox` van, es az e-mail-parancsok is `default`-ra allnak.
    // ⭐ A tevedes oka a NEVUTKOZES: a Google-oldalon a NAPTAR azonositoja `primary`
    // (l. `PRIMARY_CALENDAR`) — az egy MAS dolog, mint a mi fiok-nevunk.
    const account: string = input.account ?? 'default';
    // ⭐ A HÁROM KÜLSŐ HATÁS BEMENETKÉNT cserélhető — ⛔ nem modul-szintű spy-jal.
    // ⚠️ MIÉRT: ESM-ben a modul-névtér **fagyasztott**, tehát az import kicserélése nem
    // lehetséges; a `as`-szal átcímkézett hamis objektum pedig a típust hazudná el. ⇒ A
    // bemeneten átadott függvény az **egyetlen** út, ami tesztelhető ÉS típus-helyes.
    const readStatus = input.deps?.authStatus ?? getEmailGoogleAuthStatus;
    const readToken = input.deps?.accessToken ?? getEmailGoogleAccessToken;
    const status = await readStatus(account);

    // 🔴 NINCS TOKEN ⇒ kimondott hiba. ⛔ Egy üres lista itt azt jelentené: „ma nincs semmid".
    if (!status.authenticated) {
      throw new CalendarToolError({
        code: 'MA-CALENDAR-AUTH-REQUIRED',
        message: 'A Google-fiók nincs engedélyezve, ezért a naptár NEM olvasható '
          + '(⛔ ez nem azt jelenti, hogy üres a napod).',
        remedy: `Futtasd: ma email auth --account ${account}`,
        details: { account: account, clientConfigured: status.clientConfigured },
      });
    }

    // 🔴 VAN TOKEN, DE NINCS NAPTÁR-SCOPE — ez a MAI, biztos eset: a scope-ot ma adtuk a
    // listához, tehát a meglévő token csak a Gmail-jogokat hordozza.
    if (!status.scopes.includes(CALENDAR_SCOPE)) {
      throw new CalendarToolError({
        code: 'MA-CALENDAR-SCOPE-MISSING',
        message: 'A Google-token ÉL, de nincs benne naptár-olvasási engedély '
          + `(${CALENDAR_SCOPE}), ezért a naptár NEM olvasható `
          + '(⛔ ez nem azt jelenti, hogy üres a napod).',
        remedy: `Engedélyezd újra: ma email auth --account ${account}`,
        details: { account: account, grantedScopes: status.scopes, missingScope: CALENDAR_SCOPE },
      });
    }

    const accessToken: string = await readToken(account);
    const call = input.deps?.fetchImpl ?? fetch;
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${PRIMARY_CALENDAR}/events`,
    );

    url.searchParams.set('timeMin', input.from);
    url.searchParams.set('timeMax', input.to);
    // ⭐ `singleEvents` + `orderBy`: az ismétlődő eseményeket a Google **kibontja** egyedi
    // példányokra. ⛔ Így NEM kell ismétlődés-szabályt értelmeznünk — a feladat kikötése.
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '50');

    const response = await call(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const body: string = await response.text().catch((): string => '');

      // ⚠️ A 403 itt TIPIKUSAN a scope hiánya — de a fenti ellenőrzés után már nem az, ezért
      // a nyers választ is megmutatjuk (levágva): a diagnózis a hívónál dől el.
      throw new CalendarToolError({
        code: 'MA-CALENDAR-READ-FAILED',
        message: `A Google-naptár HTTP ${response.status}-tel válaszolt, ezért a nap NEM `
          + 'olvasható (⛔ ez nem azt jelenti, hogy üres a napod).',
        remedy: response.status === 401 || response.status === 403
          ? `Engedélyezd újra: ma email auth --account ${account}`
          : 'Próbáld újra később; ha marad, a válasz-részlet a hiba `details`-ében van.',
        details: { httpStatus: response.status, responseExcerpt: body.slice(0, 200) },
      });
    }

    const parsed: unknown = await response.json();

    return CalendarGoogleReader
      .itemsOf(parsed)
      .map((item: unknown): CalendarEvent => CalendarGoogleReader.toEvent(item));
  }

  /**
   * A válasz `items` listája — ⭐ szerkezeti olvasással, ⛔ átcímkézés nélkül.
   *
   * ⚠️ MIÉRT NEM `as`: a válasz **IDEGEN adat**. Egy `as`-szal ráírnánk egy alakot, amit a
   * futásidő **nem garantál** — és ha a Google mást ad, a hiba **egy `.map`-nél** csap le, nem
   * ott, ahol a feltevés készült. A hiányzó vagy nem-lista `items` itt **üres nap**, ⛔ nem
   * összeomlás *(a KIMONDOTT hiba-ágakat feljebb már elintéztük)*.
   */
  private static itemsOf(payload: unknown): unknown[] {
    if (!payload || typeof payload !== 'object') return [];

    for (const [key, value] of Object.entries(payload)) {
      if (key === 'items') return Array.isArray(value) ? value : [];
    }

    return [];
  }

  /**
   * A Google-esemény → a **forrás-független** alak.
   *
   * ⚠️ **IDEGEN ADAT**: minden mező hiányozhat, ezért mindenhol szerkezeti olvasás és
   * ⛔ `as` átcímkézés nélküli ellenőrzés.
   */
  private static toEvent(item: unknown): CalendarEvent {
    const startDate: string = CalendarGoogleReader.textAt(item, 'start', 'date');
    const isAllDay: boolean = startDate.length > 0;

    return {
      id: CalendarGoogleReader.text(item, 'id'),
      title: CalendarGoogleReader.text(item, 'summary'),
      // ⭐ EGÉSZ NAPOSNÁL a Google `date`-et ad (`2026-09-11`), időpontosnál `dateTime`-ot.
      // ⚠️ A kettő ÖSSZEKEVERÉSE adná a „00:00-tól 00:00-ig" hamis kiírást.
      startsAt: isAllDay ? startDate : CalendarGoogleReader.textAt(item, 'start', 'dateTime'),
      endsAt: isAllDay
        ? CalendarGoogleReader.textAt(item, 'end', 'date')
        : CalendarGoogleReader.textAt(item, 'end', 'dateTime'),
      isAllDay: isAllDay,
      // ⭐ A HÍVÁS-LINK IS „helyszín": ha nincs fizikai hely, a Meet-link az, ahova mennie kell.
      location: CalendarGoogleReader.text(item, 'location')
        || CalendarGoogleReader.text(item, 'hangoutLink'),
      attendees: CalendarGoogleReader.attendeesOf(item),
    };
  }

  /** Egy szöveges mező — szerkezeti olvasás, ⛔ átcímkézés nélkül. */
  private static text(item: unknown, field: string): string {
    if (!item || typeof item !== 'object') return '';

    for (const [key, value] of Object.entries(item)) {
      if (key === field) return typeof value === 'string' ? value : '';
    }

    return '';
  }

  /** Egy beágyazott szöveges mező *(pl. `start.dateTime`)*. */
  private static textAt(item: unknown, outer: string, inner: string): string {
    if (!item || typeof item !== 'object') return '';

    for (const [key, value] of Object.entries(item)) {
      if (key === outer) return CalendarGoogleReader.text(value, inner);
    }

    return '';
  }

  /**
   * A résztvevők megjelenítendő neve.
   *
   * ⚠️ A `displayName` gyakran **hiányzik** ⇒ az e-mail-cím a tartalék. ⛔ Egy név nélküli
   * résztvevő ne **tűnjön el** a listából: az owner számára a *„kivel"* a felkészülés lényege.
   */
  private static attendeesOf(item: unknown): string[] {
    if (!item || typeof item !== 'object') return [];

    for (const [key, value] of Object.entries(item)) {
      if (key !== 'attendees' || !Array.isArray(value)) continue;

      return value
        .map((who: unknown): string => CalendarGoogleReader.text(who, 'displayName')
          || CalendarGoogleReader.text(who, 'email'))
        .filter((who: string): boolean => who.length > 0);
    }

    return [];
  }
}
