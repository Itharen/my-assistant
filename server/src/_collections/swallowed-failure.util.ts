// EGY ELNYELT HIBA BEJELENTÉSE — hogy a „nem tudom" ne legyen megkülönböztethetetlen
// a „minden rendben"-től.
//
// 🔴 MIÉRT LÉTEZIK
//
// A szerverben sok olyan olvasó van, ami hiba esetén szándékosan **óvatos alapértékkel**
// tér vissza: `absent`, `0`, `[]`, `false`, `undefined`. Ez helyes döntés — egy sérült
// állapotfájl nem döntheti meg a szervert.
//
// ⛔ **A baj nem a fallback, hanem a némaság.** Ugyanaz a `0` jött vissza akkor is, ha
// tényleg nincs várakozó tétel, és akkor is, ha a könyvtárat nem tudtuk elolvasni. A rendszer
// így **nyugalmat jelentett egy hiba közben** — pontosan az a hibafajta, ami a jelenlét-figyelőt
// 112 napig halottan tartotta anélkül, hogy bárki észrevette volna.
//
// ⭐ EZ A FÜGGVÉNY a fallbackot MEGTARTJA, csak nyomot hagy mellette. És mert ezek az olvasók
// **ciklusban** futnak (percenkénti pulzus, pollerek), a jelentés **deduplikált**: hatókörönként
// egyszer, és újra csak akkor, ha MÁS hiba jött — így egy megjavult, majd újra elromló szonda
// is látszik, de a napló nem fullad meg.

import { DyFM_Log } from '@futdevpro/fsm-dynamo';

/** Hatókörönként az utoljára bejelentett hiba-üzenet. */
const lastReportedByScope: Map<string, string> = new Map<string, string>();

/**
 * Egy elnyelt (fallbackkel kezelt) hiba bejelentése.
 *
 * @param scope a hívó azonosítója — ez kerül a napló-sor elejére (pl. `location-store.append`).
 * @param err az elkapott hiba.
 *
 * ⚠️ Ez **nem** helyettesíti a rendes hibakezelést: ahol a hiba a hívóra tartozik, ott
 * dobni kell. Ez ott való, ahol a fallback a HELYES válasz, de a némaság nem az.
 */
export function reportSwallowedFailure(scope: string, err: unknown): void {
  const message: string = String(err);

  if (lastReportedByScope.get(scope) === message) {
    return;
  }
  lastReportedByScope.set(scope, message);
  DyFM_Log.warn(`[${scope}] MA-SERVER-SWALLOWED-FAILURE: ${message}`);
}
