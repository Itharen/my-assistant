// 🔧 AZ ÁTEMELT CCAP-KÓD FUTTATHATÓVÁ TÉTELE — a KIMENETEN, nem a forráson.
//
// > **Owner (2026-09-07):** *„semmit nem szabad változtatni a kódban jelenleg, mert nagyon
// > törékeny az a kód, de cserében meg egész jól működött."*
//
// ⭐ EZÉRT VAN EZ A SZKRIPT: két olyan akadály van, ami **nem a kód hibája**, hanem a
// környezeté — a régi bot más build-kiosztásban és régebbi Node-on futott. A forráshoz nem
// nyúlunk (`transplant-not-rewrite`); a különbséget a **build kimenetén** oldjuk fel.
//
// **(1) A `package.json` a kiosztás miatt nem található.** Az átemelt
// `settings.const.ts` a `../../../package.json`-ból veszi a verziót. A forrásban ez
// `cli/package.json`; a kimenetben `dist/cli/package.json` — ami nem létezett. ⇒ Odateszünk
// egy **minimális** fájlt (⛔ nem másoljuk a teljeset: annak `bin`/`dependencies` mezői a
// dist-ben félrevezetőek és károsak lennének).
//
// **(2) A JSON-import attribútum nélkül tilos.** A Node 22 ESM-ben `with { type: 'json' }`-t
// követel. A régi bot Node-ja még nem. ⇒ A kibocsátott JS-ben pótoljuk.
//
// 🔴 MIÉRT NEM ELÉG EGYIK SEM ÖNMAGÁBAN: az (1) nélkül a fájl nincs meg, a (2) nélkül a
// Node el sem jut a fájlig. **Mérve 2026-09-07:** a hiányzó attribútum hibája jött előbb,
// és az elfedte a hiányzó fájlt — vagyis egyik javítás önmagában „ugyanazt a hibát" hagyta
// volna hátra, más okból.

import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** A `cli/` könyvtár — a szkript a `cli/scripts/`-ben lakik. */
const CLI_ROOT: string = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Az átemelt kód kibocsátási gyökere. */
const EMIT_ROOT: string = join(CLI_ROOT, 'dist', 'cli');

/** Csak ezekben a fákban javítunk — ⛔ a saját kódunkhoz nem nyúlunk. */
const TRANSPLANTED_DIRS: string[] = ['_modules', '_collections', '_enums'];

/** Attribútum nélküli JSON-import. A `with`/`assert` már ellátott alakra NEM illeszkedik. */
const BARE_JSON_IMPORT: RegExp = /^(\s*import\s+[^;]*?from\s+['"][^'"]+\.json['"])\s*;/gm;

/**
 * NEVESÍTETT kötésű JSON-import — `import { version } from '…json' with { type: 'json' };`
 *
 * 🔴 A HARMADIK környezet-különbség: az ESM JSON-modulnak **csak `default` exportja van**.
 * A régi bot buildjében a nevesített kötés működött (bundler / CJS-interop); a Node 22 ESM-ben
 * `does not provide an export named 'version'` hibát ad. ⇒ default-importra írjuk át, és a
 * neveket **destrukturálással** kötjük ki — ez viselkedésben azonos, csak a nyelvtan más.
 */
const NAMED_JSON_IMPORT: RegExp =
  /^(\s*)import\s+\{([^}]+)\}\s+from\s+(['"][^'"]+\.json['"])\s+with\s+\{\s*type:\s*'json'\s*\}\s*;/gm;

export interface TransplantedFixResult {
  /** Létrejött-e a minimális `package.json` a kimenetben. */
  manifestWritten: boolean;
  /** Hány fájlban pótoltuk a JSON-import attribútumot. */
  patchedFiles: string[];
  /** Ha az átemelt kimenet nincs meg — ⚠️ ez NEM néma siker. */
  missingEmit: boolean;
}

