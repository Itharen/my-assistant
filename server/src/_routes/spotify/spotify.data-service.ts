// Spotify integration data-service — server-side business logic.
//
// SSoT note (lásd `current/principles/ssot.md` cross-subproject):
// - Types kanonikus helye: `@server/_models/interfaces/integrations/spotify.interface`
// - Runtime CLI lib (`spotify.client.ts`) **dynamic import**-tal van behúzva,
//   mert a server `rootDir: ./src` korlátozza a static cross-folder import-okat
//   és ezzel a runtime CLI fájlok kívül esnek. A dynamic import async, de
//   modul-load alkalmával egyszer fut, aztán cache-elt.

import { randomUUID } from 'node:crypto';

import { DyFM_Error } from '@futdevpro/fsm-dynamo';
import type {
  SpotifyConfig,
  PlaybackSnapshot,
  SpotifyDevice,
  SpotifyStatusResponse,
} from '@server/_models/interfaces/integrations/spotify.interface';

import { reportSwallowedFailure } from '../../_collections/swallowed-failure.util.js';

/** OAuth scope-ok — playback read + control. */
const SPOTIFY_SCOPES: string[] = [
  'user-read-playback-state',
  'user-modify-playback-state',
];

/** Spotify dashboard-on regisztrálandó server-callback URL. */
export function getSpotifyRedirectUri(serverPort: number): string {
  // Spotify 2025: csak loopback IP literal, NEM `localhost`.
  return `http://127.0.0.1:${serverPort}/api/spotify/auth/callback`;
}

/** State map — OAuth flow context (in-memory, 10-min TTL). */
interface AuthStateEntry {
  createdAt: number;
}
const stateMap: Map<string, AuthStateEntry> = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

function gcStates(): void {
  const now = Date.now();
  for (const [s, entry] of stateMap.entries()) {
    if (now - entry.createdAt > STATE_TTL_MS) stateMap.delete(s);
  }
}

/** Dynamic import a CLI runtime modulhoz — egyszer-loadolt cache. */
let cliModulePromise: Promise<typeof import('@cli/spotify/spotify.client')> | null = null;
function loadCliClient(): Promise<typeof import('@cli/spotify/spotify.client')> {
  cliModulePromise ??= import('@cli/spotify/spotify.client');
  return cliModulePromise;
}

/** Plain data-service — nem extend-eli a DyNTS_DataService-t (nincs Mongoose model). */
export class Spotify_DataService {

  /**
   * Status: configured? token valid? current playback + device list.
   *
   * ⚠️ HIBACSOMAGOLAS (REQ-SYS-ERROR-WRAP): a tenyleges logika a `getStatusInner`-ben van.
   */
  async getStatus(): Promise<SpotifyStatusResponse> {
    try {
      return await this.getStatusInner();
    } catch (error: unknown) {
      // A nyers hiba (halozat, CLI-betoltes) kanonikus kodda alakul.
      throw new DyFM_Error({
        error: error,
        errorCode: 'MA-SPOTIFY-STATUS-FAILED',
        message: 'A(z) getStatus muvelet elszallt.',
      });
    }
  }

  /** A tenyleges logika — a hibacsomagolas a hivo `getStatus`-ban van. */
  private async getStatusInner(): Promise<SpotifyStatusResponse> {
    const { loadConfig, ensureFreshToken, getCurrentPlayback, listDevices } = await loadCliClient();
    const cfg: SpotifyConfig | null = await loadConfig();
    if (!cfg) {
      return {
        configured: false,
        error: 'config/spotify.json missing — run Re-auth',
      };
    }
    try {
      const token: string = await ensureFreshToken(cfg);
      const [ playback, devices ]: [ PlaybackSnapshot | null, SpotifyDevice[] ] = await Promise.all([
        getCurrentPlayback(token),
        listDevices(token),
      ]);
      return {
        configured: true,
        tokenValid: true,
        currentPlayback: playback,
        devices,
      };
    } catch (err) {
      // ⚠️ A `tokenValid: false` HATAROZOTT allitas — pedig lehet, hogy csak a Spotify volt
      // elerhetetlen. Ilyenkor a felhasznalot feleslegesen ujra-bejelentkezesre kuldenenk;
      // a naploban viszont latszik, MI tortent valojaban.
      reportSwallowedFailure('spotify.data-service.getStatus', err);

      return {
        configured: true,
        tokenValid: false,
        error: (err as Error).message,
      };
    }
  }

