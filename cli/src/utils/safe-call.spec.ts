// Spec for safe-call.ts — teardown wrapper that swallows errors but audit-logs.
// Cycle 116 (safe-orthogonal spec-coverage).
//
// Pattern: action-log.client.spec.ts (cycle pre-50) — MA_LOG_ROOT tmpdir override.

import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { safeCall } from './safe-call.js';

describe('| safeCall', () => {

  let tmpRoot: string;
  let origEnv: string | undefined;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ma-safecall-spec-'));
    origEnv = process.env.MA_LOG_ROOT;
    process.env.MA_LOG_ROOT = tmpRoot;
  });

  afterEach(async () => {
    if (origEnv === undefined) delete process.env.MA_LOG_ROOT;
    else process.env.MA_LOG_ROOT = origEnv;
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  /** Wait until logAction's async write completes (gives the void-fired Promise a chance). */
  async function flushAsyncLog(): Promise<void> {
    await new Promise<void>((resolve): void => { setTimeout(resolve, 20); });
  }

  it('| sikeres fn-hívás NEM ír log-ot és nem dob', async () => {
    let called: boolean = false;

    safeCall((): void => { called = true; }, 'happy-path');

    expect(called).toBe(true);
    await flushAsyncLog();
    const files: string[] = await fs.readdir(tmpRoot);
    expect(files.length).toBe(0);
  });

  it('| dobó fn-t elnyeli (caller NEM kap exception-t)', () => {
    const throwing = (): void => { throw new Error('teardown-failed'); };

    expect(() => safeCall(throwing, 'cast-client.close')).not.toThrow();
  });

  it('| Error-t dobó fn esetén `note` action-log entry íródik MA-TEARDOWN-NONFATAL kóddal', async () => {
    safeCall((): void => { throw new Error('connection lost'); }, 'cast-client.close');

    await flushAsyncLog();
    const files: string[] = await fs.readdir(tmpRoot);
    expect(files.length).toBe(1);
    const content: string = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const lines: string[] = content.trim().split('\n').filter((l: string): boolean => l.length > 0);
    expect(lines.length).toBe(1);
    const entry: Record<string, unknown> = JSON.parse(lines[0]!) as Record<string, unknown>;
    expect(entry.kind).toBe('note');
    expect(entry.summary).toContain('safeCall: cast-client.close failed');
    expect(entry.summary).toContain('non-fatal teardown');
    const extra: Record<string, unknown> = entry.extra as Record<string, unknown>;
    expect(extra.label).toBe('cast-client.close');
    expect(extra.error).toBe('connection lost');
    expect(extra.code).toBe('MA-TEARDOWN-NONFATAL');
  });

  it('| non-Error dobó fn (string) is logolva van — String() konverzióval', async () => {
    safeCall((): void => { throw 'raw-string-throw'; }, 'odd-thrower');

    await flushAsyncLog();
    const files: string[] = await fs.readdir(tmpRoot);
    expect(files.length).toBe(1);
    const content: string = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const entry: Record<string, unknown> = JSON.parse(content.trim()) as Record<string, unknown>;
    const extra: Record<string, unknown> = entry.extra as Record<string, unknown>;
    expect(extra.error).toBe('raw-string-throw');
    expect(extra.label).toBe('odd-thrower');
  });

  it('| label különböző hívásoknál különböző extra.label-t ad', async () => {
    safeCall((): void => { throw new Error('a'); }, 'label-A');
    safeCall((): void => { throw new Error('b'); }, 'label-B');

    await flushAsyncLog();
    const files: string[] = await fs.readdir(tmpRoot);
    expect(files.length).toBe(1);
    const content: string = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const lines: string[] = content.trim().split('\n').filter((l: string): boolean => l.length > 0);
    expect(lines.length).toBe(2);
    const e1: Record<string, unknown> = JSON.parse(lines[0]!) as Record<string, unknown>;
    const e2: Record<string, unknown> = JSON.parse(lines[1]!) as Record<string, unknown>;
    expect((e1.extra as Record<string, unknown>).label).toBe('label-A');
    expect((e2.extra as Record<string, unknown>).label).toBe('label-B');
  });
});
