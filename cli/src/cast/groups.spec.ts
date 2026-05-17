import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { isCastGroup, loadGroupConfig, resolveVolumeTargets } from './groups.js';
import type { CastDevice } from './discover.js';

function dev(name: string, address: string, isGroup = false): CastDevice {
  return {
    name,
    host: `${name}.local`,
    address,
    port: 8009,
    txt: isGroup ? { md: 'Google Cast Group' } : { md: 'Google Home Mini' },
  };
}

describe('groups', () => {
  describe('isCastGroup', () => {
    it('returns true for a Google Cast Group txt md', () => {
      expect(isCastGroup(dev('All Speakers', '1.1.1.1', true))).toBe(true);
    });

    it('returns false for individual devices', () => {
      expect(isCastGroup(dev('BathCom', '1.1.1.2'))).toBe(false);
    });
  });

  describe('resolveVolumeTargets', () => {
    const indA = dev('BathCom', '10.0.0.10');
    const indB = dev('Boomer', '10.0.0.11');
    const grp = dev('All Speakers', '10.0.0.99', true);
    const all = [indA, indB, grp];

    it('returns single individual when play target is individual', () => {
      const refs = resolveVolumeTargets({
        playTarget: indA,
        allDevices: all,
        config: {},
      });
      expect(refs).toHaveSize(1);
      expect(refs[0]!.name).toBe('BathCom');
    });

    it('uses config-mapped members when play target is a group with config entry', () => {
      const refs = resolveVolumeTargets({
        playTarget: grp,
        allDevices: all,
        config: { 'All Speakers': ['BathCom', 'Boomer'] },
      });
      expect(refs.map((r) => r.name).sort()).toEqual(['BathCom', 'Boomer']);
    });

    it('falls back to all individuals when group has no config entry', () => {
      const refs = resolveVolumeTargets({
        playTarget: grp,
        allDevices: all,
        config: {},
      });
      expect(refs.map((r) => r.name).sort()).toEqual(['BathCom', 'Boomer']);
    });

    it('respects override list when provided', () => {
      const refs = resolveVolumeTargets({
        playTarget: grp,
        allDevices: all,
        config: { 'All Speakers': ['BathCom', 'Boomer'] },
        override: ['Boomer'],
      });
      expect(refs.map((r) => r.name)).toEqual(['Boomer']);
    });

    // Cycle 120: additional branches.
    it('substring-matches override names when no exact match exists', () => {
      const refs = resolveVolumeTargets({
        playTarget: grp,
        allDevices: all,
        config: {},
        override: ['bath'],  // partial-name lookup
      });
      expect(refs.map((r) => r.name)).toEqual(['BathCom']);
    });

    it('skips unresolvable override names (no throw, empty result if all miss)', () => {
      const refs = resolveVolumeTargets({
        playTarget: grp,
        allDevices: all,
        config: {},
        override: ['NonExistent'],
      });
      expect(refs).toEqual([]);
    });

    it('invokes onLog with descriptive messages for each branch', () => {
      const logs: string[] = [];
      const onLog = (m: string): void => { logs.push(m); };

      resolveVolumeTargets({ playTarget: indA, allDevices: all, config: {}, onLog });
      resolveVolumeTargets({ playTarget: grp, allDevices: all, config: { 'All Speakers': ['BathCom'] }, onLog });
      resolveVolumeTargets({ playTarget: grp, allDevices: all, config: {}, onLog });
      resolveVolumeTargets({ playTarget: grp, allDevices: all, config: {}, override: ['BathCom'], onLog });

      expect(logs.length).toBe(4);
      expect(logs[0]).toContain('single device target');
      expect(logs[1]).toContain('from config');
      expect(logs[2]).toContain('fallback');
      expect(logs[3]).toContain('override');
    });
  });

  // Cycle 120: loadGroupConfig coverage — fs-IO + JSON parse + filter.
  describe('loadGroupConfig', () => {

    let tmpRoot: string;

    beforeEach(async () => {
      tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ma-groups-spec-'));
    });

    afterEach(async () => {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    });

    it('returns empty object when the config file does not exist', () => {
      const result = loadGroupConfig(path.join(tmpRoot, 'no-such.json'));
      expect(result).toEqual({});
    });

    it('parses a valid groups JSON into a GroupConfig', async () => {
      const file = path.join(tmpRoot, 'groups.json');
      await fs.writeFile(file, JSON.stringify({
        'All Speakers': ['BathCom', 'Boomer'],
        'Living Room': ['LivingTV'],
      }), 'utf-8');

      const cfg = loadGroupConfig(file);
      expect(cfg['All Speakers']).toEqual(['BathCom', 'Boomer']);
      expect(cfg['Living Room']).toEqual(['LivingTV']);
    });

    it('strips entries whose key starts with underscore (comment convention)', async () => {
      const file = path.join(tmpRoot, 'groups.json');
      await fs.writeFile(file, JSON.stringify({
        '_comment': 'this should not appear',
        'Real Group': ['DevA'],
      }), 'utf-8');

      const cfg = loadGroupConfig(file);
      expect(cfg['_comment']).toBeUndefined();
      expect(cfg['Real Group']).toEqual(['DevA']);
    });

    it('skips entries whose value is not a string array', async () => {
      const file = path.join(tmpRoot, 'groups.json');
      await fs.writeFile(file, JSON.stringify({
        'Bad1': 'not-an-array',
        'Bad2': [1, 2, 3],          // numbers, not strings
        'Bad3': ['ok', 99],          // mixed → reject
        'Good': ['member-a'],
      }), 'utf-8');

      const cfg = loadGroupConfig(file);
      expect(cfg['Bad1']).toBeUndefined();
      expect(cfg['Bad2']).toBeUndefined();
      expect(cfg['Bad3']).toBeUndefined();
      expect(cfg['Good']).toEqual(['member-a']);
    });

    it('returns empty object on malformed JSON (no throw, falls back gracefully)', async () => {
      const file = path.join(tmpRoot, 'broken.json');
      await fs.writeFile(file, '{ this is not valid json', 'utf-8');

      const cfg = loadGroupConfig(file);
      expect(cfg).toEqual({});
    });
  });
});
