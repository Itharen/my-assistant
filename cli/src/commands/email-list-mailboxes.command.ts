import { parseArgs } from 'node:util';

import { listEmailMailboxes } from '../email/email-mailbox.service.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

/** `ma email list-mailboxes` — IMAP mailbox discovery. */
export async function runEmailListMailboxesCommand(args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args: args,
    options: {
      account: { type: 'string', default: 'default' },
      pretty: { type: 'boolean' },
    },
    strict: true,
    allowPositionals: false,
  });
  const mailboxes = await listEmailMailboxes(parsed.values.account);
  writeEnvelope(ok('email.list-mailboxes', requestId, startedAt, {
    account: parsed.values.account,
    count: mailboxes.length,
    mailboxes: mailboxes,
  }), Boolean(parsed.values.pretty));
}
