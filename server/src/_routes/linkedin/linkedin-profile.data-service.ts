// 🔗 A PROFIL-FRISSÍTÉS ADATAI — a fájlok olvasása és a pipa mentése.
//
// ## Mi hol van, és MIÉRT ott
//
// | adat | hely | miért |
// |---|---|---|
// | a **mostani** profil | `current/linkedin/profile-current.json` | a LinkedIn exportjából,
// |   | | **verziózva** — ez a kiindulás |
// | a **javasolt** szöveg | `current/linkedin/profile-proposed.json` | ⭐ ezt az **asszisztens**
// |   | | írja *(⛔ nem a DEV)*, és **verziózva** kell lennie, mert a CV-ből következik |
// | a **pipa** *(mit illesztett be)* | `~/.config/my-assistant/linkedin/` | ⚠️ **futásidejű
// |   | | állapot**, ⛔ nem a repóba: a következő frissítésnél újraindul |
//
// ⛔ **Olvasási hibát NEM nyelünk el némán**: a hívó `DyFM_Error`-ba fordítja, mert egy üres
// panel *(„nincs mit frissíteni")* és egy olvasási hiba kívülről **ugyanúgy néz ki**.

import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DyFM_Error } from '@futdevpro/fsm-dynamo';

import { SwallowedFailure_Util } from '../../_collections/swallowed-failure.util.js';

/**
 * A CLI mező-modul betöltése.
 *
 * 🔴 A FUTÁSIDEI HIVATKOZÁS **RELATÍV**, NEM `@cli/...` ALIAS — MÉRVE 2026-09-10.
 *
 * A `tsconfig.json` `paths` bejegyzése **csak fordítási időben** létezik; a `tsx` futásidőben
 * NEM alkalmazza a dinamikus importra. ⚠️ És ez nem elméleti: a Google- és a Spotify-panel
 * **élesben elromlott** emiatt, miközben a típus-ellenőrzés **zöld** volt.
 *
 * ⭐ A típus-hivatkozás aliasos MARADHAT: az fordítási időben dől el.
 */
let cliModulePromise: Promise<typeof import('@cli/linkedin/linkedin-profile-fields')> | null = null;

function loadFieldsModule(): Promise<typeof import('@cli/linkedin/linkedin-profile-fields')> {
  cliModulePromise ??= import('../../../../cli/src/linkedin/linkedin-profile-fields.js');

  return cliModulePromise;
}

/**
 * A projekt gyökere — **jelölő-keresessel**, ⛔ nem szint-szamolassal.
 *
 * ## 🔴 KET MERT HIBA VEZETETT IDE (2026-09-11 11:02 es 11:08)
 *
 * **(1) `__dirname` ESM-ben.** A szerver `"type": "module"`, ahol a `__dirname` ⛔ **nem
 * letezik** ⇒ futasidoben `ReferenceError`. ⚠️ A `tsc` **zold** volt, mert a `@types/node`
 * globalisan deklaralja ⇒ a hiba **csak elo hivasra** derult ki:
 * `GET /api/linkedin/profile-update` → `MA-LINKEDIN-PROFILE-READ-FAILED`.
 * ⇒ Ez resze volt annak, amit az owner *„mindenfele hiba"*-kent latott.
 *
 * **(2) A SZINT-SZAMOLAS nem lehet helyes MINDKET futasban.** Merve:
 *
 * ```
 * src:    server/src/_routes/linkedin         → 4 szint = a repo gyokere
 * build:  server/build/server/src/_routes/... → 5 szint = a repo gyokere
 * ```
 *
 * ⇒ Egy fix szam **vagy a `tsx`-es fejlesztoi futasban, vagy a buildben** teved. A masodik
 * hiba pont ezert bukott ki: a spec a **buildbol** fut, es a mostani profil-szoveg **ures**
 * lett — ⚠️ ⛔ **nem kivetellel**, hanem **csendes uressegkent**, ami a panelen
 * „nincs mit frissiteni"-nek latszik. Az a legrosszabb kimenetel.
 *
 * ⭐ EZERT JELOLOT KERESUNK, a CLI `resolveProjectRoot` mintaja szerint *(`__agent` + `cli`)* —
 * az **fuggetlen** attol, honnan futunk.
 */
function resolveRepoRoot(): string {
  let directory: string = dirname(fileURLToPath(import.meta.url));

  for (let depth: number = 0; depth < 10; depth += 1) {
    if (existsSync(join(directory, '__agent')) && existsSync(join(directory, 'cli'))) {
      return directory;
    }

    const parent: string = join(directory, '..');

    if (parent === directory) break;
    directory = parent;
  }

  // ⛔ NEM NEMA: ha a jelolot nem talaljuk, a hivo `DyFM_Error`-t kap — a **csendes ureseg**
  // helyett **kimondott** hiba. (A panel igy „nem olvashato"-t mutat, nem azt, hogy nincs
  // mit frissiteni.)
  throw new Error(
    'A projekt gyokere nem talalhato (`__agent` + `cli` jelolo) — '
    + `a kereses innen indult: ${dirname(fileURLToPath(import.meta.url))}`,
  );
}

/** A futásidejű állapot fájlja. */
function resolvePasteStatePath(): string {
  return join(homedir(), '.config', 'my-assistant', 'linkedin', 'profile-paste-state.json');
}

