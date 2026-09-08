// FELÜGYELT GYERMEK-FOLYAMAT — közös váz a szerver által életben tartott háttér-figyelőkhöz.
//
// 🔴 MIÉRT KÖZÖS (2026-09-06): a Discord-figyelő után a jelenlét-figyelő lett a MÁSODIK
// olyan folyamat, amit a szervernek kell életben tartania (owner: *„vagy integrálni kéne a
// My Assistant szerverbe, vagy neki kéne indítania"*). Ugyanaz a nem-triviális logika kell
// mindkettőhöz: lassuló újraindítás, a gyermek kimenetének megőrzése a diagnosztikához, és
// annak felismerése, hogy MÁSHOL már fut egy példány. Ha ezt kétszer írnánk meg, a két
// másolat garantáltan szétcsúszna — és a hibát mindig csak az egyikben javítanánk.
//
// ⛔ Ez a váz NEM tud semmit arról, MIT futtat. A figyelők logikája marad ott, ahol van
// (CLI, illetve PowerShell-szkript); ez csak a *futtatás* és a *felügyelet*.

import { spawn, type ChildProcess } from 'node:child_process';

import { ProcessAlive_Util } from '../_collections/process-alive.util.js';
import { emitServerActionLog } from '../_collections/action-log.util.js';

import {
  decideSupervisorAction,
  type SupervisorAction,
  type SupervisorDecision,
} from './supervisor-decision.js';

/** Az újraindítási várakozás alsó és felső határa. */
export const RESTART_DELAY_MIN_MS: number = 5_000;
export const RESTART_DELAY_MAX_MS: number = 5 * 60_000;

/** Ennyi ideig futva tekintjük a gyermeket „egészségesnek" (nullázza a várakozást). */
export const HEALTHY_RUN_MS: number = 60_000;

/** Ennyi ideig várunk, mielőtt újranéznénk, hogy egy MÁSHOL futó példány még él-e. */
export const FOREIGN_RECHECK_MS: number = 60_000;

/** Ennyi kimeneti sort őrzünk meg a gyermekből a hiba-diagnosztikához. */
export const OUTPUT_TAIL_LINES: number = 12;

export interface SupervisedChildConfig {
  /** Ember-olvasható név a naplóba (pl. „Discord-figyelő"). */
  label: string;
  /** Hiba-kód előtag a naplóhoz (pl. `MA-DISCORD-LISTENER`). */
  errorCode: string;
  /** A futtatandó program és argumentumai. */
  execute: string;
  args: string[];
  cwd: string;
  /** Türelmi idő az első indítás előtt — hagyjuk a szervert felállni. */
  bootGraceMs: number;
  /**
   * Indítható-e egyáltalán (megvannak-e a fájlok)? Ha `problem`-et ad vissza, NEM indítunk,
   * hanem leíró hibát naplózunk az orvoslással együtt.
   */
  checkPrerequisites: () => { ok: true } | { ok: false; problem: string; remedy: string };
  /**
   * Fut-e MÁR máshol egy példány? Ha igen, nem indítunk másodikat — csak visszanézünk később.
   * Bizonytalanság esetén `false` az ÓVATOS válasz: legfeljebb egy fölösleges példány lesz,
   * szemben azzal, hogy egyáltalán nem figyel senki.
   */
  isRunningElsewhere: () => boolean;
  /** Mit tegyen az owner, ha a gyermek folyton elhal. */
  crashRemedy: string;
}

/**
 * Egy gyermek-folyamat felügyelője.
 *
 * A hívó példányosítja és `begin()`-nel indítja; onnantól magáról gondoskodik.
 */
export class SupervisedChild {

  private child: ChildProcess | null = null;
  private restartDelayMs: number = RESTART_DELAY_MIN_MS;
  private consecutiveFastFailures: number = 0;
  private stopping: boolean = false;
  private startTimer: NodeJS.Timeout | null = null;

  /**
   * A legutóbb naplózott döntés.
   *
   * ⚠️ **Csak VÁLTOZÁSKOR naplózunk.** A felügyelő percenként dönt; minden kört naplózni
   * annyi zajt termelne, hogy a valódi esemény elveszne benne — és pont az a cél, hogy
   * kiszúrható legyen.
   */
  private lastLoggedAction: SupervisorAction | null = null;

  /** A gyermek utolsó kimeneti sorai — ez teszi a hibát olvashatóvá. */
  private readonly outputTail: string[] = [];

  constructor(private readonly config: SupervisedChildConfig) {}

