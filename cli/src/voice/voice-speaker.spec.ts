// A felolvasó tesztjei.
//
// ⭐ A LEGFONTOSABB ÁLLÍTÁS: a felolvasás **kísérő** funkció — ha elhasal, ⛔ nem viheti
// magával az üzenet-kézbesítést. De ⛔ nem is néma: a `detail` mindig megmondja, mi történt.
//
// ⚠️ A valódi ElevenLabs-hívást **nem** indítjuk el: a betöltő injektálható, mert (a) a
// hálózat nem teszteselem, és (b) az átemelt fa hidegindítása 19,5 s.

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

function fakeTts(overrides: Record<string, unknown> = {}) {
  return async (): Promise<{
    convertTextToSpeechSimple: (text: string, voiceId: string) => Promise<{
      success: boolean;
      audioBuffer?: Buffer;
      characterCount?: number;
      error?: string;
    }>;
  }> => ({
    convertTextToSpeechSimple: async () => ({
      success: true,
      audioBuffer: Buffer.from([1, 2, 3, 4]),
      characterCount: 12,
      ...overrides,
    }),
  });
}

const volume = async (): Promise<number> => 0.8;

describe('speakInVoiceChannel', () => {

  it('⭐ sikeres szintézisnél LEJÁTSZIK, és megmondja, mennyi karaktert használt', async (): Promise<void> => {
    const player = fakePlayer();
    const result = await speakInVoiceChannel({ text: 'Kész a javítás.', player }, fakeTts(), volume);

    expect(result.spoken).toBeTrue();
    expect(player.played).toBe(1);
    // ⭐ A kvóta MÉRT fogyása — enélkül csak a hónap végén derülne ki, hogy elfogyott.
    expect(result.characterCount).toBe(12);
  });

  it('⚠️ ha ÉPP SZÓL valami, NEM vág bele', async (): Promise<void> => {
    // Két egymásra futó felolvasás hangban értelmezhetetlen kása — a második üzenet
    // ugyanúgy ott van írásban.
    const player = fakePlayer(AudioPlayerStatus.Playing);
    const result = await speakInVoiceChannel({ text: 'Második.', player }, fakeTts(), volume);

    expect(result.spoken).toBeFalse();
    expect(player.played).toBe(0);
    expect(result.detail).toContain('Épp szól');
  });

  it('üres szövegre nem szól meg', async (): Promise<void> => {
    const player = fakePlayer();

    expect((await speakInVoiceChannel({ text: '   ', player }, fakeTts(), volume)).spoken).toBeFalse();
    expect(player.played).toBe(0);
  });

  describe('⛔ a bukás nem viszi magával a kézbesítést — de NEM is néma', () => {

    it('sikertelen szintézisnél `spoken: false` + OK, ⛔ nem dob', async (): Promise<void> => {
      const player = fakePlayer();
      const result = await speakInVoiceChannel(
        { text: 'Valami.', player },
        fakeTts({ success: false, audioBuffer: undefined, error: 'kvóta elfogyott' }),
        volume,
      );

      expect(result.spoken).toBeFalse();
      expect(result.detail).toContain('kvóta elfogyott');
      expect(player.played).toBe(0);
    });

    it('ÜRES hang-puffernél sem játszik le — a néma lejátszás hazug siker lenne', async (): Promise<void> => {
      const result = await speakInVoiceChannel(
        { text: 'Valami.', player: fakePlayer() },
        fakeTts({ audioBuffer: Buffer.alloc(0) }),
        volume,
      );

      expect(result.spoken).toBeFalse();
    });

    it('a betöltő KIVÉTELÉT elkapja, és leíró eredményt ad', async (): Promise<void> => {
      const failing = async (): Promise<never> => {
        throw new Error('a modul nem tölthető be');
      };
      const result = await speakInVoiceChannel({ text: 'x', player: fakePlayer() }, failing, volume);

      expect(result.spoken).toBeFalse();
      expect(result.detail).toContain('nem tölthető be');
    });
  });

  it('a hang azonosítója felülírható, de van működő alapérték', () => {
    // ⚠️ A hang OWNER-DÖNTÉS (T-77: „a hangjelentések az övéi") — ezért nem égetjük be
    // véglegesen; az alapérték csak egy működő kiindulás.
    expect(DEFAULT_SPEECH_VOICE_ID.length).toBeGreaterThan(10);
  });
});
