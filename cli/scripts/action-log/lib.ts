// scripts/action-log/lib.ts
//
// Action-log writer for Node/TypeScript projects in the my-assistant repo.
// Append-only JSONL writer to __agent/log/actions/YYYY-MM-DD.jsonl.
//
// Schema: see __agent/log/actions/README.md
//
// Usage:
//   import { logAction } from '../../scripts/action-log/lib.js';
//   await logAction({
//     actor: 'cast-notifier',
//     kind: 'external-action',
//     summary: 'notify done',
//     ref: '...',
//     extra: { devices: 6 },
//   });

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export type ActionLogKind =
  | 'session-start'
  | 'session-end'
  | 'user-msg'
  | 'assistant-turn-end'
  | 'tool-call'
  | 'file-edit'
  | 'file-write'
  | 'bash'
  | 'decision'
  | 'flow-start'
  | 'flow-end'
  | 'state-change'
  | 'ship'
  | 'error'
  | 'note'
  | 'external-action';

export interface ActionLogEntry {
  actor: string;
  kind: ActionLogKind | (string & {});
  summary: string;
  ref?: string;
  session?: string;
  extra?: Record<string, unknown>;
  ts?: string;
}

/**
 * Compute Europe/Budapest local-time ISO string with explicit offset.
 * Falls back to system local time if Intl/timezone is unavailable.
 */
function nowIsoBudapest(): string {
  const d = new Date();
  // Use system local time + offset — assumes the host runs in Europe/Budapest.
  // (cast-notifier and activity-monitor run on the user's Windows box, so this holds.)
  const pad = (n: number) => String(n).padStart(2, '0');
  const offMin = -d.getTimezoneOffset();
  const sign = offMin >= 0 ? '+' : '-';
  const abs = Math.abs(offMin);
  const offset = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${offset}`
  );
}

/**
 * Resolve the action-log root directory. Walks up from this file looking for
 * `__agent/log/actions`. Falls back to AL_LOG_ROOT env var if set.
 */
function resolveLogRoot(): string {
  const fromEnv = process.env.AL_LOG_ROOT;
  if (fromEnv) return fromEnv;

  const here = path.dirname(fileURLToPath(import.meta.url));
  // here = .../scripts/action-log → up two levels to project root
  const projectRoot = path.resolve(here, '..', '..');
  return path.join(projectRoot, '__agent', 'log', 'actions');
}

/**
 * Append a single action-log entry. Never throws — failures are swallowed,
 * so logging issues can't break the caller.
 */
export async function logAction(entry: ActionLogEntry): Promise<void> {
  try {
    const ts = entry.ts ?? nowIsoBudapest();
    const day = ts.split('T')[0];
    const root = resolveLogRoot();
    await fs.mkdir(root, { recursive: true });

    const out: Record<string, unknown> = {
      ts,
      actor: entry.actor,
      kind: entry.kind,
      summary: entry.summary,
    };
    if (entry.ref) out.ref = entry.ref;
    if (entry.session) out.session = entry.session;
    if (entry.extra && Object.keys(entry.extra).length > 0) out.extra = entry.extra;

    const line = JSON.stringify(out) + '\n';
    await fs.appendFile(path.join(root, `${day}.jsonl`), line, { encoding: 'utf8' });
  } catch {
    // Swallow — logging must not break workflows.
  }
}

/**
 * Synchronous variant for short-lived scripts where awaiting is awkward
 * (e.g. last call before process.exit). Same swallow-errors behavior.
 */
export function logActionSync(entry: ActionLogEntry): void {
  try {
    // Lazy require to keep the async path zero-dep.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fsSync = require('node:fs') as typeof import('node:fs');
    const ts = entry.ts ?? nowIsoBudapest();
    const day = ts.split('T')[0];
    const root = resolveLogRoot();
    fsSync.mkdirSync(root, { recursive: true });
    const out: Record<string, unknown> = {
      ts,
      actor: entry.actor,
      kind: entry.kind,
      summary: entry.summary,
    };
    if (entry.ref) out.ref = entry.ref;
    if (entry.session) out.session = entry.session;
    if (entry.extra && Object.keys(entry.extra).length > 0) out.extra = entry.extra;
    fsSync.appendFileSync(path.join(root, `${day}.jsonl`), JSON.stringify(out) + '\n', { encoding: 'utf8' });
  } catch {
    // Swallow.
  }
}