  /** A felügyelet indítása (a türelmi idő után próbálkozik először). */
  begin(): void {
    this.scheduleStart(this.config.bootGraceMs);
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
      void this.attemptStart();
    }, delayMs);

    // Ne tartsa életben a folyamatot pusztán ez az időzítő.
    this.startTimer.unref();
  }

  /**
   * Egy indítási kísérlet.
   *
   * Előbb a KÖRNYEZETET ellenőrizzük (van-e mit futtatni, fut-e már máshol), és csak utána
   * indítunk. A hiányzó feltételt leíró bejegyzésként naplózzuk — orvoslással együtt —, mert
   * a néma nem-indulás pont az a hiba, ami ellen ez az egész készült.
   */
  private async attemptStart(): Promise<void> {
    // 🔴 A DÖNTÉS KIEMELVE — mérve 2026-09-08 11:30: a figyelő meghalt, és a felügyelő
    // **9+ percig** nem indított újat, **nulla** napló-bejegyzéssel. Az eredeti őrfeltétel
    // (`if (this.stopping || this.child) return;`) **újraütemezés nélkül** lépett ki, tehát egy
    // beragadt `child` hivatkozás **véglegesen** abbahagyatta a felügyeletet — némán.
    const prerequisites = this.config.checkPrerequisites();
    const decision: SupervisorDecision = decideSupervisorAction({
      stopping: this.stopping,
      childPid: this.child?.pid ?? null,
      // ⚠️ A `child` LÉTEZÉSE nem bizonyítja, hogy a folyamat él — az elmaradt `exit`
      // esemény pont ezt a hazugságot hozza létre.
      childAlive: this.child?.pid !== undefined && ProcessAlive_Util.isAlive(this.child.pid),
      prerequisitesOk: prerequisites.ok,
      runningElsewhere: this.config.isRunningElsewhere(),
    });

    await this.logDecisionChange(decision);

    if (decision.action === 'reclaim-dead-child') {
      // Elengedjük a halott hivatkozást, és AZONNAL újrapróbálunk.
      this.child = null;
    }

    if (decision.action !== 'start') {
      if (decision.rescheduleMs !== null) this.scheduleStart(decision.rescheduleMs);

      return;
    }

    if (!prerequisites.ok) {
      await emitServerActionLog({
        actor: 'server',
        kind: 'error',
        summary: `[${this.config.errorCode}-MISSING] ${this.config.label} nem indítható: ${prerequisites.problem}`,
        extra: {
          errorCode: `${this.config.errorCode}-MISSING`,
          issuer: 'supervised-child.start',
          label: this.config.label,
          remedy: prerequisites.remedy,
        },
      });

      // Ez konfigurációs hiány, nem átmeneti zavar — ritkán próbálkozunk újra.
      this.scheduleStart(RESTART_DELAY_MAX_MS);

      return;
    }


    const startedAt: number = Date.now();

    this.outputTail.length = 0;

    const child: ChildProcess = spawn(this.config.execute, this.config.args, {
      cwd: this.config.cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    this.child = child;

    child.stdout?.on('data', (chunk: Buffer): void => {
      this.captureOutput(chunk.toString());
    });

    child.stderr?.on('data', (chunk: Buffer): void => {
      this.captureOutput(chunk.toString());
    });

    // 🔴 A VÉGET TÖBBFÉLEKÉPPEN is meg kell fognunk. Ha a folyamat el sem tud indulni (pl.
    // hiányzó futtatható fájl), a Node `error`-t emit-el, és az `exit` a dokumentáció szerint
    // „may or may not fire" — ha csak arra hallgatnánk, a felügyelet NÉMÁN ÖRÖKRE LEÁLLNA.
    // Ezért az `error`/`exit`/`close` közül az ELSŐ indít újra, a többit a zászló elnyeli.
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
      summary: `${this.config.label} elindítva (pid=${child.pid ?? '?'}).`,
      extra: { issuer: 'supervised-child.start', label: this.config.label, pid: child.pid, cwd: this.config.cwd },
    });
  }

  /**
   * A gyermek kilépésének kezelése.
   *
   * A GYORSAN elhaló gyermek mást jelent, mint a sokáig futó: az előbbi majdnem mindig
   * konfigurációs hiba (rossz token, hiányzó jog), az utóbbi átmeneti zavar. Ezért a gyors
   * bukást a MEGŐRZÖTT KIMENETTEL együtt naplózzuk, és lassuló ütemben próbáljuk újra.
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
        ? `${this.config.label} leállt ${Math.round(exit.ranMs / 1000)}s futás után — újraindítás.`
        : `[${this.config.errorCode}-CRASH] ${this.config.label} ${Math.round(exit.ranMs / 1000)}s után kilépett `
          + `(kód=${exit.code ?? 'n/a'}, jel=${exit.signal ?? 'n/a'}).`,
      extra: {
        ...(healthy ? {} : { errorCode: `${this.config.errorCode}-CRASH` }),
        issuer: 'supervised-child.exit',
        label: this.config.label,
        exitCode: exit.code,
        signal: exit.signal,
        ranMs: exit.ranMs,
        consecutiveFastFailures: this.consecutiveFastFailures,
        retryInMs: this.restartDelayMs,
        // EZ a diagnosztika lényege: a gyermek saját szava arról, mi hiányzott.
        lastOutput: this.outputTail.slice(-OUTPUT_TAIL_LINES),
        remedy: this.config.crashRemedy,
      },
    });

    this.scheduleStart(this.restartDelayMs);
  }

  /** A gyermek kimenetének gyűjtése — csak az utolsó néhány sort tartjuk meg. */
  /**
   * A döntés naplózása — ⚠️ **csak ha VÁLTOZOTT** az előzőhöz képest.
   *
   * 🔴 Mérve 2026-09-08 11:30: a felügyelő 9+ percig nem indított újra, és **egyetlen**
   * bejegyzés sem született. Emiatt a „miért?" kérdés **megválaszolhatatlan** volt.
   */
  private async logDecisionChange(decision: SupervisorDecision): Promise<void> {
    if (this.lastLoggedAction === decision.action) return;

    this.lastLoggedAction = decision.action;

    // ⚠️ A halott gyermek elengedése HIBA-szintű: ez azt jelenti, hogy egy kilépés-esemény
    // elmaradt — a felügyelet enélkül beragadt volna.
    const isProblem: boolean = decision.action === 'reclaim-dead-child'
      || decision.action === 'blocked-prerequisites';

    process.stdout.write(`[felügyelő/${this.config.label}] ${decision.action}: ${decision.detail}
`);

    await emitServerActionLog({
      actor: 'server',
      kind: isProblem ? 'error' : 'note',
      summary: `[${this.config.errorCode}-${decision.action.toUpperCase()}] `
        + `${this.config.label}: ${decision.detail}`,
      extra: {
        issuer: 'supervised-child.decision',
        label: this.config.label,
        action: decision.action,
        rescheduleMs: decision.rescheduleMs,
      },
    });
  }

  private captureOutput(text: string): void {
    for (const line of text.split('\n')) {
      const trimmed: string = line.trim();

      if (!trimmed) continue;

      this.outputTail.push(trimmed);

      // 🔴 TOVÁBB IS ADJUK A KONZOLRA — mérve 2026-09-08 10:55, hogy eddig NEM tettük.
      //
      // A gyermek `stdio`-ja `pipe`, és a kimenete KIZÁRÓLAG ebbe a 12 soros gyűrűpufferbe
      // került. ⇒ **A figyelő fekete doboz volt:** a szerver logjában semmi nem látszott
      // belőle, és a puffer csak KILÉPÉSKOR került naplóba.
      //
      // Két mért következménye volt:
      // 1. Az owner kérése — *„a szerver logjában kell látnom"* (a hang-kapcsolat eseményei,
      //    `MA-VOICE-JOINED` / `-DROPPED`, és a keretenkénti színes sáv) — **nem teljesült**,
      //    hiába írja őket a figyelő a saját `stdout`-jára.
      // 2. Amikor a figyelő életjele **befagyott** (a folyamat élt, de nem vert), **semmilyen
      //    jel nem volt arról, mit csinál** — a diagnózishoz hiányzott maga a jel.
      //
      // ⚠️ A címke az elején marad, hogy a szerver saját sorai és a gyermekéi
      // **szétválaszthatók** legyenek (`grep '[Discord-figyelő]'`).
      process.stdout.write(`[${this.config.label}] ${trimmed}\n`);
    }

    if (this.outputTail.length > OUTPUT_TAIL_LINES) {
      this.outputTail.splice(0, this.outputTail.length - OUTPUT_TAIL_LINES);
    }
  }
}

