// ⏱️ A TÜRELMI IDŐ — meddig várunk, miután az owner elhallgatott.
//
// > **Owner, 2026-09-11 01:15:** *„amikor elkezdek beszélni, és amíg beszélek, meg utána még
// > **talán plusz pár másodpercig** szüneteltetni kéne a felolvasást. Aztán újra folytatni."*
//
// ⭐ A *„talán plusz pár másodperc"* miatt ez **paraméter**, ⛔ nem beégetett szám — a feladat
// kikötése: *„Alapérték 2-3 s, és állítható ugyanott, ahol a hangerő."*
//
// ⇒ Ezért a tárolás **ugyanabban a könyvtárban** van, mint a hangerő
// *(`~/.config/my-assistant/voice/`)*, és **ugyanazt a mintát** követi:
// **környezeti változó → fájl → alapérték.**
//
// ⭐ A közös mechanika a `voice-number-setting.ts`-ben van — a review `code-duplication`
// szabálya mérte meg *(17 sor / 102 token)*, hogy a hangerővel azonos. ⛔ A hangerőhöz nem
// nyúltam *(három rétegen működik)*; ez az új beállítás használja a közös alapot.

import { homedir } from 'node:os';
import { join } from 'node:path';

import { NumberSetting_Util } from './voice-number-setting.js';

/** Az env-változó neve — ⚠️ ez üti a fájlt. */
const ENV_NAME: string = 'MA_VOICE_SPEECH_GRACE_MS';

/** A beállítás türelmi idő. */
export class VoiceSpeechGrace_Util {

  /**
   * Az alapértelmezett türelmi idő.
   *
   * ⭐ A feladat saját sávja: *„Alapérték 2-3 s"*. A **2,5 s** a sáv közepe — így egyik irányba
   * sem döntünk az owner helyett.
   */
  static readonly DEFAULT_MS: number = 2_500;

  /**
   * A legrövidebb elfogadott érték.
   *
   * ⚠️ Nulla türelmi idő azt jelentené, hogy a felolvasás **belevág** a levegővételbe — a
   * beszéd közbeni rövid szüneteket a rendszer befejezésnek hinné.
   */
  static readonly MIN_MS: number = 500;

  /**
   * A leghosszabb elfogadott érték.
   *
   * ⚠️ Fölötte a felolvasás **elhallgatni látszik**: az owner azt hinné, elromlott. Egy néma
   * rendszer és egy nagyon türelmes rendszer kívülről ugyanúgy néz ki.
   */
  static readonly MAX_MS: number = 15_000;

  /** A beállítás fájlja — ⭐ a hangerő MELLETT, ugyanabban a könyvtárban. */
  static resolvePath(userHome: string = homedir()): string {
    return join(userHome, '.config', 'my-assistant', 'voice', 'speech-grace.json');
  }

  /**
   * Egy érték értelmezése. **Tiszta függvény.**
   *
   * @param raw amit kaptunk.
   * @param current a mostani érték — ⛔ hibás bemenetnél EZ marad, nem az alapérték.
   */
  static parse(
    raw: unknown,
    current: number = VoiceSpeechGrace_Util.DEFAULT_MS,
  ): { ok: boolean; value: number; detail: string } {
    return NumberSetting_Util.parse(raw, {
      min: VoiceSpeechGrace_Util.MIN_MS,
      max: VoiceSpeechGrace_Util.MAX_MS,
      current: current,
      unit: ' ms',
    });
  }

  /**
   * A jelenlegi türelmi idő: **környezeti változó → fájl → alapérték.**
   *
   * ⛔ **Nem dob**: a türelmi idő olvasása sosem buktathatja meg a felolvasást.
   */
  static async read(path: string = VoiceSpeechGrace_Util.resolvePath()): Promise<number> {
    return NumberSetting_Util.read({
      path: path,
      field: 'graceMs',
      envName: ENV_NAME,
      parse: (raw: unknown) => VoiceSpeechGrace_Util.parse(raw),
      fallback: VoiceSpeechGrace_Util.DEFAULT_MS,
      scope: 'voice.speech-grace',
    });
  }

  /**
   * A türelmi idő eltárolása.
   *
   * @returns az értelmezés eredménye. Hibás bemenetnél ⛔ **nem írunk**.
   */
  static async write(
    raw: unknown,
    setBy: string = 'agent',
    path: string = VoiceSpeechGrace_Util.resolvePath(),
    now: Date = new Date(),
  ): Promise<{ ok: boolean; value: number; detail: string }> {
    const current: number = await VoiceSpeechGrace_Util.read(path);

    return NumberSetting_Util.write({
      path: path,
      field: 'graceMs',
      raw: raw,
      parse: (value: unknown) => VoiceSpeechGrace_Util.parse(value, current),
      setBy: setBy,
      now: now,
    });
  }
}
