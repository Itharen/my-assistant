// A nap-határ és a megjelenítés tesztjei.
//
// 🔴 MIT ŐRIZNEK — és MIÉRT PONT EZEKET:
//   (a) **a nap a HELYI nap** — ⛔ nem UTC-re normalizált. A projekt ezt **már megfizette**:
//       a státusz-kivonat UTC-ben írta az időt *(2026-09-08)*;
//   (b) **félig zárt ablak** — a 23:30-00:30 esemény ⛔ nem eshet ki és ⛔ nem duplázódhat;
//   (c) **a nap-paraméter nem csúszhat egy nappal** — a dátum-sztringet a JavaScript UTC-ként
//       olvasná, tehát +02:00-ban az ELŐZŐ nap 22:00 lenne belőle;
//   (d) **az egész napos nem lesz „00:00-00:00"** — az hamis kiírás lenne;
//   (e) **a cím nélküli esemény is LÁTSZIK** — egy üres sor hibának tűnne.

import { CalendarDay_Util } from './calendar-day.js';
import type { CalendarEvent } from './calendar.models.js';

/** Egy esemény a tesztekhez — csak a vizsgált mezők beszélnek. */
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

describe('| CalendarDay_Util.resolveWindow', () => {

  it('a megadott napot HELYI éjféltől a KÖVETKEZŐ nap éjfeléig veszi', () => {
    const window = CalendarDay_Util.resolveWindow('2026-09-11', new Date(2026, 0, 1, 12));

    expect(window.day).toBe('2026-09-11');
    expect(window.from.startsWith('2026-09-11T00:00:00')).toBe(true);
    // ⚠️ A záró határ a KÖVETKEZŐ nap 00:00 — enélkül a 23:30-as esemény kimaradna.
    expect(window.to.startsWith('2026-09-12T00:00:00')).toBe(true);
  });

  it('nap nélkül a „most" napját adja', () => {
    const window = CalendarDay_Util.resolveWindow(undefined, new Date(2026, 8, 11, 23, 45));

    expect(window.day).toBe('2026-09-11');
  });

  it('az ablak ISO-alakja OFFSZETTEL végződik, ⛔ nem Z-vel', () => {
    const window = CalendarDay_Util.resolveWindow('2026-09-11', new Date(2026, 8, 11, 12));

    expect(window.from.endsWith('Z')).toBe(false);
    expect(/[+-]\d{2}:\d{2}$/u.test(window.from)).toBe(true);
  });

  it('hónap-fordulón is a KÖVETKEZŐ nap lesz a záró határ', () => {
    const window = CalendarDay_Util.resolveWindow('2026-09-30', new Date(2026, 8, 11, 12));

    expect(window.to.startsWith('2026-10-01T00:00:00')).toBe(true);
  });

  it('év-fordulón is helyesen lép', () => {
    const window = CalendarDay_Util.resolveWindow('2026-12-31', new Date(2026, 8, 11, 12));

    expect(window.to.startsWith('2027-01-01T00:00:00')).toBe(true);
  });

  it('🔴 az ablak MINDIG a nap 00:00-ján kezdődik, akkor is, ha a „most" hajnal', () => {
    // ⚠️ Napszak-független viselkedés: az owner hajnali 3-kor is a TELJES napot kérdezi.
    const window = CalendarDay_Util.resolveWindow(undefined, new Date(2026, 8, 11, 3, 20));

    expect(window.from.startsWith('2026-09-11T00:00:00')).toBe(true);
  });
});

describe('| CalendarDay_Util.parseDay', () => {

  it('a dátum-sztringet HELYI napként olvassa — ⛔ nem csúszik egy nappal', () => {
    const parsed: Date = CalendarDay_Util.parseDay('2026-09-11', new Date(2026, 0, 1));

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(8);
    expect(parsed.getDate()).toBe(11);
  });

  it('🔴 a NEM LÉTEZŐ dátumot ELUTASÍTJA, ⛔ nem csúsztatja át a következő hónapra', () => {
    const fallback: Date = new Date(2026, 8, 11, 12);
    const parsed: Date = CalendarDay_Util.parseDay('2026-02-31', fallback);

    expect(parsed).toBe(fallback);
  });

  it('a hibás alakra a tartalékot adja', () => {
    const fallback: Date = new Date(2026, 8, 11, 12);

    expect(CalendarDay_Util.parseDay('holnap', fallback)).toBe(fallback);
    expect(CalendarDay_Util.parseDay('11/09/2026', fallback)).toBe(fallback);
    expect(CalendarDay_Util.parseDay('', fallback)).toBe(fallback);
  });

  it('a körülvevő szóközöket tűri', () => {
    const parsed: Date = CalendarDay_Util.parseDay('  2026-09-11  ', new Date(2026, 0, 1));

    expect(CalendarDay_Util.toDayKey(parsed)).toBe('2026-09-11');
  });
});

