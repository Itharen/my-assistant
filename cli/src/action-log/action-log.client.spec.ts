// Spec for action-log.client.ts — `logAction()` no-throw + actor/ts override.
// FR #3e Phase 1 — testing the refactor.

import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { logAction } from './action-log.client.js';

describe('| logAction', () => {
  let tmpRoot: string;
  let origEnv: string | undefined;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ma-actionlog-spec-'));
    origEnv = process.env.MA_LOG_ROOT;
    process.env.MA_LOG_ROOT = tmpRoot;
  });

  afterEach(async () => {
    if (origEnv === undefined) delete process.env.MA_LOG_ROOT;
    else process.env.MA_LOG_ROOT = origEnv;
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it('| írja a default actor=cli mezőt ha nincs override', async () => {
    await logAction({ kind: 'note', summary: 'default-actor smoke' });
    const files = await fs.readdir(tmpRoot);
    expect(files.length).toBe(1);
    const content = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const lines = content.trim().split('\n').filter((l) => l.length > 0);
    expect(lines.length).toBe(1);
    const entry = JSON.parse(lines[0]!) as Record<string, unknown>;
    expect(entry.actor).toBe('cli');
    expect(entry.kind).toBe('note');
    expect(entry.summary).toBe('default-actor smoke');
  });

  it('| átveszi az actor override-ot', async () => {
    await logAction({ kind: 'note', summary: 'actor override', actor: 'claude' });
    const files = await fs.readdir(tmpRoot);
    const content = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const entry = JSON.parse(content.trim()) as Record<string, unknown>;
    expect(entry.actor).toBe('claude');
  });

  it('| átveszi a ts override-ot és az adott napi fájlba ír', async () => {
    const customTs: string = '2026-01-15T10:30:00+01:00';
    await logAction({ kind: 'note', summary: 'ts override', ts: customTs });
    const files = await fs.readdir(tmpRoot);
    expect(files).toContain('2026-01-15.jsonl');
    const content = await fs.readFile(path.join(tmpRoot, '2026-01-15.jsonl'), 'utf8');
    const entry = JSON.parse(content.trim()) as Record<string, unknown>;
    expect(entry.ts).toBe(customTs);
  });

  it('| nem dob hibát ha az írás failel (no-throw kontraktus)', async () => {
    // Invalid path → fs.mkdir + fs.appendFile throws — logAction swallow-olja
    process.env.MA_LOG_ROOT = '\0invalid\0path\0';
    await expectAsync(logAction({ kind: 'note', summary: 'no-throw' })).toBeResolved();
  });

  it('| szabad-formátumú kind-ot is elfogad (string union widening)', async () => {
    await logAction({ kind: 'tool-call', summary: 'free-form kind' });
    await logAction({ kind: 'session-start', summary: 'another' });
    const files = await fs.readdir(tmpRoot);
    const content = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(2);
    expect((JSON.parse(lines[0]!) as Record<string, unknown>).kind).toBe('tool-call');
    expect((JSON.parse(lines[1]!) as Record<string, unknown>).kind).toBe('session-start');
  });
});
