// A „mi van ma?" szolgáltatás tesztjei.
//
// 🔴 A KÉT ÁLLÍTÁS, amiért ez a fájl létezik:
//   (a) **a hiba ÁTMEGY** — ⛔ a szolgáltatás SOHA nem fordít hibát üres napra. Ez a feladat
//       kikötése: *„az üres naptár és a nincs-jogosultság kívülről ugyanúgy néz ki."*
//   (b) **az olvasó CSERÉLHETŐ** — a nyitott owner-kérdés *(Google vagy Microsoft)* nem
//       blokkolja a munkát, mert a parancs felülete és a kimenet alakja azonos.
//
// ⭐ A tesztek olvasója egy **egyszerű objektum** — ez maga a bizonyíték, hogy a Google nem
// kötelező: ha egy hétsoros utánzat kiszolgálja a parancsot, egy `.ics`-olvasó is fogja.

import { CalendarDayService } from './calendar-day.service.js';
import { CalendarToolError } from './calendar.error.js';
import type { CalendarReader } from './calendar-reader.contract.js';
import type { CalendarEvent } from './calendar.models.js';

/** Egy esemény a tesztekhez. */
function makeEvent(partial: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: partial.id ?? 'x',
    title: partial.title ?? 'Cím',
    startsAt: partial.startsAt ?? '2026-09-11T09:00:00+02:00',
    endsAt: partial.endsAt ?? '2026-09-11T10:00:00+02:00',
    isAllDay: partial.isAllDay ?? false,
    location: partial.location ?? '',
    attendees: partial.attendees ?? [],
  };
}

/** Egy naptár-forrás utánzat, ami RÖGZÍTI, milyen ablakot kértek tőle. */
function makeReader(events: CalendarEvent[]): CalendarReader & {
  windows: { from: string; to: string; account?: string }[];
} {
  const windows: { from: string; to: string; account?: string }[] = [];

  return {
    windows: windows,
    readDay: async (input: { from: string; to: string; account?: string }): Promise<CalendarEvent[]> => {
      windows.push(input);

      return events;
    },
  };
}

/**
 * A dobott hiba naptár-hibaként — ⭐ `instanceof`-fal, ⛔ átcímkézés nélkül.
 *
 * ⚠️ Ha nem naptár-hiba jött, **itt bukik el** a teszt, és a kapott érték is látszik.
 */
function calendarErrorOf(err: unknown): CalendarToolError {
  if (err instanceof CalendarToolError) return err;

  throw new Error(`Nem CalendarToolError jött, hanem: ${String(err)}`);
}

describe('| CalendarDayService.readDay — a hiba SOHA nem lesz üres nap', () => {

  it('🔴 ha az olvasó DOB, a szolgáltatás is DOB — ⛔ nem ad vissza üres napot', async () => {
    const failing: CalendarReader = {
      readDay: async (): Promise<CalendarEvent[]> => {
        throw new CalendarToolError({
          code: 'MA-CALENDAR-SCOPE-MISSING',
          message: 'Nincs naptár-engedély.',
          remedy: 'Engedélyezd újra: ma email auth --account primary',
        });
      },
    };
    let caught: unknown = null;

    try {
      await CalendarDayService.readDay({ day: '2026-09-11', reader: failing });
    } catch (err: unknown) {
      caught = err;
    }

    expect(calendarErrorOf(caught).code).toBe('MA-CALENDAR-SCOPE-MISSING');
  });

  it('🔴 az ÜRES nap KIMONDOTT mondatot kap — ⛔ nem csak egy nullát', async () => {
    const reading = await CalendarDayService.readDay({
      day: '2026-09-11',
      reader: makeReader([]),
    });

    expect(reading.events).toEqual([]);
    // ⭐ Ez a mondat választja el az „üres naptárat" a „nincs jogosultságtól".
    expect(reading.summary).toContain('OLVASHATÓ');
    expect(reading.summary).toContain('NINCS esemény');
  });

  it('a nem-üres nap az esemény-számot mondja', async () => {
    const reading = await CalendarDayService.readDay({
      day: '2026-09-11',
      reader: makeReader([makeEvent({ id: 'a' }), makeEvent({ id: 'b' })]),
    });

    expect(reading.summary).toBe('2026-09-11: 2 esemény.');
  });
});

describe('| CalendarDayService.readDay — az ablak és a sorrend', () => {

  it('a HELYI nap félig zárt ablakát adja át az olvasónak', async () => {
    const reader = makeReader([]);

    await CalendarDayService.readDay({ day: '2026-09-11', reader: reader });

    expect(reader.windows.length).toBe(1);
    expect(reader.windows[0]?.from.startsWith('2026-09-11T00:00:00')).toBe(true);
    expect(reader.windows[0]?.to.startsWith('2026-09-12T00:00:00')).toBe(true);
  });

  it('a fiókot változatlanul továbbadja', async () => {
    const reader = makeReader([]);

    await CalendarDayService.readDay({ day: '2026-09-11', account: 'munka', reader: reader });

    expect(reader.windows[0]?.account).toBe('munka');
  });

  it('nap nélkül a „most" napját olvassa', async () => {
    const reader = makeReader([]);
    const reading = await CalendarDayService.readDay({
      now: new Date(2026, 8, 11, 23, 50),
      reader: reader,
    });

    expect(reading.day).toBe('2026-09-11');
  });

  it('érvénytelen nap-paraméternél a „most" napjára esik vissza — ⛔ nem dob', async () => {
    const reading = await CalendarDayService.readDay({
      day: '2026-02-31',
      now: new Date(2026, 8, 11, 12),
      reader: makeReader([]),
    });

    expect(reading.day).toBe('2026-09-11');
  });

  it('az eseményeket időrendbe rakja, az egész naposakat előre', async () => {
    const reading = await CalendarDayService.readDay({
      day: '2026-09-11',
      reader: makeReader([
        makeEvent({ id: 'late', startsAt: '2026-09-11T16:00:00+02:00' }),
        makeEvent({ id: 'early', startsAt: '2026-09-11T08:00:00+02:00' }),
        makeEvent({ id: 'allday', isAllDay: true, startsAt: '2026-09-11', endsAt: '2026-09-12' }),
      ]),
    });

    expect(reading.events.map((event: CalendarEvent): string => event.id))
      .toEqual(['allday', 'early', 'late']);
  });

  it('minden eseményhez PONTOSAN egy olvasható sor tartozik', async () => {
    const reading = await CalendarDayService.readDay({
      day: '2026-09-11',
      reader: makeReader([
        makeEvent({ title: 'Míting', startsAt: '2026-09-11T11:00:00+02:00', endsAt: '2026-09-11T11:30:00+02:00' }),
        makeEvent({ title: 'Ebéd', startsAt: '2026-09-11T12:00:00+02:00', endsAt: '2026-09-11T12:30:00+02:00' }),
      ]),
    });

    expect(reading.lines.length).toBe(2);
    expect(reading.lines[0]).toContain('11:00-11:30');
    expect(reading.lines[0]).toContain('Míting');
    expect(reading.lines[1]).toContain('Ebéd');
  });
});
