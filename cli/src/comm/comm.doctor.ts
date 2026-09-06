// `ma comm doctor` motorja — tételesen megmondja, melyik kommunikációs csatorna él,
// mi hiányzik, és MIT KELL TENNI.
//
// 🔴 Alapelv: MÉRÜNK, nem feltételezünk (`core-no-guessing`). Amit nem tudunk megállapítani,
// az `unknown` — soha nem `ok`.

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { CcapApiClient } from '../ccap/ccap.api-client.js';
import { CcapError } from '../ccap/ccap.error.js';
import { resolveSelfIdentity } from '../ccap/ccap.identity.js';
import { DiscordBatchStore } from '../discord/discord.batch-store.js';
import { DiscordBridge } from '../discord/discord.bridge.js';
import { readHeartbeat } from '../discord/discord.heartbeat.js';
import { checkReplyObligation } from '../discord/discord.reply-tracker.js';
import { summarizeChecks, type CommCheck, type CommDoctorReport } from './comm.models.js';

/** Ennyi perc után tekintjük elavultnak a jelenlét-mérést. */
const PRESENCE_STALE_MINUTES: number = 10;

export async function runCommDoctor(options: { projectRoot?: string } = {}): Promise<CommDoctorReport> {
  const projectRoot: string = options.projectRoot ?? resolveProjectRoot();
  const checks: CommCheck[] = [];

  const ccap: CcapApiClient = new CcapApiClient();
  await checkCcapAndIdentity(ccap, checks);

  await checkDiscordConfig(checks);
  await checkDiscordListener(checks);
  await checkDiscordBatch(checks);
  await checkReplyDebt(checks);
  await checkSpeakerGate(projectRoot, checks);
  await checkPresenceMonitor(projectRoot, checks);
  await checkAwakeSource(checks);

  return summarizeChecks(checks, new Date().toISOString());
}

// --- CCAP + önazonosítás ---------------------------------------------------

async function checkCcapAndIdentity(ccap: CcapApiClient, checks: CommCheck[]): Promise<void> {
  try {
    const identity = await resolveSelfIdentity(ccap);

    checks.push({
      id: 'ccap-server',
      area: 'ccap',
      label: 'CCAP szerver elérhető',
      status: 'ok',
      detail: `Válaszol: ${ccap.getBaseUrl()}`,
    });
    checks.push({
      id: 'ccap-self-identity',
      area: 'ccap',
      label: 'Tudom, melyik CC session vagyok',
      status: 'ok',
      detail: `${identity.sessionId} („${identity.label}"), instance ${identity.ccapId}`,
    });
  } catch (err: unknown) {
    // `instanceof` inline, hogy a fordító szűkítse a típust — így nincs szükség cast-ra.
    const code: string = err instanceof CcapError ? err.code : 'ISMERETLEN';
    const message: string = err instanceof Error ? err.message : String(err);
    const remedy: string = err instanceof CcapError
      ? err.remedy
      : 'Ellenőrizd a CCAP szervert: `ccap status`.';

    checks.push({
      id: 'ccap-self-identity',
      area: 'ccap',
      label: 'Tudom, melyik CC session vagyok',
      // A CCAP nélkül a Discord-üzenet nem juthat be hozzám → ez blokkoló.
      status: code === 'MA-CCAP-SERVER-UNREACHABLE' ? 'broken' : 'degraded',
      detail: `${code}: ${message}`,
      remedy,
    });
  }
}

// --- Discord konfiguráció --------------------------------------------------

async function checkDiscordConfig(checks: CommCheck[]): Promise<void> {
  // 🔒 CSAK a MEGLÉTET nézzük — az értéket sosem olvassuk ki és sosem írjuk ki.
  const settings: { id: string; env: string; label: string; hint: string }[] = [
    {
      id: 'discord-bot-token',
      env: 'MA_DISCORD_BOT_TOKEN',
      label: 'Saját Discord bot-token beállítva',
      hint: 'Developer Portal → Bot → Reset Token, majd a `.env`-be `MA_DISCORD_BOT_TOKEN=…`. '
        + 'Részletek: __documentations/dev/DISCORD_BOT_SETUP.md',
    },
    {
      id: 'discord-channel-id',
      env: 'MA_DISCORD_CHANNEL_ID',
      label: 'Discord csatorna azonosító beállítva',
      hint: 'Discord → Fejlesztői mód BE → jobb klikk a csatornára → Azonosító másolása → `.env`.',
    },
    {
      id: 'discord-user-id',
      env: 'MA_DISCORD_USER_ID',
      label: 'Owner Discord felhasználó-azonosító beállítva',
      hint: 'Discord → jobb klikk a saját nevedre → Azonosító másolása → `.env`. '
        + 'Enélkül nem tudjuk kiszűrni, hogy csak az owner üzenetét fogadjuk el.',
    },
  ];

  for (const setting of settings) {
    const isSet: boolean = (process.env[setting.env] ?? '').trim().length > 0;

    checks.push({
      id: setting.id,
      area: 'discord',
      label: setting.label,
      status: isSet ? 'ok' : 'missing',
      detail: isSet ? `${setting.env} be van állítva.` : `${setting.env} hiányzik.`,
      remedy: isSet ? undefined : setting.hint,
    });
  }
}

