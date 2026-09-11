// A Google-naptár olvasójának tesztjei.
//
// 🔴 A LEGFONTOSABB ÁLLÍTÁS, amiért ez a fájl létezik:
//
// > **A feladat kikötése (owner, 2026-09-11 12:19):** *„Hiányzó/lejárt engedélynél KIMONDOTT
// > hiba, ne üres lista — az üres naptár és a nincs-jogosultság kívülről ugyanúgy néz ki."*
//
// ⚠️ És ez **nem elméleti eset**: a `calendar.readonly` scope-ot **ma** vettük fel, tehát a
// **már meglévő** token **nem hordozza**. Aki ma futtatja, **biztosan** ebbe fut bele. ⇒ Az a
// teszt, ami ezt őrzi, a **legelső** — nem a happy path.
//
// ⭐ MIÉRT NINCS HÁLÓZAT A TESZTBEN: a külső hatások *(engedély-állapot, token, HTTP-hívás)*
// bemenetként cserélhetők. ⛔ Modul-szintű spy nem járható út: ESM-ben a névtér fagyasztott.
//
// ⭐ ÉS MIÉRT NINCS EGYETLEN ÁTCÍMKÉZÉS SEM *(`as`)*: a modul HTTP-típusa szándékosan **szűk**,
// ezért egy sima objektum-literál kielégíti; a dobott hibát pedig `instanceof` szűkíti.

import { CalendarGoogleReader } from './calendar-google.reader.js';
import { CalendarToolError } from './calendar.error.js';
import type { CalendarEvent } from './calendar.models.js';

/** Egy HTTP-válasz utánzata — pontosan az a felület, amit a modul használ. */
interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

/** A HTTP-hívás utánzata. */
type FakeCall = (url: string, options: { headers: Record<string, string> }) => Promise<FakeResponse>;

/** Az engedély-állapot utánzata. */
function makeStatus(input: { authenticated: boolean; scopes: string[] }): () => Promise<{
  authenticated: boolean;
  clientConfigured: boolean;
  scopes: string[];
}> {
  return async (): Promise<{ authenticated: boolean; clientConfigured: boolean; scopes: string[] }> => ({
    authenticated: input.authenticated,
    clientConfigured: true,
    scopes: input.scopes,
  });
}

/** Egy HTTP-utánzat, ami RÖGZÍTI a hívott URL-t és a fejlécet. */
function makeFetch(body: unknown, init?: { status?: number; text?: string }): {
  call: FakeCall;
  urls: string[];
  headers: Record<string, string>[];
} {
  const urls: string[] = [];
  const headers: Record<string, string>[] = [];
  const status: number = init?.status ?? 200;

  return {
    urls: urls,
    headers: headers,
    call: async (url: string, options: { headers: Record<string, string> }): Promise<FakeResponse> => {
      urls.push(url);
      headers.push(options.headers);

      return {
        ok: status >= 200 && status < 300,
        status: status,
        json: async (): Promise<unknown> => body,
        text: async (): Promise<string> => init?.text ?? '',
      };
    },
  };
}

/**
 * A dobott hiba naptár-hibaként — ⭐ `instanceof`-fal, ⛔ átcímkézés nélkül.
 *
 * ⚠️ Ha nem naptár-hiba jött, **itt bukik el** a teszt, és a kapott érték is látszik — ⛔ nem
 * egy `undefined.code`-os érthetetlen összeomlás lesz belőle.
 */
function calendarErrorOf(err: unknown): CalendarToolError {
  if (err instanceof CalendarToolError) return err;

  throw new Error(`Nem CalendarToolError jött, hanem: ${String(err)}`);
}

/** A hívás során dobott hiba — vagy `null`, ha nem dobott. */
async function catchError(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (err: unknown) {
    return err;
  }

  return null;
}

/** Az engedélyezett, naptár-scope-os állapot — a happy path előfeltétele. */
const GRANTED = makeStatus({
  authenticated: true,
  scopes: ['https://www.googleapis.com/auth/gmail.readonly', CalendarGoogleReader.SCOPE],
});

