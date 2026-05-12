// scripts/agent-handlers/src/handlers/log.ts
// Tier 0 — emits a single line to __agent/log/actions/<today>.jsonl.

import { logAction } from '../action-log.js';
import type { LogAction } from '../types.js';

export async function handleLog(action: LogAction): Promise<void> {
  await logAction({
    actor: 'agent',
    kind: action.args.kind,
    summary: action.args.summary,
    ref: action.args.ref,
  });
}