/**
 * ÉL-E MOST a figyelő? — nem az, hogy be van-e állítva.
 *
 * 🔴 Ez a tanulság a jelenlét-figyelőből: **112 napig volt halott**, mert semmi nem
 * ellenőrizte. Egy csendben elhalt Discord-figyelő kívülről pontosan úgy néz ki, mintha az
 * owner nem írt volna — ezért az életjel FRISSESSÉGÉT nézzük, nem a konfiguráció meglétét.
 */
async function checkDiscordListener(checks: CommCheck[]): Promise<void> {
  const status = await readHeartbeat();
  // A KANONIKUS út a szerver: azt kell elindítani, nem a figyelőt külön. A kézi indítás
  // csak diagnosztikai tartalék — ezért másodikként említjük, hogy ne az legyen a reflex.
  const startHint: string = 'Indítsd el a szervert: `npm --prefix server run start-prod` '
    + '(vagy `dc ldp`) — a figyelőt a szerver indítja és tartja életben. '
    + 'Kézi tartalék: `ma comm listen`. Részletek: __documentations/dev/DISCORD_BOT_SETUP.md §6b';

  if (status.state === 'absent') {
    checks.push({
      id: 'discord-listener',
      area: 'discord',
      label: 'Discord-figyelő ÉL',
      status: 'missing',
      detail: 'Nincs életjel — a figyelő ezen a gépen még sosem futott (vagy törölték a jelet).',
      remedy: startHint,
    });
    return;
  }

  const ageMinutes: number = Math.round((status.ageMs ?? 0) / 60_000);

  if (status.state === 'stale') {
    checks.push({
      id: 'discord-listener',
      area: 'discord',
      label: 'Discord-figyelő ÉL',
      // Volt életjel, de elhallgatott → a figyelő MEGHALT. Ez hiba, nem hiány.
      status: 'broken',
      detail: `⚠️ Az utolsó életjel ${formatAge(ageMinutes)} — a figyelő NEM fut. `
        + 'Amíg így van, a Discordon írt üzeneteid NEM jutnak el hozzám.',
      remedy: startHint,
    });
    return;
  }

  checks.push({
    id: 'discord-listener',
    area: 'discord',
    label: 'Discord-figyelő ÉL',
    status: 'ok',
    detail: `Fut (${status.heartbeat?.botTag || 'ismeretlen bot'}), életjel ${ageMinutes} perce; `
      + `${status.heartbeat?.processedCount ?? 0} üzenet feldolgozva az indulás óta.`,
  });
}

async function checkDiscordBatch(checks: CommCheck[]): Promise<void> {
  const store: DiscordBatchStore = new DiscordBatchStore();

  try {
    const pending = await store.readPending();

    if (pending.length === 0) {
      checks.push({
        id: 'discord-batch',
        area: 'discord',
        label: 'Discord köteg (várakozó üzenetek)',
        status: 'ok',
        detail: 'Nincs várakozó üzenet.',
      });
      return;
    }

    const oldestMs: number = Date.now() - new Date(pending[0]!.receivedAt).getTime();
    const oldestMinutes: number = Math.round(oldestMs / 60_000);

    // Ha VAN várakozó üzenet, az igazán hasznos infó nem a darabszám, hanem hogy MIÉRT
    // nem ment még ki. Ezt csak ilyenkor kérdezzük meg — üres kötegnél fölösleges CCAP-kör.
    let decisionNote: string = '';

    try {
      const decision = await new DiscordBridge().inspect();

      decisionNote = ` Kiküldés: ${decision.shouldFlush ? 'MOST MENNE' : 'vár'} — ${decision.reason}`;
    } catch (err: unknown) {
      decisionNote = ' A kiküldési döntés nem állapítható meg '
        + `(${err instanceof Error ? err.message : String(err)}).`;
    }

    checks.push({
      id: 'discord-batch',
      area: 'discord',
      label: 'Discord köteg (várakozó üzenetek)',
      // Sok vagy régi várakozó tétel azt jelenti, hogy a kiküldés akadozik.
      status: oldestMinutes > 30 ? 'degraded' : 'ok',
      detail: `${pending.length} üzenet vár, a legrégebbi ${oldestMinutes} perce.${decisionNote}`,
      remedy: oldestMinutes > 30
        ? 'A kiküldés akadozik. Ellenőrizd: `ma ccap runtime` (foglalt-e a session), '
          + 'majd `ma comm flush --force` a kézi kiküldéshez.'
        : undefined,
    });
  } catch (err: unknown) {
    checks.push({
      id: 'discord-batch',
      area: 'discord',
      label: 'Discord köteg (várakozó üzenetek)',
      status: 'unknown',
      detail: `A köteg-tár nem olvasható: ${err instanceof Error ? err.message : String(err)}`,
      remedy: `Ellenőrizd a fájlt: ${store.getPaths().pendingFile}`,
    });
  }
}

