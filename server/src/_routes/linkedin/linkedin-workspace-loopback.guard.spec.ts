import { LinkedInWorkspace_LoopbackGuard } from './linkedin-workspace-loopback.guard.js';

describe('LinkedIn workspace loopback guard', (): void => {
  it('accepts only IPv4, IPv6 and IPv4-mapped loopback addresses', (): void => {
    expect(LinkedInWorkspace_LoopbackGuard.isLoopbackAddress('127.0.0.1')).toBeTrue();
    expect(LinkedInWorkspace_LoopbackGuard.isLoopbackAddress('::1')).toBeTrue();
    expect(LinkedInWorkspace_LoopbackGuard.isLoopbackAddress('::ffff:127.0.0.1')).toBeTrue();
  });

  it('rejects LAN, wildcard, missing and spoof-like addresses', (): void => {
    expect(LinkedInWorkspace_LoopbackGuard.isLoopbackAddress('192.168.1.5')).toBeFalse();
    expect(LinkedInWorkspace_LoopbackGuard.isLoopbackAddress('0.0.0.0')).toBeFalse();
    expect(LinkedInWorkspace_LoopbackGuard.isLoopbackAddress('127.0.0.1.attacker.invalid')).toBeFalse();
    expect(LinkedInWorkspace_LoopbackGuard.isLoopbackAddress(undefined)).toBeFalse();
  });
});
