// Discord-figyelő FELÜGYELŐ — a szerver tartja életben a bejövő Discord-csatornát.
//
// 🔴 MIÉRT A SZERVERBEN (owner, 2026-09-06): *„a szervernek kéne futnia, a szervernek kéne
// ezt figyelnie, és amúgy azért kéne LDP-vel futtassuk, hogy folyamatosan fusson."*
// A figyelő korábban külön, kézzel indított folyamat volt — így amikor nem futott, a
// Discordra írt üzenet kívülről pontosan úgy nézett ki, mintha meg sem írták volna.
// A szerver viszont az LDP alatt folyamatosan fut és újraindul, tehát ez a helyes gazda.
//
// ⛔ NEM másoljuk ide a figyelő logikáját. A kanonikus megvalósítás a CLI-ben van
// (`cli/src/discord/`), egységtesztekkel; a szerver **gyermek-folyamatként** futtatja és
// **felügyeli**. Egy forrás, egy igazság (`current/principles/ssot.md`).
//
// Amit a felügyelet ad a puszta indításon felül:
//   • összeomlás után ÚJRAINDÍT (exponenciális várakozással, hogy a hibás konfig ne pörögjön),
//   • a gyermek utolsó kimeneti sorait MEGŐRZI, és a hiba-bejegyzésbe teszi — így a
//     naplóból kiderül, MI a baj, nem csak az, hogy „meghalt",
//   • ha MÁSHOL már fut egy figyelő (friss életjel), NEM indít másodikat.

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { emitServerActionLog } from '../_collections/action-log.util';

/** Indítás előtti türelmi idő — hagyjuk a szervert felállni. */
const BOOT_GRACE_MS: number = 8_000;

/** Az újraindítási várakozás alsó és felső határa. */
const RESTART_DELAY_MIN_MS: number = 5_000;
const RESTART_DELAY_MAX_MS: number = 5 * 60_000;

/** Ennyi ideig futva tekintjük a gyermeket „egészségesnek" (nulláz a várakozás). */
const HEALTHY_RUN_MS: number = 60_000;

/** Ennél frissebb életjel esetén már fut valahol egy figyelő — nem indítunk másodikat. */
const FOREIGN_HEARTBEAT_FRESH_MS: number = 3 * 60_000;

/** Ennyi ideig várunk, mielőtt újranéznénk, hogy az idegen figyelő még él-e. */
const FOREIGN_RECHECK_MS: number = 60_000;

/** Ennyi kimeneti sort őrzünk meg a gyermekből a hiba-diagnosztikához. */
const OUTPUT_TAIL_LINES: number = 12;