/**
 * G-1: tartozunk-e Discord-válasszal?
 *
 * 🔴 Owner-szabály: a Discordról érkező üzenetre **Discordon IS** válaszolni kell. A
 * leggyakoribb csendes mulasztás, hogy a sessionben válaszolok, és azt hiszem, kész —
 * miközben az owner oldalán néma marad a csatorna. Ezért ezt MÉRJÜK, nem emlékezetből tudjuk.
 */
async function checkReplyDebt(checks: CommCheck[]): Promise<void> {
  const status = await checkReplyObligation();

  if (!status.owesReply) {
    checks.push({
      id: 'discord-reply-debt',
      area: 'discord',
      label: 'Discord válasz-kötelezettség',
      status: 'ok',
      detail: status.lastInboundAt
        ? 'Nincs megválaszolatlan üzenet.'
        : 'Még nem érkezett bejuttatott üzenet.',
    });
    return;
  }

  checks.push({
    id: 'discord-reply-debt',
    area: 'discord',
    label: 'Discord válasz-kötelezettség',
    // Ez SZABÁLYSÉRTÉS, nem hiányzó funkció → `degraded`, hogy nem-nulla kilépési kódot adjon.
    status: 'degraded',
    detail: `⚠️ TARTOZUNK VÁLASSZAL: az utolsó bejuttatott üzenet ${status.waitingMinutes ?? 0} perce `
      + 'érkezett, és azóta NEM ment ki Discord-válasz.',
    remedy: 'Válaszolj Discordon: `ma comm say --text "..."` — rövid, tömör formában.',
  });
}

// --- Hangszóró + jelenlét --------------------------------------------------

async function checkSpeakerGate(projectRoot: string, checks: CommCheck[]): Promise<void> {
  // A kapu akkor létezik, ha a modul is létezik. Ez FUTÁSIDEJŰ tény, nem beégetett vélemény:
  // amint az MP-5 megépíti, ez az ellenőrzés magától zöldre vált.
  const gateModule: string = join(projectRoot, 'cli', 'src', 'cast', 'notify.presence-gate.ts');
  const exists: boolean = existsSync(gateModule);

  checks.push({
    id: 'speaker-gate',
    area: 'speaker',
    label: 'Hangszórós kapu (ébren + itthon) be van kötve',
    status: exists ? 'ok' : 'missing',
    detail: exists
      ? 'A kapu-modul létezik.'
      : 'NINCS kapu a bemondás útjában — jelenleg alvás közben is megszólalna.',
    remedy: exists
      ? undefined
      : '⛔ Amíg ez hiányzik, automata tick NEM mondhat be semmit. '
        + 'Megépítendő: hyperplan MP-5 (jelenlét + ébrenlét).',
  });
}

