// ✍️ A POSZT-PISZKOZATOK ADATAI — a fájlpárok olvasása és a pipa mentése.
//
// ## Mi hol van, és MIÉRT ott
//
// | adat | hely | miért |
// |---|---|---|
// | a poszt **szövege** | `current/linkedin/post-drafts/<id>.body.txt` | ⭐ ezt az **asszisztens**
// |   | | írja *(⛔ nem a DEV)*, és **verziózva** kell lennie |
// | az **indoklás** | `current/linkedin/post-drafts/<id>.md` | miért így szól — az ownernek is |
// | a **pipa** *(mit posztolt ki)* | `~/.config/my-assistant/linkedin/` | ⚠️ **futásidejű
// |   | | állapot**, ⛔ nem a repóba |
//
// ⛔ **Olvasási hibát NEM nyelünk el némán**: a hívó `DyFM_Error`-ba fordítja, mert egy üres
// panel *(„még nincs piszkozat")* és egy olvasási hiba kívülről **ugyanúgy néz ki**.
//
// ## 🔴 MIÉRT NEM A `current/linkedin/drafts/` MAPPÁT OLVASSUK
//
// ⚠️ **Mérve 2026-09-11:** az a mappa **üzenet-válaszokat** tartalmaz
// *(`README.md` → „LinkedIn VÁLASZ-piszkozatok"; a `.md`-kben `thread:` azonosító)*, és azok az
// owner sorrendjében a **HARMADIK** tétel *(profil → posztok → **üzenetek**)*.
//
// 🔴 És nem csak sorrend-kérdés: az üzenet-piszkozatokban **óradíj és telefonszám** van. Egy
// „posztok" panelen megjeleníteni őket ⛔ nem elírás, hanem **adat-kiszivárgás a rossz
// felületre**. ⇒ A posztoknak **saját mappája** van, ugyanazzal a **két-fájlos alakkal**.

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { DyFM_Error } from '@futdevpro/fsm-dynamo';

import { LinkedInPanelFiles_Util } from './linkedin-panel-files.util.js';

/**
 * A CLI piszkozat-modul betöltése.
 *
 * 🔴 A FUTÁSIDEI HIVATKOZÁS **RELATÍV**, NEM `@cli/...` ALIAS — MÉRVE 2026-09-10.
 * A `tsconfig` `paths` bejegyzése **csak fordítási időben** létezik; a `tsx` futásidőben NEM
 * alkalmazza a dinamikus importra. ⚠️ A Google- és a Spotify-panel **élesben elromlott** emiatt,
 * miközben a típus-ellenőrzés **zöld** volt.
 */
let cliModulePromise: Promise<typeof import('@cli/linkedin/linkedin-post-drafts')> | null = null;

function loadDraftsModule(): Promise<typeof import('@cli/linkedin/linkedin-post-drafts')> {
  cliModulePromise ??= import('../../../../cli/src/linkedin/linkedin-post-drafts.js');

  return cliModulePromise;
}

/** A futásidejű állapot fájlja. */
function resolvePostStatePath(): string {
  return join(homedir(), '.config', 'my-assistant', 'linkedin', 'post-draft-state.json');
}

/** Egy piszkozat-fájlpár nyers tartalma. ⚠️ Szándékosan nem exportált. */
interface DraftSource {
  id: string;
  body: string;
  markdown?: string;
}

/** A LinkedIn poszt-piszkozatok adatai. */
export class LinkedinPosts_DataService {

  /**
   * A piszkozat-lista — posztonként a másolható szöveg, a limit és a pipa.
   *
   * ⛔ **A HIBA NEM LEHET NÉMA**: enélkül a panel üresen állna, és úgy néznénk ki, mintha nem
   * lenne piszkozat — pedig olvasási hiba van. A kettő kívülről **ugyanúgy néz ki**.
   */
  async readDrafts(): Promise<unknown> {
    try {
      const cli = await loadDraftsModule();
      const sources: DraftSource[] = await this.readSources();

      return cli.LinkedinPostDrafts_Util.buildList({
        sources: sources,
        posted: await this.readPosted(),
      });
    } catch (error: unknown) {
      throw new DyFM_Error({
        error: error,
        errorCode: 'MA-LINKEDIN-POSTS-READ-FAILED',
        message: 'A poszt-piszkozatok nem olvashatók.',
      });
    }
  }

  /**
   * A „kiposztoltam" jelölés mentése.
   *
   * ⭐ MIÉRT KELL: ugyanaz, mint a profilnál — *„különben nem tudja, hol tartott, ha
   * félbeszakad"*. Több poszt kiküldése több menet.
   *
   * ⚠️ A kérés-törzs **ismeretlen érték**: a felület bármit küldhet. Az ellenőrzés a CLI tiszta
   * függvényében történik, a **tényleg létező** piszkozatok listájához mérve.
   */
  async markPosted(body: unknown): Promise<unknown> {
    try {
      const cli = await loadDraftsModule();
      const sources: DraftSource[] = await this.readSources();
      const next: string[] = cli.LinkedinPostDrafts_Util.togglePosted(
        await this.readPosted(),
        LinkedInPanelFiles_Util.readStringField(body, 'id'),
        LinkedInPanelFiles_Util.readBooleanField(body, 'isPosted'),
        sources.map((source: DraftSource): string => source.id),
      );

      await this.writePosted(next);

      return this.readDrafts();
    } catch (error: unknown) {
      throw new DyFM_Error({
        error: error,
        errorCode: 'MA-LINKEDIN-POSTS-MARK-FAILED',
        message: 'A „kiposztoltam" jelölés nem menthető.',
      });
    }
  }

  /**
   * A piszkozat-fájlpárok beolvasása.
   *
   * ⚠️ **A HIÁNYZÓ MAPPA NEM HIBA**: az asszisztens még nem írt piszkozatot. Ilyenkor üres
   * listát adunk, és a panel ezt **kimondja** *(`hasDrafts: false`)*.
   *
   * ⭐ A `.body.txt` a **vezető** fájl: ami mellé nincs `.md`, az is érvényes piszkozat
   * *(csak nincs indoklás)*. ⛔ Fordítva nem: indoklás **szöveg nélkül** nem poszt.
   */
  private async readSources(): Promise<DraftSource[]> {
    const cli = await loadDraftsModule();
    const directory: string = join(
      LinkedInPanelFiles_Util.resolveRepoRoot(),
      ...cli.LinkedinPostDrafts_Util.DRAFTS_DIRECTORY.split('/'),
    );

    if (!existsSync(directory)) return [];

    const entries: string[] = await readdir(directory);
    const bodies: string[] = entries.filter((name: string): boolean => name.endsWith('.body.txt'));
    const sources: DraftSource[] = [];

    for (const name of bodies) {
      const id: string = name.slice(0, -'.body.txt'.length);
      const markdownPath: string = join(directory, `${id}.md`);

      sources.push({
        id: id,
        body: await readFile(join(directory, name), 'utf-8'),
        ...(existsSync(markdownPath)
          ? { markdown: await readFile(markdownPath, 'utf-8') }
          : {}),
      });
    }

    return sources;
  }

  /** Amit már kiposztolt. ⚠️ A közös mechanika olvassa — ⭐ egy tulajdonos. */
  private async readPosted(): Promise<string[]> {
    return LinkedInPanelFiles_Util.readStateList(resolvePostStatePath(), 'posted');
  }

  /** Az állapot mentése — átmeneti fájl + átnevezés a közös mechanikában. */
  private async writePosted(posted: string[]): Promise<void> {
    return LinkedInPanelFiles_Util.writeStateList(resolvePostStatePath(), 'posted', posted);
  }
}
