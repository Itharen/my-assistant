// scripts/agent-handlers/src/handlers/notify-cast.ts
// Tier 1 — Phase 2 placeholder. Will eventually wrap cast-notifier `notify`
// subcommand and add throttle-id de-duplication via notify-throttle.json.

import { logAction } from '../action-log.js';
import type { NotifyCastAction } from '../types.js';

export async function handleNotifyCast(action: NotifyCastAction): Promise<void> {
  // PHASE 2 placeholder: just log that it would have notified.
  await logAction({
    actor: 'agent',
    kind: 'note',
    summary: `[notify-cast PHASE 2 placeholder] would say: "${action.args.text}"`,
    extra: {
      target: action.args.target ?? 'All Speakers',
      throttleId: action.args.throttleId,
    },
  });
}
