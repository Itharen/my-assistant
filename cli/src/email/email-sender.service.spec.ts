import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resolveEmailBody, sendEmail } from './email-sender.service.js';

describe('email sender dry-run', () => {
  const envKeys: string[] = [
    'MY_ASSISTANT_EMAIL_SMTP_HOST',
    'MY_ASSISTANT_EMAIL_SMTP_PORT',
    'MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_ADDRESS',
    'MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_PASSWORD',
    'MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_SENDER_NAME',
  ];
  let previous: Record<string, string | undefined>;

  beforeEach(() => {
    previous = Object.fromEntries(envKeys.map((key: string): [string, string | undefined] => [key, process.env[key]]));
    process.env.MY_ASSISTANT_EMAIL_SMTP_HOST = 'smtp.example.test';
    process.env.MY_ASSISTANT_EMAIL_SMTP_PORT = '465';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_ADDRESS = 'sender@example.test';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_PASSWORD = 'test-password';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_SENDER_NAME = 'Test Sender';
  });

  afterEach(() => {
    for (const key of envKeys) {
      const value: string | undefined = previous[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('builds the full envelope and attachment metadata without network I/O', async () => {
    const root: string = await mkdtemp(join(tmpdir(), 'ma-email-spec-'));
    const attachment: string = join(root, 'attachment.txt');
    await writeFile(attachment, 'fixture', 'utf8');
    try {
      const result = await sendEmail({
        account: 'default',
        to: ['recipient@example.test'],
        cc: [],
        bcc: [],
        subject: 'Dry run subject',
        body: 'Dry run body',
        attachments: [attachment],
        dryRun: true,
        saveToSent: true,
      });
      expect(result.sent).toBe(false);
      expect(result.preview.mode).toBe('dry-run');
      expect(result.preview.bodyChars).toBe(12);
      expect(result.preview.attachments[0]?.filename).toBe('attachment.txt');
      expect(result.sentCopy.status).toBe('disabled');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('supports body-file and rejects ambiguous body input', async () => {
    const root: string = await mkdtemp(join(tmpdir(), 'ma-email-body-spec-'));
    const bodyFile: string = join(root, 'body.txt');
    await writeFile(bodyFile, 'Body from file', 'utf8');
    try {
      await expectAsync(resolveEmailBody(undefined, bodyFile)).toBeResolvedTo('Body from file');
      await expectAsync(resolveEmailBody('inline', bodyFile)).toBeRejectedWithError(/either --body or --body-file/);
      await expectAsync(resolveEmailBody(undefined, undefined)).toBeRejectedWithError(/--body or --body-file/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects header injection and missing recipients before SMTP', async () => {
    const base = {
      account: 'default',
      cc: [] as string[],
      bcc: [] as string[],
      body: 'body',
      attachments: [] as string[],
      dryRun: true,
      saveToSent: false,
    };
    await expectAsync(sendEmail({ ...base, to: [], subject: 'subject' })).toBeRejectedWithError(/--to/);
    await expectAsync(sendEmail({
      ...base,
      to: ['recipient@example.test'],
      subject: 'subject\r\nBcc: injected@example.test',
    })).toBeRejectedWithError(/line breaks/);
  });
});
