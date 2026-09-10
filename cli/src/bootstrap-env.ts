// 🔴 A `.env` BETÖLTÉSE A MODUL-GRÁF ELŐTT — mellékhatás-modul, szándékosan.
//
// ## A MÉRT HIBA (2026-09-10 19:27)
//
// A felolvasás `Service not initialized`-del bukott, holott a `FDP_ELEVENLABS_API_KEY` **be
// volt állítva és működött**. Az ok nem a kulcs, hanem a **modul-betöltési sorrend**:
//
// ```
// import { envKeys } from './_collections/consts/env-keys.const.js';   // ← itt már OLVAS
//     └─ const envKeys = { elevenLabs: { apiKey: process.env.FDP_ELEVENLABS_API_KEY } }
// …
// loadDotEnv({ path: … });                                             // ← és CSAK ITT tölt be
// ```
//
// Az ES-modulok importjai **hoistolódnak**: minden import lefut, MIELŐTT a fájl bármelyik
// top-level utasítása. Az `envKeys` tehát `undefined`-ot fagyasztott be, a `dotenv` pedig
// utána már csak a `process.env`-et töltötte fel — a `const`-ot nem.
//
// ⭐ **MEGMÉRVE, nem feltételezve:**
// ```
// import UTAN, dotenv ELOTT: envKeys.elevenLabs.apiKey = UNDEFINED
// dotenv UTAN: process.env kulcs = VAN
// dotenv UTAN: envKeys (befagyott) = UNDEFINED
// ```
//
// ## ⭐ MIÉRT EZ A MEGOLDÁS
//
// Ez a modul **csak a betöltést** végzi, és a `main.ts` **legelső** importja. Az ESM az
// importokat forrás-sorrendben futtatja, tehát ez lefut, **mielőtt** bármi elolvasná a
// `process.env`-et.
//
// ⛔ Az `env-keys.const.ts` átírása NEM opció: az átemelt CCAP-kód része
// *(`transplant-not-rewrite`)*, és a `tsconfig.transplanted.json` is befogja. A hibát ott
// oldjuk fel, ahol nem árt: a **betöltés idejében**.
//
// ⚠️ Ez a hiba **NÉMA volt, és nem csak a hangot érintette**: minden `envKeys`-alapú kulcs
// *(ClickUp, ElevenLabs, …)* `undefined` volt a CLI-ben. A tünet mindenhol „a szolgáltatás
// nincs beállítva" — a legmegtévesztőbb üzenet, mert a `.env`-ben ott van a kulcs.

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadDotEnv } from 'dotenv';

/**
 * A projekt-gyökér `.env`-je — `src/`-ből és `dist/cli/src/`-ből futtatva is ugyanaz.
 *
 * ⚠️ A gyökeret a `__agent` + `package.json` PÁROS jelenléte azonosítja: külön-külön
 * mindkettő előfordul máshol is, együtt viszont csak a projekt gyökerében.
 *
 * ⛔ NEM `process.cwd()`-ből indul: a figyelőt a szerver a `cli/` könyvtárból indítja, ott
 * pedig nincs `.env` — és épp ez a fajta néma elcsúszás okozta a mai hibát.
 */
function resolveProjectEnvPath(startDirectory: string): string {
  let directory: string = startDirectory;

  for (let depth: number = 0; depth < 8; depth += 1) {
    if (existsSync(resolve(directory, '__agent')) && existsSync(resolve(directory, 'package.json'))) {
      return resolve(directory, '.env');
    }
    const parent: string = dirname(directory);

    if (parent === directory) break;

    directory = parent;
  }

  return resolve(startDirectory, '..', '..', '.env');
}

loadDotEnv({ path: resolveProjectEnvPath(dirname(fileURLToPath(import.meta.url))) });
