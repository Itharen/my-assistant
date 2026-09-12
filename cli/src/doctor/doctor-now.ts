// ⏱️ `ma doctor now` — MI TÖRTÉNIK ÉPPEN MOST. A pillanat, egy képernyőn.
//
// > **Owner, 2026-09-12 05:33:** *„Majd mindenféle **diagnosztikálási eszköz** fog kelleni neked
// > a My Assistant rendszereihez. **Tudjad magadat diagnosztizálni**, hogy ilyenkor **mi a fene
// > történik például most**?"*
//
// ## ⚠️ EZ TÁG KÉRÉS VOLT — ezért EGY funkció, ⛔ nem keretrendszer
//
// A handoff kikötése *(`uncertain-requests` + `one-function-is-enough`)*: ⛔ **ne épüljön
// „diagnosztikai keretrendszer"**. ⇒ Ez a modul **egyetlen** kérdésre válaszol — *„mi megy most"* —
// és mindent **mér**, ⛔ semmit nem becsül.
//
// ## 🔴 A `comm doctor`-TÓL VALÓ ELHATÁROLÁS — a handoff külön kimondta
//
// | | `ma comm doctor` | ⭐ `ma doctor now` |
// |---|---|---|
// | a kérdés | *„be van-e kötve, KÉSZ-e a lánc?"* | *„mi történik ÉPPEN MOST?"* |
// | az idő | tartós állapot | **a pillanat** |
// | a kimenet | tételes készenlét-tábla, teendőkkel | **egy** pillanatkép |
//
// ⛔ Ne olvasszuk össze őket: a *„minden zöld"* és a *„most épp semmi nem megy át"* **két
// különböző igazság**, és egyszerre is fennállhatnak.
//
// ## 🔬 AMIT EGY KÜLÖN FOLYAMAT NEM LÁT — és hogyan kerültük meg
//
// 🔴 A köteg-kapu és a futó felismerés a **figyelő memóriájában** élnek. A `ma doctor now` egy
// **másik folyamat** ⇒ kívülről ezek ⛔ pontosan úgy néznek ki, mint a semmi. ⇒ A figyelő az
// **életjelbe** írja őket *(`DiscordHeartbeatMoment`)*, innen pedig olvasható.
// ⚠️ Ha a blokk **hiányzik**, az azt jelenti, hogy a figyelő **régi kódot futtat** — és ezt a
// jelentés **kimondja**, ⛔ nem nullákat mutat.

import type { DiscordFlushDecision } from '../discord/discord.models.js';
import type { DoctorNowSnapshot } from './doctor-now.models.js';
import type { HeartbeatStatus } from '../discord/discord.heartbeat.js';

/**
 * A pillanatkép ÖSSZEÁLLÍTÁSA — minden forrás **injektált**.
 *
 * ⭐ MIÉRT ÍGY: hat különböző forrásból mérünk *(köteg-tár, életjel, sor, gép, napló, CCAP)*.
 * Ha a modul maga olvasná őket, ⛔ csak élő rendszeren lenne tesztelhető — pont az a hibaosztály,
 * ami miatt a `stt.retry-delivery.ts` külön modul lett.
 */
export class DoctorNow_Util {

  /**
   * Egy pillanatkép.
   *
   * ⚠️ MINDEN forrás bukása **túlélhető**: a hiányzó adat `null` **és** bekerül a `gaps`-be.
   * ⛔ Egy diagnosztika sosem hasalhat el attól, hogy épp azt méri, ami elromlott.
   */
  static async collect(sources: {
    now?: Date;
    readBatch: () => Promise<{ pendingCount: number; oldestAgeMs: number | null; newestAgeMs: number | null }>;
    readDecision: () => Promise<DiscordFlushDecision>;
    readListener: () => Promise<HeartbeatStatus>;
    readRetry: () => Promise<{ pendingCount: number; nextDueMs: number | null }>;
    readMachine: () => Promise<{ cpuPercent: number | null; ramUsedGb: number; ramTotalGb: number }>;
    readErrors: () => Promise<{ last: { summary: string; ageMs: number } | null; skippedTestErrors: number }>;
  }): Promise<DoctorNowSnapshot> {
    const takenAt: Date = sources.now ?? new Date();
    const gaps: string[] = [];

    const batch = await DoctorNow_Util.safely(
      sources.readBatch,
      { pendingCount: 0, oldestAgeMs: null, newestAgeMs: null },
      gaps,
      'a köteg-tár nem volt olvasható',
    );
    let decision: DiscordFlushDecision | null = null;
    let decisionProblem: string | undefined;

    try {
      decision = await sources.readDecision();
    } catch (error: unknown) {
      decisionProblem = error instanceof Error ? error.message : String(error);
      gaps.push(`a kiküldési döntés nem volt mérhető (${decisionProblem})`);
    }

    const listener: HeartbeatStatus = await DoctorNow_Util.safely(
      sources.readListener,
      { state: 'absent' },
      gaps,
      'a figyelő életjele nem volt olvasható',
    );

    if (listener.state !== 'absent' && !listener.heartbeat?.moment) {
      // 🔴 EZ ÖNMAGÁBAN DIAGNÓZIS: a figyelő él, de még a RÉGI kódot futtatja ⇒ a kapu és a
      // futó felismerés ⛔ nem mérhető. A hallgatás itt félrevezető lenne.
      gaps.push('a figyelő életjelében NINCS pillanat-blokk — régi kódot futtat, ezért a '
        + 'köteg-kapu és a futó felismerés NEM mérhető (újraindítás után lesz)');
    }

    const retry = await DoctorNow_Util.safely(
      sources.readRetry,
      { pendingCount: 0, nextDueMs: null },
      gaps,
      'az újrapróbálási sor nem volt olvasható',
    );
    const machine = await DoctorNow_Util.safely(
      sources.readMachine,
      { cpuPercent: null, ramUsedGb: 0, ramTotalGb: 0 },
      gaps,
      'a gép terhelése nem volt mérhető',
    );
    const errors = await DoctorNow_Util.safely(
      sources.readErrors,
      { last: null, skippedTestErrors: 0 },
      gaps,
      'a napi akció-napló nem volt olvasható',
    );

    return {
      takenAt: takenAt,
      batch: {
        ...batch,
        decision: decision,
        ...(decisionProblem ? { decisionProblem: decisionProblem } : {}),
      },
      listener: listener,
      retry: retry,
      machine: machine,
      lastError: errors.last,
      skippedTestErrors: errors.skippedTestErrors,
      gaps: gaps,
    };
  }

  /** Egy forrás beolvasása úgy, hogy a bukása **látszik**, de ⛔ nem fatális. */
  private static async safely<T>(
    read: () => Promise<T>,
    fallback: T,
    gaps: string[],
    label: string,
  ): Promise<T> {
    try {
      return await read();
    } catch (error: unknown) {
      gaps.push(`${label} (${error instanceof Error ? error.message : String(error)})`);

      return fallback;
    }
  }
}
