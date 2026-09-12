// Thin, self-contained writer for the my-assistant action-log
// (`__agent/log/actions/YYYY-MM-DD.jsonl`). Used to emit lifecycle/action
// events from the CLI so they are visible across sessions.
//
// Schema reference: ../../../__agent/log/actions/README.md

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { ActionLogTestOrigin_Util } from './action-log.test-origin.js';

export type ActionLogKind =
  | 'external-action'
  | 'error'
  | 'note'
  | 'flow-start'
  | 'flow-end'
  | 'state-change'
  | 'ship';

export interface ActionLogEntry {
  kind: ActionLogKind | string;     // wider — hook-kinds (tool-call, file-edit, session-start, etc.) is OK
  summary: string;
  actor?: string;                    // default: 'cli'
  ref?: string;
  session?: string;                  // optional Claude session id (hook context)
  extra?: Record<string, unknown>;
  ts?: string;                       // ISO; default = nowIsoBudapest()
}

const DEFAULT_ACTOR: string = 'cli';

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

/** Structured error returned by `logAction()` when the write fails. */
export interface LogActionError {
  code: string;                                // MA-<MODULE>-<CODE> per error-handling.md
  message: string;
  stack?: string;
  details?: Record<string, unknown>;
}

export type LogActionResult =
  | { ok: true }
  | { ok: false; error: LogActionError };

/**
 * Append an action-log entry. Returns a Result — NEVER throws (so callers
 * in global error handlers / hot paths don't cascade), but **never silently
 * swallows** either: on failure, emits a structured error to stderr AND
 * returns `{ ok: false, error }` for the caller to surface.
 *
 * `actor` defaults to 'cli', `ts` defaults to nowIsoBudapest().
 *
 * Why Result + no-throw: per `current/principles/error-handling.md` "SEMMI
 * csendes catch" — the log layer must not be a black hole. Callers that
 * cannot meaningfully react (e.g. uncaughtException handler) explicitly
 * `void` the result; callers that CAN react (CLI commands) propagate the
 * error to their JSON envelope (`fail(...)`).
 */
export async function logAction(entry: ActionLogEntry): Promise<LogActionResult> {
  try {
    const root = resolveLogRoot();
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
    if (entry.session) out.session = entry.session;
    // 🧪 TESZT-BELYEG (21. tetel): ha spec-futasban vagyunk, a bejegyzes MEGJELOLVE kerul a
    // KOZOS naploba. ⭐ Igy a `ma doctor now` „utolso hiba" sora nem teszt-szemetet mutat —
    // ⛔ de nem is nemitjuk el: a kihagyott tetelek SZAMA latszik. A jel MERT, l.
    // `action-log.test-origin.ts`.
    const extra: Record<string, unknown> = {
      ...(entry.extra ?? {}),
      ...(ActionLogTestOrigin_Util.isTestRun()
        ? { [ActionLogTestOrigin_Util.MARKER_FIELD]: true }
        : {}),
    };

    if (Object.keys(extra).length > 0) out.extra = extra;
    await fs.appendFile(path.join(root, `${day}.jsonl`), JSON.stringify(out) + '\n', { encoding: 'utf8' });
    return { ok: true };
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));
    const error: LogActionError = {
      code: 'MA-LOG-WRITE-FAIL',
      message: e.message,
      stack: e.stack,
      details: {
        kind: entry.kind,
        summary: entry.summary.slice(0, 100),
        actor: entry.actor ?? DEFAULT_ACTOR,
      },
    };
    // Structured stderr emit — visible to the caller / hook / Claude session.
    // Outer try/catch: ha még a stderr is unwritable (tty closed), valóban
    // nincs hova logolni → documented silent fallback (utolsó láncszem).
    try {
      process.stderr.write(`[action-log] WRITE FAILED: ${JSON.stringify(error)}\n`);
    } catch (stderrErr) {
      // 🔴 A VÉGSŐ LÁNCSZEM: még a `stderr` sem írható (lezárt tty), tehát naplózni tényleg
      // nincs hova. ⛔ De a némaság így sem az egyetlen lehetőség: a hibát beletesszük a
      // VISSZAADOTT eredménybe, tehát a hívó látja, hogy **két külön dolog** bukott el —
      // maga az írás, ÉS a bukás jelzése is. Enélkül a második teljesen láthatatlan volt.
      error.details = { ...(error.details ?? {}), stderrFailure: String(stderrErr) };
    }
    return { ok: false, error };
  }
}
