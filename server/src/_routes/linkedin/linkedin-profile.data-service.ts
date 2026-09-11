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
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { DyFM_Error } from '@futdevpro/fsm-dynamo';

import { LinkedInPanelFiles_Util } from './linkedin-panel-files.util.js';

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

// 🔴 A GYÖKÉR-FELOLDÁS a közös `LinkedInPanelFiles_Util`-ban lakik — ⭐ EGY tulajdonos.
// ⚠️ MIÉRT KÖLTÖZÖTT (2026-09-11 18:22): a poszt-panel ugyanezt igényelte, és a
// `code-duplication` review 70 sor azonos blokkot talált. A gyökér-feloldás egy **mért,
// éles hiba** helye volt (`__dirname` ESM-ben + szint-számolás) — két példányban a
// következő javítás az egyikben maradna, és a másik panel CSENDBEN romlana tovább.

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
      const root: string = LinkedInPanelFiles_Util.resolveRepoRoot();

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
      const key: string = LinkedInPanelFiles_Util.readStringField(body, 'key');
      const isPasted: boolean = LinkedInPanelFiles_Util.readBooleanField(body, 'isPasted');
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

  /** Amit már beillesztett. ⚠️ A közös mechanika olvassa — ⭐ egy tulajdonos. */
  private async readPasted(): Promise<string[]> {
    return LinkedInPanelFiles_Util.readStateList(resolvePasteStatePath(), 'pasted');
  }

  /** Az állapot mentése — átmeneti fájl + átnevezés a közös mechanikában. */
  private async writePasted(pasted: string[]): Promise<void> {
    return LinkedInPanelFiles_Util.writeStateList(resolvePasteStatePath(), 'pasted', pasted);
  }
}
