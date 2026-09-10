// 🔊 A FELOLVASÁS — a kimondható szövegből hang a hang-csatornában.
//
// > **Owner, 2026-09-10 18:27:** *„És a voice-ra, hogyha ott vagyok, akkor **fel is olvasod**."*
//
// ## A lánc
//
// ```
// kimenő üzenet → prepareSpeechText (tiszta) → decideReadAloud (tiszta) → EZ A MODUL
//                                                                          ↓
//                                        ElevenLabs TTS → mp3 puffer → Discord hang-kapcsolat
// ```
//
// ⛔ **AZ ÁTEMELT ELEVENLABS-KÓDHOZ NEM NYÚLUNK** — csak **hívjuk**
// *(`transplant-not-rewrite`)*. A `EL_TextToSpeech_ControlService` megvan, működik, és az
// API-kulcsot maga olvassa a `FDP_ELEVENLABS_API_KEY`-ből.
//
// ⚠️ A betöltés **lusta**, változóban tartott hivatkozással — ugyanaz a mért ok, mint a
// felvevőnél *(`voice-channel-recorder.ts`)*: literállal a TypeScript **belehúzná** az átemelt
// fát a fő, `strict` programba, és a hidegindítás sem mehet a figyelő indulási útjára.

import { Readable } from 'node:stream';

import { AudioPlayerStatus, createAudioResource, StreamType, type AudioPlayer } from '@discordjs/voice';

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { readVoiceVolume } from './voice-volume.js';

/**
 * A használt hang azonosítója.
 *
 * ⚠️ Környezeti változóból, alapértékkel: a hang **owner-döntés** *(T-77 mintájára: „a
 * hangjelentések az övéi")*, ezért nem égetjük be véglegesen. Az alapérték az ElevenLabs
 * `Rachel` hangja — ⛔ ez **nem** választás a nevében, csak egy működő kiindulás, amíg nem
 * mond mást.
 */
export const DEFAULT_SPEECH_VOICE_ID: string = '21m00Tcm4TlvDq8ikWAM';

/** Amit a felolvasáshoz tudni kell. */
export interface SpeakRequest {
  /** A MÁR kimondhatóvá alakított szöveg *(`prepareSpeechText`)*. */
  text: string;
  /** A lejátszó, ami a hang-kapcsolatra van kötve. */
  player: AudioPlayer;
}

/** A felolvasás kimenetele. */
export interface SpeakResult {
  spoken: boolean;
  detail: string;
  /** Hány karaktert használtunk el — ⭐ a kvóta MÉRT fogyása, nem becsült. */
  characterCount?: number;
}

/** Az átemelt TTS-szolgáltatás alakja — ⛔ csak amennyit HASZNÁLUNK belőle. */
interface TransplantedTextToSpeech {
  convertTextToSpeechSimple(text: string, voiceId: string): Promise<{
    success: boolean;
    audioBuffer?: Buffer;
    characterCount?: number;
    error?: string;
  }>;
}

/**
 * Az átemelt ElevenLabs TTS singleton lusta betöltése.
 *
 * 🔴 A HIVATKOZÁS SZÁNDÉKOSAN VÁLTOZÓBAN ÁLL, nem sztring-literálban — különben a TypeScript
 * belehúzná az átemelt fát a fő, `strict` programba. Ugyanaz a mért ok, mint a felvevőnél.
 */
export async function loadTransplantedTextToSpeech(): Promise<TransplantedTextToSpeech> {
  const specifier: string = '../_modules/elevenlabs/_services/el-text-to-speech.control-service.js';
  const module = await import(specifier) as {
    EL_TextToSpeech_ControlService: { getInstance(): TransplantedTextToSpeech };
  };

  return module.EL_TextToSpeech_ControlService.getInstance();
}

/**
 * A szöveg felolvasása a hang-csatornába.
 *
 * ⛔ **Hibát NEM dob.** A felolvasás **kísérő** funkció: ha elhasal, az nem viheti magával az
 * üzenet-kézbesítést — a szöveg a csatornában akkor is ott van. *(Ugyanaz az elv, mint a
 * keretenkénti sávnál: „a diagnosztika sosem buktathatja meg azt, amit megfigyel".)*
 *
 * ⚠️ De ⛔ **nem is néma**: a `detail` megmondja, mi történt, és a bukás naplózódik. Egy néma
 * felolvasás-hiba pontosan úgy néz ki, mint egy csendben lévő rendszer.
 */
export async function speakInVoiceChannel(
  request: SpeakRequest,
  loadTts: () => Promise<TransplantedTextToSpeech> = loadTransplantedTextToSpeech,
  readVolume: () => Promise<number> = readVoiceVolume,
): Promise<SpeakResult> {
  const text: string = request.text.trim();

  if (!text) {
    return { spoken: false, detail: 'Nincs kimondható szöveg.' };
  }

  // ⚠️ HA ÉPP SZÓL VALAMI, NEM VÁGUNK BELE. Két egymásra futó felolvasás hangban
  // értelmezhetetlen kása — és a második üzenet ugyanúgy ott van írásban.
  if (request.player.state.status !== AudioPlayerStatus.Idle) {
    return { spoken: false, detail: 'Épp szól valami — ezt nem olvasom bele.' };
  }

  try {
    const tts: TransplantedTextToSpeech = await loadTts();
    const voiceId: string = (process.env['MA_SPEECH_VOICE_ID'] ?? '').trim() || DEFAULT_SPEECH_VOICE_ID;
    const result = await tts.convertTextToSpeechSimple(text, voiceId);

    if (!result.success || !result.audioBuffer || result.audioBuffer.length === 0) {
      return {
        spoken: false,
        detail: `A beszéd-szintézis nem sikerült: ${result.error ?? '(nincs részlet)'}`,
      };
    }

    // ⚠️ `inlineVolume: true` — a hangerő ITT is állítható legyen, ugyanabból a beállításból,
    // mint a jelzések. Két külön hangerő két külön panaszt szülne.
    const resource = createAudioResource(Readable.from(result.audioBuffer), {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
    });

    resource.volume?.setVolume(await readVolume());
    request.player.play(resource);

    return {
      spoken: true,
      detail: `Felolvasva (${text.length} karakter).`,
      ...(result.characterCount === undefined ? {} : { characterCount: result.characterCount }),
    };
  } catch (err: unknown) {
    SwallowedFailure_Util.report('voice.speaker.speak', err);

    return {
      spoken: false,
      detail: `A felolvasás elszállt: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
