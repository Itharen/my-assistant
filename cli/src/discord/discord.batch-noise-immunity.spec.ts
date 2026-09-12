// 🎤 A 19. TÉTEL TESZTJE — A KISZŰRT ZAJ NEM NYÚJTHATJA A KÖTEG-ABLAKOT
//
// > **Owner, 2026-09-12 (élesben KÉTSZER: 03:17 és 04:22):** *„miért nem mennek át az
// > üzeneteim?"* — a handoffban: *„minden új megszólalás újraindítja a gyűjtő-ablakot ⇒ nyitott
// > mikrofon mellett sosem csendesedik el, ezért a VALÓDI üzenetek is bent ragadnak."*
//
// > **Az owner által KÉRT teszt, szó szerint:** *„1 valódi üzenet + 50 zaj 10 percen át" → a
// > köteg kimegy a valódi üzenet után.*
//
// ## ⭐ MIÉRT KÉT MODULT VISZ EGYÜTT
//
// A hibát egyik modul sem *„tartalmazta"*: a nyilvántartás helyesen jelezte, hogy megszólalás van
// folyamatban, a döntés pedig helyesen várt rá. 🔴 A hiba a **kettő találkozásában** volt — hogy
// mi számít megszólalásnak. ⇒ Ez a teszt a **kaput és a döntést együtt** járatja, valódi
// idő-lépésekkel, ⛔ nem kamu logikai értékkel.

import { decideFlush } from './discord.bridge.js';
import { DEFAULT_BATCH_CONFIG, type DiscordInboundMessage } from './discord.models.js';
import { VoiceSpeechInFlight } from '../voice/voice-speech-inflight.js';

const START_MS: number = new Date('2026-09-12T03:05:00+02:00').getTime();

/** Kézzel léptetett óra — a nyilvántartás és a döntés UGYANEZT olvassa. */
function makeClock(): { now: () => number; advance: (ms: number) => void } {
  let current: number = START_MS;

  return {
    now: (): number => current,
    advance: (ms: number): void => {
      current += ms;
    },
  };
}

/** Egy valódi, már a kötegben álló üzenet — az owner megszólalásából lett átirat. */
function realMessage(atMs: number): DiscordInboundMessage {
  return {
    messageId: 'valodi-1',
    authorId: 'owner-1',
    authorName: 'Itharen',
    channelId: 'chan-1',
    content: '🔊 HANGCSATORNA — Ezt kérdeztem, és erre várok választ.',
    receivedAt: new Date(atMs).toISOString(),
  };
}

/**
 * 🔴 HÁNY `speaking start` JEL JUT EGY KIMENETELRE — **mérve**, ⛔ nem feltevés.
 *
 * 2026-09-12, a teljes éjszaka: **757** `speaking start` jel és **295** felvétel-kimenetel
 * ⇒ **2,6 jel / kimenetel**, azaz **462 jel SOHA nem kapott lezárást**. Ezek mindegyike a saját
 * jogán, **180 mp**-ig tartotta a kaput — innen jött a mért **90,0 perces** zárás 90%-a.
 *
 * ⇒ A szimuláció **3** jelet ad kimenetelenként *(a mért 2,6 felfelé kerekítve)*, mert a
 * nyilvántartás egy lezárásra **egy** jelet ereszt el — a maradék felgyűlik, pont mint élesben.
 */
const DETECTIONS_PER_OUTCOME: number = 3;

/**
 * Egy zaj-megszólalás teljes útja: észlelés(ek) → felvétel feldolgozása → **zajnak** jelölt
 * kimenetel.
 *
 * ⏱️ A 2 mp-es feldolgozás **mért** érték *(2026-09-12, 279 felvétel: median 2,0 mp, p90 4,0 mp,
 * max 11,0 mp)* — ⛔ nem becslés.
 */
function playNoiseUtterance(
  tracker: VoiceSpeechInFlight,
  clock: { advance: (ms: number) => void },
  index: number,
  options: { markAsNoise: boolean } = { markAsNoise: true },
): void {
  const filename: string = `zaj-${index}.wav`;

  for (let signal: number = 0; signal < DETECTIONS_PER_OUTCOME; signal += 1) tracker.noteStarted();

  clock.advance(1_000);
  tracker.noteProcessingStarted(filename);
  clock.advance(2_000);
  tracker.noteSettled({
    filename: filename,
    ...(options.markAsNoise ? { isNoise: true } : {}),
  });
}