/** Egy token-olvasó utánzat. */
const TOKEN = async (): Promise<string> => 'access-token-value';

/** A vizsgált nap ablaka. */
const WINDOW = { from: '2026-09-11T00:00:00+02:00', to: '2026-09-12T00:00:00+02:00' };

describe('| CalendarGoogleReader — a KIMONDOTT hiba (⛔ nem üres lista)', () => {

  it('🔴 engedély nélkül DOB, és a hiba megnevezi a megoldó parancsot', async () => {
    const caught: unknown = await catchError(() => CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      deps: { authStatus: makeStatus({ authenticated: false, scopes: [] }), accessToken: TOKEN },
    }));
    const error: CalendarToolError = calendarErrorOf(caught);

    expect(error.code).toBe('MA-CALENDAR-AUTH-REQUIRED');
    // ⭐ A TEENDŐ a `message`-ben IS ott van: a hívók többsége csak azt írja ki.
    expect(error.message).toContain('ma email auth');
    expect(error.remedy).toContain('ma email auth');
  });

  it('🔴 ÉLŐ token + HIÁNYZÓ naptár-scope esetén DOB — ez a MAI, biztos eset', async () => {
    const caught: unknown = await catchError(() => CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      deps: {
        // ⚠️ Pontosan a mai állapot: a Gmail-jogok megvannak, a naptár nem.
        authStatus: makeStatus({
          authenticated: true,
          scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
        }),
        accessToken: TOKEN,
      },
    }));
    const error: CalendarToolError = calendarErrorOf(caught);

    expect(error.code).toBe('MA-CALENDAR-SCOPE-MISSING');
    expect(error.message).toContain(CalendarGoogleReader.SCOPE);
  });

  it('a scope-ellenőrzés a HÁLÓZATI HÍVÁS ELŐTT fut — ⛔ nem a 403-ból következtetünk', async () => {
    const fetchMock = makeFetch({ items: [] });

    await catchError(() => CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      deps: {
        authStatus: makeStatus({ authenticated: true, scopes: [] }),
        accessToken: TOKEN,
        fetchImpl: fetchMock.call,
      },
    }));

    expect(fetchMock.urls.length).toBe(0);
  });

  it('HTTP-hibánál DOB, a státusszal és a válasz-részlettel', async () => {
    const fetchMock = makeFetch({}, { status: 500, text: 'backend error' });
    const caught: unknown = await catchError(() => CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      deps: { authStatus: GRANTED, accessToken: TOKEN, fetchImpl: fetchMock.call },
    }));
    const error: CalendarToolError = calendarErrorOf(caught);

    expect(error.code).toBe('MA-CALENDAR-READ-FAILED');
    expect(error.details?.httpStatus).toBe(500);
    expect(String(error.details?.responseExcerpt)).toContain('backend error');
  });

  it('401-nél az újra-engedélyezést javasolja, 500-nál ⛔ nem azt', async () => {
    const remedyOf = async (status: number): Promise<string> => {
      const fetchMock = makeFetch({}, { status: status });
      const caught: unknown = await catchError(() => CalendarGoogleReader.readDay({
        from: WINDOW.from,
        to: WINDOW.to,
        deps: { authStatus: GRANTED, accessToken: TOKEN, fetchImpl: fetchMock.call },
      }));

      return calendarErrorOf(caught).remedy;
    };

    expect(await remedyOf(401)).toContain('ma email auth');
    expect(await remedyOf(403)).toContain('ma email auth');
    expect(await remedyOf(500)).not.toContain('ma email auth');
  });
});

