import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  MAX_ATTEMPTS,
  RETRY_DELAYS_MS,
  SttRetryQueue,
  composeGiveUpMessage,
  computeNextAttemptAt,
  type SttRetryEntry,
} from './stt.retry-queue.js';

describe('stt.retry-queue', () => {

  let root: string;
  let queue: SttRetryQueue;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'ma-stt-retry-'));
    queue = new SttRetryQueue({ root: root });
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  /** Egy tipikus felvétel — csak annyi mező, amennyi a soron múlik. */
  async function enqueueSample(overrides: Partial<{ messageId: string; now: Date }> = {}): Promise<SttRetryEntry | null> {
    return queue.enqueue({
      messageId: overrides.messageId ?? '111',
      channelId: '222',
      authorId: '333',
      authorName: 'itharen',
      filename: 'voice-message.ogg',
      contentType: 'audio/ogg',
      durationSecs: 32,
      audio: new Uint8Array([1, 2, 3, 4]),
      failure: 'A felismerés 5 perc után sem fejeződött be.',
      ...(overrides.now ? { now: overrides.now } : {}),
    });
  }

  describe('computeNextAttemptAt', () => {
    it('a lépcsők NÖVEKVŐK — a ritkuló próbálkozás ad esélyt a terhelésnek elmúlni', () => {
      for (let i = 1; i < RETRY_DELAYS_MS.length; i += 1) {
        expect(RETRY_DELAYS_MS[i]!).toBeGreaterThan(RETRY_DELAYS_MS[i - 1]!);
      }
    });

    it('az első újrapróbálás NEM azonnal jön — különben ugyanabba a RAM-falba futnánk', () => {
      const now = new Date('2026-09-07T12:00:00.000Z');

      expect(computeNextAttemptAt(1, now)).toBe(new Date(now.getTime() + RETRY_DELAYS_MS[0]!).toISOString());
    });

    it('a lépcsők végén `null` — nincs több próbálkozás', () => {
      expect(computeNextAttemptAt(MAX_ATTEMPTS)).toBeNull();
    });
  });

  describe('enqueue', () => {
    it('a BÁJTOKAT teszi el, nem az URL-t — a Discord-link lejárna', async () => {
      await enqueueSample();

      const audio = await queue.readAudio('111');

      expect(audio).not.toBeNull();
      expect([...audio!]).toEqual([1, 2, 3, 4]);
    });

    it('a leírót is elteszi, a bukás okával együtt', async () => {
      const entry = await enqueueSample();

      expect(entry?.attempts).toBe(1);
      expect(entry?.lastFailure).toContain('5 perc');
      expect((await queue.list()).length).toBe(1);
    });

    it('🔊 a FORRÁS is megmarad — ezen múlik a kézbesítés útja', async () => {
      await queue.enqueue({
        messageId: 'recording-owner-1.wav',
        channelId: 'hang-csatorna',
        authorId: '333',
        authorName: 'Itharen',
        filename: 'recording-owner-1.wav',
        contentType: 'audio/wav',
        audio: new Uint8Array([9, 9]),
        failure: 'A felismerés 5 perc után sem fejeződött be.',
        source: 'voice-channel',
      });

      const stored = (await queue.list())[0];

      expect(stored?.source).toBe('voice-channel');
    });

    it('⭐ forrás NÉLKÜL is működik — a lemezen MÁR OTT LÉVŐ bejegyzések nem törnek el', async () => {
      const entry = await enqueueSample();

      // ⚠️ A hiányzó mező `voice-message`-t jelent; a régi tételek így változatlanul,
      // a hangüzenet-úton kézbesítődnek tovább.
      expect(entry?.source).toBeUndefined();
      expect((await queue.list())[0]?.source).toBeUndefined();
    });
  });

  describe('takeDue', () => {
    it('a még nem esedékes tételt NEM adja ki', async () => {
      const now = new Date('2026-09-07T12:00:00.000Z');

      await enqueueSample({ now: now });

      expect(await queue.takeDue(new Date(now.getTime() + 30_000))).toBeNull();
    });

    it('az esedékeset kiadja', async () => {
      const now = new Date('2026-09-07T12:00:00.000Z');

      await enqueueSample({ now: now });

      const due = await queue.takeDue(new Date(now.getTime() + RETRY_DELAYS_MS[0]! + 1_000));

      expect(due?.messageId).toBe('111');
    });

    it('⭐ EGYESÉVEL ad ki — több esedékesnél is csak a legrégebbit', async () => {
      const older = new Date('2026-09-07T10:00:00.000Z');
      const newer = new Date('2026-09-07T11:00:00.000Z');

      await enqueueSample({ messageId: 'a', now: older });
      await enqueueSample({ messageId: 'b', now: newer });

      const due = await queue.takeDue(new Date('2026-09-07T23:00:00.000Z'));

      expect(due?.messageId).toBe('a');
    });
  });

  describe('recordFailure', () => {
    it('lépteti a számlálót és kitolja a következő próbát', async () => {
      await enqueueSample();

      const updated = await queue.recordFailure('111', 'megint timeout');

      expect(updated?.attempts).toBe(2);
      expect(updated?.lastFailure).toBe('megint timeout');
    });

    it('🔴 a próbálkozások végén TÖRLI a tételt és `null`-t ad — ekkor kell szólni az ownernek', async () => {
      await enqueueSample();

      let last: SttRetryEntry | null = null;

      for (let i = 1; i < MAX_ATTEMPTS; i += 1) {
        last = await queue.recordFailure('111', `bukás ${i}`);
      }

      expect(last).toBeNull();
      expect(await queue.list()).toEqual([]);
      expect(existsSync(join(root, '111.bin'))).toBe(false);
    });

    it('ismeretlen azonosítóra `null` — nem esik szét', async () => {
      expect(await queue.recordFailure('nincs-ilyen', 'akármi')).toBeNull();
    });
  });

  describe('remove', () => {
    it('a hangot is törli, nem csak a leírót', async () => {
      await enqueueSample();
      await queue.remove('111');

      expect(existsSync(join(root, '111.bin'))).toBe(false);
      expect(existsSync(join(root, '111.json'))).toBe(false);
    });
  });

  describe('composeGiveUpMessage', () => {
    it('KIMONDJA, hogy nem tudja, mit mondott — ez nem maradhat némán', async () => {
      const entry = await enqueueSample();

      const text = composeGiveUpMessage(entry!);

      expect(text).toContain('VÉGLEG');
      expect(text).toContain('Nem tudom, mit mondtál');
      expect(text).toContain('5 perc');
    });
  });
});
