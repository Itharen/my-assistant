import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, open, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface OrganizerStockMirror {
  schemaVersion: '1.0.0';
  source: 'organizer';
  generatedAt: string;
  stocks: OrganizerStockMirrorEntry[];
  counts: {
    stocks: number;
    stockItems: number;
    pages: number;
  };
}

export interface OrganizerStockMirrorEntry {
  stock: Record<string, unknown>;
  items: Record<string, unknown>[];
}

interface FoListResult {
  items: Record<string, unknown>[];
  nextCursor: string | null;
}

export interface FoRunner {
  run(args: string[]): Promise<string>;
}

export interface OrganizerStockMirrorOptions {
  limit: number;
  now?: () => Date;
}

export class StockMirrorError extends Error {
  public readonly code: string;
  public readonly details: Record<string, unknown>;

  public constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'StockMirrorError';
    this.code = code;
    this.details = details;
  }
}

export class FoCliRunner implements FoRunner {
  private readonly command: string;
  private readonly prefixArgs: string[];
  private readonly timeoutMs: number;

  public constructor(
    command: string = defaultFoCommand(),
    timeoutMs: number = 30_000,
    prefixArgs: string[] = defaultFoPrefixArgs(),
  ) {
    this.command = command;
    this.timeoutMs = timeoutMs;
    this.prefixArgs = prefixArgs;
  }

  public async run(args: string[]): Promise<string> {
    const effectiveArgs: string[] = [...this.prefixArgs, ...args];
    try {
      const result = await execFileAsync(this.command, effectiveArgs, {
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        timeout: this.timeoutMs,
        windowsHide: true,
      });
      return result.stdout;
    } catch (error: unknown) {
      const normalized: Error = error instanceof Error ? error : new Error(String(error));
      const processError: Error & { stdout?: string; stderr?: string; code?: string | number } = normalized;
      throw new StockMirrorError('MA-STOCK-MIRROR-FO-EXEC', `fo invocation failed: ${normalized.message}`, {
        command: this.command,
        args: effectiveArgs,
        processCode: processError.code,
        stdout: processError.stdout,
        stderr: processError.stderr,
        stack: normalized.stack,
      });
    }
  }
}

function defaultFoCommand(): string {
  return process.platform === 'win32' ? process.execPath : 'fo';
}

function defaultFoPrefixArgs(): string[] {
  if (process.platform !== 'win32') {
    return [];
  }
  return [resolve(dirname(process.execPath), 'node_modules', '@futdevpro', 'organizer-cli', 'bin', 'fo.js')];
}

export class OrganizerStockMirrorService {
  private readonly runner: FoRunner;
  private readonly limit: number;
  private readonly now: () => Date;
  private pageCount: number = 0;

  public constructor(runner: FoRunner, options: OrganizerStockMirrorOptions) {
    if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 1_000) {
      throw new StockMirrorError('MA-STOCK-MIRROR-LIMIT', 'Mirror page limit must be an integer between 1 and 1000.', {
        limit: options.limit,
      });
    }
    this.runner = runner;
    this.limit = options.limit;
    this.now = options.now ?? (() => new Date());
  }

  public async buildMirror(): Promise<OrganizerStockMirror> {
    this.pageCount = 0;
    const stocks: Record<string, unknown>[] = await this.listAll('stocks.list', []);
    const entries: OrganizerStockMirrorEntry[] = [];
    let stockItemCount: number = 0;

    for (const stock of stocks) {
      const stockRef: unknown = stock.ref;
      if (typeof stockRef !== 'string' || stockRef.length === 0) {
        throw new StockMirrorError('MA-STOCK-MIRROR-STOCK-REF', 'Organizer stock is missing a stable string ref.', {
          stock: stock,
        });
      }
      const items: Record<string, unknown>[] = await this.listAll('stock-items.list', ['--stock-ref', stockRef]);
      stockItemCount += items.length;
      entries.push({ stock: stock, items: items });
    }

    return {
      schemaVersion: '1.0.0',
      source: 'organizer',
      generatedAt: this.now().toISOString(),
      stocks: entries,
      counts: {
        stocks: stocks.length,
        stockItems: stockItemCount,
        pages: this.pageCount,
      },
    };
  }

  private async listAll(action: string, baseArgs: string[]): Promise<Record<string, unknown>[]> {
    const allItems: Record<string, unknown>[] = [];
    const seenCursors: Set<string> = new Set<string>();
    let cursor: string | null = null;

    do {
      const args: string[] = [action, ...baseArgs, '--limit', String(this.limit)];
      if (cursor !== null) {
        args.push('--cursor', cursor);
      }
      const raw: string = await this.runner.run(args);
      const page: FoListResult = parseFoListEnvelope(raw, action);
      this.pageCount += 1;
      allItems.push(...page.items);

      if (page.nextCursor !== null) {
        if (seenCursors.has(page.nextCursor)) {
          throw new StockMirrorError('MA-STOCK-MIRROR-CURSOR-LOOP', 'Organizer pagination cursor repeated.', {
            action: action,
            cursor: page.nextCursor,
            pageCount: this.pageCount,
          });
        }
        seenCursors.add(page.nextCursor);
      }
      cursor = page.nextCursor;
    } while (cursor !== null);

    return allItems;
  }
}

