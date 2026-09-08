// 🔌 A HANG-KAPCSOLAT ÁLLAPOT-NAPLÓJA — a hiány, ami miatt egy kiesés MÉRHETETLEN volt.
//
// 🔴 MÉRT HIÁNY (2026-09-08 09:04): a napi akció-naplóban **24 `MA-VOICE-JOINED`** állt, és
// **NULLA** kilépés-esemény — mert **ilyen kód nem is létezett** a forrásban. Az egyetlen hely,
// ahol a leválás kezelve volt (`VoiceChannelPresence.watchForDrop`), egy **néma `catch`**-ben
// semmisítette meg a kapcsolatot:
//
// ```ts
// ]).catch((): void => { this.connection?.destroy(); this.connection = null; });
// ```
//
// ⇒ A bot **kieshetett a csatornából**, és erről **semmilyen** nyom nem keletkezett. Ezért nem
// lehetett megmérni egyetlen kiesést sem — és ezért állítottam ma valótlant az ownernek arról,
// hogy bent voltunk-e.
//
// **Amit ez a modul ad:** minden állapot-változás *(belépés · kilépés · leválás · visszatérés ·
// végleges bontás · bukott belépés)* **saját kódot**, **okot** és — kiesésnél — **időtartamot**
// kap.
//
// ⚠️ **ÉS A SZERVER LOGJÁBA IS KI KELL ÍRNI**, nem csak a JSONL-be. Owner: a szerver logjában
// nézi. A `safeLog` **kizárólag** az akció-naplóba ír *(mérve)*, tehát a konzol-sor külön kell.
//
// Kapcsolódó szabályok: `core-observability` *(minden jelentős esemény naplózandó)* ·
// `core-rich-error-handling` *(néma `catch` tilos)* · `core-no-guessing` *(aminek nincs
// rekordja, azt mérni kell — a rekordot a munka részeként hozzuk létre)*.

import { formatDuration, localClock } from '../utils/local-time.js';

/** Mi történt a kapcsolattal. */
export type VoiceConnectionEventKind =
  /** Sikeresen bent vagyunk. */
  | 'joined'
  /** Mi léptünk ki, szándékosan (leállás, újraindulás). */
  | 'left'
  /** Elszakadt a kapcsolat — de még lehet, hogy magától visszajön. */
  | 'disconnected'
  /** Magától visszajött a türelmi időn belül. ⭐ Ez a „nem is volt baj" eset. */
  | 'reconnected'
  /** Nem jött vissza ⇒ bontottuk. 🔴 EZ A VALÓDI KIESÉS. */
  | 'dropped'
  /** Be sem tudtunk lépni. */
  | 'join-failed';

export interface VoiceConnectionEvent {
  kind: VoiceConnectionEventKind;
  /** A csatorna neve, ha ismert — hogy tudni lehessen, MELYIKBŐL estünk ki. */
  channelName?: string;
  /** Miért történt. ⛔ Kiesésnél ez nem hagyható el. */
  reason?: string;
  /**
   * Mennyi ideig nem voltunk bent (ms).
   *
   * ⭐ EZ A SZÁM A LÉNYEG: „elveszett egy beszélgetés" állítás csak ezzel mérhető.
   */
  offlineMs?: number;
}

/** A napló-sor, amit egy eseményből előállítunk. */
export interface VoiceConnectionLogLine {
  /** Grep-elhető azonosító a naplóban. */
  code: string;
  /** `note` = rendben · `error` = baj történt. Ez dönti el, hova kerül a súlya. */
  level: 'note' | 'error';
  /** Amit az owner a SZERVER LOGJÁBAN lát. */
  console: string;
  /** Amit az akció-napló `summary`-je kap. */
  summary: string;
}

/** Az esemény-fajták kódjai — egy helyen, hogy a napló grep-elhető maradjon. */
export const VOICE_CONNECTION_CODES: Record<VoiceConnectionEventKind, string> = {
  joined: 'MA-VOICE-JOINED',
  left: 'MA-VOICE-LEFT',
  disconnected: 'MA-VOICE-DISCONNECTED',
  reconnected: 'MA-VOICE-RECONNECTED',
  dropped: 'MA-VOICE-DROPPED',
  'join-failed': 'MA-VOICE-JOIN-FAILED',
};

/** ⚠️ Ezeknél a fajtáknál a hiányzó ok maga is hiba — ezt nem nyeljük le némán. */
const REASON_REQUIRED: VoiceConnectionEventKind[] = ['dropped', 'join-failed', 'disconnected'];

/** Az esemény egysoros, ember-olvasható magja — a kód és az idő NÉLKÜL. */
function describeBody(event: VoiceConnectionEvent): { text: string; level: 'note' | 'error' } {
  const where: string = event.channelName ? ` — „${event.channelName}"` : '';

  switch (event.kind) {
    case 'joined':
      return { text: `🔊 BENT VAGYOK a hang-csatornában${where}`, level: 'note' };

    case 'left':
      return { text: `👋 Kiléptem a hang-csatornából${where}`, level: 'note' };

    case 'disconnected':
      // ⚠️ Még NEM kiesés: a Discord magától vissza szokta hozni. Ezért `note`, nem `error`.
      return { text: `⚠️ Elszakadt a hang-kapcsolat${where} — várok a visszatérésre`, level: 'note' };

    case 'reconnected':
      return {
        text: `✅ Visszajött a hang-kapcsolat${where}`
          + (event.offlineMs === undefined ? '' : ` — ${formatDuration(event.offlineMs)} kiesés`),
        level: 'note',
      };

    case 'dropped':
      // 🔴 EZ AZ, AMI EDDIG NÉMA VOLT.
      return {
        text: `🔴 KIESTEM a hang-csatornából${where}`
          + (event.offlineMs === undefined ? '' : ` — ${formatDuration(event.offlineMs)} után bontva`)
          + ' — az idáig elmondott beszéd NEM jutott el hozzám',
        level: 'error',
      };

    case 'join-failed':
      return { text: `🔴 NEM tudtam belépni a hang-csatornába${where}`, level: 'error' };
  }
}

/**
 * Egy kapcsolat-esemény napló-sorrá alakítása. **Tiszta függvény.**
 *
 * ⭐ MIÉRT KÜLÖN: ez a döntés hat ágú, és pont az a dolga, hogy egy **ritkán előforduló**,
 * nehezen reprodukálható eseményt *(kiesés éjjel, beszéd közben)* helyesen írjon le. Ilyet
 * élesben kivárni nem lehet — tesztelni viszont igen.
 */
export function describeConnectionEvent(
  event: VoiceConnectionEvent,
  when: Date = new Date(),
): VoiceConnectionLogLine {
  const body = describeBody(event);
  const code: string = VOICE_CONNECTION_CODES[event.kind];

  // ⛔ A hiányzó ok nem maradhat észrevétlen ott, ahol a diagnózis MÚLIK rajta.
  const reason: string = event.reason
    ?? (REASON_REQUIRED.includes(event.kind) ? '(ok ismeretlen — ez maga is hiba)' : '');
  const reasonPart: string = reason ? ` · ok: ${reason}` : '';

  return {
    code: code,
    level: body.level,
    console: `[voice] ${localClock(when)} ${code} ${body.text}${reasonPart}`,
    summary: `[discord/listener] ${body.text}${reasonPart}`,
  };
}
