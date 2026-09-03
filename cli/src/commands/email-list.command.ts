import { parseArgs } from 'node:util';

import {
  listEmailMessages,
  parseEmailPositiveInteger,
  type EmailListOptions,
  type EmailListResult,
} from '../email/email-reader.service.js';
import { EmailToolError } from '../email/email-error.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

/** `ma email list` — message metadata list + IMAP filters. */
export async function runEmailListCommand(args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args: args,
    options: {
      account: { type: 'string', default: 'default' },
      mailbox: { type: 'string' },
      limit: { type: 'string', default: '10' },
      since: { type: 'string' },
      before: { type: 'string' },
      from: { type: 'string' },
      subject: { type: 'string' },
      flagged: { type: 'boolean' },
      unseen: { type: 'boolean' },
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
  const options: EmailListOptions = {
    account: parsed.values.account,
    mailbox: parsed.values.mailbox,
    limit: parseEmailPositiveInteger(parsed.values.limit, 10, 500, '--limit'),
    since: parsed.values.since,
    before: parsed.values.before,
    from: parsed.values.from,
    subject: parsed.values.subject,
    flagged: parsed.values.flagged,
    unseen: parsed.values.unseen,
  };
  const result: EmailListResult = await listEmailMessages(options);
  writeEnvelope(ok('email.list', requestId, startedAt, result), Boolean(parsed.values.pretty));
}
