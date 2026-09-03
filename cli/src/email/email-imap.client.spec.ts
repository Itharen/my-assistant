import { ImapFlow } from 'imapflow';
import type { ListResponse } from 'imapflow';

import {
  appendEmailToSent,
  listEmailMailboxes,
  withEmailImapClient,
} from './email-imap.client.js';
import { EmailToolError } from './email-error.js';

describe('email IMAP lifecycle', () => {
  const envKeys: string[] = [
    'MY_ASSISTANT_EMAIL_IMAP_HOST',
    'MY_ASSISTANT_EMAIL_IMAP_PORT',
    'MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_ADDRESS',
    'MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_PASSWORD',
  ];
  let previous: Record<string, string | undefined>;

  beforeEach(() => {
    previous = Object.fromEntries(envKeys.map((key: string): [string, string | undefined] => [key, process.env[key]]));
    process.env.MY_ASSISTANT_EMAIL_IMAP_HOST = 'imap.example.test';
    process.env.MY_ASSISTANT_EMAIL_IMAP_PORT = '993';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_ADDRESS = 'reader@example.test';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_PASSWORD = 'test-password';
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

  it('connects, executes the action and logs out exactly once', async () => {
    const connectSpy = spyOn(ImapFlow.prototype, 'connect').and.resolveTo();
    const logoutSpy = spyOn(ImapFlow.prototype, 'logout').and.resolveTo();
    const result: string = await withEmailImapClient('default', async (): Promise<string> => 'done');

    expect(result).toBe('done');
    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it('maps connect failures to a stable error code without exposing a password', async () => {
    spyOn(ImapFlow.prototype, 'connect').and.rejectWith(new Error('network unavailable'));
    try {
      await withEmailImapClient('default', async (): Promise<string> => 'unreachable');
      fail('Expected IMAP connect to fail.');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(EmailToolError);
      if (error instanceof EmailToolError) {
        expect(error.code).toBe('MA-EMAIL-IMAP-CONNECT');
        expect(JSON.stringify(error.details)).not.toContain('test-password');
      }
    }
  });

  it('combines action and logout failures into one debug-level error', async () => {
    spyOn(ImapFlow.prototype, 'connect').and.resolveTo();
    spyOn(ImapFlow.prototype, 'logout').and.rejectWith(new Error('logout failed'));
    spyOn(ImapFlow.prototype, 'close').and.callFake((): void => undefined);
    try {
      await withEmailImapClient('default', async (): Promise<string> => {
        throw new Error('action failed');
      });
      fail('Expected the compound IMAP failure.');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(EmailToolError);
      if (error instanceof EmailToolError) {
        expect(error.code).toBe('MA-EMAIL-IMAP-ACTION-AND-LOGOUT');
        expect(error.details?.actionCause).toBe('action failed');
        expect(error.details?.logoutCause).toBe('logout failed');
      }
    }
  });

  it('lists mailboxes and appends MIME to the SPECIAL-USE Sent mailbox', async () => {
    const mailboxes: ListResponse[] = [
      mailboxFixture('INBOX', '\\Inbox'),
      mailboxFixture('Sent Items', '\\Sent'),
    ];
    spyOn(ImapFlow.prototype, 'connect').and.resolveTo();
    spyOn(ImapFlow.prototype, 'logout').and.resolveTo();
    spyOn(ImapFlow.prototype, 'list').and.resolveTo(mailboxes);
    const appendSpy = spyOn(ImapFlow.prototype, 'append').and.resolveTo({
      destination: 'Sent Items',
      uid: 42,
    });

    const listed = await listEmailMailboxes('default');
    expect(listed).toEqual([
      { path: 'INBOX', specialUse: '\\Inbox', subscribed: true },
      { path: 'Sent Items', specialUse: '\\Sent', subscribed: true },
    ]);
    const appended = await appendEmailToSent('default', Buffer.from('MIME-Version: 1.0\r\n\r\nBody'));
    expect(appended).toEqual({ status: 'appended', mailbox: 'Sent Items', uid: 42 });
    expect(appendSpy).toHaveBeenCalledWith('Sent Items', jasmine.any(Buffer), ['\\Seen']);
  });
});

function mailboxFixture(path: string, specialUse: string): ListResponse {
  return {
    path: path,
    pathAsListed: path,
    name: path,
    delimiter: '/',
    parent: [],
    parentPath: '',
    flags: new Set<string>(),
    specialUse: specialUse,
    listed: true,
    subscribed: true,
  };
}
