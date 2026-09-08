// 🧭 USER-JOURNEY E2E — MEGSZAKÍTÁS + FOLYTATÁS: a bukott felismerés VISSZAJÖN.
//
// > **Kötelező variáns** (`core-e2e-user-journey`): *„interruption and resume (leave mid-flow
// > and come back)"*. A siker-journey mellett ez **külön** kötelező — és eddig hiányzott.
//
// 🔴 MIÉRT PONT EZ AZ ÚT. 2026-09-08 01:35-kor **három** felvétel bukott STT-időtúllépéssel, és
// **mind véglegesen elveszett**: a `SttRetryQueue` létezett, de a hang-csatorna útja nem
// használta. Bekötöttük — de az *„a bukott felismerés már nem vesz el"* eddig **állítás** volt,
// nem bizonyíték. Ez a journey teszi bizonyítékká.
//
// ⭐ MIT VISZ VÉGIG, valódi állapot-továbbadással:
//
//   megszólalás bukik → a HANG BÁJTJAI a sorra → telik az idő → esedékessé válik
//   → ugyanazok a bájtok jönnek vissza → sikeres felismerés
//   → a szöveg a KÖTEGBE kerül, HANGCSATORNA-jelöléssel → a sor kiürül
//
// ⛔ AMIT NEM ÁLLÍT: nincs benne valódi Discord-kapcsolat és valódi STT. A figyelő privát
// ragasztó-metódusa (`deliverRetriedTranscript`) öt sor, ami pontosan az itt végigvitt
// darabokat hívja — de maga a metódus élő klienst igényel, ezért nem szerepel.

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  MAX_ATTEMPTS,
  SttRetryQueue,
  composeGiveUpMessage,
  type SttRetryEntry,
} from './stt.retry-queue.js';
import { planRetryDelivery, type RetryDeliveryPlan } from './stt.retry-delivery.js';
import { DiscordBatchStore } from '../discord/discord.batch-store.js';
import { composeVoiceChannelEntry, VOICE_CHANNEL_MARKER } from '../voice/voice-channel-bridge.js';

const OWNER_ID: string = 'owner-77';
const VOICE_CHANNEL: string = 'hang-csatorna-77';
const WAV_NAME: string = 'recording-owner-77-2026-09-08T01-35-00.wav';

/** A felvétel „bájtjai" — a journey ezeket viszi végig, és a végén ellenőrzi. */
const AUDIO: Uint8Array = new Uint8Array([11, 22, 33, 44, 55]);

const TIMEOUT_FAILURE: string = 'A felismerés 5 perc után sem fejeződött be.';

