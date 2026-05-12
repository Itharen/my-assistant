// `ma cast volume` — get/set/mute/unmute device volume.

import { parseArgs } from 'node:util';
import {
  discoverCastDevices,
  type CastDevice,
} from '../cast/discover.js';
import {
  getReceiverStatus,
  setReceiverVolume,
  type VolumeTargetRef,
} from '../cast/volume.js';
import { ok, makeRequestId, writeEnvelope } from '../output/envelope.js';
import { numericOption, stringOption, parseList, onLogFor } from '../utils/parse-args.helpers.js';

export async function runVolumeCommand(args: string[]): Promise<void> {
  const startedAt = Date.now();
  const requestId = makeRequestId();
  const parsed = parseArgs({
    args,
    options: {
      target: { type: 'string' },
      host: { type: 'string' },
      port: { type: 'string' },
      get: { type: 'boolean' },
      set: { type: 'string' },
      mute: { type: 'boolean' },
      unmute: { type: 'boolean' },
      timeout: { type: 'string' },
      interface: { type: 'string', multiple: true },
      verbose: { type: 'boolean' },
      pretty: { type: 'boolean' },
    },
    strict: false,
  });

  const onLog = onLogFor('volume', Boolean(parsed.values.verbose));
  const ref = await resolveRefForVolume(parsed.values, onLog);

  const action = pickVolumeAction(parsed.values);
  if (action === 'get') {
    const status = await getReceiverStatus(ref);
    writeEnvelope(
      ok('cast.volume', requestId, startedAt, {
        mode: 'get',
        target: ref,
        volume: status.volume,
        applications:
          status.applications?.map((a) => ({
            appId: a.appId,
            displayName: a.displayName,
            statusText: a.statusText,
          })) ?? [],
      }),
      Boolean(parsed.values.pretty),
    );
    return;
  }

  if (action === 'set') {
    const setRaw = parsed.values.set as string;
    const level = Number(setRaw);
    if (!Number.isFinite(level) || level < 0 || level > 1) {
      throw new Error(`--set requires a number between 0 and 1, got "${setRaw}"`);
    }
    const result = await setReceiverVolume(ref, { level });
    writeEnvelope(
      ok('cast.volume', requestId, startedAt, { mode: 'set', target: ref, volume: result }),
      Boolean(parsed.values.pretty),
    );
    return;
  }

  if (action === 'mute' || action === 'unmute') {
    const result = await setReceiverVolume(ref, { muted: action === 'mute' });
    writeEnvelope(
      ok('cast.volume', requestId, startedAt, { mode: action, target: ref, volume: result }),
      Boolean(parsed.values.pretty),
    );
    return;
  }

  throw new Error('volume requires one of: --get, --set <0-1>, --mute, --unmute');
}

function pickVolumeAction(values: Record<string, unknown>): 'get' | 'set' | 'mute' | 'unmute' {
  const flags = [
    Boolean(values.get) ? 'get' : null,
    typeof values.set === 'string' ? 'set' : null,
    Boolean(values.mute) ? 'mute' : null,
    Boolean(values.unmute) ? 'unmute' : null,
  ].filter((x): x is 'get' | 'set' | 'mute' | 'unmute' => x !== null);
  if (flags.length === 0) {
    throw new Error('volume requires one of: --get, --set <0-1>, --mute, --unmute');
  }
  if (flags.length > 1) {
    throw new Error(`volume: pick exactly ONE action, got: ${flags.join(', ')}`);
  }
  return flags[0]!;
}

async function resolveRefForVolume(
  values: Record<string, unknown>,
  onLog: ((m: string) => void) | undefined,
): Promise<VolumeTargetRef> {
  const target = stringOption(values.target);
  const host = stringOption(values.host);
  const port = numericOption(values.port, 8009)!;

  if (host) {
    return { name: host, address: host, port };
  }
  if (!target) {
    throw new Error('volume requires --target <name> or --host <ip>');
  }

  const timeoutMs = numericOption(values.timeout, 4000)!;
  const interfaces = parseList(values.interface);
  const devices = await discoverCastDevices({ timeoutMs, interfaces, onLog });
  if (devices.length === 0) {
    throw new Error('No Cast devices discovered for volume operation');
  }
  const dev = pickDeviceByName(devices, target);
  return { name: dev.name, address: dev.address, port: dev.port };
}

function pickDeviceByName(devices: CastDevice[], name: string): CastDevice {
  const t = name.toLowerCase();
  const exact = devices.find((d) => d.name.toLowerCase() === t);
  if (exact) return exact;
  const sub = devices.find((d) => d.name.toLowerCase().includes(t));
  if (!sub) {
    const names = devices.map((d) => d.name).join(', ');
    throw new Error(`Device "${name}" not found. Available: ${names}`);
  }
  return sub;
}
