// Spec for cast/device-caps.ts — per-device volume cap (FR #7e).
// Cycle 122.
//
// Pattern: cast/groups.spec.ts + presets.spec.ts — tmp dir + path arg injection.

import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { capLevelForDevice, loadDeviceVolumeCaps, type DeviceVolumeCaps } from './device-caps.js';

describe('cast/device-caps.ts', () => {

  describe('loadDeviceVolumeCaps', () => {

    let tmpRoot: string;

    beforeEach(async () => {
      tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ma-devcaps-spec-'));
    });

    afterEach(async () => {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    });

    it('returns empty map when the config file does not exist', () => {
      expect(loadDeviceVolumeCaps(path.join(tmpRoot, 'no-such.json'))).toEqual({});
    });

    it('parses valid numeric caps in [0,1]', async () => {
      const file: string = path.join(tmpRoot, 'caps.json');
      await fs.writeFile(file, JSON.stringify({ 'BathCom': 0.5, 'Boomer': 0.8 }), 'utf-8');

      const caps: DeviceVolumeCaps = loadDeviceVolumeCaps(file);
      expect(caps['BathCom']).toBe(0.5);
      expect(caps['Boomer']).toBe(0.8);
    });

    it("strips '_'-prefix keys (comment convention)", async () => {
      const file: string = path.join(tmpRoot, 'caps.json');
      await fs.writeFile(file, JSON.stringify({ '_comment': 0.3, 'BathCom': 0.5 }), 'utf-8');

      const caps: DeviceVolumeCaps = loadDeviceVolumeCaps(file);
      expect(caps['_comment']).toBeUndefined();
      expect(caps['BathCom']).toBe(0.5);
    });

    it('rejects out-of-range and non-numeric values', async () => {
      const file: string = path.join(tmpRoot, 'caps.json');
      await fs.writeFile(file, JSON.stringify({
        'TooHigh': 1.5,
        'Negative': -0.2,
        'NotNumber': 'loud',
        'Valid': 0.6,
      }), 'utf-8');

      const caps: DeviceVolumeCaps = loadDeviceVolumeCaps(file);
      expect(caps['TooHigh']).toBeUndefined();
      expect(caps['Negative']).toBeUndefined();
      expect(caps['NotNumber']).toBeUndefined();
      expect(caps['Valid']).toBe(0.6);
    });

    it('accepts boundary values 0 and 1', async () => {
      const file: string = path.join(tmpRoot, 'caps.json');
      await fs.writeFile(file, JSON.stringify({ 'Mute': 0, 'Full': 1 }), 'utf-8');

      const caps: DeviceVolumeCaps = loadDeviceVolumeCaps(file);
      expect(caps['Mute']).toBe(0);
      expect(caps['Full']).toBe(1);
    });

    it('returns empty map on malformed JSON (graceful fallback)', async () => {
      const file: string = path.join(tmpRoot, 'broken.json');
      await fs.writeFile(file, '{ not valid json', 'utf-8');

      expect(loadDeviceVolumeCaps(file)).toEqual({});
    });
  });

  describe('capLevelForDevice', () => {

    const caps: DeviceVolumeCaps = { 'BathCom': 0.5 };

    it('caps the level when the requested volume exceeds the device cap', () => {
      expect(capLevelForDevice('BathCom', 0.7, caps)).toBe(0.5);
    });

    it('leaves the level unchanged when below the cap', () => {
      expect(capLevelForDevice('BathCom', 0.3, caps)).toBe(0.3);
    });

    it('leaves the level unchanged for a device with no cap entry', () => {
      expect(capLevelForDevice('Boomer', 0.9, caps)).toBe(0.9);
    });

    it('matches the cap case-insensitively (discovery casing not guaranteed)', () => {
      expect(capLevelForDevice('bathcom', 0.7, caps)).toBe(0.5);
      expect(capLevelForDevice('BATHCOM', 0.7, caps)).toBe(0.5);
    });

    it('returns the cap exactly when the requested level equals the cap', () => {
      expect(capLevelForDevice('BathCom', 0.5, caps)).toBe(0.5);
    });

    it('returns the level unchanged for an empty caps map', () => {
      expect(capLevelForDevice('BathCom', 0.9, {})).toBe(0.9);
    });
  });
});
