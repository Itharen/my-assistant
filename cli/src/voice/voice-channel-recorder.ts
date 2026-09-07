// 🎙️ AMIT A HANG-CSATORNÁBAN MOND → SZÖVEG → ugyanoda, ahova minden más.
//
// A T-22 6. szakasza. A lánc:
//
//   hang-kapcsolat → **átemelt CCAP-felvevő** → kész WAV → a MI STT-nk → `VoiceChannelBridge`
//
// ⭐ A KULCS-DÖNTÉS: az átemelt `CV_Recording_ControlService` **változatlanul** végzi a nehéz
// részét — a szegmentálást *(mikor ér véget egy megszólalás)*, a hangerő- és ZCR-alapú
// beszéd-észlelést, a duplikált kiküldés elleni védelmet. Ez az, ami *„egész jól működött"*,
// és pont ezért nem írjuk újra (`transplant-not-rewrite`).
//
// ⭐ A MÁSODIK DÖNTÉS: a felismerést viszont **NEM** az átemelt lánc végzi, hanem a **már élőben
// bizonyított** `transcribeAudio` (FDP AI). Ez nem a törékeny kód átírása — az érintetlen marad;
// egyszerűen a `onWavFileReadyForProcessing` **hookjára** ülünk rá, amit a szerzője kihagyott
// nekünk. ⇒ Nincs szükség fizetős kulcsra, és a hangüzenetek útján már mért viselkedést kapjuk.
//
// 🔴 A BETÖLTÉS LUSTA. Mérve 2026-09-07: a hang-lánc hidegindítása **19,5 s**. Ha ez a figyelő
// indulási útvonalán lenne, minden szerver-indulás ennyivel csúszna — és a Discord-csatorna
// ennyivel tovább lenne néma. Ezért csak a **sikeres belépés után**, a háttérben töltjük be.

import { readFile } from 'node:fs/promises';
import type { VoiceConnection } from '@discordjs/voice';

import { transcribeAudio } from '../stt/stt.client.js';
import { VoiceChannelBridge } from './voice-channel-bridge.js';

/** Amit az átemelt felvevőből használunk — ⚠️ MÉRT felület, nem feltételezett. */
export interface TransplantedRecorder {
  initializeRecordingsDirectory(): Promise<void>;
  handlePcmReceiver(connection: VoiceConnection): void;
  onWavFileReadyForProcessing?: (data: { userId: string; filename: string }) => void;
}

export interface VoiceRecordingResult {
  started: boolean;
  detail: string;
  remedy?: string;
}

/** Egy elkészült felvétel feldolgozásának kimenetele — a naplózáshoz és a teszthez. */
export interface RecordingHandled {
  /** Az owneré volt-e a hang. Idegen beszélőnél `false`, és nem történik semmi más. */
  fromOwner: boolean;
  transcribed: boolean;
  queued: boolean;
  detail: string;
}

/**
 * Az átemelt felvevő lusta betöltése.
 *
 * ⚠️ Külön függvény, hogy a teszt **ne** töltse be a valódi, 19,5 s-es modul-gráfot.
 */
export async function loadTransplantedRecorder(): Promise<TransplantedRecorder> {
  // 🔴 A HIVATKOZÁS SZÁNDÉKOSAN VÁLTOZÓBAN ÁLL, nem sztring-literálban.
  //
  // Literállal a TypeScript **belehúzná** az átemelt fát a fő, `strict` programba — pontosan
  // azt szüntetve meg, amiért ki van zárva (`tsconfig.transplanted.json` laza szerződése).
  // Mérve 2026-09-07: literállal az `operations.ts` egyedül 4 hibát adott a fő buildben.
  //
  // ⚠️ Ez tudatos kivétel a „ne használj `import()`-ot" konvenció alól, két mért okkal:
  // (1) a hang-lánc hidegindítása **19,5 s** — ez nem mehet a figyelő indulási útvonalára;
  // (2) az átemelt fa nem része a fő buildnek, tehát statikusan nem is hivatkozható.
  const specifier: string = '../_modules/voice/_services/cv-recording.control-service.js';
  const module = await import(specifier) as {
    CV_Recording_ControlService: { getInstance(): TransplantedRecorder };
  };

  return module.CV_Recording_ControlService.getInstance();
}

/**
 * Egy elkészült WAV feldolgozása: felismerés, majd átadás a hídnak.
 *
 * 🔴 CSAK AZ OWNER HANGJA MEGY TOVÁBB. A hang-csatornába más is beléphet, és az ő beszéde
 * **nem lehet utasítás**. Ugyanaz a határ, amit a szöveges szűrő húz (`discord.message-filter`)
 * — csak itt még fontosabb: a hangból nem látszik, ki írta.
 *
 * ⚠️ GYANÚS ÁTIRATNÁL NEM CSELEKSZÜNK. Ugyanaz a szabály, mint a hangüzeneteknél: egy
 * félrehallott mondat a kötegben már az owner **szó szerinti utasításának** látszana.
 * Inkább ne értsük, mint félreértsük.
 */
