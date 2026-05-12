// scripts/agent-handlers/src/types.ts
// Type definitions for the A-mode agent output JSON.
// Source of truth: __agent/triggers/A-mode-entrypoint.md "Output" section.

export enum Verdict { urgens = 'urgens', softNudge = 'soft-nudge', noAction = 'no-action' }

export type ActionTier = 0 | 1 | 2 | 3;

export type ActionType =
  | 'log'
  | 'user-input-new'
  | 'update-status'
  | 'notify-cast'
  | 'task-create'
  | 'task-update';

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

export type Action =
  | LogAction
  | UserInputNewAction
  | UpdateStatusAction
  | NotifyCastAction
  | TaskCreateAction
  | TaskUpdateAction;

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
