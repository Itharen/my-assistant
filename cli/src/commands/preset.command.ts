// `ma cast preset` — list / apply / capture volume presets.

import { parseArgs } from 'node:util';
import { discoverCastDevices } from '../cast/discover.js';
import { loadPresets, applyPreset, captureCurrentAsPreset } from '../cast/presets.js';
import { ok, makeRequestId, writeEnvelope } from '../output/envelope.js';
import { numericOption, parseList, onLogFor } from '../utils/parse-args.helpers.js';

export async function runPresetCommand(args: string[]): Promise<void> {
  const startedAt = Date.now();
  const requestId = makeRequestId();
  const parsed = parseArgs({
    args,
    options: {
      list: { type: 'boolean' },
      apply: { type: 'string' },
      capture: { type: 'string' },
      timeout: { type: 'string' },
      interface: { type: 'string', multiple: true },
      verbose: { type: 'boolean' },
      pretty: { type: 'boolean' },
    },
    strict: false,
  });

  const onLog = onLogFor('preset', Boolean(parsed.values.verbose));
  const presets = loadPresets();

  if (parsed.values.list) {
    const summary = Object.entries(presets).map(([name, entries]) => ({
      name,
      deviceCount: Object.keys(entries).length,
      devices: Object.entries(entries).map(([device, e]) => ({
        device,
        level: e.level,
        muted: e.muted,
      })),
    }));
    writeEnvelope(
      ok('cast.preset', requestId, startedAt, { mode: 'list', count: summary.length, presets: summary }),
      Boolean(parsed.values.pretty),
    );
    return;
  }

  if (typeof parsed.values.apply === 'string') {
    const presetName = parsed.values.apply;
    const timeoutMs = numericOption(parsed.values.timeout, 4000)!;
    const interfaces = parseList(parsed.values.interface);
    const devices = await discoverCastDevices({ timeoutMs, interfaces, onLog });
    if (devices.length === 0) {
      throw new Error('No Cast devices discovered for preset apply');
    }
    const res = await applyPreset({ presetName, presets, devices, onLog });
    writeEnvelope(
      ok('cast.preset', requestId, startedAt, { mode: 'apply', ...res }),
      Boolean(parsed.values.pretty),
    );
    return;
  }

  if (typeof parsed.values.capture === 'string') {
    const presetName = parsed.values.capture;
    const timeoutMs = numericOption(parsed.values.timeout, 4000)!;
    const interfaces = parseList(parsed.values.interface);
    const devices = await discoverCastDevices({ timeoutMs, interfaces, onLog });
    if (devices.length === 0) {
      throw new Error('No Cast devices discovered for preset capture');
    }
    const res = await captureCurrentAsPreset({ presetName, devices, onLog });
    writeEnvelope(
      ok('cast.preset', requestId, startedAt, { mode: 'capture', ...res }),
      Boolean(parsed.values.pretty),
    );
    return;
  }

  throw new Error('preset requires one of: --list, --apply <name>, --capture <name>');
}
