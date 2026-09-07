import {
  decideHomeState,
  parseOwnTracksLocation,
  pruneExpired,
  toStoredLocation,
} from './location.retention.js';
import { DEFAULT_LOCATION_CONFIG, type StoredLocation } from './location.models.js';

function payload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    _type: 'location',
    lat: 47.4779,
    lon: 19.0402,
    tst: 1788770000,
    acc: 12,
    batt: 74,
    ...overrides,
  };
}

describe('parseOwnTracksLocation', () => {

  it('elfogadja a szabalyos helyzet-uzenetet', () => {
    const parsed = parseOwnTracksLocation(payload());

    expect(parsed?.lat).toBe(47.4779);
    expect(parsed?.batt).toBe(74);
  });

  it('a NEM helyzet-tipusu uzenetet csendben elengedi', () => {
    // Az OwnTracks kuld `transition`, `waypoint`, `lwt` uzeneteket is.
    expect(parseOwnTracksLocation(payload({ _type: 'transition' }))).toBeNull();
  });

  it('elutasitja a hianyos uzenetet', () => {
    expect(parseOwnTracksLocation({ _type: 'location', lat: 47 })).toBeNull();
  });

  it('elutasitja a TARTOMANYON KIVULI koordinatat', () => {
    expect(parseOwnTracksLocation(payload({ lat: 999 }))).toBeNull();
    expect(parseOwnTracksLocation(payload({ lon: -500 }))).toBeNull();
  });

  it('elutasitja az ertelmetlen idobelyeget', () => {
    expect(parseOwnTracksLocation(payload({ tst: 0 }))).toBeNull();
  });

  it('nem hasal el szemeten', () => {
    expect(parseOwnTracksLocation(null)).toBeNull();
    expect(parseOwnTracksLocation('szoveg')).toBeNull();
    expect(parseOwnTracksLocation(42)).toBeNull();
  });

  it('a regio-listabol csak a sztringeket veszi at', () => {
    const parsed = parseOwnTracksLocation(payload({ inregions: ['home', 7, null] }));

    expect(parsed?.inregions).toEqual(['home']);
  });
});

describe('decideHomeState', () => {

  it('OTTHON, ha a telefon a home-regioban van', () => {
    const parsed = parseOwnTracksLocation(payload({ inregions: ['home'] }))!;

    expect(decideHomeState(parsed)).toBe('home');
  });

  it('MASHOL, ha van regio-info, de nincs benne a home', () => {
    const parsed = parseOwnTracksLocation(payload({ inregions: ['munka'] }))!;

    expect(decideHomeState(parsed)).toBe('away');
  });

  it('MASHOL, ha ures a regio-lista (a telefon tudja, hogy sehol sincs)', () => {
    const parsed = parseOwnTracksLocation(payload({ inregions: [] }))!;

    expect(decideHomeState(parsed)).toBe('away');
  });

  it('🔴 UNKNOWN, ha NINCS regio-info — ⛔ NEM "away"', () => {
    // A ketto osszemosasa azt jelentene, hogy egy HIANYZO MEZO miatt elkezdenenk tarolni
    // az otthoni koordinatat — vagyis csendben megsertenenk a szabalyt.
    const parsed = parseOwnTracksLocation(payload())!;

    expect(decideHomeState(parsed)).toBe('unknown');
  });

  it('a home-regio neve ALLITHATO', () => {
    const parsed = parseOwnTracksLocation(payload({ inregions: ['otthon'] }))!;

    expect(decideHomeState(parsed, { ...DEFAULT_LOCATION_CONFIG, homeRegionName: 'otthon' })).toBe('home');
  });
});

describe('toStoredLocation', () => {

  it('🔴 OTTHON: a koordinata EL SEM JUT a tarba', () => {
    const parsed = parseOwnTracksLocation(payload({ inregions: ['home'] }))!;
    const stored = toStoredLocation(parsed, 'home');

    expect(stored.state).toBe('home');
    expect(JSON.stringify(stored)).not.toContain('47.4779');
    expect(JSON.stringify(stored)).not.toContain('19.0402');
  });

  it('MASHOL: a teljes helyzet megmarad', () => {
    const parsed = parseOwnTracksLocation(payload({ inregions: ['munka'] }))!;
    const stored = toStoredLocation(parsed, 'away');

    expect(stored.state).toBe('away');
    expect(JSON.stringify(stored)).toContain('47.4779');
  });

  it('⚠️ UNKNOWN eseten is OTTHONKENT tarol — az OVATOS irany', () => {
    // Ha nem tudjuk, hogy otthon van-e, NEM kockaztatjuk az otthoni koordinata rogziteset.
    const parsed = parseOwnTracksLocation(payload())!;
    const stored = toStoredLocation(parsed, 'unknown');

    expect(stored.state).toBe('home');
    expect(JSON.stringify(stored)).not.toContain('47.4779');
  });

  it('a UNIX-masodpercet ISO-ra valtja', () => {
    const parsed = parseOwnTracksLocation(payload({ tst: 1788770000 }))!;

    expect(toStoredLocation(parsed, 'away').at).toBe(new Date(1788770000 * 1000).toISOString());
  });
});

describe('pruneExpired', () => {

  const now = new Date('2026-09-07T10:00:00+02:00');

  function away(at: string): StoredLocation {
    return { at, state: 'away', lat: 1, lon: 2 };
  }

  it('a friss nem-otthoni bejegyzest megtartja', () => {
    expect(pruneExpired([away('2026-09-01T10:00:00Z')], now).length).toBe(1);
  });

  it('a lejart nem-otthoni bejegyzest kiejti', () => {
    expect(pruneExpired([away('2020-01-01T10:00:00Z')], now).length).toBe(0);
  });

  it('az OTTHON bejegyzesek nem jarnak le — nincs bennuk erzekeny adat', () => {
    const entries: StoredLocation[] = [{ at: '2020-01-01T10:00:00Z', state: 'home' }];

    expect(pruneExpired(entries, now).length).toBe(1);
  });

  it('⚠️ az ertelmezhetetlen idobelyeget MEGTARTJA — bizonytalansagbol nem torlunk', () => {
    expect(pruneExpired([away('nem-datum')], now).length).toBe(1);
  });

  it('a megtartasi ido ALLITHATO', () => {
    const entries = [away('2026-09-01T10:00:00Z')];

    expect(pruneExpired(entries, now, { ...DEFAULT_LOCATION_CONFIG, retainAwayDays: 1 }).length).toBe(0);
  });
});
