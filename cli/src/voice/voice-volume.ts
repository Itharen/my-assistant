// 🔊 A HANG-CSATORNA HANGERŐJE — egyetlen forrás, három helyről állítható.
//
// > **Owner, 2026-09-10 18:27:** *„…a My Assistant felületén is szeretném tudni állítani."*
//
// Három hozzáférési pont, **egy** tárolt érték:
//
// | ki | hogyan |
// |---|---|
// | az **agent** | `ma voice volume <érték>` |
// | az **owner a felületen** | `PUT /api/voice/volume` → a dashboard csúszkája |
// | a **kód** | `readVoiceVolume()` a lejátszás előtt |
//
// ## 🔴 MÉRT ÁLLAPOT, ami miatt ez a modul kellett (2026-09-10)
//
// A saját hang-jelzés-lejátszónk (`voice-cues.ts`) `inlineVolume: false`-szal hozta létre az
// erőforrást ⇒ **a hangerő egyáltalán nem volt állítható**, a fájl natív szintjén szólt.
// Vagyis a kérés nem „állítsuk át egy meglévő értéket", hanem **„egyáltalán legyen mit állítani"**.
//
// ## ⚠️ A handoff kérte, hogy nézzem meg a `settings.ccap.volume * 0.5` szorzót — MEGMÉRVE
//
// ⛔ **Az a szorzó NEM él.** A `cvo-main.control-service.ts:467-479` teljes blokkja
// **kommentben van**, és a `settings.ccap.volume` mező **nem is létezik** *(a `volume: 0.5` sor
// a `settings.const.ts:87`-ben szintén ki van kommentezve)* — ha élő kód lenne, **nem fordulna le**.
//
// ⭐ Ami az átemelt kódban TÉNYLEG él: `soundsVolume: 0.3` *(cvo-main:465)* és
// `greetingsVolume: 0.5` *(cvo-echo:155)*. A `settings.voice.output.defaultVolume` **1.0**.
//
// ⇒ **Ezért az alapérték 1.0**: ez az átemelt modul dokumentált alapértéke, ÉS ez egyezik a
// mai tényleges viselkedéssel *(natív szint = 1.0)*. Így a beállítás bevezetése **önmagában
// nem változtatja meg**, ahogy a rendszer ma szól — csak állíthatóvá teszi.
//
// 📌 Tárolás: `~/.config/my-assistant/voice/volume.json` — ⛔ nem a repóban *(gép-specifikus
// beállítás, ugyanaz a megfontolás, mint a Discord-kötegnél)*.

import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';

/**
 * Az alapértelmezett hangerő.
 *
 * ⭐ Az átemelt CCAP-modul `settings.voice.output.defaultVolume`-ja *(mérve: `1.0`)*, ami
 * egyben a mai tényleges szint is. ⛔ Ezt a számot **ne** „szebbre" igazítsuk: az egyezés a
 * mai viselkedéssel az egyetlen ok, amiért a bevezetés nem hallható változás.
 */
export const DEFAULT_VOICE_VOLUME: number = 1.0;

/** A legkisebb megengedett érték — a `0` a teljes elhallgatás, ez érvényes választás. */
export const MIN_VOICE_VOLUME: number = 0;

/**
 * A legnagyobb megengedett érték.
 *
 * ⚠️ Szándékosan **2.0**, nem `1.0`: a `@discordjs/voice` inline-hangereje **erősíthet is**.
 * Az owner panasza a hangerőre szólt — ha a forrás-fájl halk, az `1.0` plafon nem segítene.
 * ⛔ Feljebb nem megyünk: `2.0` fölött a digitális vágás hallható torzítást ad.
 */
export const MAX_VOICE_VOLUME: number = 2.0;

/** Egy hangerő-beállítás értelmezésének eredménye. */
export interface VoiceVolumeParse {
  ok: boolean;
  /** Az elfogadott érték — bukásnál az érintetlen alapérték. */
  value: number;
  /** MI a baj, ha nem `ok`. ⛔ Soha nem üres bukásnál. */
  detail?: string;
  /** MIT tegyen a hívó. */
  remedy?: string;
}

/**
 * Egy nyers bemenet értelmezése hangerővé. **Tiszta függvény.**
 *
 * ⛔ SZÁNDÉKOSAN NEM „csonkol csendben": a `3`-at NEM `2.0`-ra kerekítjük, hanem
 * **elutasítjuk**. Aki `3`-at ír, félreérti a skálát — ha némán 2.0 lenne belőle, azt hinné,
 * hogy a `3` „működött", és a következő próbája `5` lenne. A hiba-üzenet tanít, a csendes
 * csonkolás félrevezet.
 *
 * @param raw a bemenet — szöveg vagy szám.
 * @param current a jelenlegi érték, amit bukás esetén megtartunk.
 */
