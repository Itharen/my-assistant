import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { DiscordBatchStore } from './discord.batch-store.js';
import type { DiscordInboundMessage } from './discord.models.js';

function makeStore(): { store: DiscordBatchStore; pendingFile: string; archiveFile: string } {
  const root: string = mkdtempSync(join(tmpdir(), 'ma-discord-store-'));
  const pendingFile: string = join(root, 'pending-inbound.jsonl');
  const archiveFile: string = join(root, 'delivered-inbound.jsonl');

  return { store: new DiscordBatchStore({ pendingFile, archiveFile }), pendingFile, archiveFile };
}

function message(id: string, content: string): DiscordInboundMessage {
  return {
    messageId: id,
    authorId: 'owner-1',
    authorName: 'Owner',
    channelId: 'chan-1',
    content,
    receivedAt: new Date('2026-09-06T14:00:00+02:00').toISOString(),
  };
}

describe('DiscordBatchStore', () => {
  it('returns an empty batch when nothing was ever written', async () => {
    const { store } = makeStore();

    expect((await store.readPending()).length).toBe(0);
  });

  it('keeps arrival order across separate appends', async () => {
    const { store } = makeStore();

    await store.append(message('a', 'Első'));
    await store.append(message('b', 'Második'));

    const pending = await store.readPending();

    expect(pending.length).toBe(2);
    expect(pending[0]?.content).toBe('Első');
    expect(pending[1]?.content).toBe('Második');
  });

  it('ignores a duplicate message id — Discord may replay the same event', async () => {
    const { store } = makeStore();

    expect(await store.append(message('a', 'Első'))).toBe(true);
    expect(await store.append(message('a', 'Első újra'))).toBe(false);
    expect((await store.readPending()).length).toBe(1);
  });

  it('only removes the delivered prefix, so a message arriving mid-send is never lost', async () => {
    const { store } = makeStore();

    await store.append(message('a', 'Kiküldött'));
    await store.append(message('b', 'Küldés közben érkezett'));

    // Csak az elsőt küldtük ki — a második a küldés alatt jött.
    await store.commitDelivered(1);

    const pending = await store.readPending();

    expect(pending.length).toBe(1);
    expect(pending[0]?.content).toBe('Küldés közben érkezett');
  });

  it('archives delivered messages so nothing disappears without a trace', async () => {
    const { store, archiveFile } = makeStore();

    await store.append(message('a', 'Kiküldött'));
    await store.commitDelivered(1);

    expect(existsSync(archiveFile)).toBe(true);
    expect(readFileSync(archiveFile, 'utf-8')).toContain('Kiküldött');
  });

  it('survives a corrupted trailing line instead of losing the whole batch', async () => {
    const { store, pendingFile } = makeStore();

    await store.append(message('a', 'Ép sor'));
    // Félbeszakadt írást szimulálunk: csonka JSON az utolsó soron.
    writeFileSync(pendingFile, `${readFileSync(pendingFile, 'utf-8')}{"messageId":"b","cont`, 'utf-8');

    const pending = await store.readPending();

    expect(pending.length).toBe(1);
    expect(pending[0]?.content).toBe('Ép sor');
  });

  it('does nothing when asked to commit zero messages', async () => {
    const { store } = makeStore();

    await store.append(message('a', 'Marad'));
    await store.commitDelivered(0);

    expect((await store.readPending()).length).toBe(1);
  });
});

describe('DiscordBatchStore.applyPendingRefresh', () => {

  it('a frissitett tartalmat irja vissza', async () => {
    const { store } = makeStore();

    await store.append(message('m1', 'regi szoveg'));
    await store.applyPendingRefresh({
      refreshed: [message('m1', 'javitott szoveg')],
      knownIds: ['m1'],
    });

    const pending = await store.readPending();

    expect(pending.length).toBe(1);
    expect(pending[0]?.content).toBe('javitott szoveg');
  });

  it('a kihagyott (torolt) tetelt eltavolitja', async () => {
    const { store } = makeStore();

    await store.append(message('m1', 'egy'));
    await store.append(message('m2', 'ketto'));
    await store.applyPendingRefresh({ refreshed: [message('m1', 'egy')], knownIds: ['m1', 'm2'] });

    const pending = await store.readPending();

    expect(pending.map((p) => p.messageId)).toEqual(['m1']);
  });

  it('🔴 a KOZBEN ERKEZETT uzenetet MEGTARTJA — ez a legfontosabb', async () => {
    // A frissites halozati korokbol all, tehat eltart egy ideig. Ha ezalatt uj uzenet
    // erkezik, egy sima felulirás NEMÁN ELDOBNA — pontosan az a hibaosztaly, ami ellen
    // az egesz csatorna epult.
    const { store } = makeStore();

    await store.append(message('m1', 'regi'));

    // A frissites mar kiolvasta az m1-et... es EKKOR erkezik az m2.
    await store.append(message('m2', 'kozben erkezett'));

    await store.applyPendingRefresh({ refreshed: [message('m1', 'friss')], knownIds: ['m1'] });

    const pending = await store.readPending();

    expect(pending.map((p) => p.messageId)).toEqual(['m1', 'm2']);
    expect(pending[0]?.content).toBe('friss');
    expect(pending[1]?.content).toBe('kozben erkezett');
  });

  it('ures frissitesnel a kozben erkezett uzenet egyedul marad', async () => {
    const { store } = makeStore();

    await store.append(message('m1', 'torolni'));
    await store.append(message('m2', 'uj'));
    await store.applyPendingRefresh({ refreshed: [], knownIds: ['m1'] });

    expect((await store.readPending()).map((p) => p.messageId)).toEqual(['m2']);
  });

  it('ures tarra sem hasal el', async () => {
    const { store } = makeStore();

    await store.applyPendingRefresh({ refreshed: [], knownIds: [] });

    expect(await store.readPending()).toEqual([]);
  });
});
