import { parseArgs } from 'node:util';

import {
  fetchEmailAttachments,
  type EmailAttachmentFetchOptions,
  type EmailAttachmentFetchResult,
} from '../email/email-attachment.service.js';
import { EmailToolError } from '../email/email-error.js';
import { parseEmailPositiveInteger } from '../email/email-reader.service.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

/** `ma email fetch-attachments` — attachment discovery / safe download. */
export async function runEmailFetchAttachmentsCommand(args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args: args,
    options: {
      account: { type: 'string', default: 'default' },
      mailbox: { type: 'string' },
      limit: { type: 'string', default: '100' },
      since: { type: 'string' },
      before: { type: 'string' },
      from: { type: 'string' },
      subject: { type: 'string' },
      flagged: { type: 'boolean' },
      unseen: { type: 'boolean' },
      'filename-pattern': { type: 'string', default: '.*' },
      'save-to': { type: 'string' },
      'max-mb': { type: 'string', default: '50' },
      pretty: { type: 'boolean' },
    },
    strict: true,
    allowPositionals: false,
  });
  if (!parsed.values.mailbox) {
    throw new EmailToolError(
      'MA-EMAIL-MAILBOX-MISSING',
      '--mailbox is required. Use `ma email list-mailboxes` to discover paths.',
    );
  }
  const options: EmailAttachmentFetchOptions = {
    account: parsed.values.account,
    mailbox: parsed.values.mailbox,
    limit: parseEmailPositiveInteger(parsed.values.limit, 100, 1000, '--limit'),
    since: parsed.values.since,
    before: parsed.values.before,
    from: parsed.values.from,
    subject: parsed.values.subject,
    flagged: parsed.values.flagged,
    unseen: parsed.values.unseen,
    filenamePattern: parsed.values['filename-pattern'],
    saveTo: parsed.values['save-to'],
    maxAttachmentMb: parseEmailPositiveInteger(parsed.values['max-mb'], 50, 1000, '--max-mb'),
  };
  const result: EmailAttachmentFetchResult = await fetchEmailAttachments(options);
  writeEnvelope(ok('email.fetch-attachments', requestId, startedAt, result), Boolean(parsed.values.pretty));
}
