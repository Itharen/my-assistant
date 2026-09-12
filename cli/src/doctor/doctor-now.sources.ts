// 🔌 A `ma doctor now` VALÓDI forrásai — fájl, életjel, sor, gép, napló.
//
// ⭐ MIÉRT KÜLÖN MODUL: a `doctor-now.ts` a **döntést és az összeállítást** viszi, és ezért
// kizárólag injektált olvasókkal dolgozik *(így teszthez ⛔ nem kell élő rendszer)*. A valódi
// IO **itt** lakik, egy helyen — így a „mit olvasunk" kérdés egy fájlból megválaszolható.
//
// 🔴 EGYIK OLVASÓ SEM SZÉPÍT: ahol nincs adat, ott hibát dobunk vagy `null`-t adunk, és a
// gyűjtő ezt **kimondja** a `gaps`-ben. ⛔ Nulla ≠ „nincs baj".

import { readFile } from 'node:fs/promises';
import { cpus, freemem, totalmem } from 'node:os';

import { DiscordBatchStore } from '../discord/discord.batch-store.js';
import { DiscordBridge } from '../discord/discord.bridge.js';
import { readHeartbeat, type HeartbeatStatus } from '../discord/discord.heartbeat.js';
import { SttRetryQueue, type SttRetryEntry } from '../stt/stt.retry-queue.js';
import { resolveActionLogPath } from '../voice/voice-funnel-report.js';
import { resolveProjectRoot } from '../utils/project-root.js';
import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { ActionLogTestOrigin_Util } from '../action-log/action-log.test-origin.js';
import type { DiscordFlushDecision, DiscordInboundMessage } from '../discord/discord.models.js';

/** Egy beolvasott napló-sor — ⚠️ minden mező `unknown`, mert a fájl alakja ⛔ nem garantált. */
interface ParsedLogLine {
  kind?: unknown;
  summary?: unknown;
  ts?: unknown;
  ref?: unknown;
  extra?: Record<string, unknown>;
}

/** A pillanatkép valódi olvasói. */
export class DoctorNowSources_Util {

  /**
   * 📨 A köteg: hány üzenet vár és mióta — **közvetlenül a tárból**.
   *
   * ⚠️ ⛔ NEM a CCAP-tól kérdezzük: ez a **mi** oldalunk, és akkor is mérhető, ha a CCAP halott.
   */
  static async readBatch(): Promise<{ pendingCount: number; oldestAgeMs: number | null; newestAgeMs: number | null }> {
    const pending: DiscordInboundMessage[] = await new DiscordBatchStore().readPending();

    if (!pending.length) return { pendingCount: 0, oldestAgeMs: null, newestAgeMs: null };

    const now: number = Date.now();
    const ages: number[] = pending
      .map((message: DiscordInboundMessage): number => Date.parse(message.receivedAt))
      .filter((value: number): boolean => !Number.isNaN(value))
      .map((value: number): number => now - value);

    if (!ages.length) return { pendingCount: pending.length, oldestAgeMs: null, newestAgeMs: null };

    return {
      pendingCount: pending.length,
      oldestAgeMs: Math.max(...ages),
      newestAgeMs: Math.min(...ages),
    };
  }

  /**
   * ⭐ A KIKÜLDÉSI DÖNTÉS — ez mondja meg, **miért** nem megy ki a köteg.
   *
   * 🔴 A CSAPDA, AMIT EZ MEGKERÜL: a döntés egyik kapuja a **megszólalás-kapu**, ami a figyelő
   * **memóriájában** él. Egy külön folyamatban az alapérték `false` lenne ⇒ a diagnosztika
   * *„elcsendesedett, megy ki"*-t írna, miközben a figyelő épp **visszatartja**. ⇒ Az életjel
   * `moment` blokkjából **betápláljuk** a valódi kapu-állapotot.
   *
   * ⚠️ Ha a `moment` hiányzik *(régi figyelő)*, a kapu `false`-ként szerepel — de a gyűjtő ezt
   * a `gaps`-ben **kimondja**, tehát ⛔ nem hallgatjuk el a pontatlanságot.
   */
  static async readDecision(listener: HeartbeatStatus): Promise<DiscordFlushDecision> {
    const bridge: DiscordBridge = new DiscordBridge();
    const isGateClosed: boolean = listener.heartbeat?.moment?.isGateClosed === true;

    bridge.attachSpeechInProgressSource((): boolean => isGateClosed);

    return bridge.inspect();
  }

  /** 🎙️ A figyelő életjele — a `moment` blokkal együtt. */
  static async readListener(): Promise<HeartbeatStatus> {
    return readHeartbeat();
  }

  /** ⏳ Az újrapróbálási sor: hány hang vár és mikor esedékes a következő. */
  static async readRetry(): Promise<{ pendingCount: number; nextDueMs: number | null }> {
    const entries: SttRetryEntry[] = await new SttRetryQueue().list();

    if (!entries.length) return { pendingCount: 0, nextDueMs: null };

    const now: number = Date.now();
    const dues: number[] = entries
      .map((entry: SttRetryEntry): number => Date.parse(entry.nextAttemptAt))
      .filter((value: number): boolean => !Number.isNaN(value))
      .map((value: number): number => value - now);

    return {
      pendingCount: entries.length,
      nextDueMs: dues.length ? Math.min(...dues) : null,
    };
  }