describe('🎤 A kiszűrt zaj NEM nyújtja a köteg-ablakot (19. tétel)', () => {

  it('⭐ 1 VALÓDI ÜZENET + 50 ZAJ 10 PERCEN ÁT — a köteg kimegy, ⛔ nem ragad bent', () => {
    const clock = makeClock();
    const tracker: VoiceSpeechInFlight = new VoiceSpeechInFlight(clock.now);
    // A valódi üzenet MÁR a kötegben áll — ez az, ami az ownernek nem ment át.
    const pending: DiscordInboundMessage[] = [realMessage(START_MS)];
    // 10 perc / 50 zaj-tétel = 12 másodpercenként egy. (A mért buli-sűrűség ennél NAGYOBB volt:
    // 84 tétel / 10 perc ⇒ ez a szimuláció óvatos, nem eltúlzott.)
    const noiseEveryMs: number = 12_000;

    let flushedAtMs: number | null = null;

    for (let index: number = 0; index < 50; index += 1) {
      playNoiseUtterance(tracker, clock, index);

      // A kiküldési kör 15 mp-enként fut — a döntést ott kérdezzük, ahol élesben is.
      clock.advance(noiseEveryMs - 3_000);

      const decision = decideFlush({
        pending: pending,
        isBusyProcessing: false,
        queuedItemCount: 0,
        isSpeechInProgress: tracker.isInProgress(),
        now: new Date(clock.now()),
        config: DEFAULT_BATCH_CONFIG,
      });

      if (decision.shouldFlush && flushedAtMs === null) flushedAtMs = clock.now();
    }

    expect(flushedAtMs).not.toBeNull();
    // 🔴 A LÉNYEG: a tartási korlát (15 perc) szelepe ⛔ NEM kellett hozzá — a köteg azért ment
    // ki, mert a zaj nem tartotta vissza, nem azért, mert lejárt a türelem.
    expect((flushedAtMs ?? 0) - START_MS).toBeLessThan(DEFAULT_BATCH_CONFIG.maxHoldMs);
    // ⭐ És a mért zaj-özön küszöbön belül fel is oldódik: 12 zaj-tétel × 12 mp ≈ 2,4 perc.
    expect((flushedAtMs ?? 0) - START_MS).toBeLessThan(4 * 60_000);
  });

  it('🔴 POZITÍV KONTROLL: zaj-jelölés NÉLKÜL ugyanez BENT RAGAD (ez volt a hiba)', () => {
    const clock = makeClock();
    const tracker: VoiceSpeechInFlight = new VoiceSpeechInFlight(clock.now);
    const pending: DiscordInboundMessage[] = [realMessage(START_MS)];

    let flushedAtMs: number | null = null;

    for (let index: number = 0; index < 50; index += 1) {
      // ⛔ Ugyanaz a forgalom, de a kimenetel NEM zajnak jelölt — pontosan a 2026-09-12
      // éjszakai állapot (a szűrő előtt).
      playNoiseUtterance(tracker, clock, index, { markAsNoise: false });
      clock.advance(9_000);

      const decision = decideFlush({
        pending: pending,
        isBusyProcessing: false,
        queuedItemCount: 0,
        isSpeechInProgress: tracker.isInProgress(),
        now: new Date(clock.now()),
        config: DEFAULT_BATCH_CONFIG,
      });

      if (decision.shouldFlush && flushedAtMs === null) flushedAtMs = clock.now();
    }

    // ⭐ Enélkül a fenti teszt „zöld lenne" akkor is, ha a zaj-ág semmit nem tenne.
    // ⚠️ A 10 perc alatt a `maxHoldMs` (15 perc) sem jár le ⇒ semmi nem menti meg.
    expect(flushedAtMs).toBeNull();
  });

  it('⭐ AZ ABLAK HOSSZA VÁLTOZATLAN — a javítás ⛔ nem rövidítés', () => {
    // > Owner: „NE az ablak rövidítésével oldd meg — a cél nem gyorsabb, hanem zaj-immunis."
    expect(DEFAULT_BATCH_CONFIG.collectWindowMs).toBe(30_000);
    expect(DEFAULT_BATCH_CONFIG.maxHoldMs).toBe(15 * 60_000);

    const clock = makeClock();
    const tracker: VoiceSpeechInFlight = new VoiceSpeechInFlight(clock.now);

    // Zaj-özön MELLETT is: egy 10 másodperces üzenet ⛔ nem mehet ki — az ablak él.
    for (let index: number = 0; index < 20; index += 1) playNoiseUtterance(tracker, clock, index);

    const decision = decideFlush({
      pending: [realMessage(clock.now() - 10_000)],
      isBusyProcessing: false,
      queuedItemCount: 0,
      isSpeechInProgress: tracker.isInProgress(),
      now: new Date(clock.now()),
      config: DEFAULT_BATCH_CONFIG,
    });

    expect(decision.shouldFlush).toBeFalse();
    expect(decision.reason).toContain('Összegyűjtési ablak');
  });

  it('🎙️ EGY VALÓDI FELVÉTEL FELDOLGOZÁSA zaj-özönben IS visszatartja a köteget', () => {
    // ⚠️ A zaj-immunitás ⛔ nem jelenti azt, hogy mondat közben válaszolunk: amíg egy felvétel
    // TÉNYLEGESEN feldolgozás alatt van, a kapu zárva marad (owner, 2026-09-11 03:27).
    const clock = makeClock();
    const tracker: VoiceSpeechInFlight = new VoiceSpeechInFlight(clock.now);

    for (let index: number = 0; index < 20; index += 1) playNoiseUtterance(tracker, clock, index);

    expect(tracker.isInProgress()).toBeFalse();

    tracker.noteProcessingStarted('valodi.wav');

    expect(tracker.isInProgress()).toBeTrue();
    expect(tracker.diagnose().suppressedByNoise).toBeFalse();

    tracker.noteSettled({ filename: 'valodi.wav' });

    expect(tracker.isInProgress()).toBeFalse();
  });
});
