// Thin, self-contained writer for the my-assistant action-log
// (`__agent/log/actions/YYYY-MM-DD.jsonl`). Used to emit lifecycle/action
// events from the CLI so they are visible across sessions.
//
// Schema reference: ../../../__agent/log/actions/README.md

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type ActionLogKind =
  | 'external-action'
  | 'error'
  | 'note'
  | 'flow-start'
  | 'flow-end'
  | 'state-change'
  | 'ship';

export interface ActionLogEntry {
  kind: ActionLogKind;
  summary: string;
  ref?: string;
  extra?: Record<string, unknown>;
}

const ACTOR = 'cli';

/**
 * Walk up from this file to find the project root (folder containing
 * both `__agent/` and `CLAUDE.md`), then return the action-log dir.
 * Falls back to `cli/../__agent/log/actions` if heuristics fail.
 */
function resolveLogRoot(): string {
  const fromEnv = process.env.MA_LOG_ROOT;
  if (fromEnv) return fromEnv;

  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, '__agent')) && existsSync(path.join(dir, 'CLAUDE.md'))) {
      return path.join(dir, '__agent', 'log', 'actions');
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback: assume cli/dist/action-log/ → up 3 = repo root
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', '..', '__agent', 'log', 'actions');
}

function nowIsoBudapest(): string {
  const d = new Date();
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
 * Append an action-log entry. Never throws.
 */
export async function logAction(entry: ActionLogEntry): Promise<void> {
  try {
    const root = resolveLogRoot();
    await fs.mkdir(root, { recursive: true });
    const ts = nowIsoBudapest();
    const day = ts.split('T')[0];
    const out: Record<string, unknown> = {
      ts,
      actor: ACTOR,
      kind: entry.kind,
      summary: entry.summary,
    };
    if (entry.ref) out.ref = entry.ref;
    if (entry.extra && Object.keys(entry.extra).length > 0) out.extra = entry.extra;
    await fs.appendFile(path.join(root, `${day}.jsonl`), JSON.stringify(out) + '\n', { encoding: 'utf8' });
  } catch {
    // swallow
  }
}