export async function handleFinishedRecording(params: {
  userId: string;
  filename: string;
  ownerUserId: string;
  ownerName: string;
  channelId: string;
  bridge: VoiceChannelBridge;
  transcribe?: typeof transcribeAudio;
  read?: typeof readFile;
}): Promise<RecordingHandled> {
  if (params.userId !== params.ownerUserId) {
    return {
      fromOwner: false,
      transcribed: false,
      queued: false,
      detail: `Nem az owner beszélt (${params.userId}) — nem dolgozzuk fel.`,
    };
  }

  const read: typeof readFile = params.read ?? readFile;
  const transcribe: typeof transcribeAudio = params.transcribe ?? transcribeAudio;

  let audio: Uint8Array;

  try {
    audio = new Uint8Array(await read(params.filename));
  } catch (error: unknown) {
    return {
      fromOwner: true,
      transcribed: false,
      queued: false,
      detail: `A felvétel NEM olvasható: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const result = await transcribe({
    audio: audio,
    filename: params.filename.replace(/^.*[\\/]/, ''),
    contentType: 'audio/wav',
  });

  if (!result.ok || result.suspicious || !result.text.trim()) {
    return {
      fromOwner: true,
      transcribed: false,
      queued: false,
      detail: result.suspicious
        ? `Gyanús átirat — NEM cselekszem rá: ${result.suspicionReason ?? result.detail}`
        : `A felismerés nem adott használható szöveget: ${result.detail}`,
    };
  }

  // ⭐ A FÁJLNÉV AZ AZONOSÍTÓ: megszólalásonként egyedi, és a híd duplikáció-védelme erre épül.
  const outcome = await params.bridge.handleOwnerSpeech({
    messageId: params.filename,
    channelId: params.channelId,
    speakerId: params.userId,
    speakerName: params.ownerName,
    transcript: result.text.trim(),
  });

  return {
    fromOwner: true,
    transcribed: true,
    queued: outcome.queued,
    detail: outcome.detail,
  };
}

/**
 * A felvétel elindítása egy élő hang-kapcsolaton.
 *
 * Hibát SOHA nem dob: a felvétel elmaradása **nem** döntheti meg a figyelőt — a szöveges
 * csatorna attól még működik. A bukás leíró eredményben jön vissza, teendővel.
 */
export async function startVoiceRecording(params: {
  connection: VoiceConnection;
  ownerUserId: string;
  ownerName: string;
  channelId: string;
  bridge?: VoiceChannelBridge;
  loadRecorder?: typeof loadTransplantedRecorder;
  onHandled?: (outcome: RecordingHandled) => void;
}): Promise<VoiceRecordingResult> {
  if (!params.ownerUserId) {
    return {
      started: false,
      detail: 'Nincs owner-azonosító — a felvételt NEM indítom el.',
      remedy: 'Állítsd be az MA_DISCORD_USER_ID-t.',
    };
  }

  const bridge: VoiceChannelBridge = params.bridge ?? new VoiceChannelBridge();
  const load: typeof loadTransplantedRecorder = params.loadRecorder ?? loadTransplantedRecorder;

  try {
    const recorder: TransplantedRecorder = await load();

    await recorder.initializeRecordingsDirectory();

    recorder.onWavFileReadyForProcessing = (data: { userId: string; filename: string }): void => {
      // ⛔ `void`-olt: az átemelt kód SZINKRON hívja ezt a hookot, tehát ígéretet nem adhatunk
      // vissza neki. A hibát itt kell elkapni, különben `unhandledRejection` lenne belőle.
      void handleFinishedRecording({
        userId: data.userId,
        filename: data.filename,
        ownerUserId: params.ownerUserId,
        ownerName: params.ownerName,
        channelId: params.channelId,
        bridge: bridge,
      })
        .then((outcome: RecordingHandled): void => params.onHandled?.(outcome))
        .catch((error: unknown): void => {
          params.onHandled?.({
            fromOwner: true,
            transcribed: false,
            queued: false,
            detail: `A felvétel feldolgozása ELBUKOTT: ${error instanceof Error ? error.message : String(error)}`,
          });
        });
    };

    recorder.handlePcmReceiver(params.connection);

    return { started: true, detail: 'A hang-csatorna felvétele elindult.' };
  } catch (error: unknown) {
    return {
      started: false,
      detail: `A felvétel indítása ELBUKOTT: ${error instanceof Error ? error.message : String(error)}`,
      remedy: 'Ellenőrizd, hogy lefutott-e a `tsc-transplanted` + `fix-transplanted` build-lépés.',
    };
  }
}
