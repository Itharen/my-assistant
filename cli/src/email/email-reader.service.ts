import type {
  FetchMessageObject,
  ImapFlow,
  MessageAddressObject,
  SearchObject,
  StatusObject,
} from 'imapflow';
import { simpleParser } from 'mailparser';
import type { AddressObject, Attachment, ParsedMail } from 'mailparser';

import { EmailToolError } from './email-error.js';
import { isGmailEmailAccount } from './email-account.config.js';
import { listGmailMessages, readGmailMessages } from './email-gmail-reader.service.js';
import { withEmailImapClient } from './email-imap.client.js';

export interface EmailSearchOptions {
  since?: string;
  before?: string;
  from?: string;
  subject?: string;
  flagged?: boolean;
  unseen?: boolean;
}

export interface EmailListOptions extends EmailSearchOptions {
  account: string;
  mailbox: string;
  limit: number;
}

export interface EmailReadOptions extends EmailListOptions {
  uid?: number | string;
  maxChars: number;
  maxMessageMb: number;
}

export interface EmailMessageSummary {
  uid: number | string;
  date: string | null;
  from: string | null;
  to: string[];
  cc: string[];
  subject: string | null;
  flags: string[];
  sizeBytes: number | null;
}

export interface EmailContentAttachment {
  filename: string | null;
  contentType: string;
  sizeBytes: number;
}

export interface EmailMessageContent extends EmailMessageSummary {
  text: string | null;
  html: string | null;
  attachments: EmailContentAttachment[];
  truncated: boolean;
  skippedReason: string | null;
}

export interface EmailListResult {
  account: string;
  mailbox: string;
  total: number;
  returned: number;
  messages: EmailMessageSummary[];
}

export interface EmailReadResult {
  account: string;
  mailbox: string;
  total: number;
  returned: number;
  messages: EmailMessageContent[];
}

/** Search inputból validált ImapFlow query készül. Üres filter = ALL. */
export function buildEmailSearchCriteria(options: EmailSearchOptions): SearchObject {
  const search: SearchObject = {};
  if (options.since) {
    search.since = parseEmailDate(options.since, '--since');
  }
  if (options.before) {
    search.before = parseEmailDate(options.before, '--before');
  }
  if (options.from) {
    search.from = options.from;
  }
  if (options.subject) {
    search.subject = options.subject;
  }
  if (options.flagged) {
    search.flagged = true;
  }
  if (options.unseen) {
    search.seen = false;
  }
  return Object.keys(search).length > 0 ? search : { all: true };
}

/** Pozitív egész CLI-option validáció, felső korláttal. */
export function parseEmailPositiveInteger(
  raw: string | undefined,
  fallback: number,
  max: number,
  flag: string,
): number {
  const parsed: number = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new EmailToolError('MA-EMAIL-OPTION-INTEGER', `${flag} must be an integer between 1 and ${max}.`, {
      flag: flag,
    });
  }
  return parsed;
}

/** Mailboxból metadata-lista olvasása, read-only lock-kal. */
export async function listEmailMessages(options: EmailListOptions): Promise<EmailListResult> {
  if (isGmailEmailAccount(options.account)) {
    return listGmailMessages(options);
  }
  return withEmailImapClient(options.account, async (client: ImapFlow) => {
    const lock = await client.getMailboxLock(options.mailbox, { readOnly: true });
    try {
      const status: StatusObject = await client.status(options.mailbox, { messages: true });
      const uids: number[] = await selectEmailUids(client, options, options.limit);
      const messages: EmailMessageSummary[] = [];
      if (uids.length > 0) {
        const fetch = client.fetch(
          uids,
          { uid: true, envelope: true, internalDate: true, flags: true, size: true },
          { uid: true },
        );
        for await (const message of fetch) {
          messages.push(toEmailSummary(message));
        }
      }
      messages.sort((left: EmailMessageSummary, right: EmailMessageSummary): number => Number(right.uid) - Number(left.uid));
      return {
        account: options.account,
        mailbox: options.mailbox,
        total: status.messages ?? 0,
        returned: messages.length,
        messages: messages,
      };
    } finally {
      lock.release();
    }
  });
}

