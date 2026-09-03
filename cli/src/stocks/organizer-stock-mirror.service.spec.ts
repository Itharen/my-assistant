import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  FoRunner,
  OrganizerStockMirror,
  OrganizerStockMirrorService,
  StockMirrorError,
  writeMirrorAtomically,
} from './organizer-stock-mirror.service.js';

class FixtureFoRunner implements FoRunner {
  public readonly calls: string[][] = [];
  private readonly responses: Map<string, string>;

  public constructor(responses: Map<string, string>) {
    this.responses = responses;
  }

  public async run(args: string[]): Promise<string> {
    this.calls.push(args);
    const key: string = args.join(' ');
    const response: string | undefined = this.responses.get(key);
    if (response === undefined) {
      throw new Error(`Missing fixture response for: ${key}`);
    }
    return response;
  }
}

describe('OrganizerStockMirrorService', () => {
  it('reads every stock page and every stock-item page without losing raw fields', async () => {
    const runner = new FixtureFoRunner(new Map<string, string>([
      ['stocks.list --limit 1', envelope('stocks.list', [{ ref: 'org:stock:a', title: 'A', custom: 1 }], 's2')],
      ['stocks.list --limit 1 --cursor s2', envelope('stocks.list', [{ ref: 'org:stock:b', title: 'B' }], null)],
      [
        'stock-items.list --stock-ref org:stock:a --limit 1',
        envelope('stock-items.list', [{ ref: 'org:stockItem:a1', quantity: 2, nested: { preserved: true } }], 'a2'),
      ],
      [
        'stock-items.list --stock-ref org:stock:a --limit 1 --cursor a2',
        envelope('stock-items.list', [{ ref: 'org:stockItem:a2', quantity: 3 }], null),
      ],
      ['stock-items.list --stock-ref org:stock:b --limit 1', envelope('stock-items.list', [], null)],
    ]));
    const service = new OrganizerStockMirrorService(runner, {
      limit: 1,
      now: () => new Date('2026-08-23T12:00:00.000Z'),
    });

    const mirror: OrganizerStockMirror = await service.buildMirror();

    expect(mirror.generatedAt).toBe('2026-08-23T12:00:00.000Z');
    expect(mirror.counts).toEqual({ stocks: 2, stockItems: 2, pages: 5 });
    expect(mirror.stocks[0]?.stock.custom).toBe(1);
    expect(mirror.stocks[0]?.items[0]?.nested).toEqual({ preserved: true });
    expect(mirror.stocks[1]?.items).toEqual([]);
    expect(runner.calls.length).toBe(5);
  });

  it('fails closed when Organizer repeats a pagination cursor', async () => {
    const runner = new FixtureFoRunner(new Map<string, string>([
      ['stocks.list --limit 100', envelope('stocks.list', [], 'same')],
      ['stocks.list --limit 100 --cursor same', envelope('stocks.list', [], 'same')],
    ]));
    const service = new OrganizerStockMirrorService(runner, { limit: 100 });

    await expectAsync(service.buildMirror()).toBeRejectedWithError(StockMirrorError, /cursor repeated/i);
  });

  it('surfaces malformed JSON and Organizer error envelopes with structured error codes', async () => {
    const invalidJson = new OrganizerStockMirrorService(
      new FixtureFoRunner(new Map<string, string>([['stocks.list --limit 100', '{broken']])),
      { limit: 100 },
    );
    await expectErrorCode(invalidJson.buildMirror(), 'MA-STOCK-MIRROR-FO-JSON');

    const organizerError = new OrganizerStockMirrorService(
      new FixtureFoRunner(new Map<string, string>([[
        'stocks.list --limit 100',
        JSON.stringify({ ok: false, action: 'stocks.list', error: { code: 'REMOTE', message: 'unavailable' } }),
      ]])),
      { limit: 100 },
    );
    await expectErrorCode(organizerError.buildMirror(), 'MA-STOCK-MIRROR-FO-ERROR');
  });

  it('atomically replaces an older snapshot and leaves no temporary file behind', async () => {
    const root: string = await mkdtemp(join(tmpdir(), 'ma-stock-mirror-spec-'));
    const outputPath: string = join(root, 'organizer-mirror.json');
    try {
      const first: OrganizerStockMirror = emptyMirror('2026-08-23T12:00:00.000Z');
      const second: OrganizerStockMirror = emptyMirror('2026-08-23T13:00:00.000Z');
      await writeMirrorAtomically(outputPath, first);
      await writeMirrorAtomically(outputPath, second);

      const persisted: OrganizerStockMirror = JSON.parse(await readFile(outputPath, 'utf8'));
      expect(persisted.generatedAt).toBe(second.generatedAt);
      expect((await readdir(root)).filter((name: string) => name.endsWith('.tmp'))).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function envelope(action: string, items: Record<string, unknown>[], nextCursor: string | null): string {
  return JSON.stringify({
    ok: true,
    action: action,
    requestId: 'fixture',
    elapsedMs: 1,
    result: { items: items, nextCursor: nextCursor, totalCount: items.length },
  });
}

function emptyMirror(generatedAt: string): OrganizerStockMirror {
  return {
    schemaVersion: '1.0.0',
    source: 'organizer',
    generatedAt: generatedAt,
    stocks: [],
    counts: { stocks: 0, stockItems: 0, pages: 1 },
  };
}

async function expectErrorCode(promise: Promise<unknown>, expectedCode: string): Promise<void> {
  try {
    await promise;
    fail(`Expected ${expectedCode}.`);
  } catch (error: unknown) {
    if (!(error instanceof StockMirrorError)) {
      throw error;
    }
    expect(error.code).toBe(expectedCode);
  }
}
