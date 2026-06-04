// scripts/agent-handlers/test/plan-step-mark-done.test.mjs
// Regression-tesztek a plan-step-mark-done handlerhez (cycle 31). node:test stdlib.
// DOMÉN-2 IZOLÁCIÓ: MY_ASSISTANT_ROOT → tmp __agent/ (action-log izolálva).

import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'ma-plan-spec-'));
fs.mkdirSync(path.join(TMP_ROOT, '__agent', 'log', 'actions'), { recursive: true });
fs.writeFileSync(path.join(TMP_ROOT, 'CLAUDE.md'), '# tmp\n');
process.env.MY_ASSISTANT_ROOT = TMP_ROOT;

const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { handlePlanStepMarkDone } = await import('../dist/handlers/plan-step-mark-done.js');

let counter = 0;
function writePlan(content) {
  const p = path.join(TMP_ROOT, `plan-${counter++}.md`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}
function action(planPath, stepRef, evidence) {
  return { type: 'plan-step-mark-done', tier: 1, args: { planPath, stepRef, evidence } };
}

test('plan: list-item sor → " ✅" a végére', async () => {
  const p = writePlan('# Plan\n\n- Phase 1 — bootstrap\n- Phase 2 — wiring\n');
  await handlePlanStepMarkDone(action(p, 'Phase 1 — bootstrap', 'sha123'));
  const after = fs.readFileSync(p, 'utf-8');
  assert.match(after, /- Phase 1 — bootstrap ✅/);
  assert.doesNotMatch(after, /Phase 2 — wiring ✅/); // csak az első match
});

test('plan: tábla-sor (|...|) → ✅ az utolsó cellába a záró | elé', async () => {
  const p = writePlan('| # | Step | Done |\n|---|---|---|\n| 1 | bootstrap | nope |\n');
  await handlePlanStepMarkDone(action(p, 'bootstrap', 'sha456'));
  const after = fs.readFileSync(p, 'utf-8');
  const row = after.split('\n').find((l) => l.includes('bootstrap'));
  assert.ok(row.trimEnd().endsWith('|'), `row should still end with |: ${row}`);
  assert.match(row, /nope ✅\s*\|/); // ✅ az utolsó cella végén, záró | előtt
});

test('plan: idempotens — már ✅ → skip, NEM dupláz, fájl változatlan', async () => {
  const content = '# Plan\n\n- Phase 1 — done already ✅\n';
  const p = writePlan(content);
  await handlePlanStepMarkDone(action(p, 'Phase 1 — done already', 'sha789'));
  const after = fs.readFileSync(p, 'utf-8');
  assert.equal(after, content); // változatlan
  assert.equal((after.match(/✅/g) || []).length, 1); // nincs dupla ✅
});

test('plan: nemlétező stepRef → MA-PLAN-STEP-NOT-FOUND', async () => {
  const p = writePlan('# Plan\n\n- Phase 1\n');
  await assert.rejects(
    () => handlePlanStepMarkDone(action(p, 'Phase 99 — ghost', 'x')),
    /MA-PLAN-STEP-NOT-FOUND/,
  );
});

test('plan: nemlétező fájl → MA-PLAN-FILE-NOT-FOUND', async () => {
  await assert.rejects(
    () => handlePlanStepMarkDone(action(path.join(TMP_ROOT, 'nope.md'), 'x', 'y')),
    /MA-PLAN-FILE-NOT-FOUND/,
  );
});

test.after(() => fs.rmSync(TMP_ROOT, { recursive: true, force: true }));
