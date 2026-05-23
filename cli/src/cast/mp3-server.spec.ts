// Spec for cast/mp3-server.ts — pickLanIp OS-dependent subnet match.
// Cycle 124 (safe-orthogonal spec-coverage).
//
// `startMp3Server` NEM tesztelt: net listen + Cast client fetch, integration-only.
// Itt csak a tiszta `pickLanIp` LAN-IP-választó helper-t fedjük le.

import { networkInterfaces } from 'node:os';

import { pickLanIp } from './mp3-server.js';

function hasNonLoopbackIPv4(): boolean {
  const ifs = networkInterfaces();
  for (const list of Object.values(ifs)) {
    if (!list) continue;
    for (const a of list) {
      if (a.family === 'IPv4' && !a.internal) return true;
    }
  }

  return false;
}

describe('cast/mp3-server.ts — pickLanIp', () => {

  it('returns a non-empty IPv4 string when at least one non-loopback iface exists', () => {
    if (!hasNonLoopbackIPv4()) {
      pending('No non-loopback IPv4 interfaces on this host — skipping.');

      return;
    }
    const ip: string = pickLanIp();

    expect(typeof ip).toBe('string');
    expect(ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    expect(ip.startsWith('127.')).toBe(false);
  });

  it('returns a deterministic value across repeated calls (no caching bug, no mutation)', () => {
    if (!hasNonLoopbackIPv4()) {
      pending('No non-loopback IPv4 interfaces on this host — skipping.');

      return;
    }
    const a: string = pickLanIp();
    const b: string = pickLanIp();

    expect(b).toBe(a);
  });

  it('with explicit non-matching targetIp, falls back to a chosen IP (no throw)', () => {
    if (!hasNonLoopbackIPv4()) {
      pending('No non-loopback IPv4 interfaces on this host — skipping.');

      return;
    }
    // 203.0.113.x is RFC 5737 documentation range — guaranteed not in local LAN.
    const fallback: string = pickLanIp('203.0.113.99');

    expect(fallback).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    expect(fallback.startsWith('127.')).toBe(false);
  });

  it('returns the requested-subnet match if targetIp lies in a local subnet (best-effort)', () => {
    if (!hasNonLoopbackIPv4()) {
      pending('No non-loopback IPv4 interfaces on this host — skipping.');

      return;
    }
    // Pick a local interface's address as targetIp; the matcher should return
    // that very interface as the LAN IP because (a&m) === (t&m).
    const ifs = networkInterfaces();
    let probe: string | null = null;
    for (const list of Object.values(ifs)) {
      if (!list) continue;
      for (const a of list) {
        if (a.family === 'IPv4' && !a.internal) {
          probe = a.address;
          break;
        }
      }
      if (probe) break;
    }
    if (!probe) {
      pending('No probe IP available.');

      return;
    }
    expect(pickLanIp(probe)).toBe(probe);
  });
});
