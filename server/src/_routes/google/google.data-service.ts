// Google Assistant SDK integration data-service — server-side business logic.
//
// SSoT note (lásd `current/principles/ssot.md` cross-subproject):
// - Types: `@server/_models/interfaces/integrations/google.interface`
// - CLI runtime: dynamic import (`@cli/google/google-assistant.client`).

import { existsSync, promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import type {
  GoogleAssistantConfig,
  GoogleStatusResponse,
  QueryResult,
} from '@server/_models/interfaces/integrations/google.interface';

const SCOPE = 'https://www.googleapis.com/auth/assistant-sdk-prototype';
const DEVICE_MODEL_PREFIX = 'ma-cli';
const DEVICE_MANUFACTURER = 'my-assistant';
const DEVICE_PRODUCT_NAME = 'cast-notifier';
const DEVICE_TYPE = 'action.devices.types.LIGHT';

/** GCP OAuth client redirect URI — meg kell egyezzen a console-ban regisztrálttal. */
export function getGoogleRedirectUri(serverPort: number): string {
  return `http://localhost:${serverPort}/api/google/auth/callback`;
}

interface AuthStateEntry { createdAt: number }
const stateMap: Map<string, AuthStateEntry> = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

function gcStates(): void {
  const now: number = Date.now();
  for (const [s, entry] of stateMap.entries()) {
    if (now - entry.createdAt > STATE_TTL_MS) stateMap.delete(s);
  }
}

let cliModulePromise: Promise<typeof import('@cli/google/google-assistant.client')> | null = null;
function loadCliClient(): Promise<typeof import('@cli/google/google-assistant.client')> {
  cliModulePromise ??= import('@cli/google/google-assistant.client');
  return cliModulePromise;
}

export class Google_DataService {

  /** Status: configured? tokens present? device IDs? next step suggestion. */
  async getStatus(): Promise<GoogleStatusResponse> {
    const { loadConfig, defaultTokensPath } = await loadCliClient();
    const cfg: GoogleAssistantConfig | null = await loadConfig();
    const tokensPath: string = defaultTokensPath();
    const tokensExist: boolean = existsSync(tokensPath);

    return {
      configured: Boolean(cfg),
      hasInstalledCreds: Boolean(cfg?.installed?.client_id && cfg?.installed?.client_secret),
      hasTokensFile: tokensExist,
      hasDeviceModel: Boolean(cfg?.runtime?.device_model_id),
      hasDeviceInstance: Boolean(cfg?.runtime?.device_id),
      projectId: cfg?.installed?.project_id,
      deviceModelId: cfg?.runtime?.device_model_id,
      deviceId: cfg?.runtime?.device_id,
      tokensPath,
      nextStep: this.pickNextStep(cfg, tokensExist),
    };
  }

  private pickNextStep(cfg: GoogleAssistantConfig | null, tokensExist: boolean): string {
    if (!cfg) return 'cli/config/google.json missing — download from GCP Console (OAuth client → Desktop)';
    if (!cfg.installed?.client_id) return 'cli/config/google.json malformed — needs `installed.client_id`';
    if (!tokensExist) return 'open Re-auth';
    if (!cfg.runtime?.device_model_id || !cfg.runtime?.device_id) return 'open Re-auth (will register device)';
    return 'ready — try a Test Query';
  }

  /** OAuth start — visszaad egy authorize URL-t. */
  async startAuth(serverPort: number): Promise<{ url: string; state: string } | { error: string }> {
    const { loadConfig } = await loadCliClient();
    const cfg: GoogleAssistantConfig | null = await loadConfig();
    if (!cfg) return { error: 'cli/config/google.json missing — upload first via GCP Console download' };

    gcStates();
    const state: string = randomUUID();
    stateMap.set(state, { createdAt: Date.now() });

    const params = new URLSearchParams({
      client_id: cfg.installed.client_id,
      redirect_uri: getGoogleRedirectUri(serverPort),
      response_type: 'code',
      scope: SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      state,
    };
  }

  /** OAuth callback — code → tokens → device registration → save. */
  async completeAuth(args: {
    code: string;
    state: string;
    serverPort: number;
  }): Promise<{ ok: true; deviceModelId: string; deviceId: string } | { ok: false; error: string }> {
    if (!stateMap.has(args.state)) return { ok: false, error: 'invalid or expired state' };
    stateMap.delete(args.state);

    const { loadConfig, saveConfig, defaultTokensPath } = await loadCliClient();
    const cfg: GoogleAssistantConfig | null = await loadConfig();
    if (!cfg) return { ok: false, error: 'config disappeared mid-flow' };

    const redirectUri: string = getGoogleRedirectUri(args.serverPort);
    const tokenRes: Response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: args.code,
        client_id: cfg.installed.client_id,
        client_secret: cfg.installed.client_secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
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
      scope?: string;
      token_type?: string;
    };
    if (!tokens.refresh_token) return { ok: false, error: 'no refresh_token — revoke prior consent at https://myaccount.google.com/permissions and retry' };

    // Tokens fájl mentés (google-auth-library shape, a CLI client olvassa)
    const tokensFile = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type ?? 'Bearer',
      expiry_date: Date.now() + tokens.expires_in * 1000,
    };
    await fs.writeFile(defaultTokensPath(), JSON.stringify(tokensFile, null, 2) + '\n', 'utf-8');

    // Device model + instance regisztráció (ha még nincs)
    let deviceModelId: string | undefined = cfg.runtime?.device_model_id;
    let deviceId: string | undefined = cfg.runtime?.device_id;

    if (!deviceModelId) {
      deviceModelId = `${DEVICE_MODEL_PREFIX}-model-${randomShort()}`;
      await registerDeviceModel({ projectId: cfg.installed.project_id, deviceModelId, accessToken: tokens.access_token });
    }
    if (!deviceId) {
      deviceId = `${DEVICE_MODEL_PREFIX}-instance-${randomShort()}`;
      await registerDeviceInstance({ projectId: cfg.installed.project_id, deviceId, deviceModelId, accessToken: tokens.access_token });
    }

    const updated: GoogleAssistantConfig = {
      installed: cfg.installed,
      runtime: { device_model_id: deviceModelId, device_id: deviceId },
    };
    await saveConfig(updated);

    return { ok: true, deviceModelId, deviceId };
  }

  /** Test query — wrap a CLI sendTextQuery-t. */
  async sendQuery(text: string, lang?: string): Promise<QueryResult> {
    const { sendTextQuery } = await loadCliClient();
    return sendTextQuery({ text, lang });
  }
}

