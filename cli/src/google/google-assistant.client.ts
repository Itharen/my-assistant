// Google Assistant SDK client — wraps the `google-assistant` npm lib (uses
// modern @grpc/grpc-js, works on Node 22+).
//
// Két fájl:
//   - cli/config/google.json         — `installed` blokk (GCP letöltés) + `runtime.{device_id, device_model_id}`
//   - cli/config/google-tokens.json  — OAuth tokens (auth flow írja, lib olvassa)
//
// FOSS / no-paid: ingyenes Assistant SDK Service. Lifetime risk: 6-12 hónap (Assistant
// retirement folyamatban). Ha sunset, a notify silent fallback-be esik.

import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import GoogleAssistant from 'google-assistant';

import { logAction } from '../action-log/action-log.client.js';
import { safeCall } from '../utils/safe-call.js';

// Types: SSoT a server-ben (lásd `current/principles/ssot.md` cross-subproject pattern).
import type {
  GoogleInstalledCreds,
  GoogleRuntimeConfig,
  GoogleAssistantConfig,
  QueryOptions,
  QueryResult,
} from '@server/_models/interfaces/integrations/google.interface';
export type { GoogleInstalledCreds, GoogleRuntimeConfig, GoogleAssistantConfig, QueryOptions, QueryResult };

export function defaultConfigPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', '..', 'config', 'google.json');
}

export function defaultTokensPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', '..', 'config', 'google-tokens.json');
}

export async function loadConfig(path?: string): Promise<GoogleAssistantConfig | null> {
  const p = path ?? defaultConfigPath();
  try {
    const raw = await fs.readFile(p, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<GoogleAssistantConfig>;
    if (!parsed.installed?.client_id || !parsed.installed?.client_secret) return null;
    return parsed as GoogleAssistantConfig;
  } catch (err) {
    // ENOENT first-run silent OK; bármi más (parse fail, perm) strukturált log.
    const errno: NodeJS.ErrnoException = err as NodeJS.ErrnoException;
    if (errno.code !== 'ENOENT') {
      const msg: string = err instanceof Error ? err.message : String(err);
      void logAction({
        kind: 'error',
        summary: `[google] MA-GOOGLE-CONFIG-LOAD-FAIL: ${msg}`,
        ref: p,
        extra: { code: 'MA-GOOGLE-CONFIG-LOAD-FAIL', file: p, error: msg, errnoCode: errno.code },
      });
    }
    return null;
  }
}

export async function saveConfig(cfg: GoogleAssistantConfig, path?: string): Promise<void> {
  const p = path ?? defaultConfigPath();
  await fs.mkdir(dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(cfg, null, 2) + '\n', 'utf-8');
}

// Egy textQuery → response. Promise alapú wrapper az event-emitter API köré.
export async function sendTextQuery(opts: QueryOptions): Promise<QueryResult> {
  const { text, lang = 'en-US', timeoutMs = 15000 } = opts;
  const cfg = await loadConfig();
  if (!cfg) {
    throw new Error('Google config missing — futtasd: ma google auth');
  }
  if (!cfg.runtime?.device_id || !cfg.runtime?.device_model_id) {
    throw new Error('Google device IDs missing — futtasd: ma google auth (regisztrál egy device-ot)');
  }
  const tokensPath = defaultTokensPath();
  if (!existsSync(tokensPath)) {
    throw new Error('Google tokens missing (config/google-tokens.json) — futtasd: ma google auth');
  }

  const authConfig = {
    keyFilePath: defaultConfigPath(),
    savedTokensPath: tokensPath,
  };

  return new Promise<QueryResult>((resolve, reject) => {
    const collected: QueryResult = { transcripts: [] };
    let settled = false;

    const safety = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Google Assistant query timeout (${timeoutMs}ms)`));
    }, timeoutMs);

    const settle = (err?: Error): void => {
      if (settled) return;
      settled = true;
      clearTimeout(safety);
      if (err) reject(err);
      else resolve(collected);
    };

    // GoogleAssistant API: callback-style construction; emits 'ready' or 'error'.
    const assistant = new GoogleAssistant(authConfig);

    assistant.on('error', (err: Error) => settle(err));

    assistant.on('ready', () => {
      assistant.start(
        {
          textQuery: text,
          lang,
          deviceId: cfg.runtime!.device_id,
          deviceModelId: cfg.runtime!.device_model_id,
          isNew: true,
          screen: { isOn: true }, // get text response back
        },
        (conversation: unknown) => {
          if (conversation instanceof Error) {
            settle(conversation);
            return;
          }
          const conv = conversation as {
            on(event: string, cb: (data: unknown) => void): unknown;
            end(): void;
          };

          conv.on('response', (responseText: unknown) => {
            if (typeof responseText === 'string') {
              collected.responseText = responseText;
            }
          });

          conv.on('transcription', (data: unknown) => {
            if (data && typeof data === 'object' && 'transcription' in data) {
              const t = (data as { transcription: unknown }).transcription;
              if (typeof t === 'string') collected.transcripts.push(t);
            }
          });

          // 'ended' callback signature is (error, continueConversation) — wrap to match (data: unknown).
          conv.on('ended', ((..._args: unknown[]) => {
            safeCall(() => conv.end(), 'google.conv.end');
            settle();
          }) as unknown as (data: unknown) => void);

          conv.on('error', (err: unknown) => {
            settle(err instanceof Error ? err : new Error(String(err)));
          });
        },
      );
    });
  });
}
