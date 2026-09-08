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
// ⭐ EZ AZ OSZTÁLY a fallbackot MEGTARTJA, csak nyomot hagy mellette. És mert ezek az olvasók
// **ciklusban** futnak (percenkénti pulzus, pollerek), a jelentés **deduplikált**: hatókörönként
// egyszer, és újra csak akkor, ha MÁS hiba jött — így egy megjavult, majd újra elromló szonda
// is látszik, de a napló nem fullad meg.

import { DyFM_Log } from '@futdevpro/fsm-dynamo';

/** Elnyelt hibák bejelentése — statikus util, állapota csak a dedup-nyilvántartás. */
export class SwallowedFailure_Util {

  /** Hatókörönként az utoljára bejelentett hiba-üzenet. */
  private static readonly lastReportedByScope: Map<string, string> = new Map<string, string>();

  /**
   * Egy elnyelt (fallbackkel kezelt) hiba bejelentése.
   *
   * @param scope a hívó azonosítója — ez kerül a napló-sor elejére (pl. `location-store.append`).
   * @param err az elkapott hiba.
   * @param expectedCodes rendszerhiba-kódok (`ENOENT`, `EACCES`, …), amelyek ebben a hívóban
   *        **VÁRT** esetek — ezekre csendben maradunk.
   *
   * ⭐ MIÉRT ITT DŐL EL, ÉS NEM A HÍVÓBAN EGY `if`-BEN: a hívónál a feltételbe zárt jelentés
   * azt jelenti, hogy a **másik ág néma marad** — és épp az a másik ág a váratlan hiba.
   *
   * ⚠️ Ez **nem** helyettesíti a rendes hibakezelést: ahol a hiba a hívóra tartozik, ott
   * dobni kell. Ez ott való, ahol a fallback a HELYES válasz, de a némaság nem az.
   */
  static report(scope: string, err: unknown, expectedCodes: string[] = []): void {
    const code: string | null = SwallowedFailure_Util.readErrorCode(err);

    if (code !== null && expectedCodes.includes(code)) {
      return;
    }
    const message: string = String(err);

    if (SwallowedFailure_Util.lastReportedByScope.get(scope) === message) {
      return;
    }
    SwallowedFailure_Util.lastReportedByScope.set(scope, message);
    DyFM_Log.warn(`[${scope}] MA-SERVER-SWALLOWED-FAILURE: ${message}`);
  }

  /**
   * Egy hiba rendszerhiba-kódja (`ENOENT`, `EPERM`, …), ha van.
   *
   * ⚠️ Szándékosan **típus-cast nélkül**: a `as NodeJS.ErrnoException` csak *átnevezné* az
   * ismeretlen értéket, és futásidőben semmit nem ellenőrizne. Itt tényleg megkérdezzük,
   * hogy van-e `code` mező, és hogy szöveg-e.
   */
  static readErrorCode(err: unknown): string | null {
    if (typeof err !== 'object' || err === null || !('code' in err)) {
      return null;
    }
    const code: unknown = err.code;

    return typeof code === 'string' ? code : null;
  }
}
