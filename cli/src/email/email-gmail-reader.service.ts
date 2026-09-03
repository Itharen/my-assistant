import { simpleParser } from 'mailparser';
import type { AddressObject, Attachment, ParsedMail } from 'mailparser';

import {
  decodeGmailBase64Url,
  gmailApiRequest,
  gmailHeader,
  resolveGmailLabel,
  type GmailMessage,
  type GmailLabel,
} from './email-gmail-api.client.js';
import { EmailToolError } from './email-error.js';
import type {
  EmailContentAttachment,
  EmailListOptions,
  EmailListResult,
  EmailMessageContent,
  EmailMessageSummary,
  EmailReadOptions,
  EmailReadResult,
  EmailSearchOptions,
} from './email-reader.service.js';

interface GmailMessageListResponse {
  messages?: Array<{ id: string; threadId?: string }>;
  resultSizeEstimate?: number;
}

/** IMAP-szerű CLI filterek → Gmail keresési query. */
export function buildGmailSearchQuery(options: EmailSearchOptions): string {
  const terms: string[] = [];
  if (options.since) terms.push(`after:${gmailQueryDate(options.since)}`);
  if (options.before) terms.push(`before:${gmailQueryDate(options.before)}`);
  if (options.from) terms.push(`from:${quoteGmailQueryValue(options.from)}`);
  if (options.subject) terms.push(`subject:${quoteGmailQueryValue(options.subject)}`);
  if (options.flagged) terms.push('is:starred');
  if (options.unseen) terms.push('is:unread');
  return terms.join(' ');
}

export async function listGmailMessages(options: EmailListOptions): Promise<EmailListResult> {
  const label: GmailLabel = await resolveGmailLabel(options.account, options.mailbox);
  const listed: GmailMessageListResponse = await gmailList(options, label.id);
  const messages: EmailMessageSummary[] = [];
  for (const item of listed.messages ?? []) {
    const metadata: GmailMessage = await gmailApiRequest<GmailMessage>(
      options.account,
      `/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=Date&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject`,
    );
    messages.push(gmailMessageToSummary(metadata));
  }
  messages.sort(compareGmailMessagesNewestFirst);
  return {
    account: options.account,
    mailbox: options.mailbox,
    total: listed.resultSizeEstimate ?? messages.length,
    returned: messages.length,
    messages: messages,
  };
}

export async function readGmailMessages(options: EmailReadOptions): Promise<EmailReadResult> {
  const label: GmailLabel = await resolveGmailLabel(options.account, options.mailbox);
  const listed: GmailMessageListResponse = options.uid
    ? { messages: [{ id: String(options.uid) }], resultSizeEstimate: 1 }
    : await gmailList(options, label.id);
  const messages: EmailMessageContent[] = [];
  const maxMessageBytes: number = options.maxMessageMb * 1024 * 1024;

  for (const item of listed.messages ?? []) {
    const rawMessage: GmailMessage = await gmailApiRequest<GmailMessage>(
      options.account,
      `/messages/${encodeURIComponent(item.id)}?format=raw`,
    );
    const preliminary: EmailMessageSummary = gmailMessageToSummary(rawMessage);
    if ((rawMessage.sizeEstimate ?? 0) > maxMessageBytes) {
      messages.push(skippedGmailMessage(preliminary, options.maxMessageMb));
      continue;
    }
    if (!rawMessage.raw) {
      throw new EmailToolError('MA-EMAIL-GMAIL-RAW', `Gmail message ${item.id} has no raw MIME content.`);
    }
    const raw: Buffer = decodeGmailBase64Url(rawMessage.raw);
    if (raw.length > maxMessageBytes) {
      messages.push(skippedGmailMessage(preliminary, options.maxMessageMb));
      continue;
    }
    const parsed: ParsedMail = await simpleParser(raw);
    const textResult = capText(parsed.text, options.maxChars);
    const htmlResult = capText(typeof parsed.html === 'string' ? parsed.html : null, options.maxChars);
    messages.push({
      ...preliminary,
      date: parsed.date?.toISOString() ?? preliminary.date,
      from: parsed.from?.text ?? preliminary.from,
      to: parsedAddressList(parsed.to),
      cc: parsedAddressList(parsed.cc),
      subject: parsed.subject ?? preliminary.subject,
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
  messages.sort(compareGmailMessagesNewestFirst);
  return {
    account: options.account,
    mailbox: options.mailbox,
    total: listed.resultSizeEstimate ?? messages.length,
    returned: messages.length,
    messages: messages,
  };
}

async function gmailList(options: EmailListOptions, labelId: string): Promise<GmailMessageListResponse> {
  const params: URLSearchParams = new URLSearchParams({
    labelIds: labelId,
    maxResults: String(options.limit),
  });
  const query: string = buildGmailSearchQuery(options);
  if (query) params.set('q', query);
  return gmailApiRequest<GmailMessageListResponse>(options.account, `/messages?${params.toString()}`);
}

function gmailMessageToSummary(message: GmailMessage): EmailMessageSummary {
  const labels: string[] = message.labelIds ?? [];
  const flags: string[] = labels.filter((label: string): boolean => !['INBOX', 'SENT', 'DRAFT', 'TRASH', 'SPAM', 'UNREAD', 'STARRED'].includes(label));
  if (!labels.includes('UNREAD')) flags.push('\\Seen');
  if (labels.includes('STARRED')) flags.push('\\Flagged');
  if (labels.includes('DRAFT')) flags.push('\\Draft');
  return {
    uid: message.id,
    date: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : gmailHeader(message.payload, 'Date'),
    from: gmailHeader(message.payload, 'From'),
    to: headerAsList(gmailHeader(message.payload, 'To')),
    cc: headerAsList(gmailHeader(message.payload, 'Cc')),
    subject: gmailHeader(message.payload, 'Subject'),
    flags: flags,
    sizeBytes: message.sizeEstimate ?? null,
  };
}

function skippedGmailMessage(summary: EmailMessageSummary, maxMb: number): EmailMessageContent {
  return {
    ...summary,
    text: null,
    html: null,
    attachments: [],
    truncated: false,
    skippedReason: `message exceeds ${maxMb} MB safety limit`,
  };
}

function gmailQueryDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new EmailToolError('MA-EMAIL-OPTION-DATE', 'Gmail date filters must use YYYY-MM-DD format.');
  }
  const parsed: Date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new EmailToolError('MA-EMAIL-OPTION-DATE', 'Gmail date filter is not a valid calendar date.');
  }
  return value.replace(/-/g, '/');
}

function quoteGmailQueryValue(value: string): string {
  return `"${value.replace(/["\\]/g, ' ')}"`;
}

function headerAsList(value: string | null): string[] {
  return value ? [value] : [];
}

function parsedAddressList(address: AddressObject | AddressObject[] | undefined): string[] {
  if (!address) return [];
  const objects: AddressObject[] = Array.isArray(address) ? address : [address];
  return objects.flatMap((item: AddressObject): string[] => item.value
    .filter((value): boolean => Boolean(value.address))
    .map((value): string => value.name ? `${value.name} <${value.address}>` : value.address ?? ''));
}

function capText(value: string | null | undefined, maxChars: number): { value: string | null; truncated: boolean } {
  if (value === null || value === undefined) return { value: null, truncated: false };
  return value.length <= maxChars
    ? { value: value, truncated: false }
    : { value: value.slice(0, maxChars), truncated: true };
}

function compareGmailMessagesNewestFirst(left: EmailMessageSummary, right: EmailMessageSummary): number {
  return Date.parse(right.date ?? '1970-01-01') - Date.parse(left.date ?? '1970-01-01');
}
