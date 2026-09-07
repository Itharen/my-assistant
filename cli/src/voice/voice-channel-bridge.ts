// 🔊 A HANG-CSATORNA HÍDJA — a felismert beszéd bejuttatása ugyanoda, ahova a hangüzeneteké.
//
// > **Owner (2026-09-07):** *„A voice-hoz: server: 1467012131378434151 channel:
// > 1489036734632034496 mindig ülj bent amikor megy a my assistant."*
// > *„Viszont oda is kell majd mirror text formában mindkettőnknek"*
//
// ⭐ A KULCS-DÖNTÉS: a hang-csatorna **NEM külön út**. Ami ott elhangzik, az ugyanabba a
// **Discord-kötegbe** kerül, mint a hangüzenetek — és ezzel ingyen megörökli mindazt, amit
// azon az úton már megépítettünk és mértünk:
//
//   - **duplikáció-védelem** — `isKnownMessage()` a kötegre ÉS az archívumra
//     *(2026-09-07: enélkül a kézbesített üzenet védelme megszűnt)*
//   - **válasz-kötelezettség** — a `comm doctor` ugyanúgy számonkéri
//   - **visszanézhetőség** — `ma comm history` ugyanúgy megmutatja
//   - **kézbesítési szerződés** — a foglaltság-kapu és a nyugtázás ugyanaz
//
// ⇒ Egy külön út mindezt **újra** megkövetelné, és minden hibáját külön kellene megtalálni.

import { DiscordBatchStore } from '../discord/discord.batch-store.js';
import { sendDiscordMessage } from '../discord/discord.sender.js';
import { collectFlags, describeFlags } from '../stt/stt.flags.js';

/** A hang-csatornából jövő szöveg jelölése a kötegben. */
export const VOICE_CHANNEL_MARKER: string = '🔊 HANGCSATORNA';

/** Ki beszélt — az owner, vagy én. */
export type VoiceSpeaker = 'owner' | 'assistant';

export interface VoiceTranscriptResult {
  /** Bekerült-e a kötegbe. `false`, ha duplikátum volt. */
  queued: boolean;
  /** Kiment-e a tükör-szöveg a csatornába. */
  mirrored: boolean;
  detail: string;
}

/**
 * A kötegbe kerülő szöveg — a hangüzenet-jelöléssel EGYENÉRTÉKŰ, de megkülönböztethető.
 *
 * ⚠️ MIÉRT KELL KÜLÖN JELÖLÉS a `🎙️ HANGÜZENET` mellé: a kettő **más bizonytalanságú**.
 * A hangüzenet egy befejezett, újrahallgatható felvétel; a hang-csatorna **élő beszéd**, ahol
 * a szegmentálás is hibázhat *(hol ér véget a mondat)*. Ha ránézésre azonosnak látszanának,
 * ugyanazzal a bizalommal olvasnám mindkettőt — pedig nem ugyanaz.
 */
export function composeVoiceChannelEntry(params: {
  transcript: string;
  speakerName: string;
}): string {
  const flags: string = describeFlags(collectFlags(params.transcript));

  return `${VOICE_CHANNEL_MARKER} — ${params.speakerName} élő beszéde, NEM gépelt szöveg\n`
    + `[${flags}]\n${params.transcript}`;
}

/**
 * A TÜKÖR-SZÖVEG, ami a Discord-csatornába megy — **mindkét irányban**.
 *
 * > **Owner (2026-09-07 14:13):** *„Viszont oda is kell majd mirror text formában
 * > mindkettőnknek"*
 *
 * ⭐ MIÉRT MINDKETTŐ: a hang **elszáll**, a szöveg **marad**. Egy félrehallott mondatot csak
 * akkor lehet elkapni, ha **látható** — és a hang-csatornában ez ma sehol nem látszana.
 *
 * 🔴 A SAJÁT OLDALAM KÜLÖN INDOK: ha a beszédszintézis mást mond, mint amit szántam
 * *(rossz kiejtés, csonka szöveg)*, azt **csak a leírt változat** buktatja le. Ez az én
 * oldalamon eddig **sehol** nem volt meg.
 */
export function composeVoiceMirror(params: {
  speaker: VoiceSpeaker;
  speakerName: string;
  text: string;
}): string {
  const icon: string = params.speaker === 'owner' ? '👤' : '🤖';
  const label: string = params.speaker === 'owner' ? 'hallottam' : 'mondtam';

  return `${icon} 🔊 **${params.speakerName}** — ${label}:\n> ${params.text.trim()}`;
}

/**
 * A híd: a hang-csatornából érkező átirat feldolgozása.
 *
 * Két dolgot tesz, és **egyik sem nyelhet el semmit némán**:
 *   1. **kötegbe teszi** — így jut el hozzám, a szokásos úton;
 *   2. **tükör-szöveget küld** a csatornába — így az owner LÁTJA, mit hallottam.
 *
 * 🔴 A SORREND SZÁNDÉKOS: előbb a köteg, utána a tükör. Ha fordítva lenne, egy köteg-hiba
 * után már kiment volna a tükör — az owner azt hinné, megkaptam, holott nem.
 */
