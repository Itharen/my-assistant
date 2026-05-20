// Spec for cast/presets.ts — loadPresets fs+JSON+normalize pure-ish surface.
// Cycle 121 (safe-orthogonal spec-coverage).
//
// Pattern: cast/groups.spec.ts (cycle 120) — tmp dir + path arg injection.
// `applyPreset` és `savePresets` NEM tesztelt: Cast receiver network calls
// (setReceiverVolume), integration-only.

import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { loadPresets, type PresetSchema } from './presets.js';

describe('cast/presets.ts — loadPresets', () => {

  let tmpRoot: string;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ma-presets-spec-'));
  });

  afterEach(async () => {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it('returns empty schema when the config file does not exist', () => {
    const result: PresetSchema = loadPresets(path.join(tmpRoot, 'no-such.json'));
    expect(result).toEqual({});
  });

  it('parses a numeric value as { level, muted:false }', async () => {
    const file: string = path.join(tmpRoot, 'p.json');
    await fs.writeFile(file, JSON.stringify({
      'morning': { 'BathCom': 0.4 },
    }), 'utf-8');

    const cfg: PresetSchema = loadPresets(file);
    expect(cfg['morning']!['BathCom']).toEqual({ level: 0.4, muted: false });
  });

  it('parses an object value with {level, muted} as-is', async () => {
    const file: string = path.join(tmpRoot, 'p.json');
    await fs.writeFile(file, JSON.stringify({
      'evening': { 'BathCom': { level: 0.2, muted: true } },
    }), 'utf-8');

    const cfg: PresetSchema = loadPresets(file);
    expect(cfg['evening']!['BathCom']).toEqual({ level: 0.2, muted: true });
  });

  it('clamps level to [0, 1] range (JSON cannot carry NaN — clamp covers >1/<0 boundaries)', async () => {
    const file: string = path.join(tmpRoot, 'p.json');
    await fs.writeFile(file, JSON.stringify({
      'extremes': {
        'OverDevice': 1.5,
        'UnderDevice': -0.3,
        'EdgeUpper': 1,
        'EdgeLower': 0,
      },
    }), 'utf-8');

    const cfg: PresetSchema = loadPresets(file);
    expect(cfg['extremes']!['OverDevice']!.level).toBe(1);
    expect(cfg['extremes']!['UnderDevice']!.level).toBe(0);
    expect(cfg['extremes']!['EdgeUpper']!.level).toBe(1);
    expect(cfg['extremes']!['EdgeLower']!.level).toBe(0);
  });

  it("strips '_'-prefix top-level keys (comment convention)", async () => {
    const file: string = path.join(tmpRoot, 'p.json');
    await fs.writeFile(file, JSON.stringify({
      '_comment': { 'X': 0.5 },
      'real-preset': { 'BathCom': 0.6 },
    }), 'utf-8');

    const cfg: PresetSchema = loadPresets(file);
    expect(cfg['_comment']).toBeUndefined();
    expect(cfg['real-preset']!['BathCom']!.level).toBe(0.6);
  });

  it('skips entries whose body is not an object (string, number, null, array)', async () => {
    const file: string = path.join(tmpRoot, 'p.json');
    await fs.writeFile(file, JSON.stringify({
      'bad-str': 'string-body',
      'bad-num': 42,
      'bad-null': null,
      'good': { 'BathCom': 0.4 },
    }), 'utf-8');

    const cfg: PresetSchema = loadPresets(file);
    expect(cfg['bad-str']).toBeUndefined();
    expect(cfg['bad-num']).toBeUndefined();
    expect(cfg['bad-null']).toBeUndefined();
    expect(cfg['good']).toBeDefined();
  });

  it('drops a preset whose every device entry is invalid (empty map → preset dropped)', async () => {
    const file: string = path.join(tmpRoot, 'p.json');
    await fs.writeFile(file, JSON.stringify({
      'all-bad': {
        'NoLevel': { muted: true },          // object without `level: number`
        'WrongType': 'not-a-number',
      },
      'mixed': {
        'NoLevel': { muted: true },          // dropped
        'GoodOne': 0.5,                       // kept
      },
    }), 'utf-8');

    const cfg: PresetSchema = loadPresets(file);
    expect(cfg['all-bad']).toBeUndefined();
    expect(cfg['mixed']!['NoLevel']).toBeUndefined();
    expect(cfg['mixed']!['GoodOne']!.level).toBe(0.5);
  });

  it('returns empty schema on malformed JSON (graceful fallback, action-log path)', async () => {
    const file: string = path.join(tmpRoot, 'broken.json');
    await fs.writeFile(file, '{ definitely not valid json', 'utf-8');

    const cfg: PresetSchema = loadPresets(file);
    expect(cfg).toEqual({});
  });
});
