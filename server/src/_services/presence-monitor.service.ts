// Jelenlét-figyelő — a szerver tartja életben.
//
// 🔴 MIÉRT (owner, 2026-09-06): *„Azt a jelenlétfigyelőt is vagy integrálni kéne a My
// Assistant szerverbe, vagy neki kéne indítania."*
//
// A tét NEM elméleti: ez a figyelő **112 napig volt halott** anélkül, hogy bárki észrevette
// volna, mert az indítása ütemezett feladaton múlt, amit senki nem ellenőrzött. Enélkül nem
// tudjuk, hogy az owner itthon van-e ⇒ a hangszórós kapu **ismeretlen** jelet lát és **TILT**.
//
// ⛔ NEM írjuk újra TypeScriptben. A mérés Win32 API-t használ (aktív ablak + üresjárati idő),
// és `server/activity-monitor/logger.ps1`-ben él, működő formában. A szerver **futtatja és
// felügyeli** (`supervised-child.ts`) — egy forrás, egy igazság.

import { existsSync, readdirSync, statSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { registerShutdownHooks, SupervisedChild } from './supervised-child.js';

/**
 * Indítás előtti türelmi idő.
 *
 * Szándékosan HOSSZABB, mint a Discord-figyelőé: a két gyermek így nem egyszerre pörgeti föl
 * a gépet a szerver indulásakor.
 */
const BOOT_GRACE_MS: number = 15_000;

/**
 * Ennél frissebb minta esetén már fut valahol egy figyelő.
 *
 * A logger percenként ír; a háromszoros ablak elbírja az egy-két kihagyott kört anélkül,
 * hogy fölöslegesen indítanánk egy másodikat.
 */
export const SAMPLE_FRESH_MS: number = 3 * 60_000;

/**
 * A jelenlét-figyelő felügyelője.
 *
 * `PresenceMonitor_Service.getInstance()` triggereli a singleton-példányt; az
 * `app.server.ts` `getRootServices()`-ben példányosítja boot-időben.
 */
export class PresenceMonitor_Service {

  private static instance: PresenceMonitor_Service | null = null;

  /** Singleton accessor. */
  static getInstance(): PresenceMonitor_Service {
    if (!PresenceMonitor_Service.instance) {
      PresenceMonitor_Service.instance = new PresenceMonitor_Service();
    }

    return PresenceMonitor_Service.instance;
  }

  private readonly supervisor: SupervisedChild;

  private constructor() {
    const paths: PresenceMonitorPaths = resolvePresencePaths();

    this.supervisor = new SupervisedChild({
      label: 'Jelenlét-figyelő',
      errorCode: 'MA-PRESENCE-MONITOR',
      // Windows PowerShell — a szkript Win32 API-t hív, ezért nem futtatható másképp.
      execute: 'powershell.exe',
      args: ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', paths.loggerScript],
      cwd: paths.monitorDir,
      bootGraceMs: BOOT_GRACE_MS,
      checkPrerequisites: () => {
        // A mérés Win32 API-ra épül — más rendszeren értelmetlen újra és újra próbálkozni.
        if (process.platform !== 'win32') {
          return {
            ok: false,
            problem: `a jelenlét-mérés Windows-specifikus, ez a rendszer viszont "${process.platform}".`,
            remedy: 'Windowson futtasd, vagy vezess be egy platform-független jelenlét-jelet '
              + '(nyitott kérdés: current/open-questions.md H).',
          };
        }

        if (existsSync(paths.loggerScript)) return { ok: true };

        return {
          ok: false,
          problem: `hiányzik a figyelő szkript (${paths.loggerScript}).`,
          remedy: 'Ellenőrizd, hogy megvan-e a `server/activity-monitor/logger.ps1` a munkafában.',
        };
      },
      isRunningElsewhere: (): boolean => isSampleFresh(paths.dataDir),
      crashRemedy: 'Futtasd: `ma comm doctor` — a „Jelenlét-figyelő" sor megmondja, mikor volt '
        + 'az utolsó mérés. Ha a szkript azonnal kilép, a fenti `lastOutput` mutatja, mit írt ki.',
    });

    registerShutdownHooks(this.supervisor);
    this.supervisor.begin();
  }

  /** A felügyelet leállítása. */
  stop(): void {
    this.supervisor.stop();
  }
}

interface PresenceMonitorPaths {
  monitorDir: string;
  loggerScript: string;
  dataDir: string;
}

/** A figyelő szkript és az adatai. A `_services` mindkét elrendezésben három szint mély. */
function resolvePresencePaths(): PresenceMonitorPaths {
  const here: string = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot: string = path.resolve(here, '..', '..', '..');
  const monitorDir: string = path.join(projectRoot, 'server', 'activity-monitor');

  return {
    monitorDir,
    loggerScript: path.join(monitorDir, 'logger.ps1'),
    dataDir: path.join(monitorDir, 'data'),
  };
}

/**
 * Írt-e valaki NEMRÉG mintát?
 *
 * Ez a jelenlét-figyelő „életjele": a logger percenként hozzáfűz a napi fájlhoz, tehát a
 * legfrissebb fájl módosítási ideje elárulja, fut-e. Így akkor sem indítunk másodikat, ha az
 * owner később mégis beállítja az ütemezett feladatot.
 *
 * Hiba esetén `false` — az ÓVATOS irány: legfeljebb egy fölösleges példány indul, szemben
 * azzal, hogy senki nem méri, és a hangszóró némán tiltva marad.
 */
function isSampleFresh(dataDir: string): boolean {
  try {
    if (!existsSync(dataDir)) return false;

    let newestMs: number = 0;

    for (const name of readdirSync(dataDir)) {
      if (!name.endsWith('.jsonl')) continue;

      const modifiedMs: number = statSync(path.join(dataDir, name)).mtimeMs;

      if (modifiedMs > newestMs) newestMs = modifiedMs;
    }

    return isFreshSample(newestMs, Date.now());
  } catch {
    return false;
  }
}

/**
 * Friss-e a legutóbbi minta? Tiszta függvény, hogy fájlrendszer nélkül tesztelhető legyen.
 *
 * A `0` (nincs egyetlen minta sem) SOSEM friss — enélkül egy üres adatkönyvtár „fut már
 * valaki"-t jelentene, és a figyelő soha nem indulna el.
 */
export function isFreshSample(newestSampleMs: number, nowMs: number): boolean {
  if (!newestSampleMs) return false;

  return nowMs - newestSampleMs <= SAMPLE_FRESH_MS;
}
