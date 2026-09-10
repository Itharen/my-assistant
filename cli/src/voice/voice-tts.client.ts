// 🔊 ELEVENLABS **V3** BESZÉD-SZINTÉZIS — a saját kliensünk, az átemelt réteg MELLETT.
//
// > **Owner, 2026-09-10 21:46:** *„nem a V3 Eleven Labs lett leimplementálva, hanem a régi
// > Fors, ami sosem működött jól. A régi fosnál volt ez a XI, a Pi, mit tudom én micsoda,
// > amit hogyha kell, akkor neked kell hozzáfűzni majd."*
//
// > **Owner, 2026-09-10 23:53:** *„Most már jó lenne, ha meg tudnál megszólalni lassan."*
//
// ## 🔴 MIÉRT KELLETT ÚJ KLIENS — a MÉRT gyökér
//
// Az átemelt `el.api-service.ts:91-94` a kulcsot **`xi-api-`** prefixhez kötötte:
//
// ```ts
// if (!trimmedKey.startsWith('xi-api-')) { throw new Error('Invalid … must start with "xi-api-"'); }
// ```
//
// Az owner kulcsa **`sk_`**-val kezdődik *(ez az ElevenLabs jelenlegi formátuma)* ⇒ a
// `configure()` dobott ⇒ `isInitialized = false` ⇒ a szintézis **mindig**
// `{ success: false, error: 'Service not initialized' }`-t adott ⇒ a rendszer **néma maradt**.
//
// ⛔ **A prefix-ellenőrzés lazítása NEM megoldás** — owner-korrekció: az a *régi* integrációt
// tartaná életben. Ezért a V3-as útra váltunk, a **hivatalos SDK-val**.
//
// ## ⭐ MÉRVE (2026-09-11 00:45), nem feltételezve
//
// | mérés | eredmény |
// |---|---|
// | a kulcs | `sk_`, 51 karakter — az SDK **elfogadja** |
// | elérhető TTS-modellek | 7, köztük **`eleven_v3`** *(„Eleven v3")* és `eleven_v3_conversational` |
// | `eleven_v3` szintézis az owner hangjával | ✅ 12 582 bájt, **3 543 ms** |
// | `eleven_multilingual_v2` ugyanarra | ✅ 15 090 bájt, **1 680 ms** |
//
// ⚠️ **A V3 kétszer lassabb** — ezért a modell **környezeti változóval felülírható**
// *(`MA_ELEVENLABS_MODEL_ID`)*. ⛔ A választás **owner-döntés**; az alapérték a kért V3.
//
// ## 🔒 A KULCS ÉRTÉKE SOHA NEM MEHET NAPLÓBA
//
// Az átemelt `el-text-to-speech.control-service.ts:46` **kiírja** a kulcsot
// *(`DyFM_Log.error('❌ … not initialized', envKeys.elevenLabs.apiKey)`)*. ⭐ Ez a modul
// **nem hívja** azt a kódot, tehát az az útvonal többé nem fut le. Amit mi naplózunk, az
// kizárólag a **hossz és a prefix** — abból a hiba diagnosztizálható, a kulcs nem.
//
// ⛔ A kulcs **rotációja owner-döntés** (`core-secret-rotation-owner-only`) — hozzá nem nyúlunk.

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

/** A szintézis eredménye. ⚠️ Szándékosan NEM exportált: a fájl egyetlen exportja a kliens. */
interface SynthesisOutcome {
  ok: boolean;
  /** A hang bájtjai — csak `ok: true` esetén. */
  audio?: Buffer;
  /** MI történt. ⛔ Bukásnál soha nem üres, és ⛔ SOSEM tartalmazza a kulcsot. */
  detail: string;
  /** Hány karaktert KÜLDTÜNK — ⚠️ ez a mi mérésünk, nem a szolgáltató elszámolása. */
  sentCharacters?: number;
  /** Melyik modell felelt — a naplóból ki kell derülnie, hogy tényleg a V3 szólt. */
  modelId?: string;
}

/** ElevenLabs V3 beszéd-szintézis. */
export class VoiceTts_Client {

  /**
   * Az alapértelmezett modell — **a kért V3**.
   *
   * ⭐ Mérve: `eleven_v3` létező, TTS-képes modell, és az owner hangjával működik.
   */
  static readonly DEFAULT_MODEL_ID: string = 'eleven_v3';

  /**
   * A kimeneti formátum.
   *
   * ⚠️ `mp3_44100_128`: a Discord-lejátszó `StreamType.Arbitrary`-vel `ffmpeg`-en át dekódol,
   * és az mp3 a bevett út a jelzéseknél is. Mérve: ez a formátum működik a fiókkal.
   */
  static readonly OUTPUT_FORMAT = 'mp3_44100_128' as const;

