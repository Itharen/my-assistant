// One-time Google Assistant SDK setup:
//   1) OAuth dance — browser callback localhost:9877-en (Google "loopback" wildcard)
//   2) Device model + device instance regisztráció a Google Embedded Assistant API-n
//   3) Mentés:
//        - cli/config/google-tokens.json  (google-auth-library shape, a `google-assistant` lib által olvasott)
//        - cli/config/google.json `runtime` blokk (device IDs)

import { createServer } from 'node:http';
import { URL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import {
  loadConfig,
  saveConfig,
  defaultTokensPath,
  type GoogleAssistantConfig,
} from './google-assistant.client.js';

const REDIRECT_HOST = 'localhost'; // GCP "installed" client wildcard-elja a localhost portot
const REDIRECT_PORT = 9877;
const REDIRECT_URI = `http://${REDIRECT_HOST}:${REDIRECT_PORT}/callback`;
const SCOPE = 'https://www.googleapis.com/auth/assistant-sdk-prototype';

const DEVICE_MODEL_PREFIX = 'ma-cli';
const DEVICE_MANUFACTURER = 'my-assistant';
const DEVICE_PRODUCT_NAME = 'cast-notifier';
const DEVICE_TYPE = 'action.devices.types.LIGHT';

export interface AuthFlowResult {
  refreshTokenObtained: boolean;
  deviceModelId: string;
  deviceId: string;
  tokensPath: string;
}

export async function runAuthFlow(opts: {
  onLog?: (msg: string) => void;
}): Promise<AuthFlowResult> {
  const { onLog } = opts;
  const cfg = await loadConfig();
  if (!cfg) {
    throw new Error('cli/config/google.json missing or malformed (need `installed.client_id` etc.)');
  }

  // 1) OAuth code-flow loopback callback-kel
  const state = randomState();
  const authUrl = buildAuthUrl(cfg.installed.client_id, state);
  onLog?.(`open in browser:\n  ${authUrl}\nlistening on ${REDIRECT_URI}`);
  process.stdout.write(`\nNyisd meg a böngészőben:\n  ${authUrl}\n\nVárok a callback-re a porton ${REDIRECT_PORT} ...\n`);

  const code = await waitForCallback(state);
  onLog?.('callback received, exchanging for tokens');

  const tokens = await exchangeCodeForTokens(cfg.installed.client_id, cfg.installed.client_secret, code);
  if (!tokens.refresh_token) {
    throw new Error('No refresh_token in response — abort. Tip: revoke prior consent at https://myaccount.google.com/permissions and retry.');
  }
  onLog?.('refresh_token obtained');

  // 2) Mentés google-tokens.json-be (google-auth-library OAuth2Client shape)
  const tokensFile = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    token_type: tokens.token_type ?? 'Bearer',
    expiry_date: Date.now() + tokens.expires_in * 1000,
  };
  const tokensPath = defaultTokensPath();
  await fs.writeFile(tokensPath, JSON.stringify(tokensFile, null, 2) + '\n', 'utf-8');
  onLog?.(`tokens saved: ${tokensPath}`);

  // 3) Device model + instance regisztráció
  const projectId = cfg.installed.project_id;

  let deviceModelId = cfg.runtime?.device_model_id;
  let deviceId = cfg.runtime?.device_id;

  if (!deviceModelId) {
    deviceModelId = `${DEVICE_MODEL_PREFIX}-model-${randomShort()}`;
    onLog?.(`registering device model: ${deviceModelId}`);
    await registerDeviceModel({ projectId, deviceModelId, accessToken: tokens.access_token });
  } else {
    onLog?.(`device model present: ${deviceModelId} (skip register)`);
  }

  if (!deviceId) {
    deviceId = `${DEVICE_MODEL_PREFIX}-instance-${randomShort()}`;
    onLog?.(`registering device instance: ${deviceId}`);
    await registerDeviceInstance({ projectId, deviceId, deviceModelId, accessToken: tokens.access_token });
  } else {
    onLog?.(`device instance present: ${deviceId} (skip register)`);
  }

  // 4) Mentés google.json runtime blokk
  const updated: GoogleAssistantConfig = {
    installed: cfg.installed,
    runtime: { device_model_id: deviceModelId, device_id: deviceId },
  };
  await saveConfig(updated);
  onLog?.('config/google.json updated with runtime block');

  return { refreshTokenObtained: true, deviceModelId, deviceId, tokensPath };
}

// ===== OAuth helpers =======================================================

function buildAuthUrl(clientId: string, state: string): string {
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('redirect_uri', REDIRECT_URI);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', SCOPE);
  u.searchParams.set('access_type', 'offline');
  u.searchParams.set('prompt', 'consent');
  u.searchParams.set('state', state);
  return u.toString();
}

function randomState(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function randomShort(): string {
  return randomUUID().split('-')[0]!;
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
      const err = url.searchParams.get('error');

      if (err) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end(`Error: ${err}`);
        server.close();
        reject(new Error(`Google OAuth error: ${err}`));
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

    server.listen(REDIRECT_PORT, REDIRECT_HOST, () => {
      // ready
    });
    server.on('error', (e) => reject(e));
  });
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}

async function exchangeCodeForTokens(
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: HTTP ${res.status} — ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

// ===== Device registration helpers =========================================

async function registerDeviceModel(args: {
  projectId: string;
  deviceModelId: string;
  accessToken: string;
}): Promise<void> {
  const { projectId, deviceModelId, accessToken } = args;
  const url = `https://embeddedassistant.googleapis.com/v1alpha2/projects/${projectId}/deviceModels`;
  const body = {
    project_id: projectId,
    device_model_id: deviceModelId,
    manifest: {
      manufacturer: DEVICE_MANUFACTURER,
      product_name: DEVICE_PRODUCT_NAME,
      device_description: 'my-assistant CLI virtual device for Assistant SDK queries',
    },
    device_type: DEVICE_TYPE,
    traits: [],
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    throw new Error(`registerDeviceModel HTTP ${res.status} — ${text}`);
  }
}

async function registerDeviceInstance(args: {
  projectId: string;
  deviceId: string;
  deviceModelId: string;
  accessToken: string;
}): Promise<void> {
  const { projectId, deviceId, deviceModelId, accessToken } = args;
  const url = `https://embeddedassistant.googleapis.com/v1alpha2/projects/${projectId}/devices`;
  const body = {
    id: deviceId,
    model_id: deviceModelId,
    client_type: 'SDK_SERVICE',
    nickname: 'ma-cli',
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    throw new Error(`registerDeviceInstance HTTP ${res.status} — ${text}`);
  }
}