describe('🧭 STT-újrapróbálás — MEGSZAKÍTÁS + FOLYTATÁS journey', () => {
  let root: string;
  let queue: SttRetryQueue;
  let store: DiscordBatchStore;
  let pendingFile: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'ma-retry-journey-'));
    queue = new SttRetryQueue({ root: join(root, 'stt-retry') });
    pendingFile = join(root, 'pending.jsonl');
    store = new DiscordBatchStore({ pendingFile: pendingFile, archiveFile: join(root, 'archive.jsonl') });
  });

  afterEach(async () => {
    // 🧹 CLEANUP — a journey nem hagyhat maga után se hangot, se leírót.
    await rm(root, { recursive: true, force: true });
  });

  /** Egy hang-csatornás bukás eltevése — pontosan úgy, ahogy a figyelő teszi. */
  async function enqueueVoiceChannelFailure(now: Date): Promise<SttRetryEntry | null> {
    return queue.enqueue({
      messageId: WAV_NAME,
      channelId: VOICE_CHANNEL,
      authorId: OWNER_ID,
      authorName: 'Itharen',
      filename: WAV_NAME,
      contentType: 'audio/wav',
      audio: AUDIO,
      failure: TIMEOUT_FAILURE,
      source: 'voice-channel',
      now: now,
    });
  }

  it('✅ A TELJES ÚT: a bukott felvétel VISSZAJÖN, és a kötegbe kerül', async () => {
    const failedAt: Date = new Date('2026-09-08T01:35:00+02:00');

    // ── 1. lépés: a felismerés bukik → a HANG BÁJTJAI a sorra ────────────────────────────
    const queued: SttRetryEntry | null = await enqueueVoiceChannelFailure(failedAt);

    expect(queued).not.toBeNull();
    expect(queued?.source).toBe('voice-channel');
    expect(queued?.attempts).toBe(1);

    // ── 2. lépés: MÉG NEM esedékes — a várakozás MAGA az alkalmazkodás ───────────────────
    const tooEarly: SttRetryEntry | null = await queue.takeDue(new Date('2026-09-08T01:36:00+02:00'));

    expect(tooEarly).toBeNull();

    // ── 3. lépés: telik az idő → esedékessé válik (az 1. lépésben eltett tétel) ──────────
    const due: SttRetryEntry | null = await queue.takeDue(new Date('2026-09-08T01:40:00+02:00'));

    expect(due).not.toBeNull();
    expect(due?.messageId).toBe(WAV_NAME);
    expect(due?.source).toBe('voice-channel');

    // ── 4. lépés: UGYANAZOK a bájtok jönnek vissza — ez a lényeg, nem egy lejáró URL ─────
    const audio: Uint8Array | null = await queue.readAudio(WAV_NAME);

    expect(audio).not.toBeNull();
    expect([...(audio as Uint8Array)]).toEqual([...AUDIO]);

    // ── 5. lépés: a kézbesítés terve a FORRÁSHOZ igazodik ────────────────────────────────
    const plan: RetryDeliveryPlan = planRetryDelivery(due as SttRetryEntry);

    expect(plan.markAs).toBe('voice-channel');
    expect(plan.mirror).toEqual({ to: 'channel', channelId: VOICE_CHANNEL });

    // ── 6. lépés: az ÉRTÉKET ADÓ KIMENET — a szöveg TÉNYLEG a kötegben van ───────────────
    const text: string = 'Nézd meg a holnapi programot.';
    const appended: boolean = await store.append({
      messageId: (due as SttRetryEntry).messageId,
      channelId: (due as SttRetryEntry).channelId,
      authorId: (due as SttRetryEntry).authorId,
      authorName: (due as SttRetryEntry).authorName,
      content: composeVoiceChannelEntry({ transcript: text, speakerName: (due as SttRetryEntry).authorName }),
      receivedAt: new Date('2026-09-08T01:40:05+02:00').toISOString(),
    });

    expect(appended).toBe(true);

    const { readFile } = await import('node:fs/promises');
    const pending: string = await readFile(pendingFile, 'utf8');

    expect(pending).toContain(text);
    // ⭐ HANGCSATORNA-jelölés, NEM hangüzenet: élő beszéd volt, más bizonytalansággal.
    expect(pending).toContain(VOICE_CHANNEL_MARKER);
    expect(pending).not.toContain('HANGÜZENET');

    // ── 7. lépés: a sor KIÜRÜL — a folytatás lezárult ────────────────────────────────────
    await queue.remove(WAV_NAME);

    expect((await queue.list()).length).toBe(0);
    expect(await queue.readAudio(WAV_NAME)).toBeNull();
  });

  it('🔴 FELADÁS-VARIÁNS: ha minden próba elfogy, azt KIMONDJUK — a hang-csatornában', async () => {
    let now: Date = new Date('2026-09-08T01:35:00+02:00');

    await enqueueVoiceChannelFailure(now);

    // ── Minden hátralévő próbát elbuktatunk (az 1. bukás már megvolt az enqueue-val) ─────
    let entry: SttRetryEntry | null = null;

    for (let attempt: number = 2; attempt <= MAX_ATTEMPTS; attempt += 1) {
      now = new Date(now.getTime() + 60 * 60_000);
      entry = await queue.recordFailure(WAV_NAME, TIMEOUT_FAILURE, now);
    }

    // ⭐ A `recordFailure` `null`-t ad, amikor MÁR NINCS több lépcső — ez a feladás jele.
    expect(entry).toBeNull();

    // ── Az üzenet KIMONDJA, hogy a tartalom elveszett, és MEGMONDJA az okát ──────────────
    const giveUp: string = composeGiveUpMessage({
      messageId: WAV_NAME,
      channelId: VOICE_CHANNEL,
      authorId: OWNER_ID,
      authorName: 'Itharen',
      filename: WAV_NAME,
      attempts: MAX_ATTEMPTS,
      nextAttemptAt: now.toISOString(),
      queuedAt: '2026-09-08T01:35:00+02:00',
      lastFailure: TIMEOUT_FAILURE,
      source: 'voice-channel',
    });

    expect(giveUp).toContain('5 perc');

    // 🔴 ÉS ODA MEGY, AHOL ELHANGZOTT — ez a legfontosabb üzenet az egész sorban.
    const plan: RetryDeliveryPlan = planRetryDelivery({ source: 'voice-channel', channelId: VOICE_CHANNEL });

    expect(plan.mirror).toEqual({ to: 'channel', channelId: VOICE_CHANNEL });
  });

  it('⚪ EGYÜTTÉLÉS-VARIÁNS: a hangüzenet és a hang-csatornás tétel NEM keveredik', async () => {
    const now: Date = new Date('2026-09-08T01:35:00+02:00');

    await enqueueVoiceChannelFailure(now);
    await queue.enqueue({
      messageId: '1234567890',
      channelId: 'fo-csatorna',
      authorId: OWNER_ID,
      authorName: 'Itharen',
      filename: 'voice-message.ogg',
      contentType: 'audio/ogg',
      audio: new Uint8Array([7, 7]),
      failure: TIMEOUT_FAILURE,
      now: now,
    });

    const entries: SttRetryEntry[] = await queue.list();

    expect(entries.length).toBe(2);

    const voiceChannel = entries.find((e: SttRetryEntry): boolean => e.messageId === WAV_NAME);
    const voiceMessage = entries.find((e: SttRetryEntry): boolean => e.messageId === '1234567890');

    // ⭐ Mindkettő a SAJÁT útján kézbesítődik — ez a `source` mező egyetlen feladata.
    expect(planRetryDelivery(voiceChannel as SttRetryEntry).mirror).toEqual({
      to: 'channel',
      channelId: VOICE_CHANNEL,
    });
    expect(planRetryDelivery(voiceMessage as SttRetryEntry).mirror).toEqual({ to: 'reply' });

    // ⚠️ És a hangjuk sem cserélődik össze.
    expect([...(await queue.readAudio(WAV_NAME) as Uint8Array)]).toEqual([...AUDIO]);
    expect([...(await queue.readAudio('1234567890') as Uint8Array)]).toEqual([7, 7]);
  });
});