/**
 * Egy JSON-fájl beolvasása.
 *
 * @returns az értelmezett tartalom, vagy `null`, ha nincs ilyen fájl.
 *
 * ⚠️ A **hiányzó** fájl nem hiba *(a javaslat még nem készült el)*, de a **sérült** az —
 * azt a hívóra engedjük.
 */
async function readJson(path: string): Promise<unknown> {
  if (!existsSync(path)) return null;

  return JSON.parse(await readFile(path, 'utf-8'));
}

/** A LinkedIn profil-frissítés adatai. */
export class LinkedinProfile_DataService {

  /**
   * A frissítési terv — mezőnként a mostani és a javasolt szöveg.
   *
   * ⛔ **A HIBA NEM LEHET NÉMA**: enélkül a panel üresen állna, és úgy néznénk ki, mintha nem
   * lenne mit frissíteni — pedig olvasási hiba van. A kettő kívülről **ugyanúgy néz ki**.
   */
  async readPlan(): Promise<unknown> {
    try {
      const cli = await loadFieldsModule();
      const root: string = resolveRepoRoot();

      return cli.LinkedinProfileFields_Util.buildPlan({
        current: await readJson(join(root, 'current', 'linkedin', 'profile-current.json')),
        proposed: await readJson(join(root, 'current', 'linkedin', 'profile-proposed.json')),
        pasted: await this.readPasted(),
      });
    } catch (error: unknown) {
      throw new DyFM_Error({
        error: error,
        errorCode: 'MA-LINKEDIN-PROFILE-READ-FAILED',
        message: 'A profil-frissítési terv nem olvasható.',
      });
    }
  }

  /**
   * A beillesztés-jelölés mentése.
   *
   * ⭐ MIÉRT KELL: *„különben nem tudja, hol tartott, ha félbeszakad"* — a feladat kikötése.
   *
   * ⚠️ A kérés-törzs **ismeretlen érték**: a felület bármit küldhet. Az ellenőrzés a CLI
   * tiszta függvényében történik — az **ismeretlen kulcsot eldobja**, ⛔ nem jegyzi fel.
   */
  async markPasted(body: unknown): Promise<unknown> {
    try {
      const cli = await loadFieldsModule();
      const key: string = readStringField(body, 'key');
      const isPasted: boolean = readBooleanField(body, 'isPasted');
      const next: string[] = cli.LinkedinProfileFields_Util.togglePasted(
        await this.readPasted(),
        key,
        isPasted,
      );

      await this.writePasted(next);

      return this.readPlan();
    } catch (error: unknown) {
      throw new DyFM_Error({
        error: error,
        errorCode: 'MA-LINKEDIN-PROFILE-PASTE-FAILED',
        message: 'A beillesztés-jelölés nem menthető.',
      });
    }
  }

  /** Amit már beillesztett. ⚠️ Hiányzó/sérült állapotnál **üres** — az állapot nem kritikus. */
  private async readPasted(): Promise<string[]> {
    const path: string = resolvePasteStatePath();

    if (!existsSync(path)) return [];

    try {
      const parsed: unknown = JSON.parse(await readFile(path, 'utf-8'));

      if (!parsed || typeof parsed !== 'object') return [];

      for (const [name, value] of Object.entries(parsed)) {
        if (name !== 'pasted' || !Array.isArray(value)) continue;

        return value.filter((item: unknown): item is string => typeof item === 'string');
      }

      return [];
    } catch (error: unknown) {
      // ⚠️ A SÉRÜLT ÁLLAPOT NEM AKADÁLY: a legrosszabb, ami történik, hogy az owner újra
      // kipipálja a mezőket. ⛔ Egy kivétel viszont a TELJES panelt megbuktatná.
      //
      // ⛔ DE NEM NÉMÁN: a haladás elvesztése **jel** — ha ez ismétlődik, valami tartósan
      // elromlott az állapot-fájllal, és azt tudni kell.
      SwallowedFailure_Util.report('linkedin.profile.readPasted', error);

      return [];
    }
  }

  /**
   * Az állapot mentése.
   *
   * ⚠️ Átmeneti fájl + átnevezés: egy megszakadt írás ⛔ nem hagyhat félkész állapotot, mert
   * onnantól a panel **hibás** haladást mutatna.
   */
  private async writePasted(pasted: string[]): Promise<void> {
    const path: string = resolvePasteStatePath();
    const temporary: string = `${path}.tmp`;

    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(
      temporary,
      `${JSON.stringify({ pasted: pasted, updatedAt: new Date().toISOString() }, null, 2)}\n`,
      'utf-8',
    );
    await rename(temporary, path);
  }
}

/** Egy szöveges mező kiolvasása ismeretlen törzsből. ⛔ Átcímkézés nélkül. */
function readStringField(body: unknown, field: string): string {
  if (!body || typeof body !== 'object') return '';

  for (const [name, value] of Object.entries(body)) {
    if (name === field) return typeof value === 'string' ? value : '';
  }

  return '';
}

/** Egy logikai mező kiolvasása ismeretlen törzsből. */
function readBooleanField(body: unknown, field: string): boolean {
  if (!body || typeof body !== 'object') return false;

  for (const [name, value] of Object.entries(body)) {
    if (name === field) return value === true;
  }

  return false;
}