  /**
   * A kulcs BIZTONSÁGOS leírása — naplóhoz.
   *
   * 🔒 **Tiszta függvény, és SOSEM adja vissza az értéket.** Csak a hosszt és az első három
   * karaktert *(a formátum-családot)* — ennyi elég a „jó formátumú kulcs van-e" kérdéshez.
   *
   * 🔴 MIÉRT LÉTEZIK EGYÁLTALÁN: az átemelt kód a hibaüzenetbe **beírta a teljes kulcsot**, és
   * az bekerült a szerver naplójába. A diagnosztika és a titok-szivárgás közötti határ pontosan
   * ez a függvény.
   */
  static describeKey(apiKey: string): string {
    const trimmed: string = apiKey.trim();

    if (!trimmed) return 'nincs beállítva';

    return `hossz ${trimmed.length}, prefix "${trimmed.slice(0, 3)}"`;
  }

  /**
   * A használandó modell azonosítója.
   *
   * @param override a `MA_ELEVENLABS_MODEL_ID` értéke, ha van.
   *
   * ⭐ Tiszta függvény. Az owner felülírhatja *(pl. `eleven_multilingual_v2`, ha a V3
   * késleltetése zavarja)* — de az alapérték az, amit kért.
   */
  static resolveModelId(override: string | undefined): string {
    return (override ?? '').trim() || VoiceTts_Client.DEFAULT_MODEL_ID;
  }

  /**
   * Szöveg → hang.
   *
   * @param input `text` a kimondandó szöveg; `voiceId` a hang; `apiKey` a kulcs.
   * @returns a hang bájtjai, vagy leíró bukás.
   *
   * ⛔ **Hibát NEM dob.** A felolvasás **kísérő** funkció: ha elhasal, az nem viheti magával az
   * üzenet-kézbesítést — a szöveg a csatornában akkor is ott van. ⚠️ De ⛔ nem is néma: a
   * `detail` megmondja, mi történt.
   */
  static async synthesize(input: {
    text: string;
    voiceId: string;
    apiKey: string;
    modelId?: string;
  }): Promise<SynthesisOutcome> {
    const text: string = input.text.trim();
    const apiKey: string = input.apiKey.trim();
    const voiceId: string = input.voiceId.trim();

    if (!text) {
      return { ok: false, detail: 'Nincs kimondható szöveg.' };
    }

    if (!apiKey) {
      // 🔒 A hiba a kulcs HIÁNYÁRÓL szól — az értékéről semmit nem mond.
      return {
        ok: false,
        detail: 'Nincs ElevenLabs API-kulcs (FDP_ELEVENLABS_API_KEY).',
      };
    }

    if (!voiceId) {
      return {
        ok: false,
        detail: 'Nincs hang-azonosító (MA_ELEVENLABS_VOICE_ID).',
      };
    }
    const modelId: string = VoiceTts_Client.resolveModelId(input.modelId);

    try {
      const client: ElevenLabsClient = new ElevenLabsClient({ apiKey: apiKey });
      const stream = await client.textToSpeech.convert(voiceId, {
        text: text,
        modelId: modelId,
        outputFormat: VoiceTts_Client.OUTPUT_FORMAT,
      });
      const audio: Buffer = await VoiceTts_Client.collect(stream);

      if (!audio.length) {
        // ⚠️ A NULLA BÁJTOS válasz „siker"-ként jönne vissza, pedig a néma lejátszás hazug
        // siker: a hívó azt hinné, hogy megszólalt.
        return { ok: false, detail: 'A szolgáltatás ÜRES hangot adott vissza.', modelId: modelId };
      }

      return {
        ok: true,
        audio: audio,
        detail: `Szintetizálva (${audio.length} bájt, modell: ${modelId}).`,
        sentCharacters: text.length,
        modelId: modelId,
      };
    } catch (err: unknown) {
      // 🔒 A kivétel szövege az SDK-tól jön. ⚠️ Egy hibás kérés visszhangozhatná a fejléceket,
      // ezért a hosszt korlátozzuk, és a kulcsot SOHA nem tesszük hozzá.
      const message: string = err instanceof Error ? err.message : String(err);

      return {
        ok: false,
        detail: `A szintézis elbukott (modell: ${modelId}): ${message.slice(0, 300)}`,
        modelId: modelId,
      };
    }
  }

  /**
   * A folyam összegyűjtése egy pufferbe.
   *
   * ⚠️ Az SDK `ReadableStream`-et ad, a Discord-lejátszó viszont egy összefüggő forrást szeret
   * *(a darabolt átadásnál a `ffmpeg` a rövid jelzéseken alul-pufferelt)*. A beszéd néhány tíz
   * kilobájt — a memóriában tartása itt nem kérdés.
   */
  private static async collect(stream: unknown): Promise<Buffer> {
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
}
