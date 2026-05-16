// Server-side action-log writer. Append-only JSONL emit to
// `__agent/log/actions/<day>.jsonl`. Mirror-write a Dev Agent /
// Cron Job-féle entries-szel (közös fájl, `actor` mező különböztet).
//
// FR #3b Phase 4b (cycle 46): server-error → action-log emit a globális
// error handler-en át, így a Dev Agent `02-audit` mind a DB-perzisztált
// `fdp_errors` collection-ből, mind a fájl-action-log-ból láthatja a
// runtime hibákat (per `__agent/WORKFLOW_DEV.md` alapelv #21).
//
// No-throw kontraktus — a logging-fail soha nem dobhatja vissza a hívó
// error-handler-t (recurse védelem).

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ServerActionLogEntry {
  kind: string;                                  // 'error', 'note', 'state-change', ...
  summary: string;
  actor?: string;                                // default: 'server'
  ref?: string;
  extra?: Record<string, unknown>;
  ts?: string;                                   // ISO; default = nowIsoBudapest()
}

const DEFAULT_ACTOR: string = 'server';

function resolveActionLogDir(): string {
  // ESM-compat: import.meta.dirname Node 20.11+
  // Server build layout: server/build/_collections/action-log.util.js → up 3 = repo root
  // Server source layout: server/src/_collections/action-log.util.ts → up 3 = repo root
  const here: string = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', '..', '__agent', 'log', 'actions');
}

function nowIsoBudapest(): string {
  const d: Date = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  const offMin: number = -d.getTimezoneOffset();
  const sign: string = offMin >= 0 ? '+' : '-';
  const abs: number = Math.abs(offMin);
  const offset: string = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${offset}`
  );
}

/**
 * Server-side action-log emit. No-throw — append-only JSONL writer.
 * On failure, structured stderr emit (per `error-handling.md` "SEMMI csendes
 * catch" — visible without dobálni vissza a hívót).
 */
export async function emitServerActionLog(entry: ServerActionLogEntry): Promise<void> {
  try {
    const root: string = resolveActionLogDir();
    await fs.mkdir(root, { recursive: true });
    const ts: string = entry.ts ?? nowIsoBudapest();
    const day: string = ts.split('T')[0] ?? new Date().toISOString().split('T')[0]!;
    const out: Record<string, unknown> = {
      ts,
      actor: entry.actor ?? DEFAULT_ACTOR,
      kind: entry.kind,
      summary: entry.summary,
    };
    if (entry.ref) out.ref = entry.ref;
    if (entry.extra && Object.keys(entry.extra).length > 0) out.extra = entry.extra;
    await fs.appendFile(path.join(root, `${day}.jsonl`), JSON.stringify(out) + '\n', { encoding: 'utf8' });
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));
    const errObj: Record<string, unknown> = {
      code: 'MA-SERVER-ACTION-LOG-WRITE-FAIL',
      message: e.message,
      stack: e.stack,
      details: { kind: entry.kind, summary: entry.summary.slice(0, 100) },
    };
    try {
      process.stderr.write(`[server/action-log] WRITE FAILED: ${JSON.stringify(errObj)}\n`);
    } catch {
      // Last-resort silent (stderr unwritable — recurse-resistant).
    }
  }
}
