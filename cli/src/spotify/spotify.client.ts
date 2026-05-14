// Spotify Web API client — minimális, only-what-we-need.
//
// Felhasznált endpoint-ok:
//   - POST  /api/token                 — refresh access token
//   - GET   /v1/me/player              — current playback state
//   - GET   /v1/me/player/devices      — available devices (Cast group-ok itt mint nevek)
//   - PUT   /v1/me/player              — transfer playback to device(s) + resume
//
// Auth: a config/spotify.json tartalmazza a clientId/clientSecret + refreshToken.
// Az accessToken cache-elve van + lejárati timestamp-pel; refresh on-demand.
//
// FOSS / no-paid: Spotify Web API a user MEGLÉVŐ (Premium) előfizetésén
// keresztül megy. Maga az API ingyen használható app-szinten, csak a Premium
// feltétel a playback control-hoz.

import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { logAction } from '../action-log/action-log.client.js';

// Types: SSoT a server-ben (lásd `current/principles/ssot.md` cross-subproject pattern).
import type {
  SpotifyConfig,
  PlaybackSnapshot,
  SpotifyDevice,
  ResolveDeviceResult,
} from '@server/_models/interfaces/integrations/spotify.interface';
export type { SpotifyConfig, PlaybackSnapshot, SpotifyDevice, ResolveDeviceResult };

const SPOTIFY_APP_ID = '705D30C6'; // Cast app ID a Spotify-ra (a getStatus-ből látjuk)

export function isSpotifyApp(appId: string | undefined, displayName?: string): boolean {
  if (appId === SPOTIFY_APP_ID) return true;
  if (displayName?.toLowerCase().includes('spotify')) return true;
  return false;
}

export function defaultConfigPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', '..', 'config', 'spotify.json');
}

export async function loadConfig(path?: string): Promise<SpotifyConfig | null> {
  const p = path ?? defaultConfigPath();
  try {
    const raw = await fs.readFile(p, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<SpotifyConfig>;
    if (!parsed.clientId || !parsed.clientSecret || !parsed.refreshToken) return null;
    return {
      clientId: parsed.clientId,
      clientSecret: parsed.clientSecret,
      refreshToken: parsed.refreshToken,
      accessToken: parsed.accessToken,
      expiresAt: parsed.expiresAt,
    };
  } catch (err) {
    // ENOENT first-run silent OK; egyéb (parse, perm) strukturált log.
    const errno: NodeJS.ErrnoException = err as NodeJS.ErrnoException;
    if (errno.code !== 'ENOENT') {
      const msg: string = err instanceof Error ? err.message : String(err);
      void logAction({
        kind: 'error',
        summary: `[spotify] MA-SPOTIFY-CONFIG-LOAD-FAIL: ${msg}`,
        ref: p,
        extra: { code: 'MA-SPOTIFY-CONFIG-LOAD-FAIL', file: p, error: msg, errnoCode: errno.code },
      });
    }
    return null;
  }
}

export async function saveConfig(cfg: SpotifyConfig, path?: string): Promise<void> {
  const p = path ?? defaultConfigPath();
  await fs.mkdir(dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
}

// ===== Token kezelés =======================================================

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export async function ensureFreshToken(cfg: SpotifyConfig, configPath?: string): Promise<string> {
  const now = Date.now();
  // 60s safety margin
  if (cfg.accessToken && cfg.expiresAt && cfg.expiresAt - now > 60_000) {
    return cfg.accessToken;
  }
  const refreshed = await refreshAccessToken(cfg);
  cfg.accessToken = refreshed.access_token;
  cfg.expiresAt = now + refreshed.expires_in * 1000;
  if (refreshed.refresh_token) cfg.refreshToken = refreshed.refresh_token;
  await saveConfig(cfg, configPath);
  return cfg.accessToken;
}

async function refreshAccessToken(cfg: SpotifyConfig): Promise<TokenResponse> {
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: cfg.refreshToken,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify token refresh failed: HTTP ${res.status} — ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

// ===== Web API hívások =====================================================

interface PlaybackState {
  device?: { id: string; name: string; type: string; volume_percent?: number };
  is_playing?: boolean;
  progress_ms?: number;
  item?: { uri: string; name: string; artists: Array<{ name: string }> };
  context?: { uri: string };
}

interface DevicesResponse {
  devices: Array<{ id: string; name: string; type: string; is_active: boolean; volume_percent?: number }>;
}

export async function getCurrentPlayback(token: string): Promise<PlaybackSnapshot | null> {
  const res = await fetch('https://api.spotify.com/v1/me/player', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return null; // no active playback
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify /me/player failed: HTTP ${res.status} — ${text}`);
  }
  const data = (await res.json()) as PlaybackState;
  if (!data.device || !data.device.id) return null;
  return {
    isPlaying: Boolean(data.is_playing),
    trackUri: data.item?.uri,
    trackName: data.item?.name,
    artistName: data.item?.artists?.map((a) => a.name).join(', '),
    positionMs: data.progress_ms ?? 0,
    deviceId: data.device.id,
    deviceName: data.device.name,
    contextUri: data.context?.uri,
  };
}

export async function listDevices(token: string): Promise<SpotifyDevice[]> {
  const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify devices failed: HTTP ${res.status} — ${text}`);
  }
  const data = (await res.json()) as DevicesResponse;
  return data.devices.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    isActive: d.is_active,
    volumePercent: d.volume_percent,
  }));
}

// Transfer + start playback on a device. Spotify Connect wake-upol és onnan
// folytatja, ahol a saved playback abbamaradt.
export async function transferPlayback(
  token: string,
  deviceId: string,
  startPlay: boolean,
): Promise<void> {
  const res = await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_ids: [deviceId], play: startPlay }),
  });
  if (!res.ok && res.status !== 202 && res.status !== 204) {
    const text = await res.text();
    throw new Error(`Spotify transfer failed: HTTP ${res.status} — ${text}`);
  }
}

// ===== Magas szintű flow ===================================================

// A pre-snapshot deviceName-jét próbáljuk megtalálni a current device-list-ben.
// Ha eltűnt (mert a Cast átvétel törölte), keresünk substring matchet. Ha
// nincs match, visszaadjuk a candidates listát logoláshoz.
export function resolveResumeDevice(
  preferredName: string,
  currentDevices: SpotifyDevice[],
): ResolveDeviceResult {
  const target = preferredName.trim().toLowerCase();
  const exact = currentDevices.find((d) => d.name.toLowerCase() === target);
  if (exact) return { device: exact, candidates: currentDevices };
  const sub = currentDevices.find((d) => d.name.toLowerCase().includes(target));
  return { device: sub ?? null, candidates: currentDevices };
}
