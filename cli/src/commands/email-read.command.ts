import { parseArgs } from 'node:util';

import {
  parseEmailPositiveInteger,
  readEmailMessages,
  type EmailReadOptions,
  type EmailReadResult,
} from '../email/email-reader.service.js';
import { EmailToolError } from '../email/email-error.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

/** `ma email read` — teljes parsed MIME tartalom biztonsági limitekkel. */
export async function runEmailReadCommand(args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args: args,
    options: {
      account: { type: 'string', default: 'default' },
      mailbox: { type: 'string' },
      uid: { type: 'string' },
      limit: { type: 'string', default: '5' },
      since: { type: 'string' },
      before: { type: 'string' },
      from: { type: 'string' },
      subject: { type: 'string' },
      flagged: { type: 'boolean' },
      unseen: { type: 'boolean' },
      'max-chars': { type: 'string', default: '20000' },
      'max-message-mb': { type: 'string', default: '25' },
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
  const options: EmailReadOptions = {
    account: parsed.values.account,
    mailbox: parsed.values.mailbox,
    uid: parsed.values.uid,
    limit: parseEmailPositiveInteger(parsed.values.limit, 5, 50, '--limit'),
    since: parsed.values.since,
    before: parsed.values.before,
    from: parsed.values.from,
    subject: parsed.values.subject,
    flagged: parsed.values.flagged,
    unseen: parsed.values.unseen,
    maxChars: parseEmailPositiveInteger(parsed.values['max-chars'], 20000, 1_000_000, '--max-chars'),
    maxMessageMb: parseEmailPositiveInteger(parsed.values['max-message-mb'], 25, 250, '--max-message-mb'),
  };
  const result: EmailReadResult = await readEmailMessages(options);
  writeEnvelope(ok('email.read', requestId, startedAt, result), Boolean(parsed.values.pretty));
}
