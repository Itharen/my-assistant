// scripts/agent-handlers/src/tiers.ts
// Tier-based action gating.
// Source of truth: __agent/triggers/A-mode-entrypoint.md "Tier-szabályok"

import type { Action, ActionTier } from './types.js';

export interface TierGateContext {
  /** Is the user currently in a sleep window? */
  isSleeping: boolean;
}

export type TierGateResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Decides whether a given action is allowed to execute right now.
 *
 * - Tier 0 (log): always allowed
 * - Tier 1 (user-input-new, update-status, notify-cast): allowed unless sleeping
 *     (during sleep, only Tier 0 runs; Tier 1+ are skipped — Phase 2 will
 *     route them to a pending-notifications queue)
 * - Tier 2 (task-create, task-update): allowed if description has clear-rule
 *     reference (already enforced in schema validation), and not sleeping
 * - Tier 3: never allowed automatically
 */
export function gateAction(action: Action, ctx: TierGateContext): TierGateResult {
  const tier = action.tier as ActionTier;

  if (tier === 0) return { ok: true };

  if (tier === 3) {
    return { ok: false, reason: 'Tier 3 actions are forbidden for auto-execution' };
  }

  if (ctx.isSleeping && tier >= 1) {
    return {
      ok: false,
      reason: `sleep-window active — Tier ${tier} action skipped (Phase 2 will queue these)`,
    };
  }

  return { ok: true };
}
