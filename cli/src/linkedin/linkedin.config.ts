import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { mkdir, open, readFile, rename, rm, stat } from 'node:fs/promises';

import { LinkedInToolError } from './linkedin.error.js';
import {
  LINKEDIN_CONFIG_SCHEMA_VERSION,
  type LinkedInConfig,
} from './linkedin.models.js';

export interface LinkedInPaths {
  root: string;
  config: string;
  cache: string;
}

export function resolveLinkedInPaths(userHome: string = homedir()): LinkedInPaths {
  const root: string = join(userHome, '.config', 'my-assistant', 'linkedin');
  return {
    root: root,
    config: join(root, 'config.json'),
    cache: join(root, 'cache.json'),
  };
}

export async function saveLinkedInConfig(path: string, config: LinkedInConfig): Promise<void> {
  validateLinkedInConfig(config);
  await writeJsonAtomically(path, config);
}

export async function loadLinkedInConfig(path: string): Promise<LinkedInConfig> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (error: unknown) {
    const normalized: NodeJS.ErrnoException = normalizeNodeError(error);
    if (normalized.code === 'ENOENT') {
      throw new LinkedInToolError(
        'MA-LINKEDIN-NOT-CONFIGURED',
        'LinkedIn is not configured. Run `ma linkedin configure --help`.',
        { configPath: path },
      );
    }
    throw new LinkedInToolError('MA-LINKEDIN-CONFIG-READ', `Cannot read LinkedIn config: ${normalized.message}`, {
      configPath: path,
      errorCode: normalized.code,
    });
  }
  const parsed: unknown = parseJson(raw, 'MA-LINKEDIN-CONFIG-JSON', path);
  if (!isRecord(parsed)) {
    throw new LinkedInToolError('MA-LINKEDIN-CONFIG-SCHEMA', 'LinkedIn config must be a JSON object.', {
      configPath: path,
    });
  }
  const config: LinkedInConfig = parseLinkedInConfig(parsed, path);
  validateLinkedInConfig(config);
  return config;
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error: unknown) {
    const normalized: NodeJS.ErrnoException = normalizeNodeError(error);
    if (normalized.code === 'ENOENT') {
      return false;
    }
    throw new LinkedInToolError('MA-LINKEDIN-PATH-STAT', `Cannot inspect LinkedIn path: ${normalized.message}`, {
      path: path,
      errorCode: normalized.code,
    });
  }
}

export async function writeJsonAtomically(path: string, value: unknown): Promise<void> {
  const directory: string = dirname(path);
  const temporaryPath: string = join(directory, `.linkedin.${process.pid}.${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  try {
    const handle = await open(temporaryPath, 'wx', 0o600);
    try {
      await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8' });
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporaryPath, path);
  } catch (error: unknown) {
    await rm(temporaryPath, { force: true });
    const normalized: Error = error instanceof Error ? error : new Error(String(error));
    throw new LinkedInToolError('MA-LINKEDIN-ATOMIC-WRITE', `Cannot replace LinkedIn state: ${normalized.message}`, {
      path: path,
      temporaryPath: temporaryPath,
    });
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new LinkedInToolError('MA-LINKEDIN-SCHEMA', `${field} must be a non-empty string.`, {
      field: field,
    });
  }
  return value.trim();
}

function parseLinkedInConfig(record: Record<string, unknown>, path: string): LinkedInConfig {
  const identifiersValue: unknown = record.selfIdentifiers;
  if (!Array.isArray(identifiersValue) || !identifiersValue.every((value: unknown) => typeof value === 'string')) {
    throw new LinkedInToolError('MA-LINKEDIN-CONFIG-SCHEMA', 'selfIdentifiers must be an array of strings.', {
      configPath: path,
    });
  }
  if (record.schemaVersion !== LINKEDIN_CONFIG_SCHEMA_VERSION) {
    throw new LinkedInToolError('MA-LINKEDIN-CONFIG-VERSION', 'Unsupported LinkedIn config schema.', {
      configPath: path,
      actualVersion: record.schemaVersion,
      supportedVersion: LINKEDIN_CONFIG_SCHEMA_VERSION,
    });
  }
  return {
    schemaVersion: LINKEDIN_CONFIG_SCHEMA_VERSION,
    credentialSource: requireCredentialSource(record.credentialSource),
    accessTokenKey: requireNonEmptyString(record.accessTokenKey, 'accessTokenKey'),
    fdpProject: requireNullableString(record.fdpProject, 'fdpProject'),
    fdpBranch: requireNullableString(record.fdpBranch, 'fdpBranch'),
    fdpEnvironment: requireNullableFdpEnvironment(record.fdpEnvironment),
    selfIdentifiers: identifiersValue.map((value: unknown) => requireNonEmptyString(value, 'selfIdentifiers[]')),
  };
}

function validateLinkedInConfig(config: LinkedInConfig): void {
  if (config.schemaVersion !== LINKEDIN_CONFIG_SCHEMA_VERSION) {
    throw new LinkedInToolError(
      'MA-LINKEDIN-CONFIG-VERSION',
      `Unsupported LinkedIn config schema: ${config.schemaVersion}.`,
      { supportedVersion: LINKEDIN_CONFIG_SCHEMA_VERSION },
    );
  }
  requireCredentialSource(config.credentialSource);
  requireNonEmptyString(config.accessTokenKey, 'accessTokenKey');
  if (config.credentialSource === 'fdp-keystore') {
    requireNonEmptyString(config.fdpProject, 'fdpProject');
    requireNonEmptyString(config.fdpBranch, 'fdpBranch');
    requireFdpEnvironment(config.fdpEnvironment);
  }
}

function requireCredentialSource(value: unknown): 'environment' | 'fdp-keystore' {
  if (value !== 'environment' && value !== 'fdp-keystore') {
    throw new LinkedInToolError(
      'MA-LINKEDIN-CONFIG-CREDENTIAL-SOURCE',
      'credentialSource must be environment or fdp-keystore.',
      { credentialSource: value },
    );
  }
  return value;
}

function requireNullableString(value: unknown, field: string): string | null {
  return value === null ? null : requireNonEmptyString(value, field);
}

function requireNullableFdpEnvironment(value: unknown): 'test' | 'prod' | null {
  return value === null ? null : requireFdpEnvironment(value);
}

function requireFdpEnvironment(value: unknown): 'test' | 'prod' {
  if (value !== 'test' && value !== 'prod') {
    throw new LinkedInToolError('MA-LINKEDIN-CONFIG-ENVIRONMENT', 'fdpEnvironment must be test or prod.', {
      fdpEnvironment: value,
    });
  }
  return value;
}

function parseJson(raw: string, code: string, path: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error: unknown) {
    const normalized: Error = error instanceof Error ? error : new Error(String(error));
    throw new LinkedInToolError(code, `Invalid JSON in LinkedIn state: ${normalized.message}`, { path: path });
  }
}

function normalizeNodeError(error: unknown): NodeJS.ErrnoException {
  return error instanceof Error ? error : new Error(String(error));
}
