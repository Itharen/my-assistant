// Safe-call helper teardown-szerű operációkhoz (`close()`, `stop()`, `destroy()`).
// Per error-handling.md "explicit kommentált swallow" — close/stop failure
// teardown-pontokon nem fatal (a caller már exit/reject/resolve-ben van),
// de NEM silent: minden ilyen `note` action-log entry-t kap, hogy auditolható
// legyen.
//
// FR: error-handling-cleanup Phase 2 (cycle 27) létrehozva cast/internal/-ben,
// Phase 3 (cycle 28) áthelyezve utils/-ba (cross-cutting: cast + google).

import { logAction } from '../action-log/action-log.client.js';

/**
 * Hívd meg a teardown-thunk-ot. Hiba esetén `note` action-log emit (NEM
 * `error`, mert nem reálisan kezelendő — csak audit-trail).
 *
 * @param fn  teardown művelet (pl. `() => client.close()`)
 * @param label  beazonosító cimke a logban (pl. `'cast-client.close'`)
 */
export function safeCall(fn: () => void, label: string): void {
  try {
    fn();
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : String(err);
    // Fire-and-forget — logAction Result-t ad, de itt nem érdekes (vissza-recurse
    // ellen védve a logAction belső stderr emit-jével).
    void logAction({
      kind: 'note',
      summary: `safeCall: ${label} failed (non-fatal teardown)`,
      extra: { label, error: msg, code: 'MA-TEARDOWN-NONFATAL' },
    });
  }
}