export function parseVoiceVolume(raw: unknown, current: number = DEFAULT_VOICE_VOLUME): VoiceVolumeParse {
  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    return {
      ok: false,
      value: current,
      detail: 'Nem adtál meg értéket.',
      remedy: `Adj meg egy számot ${MIN_VOICE_VOLUME} és ${MAX_VOICE_VOLUME} között (pl. 0.6).`,
    };
  }
  const parsed: number = typeof raw === 'number' ? raw : Number(String(raw).trim().replace(',', '.'));

  if (!Number.isFinite(parsed)) {
    return {
      ok: false,
      value: current,
      detail: `A(z) „${String(raw)}" nem szám.`,
      remedy: `Adj meg egy számot ${MIN_VOICE_VOLUME} és ${MAX_VOICE_VOLUME} között (pl. 0.6).`,
    };
  }

  if (parsed < MIN_VOICE_VOLUME || parsed > MAX_VOICE_VOLUME) {
    return {
      ok: false,
      value: current,
      detail: `A(z) ${parsed} kívül van a megengedett sávon (${MIN_VOICE_VOLUME}–${MAX_VOICE_VOLUME}).`,
      remedy: `A ${MAX_VOICE_VOLUME} a plafon: fölötte a digitális vágás hallhatóan torzít.`,
    };
  }

  // ⚠️ Két tizedesre kerekítünk: a `0.6000000000000001` egy `0.6`-os bemenetből jönne, és a
  // visszaolvasásnál az owner MÁST látna, mint amit beírt.
  return { ok: true, value: Math.round(parsed * 100) / 100 };
}

/** A tárolt beállítás alakja a lemezen. */
export interface VoiceVolumeFile {
  volume: number;
  /** Ki állította utoljára — `agent` vagy `owner`. Csak naplóhoz, a döntést nem érinti. */
  setBy?: string;
  updatedAt?: string;
}

/** A beállítás fájlja. */
export function resolveVoiceVolumePath(userHome: string = homedir()): string {
  return join(userHome, '.config', 'my-assistant', 'voice', 'volume.json');
}

/**
 * A jelenlegi hangerő.
 *
 * Sorrend: **környezeti változó → fájl → alapérték.** ⚠️ A `MA_VOICE_VOLUME` a legfelső, hogy
 * egy próba vagy egy teszt a fájl elpiszkítása nélkül tudjon mást beállítani.
 *
 * ⛔ **Nem dob**: a hangerő olvasása sosem buktathatja meg a lejátszást. Hibás fájlnál az
 * alapérték jön — de a hiba **naplózva**, mert különben az owner beállítása némán tűnne el.
 */
export async function readVoiceVolume(path: string = resolveVoiceVolumePath()): Promise<number> {
  const fromEnv: VoiceVolumeParse = parseVoiceVolume(process.env['MA_VOICE_VOLUME']);

  if (fromEnv.ok) return fromEnv.value;

  if (!existsSync(path)) return DEFAULT_VOICE_VOLUME;

  try {
    const parsed: VoiceVolumeFile = JSON.parse(await readFile(path, 'utf-8')) as VoiceVolumeFile;
    const fromFile: VoiceVolumeParse = parseVoiceVolume(parsed.volume);

    return fromFile.ok ? fromFile.value : DEFAULT_VOICE_VOLUME;
  } catch (err) {
    SwallowedFailure_Util.report('voice.volume.read', err);

    return DEFAULT_VOICE_VOLUME;
  }
}

/**
 * A hangerő eltárolása.
 *
 * ⚠️ Átmeneti fájl + átnevezés: egy megszakadt írás nem hagyhat félkész beállítást, mert
 * onnantól minden indulás az alapértékre esne vissza — csendben.
 *
 * @returns az értelmezés eredménye. Hibás bemenetnél ⛔ **nem írunk**.
 */
export async function writeVoiceVolume(
  raw: unknown,
  setBy: string = 'agent',
  path: string = resolveVoiceVolumePath(),
  now: Date = new Date(),
): Promise<VoiceVolumeParse> {
  const current: number = await readVoiceVolume(path);
  const parsed: VoiceVolumeParse = parseVoiceVolume(raw, current);

  if (!parsed.ok) return parsed;

  const body: VoiceVolumeFile = {
    volume: parsed.value,
    setBy: setBy,
    updatedAt: now.toISOString(),
  };
  const temporary: string = `${path}.tmp`;

  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(body, null, 2)}\n`, 'utf-8');
  await rename(temporary, path);

  return parsed;
}