  /** OAuth flow start: olvas a meglévő config-ból (clientId), state-et generál, URL-t ad vissza. */
  /** ⚠️ HIBACSOMAGOLAS (REQ-SYS-ERROR-WRAP): a tenyleges logika a `startAuthInner`-ben van. */
  async startAuth(serverPort: number): Promise<{ url: string; state: string } | { error: string }> {
    try {
      return await this.startAuthInner(serverPort);
    } catch (error: unknown) {
      // Az engedelyezes inditasanak bukasa nem szivarogtathat belso reszletet.
      throw new DyFM_Error({
        error: error,
        errorCode: 'MA-SPOTIFY-AUTH-START-FAILED',
        message: 'A(z) startAuth muvelet elszallt.',
      });
    }
  }

  /** A tenyleges logika — a hibacsomagolas a hivo `startAuth`-ban van. */
  private async startAuthInner(serverPort: number): Promise<{ url: string; state: string } | { error: string }> {
    const { loadConfig } = await loadCliClient();
    const cfg: SpotifyConfig | null = await loadConfig();
    if (!cfg) {
      return { error: 'cli/config/spotify.json missing — initial setup needs clientId+clientSecret first (UI not built yet)' };
    }
    gcStates();
    const state: string = randomUUID();
    stateMap.set(state, { createdAt: Date.now() });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: cfg.clientId,
      scope: SPOTIFY_SCOPES.join(' '),
      redirect_uri: getSpotifyRedirectUri(serverPort),
      state,
    });
    return {
      url: `https://accounts.spotify.com/authorize?${params.toString()}`,
      state,
    };
  }

  /** OAuth callback: code → tokens, mentés a CLI config-jába. */
  /** ⚠️ HIBACSOMAGOLAS (REQ-SYS-ERROR-WRAP): a tenyleges logika a `completeAuthInner`-ben van. */
  async completeAuth(args: {
    code: string;
    state: string;
    serverPort: number;
  }): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      return await this.completeAuthInner(args);
    } catch (error: unknown) {
      // ⚠️ Az OAuth-kod EGYSZER hasznalhato: nyers hiba eseten a felhasznalo nem tudna,
      // hogy ujra kell-e kezdenie az engedelyezest.
      throw new DyFM_Error({
        error: error,
        errorCode: 'MA-SPOTIFY-AUTH-COMPLETE-FAILED',
        message: 'A Spotify engedelyezes lezarasa elszallt.',
      });
    }
  }

  /** A tenyleges logika — a hibacsomagolas a hivo `completeAuth`-ban van. */
  private async completeAuthInner(args: {
    code: string;
    state: string;
    serverPort: number;
  }): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!stateMap.has(args.state)) {
      return { ok: false, error: 'invalid or expired state' };
    }
    stateMap.delete(args.state);

    const { loadConfig, saveConfig } = await loadCliClient();
    const cfg: SpotifyConfig | null = await loadConfig();
    if (!cfg) return { ok: false, error: 'config disappeared mid-flow' };

    const redirectUri: string = getSpotifyRedirectUri(args.serverPort);
    const basic: string = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');

    const tokenRes: Response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: args.code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) {
      const text: string = await tokenRes.text();
      return { ok: false, error: `token exchange HTTP ${tokenRes.status} — ${text}` };
    }
    const tokens = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };
    if (!tokens.refresh_token) {
      return { ok: false, error: 'no refresh_token in response' };
    }

    const updated: SpotifyConfig = {
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    };
    await saveConfig(updated);
    return { ok: true };
  }
}
