// `ma google auth` — one-time Google Assistant SDK setup (OAuth + device registration).

import { parseArgs } from 'node:util';
import { runAuthFlow } from '../google/google-assistant-auth.flow.js';
import { ok, makeRequestId, writeEnvelope } from '../output/envelope.js';

export async function runGoogleAuthCommand(args: string[]): Promise<void> {
  const startedAt = Date.now();
  const requestId = makeRequestId();
  const parsed = parseArgs({
    args,
    options: {
      verbose: { type: 'boolean' },
      pretty: { type: 'boolean' },
    },
    strict: false,
  });

  const onLog = parsed.values.verbose
    ? (msg: string): void => {
        process.stderr.write(`[google.auth] ${msg}\n`);
      }
    : undefined;

  const result = await runAuthFlow({ onLog });
  writeEnvelope(ok('google.auth', requestId, startedAt, result), Boolean(parsed.values.pretty));
}
