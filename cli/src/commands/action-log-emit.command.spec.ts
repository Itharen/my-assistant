// Spec for action-log-emit.command.ts — `ma action-log emit` CLI parser +
// validation + envelope output + exit-code contract.
// Cycle 128 (safe-orthogonal spec-coverage).

import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { runActionLogEmitCommand } from './action-log-emit.command.js';

interface CapturedExit {
  code: number;
}

/** Spy process.exit so it throws a sentinel instead of actually exiting Node. */
function installExitSpy(): { restore: () => void; calls: CapturedExit[] } {
  const calls: CapturedExit[] = [];
  const orig = process.exit;

  (process as unknown as { exit: (code?: number) => never }).exit = ((code?: number): never => {
    calls.push({ code: code ?? 0 });
    throw new Error(`__EXIT_SPY__:${code ?? 0}`);
  }) as unknown as (code?: number) => never;

  return {
    calls,
    restore: (): void => {
      (process as unknown as { exit: typeof orig }).exit = orig;
    },
  };
}

/** Spy process.stdout.write to capture envelope JSON without polluting test output. */
function installStdoutSpy(): { restore: () => void; chunks: string[] } {
  const chunks: string[] = [];
  const origWrite = process.stdout.write.bind(process.stdout);

  process.stdout.write = ((chunk: string | Uint8Array): boolean => {
    chunks.push(typeof chunk === 'string' ? chunk : chunk.toString());

    return true;
  }) as typeof process.stdout.write;

  return {
    chunks,
    restore: (): void => {
      process.stdout.write = origWrite;
    },
  };
}

interface Envelope {
  ok: boolean;
  action?: string;
  error?: { code: string; message?: string };
  result?: { written?: boolean; day?: string };
}

function parseEnvelope(chunks: string[]): Envelope {
  // Pick the last non-empty chunk that parses as a JSON envelope.
  for (let i: number = chunks.length - 1; i >= 0; i--) {
    const trimmed: string = chunks[i]!.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      return JSON.parse(trimmed) as Envelope;
    } catch {
      continue;
    }
  }
  throw new Error('No envelope chunk found in stdout');
}

describe('| runActionLogEmitCommand', () => {

  let tmpRoot: string;
  let origLogRoot: string | undefined;
  let exitSpy: ReturnType<typeof installExitSpy>;
  let stdoutSpy: ReturnType<typeof installStdoutSpy>;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ma-alemit-spec-'));
    origLogRoot = process.env.MA_LOG_ROOT;
    process.env.MA_LOG_ROOT = tmpRoot;
    exitSpy = installExitSpy();
    stdoutSpy = installStdoutSpy();
  });

  afterEach(async () => {
    stdoutSpy.restore();
    exitSpy.restore();
    if (origLogRoot === undefined) delete process.env.MA_LOG_ROOT;
    else process.env.MA_LOG_ROOT = origLogRoot;
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it('| missing --kind -> E_MISSING_ARG envelope + exit(2)', async () => {
    await expectAsync(runActionLogEmitCommand(['--summary', 'x'])).toBeRejectedWithError(/__EXIT_SPY__:2/);

    const env = parseEnvelope(stdoutSpy.chunks);
    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe('E_MISSING_ARG');
    expect(env.error?.message).toContain('--kind');
    expect(exitSpy.calls[0]!.code).toBe(2);
  });

  it('| missing --summary -> E_MISSING_ARG envelope + exit(2)', async () => {
    await expectAsync(runActionLogEmitCommand(['--kind', 'note'])).toBeRejectedWithError(/__EXIT_SPY__:2/);

    const env = parseEnvelope(stdoutSpy.chunks);
    expect(env.ok).toBe(false);
    expect(env.error?.code).toBe('E_MISSING_ARG');
    expect(env.error?.message).toContain('--summary');
  });

  it('| invalid --extra JSON -> E_EXTRA_JSON envelope + exit(2)', async () => {
    await expectAsync(
      runActionLogEmitCommand(['--kind', 'note', '--summary', 's', '--extra', '{not json']),
    ).toBeRejectedWithError(/__EXIT_SPY__:2/);

    const env = parseEnvelope(stdoutSpy.chunks);
    expect(env.error?.code).toBe('E_EXTRA_JSON');
  });

  it('| --extra is JSON array (not object) -> E_EXTRA_JSON', async () => {
    await expectAsync(
      runActionLogEmitCommand(['--kind', 'note', '--summary', 's', '--extra', '[1,2,3]']),
    ).toBeRejectedWithError(/__EXIT_SPY__:2/);

    const env = parseEnvelope(stdoutSpy.chunks);
    expect(env.error?.code).toBe('E_EXTRA_JSON');
  });

  it('| valid invocation writes JSONL + ok envelope, NO exit call', async () => {
    await runActionLogEmitCommand([
      '--kind', 'note',
      '--summary', 'spec smoke',
      '--actor', 'test',
      '--ts', '2026-05-17T12:30:00+02:00',
    ]);

    expect(exitSpy.calls.length).toBe(0);

    const env = parseEnvelope(stdoutSpy.chunks);
    expect(env.ok).toBe(true);
    expect(env.action).toBe('action-log.emit');
    expect(env.result?.written).toBe(true);
    expect(env.result?.day).toBe('2026-05-17');

    const files: string[] = await fs.readdir(tmpRoot);
    expect(files).toContain('2026-05-17.jsonl');
    const content: string = await fs.readFile(path.join(tmpRoot, '2026-05-17.jsonl'), 'utf8');
    const entry: Record<string, unknown> = JSON.parse(content.trim()) as Record<string, unknown>;
    expect(entry.actor).toBe('test');
    expect(entry.kind).toBe('note');
    expect(entry.summary).toBe('spec smoke');
  });

  it('| valid invocation with --extra object payload carries through', async () => {
    await runActionLogEmitCommand([
      '--kind', 'tool-call',
      '--summary', 'with extra',
      '--extra', '{"foo":"bar","n":42}',
    ]);

    expect(exitSpy.calls.length).toBe(0);

    const files: string[] = await fs.readdir(tmpRoot);
    const content: string = await fs.readFile(path.join(tmpRoot, files[0]!), 'utf8');
    const entry: Record<string, unknown> = JSON.parse(content.trim()) as Record<string, unknown>;
    const extra: Record<string, unknown> = entry.extra as Record<string, unknown>;
    expect(extra.foo).toBe('bar');
    expect(extra.n).toBe(42);
  });

  it('| write-fail propagates as MA-LOG-WRITE-FAIL envelope + exit(1)', async () => {
    // Block the log root with a file-as-directory to force write failure.
    const blockerPath: string = path.join(tmpRoot, 'blocker');
    await fs.writeFile(blockerPath, 'i am a file');
    process.env.MA_LOG_ROOT = path.join(blockerPath, 'subdir');

    // Suppress the stderr emit so the test output stays clean.
    const origStderr = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((): boolean => true) as typeof process.stderr.write;

    try {
      await expectAsync(
        runActionLogEmitCommand(['--kind', 'note', '--summary', 'will fail']),
      ).toBeRejectedWithError(/__EXIT_SPY__:1/);

      const env = parseEnvelope(stdoutSpy.chunks);
      expect(env.ok).toBe(false);
      expect(env.error?.code).toBe('MA-LOG-WRITE-FAIL');
      expect(exitSpy.calls[0]!.code).toBe(1);
    } finally {
      process.stderr.write = origStderr;
    }
  });
});
