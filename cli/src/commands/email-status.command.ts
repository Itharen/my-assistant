import { parseArgs } from 'node:util';

import { getEmailGoogleAuthStatus, type EmailGoogleAuthStatus } from '../email/email-google-oauth.service.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

/** `ma email status` — lokális Gmail OAuth config/token diagnosztika, hálózati hívás nélkül. */
export async function runEmailStatusCommand(args: string[]): Promise<void> {
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
  const result: EmailGoogleAuthStatus = await getEmailGoogleAuthStatus(parsed.values.account);
  writeEnvelope(ok('email.status', requestId, startedAt, result), Boolean(parsed.values.pretty));
}
