// Spec for cast/discover.ts — listIPv4Interfaces OS-dependent shape contract.
// Cycle 119 (safe-orthogonal spec-coverage).
//
// `discoverCastDevices` NEM tesztelt: mDNS network operation, integration-only.
// Itt csak a tiszta `listIPv4Interfaces` OS-snapshot helper-t fedjük le.

import { listIPv4Interfaces, type NetIface } from './discover.js';

describe('cast/discover.ts — listIPv4Interfaces', () => {

  it('returns an array (any non-throw call shape is the contract)', () => {
    const out: NetIface[] = listIPv4Interfaces();

    expect(Array.isArray(out)).toBe(true);
  });

  it('produces entries with name/address/netmask/cidr fields (shape-only test, no value asserts)', () => {
    const out: NetIface[] = listIPv4Interfaces();

    // CI sometimes has zero non-loopback IPv4 — skip if empty.
    if (out.length === 0) {
      pending('No non-loopback IPv4 interfaces on this host — skipping shape assertions.');

      return;
    }

    for (const iface of out) {
      expect(typeof iface.name).toBe('string');
      expect(iface.name.length).toBeGreaterThan(0);
      expect(typeof iface.address).toBe('string');
      // IPv4 dotted quad regex (permissive, accepts any-octet sizes).
      expect(iface.address).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(typeof iface.netmask).toBe('string');
      expect(typeof iface.cidr).toBe('string');
    }
  });

  it('excludes loopback addresses (127.0.0.0/8)', () => {
    const out: NetIface[] = listIPv4Interfaces();
    const loopbacks: NetIface[] = out.filter((i: NetIface): boolean => i.address.startsWith('127.'));

    expect(loopbacks.length).toBe(0);
  });

  it('produces a stable snapshot on repeated calls (no caching bug, no mutation)', () => {
    const a: NetIface[] = listIPv4Interfaces();
    const b: NetIface[] = listIPv4Interfaces();

    expect(b.length).toBe(a.length);
    // Same address-set (interface order may differ).
    const aAddrs: Set<string> = new Set<string>(a.map((i: NetIface): string => i.address));
    const bAddrs: Set<string> = new Set<string>(b.map((i: NetIface): string => i.address));
    expect(bAddrs).toEqual(aAddrs);
  });
});
