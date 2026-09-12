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

/**
 * 🔴 MI LEGYEN EGY ÚJRAPRÓBÁLÁS KIMENETELÉVEL — a 20. tétel (1) pontja.
 *
 * > **Owner, 2026-09-12 05:30:** *„sok »végleges nem sikerült felismerni« üzenet érkezik a
 * > Discordon… azt írja, **buli zaj**, de hát a bulinak **már régen vége**."* ·
 * > **02:45-kor már jelezte:** *„az nem is egy **valid találat**."*
 *
 * ## 🔬 A MÉRÉS (`discord/outbound-log.jsonl`, 2026-09-12)
 *
 * **169** „VÉGLEG nem sikerült felismernem" riasztás ment ki EGY éjszaka alatt, ebből
 * **43 BULI-ZAJ** *(a többi: 71 arány-gyanú, 22 CUDA-hiba, 33 egyéb, 1 időtúllépés)*. A csúcs
 * **4 riasztás / perc**, és 05:25-05:47 között **még mindig** ömlött — órákkal a buli után.
 *
 * 🔴 **A MECHANIZMUS:** a zaj-felvétel **technikai** hibával *(HTTP 500 / CUDA)* került a sorra,
 * ott egy későbbi próba **sikeresen** felismerte — de az eredmény **zaj** volt. A régi kód a
 * zajt „még mindig nem sikerült"-ként kezelte ⇒ **újra ütemezte**, és az **5. próba után
 * riasztott**. ⇒ Egy zaj-felvétel **4 fölösleges felismerést** és **egy hamis riasztást** ért.
 *
 * ## ✅ A DÖNTÉS
 *
 * | Kimenetel | Teendő | Miért |
 * |---|---|---|
 * | sikeres, nem gyanús átirat | `deliver` | ez a cél |
 * | ⭐ **zajnak jelölt** | **`drop-as-noise`** | ⛔ NEM hiba — l. a tábla alatti bekezdést |
 * | bármi más bukás/gyanú | `retry` | ez valódi bizonytalanság — a hang megmarad, később újra |
 *
 * ⭐ **MIÉRT NEM HIBA A ZAJ:** a felismerés **sikerült** — épp azt mondta meg, hogy amit
 * felvettünk, az a **környezet beszéde**. ⇒ Se riasztás, se további próba.
 *
 * ⚠️ **A `drop-as-noise` ⛔ NEM az átirat eldobása**: a **hang** megmarad az archívumban, és a
 * tölcsér-jelentés a saját sorában számolja. Csak a **riasztás** marad el — mert nem igaz, hogy
 * *„nem tudom, mit mondtál"*: tudjuk, hogy **nem ő** mondta.
 */
export class SttRetryOutcome_Util {

  /**
   * Mit tegyünk ezzel a felismerés-eredménnyel?
   *
   * @param result a felismerés lényege — ⭐ **szűk** bemenet, hogy a döntés az egész
   *   `SttResult`-tól független és triviálisan tesztelhető legyen.
   */
  static decide(result: { ok: boolean; suspicious?: boolean; isNoise?: boolean }): RetryOutcomeAction {
    // ⚠️ A SORREND SZÁNDÉKOS: a zaj-jelölés **erősebb**, mint a „gyanús" — a `suspicious` ugyanis
    // a zajra IS igaz (a zaj annak egy részhalmaza). Ha a `suspicious` előbb döntene, a zaj
    // visszakerülne a sorba, és minden a régi hibába futna.
    if (result.isNoise) return RetryOutcomeAction.dropAsNoise;
    if (!result.ok || result.suspicious) return RetryOutcomeAction.retry;

    return RetryOutcomeAction.deliver;
  }
}

/** Amit egy újrapróbálás kimenetelével tehetünk. */
export enum RetryOutcomeAction {
  /** ✅ A szöveg megvan, mehet a kötegbe. */
  deliver = 'deliver',
  /** 🎤 Zaj volt — kiesik a sorból, riasztás NÉLKÜL. */
  dropAsNoise = 'drop-as-noise',
  /** ⏳ Valódi bizonytalanság — a hang megmarad, később újra. */
  retry = 'retry',
}
