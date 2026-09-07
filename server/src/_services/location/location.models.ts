// HELYZET-KÖVETÉS — a MÉRT szerződés és a tárolási szabály.
//
// > **Owner-döntés (2026-09-07 10:24), szó szerint:** *„Jól hangzik az owntracks.. nemtom
// > mennyi időbként... Legyen állítható és majd finomhangoljuk. Hol tárold...? Db-ben?
// > Meddig? Nem is tudom... Maradhat hosszabb távon is ami hasznos... Pl amikor nem otthon...
// > Az otthonit meg fölösleges tárolni."*
//
// Kanonikus szabály: `current/principles/location-retention.md`.
//
// ⭐ AZ ALAPVETŐ TERVEZÉSI DÖNTÉS — és hogy miért ez:
// Az „otthon van-e?" kérdést **a TELEFON dönti el**, nem mi. Az OwnTracks appban felvett
// *régió* (waypoint) alapján a telefon a `inregions` mezőben küldi, hogy otthon van-e.
//
// Ennek három egyidejű előnye van, és ez nem kényelmi választás:
//   1. ⛔ **Nekünk SOSEM kell az otthon koordinátája** — így el sem tudjuk szivárogtatni.
//      *(Mérve: `current/locations.md`-ben csak CÍM van, koordináta nincs — és marad is így.)*
//   2. A „mekkora sugár az otthon" kérdés a telefonra kerül, ahol amúgy is pontosabb.
//   3. Nem kell külső geokódoló szolgáltatás — illeszkedik a `no-paid-solutions` elvhez.
//
// Ha valaki mégis koordináta-alapú összehasonlítást akar, arra van tartalék út — de az
// **explicit beállítást** igényel, és soha nem az alapértelmezés.

/** Az OwnTracks `_type: "location"` üzenetének minket érdeklő mezői. */
export interface OwnTracksLocation {
  /** Szélesség. */
  lat: number;
  /** Hosszúság. */
  lon: number;
  /** UNIX másodperc — az OwnTracks így küldi. */
  tst: number;
  /** Vízszintes pontosság méterben, ha küldi. */
  acc?: number;
  /** Akkumulátor-százalék, ha küldi. */
  batt?: number;
  /** Mely régiókban van ÉPPEN a telefon (az appban felvett waypointok nevei). */
  inregions?: string[];
}

/** Otthon van-e — a `unknown` KÜLÖN eset, sosem mossuk össze a `no`-val. */
export type HomeState = 'home' | 'away' | 'unknown';

export interface LocationConfig {
  /**
   * Az OwnTracks-régió neve, ami az OTTHONT jelenti.
   *
   * ⭐ Ezt az appban veszi fel az owner; mi csak a NEVÉT ismerjük — a koordinátáját nem.
   */
  homeRegionName: string;
  /**
   * Ennyi ideig tartjuk meg a NEM-otthoni helyzeteket.
   *
   * Owner: *„Maradhat hosszabb távon is ami hasznos"* ⇒ nagyvonalú alapérték, de **nem
   * végtelen**: ami sosem jár le, az észrevétlenül gyűlik.
   */
  retainAwayDays: number;
}

/** Alapértelmezés. ⚠️ A régió-név **állítható**, mert az appban az owner adja meg. */
export const DEFAULT_LOCATION_CONFIG: LocationConfig = {
  homeRegionName: 'home',
  retainAwayDays: 365,
};

/**
 * A TÁROLANDÓ bejegyzés.
 *
 * 🔴 Két, szándékosan eltérő alak — ez maga a tárolási szabály, típusszinten kikényszerítve:
 *   - otthon  → **NINCS koordináta**, csak annyi, hogy „otthon volt"
 *   - máshol  → teljes helyzet
 *
 * ⭐ Így a „ne tároljuk az otthonit" nem egy `if`-en múlik, amit el lehet felejteni, hanem a
 * típus nem is engedi meg: a `home` ágnak **nincs hova** tenni a koordinátát.
 */
export type StoredLocation =
  | { at: string; state: 'home' }
  | { at: string; state: 'away' | 'unknown'; lat: number; lon: number; accuracyM?: number; batteryPct?: number };
