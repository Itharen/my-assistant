// `ma google status` — show Google Assistant config state (no API call).

import { parseArgs } from 'node:util';
import { existsSync } from 'node:fs';
import { loadConfig, defaultTokensPath } from '../google/google-assistant.client.js';
import { ok, makeRequestId, writeEnvelope } from '../output/envelope.js';

export async function runGoogleStatusCommand(args: string[]): Promise<void> {
  const startedAt = Date.now();
  const requestId = makeRequestId();
  const parsed = parseArgs({
    args,
    options: { pretty: { type: 'boolean' } },
    strict: false,
  });

  const cfg = await loadConfig();
  const tokensExist = existsSync(defaultTokensPath());
  const status = {
    configured: Boolean(cfg),
    hasInstalledCreds: Boolean(cfg?.installed?.client_id && cfg?.installed?.client_secret),
    hasTokensFile: tokensExist,
    hasDeviceModel: Boolean(cfg?.runtime?.device_model_id),
    hasDeviceInstance: Boolean(cfg?.runtime?.device_id),
    projectId: cfg?.installed?.project_id,
    deviceModelId: cfg?.runtime?.device_model_id,
    deviceId: cfg?.runtime?.device_id,
    tokensPath: defaultTokensPath(),
    nextStep: pickNextStep(cfg, tokensExist),
  };

  writeEnvelope(ok('google.status', requestId, startedAt, status), Boolean(parsed.values.pretty));
}

function pickNextStep(
  cfg: Awaited<ReturnType<typeof loadConfig>>,
  tokensExist: boolean,
): string {
  if (!cfg) return 'cli/config/google.json missing — download from GCP Console (OAuth client → Desktop)';
  if (!cfg.installed?.client_id) return 'cli/config/google.json malformed — needs `installed.client_id`';
  if (!tokensExist) return 'run: ma google auth';
  if (!cfg.runtime?.device_model_id || !cfg.runtime?.device_id) return 'run: ma google auth (will register device)';
  return 'ready — try: ma google query "what time is it"';
}
