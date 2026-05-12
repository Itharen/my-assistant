import { isCastGroup, resolveVolumeTargets } from './groups.js';
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
  });
});
