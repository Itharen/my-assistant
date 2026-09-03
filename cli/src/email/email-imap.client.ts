import { ImapFlow } from 'imapflow';
import type { AppendResponseObject, ListResponse } from 'imapflow';

import { resolveEmailImapConfig, type EmailImapConfig } from './email-account.config.js';
import { describeEmailError, EmailToolError } from './email-error.js';

export interface SentAppendResult {
  status: 'appended';
  mailbox: string;
  uid: number | null;
}

/** Egy IMAP action teljes connect/action/logout lifecycle-ja, összetett hibakezeléssel. */
export async function withEmailImapClient<T>(
  account: string,
  action: (client: ImapFlow) => Promise<T>,
): Promise<T> {
  const config: EmailImapConfig = resolveEmailImapConfig(account);
  const client: ImapFlow = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    logger: false,
  });

  try {
    await client.connect();
  } catch (error: unknown) {
    throw new EmailToolError('MA-EMAIL-IMAP-CONNECT', 'IMAP connection failed.', {
      account: account,
      host: config.host,
      port: config.port,
      cause: describeEmailError(error),
    });
  }

  let result: T | undefined;
  let actionError: unknown;
  try {
    result = await action(client);
  } catch (error: unknown) {
    actionError = error;
  }

  let logoutError: unknown;
  try {
    await client.logout();
  } catch (error: unknown) {
    logoutError = error;
    client.close();
  }

  if (actionError || logoutError) {
    if (actionError && logoutError) {
      throw new EmailToolError('MA-EMAIL-IMAP-ACTION-AND-LOGOUT', 'IMAP action and logout both failed.', {
        actionCause: describeEmailError(actionError),
        logoutCause: describeEmailError(logoutError),
      });
    }
    if (actionError) {
      throw actionError;
    }
    throw new EmailToolError('MA-EMAIL-IMAP-LOGOUT', 'IMAP logout failed.', {
      cause: describeEmailError(logoutError),
    });
  }

  if (result === undefined) {
    throw new EmailToolError('MA-EMAIL-IMAP-NO-RESULT', 'IMAP action completed without a result.');
  }
  return result;
}

/** Mailbox-katalógus speciális-use jelölésekkel. */
export async function listEmailMailboxes(account: string): Promise<Array<{
  path: string;
  specialUse: string | null;
  subscribed: boolean;
}>> {
  return withEmailImapClient(account, async (client: ImapFlow) => {
    const mailboxes: ListResponse[] = await client.list();
    return mailboxes.map((mailbox: ListResponse) => ({
      path: mailbox.path,
      specialUse: mailbox.specialUse ?? null,
      subscribed: mailbox.subscribed,
    }));
  });
}

/** Sent mailbox detektálása SPECIAL-USE, majd provider-semleges név-fallback alapján. */
export async function findSentMailbox(client: ImapFlow): Promise<string> {
  const mailboxes: ListResponse[] = await client.list();
  const specialUseMatch: ListResponse | undefined = mailboxes.find(
    (mailbox: ListResponse): boolean => mailbox.specialUse === '\\Sent',
  );
  if (specialUseMatch) {
    return specialUseMatch.path;
  }
  const fallbackPattern: RegExp = /^(INBOX[./])?(Sent|Sent Items|Elküldött|Elküldött elemek)$/i;
  const nameMatch: ListResponse | undefined = mailboxes.find(
    (mailbox: ListResponse): boolean => fallbackPattern.test(mailbox.path),
  );
  if (!nameMatch) {
    throw new EmailToolError('MA-EMAIL-SENT-MAILBOX-MISSING', 'Sent mailbox could not be detected.');
  }
  return nameMatch.path;
}

/** Raw MIME üzenet appendelése a konfigurált account Sent mappájába. */
export async function appendEmailToSent(account: string, rawMime: Buffer): Promise<SentAppendResult> {
  return withEmailImapClient(account, async (client: ImapFlow) => {
    const sentMailbox: string = await findSentMailbox(client);
    const response: AppendResponseObject | false = await client.append(sentMailbox, rawMime, ['\\Seen']);
    if (!response) {
      throw new EmailToolError('MA-EMAIL-SENT-APPEND-REJECTED', 'IMAP server rejected the Sent append.', {
        mailbox: sentMailbox,
      });
    }
    return {
      status: 'appended' as const,
      mailbox: sentMailbox,
      uid: response.uid ?? null,
    };
  });
}
