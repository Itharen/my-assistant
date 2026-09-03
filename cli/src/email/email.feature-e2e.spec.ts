import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

interface CliEnvelope {
  ok: boolean;
  action: string;
  result?: {
    sent: boolean;
    preview: {
      mode: string;
      envelope: { to: string[]; subject: string };
    };
  };
  error?: { code: string; message: string };
}

describe('email CLI feature E2E (offline dry-run)', () => {
  let runtimeRoot: string;
  let mainPath: string;

  beforeEach(async () => {
    runtimeRoot = await mkdtemp(join(tmpdir(), 'ma-email-feature-e2e-'));
    mainPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'main.js');
  });

  afterEach(async () => {
    await rm(runtimeRoot, { recursive: true, force: true });
  });

  it('runs parse → config → validation → dry-run envelope and redacts the tracked action-log', async () => {
    const recipient: string = 'recipient@example.test';
    const subject: string = 'Private feature subject';
    const body: string = 'Private feature body';
    const result = await execFileAsync(process.execPath, [
      mainPath,
      'email',
      'send',
      '--account',
      'default',
      '--to',
      recipient,
      '--subject',
      subject,
      '--body',
      body,
      '--dry-run',
    ], { env: featureEnv(runtimeRoot) });

    const envelope: CliEnvelope = JSON.parse(result.stdout);
    expect(envelope.ok).toBe(true);
    expect(envelope.action).toBe('email.send');
    expect(envelope.result?.sent).toBe(false);
    expect(envelope.result?.preview.mode).toBe('dry-run');
    expect(envelope.result?.preview.envelope.to).toEqual([recipient]);
    expect(envelope.result?.preview.envelope.subject).toBe(subject);

    const actionLog: string = await readOnlyActionLog(runtimeRoot);
    expect(actionLog).toContain('ma email send invoked');
    expect(actionLog).toContain('"redacted":true');
    expect(actionLog).not.toContain(recipient);
    expect(actionLog).not.toContain(subject);
    expect(actionLog).not.toContain(body);
  }, 20_000);

  it('returns a structured error for the missing-recipient edge without leaking body data', async () => {
    const privateBody: string = 'Body that must not enter the action-log';
    let stdout: string = '';
    try {
      await execFileAsync(process.execPath, [
        mainPath,
        'email',
        'send',
        '--subject',
        'No recipient',
        '--body',
        privateBody,
        '--dry-run',
      ], { env: featureEnv(runtimeRoot) });
      fail('CLI should have rejected a send without --to.');
    } catch (error: unknown) {
      if (!isExecError(error)) {
        throw error;
      }
      stdout = error.stdout;
    }
    const envelope: CliEnvelope = JSON.parse(stdout);
    expect(envelope.ok).toBe(false);
    expect(envelope.error?.code).toBe('MA-EMAIL-RECIPIENT-MISSING');

    const actionLog: string = await readOnlyActionLog(runtimeRoot);
    expect(actionLog).toContain('kind":"error');
    expect(actionLog).not.toContain(privateBody);
  }, 20_000);

  it('covers reader/attachment command validation variants before any network access', async () => {
    const variants: Array<{ args: string[]; expectedCode: string }> = [
      { args: ['email', 'list'], expectedCode: 'MA-EMAIL-MAILBOX-MISSING' },
      {
        args: ['email', 'read', '--mailbox', 'INBOX', '--limit', '0'],
        expectedCode: 'MA-EMAIL-OPTION-INTEGER',
      },
      {
        args: ['email', 'fetch-attachments', '--mailbox', 'INBOX', '--save-to', 'relative-path'],
        expectedCode: 'MA-EMAIL-ATTACHMENT-PATH',
      },
      {
        args: ['email', 'list-mailboxes', '--account', '../invalid'],
        expectedCode: 'MA-EMAIL-ACCOUNT-NAME',
      },
    ];

    for (const variant of variants) {
      const variantRoot: string = await mkdtemp(join(tmpdir(), 'ma-email-variant-e2e-'));
      try {
        const envelope: CliEnvelope = await runExpectedCliFailure(mainPath, variant.args, variantRoot);
        expect(envelope.ok).toBe(false);
        expect(envelope.error?.code).toBe(variant.expectedCode);
        const actionLog: string = await readOnlyActionLog(variantRoot);
        expect(actionLog).toContain('"redacted":true');
      } finally {
        await rm(variantRoot, { recursive: true, force: true });
      }
    }
  }, 20_000);
});

function featureEnv(runtimeRoot: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    MA_LOG_ROOT: runtimeRoot,
    MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_PROVIDER: 'imap-smtp',
    MY_ASSISTANT_EMAIL_SMTP_HOST: 'smtp.example.test',
    MY_ASSISTANT_EMAIL_SMTP_PORT: '465',
    MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_ADDRESS: 'sender@example.test',
    MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_PASSWORD: 'test-password',
    MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_SENDER_NAME: 'Feature Sender',
  };
}

async function readOnlyActionLog(runtimeRoot: string): Promise<string> {
  const files: string[] = await readdir(runtimeRoot);
  if (files.length !== 1) {
    throw new Error(`Expected exactly one action-log file in ${runtimeRoot}, found ${files.length}: ${files.join(', ')}`);
  }
  return readFile(join(runtimeRoot, files[0]!), 'utf8');
}

function isExecError(error: unknown): error is Error & { stdout: string; stderr: string } {
  return error instanceof Error && 'stdout' in error && typeof error.stdout === 'string';
}

async function runExpectedCliFailure(mainPath: string, args: string[], runtimeRoot: string): Promise<CliEnvelope> {
  try {
    await execFileAsync(process.execPath, [mainPath, ...args], { env: featureEnv(runtimeRoot) });
    fail(`CLI should have rejected: ${args.join(' ')}`);
    throw new Error('Unreachable after Jasmine fail.');
  } catch (error: unknown) {
    if (!isExecError(error)) {
      throw error;
    }
    return JSON.parse(error.stdout);
  }
}