describe('| CalendarGoogleReader — a lekérés alakja', () => {

  it('az időablakot és a kibontott ismétlődést kéri', async () => {
    const fetchMock = makeFetch({ items: [] });

    await CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      deps: { authStatus: GRANTED, accessToken: TOKEN, fetchImpl: fetchMock.call },
    });

    const url: string = fetchMock.urls[0] ?? '';

    expect(url).toContain('timeMin=2026-09-11T00%3A00%3A00%2B02%3A00');
    expect(url).toContain('timeMax=2026-09-12T00%3A00%3A00%2B02%3A00');
    // ⭐ Az ismétlődést a Google bontja ki — ⛔ nekünk nem kell szabályt értelmeznünk.
    expect(url).toContain('singleEvents=true');
    expect(url).toContain('orderBy=startTime');
  });

  it('🔴 az ALAPÉRTELMEZETT fiók neve `default` — ⛔ NEM `primary`', async () => {
    // ⚠️ MÉRT HIBA (2026-09-11 12:45, élő proba): `primary`-vel a parancs
    // `MA-EMAIL-CONFIG-MISSING`-gel állt le, mert olyan fiók NEM LÉTEZIK. ⭐ A tévedés oka a
    // névütközés: a Google-oldalon a NAPTÁR azonosítója `primary` — az más dolog.
    let seenAccount: string = '';
    const watchAccount = async (account: string): Promise<{
      authenticated: boolean;
      clientConfigured: boolean;
      scopes: string[];
    }> => {
      seenAccount = account;

      return { authenticated: false, clientConfigured: true, scopes: [] };
    };

    await catchError(() => CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      deps: { authStatus: watchAccount, accessToken: TOKEN },
    }));

    expect(seenAccount).toBe('default');
  });

  it('a megadott fiókot használja, ha kapott', async () => {
    let seenAccount: string = '';
    const watchAccount = async (account: string): Promise<{
      authenticated: boolean;
      clientConfigured: boolean;
      scopes: string[];
    }> => {
      seenAccount = account;

      return { authenticated: false, clientConfigured: true, scopes: [] };
    };

    await catchError(() => CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      account: 'munka',
      deps: { authStatus: watchAccount, accessToken: TOKEN },
    }));

    expect(seenAccount).toBe('munka');
  });

  it('a tokent Bearer-fejlécben viszi', async () => {
    const fetchMock = makeFetch({ items: [] });

    await CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      deps: { authStatus: GRANTED, accessToken: TOKEN, fetchImpl: fetchMock.call },
    });

    expect(fetchMock.headers[0]?.Authorization).toBe('Bearer access-token-value');
  });

  it('üres naptárnál ÜRES listát ad — ⚠️ de csak SIKERES olvasás után', async () => {
    const fetchMock = makeFetch({ items: [] });
    const events: CalendarEvent[] = await CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      deps: { authStatus: GRANTED, accessToken: TOKEN, fetchImpl: fetchMock.call },
    });

    expect(events).toEqual([]);
  });

  it('hiányzó esemény-lista esetén sem dob — üres nap, ⛔ nem összeomlás', async () => {
    const fetchMock = makeFetch({});
    const events: CalendarEvent[] = await CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      deps: { authStatus: GRANTED, accessToken: TOKEN, fetchImpl: fetchMock.call },
    });

    expect(events).toEqual([]);
  });

  it('nem-lista esemény-mezőnél sem dob', async () => {
    const fetchMock = makeFetch({ items: 'nem lista' });
    const events: CalendarEvent[] = await CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      deps: { authStatus: GRANTED, accessToken: TOKEN, fetchImpl: fetchMock.call },
    });

    expect(events).toEqual([]);
  });
});

