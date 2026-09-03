import { parseArgs } from 'node:util';

import { authorizeEmailGoogleAccount, type EmailGoogleAuthResult } from '../email/email-google-oauth.service.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

/** `ma email auth` — Gmail Desktop OAuth PKCE + loopback consent. */
export async function runEmailAuthCommand(args: string[]): Promise<void> {
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
  const result: EmailGoogleAuthResult = await authorizeEmailGoogleAccount(parsed.values.account);
  writeEnvelope(ok('email.auth', requestId, startedAt, result), Boolean(parsed.values.pretty));
}