/**
 * A JSON-importok ellátása attribútummal — **idempotens**.
 *
 * ⚠️ A már ellátott alakot (`with { type: 'json' }`) szándékosan nem illeszti a minta, így a
 * szkript kétszer futtatva sem duplikál. Egy build-lépésnek ez alapkövetelmény: a pipeline
 * ugyanazon a kimeneten többször is lefuthat.
 */
export function addJsonImportAttribute(source: string): string {
  const withAttribute: string = source.replace(BARE_JSON_IMPORT, `$1 with { type: 'json' };`);

  // Számláló a névütközés ellen: egy fájlban több JSON-import is lehet.
  let index: number = 0;

  return withAttribute.replace(
    NAMED_JSON_IMPORT,
    (_match: string, indent: string, bindings: string, from: string): string => {
      const alias: string = `__jsonModule${index}`;

      index += 1;

      return `${indent}import ${alias} from ${from} with { type: 'json' };\n`
        + `${indent}const {${bindings}} = ${alias};`;
    },
  );
}

/** A minimális manifest tartalma — csak ami a `version`-höz és a modul-típushoz kell. */
export function composeMinimalManifest(version: string): string {
  return `${JSON.stringify({ type: 'module', version: version }, null, 2)}\n`;
}

async function collectJsFiles(directory: string): Promise<string[]> {
  const found: string[] = [];
  const entries = await readdir(directory, { withFileTypes: true }).catch((): [] => []);

  for (const entry of entries) {
    const full: string = join(directory, entry.name);

    if (entry.isDirectory()) found.push(...await collectJsFiles(full));
    else if (entry.name.endsWith('.js')) found.push(full);
  }

  return found;
}

export async function fixTransplantedBuild(): Promise<TransplantedFixResult> {
  const result: TransplantedFixResult = {
    manifestWritten: false,
    patchedFiles: [],
    missingEmit: false,
  };

  const emitted = await stat(EMIT_ROOT).catch((): null => null);

  if (!emitted?.isDirectory()) {
    result.missingEmit = true;

    return result;
  }

  const cliManifest: { version?: string } = JSON.parse(
    await readFile(join(CLI_ROOT, 'package.json'), 'utf8'),
  ) as { version?: string };

  await writeFile(
    join(EMIT_ROOT, 'package.json'),
    composeMinimalManifest(cliManifest.version ?? '0.0.0'),
    'utf8',
  );
  result.manifestWritten = true;

  for (const dir of TRANSPLANTED_DIRS) {
    for (const file of await collectJsFiles(join(EMIT_ROOT, 'src', dir))) {
      const original: string = await readFile(file, 'utf8');
      const patched: string = addJsonImportAttribute(original);

      if (patched === original) continue;

      await writeFile(file, patched, 'utf8');
      result.patchedFiles.push(file.replace(EMIT_ROOT, '').replace(/\\/g, '/'));
    }
  }

  return result;
}

const invokedDirectly: boolean = process.argv[1] !== undefined
  && resolve(process.argv[1]).endsWith('transplanted-build-fix.ts');

if (invokedDirectly) {
  const outcome: TransplantedFixResult = await fixTransplantedBuild();

  if (outcome.missingEmit) {
    // 🔴 NEM néma siker: ha nincs kimenet, azt ki kell mondani, különben a következő lépés
    // egy nem létező modult próbálna betölteni, és a hiba ott bukna ki, ahol nem keresnénk.
    process.stderr.write(
      `[transplanted-build-fix] MA-TRANSPLANT-EMIT-MISSING: ${EMIT_ROOT} nincs meg — `
      + 'futott-e a `tsc -p tsconfig.transplanted.json`?\n',
    );
    process.exit(1);
  }

  process.stdout.write(
    `[transplanted-build-fix] manifest: ${outcome.manifestWritten ? 'kész' : 'kimaradt'}, `
    + `JSON-import javítva: ${outcome.patchedFiles.length} fájlban`
    + `${outcome.patchedFiles.length ? ` (${outcome.patchedFiles.join(', ')})` : ''}\n`,
  );
}
