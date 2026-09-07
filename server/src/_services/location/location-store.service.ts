// A helyzet-adat TÁRA.
//
// > **Owner (2026-09-07):** *„Hol tárold...? Db-ben? Meddig? Nem is tudom..."*
//
// ⇒ A HELYET rám bízta, a KORLÁTOKAT megadta. A választás: **JSONL fájl**, nem adatbázis.
//
// | Miért fájl | |
// |---|---|
// | **Kevés adat** | percenkénti minta mellett is napi néhány KB |
// | **Append-only** | pontosan illik a mérési adathoz; nincs frissítés, nincs tranzakció |
// | **Nincs új függőség** | a Mongo megvan, de egy helyzet-naplóhoz nem ad semmit |
// | **Olvasható** | egy `tail`-lel megnézhető, mit tárolunk — ez adatvédelmi szempontból is jó |
//
// 🔴 A HELY: `server/data/location/` — **gitignore-olva**. A helyzet-adat SOHA nem kerülhet a
// repóba. *(A `current/` git-trackelt, ezért az kizárva; `.gitignore`-ban a `server/data/`.)*

import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_LOCATION_CONFIG,
  type LocationConfig,
  type StoredLocation,
} from './location.models.js';
import { pruneExpired } from './location.retention.js';

/** A tár könyvtára. A `_services/location` mindkét elrendezésben négy szint mély. */
export function resolveLocationStoreDir(): string {
  const here: string = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot: string = path.resolve(here, '..', '..', '..', '..');

  return path.join(projectRoot, 'server', 'data', 'location');
}

function resolveStoreFile(): string {
  return path.join(resolveLocationStoreDir(), 'locations.jsonl');
}

/**
 * Egy helyzet hozzáfűzése.
 *
 * 🔴 Hibát NEM dob: a helyzet-rögzítés nem döntheti meg a végpontot, és a telefon
 * újrapróbálkozásától sem lesz jobb. A hívó `false`-t kap, és naplózza.
 */
export async function appendLocation(entry: StoredLocation): Promise<boolean> {
  try {
    const file: string = resolveStoreFile();

    await mkdir(path.dirname(file), { recursive: true });
    await appendFile(file, `${JSON.stringify(entry)}\n`, 'utf-8');

    return true;
  } catch {
    return false;
  }
}

/** A tárolt helyzetek beolvasása. Sérült sort kihagy, hibát nem dob. */
export async function readLocations(): Promise<StoredLocation[]> {
  try {
    const file: string = resolveStoreFile();

    if (!existsSync(file)) return [];

    return (await readFile(file, 'utf-8'))
      .split('\n')
      .filter((line: string): boolean => line.trim().length > 0)
      .map((line: string): StoredLocation | null => {
        try {
          return JSON.parse(line) as StoredLocation;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is StoredLocation => entry !== null);
  } catch {
    return [];
  }
}

/**
 * A lejárt bejegyzések eltávolítása a tárból.
 *
 * ⚠️ Átmeneti fájl + átnevezés, mint a Discord-kötegnél: egy megszakadás nem hagyhat
 * félkész tárat.
 *
 * @returns hány bejegyzést ejtettünk ki.
 */
export async function pruneStore(
  now: Date = new Date(),
  config: LocationConfig = DEFAULT_LOCATION_CONFIG,
): Promise<number> {
  try {
    const entries: StoredLocation[] = await readLocations();
    const kept: StoredLocation[] = pruneExpired(entries, now, config);

    if (kept.length === entries.length) return 0;

    const file: string = resolveStoreFile();
    const temporary: string = `${file}.tmp`;
    const body: string = kept.map((entry) => JSON.stringify(entry)).join('\n');

    await writeFile(temporary, body.length > 0 ? `${body}\n` : '', 'utf-8');
    await rename(temporary, file);

    return entries.length - kept.length;
  } catch {
    return 0;
  }
}
