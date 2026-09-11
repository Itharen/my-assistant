// ⏳ MIKOR HALLGATOTT EL? — a sor egyetlen külső kérdése a lejátszóhoz.
//
// 🔴 MIÉRT KELL: a `speakInVoiceChannel` a `player.play()` **után azonnal visszatér** — onnantól
// a lejátszás a lejátszó dolga. ⇒ A hívó `await`-je csak az **indítást** várta meg, a
// **végét** nem, és a következő üzenet nem-`Idle` lejátszóba futott bele *(ahol a felolvasó
// helyesen visszalép: „Épp szól valami")*. Ez az a pont, ahol az owner második üzenete elesett.
//
// ⭐ MIÉRT KÜLÖN MODUL: a `VoiceSpeechQueue` **nem tud** a Discordról, és ez szándékos — így
// hálózat és hang-kapcsolat nélkül tesztelhető. Ez a fájl a **fordító** a kettő között.
//
// ## ⚠️ MIÉRT NEM POLLING
//
// A `core-no-polling` tiltja az ismételt kérdezést. Az `entersState` a `@discordjs/voice`
// **esemény-alapú** segédje: az állapot-váltásra ül fel, ⛔ nem kérdezi ismételten, hogy
// „vége van-e már".

import { AudioPlayerStatus, entersState, type AudioPlayer } from '@discordjs/voice';

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';

/**
 * Meddig várjuk, hogy egy felolvasás véget érjen.
 *
 * ⭐ MÉRT ALAP: a beszéd-szintézis felső korlátja **700 karakter darabonként**
 * *(`SPEECH_MAX_CHARS`)*, ami normál beszédtempóval ~70-90 másodperc. A 180 s bőven átfog egy
 * darabot, de ⛔ nem annyi, hogy egy **beragadt** lejátszó a teljes sort órákra megfogja.
 *
 * ⚠️ A korlát léte a lényeg, nem a pontos értéke: időtúllépés nélkül egyetlen elakadt
 * lejátszás **minden további üzenetet** némán várakoztatna — ugyanaz a néma veszteség, csak
 * lassabban.
 */
const IDLE_WAIT_TIMEOUT_MS: number = 180_000;

/**
 * A várakozó függvény szerződése.
 *
 * ⚠️ **SZŰKEBB, mint a `typeof entersState`**, és ez szándékos: az utóbbi túlterhelt
 * *(hang-kapcsolatra és lejátszóra is illik, jel-objektummal vagy időkorláttal)*, amit egy
 * hamis várakozó csak `as` átcímkézéssel tudott kielégíteni. ⭐ Így a szerződést a fordító
 * **tényleg őrzi**.
 */
type IdleWaiter = (
  player: AudioPlayer,
  status: AudioPlayerStatus,
  timeoutMs: number,
) => Promise<unknown>;

/** A lejátszó elhallgatásának kivárása. */
export class VoicePlaybackIdle_Util {

  /** A várakozás felső korlátja — a diagnosztikához és a teszthez. */
  static readonly TIMEOUT_MS: number = IDLE_WAIT_TIMEOUT_MS;

  /**
   * Várakozás, amíg a lejátszó `Idle` lesz.
   *
   * @param player a hang-kapcsolatra kötött lejátszó.
   * @param waitFor cserélhető a teszthez — alapból a `@discordjs/voice` `entersState`-je.
   * @returns `true`, ha elhallgatott; `false`, ha nem várjuk tovább.
   *
   * ⛔ **Hibát SOHA nem dob.** Az `entersState` időtúllépésnél **dob**, és egy kivétel innen a
   * sor kiszolgálóját buktatná meg — vagyis egyetlen beragadt hang **minden későbbi**
   * felolvasást megszüntetne. ⚠️ De ⛔ nem is néma: a bukás naplózódik, és a `false` visszatérés
   * a hívónak megmondja, hogy továbbléphet.
   */
  static async wait(
    player: AudioPlayer,
    waitFor: IdleWaiter = entersState,
  ): Promise<boolean> {
    // ⭐ MÁR ELHALLGATOTT: ilyenkor az `entersState` is azonnal visszatér, de a korai kilépés
    // a szándékot is kimondja — a leggyakoribb eset (egyetlen üzenet) nem vár semmire.
    if (player.state.status === AudioPlayerStatus.Idle) return true;

    try {
      await waitFor(player, AudioPlayerStatus.Idle, IDLE_WAIT_TIMEOUT_MS);

      return true;
    } catch (err: unknown) {
      SwallowedFailure_Util.report('voice.playback-idle.wait', err);

      return false;
    }
  }
}