export class VoiceChannelBridge {

  constructor(
    private readonly store: DiscordBatchStore = new DiscordBatchStore(),
    private readonly send: typeof sendDiscordMessage = sendDiscordMessage,
  ) {}

  /**
   * Az OWNER beszéde: kötegbe + tükör.
   *
   * @param messageId stabil azonosító a szegmenshez — ⚠️ EZ ADJA a duplikáció-védelmet.
   *   A hang-modul szegmensenként egyedi azonosítót ad; enélkül ugyanaz a mondat
   *   újraindítás után újra bekerülne.
   */
  async handleOwnerSpeech(params: {
    messageId: string;
    channelId: string;
    speakerId: string;
    speakerName: string;
    transcript: string;
  }): Promise<VoiceTranscriptResult> {
    const trimmed: string = params.transcript.trim();

    if (!trimmed) {
      return { queued: false, mirrored: false, detail: 'Üres átirat — nincs mit átadni.' };
    }

    const queued: boolean = await this.store.append({
      messageId: params.messageId,
      channelId: params.channelId,
      authorId: params.speakerId,
      authorName: params.speakerName,
      content: composeVoiceChannelEntry({ transcript: trimmed, speakerName: params.speakerName }),
      receivedAt: new Date().toISOString(),
    });

    // ⛔ Duplikátumnál NEM küldünk tükröt: az owner másodszor látná ugyanazt, és azt hinné,
    // kétszer mondta. A csend itt a helyes válasz — a `false` viszont a hívóhoz eljut.
    if (!queued) {
      return { queued: false, mirrored: false, detail: 'Ezt a szegmenst már feldolgoztuk.' };
    }

    // 🔊 A TÜKÖR ODA MEGY, AHOL ELHANGZOTT — a hang-csatorna szöveges sávjába.
    // 🔴 Mérve 2026-09-07 21:47: eddig a fő szöveges csatornába ment, és az owner a
    // hang-csatornát nézve **semmilyen reakciót nem látott**. A tükör értelme épp az, hogy
    // ott legyen, ahol beszél.
    const mirror = await this.send(
      composeVoiceMirror({ speaker: 'owner', speakerName: params.speakerName, text: trimmed }),
      'ack',
      params.channelId,
    );

    return {
      queued: true,
      mirrored: mirror.sent,
      detail: mirror.sent
        ? 'Kötegbe téve, és a tükör-szöveg kiment.'
        : `Kötegbe téve, de a tükör NEM ment ki — ${mirror.detail}`,
    };
  }

  /**
   * AMIT ÉN MONDOK a hang-csatornában — csak tükör, kötegbe NEM.
   *
   * ⛔ A saját beszédem NEM kerül a kötegbe: az a **bejövő** üzenetek tára. Ha a saját
   * szavaimat is odatenném, azok később **owner-üzenetként** jönnének vissza hozzám.
   * *(Ugyanaz a hibaosztály, amiért a Discord-figyelő is kiszűri a saját botunk visszhangját.)*
   */
  async mirrorOwnSpeech(params: {
    text: string;
    assistantName: string;
    /**
     * 🔴 A HANG-csatorna azonosítója.
     *
     * ⚠️ **MEGELŐZŐ JAVÍTÁS (2026-09-07 23:00).** Ez a metódus **csatorna nélkül** küldött,
     * tehát a `sendDiscordMessage` alapértelmezése szerint a **fő szöveges csatornába** ment
     * volna — pontosan az a hiba, amit a `handleOwnerSpeech`-nél 21:47-kor már megjavítottunk,
     * itt viszont **bennmaradt**.
     *
     * ⭐ Élesben még nem okozott kárt: **mérve — a metódusnak ma nincs hívója**, a saját
     * beszédem tükrözése még nincs bekötve. A hiba viszont már benne állt, és az első
     * bekötéskor csendben elvitte volna a tükröt a rossz csatornába.
     *
     * 📌 Tanulság: egy hibaosztályt **minden** előfordulási helyén meg kell keresni — a
     * javított példány nem bizonyítja a többit.
     */
    channelId?: string;
  }): Promise<VoiceTranscriptResult> {
    const trimmed: string = params.text.trim();

    if (!trimmed) {
      return { queued: false, mirrored: false, detail: 'Üres szöveg — nincs mit tükrözni.' };
    }

    const mirror = await this.send(
      composeVoiceMirror({ speaker: 'assistant', speakerName: params.assistantName, text: trimmed }),
      'ack',
      params.channelId,
    );

    return {
      queued: false,
      mirrored: mirror.sent,
      detail: mirror.sent ? 'A saját beszédem tükrözve.' : `A tükör NEM ment ki — ${mirror.detail}`,
    };
  }
}
