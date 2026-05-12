// `ma spotify status` — diagnose current Spotify auth + playback state.

import { parseArgs } from 'node:util';
import {
  loadConfig,
  ensureFreshToken,
  getCurrentPlayback,
  listDevices,
} from '../spotify/spotify.client.js';
import { ok, makeRequestId, writeEnvelope } from '../output/envelope.js';

interface SpotifyDiagnostic {
  configured: boolean;
  tokenValid?: boolean;
  currentPlayback?: unknown;
  devices?: unknown;
  error?: string;
}

export async function runSpotifyStatusCommand(args: string[]): Promise<void> {
  const startedAt = Date.now();
  const requestId = makeRequestId();
  const parsed = parseArgs({
    args,
    options: { pretty: { type: 'boolean' } },
    strict: false,
  });

  const status = await runSpotifyDiagnostic();
  writeEnvelope(
    ok('spotify.status', requestId, startedAt, status),
    Boolean(parsed.values.pretty),
  );
}

export async function runSpotifyDiagnostic(): Promise<SpotifyDiagnostic> {
  const cfg = await loadConfig();
  if (!cfg) {
    return {
      configured: false,
      error: 'config/spotify.json missing — run: ma spotify auth',
    };
  }
  try {
    const token = await ensureFreshToken(cfg);
    const [playback, devices] = await Promise.all([getCurrentPlayback(token), listDevices(token)]);
    return {
      configured: true,
      tokenValid: true,
      currentPlayback: playback,
      devices,
    };
  } catch (err) {
    return {
      configured: true,
      tokenValid: false,
      error: (err as Error).message,
    };
  }
}
