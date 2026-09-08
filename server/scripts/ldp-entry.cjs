// 🔌 LDP-BELÉPŐ SHIM — CommonJS kívül, IGAZI ESM belül.
//
// 🔴 MIÉRT LÉTEZIK EZ A FÁJL (mérve 2026-09-08 10:30, éles hibából):
//
// Az LDP make-before-break (detached) ága a szerver-wrappert használja, ami a belépőt
// **`require()`-rel** tölti be (`server-wrapper.script.ts`: „2. `require(entryPath)`").
// A mi szerverünk viszont **ESM** (`"type": "module"`), és **26 helyen** támaszkodik az
// `import.meta`-ra *(12 a szerverben, 14 a CLI-ben)*.
//
// ⚠️ CJS-interopon át betöltve az `import.meta.dirname` **`undefined`**, és ettől a szerver
// **el sem indult**:
//
// ```
// TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string.
//   at App.getStaticClientSettings (server/src/app.server.ts:195)
//   Application start failed
// ```
//
// ⛔ **26 hívási hely átírása NEM megoldás** — az az `import.meta`-t száműzné egy ESM
// kódbázisból, csak azért, hogy egy betöltési részlethez idomuljon.
//
// ⭐ **A MEGOLDÁS:** ez a **CommonJS** fájl az, amit a wrapper `require()`-el — ő pedig
// **dinamikus `import()`-tal** tölti be az igazi belépőt. A dinamikus `import()` a **valódi
// ESM-betöltőn** megy át, tehát az `import.meta` **érintetlen marad**.
//
// ⚠️ A `.ts` kiterjesztést a `NODE_OPTIONS=--import tsx` oldja fel — ezt a
// `.dynamo/pipeline.config.json` `serverRestart.env` állítja be.

const path = require('node:path');
const { pathToFileURL } = require('node:url');

/** Az igazi, ESM szerver-belépő — ehhez a fájlhoz képest. */
const entry = path.resolve(__dirname, '..', 'src', 'index.ts');

// ⛔ A hibát NEM nyeljük el: ha a szerver nem indul, annak **hangosan** kell kiderülnie,
// különben a wrapper „ready"-nek látja a folyamatot, miközben az alkalmazás halott.
// (Pontosan ez történt 10:12-kor: `[ldp] server ready` — közben `Application start failed`.)
import(pathToFileURL(entry).href).catch((error) => {
  process.stderr.write(
    `[ldp-entry] A szerver-belépő betöltése ELBUKOTT: ${entry}\n`
    + `${error && error.stack ? error.stack : String(error)}\n`,
  );
  process.exit(1);
});
