// scripts/agent-handlers/test/schema-core.test.mjs
// Regression-tesztek a schema-validátor MAG-jára (a notify-* típusokon túl):
// top-level struktúra, agent-mező, max-5-action, és a core action-típusok
// (log / user-input-new / update-status / task-create / task-update).
// node:test (Node stdlib) a compiled dist/-en.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateAgentOutput } from '../dist/schema.js';

const TICK_META = { tickedAt: '2026-06-03T14:00:00+02:00', inputDigest: 'test' };

function out(over = {}) {
  return { verdict: 'soft-nudge', reason: 'test', actions: [], tickMeta: TICK_META, ...over };
}
function errs(input) {
  const r = validateAgentOutput(input);
  return r.ok ? [] : r.errors.map((e) => `${e.path}: ${e.message}`);
}

// ─── top-level struktúra ───────────────────────────────────────────────────

test('schema: üres actions-szel valid', () => {
  assert.equal(validateAgentOutput(out()).ok, true);
});

test('schema: nem-objektum input → error', () => {
  assert.ok(errs(null).length > 0);
  assert.ok(errs('x').length > 0);
});

test('schema: rossz verdict → error', () => {
  assert.ok(errs(out({ verdict: 'maybe' })).some((e) => e.includes('verdict')));
});

test('schema: üres reason → error', () => {
  assert.ok(errs(out({ reason: '' })).some((e) => e.includes('reason')));
});

test('schema: hiányzó tickMeta.tickedAt → error', () => {
  assert.ok(errs(out({ tickMeta: { inputDigest: 'x' } })).some((e) => e.includes('tickedAt')));
});

test('schema: >5 action → error (max 5/tick)', () => {
  const five = { type: 'log', tier: 0, args: { kind: 'note', summary: 's' } };
  assert.ok(errs(out({ actions: Array(6).fill(five) })).some((e) => e.includes('max 5')));
});

test('schema: agent mező — valid "development", invalid "foo"', () => {
  assert.equal(validateAgentOutput(out({ agent: 'development' })).ok, true);
  assert.ok(errs(out({ agent: 'foo' })).some((e) => e.includes('agent')));
});

// ─── core action-típusok ───────────────────────────────────────────────────

test('schema: log valid + hiányzó summary → error', () => {
  assert.equal(validateAgentOutput(out({ actions: [{ type: 'log', tier: 0, args: { kind: 'note', summary: 's' } }] })).ok, true);
  assert.ok(errs(out({ actions: [{ type: 'log', tier: 0, args: { kind: 'note' } }] })).some((e) => e.includes('summary')));
});

test('schema: user-input-new rossz kind → error', () => {
  const a = { type: 'user-input-new', tier: 1, args: { title: 'T', kind: 'bogus', domain: 'dev', body: 'b' } };
  assert.ok(errs(out({ actions: [a] })).some((e) => e.includes('kind')));
});

test('schema: update-status rossz field → error', () => {
  const a = { type: 'update-status', tier: 1, args: { field: 'bogus', value: 'v' } };
  assert.ok(errs(out({ actions: [a] })).some((e) => e.includes('field')));
});

test('schema: task-create Tier-2 "Forrás-szabály" kényszer', () => {
  const ok = { type: 'task-create', tier: 2, args: { title: 'T', description: 'Forrás-szabály: recurring-tasks.md' } };
  const bad = { type: 'task-create', tier: 2, args: { title: 'T', description: 'csak egy leírás' } };
  assert.equal(validateAgentOutput(out({ actions: [ok] })).ok, true);
  assert.ok(errs(out({ actions: [bad] })).some((e) => e.includes('Forrás-szabály')));
});

test('schema: task-update hiányzó ifMatch + rossz patch → error', () => {
  const a = { type: 'task-update', tier: 2, args: { ref: 'org:task:1', patch: 'nope' } };
  const e = errs(out({ actions: [a] }));
  assert.ok(e.some((x) => x.includes('ifMatch')));
  assert.ok(e.some((x) => x.includes('patch')));
});

test('schema: ismeretlen action-type → error', () => {
  assert.ok(errs(out({ actions: [{ type: 'teleport', tier: 1, args: {} }] })).some((e) => e.includes('type')));
});
