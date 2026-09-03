import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter, dirname, isAbsolute, join } from 'node:path';
import { promisify } from 'node:util';

import { InterfoodToolError } from './interfood.error.js';

const execFileAsync = promisify(execFile);
export const INTERFOOD_UBH_NAMESPACE: string = 'my-assistant-interfood-dedicated-v1';

export type InterfoodAccountOperation =
  | 'user.get'
  | 'orders.list'
  | 'orders.week'
  | 'order.details'
  | 'order.cancellable'
  | 'order.overlap'
  | 'cart.get'
  | 'cart.add'
  | 'cart.subtract'
  | 'cart.remove'
  | 'cart.clear'
  | 'order.change-preview'
  | 'order.change-apply';

export type InterfoodAccountTier = 'read-only' | 'reversible-mutation' | 'irreversible-financial';

interface UbhEnvelope {
  ok?: unknown;
  result?: unknown;
  error?: unknown;
}

export interface InterfoodAuthenticatedClientOptions {
  ubhBinary?: string;
  namespace?: string;
  execute?: (binary: string, args: string[]) => Promise<string>;
}

export interface InterfoodAccountResponse {
  operation: InterfoodAccountOperation;
  status: number;
  data: unknown;
}

export class InterfoodAuthenticatedClient {
  private readonly ubhBinary: string;
  private readonly namespace: string;
  private readonly execute: (binary: string, args: string[]) => Promise<string>;

  public constructor(options: InterfoodAuthenticatedClientOptions = {}) {
    this.ubhBinary = options.ubhBinary ?? process.env.UBH_BIN ?? (process.platform === 'win32' ? 'ubh.cmd' : 'ubh');
    this.namespace = options.namespace ?? INTERFOOD_UBH_NAMESPACE;
    this.execute = options.execute ?? executeUbh;
  }

  public async sessionStatus(): Promise<unknown> {
    return this.command(['session', 'status', '--namespace', this.namespace]);
  }

  public async startSession(): Promise<unknown> {
    return this.command([
      'session',
      'start',
      '--namespace',
      this.namespace,
      '--mode',
      'dedicated',
      '--url',
      'https://rendel.interfood.hu/',
    ]);
  }

  public async request(
    operation: InterfoodAccountOperation,
    input: Record<string, unknown> = {},
    tier: InterfoodAccountTier = 'read-only',
    options: { approvalToken?: string; runId?: string } = {},
  ): Promise<InterfoodAccountResponse> {
    const requestId: string = randomUUID();
    const runId: string = options.runId ?? randomUUID();
    const runRequest: Record<string, unknown> = {
      contractVersion: '1.0.0',
      requestId,
      runId,
      consumer: 'my-assistant',
      namespace: this.namespace,
      workflowId: `my-assistant.interfood.${operation}`,
      capability: 'interfood.account',
      actionTier: tier,
      targetUrl: 'https://rendel.interfood.hu/',
      input: { operation, ...input },
      ...(options.approvalToken === undefined ? {} : { approvalToken: options.approvalToken }),
      origin: { sessionId: requestId, agent: 'ma-interfood', consumer: 'my-assistant' },
    };
    const value: unknown = await this.command(['run', '--json', JSON.stringify(runRequest)]);
    const response: Record<string, unknown> = record(value, 'UBH Interfood response');
    const returnedOperation: string = String(response.operation ?? '');
    if (returnedOperation !== operation) {
      throw new InterfoodToolError('MA-INTERFOOD-UBH-CONTRACT', 'UBH returned an unexpected Interfood operation.', {
        expectedOperation: operation,
        returnedOperation,
      });
    }
    const status: number = Number(response.status);
    if (!Number.isInteger(status) || status < 200 || status > 299) {
      throw new InterfoodToolError('MA-INTERFOOD-UBH-CONTRACT', 'UBH returned an invalid HTTP status.', {
        operation,
        status: response.status,
      });
    }
    return { operation, status, data: response.data };
  }

