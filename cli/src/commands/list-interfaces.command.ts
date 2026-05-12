// `ma cast list-interfaces` — list local non-loopback IPv4 interfaces.

import { parseArgs } from 'node:util';
import { listIPv4Interfaces } from '../cast/discover.js';
import { ok, makeRequestId, writeEnvelope } from '../output/envelope.js';

export async function runListInterfacesCommand(args: string[]): Promise<void> {
  const startedAt = Date.now();
  const requestId = makeRequestId();
  const parsed = parseArgs({
    args,
    options: { pretty: { type: 'boolean' } },
    strict: false,
  });
  const interfaces = listIPv4Interfaces();
  writeEnvelope(
    ok('cast.list-interfaces', requestId, startedAt, { count: interfaces.length, interfaces }),
    Boolean(parsed.values.pretty),
  );
}
