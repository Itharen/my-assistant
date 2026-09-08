// A hangüzenet ↔ transzkript nyilvántartás tesztjei (T-68, 1. rész).
//
// 🔴 MIÉRT LÉTEZIK: 2026-09-08-án az owner egy 30 másodperces hangüzenete **5 próba után
// véglegesen elveszett** — és a `SttRetryQueue.remove()` a hangot is törölte, tehát a
// *„visszamenőlegesen is fel kell tudjad oldani"* fizikailag lehetetlen volt.
//
// ⭐ A LEGFONTOSABB ÁLLÍTÁS ITT: **bukásnál a hang MEGMARAD**. Ha ez elromlik, a T-68 harmadik
// része (visszamenőleges feloldás) **némán** válik lehetetlenné — pontosan úgy, ahogy eddig.

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildFailedEntry,
  buildResolvedEntry,
  TranscriptLedger,
  type TranscriptLedgerEntry,
} from './stt.transcript-ledger.js';

const now: Date = new Date('2026-09-08T18:30:00+02:00');
const earlier: Date = new Date('2026-09-08T17:41:00+02:00');

function resolvedInput(overrides: Record<string, unknown> = {}) {
  return {
    messageId: '1546863401903587359',
    channelId: '1470413825353318561',
    authorName: 'futdevpro',
    filename: 'voice-message.ogg',
    durationSecs: 30.2,
    transcript: 'ez hangzott el',
    attempts: 1,
    ...overrides,
  };
}

function failedInput(overrides: Record<string, unknown> = {}) {
  return {
    messageId: '1546863401903587359',
    channelId: '1470413825353318561',
    authorName: 'futdevpro',
    filename: 'voice-message.ogg',
    durationSecs: 30.2,
    failure: 'A felismerés 5 perc után sem fejeződött be.',
    attempts: 5,
    ...overrides,
  };
}

describe('buildResolvedEntry / buildFailedEntry — a bejegyzés alakja', () => {

  it('a sikeres bejegyzés a SZÖVEGET őrzi', () => {
    const entry = buildResolvedEntry(resolvedInput(), null, now);

    expect(entry.status).toBe('resolved');
    expect(entry.transcript).toBe('ez hangzott el');
  });

  it('🔴 a bukott bejegyzés a HANGRA mutat — ez teszi lehetővé a későbbi feloldást', () => {
    const entry = buildFailedEntry(failedInput(), null, now);

    expect(entry.status).toBe('failed');
    expect(entry.audioFile).toBe('1546863401903587359.bin');
  });

  it('a bukás VISZI AZ OKOT és a próbaszámot — ⛔ nem csak annyit, hogy „nem sikerült"', () => {
    const entry = buildFailedEntry(failedInput(), null, now);

    expect(entry.failure).toContain('5 perc után');
    expect(entry.attempts).toBe(5);
  });

  describe('⭐ `firstSeenAt` — mennyi idő alatt oldódott fel', () => {

    it('új bejegyzésnél a MOST', () => {
      expect(buildResolvedEntry(resolvedInput(), null, now).firstSeenAt).toBe(now.toISOString());
    });

    it('🔴 KÉSŐI sikernél a KORÁBBI időpont marad — nem „most érkezett"', () => {
      // ⚠️ Enélkül egy 40 perc után feloldott hang úgy nézne ki, mintha azonnal megvolna,
      // és a „mennyi ideig tartott" kérdés megválaszolhatatlan lenne.
      const previous: TranscriptLedgerEntry = buildFailedEntry(failedInput(), null, earlier);
      const entry = buildResolvedEntry(resolvedInput({ attempts: 4 }), previous, now);

      expect(entry.firstSeenAt).toBe(earlier.toISOString());
      expect(entry.settledAt).toBe(now.toISOString());
    });
  });

  it('a hiányzó hossz NEM kerül bele üresen', () => {
    const entry = buildResolvedEntry(resolvedInput({ durationSecs: undefined }), null, now);

    expect('durationSecs' in entry).toBeFalse();
  });
});

