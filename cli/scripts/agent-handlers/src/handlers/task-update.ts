// scripts/agent-handlers/src/handlers/task-update.ts
// Tier 2 — Phase 2 placeholder. Will eventually shell out to `fo tasks.update --if-match`.

import { logAction } from '../action-log.js';
import type { TaskUpdateAction } from '../types.js';

export async function handleTaskUpdate(action: TaskUpdateAction): Promise<void> {
  await logAction({
    actor: 'agent',
    kind: 'note',
    summary: `[task-update PHASE 2 placeholder] would update ${action.args.ref}`,
    extra: {
      ifMatch: action.args.ifMatch,
      patchKeys: Object.keys(action.args.patch),
    },
  });
}
