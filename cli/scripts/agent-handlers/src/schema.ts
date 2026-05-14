// scripts/agent-handlers/src/schema.ts
// Manual JSON validator (no external deps). Returns a list of errors;
// empty list = valid.

import { Verdict } from './types.js';
import type { AgentOutput, Action, ActionType, ActionTier } from './types.js';

const VERDICTS: ReadonlySet<Verdict> = new Set([Verdict.urgens, Verdict.softNudge, Verdict.noAction]);
const ACTION_TYPES: ReadonlySet<ActionType> = new Set([
  'log',
  'user-input-new',
  'update-status',
  'notify-cast',
  'ccap-notify',
  'task-create',
  'task-update',
  'fr-status-change',
  'plan-step-mark-done',
]);

// Tier each action MUST have. Mismatch = validation error.
const REQUIRED_TIER: Record<ActionType, ActionTier> = {
  log: 0,
  'user-input-new': 1,
  'update-status': 1,
  'notify-cast': 1,
  'ccap-notify': 1,
  'task-create': 2,
  'task-update': 2,
  'fr-status-change': 1,
  'plan-step-mark-done': 1,
};

const VALID_CCAP_NOTIFY_TYPES = new Set(['message', 'confirm', 'option-select', 'question']);
const VALID_CCAP_PRIORITIES = new Set(['info', 'warning', 'success', 'error']);

const VALID_USER_INPUT_KINDS = new Set([
  'task',
  'feedback',
  'approval',
  'rejection',
  'feature-request',
  'instruction',
]);

const VALID_STATUS_FIELDS = new Set(['next_action', 'last_event_type']);

export interface ValidationError {
  path: string;
  message: string;
}

