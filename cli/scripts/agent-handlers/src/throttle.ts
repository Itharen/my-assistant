// scripts/agent-handlers/src/throttle.ts
// Közös throttle a notify-cast + ccap-notify handler-ekhez.
// FR #1 communication-forms Phase 4 (cycle 30).
//
// State-fájl: __agent/state/notify-throttle.json
//   { [throttleId]: lastSentIso }
//
// Default cooldown: 5 perc. Per-action `cooldownMs` override.

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { paths } from './paths.js';

export const DEFAULT_COOLDOWN_MS: number = 5 * 60 * 1000;

interface ThrottleMap {
  [throttleId: string]: string;            // ISO timestamp of last send
}

function throttleFilePath(): string {
  return path.join(paths.state(), 'notify-throttle.json');
}

async function read(): Promise<ThrottleMap> {
  try {
    const raw: string = await fs.readFile(throttleFilePath(), 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as ThrottleMap;
    }
    return {};
  } catch (err) {
    const errno: NodeJS.ErrnoException = err as NodeJS.ErrnoException;
    if (errno.code === 'ENOENT') return {};
    // Parse error / perm: stderr emit (strukturált), fallback empty (UX preserve)
    const msg: string = err instanceof Error ? err.message : String(err);
    try {
      process.stderr.write(
        `[throttle] MA-THROTTLE-READ-FAIL: ${msg} (file=${throttleFilePath()})\n`,
      );
    } catch {
      // last-resort stderr unwritable — documented swallow per error-handling.md
    }
    return {};
  }
}

async function write(map: ThrottleMap): Promise<void> {
  const target: string = throttleFilePath();
  const tmp: string = `${target}.tmp`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  // Atomic write: tmp → rename. Slight race a multi-writer esetben elfogadott
  // (last-writer-wins, throttle-counting nem critical-safety).
  await fs.writeFile(tmp, JSON.stringify(map, null, 2) + '\n', 'utf-8');
  await fs.rename(tmp, target);
}

export type ThrottleCheck =
  | { skip: true; ageMs: number; cooldownMs: number; lastSentAt: string }
  | { skip: false };

/**
 * Returns whether the `throttleId` is within cooldown. If `skip: false`, the
 * caller MUST call `recordThrottle()` after successful send to update the
 * timestamp.
 */
export async function checkThrottle(
  throttleId: string,
  cooldownMs: number = DEFAULT_COOLDOWN_MS,
): Promise<ThrottleCheck> {
  const map: ThrottleMap = await read();
  const last: string | undefined = map[throttleId];
  if (!last) return { skip: false };
  const lastTs: number = new Date(last).getTime();
  if (Number.isNaN(lastTs)) return { skip: false };
  const ageMs: number = Date.now() - lastTs;
  if (ageMs < cooldownMs) {
    return { skip: true, ageMs, cooldownMs, lastSentAt: last };
  }
  return { skip: false };
}

/**
 * Record `throttleId` as sent now. Atomic write (tmp + rename).
 */
export async function recordThrottle(throttleId: string): Promise<void> {
  const map: ThrottleMap = await read();
  map[throttleId] = new Date().toISOString();
  await write(map);
}
