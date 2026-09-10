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
// 🔴 **2026-09-11: ÁTKÖTVE A V3-AS SAJÁT KLIENSRE** *(`voice-tts.client.ts`)*.
//
// Korábban az átemelt `EL_TextToSpeech_ControlService`-t hívtuk. Az **soha nem szólalt meg**:
// a `el.api-service.ts:91-94` a kulcsot `xi-api-` prefixhez kötötte, az owner kulcsa viszont
// `sk_`-val kezdődik ⇒ `isInitialized = false` ⇒ `'Service not initialized'` minden hívásra.
//
// > **Owner-korrekció (2026-09-10 21:46):** *„nem a V3 Eleven Labs lett leimplementálva, hanem
// > a régi Fors, ami sosem működött jól."* ⇒ ⛔ **nem a prefixet lazítottuk**, hanem V3-ra
// > váltottunk, a hivatalos SDK-val.
//
// ⚠️ `transplant-not-rewrite`: az átemelt fához **NEM nyúltunk** — az új kliens **mellé** került,
// és ez a modul többé nem hívja a régi utat. ⭐ Ezzel a kulcsot naplózó sor
// *(`el-text-to-speech.control-service.ts:46`)* sem fut le többé.

import { Readable } from 'node:stream';

import { AudioPlayerStatus, createAudioResource, StreamType, type AudioPlayer } from '@discordjs/voice';

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { VoiceTts_Client } from './voice-tts.client.js';
import { readVoiceVolume } from './voice-volume.js';

/**
 * A használt hang azonosítója.
 *
 * ⚠️ A `MA_ELEVENLABS_VOICE_ID` környezeti változóból — ⭐ **ezt az owner MÁR beállította**
 * a `.env`-ben, ezért ezt a nevet használjuk, és ⛔ nem vezetünk be másikat: két külön kulcs
 * azt jelentené, hogy az ő beállítása némán hatástalan.
 *
 * Az alapérték csak akkor él, ha nincs beállítva — ⛔ ez **nem** választás a nevében.
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
  synthesize: typeof VoiceTts_Client.synthesize = VoiceTts_Client.synthesize,
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
    // ⭐ AZ OWNER MÁR BEÁLLÍTOTTA: a `.env`-ben ott van a `MA_ELEVENLABS_VOICE_ID`. ⛔ Nem
    // vezetek be helyette új nevet — a hang **owner-döntés** (T-77: „a hangjelentések az
    // övéi"), és két külön kulcs azt jelentené, hogy az ő beállítása némán hatástalan.
    const voiceId: string = (process.env['MA_ELEVENLABS_VOICE_ID'] ?? '').trim()
      || DEFAULT_SPEECH_VOICE_ID;
    const result = await synthesize({
      text: text,
      voiceId: voiceId,
      apiKey: (process.env['FDP_ELEVENLABS_API_KEY'] ?? '').trim(),
      // ⚠️ A modell felülírható — mérve a V3 kétszer lassabb (3 543 ms vs. 1 680 ms).
      ...(((process.env['MA_ELEVENLABS_MODEL_ID'] ?? '').trim())
        ? { modelId: (process.env['MA_ELEVENLABS_MODEL_ID'] ?? '').trim() }
        : {}),
    });

    if (!result.ok || !result.audio) {
      // 🔒 A `detail` az SDK hibája + a modell — ⛔ a KULCS SOSEM kerül bele.
      return { spoken: false, detail: `A beszéd-szintézis nem sikerült: ${result.detail}` };
    }

    // ⚠️ `inlineVolume: true` — a hangerő ITT is állítható legyen, ugyanabból a beállításból,
    // mint a jelzések. Két külön hangerő két külön panaszt szülne.
    const resource = createAudioResource(Readable.from(result.audio), {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
    });

    resource.volume?.setVolume(await readVolume());
    request.player.play(resource);

    return {
      spoken: true,
      // ⭐ A MODELL BENNE VAN: a naplóból ki kell derülnie, hogy tényleg a V3 szólalt meg.
      detail: `Felolvasva (${text.length} karakter, modell: ${result.modelId ?? '?'}).`,
      ...(result.sentCharacters === undefined ? {} : { characterCount: result.sentCharacters }),
    };
  } catch (err: unknown) {
    SwallowedFailure_Util.report('voice.speaker.speak', err);

    return {
      spoken: false,
      detail: `A felolvasás elszállt: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
