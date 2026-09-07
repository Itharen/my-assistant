import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  composeReceiptMessage,
  decideReceipt,
  readAcknowledgedOldestId,
  RECEIPT_AFTER_MS,
  writeAcknowledgedOldestId,
} from './discord.receipt.js';

describe('decideReceipt', () => {

  it('ures kotegre nem kuld', () => {
    const decision = decideReceipt({ pendingCount: 0, oldestAgeMs: 999_999, alreadyAcknowledged: false });

    expect(decision.shouldSend).toBe(false);
  });

  it('friss uzenetre nem kuld — az csak zaj lenne', () => {
    const decision = decideReceipt({ pendingCount: 2, oldestAgeMs: 10_000, alreadyAcknowledged: false });

    expect(decision.shouldSend).toBe(false);
    expect(decision.reason).toContain('zaj');
  });

  it('a kuszob UTAN kuld', () => {
    const decision = decideReceipt({
      pendingCount: 3,
      oldestAgeMs: RECEIPT_AFTER_MS + 1_000,
      alreadyAcknowledged: false,
    });

    expect(decision.shouldSend).toBe(true);
  });

  it('🔴 KOTEGENKENT CSAK EGYSZER — kulonben percenkent negy "megvan" menne ki', () => {
    // A kikuldesi kor 15 mp-enkent fut. Ismetles nelkul ez nem megnyugtatas, hanem spam.
    const decision = decideReceipt({
      pendingCount: 3,
      oldestAgeMs: 10 * 60_000,
      alreadyAcknowledged: true,
    });

    expect(decision.shouldSend).toBe(false);
    expect(decision.reason).toContain('már ment nyugta');
  });

  it('pontosan a kuszobon meg nem kuld (szigoru osszehasonlitas)', () => {
    const decision = decideReceipt({
      pendingCount: 1,
      oldestAgeMs: RECEIPT_AFTER_MS,
      alreadyAcknowledged: false,
    });

    expect(decision.shouldSend).toBe(true);
  });

  it('az indoklas megnevezi a darabszamot es a kort', () => {
    const decision = decideReceipt({
      pendingCount: 4,
      oldestAgeMs: 5 * 60_000,
      alreadyAcknowledged: false,
    });

    expect(decision.reason).toContain('4 üzenet');
    expect(decision.reason).toContain('5 perce');
  });
});

describe('composeReceiptMessage', () => {

  it('egyes szamban helyes', () => {
    expect(composeReceiptMessage(1)).toContain('az üzeneted');
  });

  it('tobbes szamban megmondja a darabszamot', () => {
    expect(composeReceiptMessage(3)).toContain('mind a 3 üzeneted');
  });

  it('megmondja, hogy MEGVAN — ez a lenyeg', () => {
    expect(composeReceiptMessage(2)).toContain('Megvan');
  });

  it('⛔ NEM iger hataridot', () => {
    const text = composeReceiptMessage(2);

    expect(text).not.toContain('perc múlva');
    expect(text).not.toContain('hamarosan');
  });

  it('rovid marad — egy sor', () => {
    expect(composeReceiptMessage(5).split('\n').length).toBe(1);
  });
});

describe('a nyugta-jelolo PERZISZTENS', () => {

  // 🔴 MIERT KELL FAJLBAN: a figyelot a szerver felugyeli, es a szerver MINDEN LDP-korben
  // ujraindul. Memoriaban tartva a jelolo elveszne, es a meg mindig varo kotegre ujabb
  // nyugta menne ki — fejlesztes kozben akar percenkent.

  function markerPath(): string {
    return join(mkdtempSync(join(tmpdir(), 'ma-receipt-')), 'receipt-marker.json');
  }

  it('a kiirt jelolot vissza tudja olvasni', async () => {
    const p = markerPath();

    await writeAcknowledgedOldestId('msg-1', p);

    expect(await readAcknowledgedOldestId(p)).toBe('msg-1');
  });

  it('hianyzo fajlnal null — olyankor inkabb kuldunk egy nyugtat', async () => {
    expect(await readAcknowledgedOldestId(markerPath())).toBeNull();
  });

  it('a null kiirasa TORLI a jelolot (kikuldes utan)', async () => {
    const p = markerPath();

    await writeAcknowledgedOldestId('msg-1', p);
    await writeAcknowledgedOldestId(null, p);

    expect(await readAcknowledgedOldestId(p)).toBeNull();
  });

  it('serult fajlon nem hasal el', async () => {
    const p = markerPath();

    writeFileSync(p, '{ ez nem json', 'utf-8');

    expect(await readAcknowledgedOldestId(p)).toBeNull();
  });
});
