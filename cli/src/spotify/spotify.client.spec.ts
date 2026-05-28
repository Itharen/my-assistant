// Spec for spotify.client.ts pure helpers — isSpotifyApp + resolveResumeDevice.
// Cycle 129 (safe-orthogonal spec-coverage).
//
// Network helpers (ensureFreshToken, getCurrentPlayback, listDevices,
// transferPlayback) NEM tesztelt: Spotify Web API HTTP calls, integration-only.

import { isSpotifyApp, resolveResumeDevice } from './spotify.client.js';
import type { SpotifyDevice } from '@server/_models/interfaces/integrations/spotify.interface';

function dev(name: string, id: string = `id-${name}`): SpotifyDevice {
  return { id, name, type: 'Speaker', isActive: false };
}

describe('| spotify.client — isSpotifyApp', () => {

  it('| returns true for the known Spotify Cast app id (705D30C6)', () => {
    expect(isSpotifyApp('705D30C6')).toBe(true);
  });

  it('| returns true when displayName contains "spotify" (case-insensitive)', () => {
    expect(isSpotifyApp('OTHER', 'Spotify')).toBe(true);
    expect(isSpotifyApp('OTHER', 'SPOTIFY player')).toBe(true);
    expect(isSpotifyApp(undefined, 'my spotify')).toBe(true);
  });

  it('| returns false for unrelated appId + displayName', () => {
    expect(isSpotifyApp('ABC123', 'YouTube Music')).toBe(false);
    expect(isSpotifyApp(undefined, undefined)).toBe(false);
    expect(isSpotifyApp(undefined)).toBe(false);
  });
});

describe('| spotify.client — resolveResumeDevice', () => {

  const devices: SpotifyDevice[] = [
    dev('Kitchen Speaker'),
    dev('Living Room'),
    dev('Phone'),
  ];

  it('| exact name match (case-insensitive) returns that device', () => {
    const res = resolveResumeDevice('living room', devices);
    expect(res.device?.name).toBe('Living Room');
    expect(res.candidates).toBe(devices);
  });

  it('| substring match when no exact match', () => {
    const res = resolveResumeDevice('kitchen', devices);
    expect(res.device?.name).toBe('Kitchen Speaker');
  });

  it('| returns null device when no name matches', () => {
    const res = resolveResumeDevice('garage', devices);
    expect(res.device).toBeNull();
    expect(res.candidates).toBe(devices);
  });

  it('| trims + lowercases the preferred name before matching', () => {
    const res = resolveResumeDevice('  PHONE  ', devices);
    expect(res.device?.name).toBe('Phone');
  });

  it('| exact match takes precedence over substring', () => {
    const withOverlap: SpotifyDevice[] = [
      dev('Room'),
      dev('Living Room'),
    ];
    const res = resolveResumeDevice('room', withOverlap);
    // 'Room' is an exact (lowercased) match — preferred over 'Living Room' substring.
    expect(res.device?.name).toBe('Room');
  });

  it('| empty device list returns null device + empty candidates', () => {
    const res = resolveResumeDevice('anything', []);
    expect(res.device).toBeNull();
    expect(res.candidates).toEqual([]);
  });
});
