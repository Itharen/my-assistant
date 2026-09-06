// A Discord-figyelő ÉLETJELE.
//
// 🔴 MIÉRT LÉTEZIK: mérve 2026-09-06 — a jelenlét-figyelő **112 napig** halott volt anélkül,
// hogy bárki észrevette volna, mert semmi nem ellenőrizte, hogy fut-e. A Discord-csatorna
// ugyanebbe a csapdába sétálna: a folyamat elhalhat, a kapcsolat leszakadhat, és kívülről
// ez **pontosan úgy néz ki, mintha nem írtál volna** — a legcsendesebb hibafajta.
//
// Ezért a figyelő rendszeresen frissít egy életjel-fájlt, a diagnosztika pedig a fájl
// FRISSESSÉGÉT nézi. Nem azt kérdezzük, „be van-e állítva", hanem azt: „ÉL-E MOST".

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/** Ennyi idő után tekintjük halottnak a figyelőt. */
export const HEARTBEAT_STALE_MS: number = 5 * 60_000;

/** Ilyen sűrűn frissítjük az életjelet futás közben. */
export const HEARTBEAT_INTERVAL_MS: number = 60_000;

export interface DiscordHeartbeat {
  /** Mikor frissült utoljára (ISO). */
  updatedAt: string;
  /** A bot megjelenített neve — segít azonosítani, MELYIK bot fut. */
  botTag: string;
  /** Hány üzenetet dolgozott fel az indulás óta. */
  processedCount: number;
  /**
   * A figyelő folyamat-azonosítója.
   *
   * A felügyelő (`server/src/_services/discord-listener.service.ts`) ebből tudja
   * eldönteni, hogy egy friss életjel MÖGÖTT áll-e még élő folyamat — enélkül egy
   * épp most elhalt figyelő életjele percekig „foglaltnak" mutatná a csatornát.
   */
  pid?: number;
}

export function resolveHeartbeatPath(userHome: string = homedir()): string {
  return join(userHome, '.config', 'my-assistant', 'discord', 'listener-heartbeat.json');
}

/** Életjel kiírása. Hibát NEM dob — az életjel sosem akaszthatja meg a figyelőt. */
export async function writeHeartbeat(
  heartbeat: DiscordHeartbeat,
  path: string = resolveHeartbeatPath(),
): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(heartbeat, null, 2), 'utf-8');
  } catch {
    // Szándékosan elnyelve: ha az életjelet nem tudjuk kiírni, a diagnosztika „halott"-nak
    // fogja látni — ami ÓVATOS irányba téved. Az ellenkezője (hamis „él") lenne a veszélyes.
  }
}

export interface HeartbeatStatus {
  /** `alive` · `stale` (van fájl, de régi) · `absent` (soha nem futott). */
  state: 'alive' | 'stale' | 'absent';
  ageMs?: number;
  heartbeat?: DiscordHeartbeat;
}

/** Az életjel beolvasása és értékelése. */
export async function readHeartbeat(
  path: string = resolveHeartbeatPath(),
  now: Date = new Date(),
): Promise<HeartbeatStatus> {
  if (!existsSync(path)) return { state: 'absent' };

  try {
    const parsed: unknown = JSON.parse(await readFile(path, 'utf-8'));

    if (typeof parsed !== 'object' || parsed === null) return { state: 'absent' };

    const record = parsed as Record<string, unknown>;
    const updatedAt: unknown = record['updatedAt'];

    if (typeof updatedAt !== 'string') return { state: 'absent' };

    const timestamp: number = new Date(updatedAt).getTime();

    if (Number.isNaN(timestamp)) return { state: 'absent' };

    const ageMs: number = now.getTime() - timestamp;
    const heartbeat: DiscordHeartbeat = {
      updatedAt,
      botTag: typeof record['botTag'] === 'string' ? record['botTag'] : '',
      processedCount: typeof record['processedCount'] === 'number' ? record['processedCount'] : 0,
    };

    return { state: ageMs <= HEARTBEAT_STALE_MS ? 'alive' : 'stale', ageMs, heartbeat };
  } catch {
    // Sérült fájl → nem tudjuk, él-e. Az óvatos válasz: nem tekintjük élőnek.
    return { state: 'absent' };
  }
}
