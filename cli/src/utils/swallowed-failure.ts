// EGY ELNYELT HIBA BEJELENTÉSE — hogy a „nem tudom" ne legyen megkülönböztethetetlen
// a „minden rendben"-től.
//
// 🔴 MIÉRT LÉTEZIK
//
// A CLI-ben sok olyan olvasó/próbálkozó van, ami hiba esetén szándékosan **óvatos
// alapértékkel** tér vissza: `null`, `0`, `[]`, `false`, `undefined`. Ez helyes döntés — egy
// sérült állapotfájl nem döntheti meg a figyelőt, és egy elérhetetlen szolgáltatás nem
// szakíthatja félbe a köteg feldolgozását.
//
// ⛔ **A baj nem a fallback, hanem a némaság.** Ugyanaz a `null` jött vissza akkor is, ha
// tényleg nincs adat, és akkor is, ha el sem tudtuk olvasni. A rendszer így **nyugalmat
// jelentett egy hiba közben** — pontosan az a hibafajta, ami miatt az owner reggel 24 belépést
// és **nulla kilépést** látott a naplóban.
//
// ⭐ EZ A FÜGGVÉNY a fallbackot MEGTARTJA, csak nyomot hagy mellette. És mert ezek a hívók
// **ciklusban** futnak (percenkénti életjel, kötegelt feldolgozás), a jelentés **deduplikált**:
// hatókörönként egyszer, és újra csak akkor, ha MÁS hiba jött.
//
// ⚠️ Ez **nem** helyettesíti a rendes hibakezelést: ahol a hiba a hívóra tartozik, ott dobni
// kell. Ez ott való, ahol a fallback a HELYES válasz, de a némaság nem az.

import { DyFM_Log } from '@futdevpro/fsm-dynamo';

/** Hatókörönként az utoljára bejelentett hiba-üzenet. */
const lastReportedByScope: Map<string, string> = new Map<string, string>();

/**
 * Egy elnyelt (fallbackkel kezelt) hiba bejelentése.
 *
 * @param scope a hívó azonosítója — ez kerül a napló-sor elejére (pl. `cast.tts.synthesize`).
 * @param err az elkapott hiba.
 * @param expectedCodes rendszerhiba-kódok (`ENOENT`, `EACCES`, …), amelyek ebben a hívóban
 *        **VÁRT** esetek — ezekre csendben maradunk.
 *
 * ⭐ MIÉRT ITT DŐL EL, ÉS NEM A HÍVÓBAN EGY `if`-BEN: a hívónál a feltételbe zárt jelentés
 * azt jelenti, hogy a **másik ág néma marad** — és épp az a másik ág a váratlan hiba.
 * A döntés ezért ide tartozik: a hívó **mindig** jelent, a szűrés itt történik, egy helyen.
 */
export function reportSwallowedFailure(scope: string, err: unknown, expectedCodes: string[] = []): void {
  const code: string | undefined = (err as NodeJS.ErrnoException)?.code;

  if (code !== undefined && expectedCodes.includes(code)) {
    return;
  }
  const message: string = String(err);

  if (lastReportedByScope.get(scope) === message) {
    return;
  }
  lastReportedByScope.set(scope, message);
  DyFM_Log.warn(`[${scope}] MA-CLI-SWALLOWED-FAILURE: ${message}`);
}