function randomShort(): string {
  return randomUUID().split('-')[0]!;
}

async function registerDeviceModel(args: {
  projectId: string;
  deviceModelId: string;
  accessToken: string;
}): Promise<void> {
  const url: string = `https://embeddedassistant.googleapis.com/v1alpha2/projects/${args.projectId}/deviceModels`;
  const body = {
    project_id: args.projectId,
    device_model_id: args.deviceModelId,
    manifest: {
      manufacturer: DEVICE_MANUFACTURER,
      product_name: DEVICE_PRODUCT_NAME,
      device_description: 'my-assistant server-registered virtual device',
    },
    device_type: DEVICE_TYPE,
    traits: [],
  };
  const res: Response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${args.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 409) {
    const text: string = await res.text();
    throw new Error(`registerDeviceModel HTTP ${res.status} — ${text}`);
  }
}

async function registerDeviceInstance(args: {
  projectId: string;
  deviceId: string;
  deviceModelId: string;
  accessToken: string;
}): Promise<void> {
  const url: string = `https://embeddedassistant.googleapis.com/v1alpha2/projects/${args.projectId}/devices`;
  const body = {
    id: args.deviceId,
    model_id: args.deviceModelId,
    client_type: 'SDK_SERVICE',
    nickname: 'ma-server',
  };
  const res: Response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${args.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 409) {
    const text: string = await res.text();
    throw new Error(`registerDeviceInstance HTTP ${res.status} — ${text}`);
  }
}