/** Minden felügyelt gyermek — a leállításkor mindegyiket el kell engedni. */
const supervisedChildren: Set<SupervisedChild> = new Set();

/** Regisztráltuk-e már a folyamat-szintű leállítási kezelőket. */
let shutdownHooksInstalled: boolean = false;

/**
 * A szerver leállásakor a felügyelt gyermekek is menjenek.
 *
 * 🔴 A JEL-KEZELŐ ÖNMAGÁBAN VESZÉLYES: amint a Node-on van `SIGINT`/`SIGTERM` figyelő, az
 * ALAPÉRTELMEZETT leállás ELMARAD. Kezelő nélkül a Ctrl+C megölné a szervert; kezelővel
 * viszont a folyamat csak… tovább futna, és az LDP újraindítása két párhuzamos szervert
 * hagyna hátra. Ezért: takarítunk, majd ÚJRAKÜLDJÜK a jelet — a `once` addigra levette a
 * kezelőt, tehát a második jel már az alapértelmezett viselkedést váltja ki.
 *
 * ⚠️ A kezelőt SZÁNDÉKOSAN csak EGYSZER regisztráljuk, és nyilvántartást vezetünk a
 * gyermekekről. Ha minden szolgáltatás a sajátját tenné fel, N kezelő N egymás utáni
 * jel-újraküldést jelentene — működne, de a helyes leállás a regisztráció SORRENDJÉN múlna,
 * és egy korán terminálódó folyamat árván hagyná a többi gyermeket.
 */
export function registerShutdownHooks(child: SupervisedChild): void {
  supervisedChildren.add(child);

  if (shutdownHooksInstalled) return;

  shutdownHooksInstalled = true;

  const stopAll = (): void => {
    for (const supervised of supervisedChildren) supervised.stop();
  };

  process.once('exit', stopAll);

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, (): void => {
      stopAll();
      process.kill(process.pid, signal);
    });
  }
}

