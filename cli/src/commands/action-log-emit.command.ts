// `ma action-log emit` — kanonikus belépés action-log entry íráshoz.
// FR #3e Phase 1 (action-log-cli-command). Hook + CLI lifecycle + ad-hoc
// scriptek mind ezen át írnak a jövőben.
//
// Args:
//   --kind <K>       (required) — entry kind (note, ship, error, tool-call, file-edit, ...)
//   --summary <S>    (required) — egy mondatos összefoglaló
//   --actor <A>      (optional) — default: 'cli'
//   --ref <R>        (optional) — fájl-/task-ref/url
//   --session <S>    (optional) — Claude session id (hook context)
//   --extra <JSON>   (optional) — JSON-encoded extra payload
//   --ts <ISO>       (optional) — default: now (Europe/Budapest)
//   --pretty         (optional) — pretty-print JSON envelope
//
// Output: stable JSON envelope stdout-ra.
// File-write: __agent/log/actions/<day>.jsonl
// Server POST: Phase 3+ — most stub (db-synced: false).

import { parseArgs } from 'node:util';
import { logAction } from '../action-log/action-log.client.js';
import { ok, fail, makeRequestId, writeEnvelope } from '../output/envelope.js';

export async function runActionLogEmitCommand(args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();

  let parsed;
  try {
    parsed = parseArgs({
      args,
      options: {
        kind:    { type: 'string' },
        summary: { type: 'string' },
        actor:   { type: 'string' },
        ref:     { type: 'string' },
        session: { type: 'string' },
        extra:   { type: 'string' },
        ts:      { type: 'string' },
        pretty:  { type: 'boolean' },
      },
      strict: false,
    });
  } catch (err) {
    writeEnvelope(
      fail('action-log.emit', requestId, startedAt, 'E_PARSE', (err as Error).message),
      false,
    );
    process.exit(2);
  }

  const v = parsed.values as Record<string, unknown>;
  const kind: unknown = v.kind;
  const summary: unknown = v.summary;
  const actor: unknown = v.actor;
  const ref: unknown = v.ref;
  const session: unknown = v.session;
  const extraRaw: unknown = v.extra;
  const ts: unknown = v.ts;
  const pretty: boolean = Boolean(v.pretty);

  if (typeof kind !== 'string' || kind.length === 0) {
    writeEnvelope(
      fail('action-log.emit', requestId, startedAt, 'E_MISSING_ARG', '--kind is required (non-empty string)'),
      pretty,
    );
    process.exit(2);
  }
  if (typeof summary !== 'string' || summary.length === 0) {
    writeEnvelope(
      fail('action-log.emit', requestId, startedAt, 'E_MISSING_ARG', '--summary is required (non-empty string)'),
      pretty,
    );
    process.exit(2);
  }

  let extraObj: Record<string, unknown> | undefined;
  if (typeof extraRaw === 'string' && extraRaw.length > 0) {
    try {
      const parsedExtra: unknown = JSON.parse(extraRaw);
      if (typeof parsedExtra !== 'object' || parsedExtra === null || Array.isArray(parsedExtra)) {
        throw new Error('--extra must be a JSON object');
      }
      extraObj = parsedExtra as Record<string, unknown>;
    } catch (err) {
      writeEnvelope(
        fail('action-log.emit', requestId, startedAt, 'E_EXTRA_JSON', `--extra invalid JSON: ${(err as Error).message}`),
        pretty,
      );
      process.exit(2);
    }
  }

  await logAction({
    kind: kind as string,
    summary: summary as string,
    actor: typeof actor === 'string' ? actor : undefined,
    ref: typeof ref === 'string' ? ref : undefined,
    session: typeof session === 'string' ? session : undefined,
    extra: extraObj,
    ts: typeof ts === 'string' ? ts : undefined,
  });

  // Phase 3+: POST http://127.0.0.1:39245/actions (best-effort, 500ms timeout).
  // Most stub — server endpoint még nem létezik.
  const dbSynced: boolean = false;

  const effectiveTs: string = typeof ts === 'string' && ts.length > 0 ? ts : new Date().toISOString();
  const day: string = effectiveTs.split('T')[0] ?? new Date().toISOString().split('T')[0]!;

  writeEnvelope(
    ok('action-log.emit', requestId, startedAt, {
      written: true,
      'db-synced': dbSynced,
      day,
    }),
    pretty,
  );
}