describe('| CalendarDay_Util.sortForDay', () => {

  it('az EGÉSZ NAPOSAK előre kerülnek — azok adják a nap keretét', () => {
    const sorted: CalendarEvent[] = CalendarDay_Util.sortForDay([
      makeEvent({ id: 'timed', startsAt: '2026-09-11T09:00:00+02:00' }),
      makeEvent({ id: 'allday', isAllDay: true, startsAt: '2026-09-11', endsAt: '2026-09-12' }),
    ]);

    expect(sorted.map((event: CalendarEvent): string => event.id)).toEqual(['allday', 'timed']);
  });

  it('az időpontosak KEZDÉS szerint jönnek', () => {
    const sorted: CalendarEvent[] = CalendarDay_Util.sortForDay([
      makeEvent({ id: 'c', startsAt: '2026-09-11T16:00:00+02:00' }),
      makeEvent({ id: 'a', startsAt: '2026-09-11T08:00:00+02:00' }),
      makeEvent({ id: 'b', startsAt: '2026-09-11T11:00:00+02:00' }),
    ]);

    expect(sorted.map((event: CalendarEvent): string => event.id)).toEqual(['a', 'b', 'c']);
  });

  it('⛔ a BEMENETET nem módosítja', () => {
    const input: CalendarEvent[] = [
      makeEvent({ id: 'b', startsAt: '2026-09-11T16:00:00+02:00' }),
      makeEvent({ id: 'a', startsAt: '2026-09-11T08:00:00+02:00' }),
    ];

    CalendarDay_Util.sortForDay(input);

    expect(input.map((event: CalendarEvent): string => event.id)).toEqual(['b', 'a']);
  });
});

describe('| CalendarDay_Util.describeEvent', () => {

  it('időpontos eseménynél óó:pp-óó:pp alakot ad', () => {
    const line: string = CalendarDay_Util.describeEvent(makeEvent({
      title: 'Míting',
      startsAt: '2026-09-11T11:00:00+02:00',
      endsAt: '2026-09-11T11:30:00+02:00',
    }));

    expect(line).toContain('11:00-11:30');
    expect(line).toContain('Míting');
  });

  it('🔴 az EGÉSZ NAPOS „egész nap", ⛔ NEM „00:00-00:00"', () => {
    const line: string = CalendarDay_Util.describeEvent(makeEvent({
      isAllDay: true,
      startsAt: '2026-09-11',
      endsAt: '2026-09-12',
      title: 'Szabadság',
    }));

    expect(line).toContain('egész nap');
    expect(line).not.toContain('00:00');
  });

  it('a cím nélküli esemény is LÁTSZIK', () => {
    const line: string = CalendarDay_Util.describeEvent(makeEvent({ title: '   ' }));

    expect(line).toContain('(cím nélkül)');
  });

  it('a helyszínt és a résztvevő-számot is mutatja, ha van', () => {
    const line: string = CalendarDay_Util.describeEvent(makeEvent({
      location: 'https://meet.google.com/abc',
      attendees: ['Anna', 'Béla'],
    }));

    expect(line).toContain('https://meet.google.com/abc');
    expect(line).toContain('2 résztvevő');
  });

  it('helyszín és résztvevő nélkül nem hagy lógó elválasztót', () => {
    const line: string = CalendarDay_Util.describeEvent(makeEvent({
      location: '  ',
      attendees: [],
    }));

    expect(line.includes('·')).toBe(false);
  });
});

describe('| CalendarDay_Util.clockOf', () => {

  it('az órát a SZTRINGBŐL olvassa — ⛔ nem a gép időzónáján át', () => {
    // ⚠️ Idegen offszet: ha Date-en át konvertálnánk, a kiírt óra elcsúszna.
    expect(CalendarDay_Util.clockOf('2026-09-11T11:00:00+09:00')).toBe('11:00');
  });

  it('értelmezhetetlen bemenetnél ??:??-t ad, ⛔ nem dob és ⛔ nem hazudik órát', () => {
    expect(CalendarDay_Util.clockOf('2026-09-11')).toBe('??:??');
    expect(CalendarDay_Util.clockOf('')).toBe('??:??');
  });
});
