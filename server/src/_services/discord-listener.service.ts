// Discord-figyelő — a szerver tartja életben a bejövő Discord-csatornát.
//
// 🔴 MIÉRT A SZERVERBEN (owner, 2026-09-06): *„a szervernek kéne futnia, a szervernek kéne
// ezt figyelnie, és amúgy azért kéne LDP-vel futtassuk, hogy folyamatosan fusson."*
// A figyelő korábban külön, kézzel indított folyamat volt — így amikor nem futott, a
// Discordra írt üzenet kívülről pontosan úgy nézett ki, mintha meg sem írták volna.
//
// ⛔ NEM másoljuk ide a figyelő logikáját. A kanonikus megvalósítás a CLI-ben van
// (`cli/src/discord/`), egységtesztekkel; a szerver **gyermek-folyamatként** futtatja és
// **felügyeli** (`supervised-child.ts`). Egy forrás, egy igazság (`current/principles/ssot.md`).

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerShutdownHooks, SupervisedChild } from './supervised-child.js';

/** Indítás előtti türelmi idő — hagyjuk a szervert felállni. */
const BOOT_GRACE_MS: number = 8_000;

/** Ennél frissebb életjel esetén már fut valahol egy figyelő — nem indítunk másodikat. */
const HEARTBEAT_FRESH_MS: number = 3 * 60_000;

/**
 * A Discord-figyelő felügyelője.
 *
 * `DiscordListener_Service.getInstance()` triggereli a singleton-példányt; az
 * `app.server.ts` `getRootServices()`-ben példányosítja boot-időben — ugyanaz a minta,
 * mint a `WeatherPoll_Service`-nél.
 */
export class DiscordListener_Service {

  private static instance: DiscordListener_Service | null = null;

  /** Singleton accessor. */
  static getInstance(): DiscordListener_Service {
    if (!DiscordListener_Service.instance) {
      DiscordListener_Service.instance = new DiscordListener_Service();
    }

    return DiscordListener_Service.instance;
  }

  private readonly supervisor: SupervisedChild;

  private constructor() {
    const paths: DiscordListenerPaths = resolveListenerPaths();

    this.supervisor = new SupervisedChild({
      label: 'Discord-figyelő',
      errorCode: 'MA-DISCORD-LISTENER',
      execute: process.execPath,
      args: [paths.tsxCli, paths.cliEntry, 'comm', 'listen'],
      cwd: paths.cliDir,
      bootGraceMs: BOOT_GRACE_MS,
      checkPrerequisites: () => {
        if (existsSync(paths.tsxCli) && existsSync(paths.cliEntry)) return { ok: true };

        return {
          ok: false,
          problem: `hiányzik a futtatandó fájl (${paths.tsxCli} vagy ${paths.cliEntry}).`,
          remedy: 'Futtasd a `pnpm i`-t a projekt gyökerében (tsx), és ellenőrizd, hogy megvan-e a `cli/src/main.ts`.',
        };
      },
      isRunningElsewhere: isListenerAliveElsewhere,
      crashRemedy: 'Futtasd: `ma comm doctor` — az kiírja, melyik feltétel hiányzik '
        + '(token, csatorna, jogosultság).',
    });

    registerShutdownHooks(this.supervisor);
    this.supervisor.begin();
  }

  /** A felügyelet leállítása. */
  stop(): void {
    this.supervisor.stop();
  }
}

interface DiscordListenerPaths {
  cliDir: string;
  cliEntry: string;
  tsxCli: string;
}

/**
 * A futtatáshoz szükséges útvonalak.
 *
 * A build- és a forrás-elrendezés is `server/{build|src}/_services/` — mindkettőből
 * három szint fel a projekt gyökere (ugyanaz a megfontolás, mint az `action-log.util`-ban).
 */
function resolveListenerPaths(): DiscordListenerPaths {
  const here: string = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot: string = path.resolve(here, '..', '..', '..');

  return {
    cliDir: path.join(projectRoot, 'cli'),
    cliEntry: path.join(projectRoot, 'cli', 'src', 'main.ts'),
    tsxCli: path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
  };
}

/**
 * Fut-e MÁSHOL egy figyelő?
 *
 * A CLI figyelője percenként életjelet ír, benne a saját folyamat-azonosítójával. Az életjel
 * FRISSESSÉGE önmagában nem elég: egy épp elhalt figyelő jele percekig „foglaltnak" mutatná a
 * csatornát. Ezért a folyamat létezését is megnézzük.
 *
 * Olvasási hiba esetén „nem fut"-ot mondunk — ez az ÓVATOS irány.
 */
function isListenerAliveElsewhere(): boolean {
  const file: string = resolveListenerHeartbeatFile();

  try {
    if (!existsSync(file)) return false;

    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as { updatedAt?: string; pid?: number };
    const updatedMs: number = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : Number.NaN;

    if (Number.isNaN(updatedMs)) return false;
    if (Date.now() - updatedMs > HEARTBEAT_FRESH_MS) return false;

    // A SAJÁT, korábbi futásunk életjele nem számít idegennek — az a folyamat már halott.
    if (typeof parsed.pid === 'number' && !isProcessAlive(parsed.pid)) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * A Discord-figyelő ÉLETJEL-fájlja.
 *
 * SSOT: az útvonalat a szerveren belül CSAK itt képezzük — a `system-pulse.service.ts` is
 * innen kéri. A CLI oldali párja: `cli/src/discord/discord.heartbeat.ts` →
 * `resolveHeartbeatPath()`.
 */
export function resolveListenerHeartbeatFile(): string {
  return path.join(homedir(), '.config', 'my-assistant', 'discord', 'listener-heartbeat.json');
}

/** Él-e még az adott folyamat? A `kill(pid, 0)` nem küld jelet, csak létezést kérdez. */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);

    return true;
  } catch {
    return false;
  }
}
