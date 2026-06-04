// scripts/agent-handlers/test/fr-status-change.test.mjs
// Regression-tesztek a fr-status-change handlerhez (cycle 31). node:test stdlib.
//
// DOMÉN-2 IZOLÁCIÓ: MY_ASSISTANT_ROOT → tmp `__agent/`-re mutat (az action-log
// oda ír, NEM a valódi projektbe). Az FR-fájlok abszolút temp-path-ok → a
// projectRoot() csak az action-loghoz kell. A `node --test` minden fájlt külön
// process-ben futtat → a paths.js cache izolált.

import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

// Temp root + __agent/log/actions a setup ELŐTT, hogy a lazy projectRoot()
// (első handler-híváskor) ezt cache-elje. (Az import-ok hoist-olnak, de a
// projectRoot lazy → ez a top-level statement előbb fut, mint bármely teszt.)
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'ma-fr-spec-'));
fs.mkdirSync(path.join(TMP_ROOT, '__agent', 'log', 'actions'), { recursive: true });
fs.writeFileSync(path.join(TMP_ROOT, 'CLAUDE.md'), '# tmp\n');
process.env.MY_ASSISTANT_ROOT = TMP_ROOT;

const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { handleFrStatusChange } = await import('../dist/handlers/fr-status-change.js');

let counter = 0;
function writeFr(content) {
  const p = path.join(TMP_ROOT, `fr-${counter++}.md`);
  fs.writeFileSync(p, content, 'utf-8');
  return p;
}
function action(frPath, fromStatus, toStatus) {
  return { type: 'fr-status-change', tier: 1, args: { frPath, fromStatus, toStatus } };
}

test('fr: sikeres status-csere a ## Status blokkban', async () => {
  const p = writeFr('# FR\n\nIntro.\n\n## Status\n\n🟡 backlog — not started\n\n## Kapcsolódik\n- x\n');
  await handleFrStatusChange(action(p, '🟡 backlog — not started', '✅ shipped (cycle 135)'));
  const after = fs.readFileSync(p, 'utf-8');
  assert.match(after, /## Status\s+✅ shipped \(cycle 135\)/);
  assert.match(after, /## Kapcsolódik/); // többi szekció érintetlen
});

test('fr: csak a Status-blokkon belül cserél (body-beli azonos szöveg érintetlen)', async () => {
  const p = writeFr('# FR\n\n🟡 todo (decoy body)\n\n## Status\n\n🟡 todo (decoy body)\n\n## Next\n');
  await handleFrStatusChange(action(p, '🟡 todo (decoy body)', '✅ done'));
  const after = fs.readFileSync(p, 'utf-8');
  // A body-beli első előfordulás marad, a Status-blokk-beli változik.
  const bodyPart = after.slice(0, after.indexOf('## Status'));
  const statusPart = after.slice(after.indexOf('## Status'));
  assert.match(bodyPart, /🟡 todo \(decoy body\)/); // body decoy érintetlen
  assert.match(statusPart, /✅ done/);
  assert.doesNotMatch(statusPart, /🟡 todo/);
});

test('fr: nemlétező fájl → MA-FR-FILE-NOT-FOUND', async () => {
  await assert.rejects(
    () => handleFrStatusChange(action(path.join(TMP_ROOT, 'nope.md'), 'a', 'b')),
    /MA-FR-FILE-NOT-FOUND/,
  );
});

test('fr: hiányzó ## Status → MA-FR-STATUS-MISSING', async () => {
  const p = writeFr('# FR\n\nNo status heading here.\n');
  await assert.rejects(() => handleFrStatusChange(action(p, 'x', 'y')), /MA-FR-STATUS-MISSING/);
});

test('fr: fromStatus nincs a Status-blokkban → MA-FR-STATUS-MISMATCH', async () => {
  const p = writeFr('# FR\n\n## Status\n\n🟢 active\n');
  await assert.rejects(
    () => handleFrStatusChange(action(p, '🔴 nonexistent', 'y')),
    /MA-FR-STATUS-MISMATCH/,
  );
});

test.after(() => fs.rmSync(TMP_ROOT, { recursive: true, force: true }));
