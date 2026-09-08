// A helyi idő tesztjei.
//
// 🔴 MÉRT HIBA (owner, 2026-09-08 08:55): a státusz-kivonat `2026-09-08T01:02:38.765Z`-t írt,
// amikor az owner órája **03:02**-t mutatott. Két óra eltérés ⇒ téves következtetés arról,
// mikor történt valami.

import {
  DISPLAY_TIME_ZONE,
  formatDuration,
  localClock,
  localStamp,
  localTimeHeader,
} from './local-time.js';

// 2026-09-08 03:02:38 Budapesten = 01:02:38 UTC (nyári időszámítás, +02:00).
const summer: Date = new Date('2026-09-08T01:02:38.765Z');
// 2026-01-15 09:30:00 Budapesten = 08:30:00 UTC (téli időszámítás, +01:00).
const winter: Date = new Date('2026-01-15T08:30:00.000Z');

describe('localClock', () => {

  it('🔴 a MÉRT hibát javítja: 01:02 UTC-ből 03:02 helyi lesz', () => {
    expect(localClock(summer)).toBe('03:02:38');
  });

  it('⛔ NEM az UTC-időt adja vissza', () => {
    expect(localClock(summer)).not.toContain('01:02');
  });

  it('követi a nyári/téli váltást — nem fix eltolást használ', () => {
    // ⚠️ Egy `+2 óra` konstans télen egy órát tévedne. Ezért zóna, nem eltolás.
    expect(localClock(winter)).toBe('09:30:00');
  });

  it('másodpercet is ad — a kiesés hossza másodpercekben mérhető', () => {
    expect(localClock(summer).split(':').length).toBe(3);
  });

  it('24 órás alakot ad, nem AM/PM-et', () => {
    const evening: Date = new Date('2026-09-08T20:15:00+02:00');

    expect(localClock(evening)).toBe('20:15:00');
    expect(localClock(evening)).not.toContain('PM');
  });
});

describe('localStamp', () => {

  it('dátumot ÉS időt ad, helyi zóna szerint', () => {
    expect(localStamp(summer)).toBe('2026-09-08 03:02:38');
  });

  it('⚠️ a dátum is HELYI — éjfél körül az UTC más napot mutatna', () => {
    // 2026-09-08 00:30 Budapesten még 2026-09-07 22:30 UTC ⇒ az UTC-s kiírás
    // EGY NAPPAL korábbi dátumot adna.
    const justAfterMidnight: Date = new Date('2026-09-07T22:30:00.000Z');

    expect(localStamp(justAfterMidnight)).toContain('2026-09-08');
  });

  it('stabil alak — nincs vessző a dátum és az idő között', () => {
    // A `format()` kimenete futtatókörnyezettől függően vesszőzhet; ezt kizárjuk.
    expect(localStamp(summer)).not.toContain(',');
  });
});

describe('localTimeHeader', () => {

  it('kiírja a zónát is — enélkül nem lehet megkülönböztetni az UTC-s sortól', () => {
    // ⭐ Épp ez a mért hiba lényege: az owner nem tudta, hogy amit lát, az UTC.
    expect(localTimeHeader(summer)).toContain(DISPLAY_TIME_ZONE);
  });

  it('a helyi időt viseli', () => {
    expect(localTimeHeader(summer)).toContain('2026-09-08 03:02:38');
  });

  it('egyetlen sor', () => {
    expect(localTimeHeader(summer)).not.toContain('\n');
  });
});

describe('formatDuration', () => {

  it('percnél rövidebbet másodpercben', () => {
    expect(formatDuration(47_000)).toBe('47 mp');
  });

  it('órán belül percet ÉS másodpercet', () => {
    expect(formatDuration(125_000)).toBe('2p 5mp');
  });

  it('órán túl órát és percet', () => {
    expect(formatDuration(3 * 3_600_000 + 12 * 60_000)).toBe('3ó 12p');
  });

  it('⛔ a negatív időtartam sem ad értelmetlen kimenetet', () => {
    // Óracsúszásnál előfordulhat. A „-3 mp kiesés" félrevezetőbb, mint a nulla.
    expect(formatDuration(-5_000)).toBe('0 mp');
  });

  it('⛔ soha nem ad NaN-t', () => {
    expect(formatDuration(0)).toBe('0 mp');
    expect(formatDuration(999)).toBe('1 mp');
  });
});