describe('TranscriptLedger — a tárolás', () => {

  let root: string;
  let ledger: TranscriptLedger;

  beforeEach(async (): Promise<void> => {
    root = await mkdtemp(join(tmpdir(), 'ma-ledger-'));
    ledger = new TranscriptLedger({ root: root });
  });

  afterEach(async (): Promise<void> => {
    await rm(root, { recursive: true, force: true });
  });

  it('üres nyilvántartásnál üres listát ad — ⛔ nem dob', async (): Promise<void> => {
    expect(await ledger.list()).toEqual([]);
    expect(await ledger.get('nincs-ilyen')).toBeNull();
  });

  it('a sikeres felismerés visszaolvasható', async (): Promise<void> => {
    await ledger.recordResolved(resolvedInput(), now);

    const entry = await ledger.get('1546863401903587359');

    expect(entry?.status).toBe('resolved');
    expect(entry?.transcript).toBe('ez hangzott el');
  });

  describe('🔴 A LEGFONTOSABB: bukásnál a HANG MEGMARAD', () => {

    it('a hangfájl ÁTKERÜL a nyilvántartásba', async (): Promise<void> => {
      const source: string = join(root, 'forras.bin');

      await writeFile(source, Buffer.from([1, 2, 3, 4]));
      await ledger.recordFailed(failedInput(), source, now);

      const entry = await ledger.get('1546863401903587359');
      const kept: string | null = entry ? ledger.audioPathOf(entry) : null;

      expect(kept).not.toBeNull();
      expect(await readFile(kept as string)).toEqual(Buffer.from([1, 2, 3, 4]));
    });

    it('⛔ a FORRÁS helyéről elkerül — nem marad ott, ahol a sor törölné', async (): Promise<void> => {
      const source: string = join(root, 'forras.bin');

      await writeFile(source, Buffer.from([9]));
      await ledger.recordFailed(failedInput(), source, now);

      expect(existsSync(source)).toBeFalse();
    });

    it('⚠️ ha a hang MÁR NINCS meg, a bejegyzés akkor is elkészül — „tudjuk, hogy elveszett" '
      + 'többet ér a semminél', async (): Promise<void> => {
      await ledger.recordFailed(failedInput(), null, now);

      const entry = await ledger.get('1546863401903587359');

      expect(entry?.status).toBe('failed');
      expect(entry?.audioFile).toBeUndefined();
      expect(entry?.failure).toContain('5 perc után');
    });

    it('nem létező forrás-útvonalnál sem dob', async (): Promise<void> => {
      await expectAsync(
        ledger.recordFailed(failedInput(), join(root, 'nincs-ilyen.bin'), now),
      ).toBeResolved();
    });

    describe('⭐ ha az ÁTNEVEZÉS bukik (kötetek közti mozgatás, `EXDEV`)', () => {

      /** Olyan nyilvántartás, amiben az átnevezés MINDIG elbukik — ezt a fallback fogja el. */
      function ledgerWithBrokenRename(): TranscriptLedger {
        return new TranscriptLedger({ root: root }, async (): Promise<void> => {
          const error: NodeJS.ErrnoException = new Error('EXDEV: cross-device link not permitted');

          error.code = 'EXDEV';
          throw error;
        });
      }

      it('🔴 a hang AKKOR IS megmarad — másolással', async (): Promise<void> => {
        // ⚠️ Enélkül a T-68 legfontosabb ígérete (a visszamenőleges feloldás) NÉMÁN szűnne
        // meg abban a pillanatban, amikor a sor és a nyilvántartás külön kötetre kerül.
        const source: string = join(root, 'forras.bin');

        await writeFile(source, Buffer.from([7, 7, 7]));
        await ledgerWithBrokenRename().recordFailed(failedInput(), source, now);

        const entry = await ledger.get('1546863401903587359');
        const kept: string | null = entry ? ledger.audioPathOf(entry) : null;

        expect(kept).not.toBeNull();
        expect(await readFile(kept as string)).toEqual(Buffer.from([7, 7, 7]));
      });

      it('⛔ a forrás a másolás után is elkerül — nem marad ott, ahol a sor törölné', async (): Promise<void> => {
        const source: string = join(root, 'forras.bin');

        await writeFile(source, Buffer.from([7]));
        await ledgerWithBrokenRename().recordFailed(failedInput(), source, now);

        expect(existsSync(source)).toBeFalse();
      });
    });
  });

  describe('a feloldatlanok munkalistája', () => {

    it('CSAK a bukottakat adja vissza — ez a visszamenőleges feloldás bemenete', async (): Promise<void> => {
      await ledger.recordResolved(resolvedInput({ messageId: 'ok-1' }), now);
      await ledger.recordFailed(failedInput({ messageId: 'bukott-1' }), null, now);

      const failed = await ledger.listFailed();

      expect(failed.length).toBe(1);
      expect(failed[0]?.messageId).toBe('bukott-1');
    });

    it('a KÉSŐBB feloldott már NEM szerepel benne', async (): Promise<void> => {
      // ⭐ A sikeres újrapróbálás felülírja a bukott bejegyzést — különben a munkalista
      // örökre nőne, és a már megoldott hangokat újra és újra próbálnánk.
      await ledger.recordFailed(failedInput({ messageId: 'kesobb-ok' }), null, earlier);
      await ledger.recordResolved(resolvedInput({ messageId: 'kesobb-ok' }), now);

      expect(await ledger.listFailed()).toEqual([]);
    });
  });

  it('a lista a LEGUTÓBB eldőltet adja elöl', async (): Promise<void> => {
    await ledger.recordResolved(resolvedInput({ messageId: 'regi' }), earlier);
    await ledger.recordResolved(resolvedInput({ messageId: 'uj' }), now);

    expect((await ledger.list())[0]?.messageId).toBe('uj');
  });

  it('⚠️ a SÉRÜLT bejegyzést kihagyja, de ⛔ NEM törli — kézzel még megnézhető', async (): Promise<void> => {
    await writeFile(join(root, 'serult.json'), '{ ez nem json', 'utf-8');
    await ledger.recordResolved(resolvedInput({ messageId: 'ep' }), now);

    expect((await ledger.list()).length).toBe(1);
    expect(existsSync(join(root, 'serult.json'))).toBeTrue();
  });
});