export async function writeMirrorAtomically(outputPath: string, mirror: OrganizerStockMirror): Promise<void> {
  const outputDirectory: string = dirname(outputPath);
  const temporaryPath: string = join(outputDirectory, `.organizer-stock-mirror.${process.pid}.${randomUUID()}.tmp`);
  await mkdir(outputDirectory, { recursive: true });

  try {
    const handle = await open(temporaryPath, 'wx');
    try {
      await handle.writeFile(`${JSON.stringify(mirror, null, 2)}\n`, { encoding: 'utf8' });
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporaryPath, outputPath);
  } catch (error: unknown) {
    await rm(temporaryPath, { force: true });
    const normalized: Error = error instanceof Error ? error : new Error(String(error));
    throw new StockMirrorError('MA-STOCK-MIRROR-WRITE', `Cannot replace Organizer stock mirror: ${normalized.message}`, {
      outputPath: outputPath,
      temporaryPath: temporaryPath,
      stack: normalized.stack,
    });
  }
}

export function resolveStockMirrorOutput(projectRoot: string, requestedPath?: string): string {
  return requestedPath
    ? resolve(projectRoot, requestedPath)
    : resolve(projectRoot, 'current', 'stock', 'organizer-mirror.json');
}

export function resolveProjectRoot(startDirectory: string): string {
  let directory: string = startDirectory;
  for (let depth: number = 0; depth < 8; depth += 1) {
    if (existsSync(join(directory, '__agent')) && existsSync(join(directory, 'package.json'))) {
      return directory;
    }
    const parent: string = dirname(directory);
    if (parent === directory) {
      break;
    }
    directory = parent;
  }
  throw new StockMirrorError('MA-STOCK-MIRROR-PROJECT-ROOT', 'Cannot locate the my-assistant project root.', {
    startDirectory: startDirectory,
  });
}

function parseFoListEnvelope(raw: string, expectedAction: string): FoListResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error: unknown) {
    const normalized: Error = error instanceof Error ? error : new Error(String(error));
    throw new StockMirrorError('MA-STOCK-MIRROR-FO-JSON', 'fo returned invalid JSON.', {
      expectedAction: expectedAction,
      rawPreview: raw.slice(0, 500),
      parserMessage: normalized.message,
    });
  }
  if (!isRecord(parsed)) {
    throw new StockMirrorError('MA-STOCK-MIRROR-FO-ENVELOPE', 'fo response is not an object.', {
      expectedAction: expectedAction,
    });
  }
  const okValue: unknown = parsed.ok;
  const actionValue: unknown = parsed.action;
  const errorValue: unknown = parsed.error;
  if (typeof okValue !== 'boolean') {
    throw new StockMirrorError('MA-STOCK-MIRROR-FO-ENVELOPE', 'fo response is missing boolean ok.', {
      expectedAction: expectedAction,
    });
  }
  if (!okValue) {
    const errorRecord: Record<string, unknown> | undefined = isRecord(errorValue) ? errorValue : undefined;
    throw new StockMirrorError(
      'MA-STOCK-MIRROR-FO-ERROR',
      typeof errorRecord?.message === 'string'
        ? errorRecord.message
        : `fo ${expectedAction} failed without an error message.`,
      {
        expectedAction: expectedAction,
        foAction: actionValue,
        foError: errorRecord,
      },
    );
  }
  const resultValue: unknown = parsed.result;
  if (actionValue !== expectedAction || !isRecord(resultValue)) {
    throw new StockMirrorError('MA-STOCK-MIRROR-FO-ENVELOPE', 'fo response action/result contract mismatch.', {
      expectedAction: expectedAction,
      actualAction: actionValue,
    });
  }
  const items: unknown = resultValue.items;
  const nextCursor: unknown = resultValue.nextCursor;
  if (!Array.isArray(items) || !items.every((item: unknown) => isRecord(item))) {
    throw new StockMirrorError('MA-STOCK-MIRROR-FO-ITEMS', 'fo list result.items must be an array of objects.', {
      expectedAction: expectedAction,
    });
  }
  if (nextCursor !== null && nextCursor !== undefined && typeof nextCursor !== 'string') {
    throw new StockMirrorError('MA-STOCK-MIRROR-FO-CURSOR', 'fo nextCursor must be a string or null.', {
      expectedAction: expectedAction,
      nextCursor: nextCursor,
    });
  }
  return {
    items: items,
    nextCursor: typeof nextCursor === 'string' && nextCursor.length > 0 ? nextCursor : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