async function checkPresenceMonitor(projectRoot: string, checks: CommCheck[]): Promise<void> {
  const dataDirectory: string = join(projectRoot, 'server', 'activity-monitor', 'data');

  if (!existsSync(dataDirectory)) {
    checks.push({
      id: 'presence-monitor',
      area: 'presence',
      label: 'Jelenlét-figyelő (itthon vagyok-e)',
      status: 'missing',
      detail: `Nincs adatkönyvtár: ${dataDirectory}`,
      remedy: 'Indítsd el a jelenlét-figyelőt: server/activity-monitor/logger.ps1 (hyperplan MP-5).',
    });
    return;
  }

  const latest = await findLatestPresenceTimestamp(dataDirectory);

  if (!latest) {
    checks.push({
      id: 'presence-monitor',
      area: 'presence',
      label: 'Jelenlét-figyelő (itthon vagyok-e)',
      status: 'unknown',
      detail: 'Van adatkönyvtár, de nem találtam benne értelmezhető mérést.',
      remedy: 'Ellenőrizd a figyelő naplóját, és indítsd újra (hyperplan MP-5).',
    });
    return;
  }

  const ageMinutes: number = Math.round((Date.now() - latest.getTime()) / 60_000);
  const isFresh: boolean = ageMinutes <= PRESENCE_STALE_MINUTES;

  checks.push({
    id: 'presence-monitor',
    area: 'presence',
    label: 'Jelenlét-figyelő (itthon vagyok-e)',
    status: isFresh ? 'ok' : 'broken',
    detail: isFresh
      ? `Friss mérés, ${ageMinutes} perce.`
      : `⚠️ A legutóbbi mérés ${formatAge(ageMinutes)} — a figyelő NEM fut.`,
    remedy: isFresh
      ? undefined
      : 'Indítsd újra a jelenlét-figyelőt, és tedd automatikus indulásúvá (hyperplan MP-5). '
        + 'Enélkül nem tudjuk, itthon vagy-e → a hangszóró nem használható.',
  });
}

async function checkAwakeSource(checks: CommCheck[]): Promise<void> {
  const serverUrl: string = process.env.MA_SERVER_URL ?? 'http://localhost:39245';

  try {
    const response: Response = await fetch(`${serverUrl}/api/sleep-state`, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const snapshot = (await response.json()) as { source?: unknown; isInSleepWindow?: unknown };
    const source: string = typeof snapshot.source === 'string' ? snapshot.source : 'ismeretlen';
    const isClockOnly: boolean = source === 'time-of-day-heuristic';

    checks.push({
      id: 'awake-source',
      area: 'presence',
      label: 'Ébrenlét-döntés forrása',
      status: isClockOnly ? 'degraded' : 'ok',
      detail: isClockOnly
        ? 'Fix órarend-tippelés — NEM mérés. Ez ellentmond a csúszó, 26 órás alvás-ciklusnak.'
        : `Forrás: ${source}`,
      remedy: isClockOnly
        ? 'Kösd át a jelenlét-mérésre: ITTHON-jel VAGY Discord-válasz (+1 óra). Hyperplan MP-5.'
        : undefined,
    });
  } catch (err: unknown) {
    checks.push({
      id: 'awake-source',
      area: 'presence',
      label: 'Ébrenlét-döntés forrása',
      status: 'unknown',
      detail: `A my-assistant szerver nem válaszolt (${serverUrl}): `
        + `${err instanceof Error ? err.message : String(err)}`,
      remedy: 'Indítsd el a szervert (`pnpm run start-server`), vagy állítsd be az MA_SERVER_URL-t. '
        + 'Amíg nem tudjuk, ébren vagy-e, a hangszóró nem használható.',
    });
  }
}

// --- segédek ---------------------------------------------------------------

async function findLatestPresenceTimestamp(dataDirectory: string): Promise<Date | null> {
  const entries: string[] = (await readdir(dataDirectory)).filter((name) => name.endsWith('.jsonl'));

  if (entries.length === 0) return null;

  const newestFile: string = entries.sort()[entries.length - 1]!;
  const raw: string = await readFile(join(dataDirectory, newestFile), 'utf-8');
  const lines: string[] = raw.split('\n').filter((line) => line.trim().length > 0);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      const parsed = JSON.parse(lines[index]!.replace(/^﻿/, '')) as { timestamp?: unknown };

      if (typeof parsed.timestamp === 'string') {
        const date: Date = new Date(parsed.timestamp);

        if (!Number.isNaN(date.getTime())) return date;
      }
    } catch {
      // Sérült sor — megyünk visszafelé tovább.
    }
  }

  return null;
}

/** Kor emberi formában — a nyers perc-szám nagy értékeknél olvashatatlan. */
export function formatAge(minutes: number): string {
  const days: number = Math.floor(minutes / (60 * 24));

  if (days >= 1) return `${days} napja`;

  const hours: number = Math.floor(minutes / 60);

  return hours >= 1 ? `${hours} órája` : `${minutes} perce`;
}

function resolveProjectRoot(): string {
  const configured: string | undefined = process.env.MA_ASSISTANT_PROJECT_ROOT;

  if (configured && configured.trim().length > 0) return resolve(configured);

  let directory: string = resolve(process.cwd());

  for (let depth: number = 0; depth < 10; depth += 1) {
    if (existsSync(join(directory, '__agent')) && existsSync(join(directory, 'cli'))) return directory;
    const parent: string = resolve(directory, '..');

    if (parent === directory) break;
    directory = parent;
  }

  return resolve(process.cwd());
}
