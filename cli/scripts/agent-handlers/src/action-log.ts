// scripts/agent-handlers/src/action-log.ts
// Thin local writer for __agent/log/actions/<today>.jsonl. Never throws.

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { paths } from './paths.js';

export type ActionLogKind =
  | 'tool-call'
  | 'decision'
  | 'state-change'
  | 'flow-start'
  | 'flow-end'
  | 'ship'
  | 'error'
  | 'note'
  | 'external-action';

export interface ActionLogEntry {
  actor?: string;
  kind: ActionLogKind | (string & {});
  summary: string;
  ref?: string;
  extra?: Record<string, unknown>;
  ts?: string;
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

export async function logAction(entry: ActionLogEntry): Promise<void> {
  try {
    const ts = entry.ts ?? nowIsoBudapest();
    const day = ts.split('T')[0];
    const root = paths.actionLogDir();
    await fs.mkdir(root, { recursive: true });
    const out: Record<string, unknown> = {
      ts,
      actor: entry.actor ?? 'agent-dispatcher',
      kind: entry.kind,
      summary: entry.summary,
    };
    if (entry.ref) out.ref = entry.ref;
    if (entry.extra && Object.keys(entry.extra).length > 0) out.extra = entry.extra;
    await fs.appendFile(path.join(root, `${day}.jsonl`), JSON.stringify(out) + '\n', {
      encoding: 'utf8',
    });
  } catch {
    // Swallow — logging failures must not break dispatch.
  }
}