  public async issueApproval(
    runId: string,
    orderId: number,
    previewHash: string,
    confirmedBy: string,
  ): Promise<string> {
    const scope = {
      runId,
      effectId: `interfood-order-change:${orderId}`,
      namespace: this.namespace,
      domain: 'rendel.interfood.hu',
      tier: 'irreversible-financial',
      previewHash,
    };
    const value: unknown = await this.command([
      'approval', 'issue', '--scope', JSON.stringify(scope), '--confirmed-by', confirmedBy,
    ]);
    const object: Record<string, unknown> = record(value, 'UBH approval response');
    const token: string = String(object.token ?? '');
    if (!token) throw new InterfoodToolError('MA-INTERFOOD-APPROVAL', 'UBH did not return an approval token.');
    return token;
  }

  private async command(args: string[]): Promise<unknown> {
    let raw: string;
    try {
      raw = await this.execute(this.ubhBinary, args);
    } catch (error: unknown) {
      throw new InterfoodToolError('MA-INTERFOOD-UBH-EXEC', 'UBH command failed.', {
        binary: this.ubhBinary,
        command: args[0],
        cause: error instanceof Error ? error.message : String(error),
      });
    }
    let parsed: UbhEnvelope;
    try {
      parsed = JSON.parse(lastJsonObject(raw)) as UbhEnvelope;
    } catch (error: unknown) {
      throw new InterfoodToolError('MA-INTERFOOD-UBH-JSON', 'UBH returned invalid JSON.', {
        cause: error instanceof Error ? error.message : String(error),
        outputPreview: raw.slice(0, 2_000),
      });
    }
    if (parsed.ok !== true) {
      throw new InterfoodToolError('MA-INTERFOOD-UBH', 'UBH rejected the Interfood operation.', {
        error: parsed.error,
      });
    }
    return parsed.result;
  }
}

export function hashInterfoodPreview(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

async function executeUbh(binary: string, args: string[]): Promise<string> {
  const windowsEntry: string | undefined = process.platform === 'win32' ? resolveWindowsUbhEntry(binary) : undefined;
  const executable: string = windowsEntry === undefined ? binary : process.execPath;
  const executableArgs: string[] = windowsEntry === undefined
    ? args
    : [windowsEntry, ...args];
  try {
    const result = await execFileAsync(executable, executableArgs, {
      encoding: 'utf8',
      timeout: 60_000,
      windowsHide: true,
      maxBuffer: 20 * 1024 * 1024,
    });
    return result.stdout;
  } catch (error: unknown) {
    const stdout: unknown = (error as { stdout?: unknown }).stdout;
    if (typeof stdout === 'string' && stdout.trim().startsWith('{')) return stdout;
    throw error;
  }
}

function resolveWindowsUbhEntry(binary: string): string | undefined {
  let script: string | undefined;
  if (binary.toLocaleLowerCase().endsWith('.ps1') && existsSync(binary)) script = binary;
  if (isAbsolute(binary)) {
    const sibling: string = binary.replace(/\.cmd$/i, '.ps1');
    if (existsSync(sibling)) script = sibling;
  }
  if (script === undefined) {
    const target: string = binary.replace(/\.cmd$/i, '').replace(/\.ps1$/i, '');
    for (const directory of (process.env.PATH ?? '').split(delimiter).filter(Boolean)) {
      const candidate: string = join(directory, `${target}.ps1`);
      if (existsSync(candidate)) {
        script = candidate;
        break;
      }
    }
  }
  if (script === undefined) return undefined;
  const entry: string = join(dirname(script), 'node_modules', '@futdevpro', 'unblockable-browser-handler-tool', 'build', 'src', 'index.js');
  return existsSync(entry) ? entry : undefined;
}

function lastJsonObject(raw: string): string {
  const trimmed: string = raw.trim();
  if (trimmed.startsWith('{')) return trimmed;
  const line: string | undefined = trimmed.split(/\r?\n/).reverse().find((candidate: string) => candidate.trim().startsWith('{'));
  return line ?? trimmed;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new InterfoodToolError('MA-INTERFOOD-UBH-CONTRACT', `${label} must be an object.`, { value });
  }
  return value as Record<string, unknown>;
}
