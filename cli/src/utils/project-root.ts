// A my-assistant projekt gyökerének feloldása.
//
// Azért közös segéd, mert több modul is a projekt-gyökérhez képest keres adatot
// (jelenlét-mérés, agent-fájlok), és ha mindegyik saját logikát vinne, egy elmozduló
// könyvtárszerkezetnél némán széttartanának.

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Környezeti felülbírálás — teszthez és nem szokványos indításhoz. */
export const PROJECT_ROOT_ENV: string = 'MA_ASSISTANT_PROJECT_ROOT';

/**
 * Felfelé keresi azt a könyvtárat, amiben `__agent/` ÉS `cli/` is van.
 * Ha nem találja, a kiinduló könyvtárral tér vissza — a hívó ilyenkor `unknown` állapotot lát,
 * nem téves „nincs adat" következtetést.
 */
export function resolveProjectRoot(startDirectory: string = process.cwd()): string {
  const configured: string | undefined = process.env[PROJECT_ROOT_ENV];

  if (configured && configured.trim().length > 0) return resolve(configured);

  let directory: string = resolve(startDirectory);

  for (let depth: number = 0; depth < 10; depth += 1) {
    if (existsSync(join(directory, '__agent')) && existsSync(join(directory, 'cli'))) return directory;

    const parent: string = resolve(directory, '..');

    if (parent === directory) break;
    directory = parent;
  }

  return resolve(startDirectory);
}

/** Az `activity-monitor` napi mérés-fájljainak könyvtára. */
export function resolvePresenceDataDirectory(projectRoot: string = resolveProjectRoot()): string {
  return join(projectRoot, 'server', 'activity-monitor', 'data');
}
