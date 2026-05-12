// `ma cast discover` — discover Cast devices on the local network (mDNS).

import { parseArgs } from 'node:util';
import { discoverCastDevices } from '../cast/discover.js';
import { ok, makeRequestId, writeEnvelope } from '../output/envelope.js';
import { numericOption, parseList, onLogFor } from '../utils/parse-args.helpers.js';

export async function runDiscoverCommand(args: string[]): Promise<void> {
  const startedAt = Date.now();
  const requestId = makeRequestId();
  const parsed = parseArgs({
    args,
    options: {
      timeout: { type: 'string' },
      interface: { type: 'string', multiple: true },
      verbose: { type: 'boolean' },
      pretty: { type: 'boolean' },
    },
    strict: false,
  });

  const timeoutMs = numericOption(parsed.values.timeout, 4000)!;
  const interfaces = parseList(parsed.values.interface);
  const onLog = onLogFor('discover', Boolean(parsed.values.verbose));

  const devices = await discoverCastDevices({ timeoutMs, interfaces, onLog });
  writeEnvelope(
    ok('cast.discover', requestId, startedAt, { count: devices.length, devices }),
    Boolean(parsed.values.pretty),
  );
}
