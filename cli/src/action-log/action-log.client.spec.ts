// Spec for action-log.client.ts — `logAction()` no-throw + actor/ts override
// + structured Result-pattern (error-handling-cleanup Phase 1).

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

  it('| írja a default actor=cli mezőt ha nincs override, ok:true visszatérés', async () => {
    const result = await logAction({ kind: 'note', summary: 'default-actor smoke' });
    expect(result.ok).toBe(true);
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

  it('| nem dob hibát ha az írás failel (no-throw kontraktus) + ok:false strukturált error', async () => {
    // Trigger write failure: place a FILE at the path where logAction tries to
    // create a DIRECTORY. fs.mkdir({recursive:true}) over an existing file
    // fails with ENOTDIR/EEXIST on both Windows & POSIX → predictable failure.
    const blockerPath: string = path.join(tmpRoot, 'blocker-file');
    await fs.writeFile(blockerPath, 'i am a file, not a dir');
    process.env.MA_LOG_ROOT = path.join(blockerPath, 'subdir');

    // Stderr emitet stub-oljuk hogy ne zajos legyen a teszt
    const origStderr = process.stderr.write.bind(process.stderr);
    const stderrCalls: string[] = [];
    process.stderr.write = ((chunk: string | Uint8Array): boolean => {
      stderrCalls.push(typeof chunk === 'string' ? chunk : chunk.toString());
      return true;
    }) as typeof process.stderr.write;
    try {
      const result = await logAction({ kind: 'note', summary: 'no-throw fail-path' });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('MA-LOG-WRITE-FAIL');
        expect(typeof result.error.message).toBe('string');
        expect(result.error.message.length).toBeGreaterThan(0);
        expect(result.error.details?.kind).toBe('note');
      }
      // Stderr emit kötelező (visible error, nem silent)
      expect(stderrCalls.some((c) => c.includes('MA-LOG-WRITE-FAIL'))).toBe(true);
    } finally {
      process.stderr.write = origStderr;
    }
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

  // Cycle 127: optional-field carry coverage + ts format.
  it('| ref mezőt megőriz az output JSON-ban, ha adva van', async () => {
    await logAction({ kind: 'note', summary: 'with ref', ref: '__agent/plans/some.plan.md' });
    const files = await fs.readdir(tmpRoot);
    const content = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const entry = JSON.parse(content.trim()) as Record<string, unknown>;
    expect(entry.ref).toBe('__agent/plans/some.plan.md');
  });

  it('| ref mező hiányzik a JSON-ból, ha üres / undefined (no-empty-field principle)', async () => {
    await logAction({ kind: 'note', summary: 'no ref' });
    const files = await fs.readdir(tmpRoot);
    const content = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const entry = JSON.parse(content.trim()) as Record<string, unknown>;
    expect('ref' in entry).toBe(false);
  });

  it('| session mezőt megőriz (Claude hook context)', async () => {
    await logAction({ kind: 'tool-call', summary: 'with session', session: 'sess-abc-123' });
    const files = await fs.readdir(tmpRoot);
    const content = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const entry = JSON.parse(content.trim()) as Record<string, unknown>;
    expect(entry.session).toBe('sess-abc-123');
  });

  it('| extra mezőt megőriz nem-üres object esetén', async () => {
    await logAction({
      kind: 'note',
      summary: 'with extra',
      extra: { errorCode: 'X-99', stack: 'fake-stack' },
    });
    const files = await fs.readdir(tmpRoot);
    const content = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const entry = JSON.parse(content.trim()) as Record<string, unknown>;
    const extra = entry.extra as Record<string, unknown>;
    expect(extra.errorCode).toBe('X-99');
    expect(extra.stack).toBe('fake-stack');
  });

  it('| extra üres object esetén NEM kerül az output JSON-ba (Object.keys length > 0 guard)', async () => {
    await logAction({ kind: 'note', summary: 'empty extra', extra: {} });
    const files = await fs.readdir(tmpRoot);
    const content = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const entry = JSON.parse(content.trim()) as Record<string, unknown>;
    expect('extra' in entry).toBe(false);
  });

  it('| default ts ISO 8601-szerű, offset-tel végződik (nowIsoBudapest)', async () => {
    await logAction({ kind: 'note', summary: 'auto-ts' });
    const files = await fs.readdir(tmpRoot);
    const content = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const entry = JSON.parse(content.trim()) as Record<string, unknown>;
    const ts = entry.ts as string;
    // YYYY-MM-DDTHH:mm:ss±HH:mm format
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  });
});
