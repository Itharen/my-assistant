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
// 🔴 A HELY: `~/.config/my-assistant/location/` — **a repón KÍVÜL**. A helyzet-adat soha nem
// kerülhet a repóba *(a `current/` git-trackelt, ezért az eleve kizárt)*, és — 2026-09-07-i
// mérés után — a **build-kimenetbe sem**, mert onnan minden fordítás letörölné.
// A pontos indoklás a `resolveLocationStoreDir()` fölött.

import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { homedir } from 'node:os';

import { SwallowedFailure_Util } from '../../_collections/swallowed-failure.util.js';

import {
  DEFAULT_LOCATION_CONFIG,
  type LocationConfig,
  type StoredLocation,
} from './location.models.js';
import { pruneExpired } from './location.retention.js';

/**
 * A tár könyvtára.
 *
 * 🔴 MÉRT HIBA (2026-09-07) — EZ ADATVESZTÉST OKOZOTT VOLNA. Korábban a fájl SAJÁT helyéből
 * (`import.meta.url`) számoltunk négy szintet felfelé, azzal a feltevéssel, hogy a
 * `_services/location` „mindkét elrendezésben négy szint mély". A VALÓSÁG más:
 *
 * | elrendezés | a fordított fájl helye | 4 szint fel |
 * |---|---|---|
 * | forrásból (`tsx`) | `server/src/_services/location` | a projekt gyökere ✅ |
 * | fordítva | `server/build/server/src/_services/location` | 🔴 **`server/build`** |
 *
 * A tsconfig ugyanis a `cli/`-t is fordítja, ezért a közös gyökér a repo gyökere lesz, és a
 * kimenet egy szinttel mélyebbre kerül. ⇒ Fordított kódban — vagyis ÉLESBEN — a helyzet-adat
 * a `build/` ALÁ került volna, amit a `build-base` (`rimraf ./build`) **minden fordításnál
 * letöröl**. Az owner kérése (*„Maradhat hosszabb távon is ami hasznos"*) így némán meghiúsult
 * volna, és a hiány pontosan úgy nézett volna ki, mintha nem is mozdult volna sehova.
 *
 * ⭐ EZÉRT NEM A KÓD HELYÉBŐL SZÁMOLUNK TÖBBÉ. A felhasználói adat nem lakhat a
 * build-kimenetben. A tár oda kerül, ahol a többi tartós adatunk is van
 * (`~/.config/my-assistant/`, mint a Discord-köteg és az STT-újrapróbáló sor).
 * A `MA_LOCATION_DIR` felülírja — ez teszi teszteléskor elkülöníthetővé.
 */
export function resolveLocationStoreDir(): string {
  const override: string = (process.env['MA_LOCATION_DIR'] ?? '').trim();

  if (override) return override;

  return path.join(homedir(), '.config', 'my-assistant', 'location');
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
  } catch (err) {
    // Egy meghiúsult írás ADATVESZTÉS: az a helyzet-pont sehol nem létezik többé. A `false`
    // a hívónak szól, a napló-sor pedig nekünk — enélkül csak annyi látszana, hogy
    // „kevés pont van", és senki nem tudná, hogy az írás volt a baj.
    SwallowedFailure_Util.report('location-store.appendLocation', err);

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
        } catch (err) {
          // A sérült sor kimarad — de nem tűnik el. Ha sok ilyen van, a baj az ÍRÓ oldalon van.
          SwallowedFailure_Util.report('location-store.parseLine', err);

          return null;
        }
      })
      .filter((entry): entry is StoredLocation => entry !== null);
  } catch (err) {
    SwallowedFailure_Util.report('location-store.readLocations', err);

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
  } catch (err) {
    // ⚠️ A `0` azt jelentené, hogy „nem volt mit kitakarítani" — pedig az is lehet, hogy NEM
    // SIKERÜLT. A különbség számít: a második esetben a lejárt helyzetek OTT MARADNAK a tárban.
    SwallowedFailure_Util.report('location-store.pruneStore', err);

    return 0;
  }
}
