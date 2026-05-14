// scripts/agent-handlers/src/types.ts
// Type definitions for the Assistant Agent Cron Job output JSON.
// Source of truth: __agent/triggers/assistant-agent-cron-entrypoint.md "Output" section.

export enum Verdict { urgens = 'urgens', softNudge = 'soft-nudge', noAction = 'no-action' }

export type ActionTier = 0 | 1 | 2 | 3;

export type ActionType =
  | 'log'
  | 'user-input-new'
  | 'update-status'
  | 'notify-cast'
  | 'ccap-notify'
  | 'task-create'
  | 'task-update'
  | 'fr-status-change'
  | 'plan-step-mark-done';

export interface BaseAction {
  type: ActionType;
  tier: ActionTier;
  args: Record<string, unknown>;
}

export interface LogAction extends BaseAction {
  type: 'log';
  tier: 0;
  args: { kind: string; summary: string; ref?: string };
}

export interface UserInputNewAction extends BaseAction {
  type: 'user-input-new';
  tier: 1;
  args: {
    title: string;
    kind: 'task' | 'feedback' | 'approval' | 'rejection' | 'feature-request' | 'instruction';
    domain: string;
    body: string;
  };
}

export interface UpdateStatusAction extends BaseAction {
  type: 'update-status';
  tier: 1;
  args: {
    field: 'next_action' | 'last_event_type';
    value: string;
  };
}

export interface NotifyCastAction extends BaseAction {
  type: 'notify-cast';
  tier: 1;
  args: {
    text: string;
    target?: string;
    throttleId?: string;
    cooldownMs?: number;                       // per-action override; default in throttle.ts
  };
}

export interface CcapNotifyAction extends BaseAction {
  type: 'ccap-notify';
  tier: 1;
  args: {
    title: string;
    type?: 'message' | 'confirm' | 'option-select' | 'question';
    description?: string;
    priority?: 'info' | 'warning' | 'success' | 'error';
    options?: string;
    wait?: boolean;
    sessionId?: string;
    throttleId?: string;                       // Phase 4 közös throttle (FR #1)
    cooldownMs?: number;
  };
}

export interface TaskCreateAction extends BaseAction {
  type: 'task-create';
  tier: 2;
  args: {
    title: string;
    description: string; // MUST include "Forrás-szabály: ..."
    priority?: number;
    dueDate?: string;
  };
}

export interface TaskUpdateAction extends BaseAction {
  type: 'task-update';
  tier: 2;
  args: {
    ref: string;
    ifMatch: string;
    patch: Record<string, unknown>;
  };
}

export interface FrStatusChangeAction extends BaseAction {
  type: 'fr-status-change';
  tier: 1;
  args: {
    frPath: string;                            // relative-from-projectRoot OR absolute
    fromStatus: string;                        // expected substring in current Status (preflight)
    toStatus: string;                          // new status (free-form, e.g. "✅ shipped (cycle 31)")
    reason?: string;
  };
}

export interface PlanStepMarkDoneAction extends BaseAction {
  type: 'plan-step-mark-done';
  tier: 1;
  args: {
    planPath: string;
    stepRef: string;                           // substring identifying the step line/row
    evidence?: string;                         // e.g. commit-sha, cycle id
  };
}

export type Action =
  | LogAction
  | UserInputNewAction
  | UpdateStatusAction
  | NotifyCastAction
  | CcapNotifyAction
  | TaskCreateAction
  | TaskUpdateAction
  | FrStatusChangeAction
  | PlanStepMarkDoneAction;

export interface AgentOutput {
  verdict: Verdict;
  reason: string;
  actions: Action[];
  tickMeta: {
    tickedAt: string;
    inputDigest: string;
  };
}

export interface DispatchResult {
  ok: boolean;
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  details: Array<{
    index: number;
    type: ActionType;
    status: 'ok' | 'failed' | 'skipped';
    reason?: string;
  }>;
}
