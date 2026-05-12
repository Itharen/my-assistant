// `ma spotify auth` — one-time OAuth setup wizard for Spotify Web API.

import { runSpotifyAuth } from '../spotify/spotify-auth.flow.js';

export async function runSpotifyAuthCommand(_args: string[]): Promise<void> {
  await runSpotifyAuth();
}
