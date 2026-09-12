// ⏳ A NYUGTÁHOZ TARTOZÓ VÁRAKOZÁS MÉRÉSE — a 23. tétel lényege.
//
// > **Owner, 2026-09-12 22:02:** *„Úgy látom, hogy X üzenet elküldve üzenetet NEM AKKOR kapom,
// > amikor elküldötté válik tényleg, hanem nem tudom mikor később."*
//
// 🔴 AZ ÁLLÍTÁS, AMIT ITT LESZÖGEZÜNK: a kiküldés a **LEGRÉGEBBI** üzenet korát adja vissza,
// ⛔ **nem a legújabbét**. A legújabb kora a **gyűjtő-ablak** hossza *(~30 mp)*; az owner viszont
// azt akarja tudni, hogy amit **elsőként** mondott, az mennyit várt — ez a kettő **percekben**
// tér el *(mérve: 190-650 mp vs. 2-5 mp)*.
//
// ⭐ MIÉRT KÜLÖN FÁJL, és ⛔ miért nem a `discord.bridge.spec.ts` végére: az a fájl **475 sor**,
// és ez a blokk átvitte volna az **500 soros** korláton. ⇒ A `max-file-lines` ⛔ nem
// szabály-kikapcsolással, hanem **kettéválasztással** teljesül.
//
// ⭐ ÉS MIÉRT ÖRÖKLÉSSEL hamisítunk, ⛔ nem `as never` átcímkézéssel: az `as` **elhallgatná**,
// ha a valódi osztály felülete megváltozna — az `override` viszont **fordítási hibát** ad.

import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CcapApiClient } from '../ccap/ccap.api-client.js';
import { DiscordBatchStore } from './discord.batch-store.js';
import { DiscordBridge } from './discord.bridge.js';
import { DEFAULT_BATCH_CONFIG, type DiscordInboundMessage } from './discord.models.js';
import type { CcapCcSession, CcapPromptResult, CcapSessionRuntime } from '../ccap/ccap.models.js';

const NOW: Date = new Date('2026-09-12T22:30:00+02:00');

/** Adott számú másodperccel a NOW ELŐTT érkezett üzenet. */
function message(id: string, ageSeconds: number | string): DiscordInboundMessage {
  return {
    messageId: id,
    authorId: 'owner-1',
    authorName: 'Itharen',
    channelId: 'chan-1',
    content: `üzenet ${id}`,
    receivedAt: typeof ageSeconds === 'string'
      ? ageSeconds
      : new Date(NOW.getTime() - ageSeconds * 1000).toISOString(),
  };
}

/** Hamis köteg-tár — ⭐ **öröklés**, hogy a felület-változás fordítási hiba legyen. */
class FakeStore extends DiscordBatchStore {

  constructor(private readonly items: DiscordInboundMessage[]) {
    super();
  }

  override async readPending(): Promise<DiscordInboundMessage[]> {
    return this.items;
  }

  override async commitDelivered(): Promise<void> {
    return undefined;
  }
}

/** Hamis CCAP: szabad session, a prompt azonnal átveszi. */
class FakeCcap extends CcapApiClient {

  override async inspectRuntime(sessionId: string): Promise<CcapSessionRuntime> {
    return {
      sessionId: sessionId,
      ccapId: 'ccap-teszt',
      status: 'idle',
      isBusyProcessing: false,
      queuedItemCount: 0,
      isQueueLocked: false,
    };
  }

  override async sendPrompt(): Promise<CcapPromptResult> {
    return { queued: false, raw: {} };
  }

  override async listCcSessions(): Promise<CcapCcSession[]> {
    return [{
      sessionId: 's-1',
      label: 'Teszt',
      workspacePath: 'E:/teszt',
      status: 'idle',
      claudeSessionId: 'cc-teszt',
      isArchived: false,
    }];
  }
}

describe('⏳ A kiküldés VISSZAADJA a várakozást — a nyugtához (23. tétel)', () => {

  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await mkdtemp(join(tmpdir(), 'bridge-wait-'));
    await mkdir(join(repoRoot, '__agent', 'config'), { recursive: true });
    await writeFile(
      join(repoRoot, '__agent', 'config', 'owner-message-target.json'),
      JSON.stringify({ sessionId: 's-1', claudeSessionId: 'cc-teszt', label: 'Teszt' }),
      'utf-8',
    );
  });

  it('🔴 A LEGRÉGEBBI üzenet korát adja, ⛔ NEM a legújabbét', async () => {
    const bridge: DiscordBridge = new DiscordBridge(
      new FakeStore([message('regi', 300), message('uj', 20)]),
      new FakeCcap(),
      DEFAULT_BATCH_CONFIG,
      repoRoot,
    );

    const result = await bridge.flush({ now: NOW, force: true });

    expect(result?.deliveredCount).toBe(2);
    expect(result?.oldestWaitMs).toBe(300_000);
    // ⛔ Ha a legújabbat mérnénk, 20 000 jönne ki — és a nyugta „20 mp várakozás"-t írna egy
    // 5 PERCES türelem után. Pontosan ez a félrevezetés, amit a 23. tétel javít.
    expect(result?.oldestWaitMs).not.toBe(20_000);
  });

  it('⛔ HIBÁS IDŐBÉLYEGNÉL `null` — a 0 azt ÁLLÍTANÁ, hogy nem is várt', async () => {
    const bridge: DiscordBridge = new DiscordBridge(
      new FakeStore([message('rossz', 'nem-datum')]),
      new FakeCcap(),
      DEFAULT_BATCH_CONFIG,
      repoRoot,
    );

    const result = await bridge.flush({ now: NOW, force: true });

    expect(result?.oldestWaitMs).toBeNull();
  });

  it('⭐ EGY üzenetnél is mér — a nyugta ugyan hallgat, de a szám ⛔ nem hazudik', async () => {
    const bridge: DiscordBridge = new DiscordBridge(
      new FakeStore([message('egy', 45)]),
      new FakeCcap(),
      DEFAULT_BATCH_CONFIG,
      repoRoot,
    );

    const result = await bridge.flush({ now: NOW, force: true });

    expect(result?.oldestWaitMs).toBe(45_000);
  });
});
