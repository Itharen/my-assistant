// A felolvasó tesztjei.
//
// ⭐ A LEGFONTOSABB ÁLLÍTÁS: a felolvasás **kísérő** funkció — ha elhasal, ⛔ nem viheti
// magával az üzenet-kézbesítést. De ⛔ nem is néma: a `detail` mindig megmondja, mi történt.
//
// ⚠️ A valódi ElevenLabs-hívást **nem** indítjuk el: a szintetizáló injektálható, mert a
// hálózat nem teszt-elem, és minden hívás **kvótát fogyaszt**.
//
// 🔴 2026-09-11: ÁTÍRVA A V3-AS SZERZŐDÉSRE. Korábban az átemelt
// `convertTextToSpeechSimple(text, voiceId)` alakot utánozta — az a réteg **soha nem szólalt
// meg** *(`xi-api-` prefix-ellenőrzés vs. `sk_` kulcs)*, ezért a felolvasó a saját V3-as
// kliensünket hívja.

import { AudioPlayerStatus, type AudioPlayer } from '@discordjs/voice';

import { DEFAULT_SPEECH_VOICE_ID, speakInVoiceChannel } from './voice-speaker.js';

/** Lejátszó-utánzat: csak az állapotot és a `play` hívást figyeljük. */
function fakePlayer(status: AudioPlayerStatus = AudioPlayerStatus.Idle): AudioPlayer & { played: number } {
  const player = {
    state: { status: status },
    played: 0,
    play(): void {
      player.played += 1;
    },
  };

  return player as unknown as AudioPlayer & { played: number };
}

/** Amit a szintetizáló ad vissza — a V3-as kliens szerződése. */
interface FakeOutcome {
  ok: boolean;
  audio?: Buffer;
  detail: string;
  sentCharacters?: number;
  modelId?: string;
}

/** Szintetizáló-utánzat. A hívást is elkapjuk, hogy a paramétereket ellenőrizhessük. */
function fakeSynthesize(overrides: Partial<FakeOutcome> = {}): {
  fn: (input: { text: string; voiceId: string; apiKey: string; modelId?: string }) => Promise<FakeOutcome>;
  calls: { text: string; voiceId: string; apiKey: string; modelId?: string }[];
} {
  const calls: { text: string; voiceId: string; apiKey: string; modelId?: string }[] = [];

  return {
    calls: calls,
    fn: async (input): Promise<FakeOutcome> => {
      calls.push(input);

      return {
        ok: true,
        audio: Buffer.from([1, 2, 3, 4]),
        detail: 'Szintetizálva (4 bájt, modell: eleven_v3).',
        sentCharacters: 12,
        modelId: 'eleven_v3',
        ...overrides,
      };
    },
  };
}

const volume = async (): Promise<number> => 0.8;

