// 🗺️ HOGYAN kézbesítsünk egy KÉSŐN felismert átiratot — a döntés, tisztán és tesztelhetően.
//
// ⭐ MIÉRT KÜLÖN MODUL. Ez a döntés a `DiscordListener` egy **privát** metódusában élt, ami
// élő Discord-klienst igényel ⇒ **szerkezetileg tesztelhetetlen** volt. Közben pedig épp itt
// találtam **három** olyan viselkedést, ami nyersen bekötve hibás lett volna
// *(2026-09-08 02:15, a hang-csatornás retry bekötésekor)*:
//
//   1. `🎙️ HANGÜZENET`-ként került volna a kötegbe — elfedve, hogy **élő beszédről** van szó;
//      az más bizonytalanságú, mert ott a **szegmentálás** is hibázhat.
//   2. A tükör egy **NEM LÉTEZŐ üzenetre** válaszolt volna: a hang-csatornánál a `messageId`
//      a WAV **fájlneve**, nem Discord-üzenet-azonosító.
//   3. Bukásnál a tükör a **fő chatbe** esett volna vissza — az owner **pont ott nem látná**,
//      ahol beszélt. *(Ugyanaz a hibaosztály, amit 21:47-kor a friss átiratnál már javítottunk.)*
//
// ⇒ Amit háromszor is el lehet rontani, az nem maradhat lefedetlenül (`core-record-learnings`).
//
// ⛔ EZ A MODUL NEM KÜLD SEMMIT — csak eldönti, **hogyan** kellene. A mellékhatás a hívóé.

import type { SttRetryEntry, SttRetrySource } from './stt.retry-queue.js';

/** Hova menjen a tükör-üzenet. */
export type RetryMirrorTarget =
  /** Egy konkrét csatornába — oda, ahol a beszéd elhangzott. */
  | { to: 'channel'; channelId: string }
  /** Válaszként a forrás-üzenetre — a hangüzenet és az átirata így marad összekötve. */
  | { to: 'reply' };

export interface RetryDeliveryPlan {
  /** Milyen jelöléssel kerüljön a kötegbe. */
  markAs: SttRetrySource;
  /** A tükör-üzenet első sora — az ownernek szól, ezért a forráshoz igazodik. */
  headline: string;
  mirror: RetryMirrorTarget;
}

/**
 * A késői kézbesítés terve — a bejegyzés **forrásából**.
 *
 * ⚠️ A `source` hiánya `voice-message`-t jelent: a lemezen **már ott lévő** bejegyzések így
 * változatlanul, a régi úton kézbesítődnek. ⭐ Ez nem elnézés, hanem **szándékos**
 * visszafelé-kompatibilitás — egy mező bevezetése nem törhet el meglévő, várakozó adatot.
 */
export function planRetryDelivery(entry: Pick<SttRetryEntry, 'source' | 'channelId'>): RetryDeliveryPlan {
  if (entry.source === 'voice-channel') {
    return {
      markAs: 'voice-channel',
      headline: '✅ **Megvan, amit a hang-csatornában mondtál — korábban nem tudtam felismerni.**',
      mirror: { to: 'channel', channelId: entry.channelId },
    };
  }

  return {
    markAs: 'voice-message',
    headline: '✅ **Megvan a hangüzenet, amit korábban nem tudtam felismerni.**',
    mirror: { to: 'reply' },
  };
}
