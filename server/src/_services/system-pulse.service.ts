// A KONZOL-SOR — egyetlen sor, ami ránézésre elárulja, mi történik a rendszerben.
//
// > **Owner-kérés (2026-09-07):** *„Majd szeretném, hogy egy sor logot is tegyünk a My
// > Assistant projektbe, hogy amikor ránézek a konzolra, az is árulkodjon nekem arról, hogy
// > mi minden történik a rendszerben."*
//
// 🔴 MIÉRT ÍGY: a szerver konzolja eddig **egyetlen sort** írt (indulás), utána néma volt.
// A némaság és a „minden rendben" kívülről MEGKÜLÖNBÖZTETHETETLEN — pontosan ez a hibafajta
// tartotta a jelenlét-figyelőt **112 napig** halottan úgy, hogy senki nem vette észre.
//
// ⭐ A SOR A VALÓSÁGOT MÉRI, NEM A KONFIGURÁCIÓT. Nem azt kérdezzük, „be van-e állítva",
// hanem azt, hogy „ÉL-E MOST" — az életjel- és minta-fájlok FRISSESSÉGÉBŐL. Mérve
// 2026-09-07: egy állapot-mező NEVE nem a jelentése (`status.json` → `serverRunning: false`
// futó szerver mellett), ezért a pulzus soha nem hisz egy jelzőbitnek.
//
// ⛔ NEM duplikál üzleti logikát: a válasz-kötelezettség megítélése a `ma comm doctor`
// dolga (SSOT). Itt csak NYERS TÉNYEK vannak — hány üzenet vár, mikor ment ki az utolsó.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import * as path from 'node:path';

import { resolveListenerHeartbeatFile } from './discord-listener.service.js';
import { resolvePresencePaths } from './presence-monitor.service.js';

/** Milyen sűrűn írjuk ki a sort. Elég ritka, hogy ne szemetelje tele a konzolt. */
export const PULSE_INTERVAL_MS: number = 60_000;

/** Az első sor ennyivel az indulás után jön — addig felállnak a figyelők. */
const FIRST_PULSE_DELAY_MS: number = 20_000;

/**
 * Ennél régebbi Discord-életjel esetén a figyelőt halottnak tekintjük.
 *
 * ⚠️ UGYANAZT A KÉRDÉST teszi fel, mint a `ma comm doctor`, ezért az értéke a CLI
 * `discord.heartbeat.ts` → `HEARTBEAT_STALE_MS` párja (5 perc). Ha az változik, ez is
 * változzon — különben a konzol és a diagnosztika **mást állítana ugyanarról**.
 * ⛔ NEM keverendő a `discord-listener.service.ts` `HEARTBEAT_FRESH_MS`-ével (3 perc): az
 * MÁS kérdésre válaszol — „induljon-e egy MÁSODIK figyelő?".
 */
export const DISCORD_STALE_MS: number = 5 * 60_000;

/** Ennél régebbi jelenlét-minta esetén nincs érvényes mérésünk. */
export const PRESENCE_STALE_MS: number = 3 * 60_000;

/** Ennyi napra megyünk vissza a jelenlét-mintákért (éjfél-átfordulás miatt). */
const PRESENCE_LOOKBACK_DAYS: number = 3;

/** Egy alrendszer állapota — `absent` = soha nem is futott. */
export type PulseState = 'alive' | 'stale' | 'absent';

export interface SystemPulseSnapshot {
  /** A mérés pillanata. */
  now: Date;
  /** Mióta fut a szerver-folyamat. */
  uptimeMs: number;
  discord: {
    state: PulseState;
    ageMs?: number;
    botTag?: string;
    processedCount?: number;
  };
  presence: {
    state: PulseState;
    ageMs?: number;
    /** A logger `idleState` mezője — `active` / `idle`. */
    idleState?: string;
  };
  /** Hány beérkezett üzenet vár még átadásra. */
  pendingInbound: number;
  /** Mikor ment ki az utolsó üzenet. `undefined` = még soha. */
  lastOutboundAgeMs?: number;
}

/**
 * A konzol-sor szövege.
 *
 * Tiszta függvény — fájlrendszer és idő nélkül tesztelhető.
 */
export function composePulseLine(pulse: SystemPulseSnapshot): string {
  const parts: string[] = [
    `🫀 ${formatClock(pulse.now)} · fut ${formatDuration(pulse.uptimeMs)}`,
    `💬 Discord ${describeDiscord(pulse.discord)}`,
    `🏠 jelenlét ${describePresence(pulse.presence)}`,
    `📬 ${describeInbox(pulse.pendingInbound)}`,
    `↩ kimenő ${pulse.lastOutboundAgeMs === undefined ? '— még soha' : formatAge(pulse.lastOutboundAgeMs)}`,
  ];

  return parts.join(' │ ');
}

