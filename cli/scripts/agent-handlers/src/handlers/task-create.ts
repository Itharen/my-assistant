// scripts/agent-handlers/src/handlers/task-create.ts
// Tier 2 — Phase 2 placeholder. Will eventually shell out to `fo tasks.create`.

import { logAction } from '../action-log.js';
import type { TaskCreateAction } from '../types.js';

export async function handleTaskCreate(action: TaskCreateAction): Promise<void> {
  await logAction({
    actor: 'agent',
    kind: 'note',
    summary: `[task-create PHASE 2 placeholder] would create task: "${action.args.title}"`,
    extra: {
      priority: action.args.priority,
      dueDate: action.args.dueDate,
      hasClearRuleRef: /forr[áa]s-?szab[áa]ly/i.test(action.args.description),
    },
  });
}
