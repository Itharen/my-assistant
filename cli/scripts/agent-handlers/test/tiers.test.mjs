// scripts/agent-handlers/test/tiers.test.mjs
// Regression-tesztek a `gateAction` tier-gating logikára (a dispatcher
// biztonsági magja). node:test (Node stdlib) a compiled dist/-en.
//
// SoT: __agent/triggers/assistant-agent-cron-entrypoint.md "Tier-szabályok"
// - Tier 0 (log): mindig OK
// - Tier 1/2: OK ha NEM alszik; sleep-window alatt skip
// - Tier 3: SOHA nem auto-futtatható

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { gateAction } from '../dist/tiers.js';

const awake = { isSleeping: false };
const asleep = { isSleeping: true };

test('tiers: Tier 0 (log) mindig OK — ébren is, alvás alatt is', () => {
  const a = { type: 'log', tier: 0, args: { kind: 'note', summary: 's' } };
  assert.equal(gateAction(a, awake).ok, true);
  assert.equal(gateAction(a, asleep).ok, true);
});

test('tiers: Tier 1 ébren OK', () => {
  const a = { type: 'notify-discord', tier: 1, args: {} };
  assert.equal(gateAction(a, awake).ok, true);
});

test('tiers: Tier 1 alvás alatt skip (reason-nel)', () => {
  const a = { type: 'notify-discord', tier: 1, args: {} };
  const r = gateAction(a, asleep);
  assert.equal(r.ok, false);
  assert.match(r.reason, /sleep-window/);
});

test('tiers: Tier 2 ébren OK, alvás alatt skip', () => {
  const a = { type: 'task-create', tier: 2, args: {} };
  assert.equal(gateAction(a, awake).ok, true);
  assert.equal(gateAction(a, asleep).ok, false);
});

test('tiers: Tier 3 SOHA nem auto-futtatható — ébren is blokkolt', () => {
  const a = { type: 'whatever', tier: 3, args: {} };
  const rAwake = gateAction(a, awake);
  const rAsleep = gateAction(a, asleep);
  assert.equal(rAwake.ok, false);
  assert.match(rAwake.reason, /Tier 3/);
  assert.equal(rAsleep.ok, false);
});
