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
import { join } from 'node:path';
import type { VoiceConnection } from '@discordjs/voice';

import { transcribeAudio } from '../stt/stt.client.js';
import { VoiceChannelBridge } from './voice-channel-bridge.js';
import { VoiceDropProbe, type VoiceDropObservation } from './voice-drop-probe.js';
import type { MissedSpeechKind } from './voice-missed-speech.js';
import { VOICE_LOG_CODES } from './voice-log-codes.js';

/**
 * A felvevő `recordings` könyvtára.
 *
 * ⚠️ MÉRT ÉRTÉK, nem feltételezés: az átemelt `CV_Recording_ControlService` a saját, **privát**
 * `recordingsDir` mezőjét `path.join(process.cwd(), 'recordings')`-ként számolja
 * *(`cv-recording.control-service.ts:34`)* — ugyanezt kell képeznünk, mert a mezőt kívülről nem
 * lehet lekérdezni, és ⛔ az átemelt kódhoz nem nyúlunk, hogy kiadja (`transplant-not-rewrite`).
 *
 * 📌 Ha ez valaha elcsúszik, a szonda **üres könyvtárat** lát, és ezt `onProbeError`-ként
 * jelenti — nem némán téved.
 */
export function resolveRecordingsDir(): string {
  return join(process.cwd(), 'recordings');
}

/** Amit az átemelt felvevőből használunk — ⚠️ MÉRT felület, nem feltételezett. */
export interface TransplantedRecorder {
  initializeRecordingsDirectory(): Promise<void>;
  handlePcmReceiver(connection: VoiceConnection): void;
  onWavFileReadyForProcessing?: (data: { userId: string; filename: string }) => void;
}

/**
 * 🔴 MEGSZOLALAS-SZAMLALO — a NEMA ELDOBAS lathatova tetele.
 *
 * > **Owner (2026-09-07 22:08):** *„beszéltem, beszéltem, tulajdonképpen annak egy százaléka
 * > lett aztán transzkriptálva… De leginkább semmi nem ment át."*
 *
 * ⭐ A MERES, AMI HIANYZOTT: az atemelt felvevo hangero- es ZCR-alapu validacioja **nemán
 * eldobja** a megszolalasok tobbseget. A `onWavFileReadyForProcessing` hook **csak a
 * TULELOKET** latja — a kidobottakrol sem az owner, sem en nem tudok semmit.
 *
 * ⇒ Ezert a `receiver.speaking` esemenyre **parhuzamosan** ulunk ra. ⛔ Ez **megfigyeles, nem
 * modositas**: az atemelt kodhoz nem nyulunk (`transplant-not-rewrite`), csak megszamoljuk,
 * hany megszolalas INDULT, es osszevetjuk azzal, hany ERKEZETT meg a hookig.
 *
 * 📌 Enelkul a szuro allitgatasa **puszta talalgatas** lenne — pontosan az, amit a
 * `core-no-guessing` tilt.
 */
export interface SpeechAttemptStats {
  /** Hany megszolalast erzekelt a Discord (`speaking.start`). */
  detected: number;
  /** Hany jutott el a feldolgozo hookig. */
  delivered: number;
}

export interface VoiceRecordingResult {
  started: boolean;
  detail: string;
  remedy?: string;
  /** 🔍 Az élő szonda — a tölcsér bármikor lekérdezhető róla (`probe.funnel`). */
  probe?: VoiceDropProbe;
}

/** Egy elkészült felvétel feldolgozásának kimenetele — a naplózáshoz és a teszthez. */
export interface RecordingHandled {
  /** Az owneré volt-e a hang. Idegen beszélőnél `false`, és nem történik semmi más. */
  fromOwner: boolean;
  transcribed: boolean;
  queued: boolean;
  detail: string;
  /**
   * 🔇 Ha nem jutott át: MIÉRT — hogy a hang-csatornában is látszódjon.
   *
   * ⚠️ Enélkül a „nem értettem" és a „meg sem hallottam" megkülönböztethetetlen az owner
   * számára — pontosan ezt írta le 22:08-kor.
   */
  missed?: MissedSpeechKind;
}

