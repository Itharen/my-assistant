import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { logAction, LogActionResult } from '../action-log/action-log.client.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';
import {
  FoCliRunner,
  OrganizerStockMirror,
  OrganizerStockMirrorService,
  resolveProjectRoot,
  resolveStockMirrorOutput,
  StockMirrorError,
  writeMirrorAtomically,
} from '../stocks/organizer-stock-mirror.service.js';

export interface StocksMirrorCommandDependencies {
  service?: OrganizerStockMirrorService;
  projectRoot?: string;
  log?: (entry: Parameters<typeof logAction>[0]) => Promise<LogActionResult>;
}

export async function runStocksMirrorCommand(
  args: string[],
  dependencies: StocksMirrorCommandDependencies = {},
): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args: args,
    options: {
      output: { type: 'string' },
      limit: { type: 'string', default: '100' },
      timeout: { type: 'string', default: '30000' },
      'dry-run': { type: 'boolean', default: false },
      pretty: { type: 'boolean', default: false },
    },
    strict: true,
  });
  const outputOption: unknown = parsed.values.output;
  const limit: number = parseIntegerOption(parsed.values.limit, '--limit', 1, 1_000);
  const timeoutMs: number = parseIntegerOption(parsed.values.timeout, '--timeout', 1, 300_000);
  const dryRun: boolean = parsed.values['dry-run'] === true;
  const pretty: boolean = parsed.values.pretty === true;
  const moduleDirectory: string = dirname(fileURLToPath(import.meta.url));
  const projectRoot: string = dependencies.projectRoot ?? resolveProjectRoot(moduleDirectory);
  const outputPath: string = resolveStockMirrorOutput(
    projectRoot,
    typeof outputOption === 'string' && outputOption.length > 0 ? outputOption : undefined,
  );
  const service: OrganizerStockMirrorService = dependencies.service
    ?? new OrganizerStockMirrorService(new FoCliRunner(undefined, timeoutMs), { limit: limit });
  const mirror: OrganizerStockMirror = await service.buildMirror();

  if (!dryRun) {
    await writeMirrorAtomically(outputPath, mirror);
  }

  const logResult: LogActionResult = await (dependencies.log ?? logAction)({
    actor: 'stock-mirror',
    kind: 'state-change',
    summary: dryRun
      ? `Organizer stock mirror dry-run — ${mirror.counts.stocks} stock, ${mirror.counts.stockItems} item`
      : `Organizer stock mirror replaced — ${mirror.counts.stocks} stock, ${mirror.counts.stockItems} item`,
    ref: outputPath,
    extra: {
      requestId: requestId,
      dryRun: dryRun,
      counts: mirror.counts,
    },
  });
  if (!logResult.ok) {
    throw new StockMirrorError(logResult.error.code, logResult.error.message, {
      logError: logResult.error,
      mirrorWritten: !dryRun,
      outputPath: outputPath,
    });
  }

  writeEnvelope(ok('stocks.mirror', requestId, startedAt, {
    written: !dryRun,
    outputPath: outputPath,
    schemaVersion: mirror.schemaVersion,
    generatedAt: mirror.generatedAt,
    counts: mirror.counts,
  }), pretty);
}

function parseIntegerOption(raw: unknown, flag: string, minimum: number, maximum: number): number {
  const value: number = typeof raw === 'string' ? Number(raw) : Number.NaN;
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new StockMirrorError(
      'MA-STOCK-MIRROR-OPTION',
      `${flag} must be an integer between ${minimum} and ${maximum}.`,
      { flag: flag, value: raw },
    );
  }
  return value;
}