function describeDiscord(discord: SystemPulseSnapshot['discord']): string {
  if (discord.state === 'absent') return '🔴 nincs életjel';
  if (discord.state === 'stale') return `🔴 HALOTT (${formatAge(discord.ageMs ?? 0)})`;

  const tag: string = discord.botTag ? ` ${discord.botTag}` : '';
  const seen: string = discord.processedCount === undefined
    ? ''
    : `, ${discord.processedCount} üz`;

  return `✅${tag} (${formatAge(discord.ageMs ?? 0)}${seen})`;
}

function describePresence(presence: SystemPulseSnapshot['presence']): string {
  if (presence.state === 'absent') return '🔴 nincs mérés';
  if (presence.state === 'stale') return `🔴 ELAVULT (${formatAge(presence.ageMs ?? 0)})`;

  // A magyar szó többet mond a konzolon, mint a nyers mezőérték.
  const mood: string = presence.idleState === 'active' ? 'aktív' : 'tétlen';

  return `✅ ${mood} (${formatAge(presence.ageMs ?? 0)})`;
}

function describeInbox(pending: number): string {
  return pending > 0 ? `⚠️ ${pending} üzenet vár` : 'köteg üres';
}

/** `HH:MM` — a konzolon ennél pontosabb nem kell. */
function formatClock(now: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');

  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Kor emberi alakban: `42mp` · `7p` · `2ó 15p`. */
export function formatAge(ms: number): string {
  return formatDuration(ms);
}

function formatDuration(ms: number): string {
  const totalSec: number = Math.max(0, Math.round(ms / 1000));

  if (totalSec < 60) return `${totalSec}mp`;

  const totalMin: number = Math.round(totalSec / 60);

  if (totalMin < 60) return `${totalMin}p`;

  const hours: number = Math.floor(totalMin / 60);

  return `${hours}ó ${totalMin % 60}p`;
}

/**
 * A pillanatkép összegyűjtése a VALÓS fájlokból.
 *
 * 🔴 SOHA nem dob kivételt: egy naplózó sor nem döntheti meg a szervert. Ami nem olvasható,
 * az `absent` — vagyis az ÓVATOS irányba téved. A hamis „minden rendben" lenne a veszélyes.
 */
export function collectPulse(now: Date = new Date()): SystemPulseSnapshot {
  return {
    now,
    uptimeMs: Math.round(process.uptime() * 1000),
    discord: readDiscordHeartbeat(now),
    presence: readNewestPresenceSample(now),
    pendingInbound: countPendingInbound(),
    lastOutboundAgeMs: readLastOutboundAge(now),
  };
}

function readDiscordHeartbeat(now: Date): SystemPulseSnapshot['discord'] {
  try {
    const file: string = resolveListenerHeartbeatFile();

    if (!existsSync(file)) return { state: 'absent' };

    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as {
      updatedAt?: string;
      botTag?: string;
      processedCount?: number;
    };
    const updatedMs: number = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : Number.NaN;

    if (Number.isNaN(updatedMs)) return { state: 'absent' };

    const ageMs: number = now.getTime() - updatedMs;

    return {
      state: ageMs > DISCORD_STALE_MS ? 'stale' : 'alive',
      ageMs,
      ...(parsed.botTag ? { botTag: parsed.botTag } : {}),
      ...(typeof parsed.processedCount === 'number' ? { processedCount: parsed.processedCount } : {}),
    };
  } catch {
    return { state: 'absent' };
  }
}

/**
 * A legfrissebb jelenlét-minta.
 *
 * ⚠️ Több napra visszamegyünk: éjfél után a mai fájl még ÜRES, és csak az előző napiban van
 * mérés — ebbe a csapdába egyszer már beleestünk (`CONTINUATION.md`, 1. review-kör).
 */
function readNewestPresenceSample(now: Date): SystemPulseSnapshot['presence'] {
  try {
    const dataDir: string = resolvePresencePaths().dataDir;

    if (!existsSync(dataDir)) return { state: 'absent' };

    const files: string[] = readdirSync(dataDir)
      .filter((name: string): boolean => name.endsWith('.jsonl'))
      .sort()
      .slice(-PRESENCE_LOOKBACK_DAYS)
      .reverse();

    for (const name of files) {
      const sample = readLastSample(path.join(dataDir, name));

      if (!sample) continue;

      const ageMs: number = now.getTime() - sample.timestampMs;

      return {
        state: ageMs > PRESENCE_STALE_MS ? 'stale' : 'alive',
        ageMs,
        ...(sample.idleState ? { idleState: sample.idleState } : {}),
      };
    }

    return { state: 'absent' };
  } catch {
    return { state: 'absent' };
  }
}

/** Egy napi minta-fájl UTOLSÓ értelmes sora. A csonka/sérült sorokat átugorjuk. */
function readLastSample(file: string): { timestampMs: number; idleState?: string } | null {
  const lines: string[] = readFileSync(file, 'utf-8').split('\n');

  for (let i: number = lines.length - 1; i >= 0; i--) {
    // A BOM-ot is le kell vágni, különben a `JSON.parse` elhasal az első soron.
    // ⚠️ Szándékosan a \uFEFF ESCAPE, nem a nyers karakter: az utóbbi láthatatlan a
    // forrásban, és egy kódolás-váltó mentés némán kiejtheti.
    const line: string = lines[i].replace(/^\uFEFF/, '').trim();

    if (!line) continue;

    try {
      const parsed = JSON.parse(line) as { timestamp?: string; idleState?: string };
      const ms: number = parsed.timestamp ? new Date(parsed.timestamp).getTime() : Number.NaN;

      if (Number.isNaN(ms)) continue;

      return { timestampMs: ms, ...(parsed.idleState ? { idleState: parsed.idleState } : {}) };
    } catch {
      continue;
    }
  }

  return null;
}

/** A Discord-tár gyökere. A CLI ugyanide ír (`discord.batch-store.ts`). */
function resolveDiscordStoreDir(): string {
  return path.join(homedir(), '.config', 'my-assistant', 'discord');
}

function countPendingInbound(): number {
  try {
    const file: string = path.join(resolveDiscordStoreDir(), 'pending-inbound.jsonl');

    if (!existsSync(file)) return 0;

    return readFileSync(file, 'utf-8')
      .split('\n')
      .filter((line: string): boolean => line.trim().length > 0)
      .length;
  } catch {
    return 0;
  }
}

/**
 * Mikor ment ki az utolsó üzenet.
 *
 * A fájl MÓDOSÍTÁSI IDEJÉT nézzük, nem a tartalmát: a napló append-only, tehát az mtime
 * pontosan az utolsó bejegyzés ideje — és így egy nagy fájlt sem kell beolvasni.
 */
function readLastOutboundAge(now: Date): number | undefined {
  try {
    const file: string = path.join(resolveDiscordStoreDir(), 'outbound-log.jsonl');

    if (!existsSync(file)) return undefined;

    return now.getTime() - statSync(file).mtimeMs;
  } catch {
    return undefined;
  }
}

/**
 * A pulzus-szolgáltatás.
 *
 * `SystemPulse_Service.getInstance()` triggereli a singleton-példányt; az `app.server.ts`
 * `getRootServices()`-ben példányosítja boot-időben — ugyanaz a minta, mint a
 * `WeatherPoll_Service`-nél.
 */
export class SystemPulse_Service {

  private static instance: SystemPulse_Service | null = null;

  /** Singleton accessor. */
  static getInstance(): SystemPulse_Service {
    if (!SystemPulse_Service.instance) {
      SystemPulse_Service.instance = new SystemPulse_Service();
    }

    return SystemPulse_Service.instance;
  }

  private tickHandle: NodeJS.Timeout | null = null;

  private constructor() {
    setTimeout((): void => this.tick(), FIRST_PULSE_DELAY_MS).unref();

    this.tickHandle = setInterval((): void => this.tick(), PULSE_INTERVAL_MS);
    // Az `unref` miatt a pulzus SOSEM tartja életben a folyamatot — ha minden más leállt,
    // a szerver leáll, nem pedig egy naplózó időzítőn lóg.
    this.tickHandle.unref();
  }

  /** Egy sor kiírása. Hibát nem enged ki — a konzol-sor nem döntheti meg a szervert. */
  private tick(): void {
    try {
      // Szándékosan `console.log`: EZ egy konzolra szánt sor. Naplókeret-előtagok
      // (időbélyeg, szint, forrás) pont azt a ránézésre-olvashatóságot rontanák el,
      // amiért a sor létezik.
      console.log(composePulseLine(collectPulse()));
    } catch {
      // Ha még a formázás is elhasal, csendben kihagyjuk ezt a kört — a következő jön.
    }
  }
}
