// 🧰 A LinkedIn-PANELEK KÖZÖS FÁJL-MECHANIKÁJA — ⭐ EGY tulajdonos, ⛔ nem két másolat.
//
// ## ⚠️ MIÉRT LÉTEZIK EZ A FÁJL — a review MÉRÉSE (2026-09-11 18:22)
//
// A poszt-panel megépítése után a `code-duplication` szabály **70 sor / 373 token** azonos
// blokkot talált a `linkedin-posts.data-service.ts` és a `linkedin-profile.data-service.ts`
// között *(91%-ban azonos nevekkel)*. ⇒ A találat **valódi**: a gyökér-feloldás, az
// ismeretlen-törzs olvasás és az állapot-fájl kezelés **ugyanaz a mechanika** volt kétszer.
//
// 🔴 **ÉS EZ NEM ESZTÉTIKAI KÉRDÉS:** a gyökér-feloldás egy **mért, éles hiba** helye volt
// *(l. alább)*. Két példányban azt jelentené, hogy a következő javítás **az egyikben** marad —
// és a másik panel **csendben** rosszul működne tovább.

import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SwallowedFailure_Util } from '../../_collections/swallowed-failure.util.js';

/** A LinkedIn-panelek közös fájl-mechanikája. */
export class LinkedInPanelFiles_Util {

  /**
   * A projekt gyökere — **jelölő-kereséssel**, ⛔ nem szint-számolással.
   *
   * ## 🔴 KÉT MÉRT HIBA VEZETETT IDE (2026-09-11 11:02 és 11:08)
   *
   * **(1) `__dirname` ESM-ben.** A szerver `"type": "module"`, ahol a `__dirname` ⛔ **nem
   * létezik** ⇒ futásidőben `ReferenceError`. ⚠️ A `tsc` **zöld** volt, mert a `@types/node`
   * **globálisan deklarálja** ⇒ a hiba **csak élő hívásra** derült ki:
   * `GET /api/linkedin/profile-update` → `MA-LINKEDIN-PROFILE-READ-FAILED`.
   *
   * **(2) A SZINT-SZÁMOLÁS nem lehet helyes MINDKÉT futásban.** Mérve:
   *
   * ```
   * src:    server/src/_routes/linkedin         → 4 szint = a repo gyökere
   * build:  server/build/server/src/_routes/…   → 5 szint = a repo gyökere
   * ```
   *
   * ⇒ Egy fix szám **vagy** a `tsx`-es fejlesztői futásban, **vagy** a buildben téved. ⚠️ És a
   * build-oldali tévedés **nem kivétel**, hanem **csendes üresség**: a panel
   * *„nincs mit frissíteni"* / *„még nincs piszkozat"*-ot mutatna. Az a legrosszabb kimenetel.
   *
   * ⭐ Ezért **jelölőt** keresünk *(`__agent` + `cli`)*, a CLI `resolveProjectRoot` mintája
   * szerint — az **független** attól, honnan futunk.
   */
  static resolveRepoRoot(): string {
    const from: string = dirname(fileURLToPath(import.meta.url));
    let directory: string = from;

    for (let depth: number = 0; depth < 10; depth += 1) {
      if (existsSync(join(directory, '__agent')) && existsSync(join(directory, 'cli'))) {
        return directory;
      }

      const parent: string = join(directory, '..');

      if (parent === directory) break;
      directory = parent;
    }

    // ⛔ NEM NÉMA: a hívó `DyFM_Error`-t kap — a **csendes üresség** helyett **kimondott** hiba.
    throw new Error(
      `A projekt gyökere nem található (\`__agent\` + \`cli\` jelölő) — a keresés innen indult: ${from}`,
    );
  }

  /**
   * Egy szöveges mező kiolvasása **ismeretlen** kérés-törzsből. ⛔ Átcímkézés nélkül.
   *
   * ⚠️ A felület bármit küldhet: ez **idegen adat**. Egy `as` azt állítaná, hogy ismerjük az
   * alakját — ⭐ helyette szerkezetileg olvasunk.
   */
  static readStringField(body: unknown, field: string): string {
    if (!body || typeof body !== 'object') return '';

    for (const [name, value] of Object.entries(body)) {
      if (name === field) return typeof value === 'string' ? value : '';
    }

    return '';
  }

  /** Egy logikai mező kiolvasása ismeretlen kérés-törzsből. */
  static readBooleanField(body: unknown, field: string): boolean {
    if (!body || typeof body !== 'object') return false;

    for (const [name, value] of Object.entries(body)) {
      if (name === field) return value === true;
    }

    return false;
  }

  /**
   * Egy **haladás-jelölő** lista beolvasása a futásidejű állapot-fájlból.
   *
   * @param path az állapot-fájl · @param key a listát tartó mező neve.
   * @returns a jelölők, vagy **üres lista** hiányzó/sérült fájlnál.
   *
   * ⚠️ **A SÉRÜLT ÁLLAPOT NEM AKADÁLY**: a legrosszabb, ami történik, hogy az owner újra
   * kipipálja. ⛔ Egy kivétel viszont a TELJES panelt megbuktatná.
   *
   * ⛔ **DE NEM NÉMÁN**: a haladás elvesztése **jel** — ha ismétlődik, az állapot-fájllal
   * tartósan elromlott valami, és azt tudni kell.
   */
  static async readStateList(path: string, key: string): Promise<string[]> {
    if (!existsSync(path)) return [];

    try {
      const parsed: unknown = JSON.parse(await readFile(path, 'utf-8'));

      if (!parsed || typeof parsed !== 'object') return [];

      for (const [name, value] of Object.entries(parsed)) {
        if (name !== key || !Array.isArray(value)) continue;

        return value.filter((item: unknown): item is string => typeof item === 'string');
      }

      return [];
    } catch (error: unknown) {
      SwallowedFailure_Util.report(`linkedin.panel.readStateList.${key}`, error);

      return [];
    }
  }

  /**
   * A haladás-jelölő lista mentése.
   *
   * ⚠️ **Átmeneti fájl + átnevezés**: egy megszakadt írás ⛔ nem hagyhat félkész állapotot,
   * mert onnantól a panel **hibás** haladást mutatna.
   */
  static async writeStateList(path: string, key: string, values: string[]): Promise<void> {
    const temporary: string = `${path}.tmp`;

    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(
      temporary,
      `${JSON.stringify({ [key]: values, updatedAt: new Date().toISOString() }, null, 2)}\n`,
      'utf-8',
    );
    await rename(temporary, path);
  }
}