describe('speakInVoiceChannel', () => {

  const savedVoice: string | undefined = process.env['MA_ELEVENLABS_VOICE_ID'];
  const savedKey: string | undefined = process.env['FDP_ELEVENLABS_API_KEY'];
  const savedModel: string | undefined = process.env['MA_ELEVENLABS_MODEL_ID'];

  beforeEach((): void => {
    process.env['MA_ELEVENLABS_VOICE_ID'] = 'teszt-hang';
    process.env['FDP_ELEVENLABS_API_KEY'] = 'sk_teszt';
    delete process.env['MA_ELEVENLABS_MODEL_ID'];
  });

  afterEach((): void => {
    for (const [key, value] of [
      ['MA_ELEVENLABS_VOICE_ID', savedVoice],
      ['FDP_ELEVENLABS_API_KEY', savedKey],
      ['MA_ELEVENLABS_MODEL_ID', savedModel],
    ] as const) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('⭐ sikeres szintézisnél LEJÁTSZIK, és megmondja, mennyi karaktert küldött', async (): Promise<void> => {
    const player = fakePlayer();
    const tts = fakeSynthesize();
    const result = await speakInVoiceChannel({ text: 'Kész a javítás.', player }, tts.fn, volume);

    expect(result.spoken).toBeTrue();
    expect(player.played).toBe(1);
    // ⭐ A kvóta MÉRT fogyása — enélkül csak a hónap végén derülne ki, hogy elfogyott.
    expect(result.characterCount).toBe(12);
  });

  it('⭐ a MODELL benne van a részletben — a naplóból ki kell derülnie, hogy a V3 szólt', async (): Promise<void> => {
    // 🔴 Ez a lényeg az owner-korrekció után: nem elég megszólalni, azt is tudni kell,
    // hogy MELYIK integráció szólalt meg — a régi vagy a V3.
    const result = await speakInVoiceChannel(
      { text: 'Szia.', player: fakePlayer() },
      fakeSynthesize().fn,
      volume,
    );

    expect(result.detail).toContain('eleven_v3');
  });

  describe('mit ad át a szintetizálónak', () => {

    it('a hangot és a kulcsot a KÖRNYEZETBŐL veszi', async (): Promise<void> => {
      const tts = fakeSynthesize();

      await speakInVoiceChannel({ text: 'Szia.', player: fakePlayer() }, tts.fn, volume);

      expect(tts.calls[0]?.voiceId).toBe('teszt-hang');
      expect(tts.calls[0]?.apiKey).toBe('sk_teszt');
    });

    it('⚠️ a modellt CSAK akkor adja át, ha be van állítva — különben a kliens alapértéke dönt', async (): Promise<void> => {
      const withoutOverride = fakeSynthesize();

      await speakInVoiceChannel({ text: 'Szia.', player: fakePlayer() }, withoutOverride.fn, volume);
      expect(withoutOverride.calls[0]?.modelId).toBeUndefined();

      process.env['MA_ELEVENLABS_MODEL_ID'] = 'eleven_multilingual_v2';
      const withOverride = fakeSynthesize();

      await speakInVoiceChannel({ text: 'Szia.', player: fakePlayer() }, withOverride.fn, volume);
      expect(withOverride.calls[0]?.modelId).toBe('eleven_multilingual_v2');
    });

    it('hang-azonosító nélkül az ALAPÉRTÉK megy — ⛔ nem üres sztring', async (): Promise<void> => {
      delete process.env['MA_ELEVENLABS_VOICE_ID'];
      const tts = fakeSynthesize();

      await speakInVoiceChannel({ text: 'Szia.', player: fakePlayer() }, tts.fn, volume);

      expect(tts.calls[0]?.voiceId).toBe(DEFAULT_SPEECH_VOICE_ID);
    });
  });

  it('⚠️ ha ÉPP SZÓL valami, NEM vág bele', async (): Promise<void> => {
    // Két egymásra futó felolvasás hangban értelmezhetetlen kása — a második üzenet
    // ugyanúgy ott van írásban.
    const player = fakePlayer(AudioPlayerStatus.Playing);
    const result = await speakInVoiceChannel({ text: 'Második.', player }, fakeSynthesize().fn, volume);

    expect(result.spoken).toBeFalse();
    expect(player.played).toBe(0);
    expect(result.detail).toContain('Épp szól');
  });

  it('üres szövegre nem szól meg', async (): Promise<void> => {
    const player = fakePlayer();

    expect((await speakInVoiceChannel({ text: '   ', player }, fakeSynthesize().fn, volume)).spoken)
      .toBeFalse();
    expect(player.played).toBe(0);
  });

  describe('⛔ a bukás nem viszi magával a kézbesítést — de NEM is néma', () => {

    it('sikertelen szintézisnél `spoken: false` + OK, ⛔ nem dob', async (): Promise<void> => {
      const player = fakePlayer();
      const result = await speakInVoiceChannel(
        { text: 'Valami.', player },
        fakeSynthesize({ ok: false, audio: undefined, detail: 'kvóta elfogyott' }).fn,
        volume,
      );

      expect(result.spoken).toBeFalse();
      expect(result.detail).toContain('kvóta elfogyott');
      expect(player.played).toBe(0);
    });

    it('HANG NÉLKÜLI „siker" sem játszik le — a néma lejátszás hazug siker lenne', async (): Promise<void> => {
      const result = await speakInVoiceChannel(
        { text: 'Valami.', player: fakePlayer() },
        fakeSynthesize({ ok: true, audio: undefined, detail: 'üres' }).fn,
        volume,
      );

      expect(result.spoken).toBeFalse();
    });

    it('a szintetizáló KIVÉTELÉT elkapja, és leíró eredményt ad', async (): Promise<void> => {
      const failing = async (): Promise<never> => {
        throw new Error('a hálózat elszállt');
      };
      const result = await speakInVoiceChannel({ text: 'x', player: fakePlayer() }, failing, volume);

      expect(result.spoken).toBeFalse();
      expect(result.detail).toContain('a hálózat elszállt');
    });
  });

  it('a hang azonosítója felülírható, de van működő alapérték', () => {
    // ⚠️ A hang OWNER-DÖNTÉS (T-77: „a hangjelentések az övéi") — ezért nem égetjük be
    // véglegesen; az alapérték csak egy működő kiindulás.
    expect(DEFAULT_SPEECH_VOICE_ID.length).toBeGreaterThan(10);
  });
});
