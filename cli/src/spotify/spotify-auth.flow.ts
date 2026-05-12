// One-time Spotify OAuth setup script.
//
// Lépések a user-nek:
// 1. Csinálj egy Spotify app-ot itt: https://developer.spotify.com/dashboard
// 2. Add hozzá a Redirect URI-t: http://127.0.0.1:9876/callback (NEM localhost — Spotify 2025 szigorítás)
// 3. Másold ki a Client ID + Client Secret-et
// 4. Futtasd: pnpm spotify:auth
//    A script meghív téged a Client ID/Secret beadására, megnyit egy browser-t,
//    autorizálsz, mi elkapjuk a kódot, kicseréljük tokenre, mentjük config/spotify.json-be.

import { createServer } from 'node:http';
import { URL, fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { saveConfig, type SpotifyConfig } from './spotify.client.js';

// Walk-up .env loader — a my-assistant root-jában van a .env
function loadDotenvUpwards(): void {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    const p = join(dir, '.env');
    if (existsSync(p)) {
      const raw = readFileSync(p, 'utf-8');
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq < 0) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
      }
      return;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}

const REDIRECT_PORT = 9876;
// FONTOS: Spotify 2025-ben szigorított — `localhost` nem fogadható redirect URI-ban,
// csak loopback IP literal. Lásd RFC 8252.
const REDIRECT_HOST = '127.0.0.1';
const REDIRECT_URI = `http://${REDIRECT_HOST}:${REDIRECT_PORT}/callback`;
const SCOPES = ['user-read-playback-state', 'user-modify-playback-state'].join(' ');

export async function runSpotifyAuth(): Promise<void> {
  loadDotenvUpwards();
  process.stdout.write('\n=== Spotify OAuth setup ===\n\n');

  let clientId = (process.env.SPOTIFY_CLIENT_ID ?? '').trim();
  let clientSecret = (process.env.SPOTIFY_CLIENT_SECRET ?? '').trim();

  if (clientId && clientSecret) {
    process.stdout.write(`Env: SPOTIFY_CLIENT_ID=${clientId.slice(0, 6)}... SPOTIFY_CLIENT_SECRET=*** ✅\n`);
  } else {
    process.stdout.write('Env varok hiányoznak, interaktív input...\n');
    const rl = createInterface({ input: stdin, output: stdout });
    if (!clientId) clientId = (await rl.question('Client ID: ')).trim();
    if (!clientSecret) clientSecret = (await rl.question('Client Secret: ')).trim();
    rl.close();
  }

  if (!clientId || !clientSecret) {
    process.stderr.write('Üres Client ID vagy Secret — abort.\n');
    process.exit(1);
  }

  const state = randomState();
  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', state);

  process.stdout.write('\nNyisd meg a böngésződben:\n');
  process.stdout.write(`  ${authUrl.toString()}\n\n`);
  process.stdout.write(`Várok a callback-re a porton ${REDIRECT_PORT} ...\n`);

  const code = await waitForCallback(state);

  process.stdout.write('\nKód megkaptam, csere access token-re...\n');
  const tokens = await exchangeCodeForTokens(clientId, clientSecret, code);

  if (!tokens.refresh_token) {
    process.stderr.write('No refresh_token in response — abort.\n');
    process.exit(1);
  }

  const cfg: SpotifyConfig = {
    clientId,
    clientSecret,
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
  await saveConfig(cfg);
  process.stdout.write('\n✅ config/spotify.json elmentve.\n');
  process.stdout.write('   Mostantól a notify automatikusan használja a Spotify resume-ot.\n\n');
}

function randomState(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function waitForCallback(expectedState: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://${REDIRECT_HOST}:${REDIRECT_PORT}`);
      if (url.pathname !== '/callback') {
        res.writeHead(404).end('Not found');
        return;
      }
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end(`Error: ${error}`);
        server.close();
        reject(new Error(`Spotify error: ${error}`));
        return;
      }
      if (state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('State mismatch');
        server.close();
        reject(new Error('OAuth state mismatch — abort'));
        return;
      }
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No code');
        server.close();
        reject(new Error('No code in callback'));
        return;
      }
      res
        .writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        .end('<html><body><h2>OK — visszamehetsz a terminálba.</h2></body></html>');
      server.close();
      resolve(code);
    });

    server.listen(REDIRECT_PORT, () => {
      // ready
    });
    server.on('error', (err) => reject(err));
  });
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

async function exchangeCodeForTokens(
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<TokenResponse> {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
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
    throw new Error(`Token exchange failed: HTTP ${res.status} — ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

// Standalone script execution removed — runSpotifyAuth() is invoked by the
// `ma spotify auth` subcommand (see src/commands/spotify-auth.command.ts).
