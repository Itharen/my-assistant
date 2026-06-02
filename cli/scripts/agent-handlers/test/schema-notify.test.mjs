// scripts/agent-handlers/test/schema-notify.test.mjs
// Regression-tesztek a schema-validátorhoz a notify-discord + notify-push
// action-típusokra (cycle 130-131). node:test (Node stdlib) a compiled dist-en.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateAgentOutput } from '../dist/schema.js';

/** Minimál érvényes AgentOutput wrapper egy action köré. */
function wrap(action) {
  return {
    verdict: 'soft-nudge',
    reason: 'test',
    actions: [action],
    tickMeta: { tickedAt: '2026-06-02T14:00:00+02:00', inputDigest: 'test' },
  };
}

function errorsFor(action) {
  const r = validateAgentOutput(wrap(action));
  return r.ok ? [] : r.errors.map((e) => `${e.path}: ${e.message}`);
}

// ─────────────────────────────────────────────────────────────────────────
// notify-discord
// ─────────────────────────────────────────────────────────────────────────

test('schema: notify-discord minimál valid (title + message)', () => {
  const r = validateAgentOutput(wrap({ type: 'notify-discord', tier: 1, args: { title: 'T', message: 'M' } }));
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('schema: notify-discord teljes valid (priority + color + mention + throttle)', () => {
  const r = validateAgentOutput(wrap({
    type: 'notify-discord', tier: 1,
    args: { title: 'T', message: 'M', priority: 'warning', color: 16711680, mention: 'user', throttleId: 'x', cooldownMs: 1000 },
  }));
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('schema: notify-discord hibás tier → error', () => {
  const errs = errorsFor({ type: 'notify-discord', tier: 0, args: { title: 'T', message: 'M' } });
  assert.ok(errs.some((e) => e.includes('.tier')), errs.join('; '));
});

test('schema: notify-discord hiányzó message → error', () => {
  const errs = errorsFor({ type: 'notify-discord', tier: 1, args: { title: 'T' } });
  assert.ok(errs.some((e) => e.includes('.message')), errs.join('; '));
});

test('schema: notify-discord rossz priority → error', () => {
  const errs = errorsFor({ type: 'notify-discord', tier: 1, args: { title: 'T', message: 'M', priority: 'bogus' } });
  assert.ok(errs.some((e) => e.includes('.priority')), errs.join('; '));
});

test('schema: notify-discord rossz mention → error', () => {
  const errs = errorsFor({ type: 'notify-discord', tier: 1, args: { title: 'T', message: 'M', mention: 'everyone' } });
  assert.ok(errs.some((e) => e.includes('.mention')), errs.join('; '));
});

// ─────────────────────────────────────────────────────────────────────────
// notify-push
// ─────────────────────────────────────────────────────────────────────────

test('schema: notify-push minimál valid (title + message)', () => {
  const r = validateAgentOutput(wrap({ type: 'notify-push', tier: 1, args: { title: 'T', message: 'M' } }));
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('schema: notify-push teljes valid (priority + tags + throttle)', () => {
  const r = validateAgentOutput(wrap({
    type: 'notify-push', tier: 1,
    args: { title: 'T', message: 'M', priority: 'max', tags: 'muscle,warning', throttleId: 'x', cooldownMs: 1000 },
  }));
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('schema: notify-push hibás tier → error', () => {
  const errs = errorsFor({ type: 'notify-push', tier: 2, args: { title: 'T', message: 'M' } });
  assert.ok(errs.some((e) => e.includes('.tier')), errs.join('; '));
});

test('schema: notify-push rossz priority → error (ntfy: min/low/default/high/max)', () => {
  const errs = errorsFor({ type: 'notify-push', tier: 1, args: { title: 'T', message: 'M', priority: 'urgent' } });
  assert.ok(errs.some((e) => e.includes('.priority')), errs.join('; '));
});

test('schema: notify-push tags nem-string → error', () => {
  const errs = errorsFor({ type: 'notify-push', tier: 1, args: { title: 'T', message: 'M', tags: ['a', 'b'] } });
  assert.ok(errs.some((e) => e.includes('.tags')), errs.join('; '));
});
