import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

import { type LinkedInConfig } from './linkedin.models.js';
import { LinkedInToolError, redactLinkedInSensitiveText } from './linkedin.error.js';

const execFileAsync = promisify(execFile);

export interface LinkedInSecretProvider {
  getAccessToken(config: LinkedInConfig): Promise<string>;
}

export interface FdpCommandRunner {
  run(args: string[]): Promise<string>;
}

export class EnvironmentVariableSecretProvider implements LinkedInSecretProvider {
  private readonly environment: NodeJS.ProcessEnv;

  public constructor(environment: NodeJS.ProcessEnv = process.env) {
    this.environment = environment;
  }

  public async getAccessToken(config: LinkedInConfig): Promise<string> {
    const accessToken: string | undefined = this.environment[config.accessTokenKey]?.trim();
    if (!accessToken) {
      throw new LinkedInToolError(
        'MA-LINKEDIN-TOKEN-MISSING',
        'The configured LinkedIn access-token environment variable is absent or empty.',
        { accessTokenKey: config.accessTokenKey },
      );
    }
    return accessToken;
  }
}

export class FdpCliCommandRunner implements FdpCommandRunner {
  private readonly command: string;
  private readonly prefixArgs: string[];
  private readonly timeoutMs: number;

  public constructor(
    command: string = defaultFdpCommand(),
    prefixArgs: string[] = defaultFdpPrefixArgs(),
    timeoutMs: number = 30_000,
  ) {
    this.command = command;
    this.prefixArgs = prefixArgs;
    this.timeoutMs = timeoutMs;
  }

  public async run(args: string[]): Promise<string> {
    try {
      const result = await execFileAsync(this.command, [...this.prefixArgs, ...args], {
        encoding: 'utf8',
        maxBuffer: 4 * 1024 * 1024,
        timeout: this.timeoutMs,
        windowsHide: true,
      });
      return result.stdout;
    } catch (error: unknown) {
      const normalized: Error = error instanceof Error ? error : new Error(String(error));
      const processError: Error & { code?: string | number } = normalized;
      throw new LinkedInToolError('MA-LINKEDIN-KEYSTORE', 'FDP Keystore lookup failed.', {
        processCode: processError.code,
        reason: redactLinkedInSensitiveText(normalized.message),
      });
    }
  }
}

export class FdpKeystoreSecretProvider implements LinkedInSecretProvider {
  private readonly runner: FdpCommandRunner;

  public constructor(runner: FdpCommandRunner = new FdpCliCommandRunner()) {
    this.runner = runner;
  }

  public async getAccessToken(config: LinkedInConfig): Promise<string> {
    if (config.fdpProject === null || config.fdpBranch === null || config.fdpEnvironment === null) {
      throw new LinkedInToolError(
        'MA-LINKEDIN-KEYSTORE-CONFIG',
        'FDP Keystore credential source requires project, branch and environment configuration.',
      );
    }
    const raw: string = await this.runner.run([
      'env:pull',
      '--project',
      config.fdpProject,
      '--branch',
      config.fdpBranch,
      '--environment',
      config.fdpEnvironment,
      '--stdout',
      '--format',
      'dotenv',
    ]);
    const values: Map<string, string> = parseDotEnv(raw);
    const accessToken: string | undefined = values.get(config.accessTokenKey);
    if (!accessToken) {
      throw new LinkedInToolError(
        'MA-LINKEDIN-TOKEN-MISSING',
        'The configured LinkedIn access-token key is absent or empty in FDP Keystore.',
        { accessTokenKey: config.accessTokenKey },
      );
    }
    return accessToken;
  }
}

function defaultFdpCommand(): string {
  return process.platform === 'win32' ? process.execPath : 'fdp';
}

function defaultFdpPrefixArgs(): string[] {
  if (process.platform !== 'win32') {
    return [];
  }
  return [resolve(dirname(process.execPath), 'node_modules', '@futdevpro', 'fdp-cli', 'build', 'program.js')];
}

function parseDotEnv(raw: string): Map<string, string> {
  const result: Map<string, string> = new Map<string, string>();
  for (const line of raw.split(/\r?\n/u)) {
    const trimmed: string = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }
    const normalized: string = trimmed.startsWith('export ') ? trimmed.slice('export '.length) : trimmed;
    const separator: number = normalized.indexOf('=');
    if (separator <= 0) {
      continue;
    }
    const key: string = normalized.slice(0, separator).trim();
    const rawValue: string = normalized.slice(separator + 1).trim();
    result.set(key, unquoteDotEnvValue(rawValue));
  }
  return result;
}

function unquoteDotEnvValue(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\n/gu, '\n').replace(/\\"/gu, '"').replace(/\\\\/gu, '\\');
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
}