export function validateAgentOutput(input: unknown): {
  ok: boolean;
  errors: ValidationError[];
  output?: AgentOutput;
} {
  const errors: ValidationError[] = [];

  if (typeof input !== 'object' || input === null) {
    return { ok: false, errors: [{ path: '$', message: 'must be an object' }] };
  }
  const o = input as Record<string, unknown>;

  // verdict
  if (typeof o.verdict !== 'string' || !VERDICTS.has(o.verdict as Verdict)) {
    errors.push({
      path: '$.verdict',
      message: `must be one of: ${[...VERDICTS].join(', ')}`,
    });
  }

  // reason
  if (typeof o.reason !== 'string' || o.reason.length === 0) {
    errors.push({ path: '$.reason', message: 'must be a non-empty string' });
  }

  // actions
  if (!Array.isArray(o.actions)) {
    errors.push({ path: '$.actions', message: 'must be an array' });
  } else {
    if (o.actions.length > 5) {
      errors.push({ path: '$.actions', message: 'max 5 actions per tick' });
    }
    o.actions.forEach((a, i) => validateAction(a, i, errors));
  }

  // tickMeta
  if (typeof o.tickMeta !== 'object' || o.tickMeta === null) {
    errors.push({ path: '$.tickMeta', message: 'must be an object' });
  } else {
    const tm = o.tickMeta as Record<string, unknown>;
    if (typeof tm.tickedAt !== 'string' || tm.tickedAt.length === 0) {
      errors.push({ path: '$.tickMeta.tickedAt', message: 'must be a non-empty string' });
    }
    if (typeof tm.inputDigest !== 'string') {
      errors.push({ path: '$.tickMeta.inputDigest', message: 'must be a string' });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, errors: [], output: o as unknown as AgentOutput };
}

function validateAction(action: unknown, index: number, errors: ValidationError[]): void {
  const path = `$.actions[${index}]`;
  if (typeof action !== 'object' || action === null) {
    errors.push({ path, message: 'must be an object' });
    return;
  }
  const a = action as Record<string, unknown>;

  if (typeof a.type !== 'string' || !ACTION_TYPES.has(a.type as ActionType)) {
    errors.push({
      path: `${path}.type`,
      message: `must be one of: ${[...ACTION_TYPES].join(', ')}`,
    });
    return; // can't validate args without type
  }

  const expectedTier = REQUIRED_TIER[a.type as ActionType];
  if (a.tier !== expectedTier) {
    errors.push({
      path: `${path}.tier`,
      message: `for type "${a.type}" must be ${expectedTier} (got ${a.tier})`,
    });
  }

  if (typeof a.args !== 'object' || a.args === null) {
    errors.push({ path: `${path}.args`, message: 'must be an object' });
    return;
  }

  const args = a.args as Record<string, unknown>;
  switch (a.type as ActionType) {
    case 'log':
      requireString(args, 'kind', `${path}.args`, errors);
      requireString(args, 'summary', `${path}.args`, errors);
      break;
    case 'user-input-new':
      requireString(args, 'title', `${path}.args`, errors);
      requireString(args, 'kind', `${path}.args`, errors);
      if (typeof args.kind === 'string' && !VALID_USER_INPUT_KINDS.has(args.kind)) {
        errors.push({
          path: `${path}.args.kind`,
          message: `must be one of: ${[...VALID_USER_INPUT_KINDS].join(', ')}`,
        });
      }
      requireString(args, 'domain', `${path}.args`, errors);
      requireString(args, 'body', `${path}.args`, errors);
      break;
    case 'update-status':
      requireString(args, 'field', `${path}.args`, errors);
      if (typeof args.field === 'string' && !VALID_STATUS_FIELDS.has(args.field)) {
        errors.push({
          path: `${path}.args.field`,
          message: `must be one of: ${[...VALID_STATUS_FIELDS].join(', ')}`,
        });
      }
      requireString(args, 'value', `${path}.args`, errors);
      break;
    case 'notify-cast':
      requireString(args, 'text', `${path}.args`, errors);
      if (args.cooldownMs !== undefined && (typeof args.cooldownMs !== 'number' || args.cooldownMs < 0)) {
        errors.push({ path: `${path}.args.cooldownMs`, message: 'must be a non-negative number' });
      }
      break;
    case 'ccap-notify':
      requireString(args, 'title', `${path}.args`, errors);
      if (args.type !== undefined && (typeof args.type !== 'string' || !VALID_CCAP_NOTIFY_TYPES.has(args.type))) {
        errors.push({
          path: `${path}.args.type`,
          message: `must be one of: ${[...VALID_CCAP_NOTIFY_TYPES].join(', ')}`,
        });
      }
      if (args.priority !== undefined && (typeof args.priority !== 'string' || !VALID_CCAP_PRIORITIES.has(args.priority))) {
        errors.push({
          path: `${path}.args.priority`,
          message: `must be one of: ${[...VALID_CCAP_PRIORITIES].join(', ')}`,
        });
      }
      if (args.wait !== undefined && typeof args.wait !== 'boolean') {
        errors.push({ path: `${path}.args.wait`, message: 'must be a boolean' });
      }
      if (args.cooldownMs !== undefined && (typeof args.cooldownMs !== 'number' || args.cooldownMs < 0)) {
        errors.push({ path: `${path}.args.cooldownMs`, message: 'must be a non-negative number' });
      }
      break;
    case 'task-create':
      requireString(args, 'title', `${path}.args`, errors);
      requireString(args, 'description', `${path}.args`, errors);
      // Tier 2 enforcement: description must contain a clear-rule reference
      if (typeof args.description === 'string' && !/forr[áa]s-?szab[áa]ly/i.test(args.description)) {
        errors.push({
          path: `${path}.args.description`,
          message: 'Tier 2 task-create requires "Forrás-szabály: ..." reference in description',
        });
      }
      break;
    case 'task-update':
      requireString(args, 'ref', `${path}.args`, errors);
      requireString(args, 'ifMatch', `${path}.args`, errors);
      if (typeof args.patch !== 'object' || args.patch === null) {
        errors.push({ path: `${path}.args.patch`, message: 'must be an object' });
      }
      break;
    case 'fr-status-change':
      requireString(args, 'frPath', `${path}.args`, errors);
      requireString(args, 'fromStatus', `${path}.args`, errors);
      requireString(args, 'toStatus', `${path}.args`, errors);
      break;
    case 'plan-step-mark-done':
      requireString(args, 'planPath', `${path}.args`, errors);
      requireString(args, 'stepRef', `${path}.args`, errors);
      break;
  }
}

function requireString(
  obj: Record<string, unknown>,
  field: string,
  basePath: string,
  errors: ValidationError[],
): void {
  if (typeof obj[field] !== 'string' || (obj[field] as string).length === 0) {
    errors.push({ path: `${basePath}.${field}`, message: 'must be a non-empty string' });
  }
}