describe('| CalendarGoogleReader — a forrás-független alakra fordítás', () => {

  /** Egy esemény kiolvasása a hamis válaszból. */
  async function readOne(item: unknown): Promise<CalendarEvent> {
    const fetchMock = makeFetch({ items: [item] });
    const events: CalendarEvent[] = await CalendarGoogleReader.readDay({
      from: WINDOW.from,
      to: WINDOW.to,
      deps: { authStatus: GRANTED, accessToken: TOKEN, fetchImpl: fetchMock.call },
    });
    const event: CalendarEvent | undefined = events[0];

    // ⛔ Nem átcímkézés: ha nem jött esemény, a teszt ITT bukik, érthető okkal.
    if (!event) throw new Error('A válaszból nem jött esemény.');

    return event;
  }

  it('időpontos eseményt a kezdéssel, véggel, címmel ad vissza', async () => {
    const event: CalendarEvent = await readOne({
      id: 'evt-1',
      summary: 'Míting',
      start: { dateTime: '2026-09-11T11:00:00+02:00' },
      end: { dateTime: '2026-09-11T11:30:00+02:00' },
    });

    expect(event.id).toBe('evt-1');
    expect(event.title).toBe('Míting');
    expect(event.startsAt).toBe('2026-09-11T11:00:00+02:00');
    expect(event.endsAt).toBe('2026-09-11T11:30:00+02:00');
    expect(event.isAllDay).toBe(false);
  });

  it('🔴 az EGÉSZ NAPOS eseményt annak jelöli — a dátum-mezőből', async () => {
    const event: CalendarEvent = await readOne({
      id: 'evt-2',
      summary: 'Szabadság',
      start: { date: '2026-09-11' },
      end: { date: '2026-09-12' },
    });

    expect(event.isAllDay).toBe(true);
    expect(event.startsAt).toBe('2026-09-11');
    expect(event.endsAt).toBe('2026-09-12');
  });

  it('a hívás-linket helyszínként adja, ha fizikai hely nincs', async () => {
    const event: CalendarEvent = await readOne({
      id: 'evt-3',
      hangoutLink: 'https://meet.google.com/abc-defg-hij',
      start: { dateTime: '2026-09-11T11:00:00+02:00' },
      end: { dateTime: '2026-09-11T11:30:00+02:00' },
    });

    expect(event.location).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('a fizikai helyszín ELŐZI a hívás-linket', async () => {
    const event: CalendarEvent = await readOne({
      id: 'evt-4',
      location: 'Budapest, Bajcsy 1.',
      hangoutLink: 'https://meet.google.com/abc',
      start: { dateTime: '2026-09-11T11:00:00+02:00' },
      end: { dateTime: '2026-09-11T11:30:00+02:00' },
    });

    expect(event.location).toBe('Budapest, Bajcsy 1.');
  });

  it('a résztvevőknél a név, annak híján az e-mail-cím jelenik meg', async () => {
    const event: CalendarEvent = await readOne({
      id: 'evt-5',
      start: { dateTime: '2026-09-11T11:00:00+02:00' },
      end: { dateTime: '2026-09-11T11:30:00+02:00' },
      attendees: [
        { displayName: 'Anna', email: 'anna@example.com' },
        { email: 'bela@example.com' },
        { organizer: true },
      ],
    });

    // ⛔ A név nélküli résztvevő NEM tűnik el: a „kivel" a felkészülés lényege.
    expect(event.attendees).toEqual(['Anna', 'bela@example.com']);
  });

  it('teljesen üres eseményen sem dob — minden mező üres marad', async () => {
    const event: CalendarEvent = await readOne({});

    expect(event.id).toBe('');
    expect(event.title).toBe('');
    expect(event.startsAt).toBe('');
    expect(event.attendees).toEqual([]);
  });

  it('a nem-objektum elemen sem dob — ⚠️ IDEGEN adat, bármi jöhet', async () => {
    const event: CalendarEvent = await readOne('ez nem esemény');

    expect(event.title).toBe('');
    expect(event.isAllDay).toBe(false);
  });

  it('a nem-szöveges mezőt üresnek veszi, ⛔ nem írja ki számként', async () => {
    const event: CalendarEvent = await readOne({
      id: 42,
      summary: { text: 'objektum' },
      start: { dateTime: '2026-09-11T11:00:00+02:00' },
      end: { dateTime: '2026-09-11T11:30:00+02:00' },
    });

    expect(event.id).toBe('');
    expect(event.title).toBe('');
  });
});