/**
 * A felvétel kimenetelének OSZTÁLYOZÁSA — három kimenetel, három kód.
 *
 * 🔴 MÉRT SAJÁT HIBA, ezért van kiemelve és tesztelve: eredetileg **minden** `queued: false`
 * `MA-VOICE-SPEECH-DROPPED`-ként naplózódott — beleértve a **duplikátumot** *(a híd már
 * feldolgozta)* és az **idegen beszélőt**. Egyik sem veszteség, mégis veszteségnek látszott
 * volna, és épp azt a mérést rontotta volna el, amiért az egész készült.
 *
 * ⛔ A visszaút sem jó: a duplikátumot `QUEUED`-nak nevezni azt állítaná, hogy bekerült a
 * kötegbe — pedig nem. Ezért kap **saját, harmadik** kódot.
 */
export type RecordingOutcomeCode =
  /** ✅ Bekerült a kötegbe. */
  | typeof VOICE_LOG_CODES.queued
  /** 🔴 VESZTESÉG: az owner beszélt, de nem lett belőle semmi. */
  | typeof VOICE_LOG_CODES.dropped
  /** ⚪ Se nem siker, se nem veszteség: duplikátum, vagy nem az owner beszélt. */
  | typeof VOICE_LOG_CODES.skipped;

export function classifyRecordingOutcome(outcome: RecordingHandled): RecordingOutcomeCode {
  if (outcome.queued) return VOICE_LOG_CODES.queued;
  if (outcome.missed !== undefined) return VOICE_LOG_CODES.dropped;

  return VOICE_LOG_CODES.skipped;
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
      missed: 'recognition-failed',
      detail: `A felvétel NEM olvasható: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const result = await transcribe({
    audio: audio,
    filename: params.filename.replace(/^.*[\\/]/, ''),
    contentType: 'audio/wav',
  });

  if (!result.ok || result.suspicious || !result.text.trim()) {
    // 🔴 A `suspicious` CSAK AKKOR jelent „nem értettem", ha a felismerés LE IS FUTOTT.
    //
    // ⚠️ MÉRT HIBA, 2026-09-08 01:34 — az első élő adat buktatta ki. Az `stt.client.ts`
    // **minden** bukásnál `suspicious: true`-t ad vissza *(a timeout-ágon is)*, tehát a
    // korábbi `result.suspicious ? …` feltétel egy **5 PERCES IDŐTÚLLÉPÉST** így jelentett:
    //
    //   ❓ „hallottam, de nem értettem biztosan"   ⛔ ez NEM IGAZ
    //
    // ⇒ Az owner azt hitte volna, hogy **rosszul beszélt**, és megismételte volna tisztábban —
    // ami **semmit nem segít**, mert a felismerő szolgáltatás nem fejezte be. A helyes üzenet:
    // *technikai hiba*, más orvoslással. ⭐ A hazug diagnózis rosszabb, mint a néma hiba: rossz
    // irányba küldi azt, aki javítani próbál.
    //
    // 📌 A mért adat: 3/3 felvétel `„A felismerés 5 perc után sem fejeződött be."` — mind
    // `not-understood`-ként jelent meg. ⛔ Egyik sem volt gyanús átirat; **egyik sem volt átirat.**
    const understoodButDoubtful: boolean = result.ok && result.suspicious;

    return {
      fromOwner: true,
      transcribed: false,
      queued: false,
      missed: understoodButDoubtful ? 'not-understood' : 'recognition-failed',
      detail: understoodButDoubtful
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
  /** 🔴 Minden ERZEKELT megszolalasnal hivodik — ez teszi lathatova a nema eldobast. */
  onSpeechAttempt?: (stats: SpeechAttemptStats) => void;
  /**
   * 🔍 Minden NÉMÁN ELDOBOTT felvételnél hívódik — másodpercben megadva, mennyi hang veszett el.
   *
   * ⭐ Ez válaszolja meg azt, amit a `onSpeechAttempt` NEM tudott: hogy a hiányzó megszólalás
   * beleolvadt-e egy futó felvételbe *(nem veszteség)*, vagy a felvevő beszéd-validációja
   * dobta ki *(veszteség)*. Részletek: `voice-drop-probe.ts`.
   */
  onSpeechDropped?: (observation: VoiceDropObservation) => void;
  /** A szonda saját hibái. ⚠️ Sosem fatálisak — a megfigyelés nem buktathatja meg a felvételt. */
  onProbeError?: (detail: string) => void;
  /** Tesztelhetőség: kész szonda átadása. */
  probe?: VoiceDropProbe;
}): Promise<VoiceRecordingResult> {
  if (!params.ownerUserId) {
    return {
      started: false,
      detail: 'Nincs owner-azonosító — a felvételt NEM indítom el.',
      remedy: 'Állítsd be az MA_DISCORD_USER_ID-t.',
    };
  }

  const bridge: VoiceChannelBridge = params.bridge ?? new VoiceChannelBridge();
  const stats: SpeechAttemptStats = { detected: 0, delivered: 0 };
  const load: typeof loadTransplantedRecorder = params.loadRecorder ?? loadTransplantedRecorder;

  // 🔍 A NÉMA ELDOBÁS MÉRŐSZALAGJA — a WAV-fájlok életciklusát figyeli, kívülről.
  // ⛔ Megfigyelés, nem módosítás: az átemelt felvevő nem is tud róla.
  const probe: VoiceDropProbe = params.probe ?? new VoiceDropProbe({
    recordingsDir: resolveRecordingsDir(),
    ownerUserId: params.ownerUserId,
    onDrop: (observation: VoiceDropObservation): void => params.onSpeechDropped?.(observation),
    onProbeError: (detail: string): void => params.onProbeError?.(detail),
  });

  try {
    const recorder: TransplantedRecorder = await load();

    await recorder.initializeRecordingsDirectory();

    // ⭐ CSAK a könyvtár létrehozása UTÁN indul: különben az első körök hiába jelentenének
    // „nem olvasható könyvtár"-t egy olyan állapotról, ami egy pillanat múlva rendben lesz.
    probe.start();

    recorder.onWavFileReadyForProcessing = (data: { userId: string; filename: string }): void => {
      // ⛔ `void`-olt: az átemelt kód SZINKRON hívja ezt a hookot, tehát ígéretet nem adhatunk
      // vissza neki. A hibát itt kell elkapni, különben `unhandledRejection` lenne belőle.
      stats.delivered += 1;
      probe.markDelivered(data.filename);

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

    // 🔴 MEGFIGYELES a hivatalos `receiver.speaking` esemenyre — PARHUZAMOSAN az atemelt
    // felvevovel, azt nem zavarva. Ez teszi lathatova, hany megszolalas INDULT.
    // ⚠️ `?.` SZANDEKOS: a szamlalo DIAGNOSZTIKA. Ha barmi okbol nincs `receiver`, az a
    // felvetelt NEM buktathatja meg — a megfigyeles sosem lehet dragabb, mint amit megfigyel.
    params.connection.receiver?.speaking?.on('start', (userId: string): void => {
      if (userId !== params.ownerUserId) return;

      stats.detected += 1;
      probe.markSpeechStart();
      params.onSpeechAttempt?.({ ...stats });
    });

    return { started: true, detail: 'A hang-csatorna felvétele elindult.', probe: probe };
  } catch (error: unknown) {
    // ⚠️ A szonda NEM maradhat futva egy elbukott felvétel mellett: üres könyvtárat mintavételezne
    // a végtelenségig, és a napló tele lenne értelmetlen sorokkal.
    probe.stop();

    return {
      started: false,
      detail: `A felvétel indítása ELBUKOTT: ${error instanceof Error ? error.message : String(error)}`,
      remedy: 'Ellenőrizd, hogy lefutott-e a `tsc-transplanted` + `fix-transplanted` build-lépés.',
    };
  }
}
