// `ma cast notify` — TTS push to a Cast device with volume save→up→restore +
// optional Spotify resume.

import { parseArgs } from 'node:util';
import { notify, DEFAULT_TARGET } from '../cast/notify.orchestrator.js';
import { ok, makeRequestId, writeEnvelope } from '../output/envelope.js';
import { numericOption, stringOption, parseList, onLogFor } from '../utils/parse-args.helpers.js';

export async function runNotifyCommand(args: string[]): Promise<void> {
  const startedAt = Date.now();
  const requestId = makeRequestId();
  const parsed = parseArgs({
    args,
    options: {
      text: { type: 'string' },
      target: { type: 'string' },
      host: { type: 'string' },
      port: { type: 'string' },
      lang: { type: 'string' },
      voice: { type: 'string' },
      timeout: { type: 'string' },
      interface: { type: 'string', multiple: true },
      'announcement-volume': { type: 'string' },
      'no-volume': { type: 'boolean' },
      'no-resume': { type: 'boolean' },
      'volume-targets': { type: 'string' },
      verbose: { type: 'boolean' },
      pretty: { type: 'boolean' },
    },
    strict: false,
  });

  const text = parsed.values.text;
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('Missing or empty --text');
  }

  const onLog = onLogFor('notify', Boolean(parsed.values.verbose));
  const announcementVolume = numericOption(parsed.values['announcement-volume'], undefined);

  const result = await notify({
    text,
    target: stringOption(parsed.values.target) ?? DEFAULT_TARGET,
    host: stringOption(parsed.values.host),
    port: numericOption(parsed.values.port, undefined),
    lang: stringOption(parsed.values.lang),
    voice: stringOption(parsed.values.voice),
    discoveryTimeoutMs: numericOption(parsed.values.timeout, undefined),
    interfaces: parseList(parsed.values.interface),
    announcementVolume,
    noVolume: Boolean(parsed.values['no-volume']),
    noResume: Boolean(parsed.values['no-resume']),
    volumeTargets: parseList(parsed.values['volume-targets']),
    onLog,
  });
  writeEnvelope(ok('cast.notify', requestId, startedAt, result), Boolean(parsed.values.pretty));
}