/** Teljes MIME tartalom olvasása méret- és body-char limitekkel. */
export async function readEmailMessages(options: EmailReadOptions): Promise<EmailReadResult> {
  if (isGmailEmailAccount(options.account)) {
    return readGmailMessages(options);
  }
  return withEmailImapClient(options.account, async (client: ImapFlow) => {
    const lock = await client.getMailboxLock(options.mailbox, { readOnly: true });
    try {
      const status: StatusObject = await client.status(options.mailbox, { messages: true });
      const uids: number[] = options.uid
        ? [parseImapUid(options.uid)]
        : await selectEmailUids(client, options, options.limit);
      const messages: EmailMessageContent[] = [];
      const maxMessageBytes: number = options.maxMessageMb * 1024 * 1024;

      for (const uid of uids) {
        const metadata: FetchMessageObject | false = await client.fetchOne(
          String(uid),
          { uid: true, envelope: true, internalDate: true, flags: true, size: true },
          { uid: true },
        );
        if (!metadata) {
          throw new EmailToolError('MA-EMAIL-MESSAGE-MISSING', `Email UID ${uid} was not found.`, {
            mailbox: options.mailbox,
            uid: uid,
          });
        }
        const summary: EmailMessageSummary = toEmailSummary(metadata);
        if ((metadata.size ?? 0) > maxMessageBytes) {
          messages.push({
            ...summary,
            text: null,
            html: null,
            attachments: [],
            truncated: false,
            skippedReason: `message exceeds ${options.maxMessageMb} MB safety limit`,
          });
          continue;
        }

        const fullMessage: FetchMessageObject | false = await client.fetchOne(
          String(uid),
          { uid: true, source: { maxLength: maxMessageBytes + 1 } },
          { uid: true },
        );
        if (!fullMessage || !fullMessage.source) {
          throw new EmailToolError('MA-EMAIL-MESSAGE-SOURCE-MISSING', `Email UID ${uid} has no readable MIME source.`, {
            mailbox: options.mailbox,
            uid: uid,
          });
        }
        if (fullMessage.source.length > maxMessageBytes) {
          messages.push({
            ...summary,
            text: null,
            html: null,
            attachments: [],
            truncated: false,
            skippedReason: `message exceeds ${options.maxMessageMb} MB safety limit`,
          });
          continue;
        }
        const parsed: ParsedMail = await simpleParser(fullMessage.source);
        const textResult: { value: string | null; truncated: boolean } = capEmailText(parsed.text, options.maxChars);
        const htmlSource: string | null = typeof parsed.html === 'string' ? parsed.html : null;
        const htmlResult: { value: string | null; truncated: boolean } = capEmailText(htmlSource, options.maxChars);
        messages.push({
          ...summary,
          date: parsed.date?.toISOString() ?? summary.date,
          from: parsed.from?.text ?? summary.from,
          to: toParsedAddressList(parsed.to),
          cc: toParsedAddressList(parsed.cc),
          subject: parsed.subject ?? summary.subject,
          text: textResult.value,
          html: htmlResult.value,
          attachments: parsed.attachments.map((attachment: Attachment): EmailContentAttachment => ({
            filename: attachment.filename ?? null,
            contentType: attachment.contentType,
            sizeBytes: attachment.size,
          })),
          truncated: textResult.truncated || htmlResult.truncated,
          skippedReason: null,
        });
      }

      messages.sort((left: EmailMessageContent, right: EmailMessageContent): number => Number(right.uid) - Number(left.uid));
      return {
        account: options.account,
        mailbox: options.mailbox,
        total: status.messages ?? 0,
        returned: messages.length,
        messages: messages,
      };
    } finally {
      lock.release();
    }
  });
}

function parseImapUid(value: number | string): number {
  const parsed: number = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new EmailToolError('MA-EMAIL-IMAP-UID', '--uid must be a positive integer for IMAP accounts.');
  }
  return parsed;
}

/** Search-eredményből a legfrissebb, limitált UID-k kiválasztása. */
export async function selectEmailUids(
  client: ImapFlow,
  options: EmailSearchOptions,
  limit: number,
): Promise<number[]> {
  const result: number[] | false = await client.search(buildEmailSearchCriteria(options), { uid: true });
  const uids: number[] = result || [];
  return uids.slice().sort((left: number, right: number): number => right - left).slice(0, limit);
}

function toEmailSummary(message: FetchMessageObject): EmailMessageSummary {
  return {
    uid: message.uid,
    date: message.internalDate ? new Date(message.internalDate).toISOString() : null,
    from: formatEnvelopeAddress(message.envelope?.from?.[0]),
    to: (message.envelope?.to ?? []).map(formatEnvelopeAddress).filter(isNonNullString),
    cc: (message.envelope?.cc ?? []).map(formatEnvelopeAddress).filter(isNonNullString),
    subject: message.envelope?.subject ?? null,
    flags: Array.from(message.flags ?? new Set<string>()),
    sizeBytes: message.size ?? null,
  };
}

function formatEnvelopeAddress(address: MessageAddressObject | undefined): string | null {
  if (!address?.address) {
    return null;
  }
  return address.name ? `${address.name} <${address.address}>` : address.address;
}

function isNonNullString(value: string | null): value is string {
  return value !== null;
}

function toParsedAddressList(address: AddressObject | AddressObject[] | undefined): string[] {
  if (!address) {
    return [];
  }
  const objects: AddressObject[] = Array.isArray(address) ? address : [address];
  return objects.flatMap((item: AddressObject): string[] => item.value
    .filter((value): boolean => Boolean(value.address))
    .map((value): string => value.name ? `${value.name} <${value.address}>` : value.address ?? ''));
}

function capEmailText(text: string | null | undefined, maxChars: number): { value: string | null; truncated: boolean } {
  if (text === null || text === undefined) {
    return { value: null, truncated: false };
  }
  return text.length <= maxChars
    ? { value: text, truncated: false }
    : { value: text.slice(0, maxChars), truncated: true };
}

function parseEmailDate(raw: string, flag: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new EmailToolError('MA-EMAIL-OPTION-DATE', `${flag} must use YYYY-MM-DD format.`, { flag: flag });
  }
  const parsed: Date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
    throw new EmailToolError('MA-EMAIL-OPTION-DATE', `${flag} is not a valid calendar date.`, { flag: flag });
  }
  return parsed;
}