/**
 * A Discord-figyelő gyermek-folyamat felügyelője.
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

  private child: ChildProcess | null = null;
  private restartDelayMs: number = RESTART_DELAY_MIN_MS;
  private consecutiveFastFailures: number = 0;
  private stopping: boolean = false;
  private startTimer: NodeJS.Timeout | null = null;

  /** A gyermek utolsó kimeneti sorai — ez teszi a hibát olvashatóvá. */
  private readonly outputTail: string[] = [];

  private constructor() {
    this.scheduleStart(BOOT_GRACE_MS);

    // A szerver leállásakor a gyermek is menjen — különben árva figyelő marad hátra,
    // ami a következő indulásnál dupla kapcsolatot jelentene.
    process.once('exit', (): void => {
      this.stop();
    });

    // 🔴 A JEL-KEZELŐ ÖNMAGÁBAN VESZÉLYES: amint a Node-on van `SIGINT`/`SIGTERM` figyelő,
    // az ALAPÉRTELMEZETT leállás ELMARAD. Kezelő nélkül a Ctrl+C és a szabályos leállítás
    // megölné a szervert; kezelővel viszont a folyamat csak… tovább futna. Az LDP
    // újraindítása így két párhuzamos szervert hagyna hátra.
    // Ezért: takarítunk, majd ÚJRAKÜLDJÜK a jelet — a `once` addigra levette a kezelőt,
    // tehát a második jel már az alapértelmezett viselkedést váltja ki.
    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
      process.once(signal, (): void => {
        this.stop();
        process.kill(process.pid, signal);
      });
    }
  }

  /** A felügyelet leállítása — a gyermeket is elengedjük. */
  stop(): void {
    this.stopping = true;

    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }

    if (this.child && this.child.exitCode === null) {
      this.child.kill();
    }

    this.child = null;
  }

  /** Időzített indítás — minden újrapróbálkozás ezen megy át. */
  private scheduleStart(delayMs: number): void {
    if (this.stopping) return;

    if (this.startTimer) clearTimeout(this.startTimer);

    this.startTimer = setTimeout((): void => {
      void this.start();
    }, delayMs);

    // Ne tartsa életben a folyamatot pusztán ez az időzítő.
    this.startTimer.unref();
  }

  /**
   * Egy indítási kísérlet.
   *
   * Előbb a KÖRNYEZETET ellenőrizzük (van-e mit futtatni, fut-e már máshol), és csak
   * utána indítunk. A hiányzó feltételt leíró bejegyzésként naplózzuk — orvoslással
   * együtt —, mert a néma nem-indulás pont az a hiba, ami ellen ez az egész készült.
   */
  private async start(): Promise<void> {
    if (this.stopping || this.child) return;

    const paths: DiscordListenerPaths = resolveListenerPaths();

    if (!existsSync(paths.tsxCli) || !existsSync(paths.cliEntry)) {
      await emitServerActionLog({
        actor: 'server',
        kind: 'error',
        summary: '[MA-DISCORD-LISTENER-MISSING] A Discord-figyelő nem indítható: hiányzik a futtatandó fájl.',
        extra: {
          errorCode: 'MA-DISCORD-LISTENER-MISSING',
          issuer: 'discord-listener.start',
          tsxCli: paths.tsxCli,
          cliEntry: paths.cliEntry,
          remedy: 'Futtasd a `pnpm i`-t a projekt gyökerében (tsx), és ellenőrizd, hogy megvan-e a `cli/src/main.ts`.',
        },
      });

      // Ez konfigurációs hiány, nem átmeneti zavar — ritkán próbálkozunk újra.
      this.scheduleStart(RESTART_DELAY_MAX_MS);

      return;
    }

    const foreign: ForeignListenerState = readForeignHeartbeat();

    if (foreign.fresh) {
      // Máshol már fut egy figyelő (pl. ütemezett feladatként). Két párhuzamos
      // gateway-kapcsolat fölösleges, ezért csak figyeljük, hogy él-e még.
      this.scheduleStart(FOREIGN_RECHECK_MS);

      return;
    }

    const startedAt: number = Date.now();

    this.outputTail.length = 0;

    const child: ChildProcess = spawn(
      process.execPath,
      [paths.tsxCli, paths.cliEntry, 'comm', 'listen'],
      {
        cwd: paths.cliDir,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      },
    );

    this.child = child;

    child.stdout?.on('data', (chunk: Buffer): void => {
      this.captureOutput(chunk.toString());
    });

    child.stderr?.on('data', (chunk: Buffer): void => {
      this.captureOutput(chunk.toString());
    });

    // 🔴 A VÉGET KÉTFÉLEKÉPPEN is meg kell fognunk. Ha a folyamat el sem tud indulni
    // (pl. hiányzó futtatható fájl), a Node `error`-t emit-el, és az `exit` a
    // dokumentáció szerint „may or may not fire" — ha csak arra hallgatnánk, a felügyelet
    // NÉMÁN ÖRÖKRE LEÁLLNA. Ezért az `error`/`exit`/`close` közül az ELSŐ indít újra, a
    // többit a zászló elnyeli (különben háromszoros újraindítás lenne).
    let ended: boolean = false;
    const finish = (code: number | null, signal: NodeJS.Signals | null): void => {
      if (ended) return;

      ended = true;
      this.child = null;
      void this.handleExit({ code, signal, ranMs: Date.now() - startedAt });
    };

    child.on('error', (err: Error): void => {
      this.captureOutput(`[spawn-error] ${err.message}`);
      finish(null, null);
    });

    child.on('exit', (code: number | null, signal: NodeJS.Signals | null): void => {
      finish(code, signal);
    });

    child.on('close', (code: number | null, signal: NodeJS.Signals | null): void => {
      finish(code, signal);
    });

    await emitServerActionLog({
      actor: 'server',
      kind: 'external-action',
      summary: `Discord-figyelő elindítva (pid=${child.pid ?? '?'}).`,
      extra: { issuer: 'discord-listener.start', pid: child.pid, cwd: paths.cliDir },
    });
  }

  /**
   * A gyermek kilépésének kezelése.
   *
   * A GYORSAN elhaló gyermek mást jelent, mint a sokáig futó: az előbbi majdnem mindig
   * konfigurációs hiba (rossz token, hiányzó jog), az utóbbi hálózati zavar. Ezért a
   * gyors bukást a MEGŐRZÖTT KIMENETTEL együtt naplózzuk, és lassuló ütemben próbáljuk újra.
   */
  private async handleExit(exit: { code: number | null; signal: NodeJS.Signals | null; ranMs: number }): Promise<void> {
    if (this.stopping) return;

    const healthy: boolean = exit.ranMs >= HEALTHY_RUN_MS;

    if (healthy) {
      this.restartDelayMs = RESTART_DELAY_MIN_MS;
      this.consecutiveFastFailures = 0;
    } else {
      this.consecutiveFastFailures += 1;
      this.restartDelayMs = Math.min(this.restartDelayMs * 2, RESTART_DELAY_MAX_MS);
    }

    await emitServerActionLog({
      actor: 'server',
      kind: healthy ? 'external-action' : 'error',
      summary: healthy
        ? `Discord-figyelő leállt ${Math.round(exit.ranMs / 1000)}s futás után — újraindítás.`
        : `[MA-DISCORD-LISTENER-CRASH] A Discord-figyelő ${Math.round(exit.ranMs / 1000)}s után kilépett `
          + `(kód=${exit.code ?? 'n/a'}, jel=${exit.signal ?? 'n/a'}).`,
      extra: {
        ...(healthy ? {} : { errorCode: 'MA-DISCORD-LISTENER-CRASH' }),
        issuer: 'discord-listener.exit',
        exitCode: exit.code,
        signal: exit.signal,
        ranMs: exit.ranMs,
        consecutiveFastFailures: this.consecutiveFastFailures,
        retryInMs: this.restartDelayMs,
        // EZ a diagnosztika lényege: a gyermek saját szava arról, mi hiányzott.
        lastOutput: this.outputTail.slice(-OUTPUT_TAIL_LINES),
        remedy: 'Futtasd: `ma comm doctor` — az kiírja, melyik feltétel hiányzik (token, csatorna, jogosultság).',
      },
    });

    this.scheduleStart(this.restartDelayMs);
  }

  /** A gyermek kimenetének gyűjtése — csak az utolsó néhány sort tartjuk meg. */
  private captureOutput(text: string): void {
    for (const line of text.split('\n')) {
      const trimmed: string = line.trim();

      if (!trimmed) continue;

      this.outputTail.push(trimmed);
    }

    if (this.outputTail.length > OUTPUT_TAIL_LINES) {
      this.outputTail.splice(0, this.outputTail.length - OUTPUT_TAIL_LINES);
    }
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

interface ForeignListenerState {
  fresh: boolean;
  ageMs?: number;
}

/**
 * Fut-e MÁSHOL egy figyelő?
 *
 * A CLI figyelője percenként életjelet ír; ha az friss, akkor él. Olvasási hiba esetén
 * „nem fut"-ot mondunk — az óvatos irány: legfeljebb egy fölösleges kapcsolat lesz,
 * szemben azzal, hogy egyáltalán nem figyel senki.
 */
function readForeignHeartbeat(): ForeignListenerState {
  const file: string = path.join(homedir(), '.config', 'my-assistant', 'discord', 'listener-heartbeat.json');

  try {
    if (!existsSync(file)) return { fresh: false };

    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as { updatedAt?: string; pid?: number };
    const updatedMs: number = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : Number.NaN;

    if (Number.isNaN(updatedMs)) return { fresh: false };

    const ageMs: number = Date.now() - updatedMs;

    // A SAJÁT, korábbi futásunk életjele nem számít idegennek — az a folyamat már halott.
    if (typeof parsed.pid === 'number' && !isProcessAlive(parsed.pid)) return { fresh: false, ageMs };

    return { fresh: ageMs <= FOREIGN_HEARTBEAT_FRESH_MS, ageMs };
  } catch {
    return { fresh: false };
  }
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
