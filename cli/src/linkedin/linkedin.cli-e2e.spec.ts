import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { createEmptyLinkedInCache } from './linkedin.models.js';
import { LinkedInStore } from './linkedin.store.js';

const execFileAsync = promisify(execFile);
const MAIN_PATH: string = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'main.js');

describe('ma linkedin CLI feature E2E', () => {
  let directory: string;
  let environment: NodeJS.ProcessEnv;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ma-linkedin-cli-'));
    environment = {
      ...process.env,
      USERPROFILE: directory,
      MA_LOG_ROOT: join(directory, 'action-log'),
    };
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('configures non-secret metadata and reports status through stable JSON envelopes', async () => {
    const configured = await runCli([
      'linkedin',
      'configure',
    ], environment);
    const status = await runCli(['linkedin', 'auth', 'status'], environment);

    expect(JSON.parse(configured.stdout).ok).toBeTrue();
    expect(JSON.parse(status.stdout).result.configured).toBeTrue();
    expect(JSON.parse(status.stdout).result.credentialSource).toBe('environment');
    expect(JSON.parse(status.stdout).result.accessTokenKey).toBe('LINKEDIN_MEMBER_ACCESS_TOKEN');
    expect(JSON.parse(status.stdout).result.tokenRead).toBeFalse();
  }, 20_000);

  it('does not misreport an uninitialized inbox as an empty successful result', async () => {
    const failure = await runCliExpectFailure(['linkedin', 'inbox', 'unread'], environment);

    expect(JSON.parse(failure.stdout).ok).toBeFalse();
    expect(JSON.parse(failure.stdout).error.code).toBe('MA-LINKEDIN-CACHE-NOT-INITIALIZED');
  }, 20_000);

  it('declines cache purge without confirmation and preserves the cache', async () => {
    const cachePath: string = join(directory, '.config', 'my-assistant', 'linkedin', 'cache.json');
    const store = new LinkedInStore(cachePath);
    const cache = createEmptyLinkedInCache();
    cache.selfUrn = 'self';
    await store.save(cache);

    const failure = await runCliExpectFailure(['linkedin', 'cache', 'purge'], environment);

    expect(JSON.parse(failure.stdout).error.code).toBe('MA-LINKEDIN-PURGE-CONFIRM');
    expect((await store.load()).selfUrn).toBe('self');
  }, 20_000);

  it('redacts thread identifiers from persistent invocation logs', async () => {
    const cachePath: string = join(directory, '.config', 'my-assistant', 'linkedin', 'cache.json');
    const store = new LinkedInStore(cachePath);
    const cache = createEmptyLinkedInCache();
    cache.messages = [{
      id: 'message-secret',
      threadId: 'thread-secret',
      authorId: 'other-secret',
      direction: 'inbound',
      content: 'body-secret',
      deliveredAt: 100,
      createdAt: 100,
      readAt: null,
      deleted: false,
      source: 'snapshot',
      sourceActivityId: null,
      rawFingerprint: 'fingerprint',
    }];
    await store.save(cache);

    const shown = await runCli(['linkedin', 'thread', 'show', '--id', 'thread-secret'], environment);
    const logFiles: string[] = await readdir(join(directory, 'action-log'));
    const logFile: string | undefined = logFiles[0];
    expect(logFile).toBeDefined();
    const logText: string = await readFile(join(directory, 'action-log', logFile ?? ''), 'utf8');

    expect(JSON.parse(shown.stdout).result.messages[0].content).toBe('body-secret');
    expect(logText).not.toContain('thread-secret');
    expect(logText).not.toContain('body-secret');
    expect(logText).not.toContain('other-secret');
  }, 20_000);
});

async function runCli(args: string[], env: NodeJS.ProcessEnv): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync(process.execPath, [MAIN_PATH, ...args], {
    encoding: 'utf8',
    env: env,
    timeout: 15_000,
    windowsHide: true,
  });
  return { stdout: result.stdout, stderr: result.stderr };
}

async function runCliExpectFailure(
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<{ stdout: string; stderr: string }> {
  try {
    return await runCli(args, env);
  } catch (error: unknown) {
    const normalized: Error & { stdout?: string; stderr?: string } = error instanceof Error
      ? error
      : new Error(String(error));
    return { stdout: normalized.stdout ?? '', stderr: normalized.stderr ?? '' };
  }
}
