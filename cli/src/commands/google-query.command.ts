// `ma google query "<text>"` — send a text query to the Google Assistant.

import { parseArgs } from 'node:util';
import { sendTextQuery } from '../google/google-assistant.client.js';
import { ok, makeRequestId, writeEnvelope } from '../output/envelope.js';

export async function runGoogleQueryCommand(args: string[]): Promise<void> {
  const startedAt = Date.now();
  const requestId = makeRequestId();
  const parsed = parseArgs({
    args,
    options: {
      text: { type: 'string' },
      locale: { type: 'string' },
      verbose: { type: 'boolean' },
      pretty: { type: 'boolean' },
    },
    allowPositionals: true,
    strict: false,
  });

  const text =
    typeof parsed.values.text === 'string' && parsed.values.text.length > 0
      ? parsed.values.text
      : parsed.positionals.join(' ');

  if (!text || text.length === 0) {
    throw new Error('Missing query — provide --text "..." or as positional argument');
  }

  if (parsed.values.verbose) {
    process.stderr.write(`[google.query] sending: "${text}"\n`);
  }

  const lang = typeof parsed.values.locale === 'string' ? parsed.values.locale : undefined;
  const result = await sendTextQuery({ text, lang });

  writeEnvelope(
    ok('google.query', requestId, startedAt, { query: text, response: result }),
    Boolean(parsed.values.pretty),
  );
}
