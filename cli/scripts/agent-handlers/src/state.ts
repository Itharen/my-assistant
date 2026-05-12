// scripts/agent-handlers/src/state.ts
// Reads/writes __agent/state/agent-tick.json with file-locking.

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { paths } from './paths.js';
import type { Verdict } from './types.js';

export interface AgentTickState {
  schemaVersion: 1;
  lastTickAt: string | null;       // ISO
  tickCounter: number;
  currentDay: string | null;       // YYYY-MM-DD
  dailyTickCount: number;
  lastVerdict: Verdict | null;
  lastReason: string | null;
}

const DEFAULT_STATE: AgentTickState = {
  schemaVersion: 1,
  lastTickAt: null,
  tickCounter: 0,
  currentDay: null,
  dailyTickCount: 0,
  lastVerdict: null,
  lastReason: null,
};

async function ensureStateDir(): Promise<void> {
  await fs.mkdir(paths.state(), { recursive: true });
}

export async function readTickState(): Promise<AgentTickState> {
  await ensureStateDir();
  const file = paths.agentTickJson();
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AgentTickState>;
    return { ...DEFAULT_STATE, ...parsed, schemaVersion: 1 };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...DEFAULT_STATE };
    }
    throw err;
  }
}

/**
 * Updates the tick state — increments counters, sets lastTickAt, etc.
 * Uses a simple lock-file to avoid races between concurrent dispatch calls.
 */
export async function updateTickState(
  patch: Partial<AgentTickState>,
): Promise<AgentTickState> {
  await ensureStateDir();
  const file = paths.agentTickJson();
  const lock = `${file}.lock`;

  // Try to acquire lock — bail after a few retries.
  const start = Date.now();
  for (;;) {
    try {
      const fd = await fs.open(lock, 'wx');
      await fd.close();
      break; // got the lock
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
      if (Date.now() - start > 5000) {
        // Stale lock — remove and retry once.
        try {
          await fs.unlink(lock);
        } catch {
          // ignore
        }
        const fd = await fs.open(lock, 'wx');
        await fd.close();
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  try {
    const current = await readTickState();
    const merged: AgentTickState = { ...current, ...patch, schemaVersion: 1 };
    await fs.writeFile(file, JSON.stringify(merged, null, 2) + '\n', 'utf8');
    return merged;
  } finally {
    try {
      await fs.unlink(lock);
    } catch {
      // ignore
    }
  }
}

/**
 * Computes daily counter rollover: if `now` is a different calendar day from
 * state.currentDay, resets dailyTickCount to 0.
 */
export function rolloverIfNewDay(state: AgentTickState, now: Date): AgentTickState {
  const today = formatDay(now);
  if (state.currentDay !== today) {
    return { ...state, currentDay: today, dailyTickCount: 0 };
  }
  return state;
}

function formatDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
