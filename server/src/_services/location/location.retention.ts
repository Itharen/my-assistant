// A TÁROLÁSI SZABÁLY — tiszta logika, hálózat és tár nélkül tesztelhető.
//
// > **Owner (2026-09-07):** *„Maradhat hosszabb távon is ami hasznos... Pl amikor nem
// > otthon... Az otthonit meg fölösleges tárolni."*
//
// Kanonikus: `current/principles/location-retention.md`.

import {
  DEFAULT_LOCATION_CONFIG,
  type HomeState,
  type LocationConfig,
  type OwnTracksLocation,
  type StoredLocation,
} from './location.models.js';

/**
 * Egy nyers OwnTracks-üzenet ellenőrzése.
 *
 * 🔴 Szigorú, mert ez a rendszer **külső határa**: a telefon HTTP-n küld, és ami itt átcsúszik,
 * az később adatként viselkedik. Hibás bemenetre `null`, nem kivétel.
 */
export function parseOwnTracksLocation(raw: unknown): OwnTracksLocation | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const record = raw as Record<string, unknown>;

  // Az OwnTracks több üzenet-típust küld (`transition`, `waypoint`, `lwt`…) — minket csak a
  // helyzet érdekel. A többit CSENDBEN elengedjük, nem hibaként.
  if (record['_type'] !== 'location') return null;

  const lat: unknown = record['lat'];
  const lon: unknown = record['lon'];
  const tst: unknown = record['tst'];

  if (!isFiniteNumber(lat) || !isFiniteNumber(lon) || !isFiniteNumber(tst)) return null;
  // Értelmes tartomány — egy elgépelt vagy sérült érték ne kerüljön a tárba.
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  if (tst <= 0) return null;

  const regions: unknown = record['inregions'];

  return {
    lat,
    lon,
    tst,
    ...(isFiniteNumber(record['acc']) ? { acc: record['acc'] } : {}),
    ...(isFiniteNumber(record['batt']) ? { batt: record['batt'] } : {}),
    ...(Array.isArray(regions)
      ? { inregions: regions.filter((r): r is string => typeof r === 'string') }
      : {}),
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Otthon van-e?
 *
 * ⭐ **A TELEFON DÖNTI EL**, az appban felvett régió alapján — nekünk az otthon koordinátája
 * SOHA nem kell (`location.models.ts` fejléc).
 *
 * ⚠️ Ha a telefon **egyáltalán nem küld** régió-információt, az `unknown` — ⛔ NEM `away`.
 * A kettő összemosása azt jelentené, hogy egy hiányzó mező miatt **elkezdenénk tárolni az
 * otthoni koordinátát** — vagyis csendben megsértenénk a szabályt. Az `unknown`-t a hívó
 * óvatosan kezeli.
 */
export function decideHomeState(
  location: OwnTracksLocation,
  config: LocationConfig = DEFAULT_LOCATION_CONFIG,
): HomeState {
  if (!location.inregions) return 'unknown';

  return location.inregions.includes(config.homeRegionName) ? 'home' : 'away';
}

/**
 * Mit tárolunk el ebből a helyzetből?
 *
 * 🔴 **OTTHON → a koordináta EL SEM JUT a tárba.** Nem törlés, nem maszkolás: a visszaadott
 * alakban **nincs is** hova tenni (`StoredLocation` union).
 *
 * ⚠️ Az `unknown` állapotot **otthonként** kezeljük, vagyis koordináta nélkül tároljuk.
 * Ez szándékosan az ÓVATOS irány: ha nem tudjuk, hogy otthon van-e, akkor **nem kockáztatjuk**
 * az otthoni koordináta rögzítését. Egy hiányzó adatpont olcsóbb, mint egy olyan, amit sosem
 * lett volna szabad eltárolni.
 */
export function toStoredLocation(location: OwnTracksLocation, state: HomeState): StoredLocation {
  const at: string = new Date(location.tst * 1000).toISOString();

  if (state === 'home' || state === 'unknown') {
    return { at, state: 'home' };
  }

  return {
    at,
    state: 'away',
    lat: location.lat,
    lon: location.lon,
    ...(location.acc === undefined ? {} : { accuracyM: location.acc }),
    ...(location.batt === undefined ? {} : { batteryPct: location.batt }),
  };
}

/**
 * A lejárt bejegyzések kiszűrése.
 *
 * Owner: *„Maradhat hosszabb távon is ami hasznos"* — tehát nagyvonalú, de ⛔ **nem
 * végtelen**: ami sosem jár le, az észrevétlenül gyűlik.
 *
 * ⚠️ Az `home` bejegyzések **nem járnak le**: egyrészt nincs bennük érzékeny adat, másrészt
 * pont ezekből látszik a napi ritmus, ami hasznos.
 */
export function pruneExpired(
  entries: StoredLocation[],
  now: Date = new Date(),
  config: LocationConfig = DEFAULT_LOCATION_CONFIG,
): StoredLocation[] {
  const cutoffMs: number = now.getTime() - config.retainAwayDays * 24 * 60 * 60_000;

  return entries.filter((entry: StoredLocation): boolean => {
    if (entry.state === 'home') return true;

    const atMs: number = new Date(entry.at).getTime();

    // Az értelmezhetetlen időbélyeget MEGTARTJUK: bizonytalanságból nem törlünk adatot.
    return Number.isNaN(atMs) || atMs >= cutoffMs;
  });
}