  /**
   * 🖥️ A GÉP TERHELÉSE — az owner 03:12-kor külön kérte *(„hogyan pörög a gép")*.
   *
   * ⚠️ MIÉRT NEM `loadavg()`: Windowson **mindig 0**-t ad *(Node dokumentált viselkedés)* ⇒
   * hamis nyugalom. ⭐ Ezért a CPU-t **két mintából** számoljuk, a tick-számlálók különbségéből.
   */
  static async readMachine(sampleMs: number = 200): Promise<{ cpuPercent: number | null; ramUsedGb: number; ramTotalGb: number }> {
    const first: { idle: number; total: number } = DoctorNowSources_Util.cpuTicks();

    await new Promise<void>((resolve: () => void): void => {
      setTimeout(resolve, sampleMs);
    });

    const second: { idle: number; total: number } = DoctorNowSources_Util.cpuTicks();
    const totalDelta: number = second.total - first.total;
    const idleDelta: number = second.idle - first.idle;
    const gb: number = 1024 ** 3;

    return {
      cpuPercent: totalDelta > 0 ? (1 - idleDelta / totalDelta) * 100 : null,
      ramUsedGb: (totalmem() - freemem()) / gb,
      ramTotalGb: totalmem() / gb,
    };
  }

  /**
   * 🔴 AZ UTOLSÓ **VALÓDI** HIBA a napi akció-naplóból + a kihagyott teszt-hibák SZÁMA.
   *
   * ⚠️ A naplót **visszafelé** olvassuk: az utolsó hiba érdekes, ⛔ nem az első.
   *
   * 🧪 **A TESZT-EREDETŰ BEJEGYZÉSEKET KIHAGYJUK — de MEGSZÁMOLJUK** *(21. tétel)*. Mérve: egy
   * nap **631** hiba-bejegyzéséből **114** szándékosan hibás spec-fixtúrából jött ⇒ az „utolsó
   * hiba" szinte mindig teszt-szemét volt. ⛔ Némítás nincs: a szám a jelentésben **látszik**.
   *
   * ⚠️ A számlálás a **teljes napra** megy, ⛔ nem áll meg az első valódi hibánál: különben a
   * kihagyottak száma attól függne, hol találtuk meg a valódit — ⇒ félrevezető szám.
   */
  static async readErrors(now: Date = new Date()): Promise<{ last: { summary: string; ageMs: number } | null; skippedTestErrors: number }> {
    const day: string = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Budapest',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const path: string = resolveActionLogPath(resolveProjectRoot(), day);
    const lines: string[] = (await readFile(path, 'utf8')).split('\n');

    let last: { summary: string; ageMs: number } | null = null;
    let skippedTestErrors: number = 0;

    for (let index: number = lines.length - 1; index >= 0; index -= 1) {
      const line: string = lines[index]?.trim() ?? '';

      if (!line) continue;

      const parsed = DoctorNowSources_Util.parseLine(line);

      if (parsed.kind !== 'error') continue;

      if (ActionLogTestOrigin_Util.isTestEntry({
        ...(parsed.extra ? { extra: parsed.extra } : {}),
        ...(typeof parsed.ref === 'string' ? { ref: parsed.ref } : {}),
      })) {
        skippedTestErrors += 1;

        continue;
      }

      if (last) continue;

      const stamp: number = typeof parsed.ts === 'string' ? Date.parse(parsed.ts) : Number.NaN;

      last = {
        summary: typeof parsed.summary === 'string' ? parsed.summary : '(nincs leírás)',
        ageMs: Number.isNaN(stamp) ? 0 : now.getTime() - stamp,
      };
    }

    return { last: last, skippedTestErrors: skippedTestErrors };
  }

  /**
   * Egy napló-sor — a sérült sor ⛔ nem buktatja meg az olvasást.
   *
   * ⚠️ A bukás ⛔ NEM néma: a napló sérülése önmagában is diagnózis *(egy fél sor azt jelenti,
   * hogy egy írás félbeszakadt)*, ezért jelentjük — de a keresést ⛔ nem állítjuk meg vele.
   */
  private static parseLine(line: string): ParsedLogLine {
    try {
      const parsed: unknown = JSON.parse(line);

      return typeof parsed === 'object' && parsed !== null ? { ...parsed } : {};
    } catch (error: unknown) {
      SwallowedFailure_Util.report('doctor-now.parseLine', error);

      return {};
    }
  }

  /** A CPU tick-számlálók összege — a két minta különbsége adja a kihasználtságot. */
  private static cpuTicks(): { idle: number; total: number } {
    let idle: number = 0;
    let total: number = 0;

    for (const cpu of cpus()) {
      idle += cpu.times.idle;
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    }

    return { idle: idle, total: total };
  }
}
