// Spotify Web API integráció kanonikus típusai (SSoT — `current/principles/ssot.md`).
//
// Owners: server + cli + client mind innen importálják (`@server/_models/...`
// vagy a client-oldali `@server-models` barrel).
//
// Pure-type fájl — semmi runtime side-effect, semmi node-API import.

/** Auth + token state, a `cli/config/spotify.json` fájl shape-je. */
export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  expiresAt?: number;
}

/** A `/me/player` aktuális playback state-je egyszerűsítve. */
export interface PlaybackSnapshot {
  isPlaying: boolean;
  trackUri?: string;
  trackName?: string;
  artistName?: string;
  positionMs: number;
  deviceId: string;
  deviceName: string;
  contextUri?: string;
}

/** A `/me/player/devices` egy eleme. */
export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  volumePercent?: number;
}

/** `resolveResumeDevice` visszaadott eredménye. */
export interface ResolveDeviceResult {
  device: SpotifyDevice | null;
  candidates: SpotifyDevice[];
}

/** Server `/api/spotify/status` endpoint válasz-shape-je (UI fogyasztja). */
export interface SpotifyStatusResponse {
  configured: boolean;
  tokenValid?: boolean;
  currentPlayback?: PlaybackSnapshot | null;
  devices?: SpotifyDevice[];
  error?: string;
}
