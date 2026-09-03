import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { logAction } from '../action-log/action-log.client.js';
import { runStocksMirrorCommand } from '../commands/stocks-mirror.command.js';
import {
  FoRunner,
  OrganizerStockMirror,
  OrganizerStockMirrorService,
  StockMirrorError,
  writeMirrorAtomically,
} from './organizer-stock-mirror.service.js';

class SequenceFoRunner implements FoRunner {
  private readonly responses: string[];

  public constructor(responses: string[]) {
    this.responses = [...responses];
  }

  public async run(_args: string[]): Promise<string> {
    const response: string | undefined = this.responses.shift();
    if (response === undefined) {
      throw new Error('Fixture response sequence exhausted.');
    }
    return response;
  }
}

describe('stocks mirror critical user journey', () => {
  let root: string;
  let originalLogRoot: string | undefined;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'ma-stock-mirror-journey-'));
    originalLogRoot = process.env.MA_LOG_ROOT;
    process.env.MA_LOG_ROOT = join(root, 'logs');
    spyOn(process.stdout, 'write').and.returnValue(true);
  });

  afterEach(async () => {
    if (originalLogRoot === undefined) {
      delete process.env.MA_LOG_ROOT;
    } else {
      process.env.MA_LOG_ROOT = originalLogRoot;
    }
    await rm(root, { recursive: true, force: true });
  });

  it('reads paginated state, persists it, then carries the same mirror forward on refresh', async () => {
    const outputPath: string = join(root, 'organizer-mirror.json');
    const firstService = serviceFor([
      page('stocks.list', [{ ref: 'org:stock:home', title: 'Home' }], null),
      page('stock-items.list', [{ ref: 'org:stockItem:water', title: 'Water', quantity: 1 }], 'next'),
      page('stock-items.list', [{ ref: 'org:stockItem:coffee', title: 'Coffee', quantity: 2 }], null),
    ], '2026-08-23T12:00:00.000Z');
    await runStocksMirrorCommand(['--output', outputPath], {
      service: firstService,
      projectRoot: root,
      log: logAction,
    });
    const first: OrganizerStockMirror = JSON.parse(await readFile(outputPath, 'utf8'));
    expect(first.counts).toEqual({ stocks: 1, stockItems: 2, pages: 3 });
    expect(first.stocks[0]?.items[1]?.title).toBe('Coffee');

    const refreshedService = serviceFor([
      page('stocks.list', [{ ref: 'org:stock:home', title: 'Home' }], null),
      page('stock-items.list', [
        { ref: 'org:stockItem:water', title: 'Water', quantity: 5 },
        { ref: 'org:stockItem:coffee', title: 'Coffee', quantity: 2 },
      ], null),
    ], '2026-08-23T13:00:00.000Z');
    await runStocksMirrorCommand(['--output', outputPath], {
      service: refreshedService,
      projectRoot: root,
      log: logAction,
    });
    const refreshed: OrganizerStockMirror = JSON.parse(await readFile(outputPath, 'utf8'));
    expect(refreshed.generatedAt).toBe('2026-08-23T13:00:00.000Z');
    expect(refreshed.stocks[0]?.items[0]?.quantity).toBe(5);

    const logFiles: string[] = await readdir(join(root, 'logs'));
    const actionLog: string = await readFile(join(root, 'logs', logFiles[0] ?? ''), 'utf8');
    expect(actionLog.match(/Organizer stock mirror replaced/g)?.length).toBe(2);
  });

  it('validates every page in dry-run mode without creating the snapshot', async () => {
    const outputPath: string = join(root, 'organizer-mirror.json');
    const service = serviceFor([
      page('stocks.list', [{ ref: 'org:stock:home', title: 'Home' }], null),
      page('stock-items.list', [{ ref: 'org:stockItem:water', title: 'Water', quantity: 1 }], null),
    ], '2026-08-23T14:00:00.000Z');

    await runStocksMirrorCommand(['--output', outputPath, '--dry-run'], {
      service: service,
      projectRoot: root,
      log: logAction,
    });

    await expectAsync(readFile(outputPath, 'utf8')).toBeRejected();
    const logFiles: string[] = await readdir(join(root, 'logs'));
    const actionLog: string = await readFile(join(root, 'logs', logFiles[0] ?? ''), 'utf8');
    expect(actionLog).toContain('Organizer stock mirror dry-run');
  });

  it('keeps the previous complete snapshot when pagination is interrupted', async () => {
    const outputPath: string = join(root, 'organizer-mirror.json');
    const previous: OrganizerStockMirror = {
      schemaVersion: '1.0.0',
      source: 'organizer',
      generatedAt: '2026-08-23T14:00:00.000Z',
      stocks: [],
      counts: { stocks: 0, stockItems: 0, pages: 1 },
    };
    await writeMirrorAtomically(outputPath, previous);
    const interrupted = serviceFor([
      page('stocks.list', [], 'repeated'),
      page('stocks.list', [], 'repeated'),
    ], '2026-08-23T15:00:00.000Z');

    await expectAsync(runStocksMirrorCommand(['--output', outputPath], {
      service: interrupted,
      projectRoot: root,
      log: logAction,
    })).toBeRejectedWithError(StockMirrorError, /cursor repeated/i);

    const persisted: OrganizerStockMirror = JSON.parse(await readFile(outputPath, 'utf8'));
    expect(persisted).toEqual(previous);
  });
});

function serviceFor(responses: string[], now: string): OrganizerStockMirrorService {
  return new OrganizerStockMirrorService(new SequenceFoRunner(responses), {
    limit: 100,
    now: () => new Date(now),
  });
}

function page(action: string, items: Record<string, unknown>[], nextCursor: string | null): string {
  return JSON.stringify({
    ok: true,
    action: action,
    result: { items: items, nextCursor: nextCursor, totalCount: items.length },
  });
}
