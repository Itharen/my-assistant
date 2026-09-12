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

import { VoiceAnalysisBar } from './voice-analysis-bar.js';
import {
  attachAnalysisBarSafely,
  createConsoleBar,
  type AnalyzerLike,
} from './voice-analysis-observer.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { VoiceConnection } from '@discordjs/voice';

import { SttAudioWindow_Util } from '../stt/stt-audio-window.js';
import { transcribeAudio } from '../stt/stt.client.js';
import { VoiceChannelBridge } from './voice-channel-bridge.js';
import { VoiceDropProbe, type VoiceDropObservation } from './voice-drop-probe.js';
import type { MissedSpeechKind } from './voice-missed-speech.js';
import { VOICE_LOG_CODES } from './voice-log-codes.js';
import type { RecordingHandled, SpeechAttemptStats } from './voice-recording-outcome.js';

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

/** A felvétel elindításának kimenetele. */
export interface VoiceRecordingResult {
  started: boolean;
  detail: string;
  remedy?: string;
  /** 🔍 Az élő szonda — a tölcsér bármikor lekérdezhető róla (`probe.funnel`). */
  probe?: VoiceDropProbe;
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
 * Az átemelt **elemző** singleton lusta betöltése — a keretenkénti sávhoz.
 *
 * ⚠️ Ugyanaz a változóban-tartott hivatkozás, ugyanazzal a mért okkal, mint a felvevőnél:
 * literállal a TypeScript belehúzná az átemelt fát a fő, `strict` programba.
 *
 * ⛔ Az elemzőt **nem módosítjuk** — csak a példányát kérjük el, hogy kívülről ráülhessünk
 * (`voice-analysis-observer.ts`).
 */
export async function loadTransplantedAnalyzer(): Promise<AnalyzerLike> {
  const specifier: string = '../_modules/voice/_services/cv-analysis.control-service.js';
  const module = await import(specifier) as {
    CV_Analysis_ControlService: { getInstance(): AnalyzerLike };
  };

  return module.CV_Analysis_ControlService.getInstance();
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
  /**
   * 🔴 TECHNIKAI bukásnál hívódik, a hang BÁJTJAIVAL — hogy a hívó eltehesse újrapróbálásra.
   *
   * ⚠️ MÉRT HIÁNY (2026-09-08 02:15): a `SttRetryQueue` létezik, de a hang-csatorna útja
   * **nem használta** — a 3 időtúllépéses felvétel **véglegesen elveszett**, mert a WAV-ot a
   * felvevő takarítása törli. ⛔ Ez a hívón múlik, ezért kap visszahívást, nem sor-függőséget.
   */
  onRecognitionFailed?: (info: { audio: Uint8Array; filename: string; failure: string }) => void;
  transcribe?: typeof transcribeAudio;
  /**
   * 🔊 A FELDOLGOZÁS ELKEZDŐDÖTT — közvetlenül a felismerés hívása előtt.
   *
   * 🔴 MIÉRT LETT KÜLÖN, MÉRT OWNER-PANASZBÓL (2026-09-10 18:07, hangcsatorna):
   * *„még mindig a typing hangot hallom, pedig ennek a hangnak akkor kéne lejátszódni, amikor
   * elkezdett feldolgozni az üzeneteket, és nem pedig amikor elkezdett felvenni."*
   *
   * ⚠️ A jelzés eddig a **megszólalás észlelésekor** szólt (`onSpeechAttempt`) — vagyis akkor,
   * amikor **elkezdett beszélni**. A hang viszont a CCAP `typing.mp3`-ja, ami nála
   * **„dolgozom rajta"**-t jelent. ⇒ A hang jó volt, a **pillanat** rossz.
   */
  onProcessingStart?: () => void;
  /**
   * 🎙️ A NYERS HANG MEGŐRZÉSE — ⭐ **a felismerés ELŐTT**, kimenetelre való tekintet nélkül.
   *
   * 🔴 A MÉRT HIÁNY: a `onRecognitionFailed` **csak a technikai bukást** tette el, a
   * *„hallottam, de nem értettem"* ágon pedig semmi ⇒ a hang **véglegesen** elveszett.
   * A mérés és a teljes indoklás: `voice-utterance-archive.ts`.
   *
   * @returns megmaradt-e a hang — ⚠️ **mért** tény, ⛔ nem feltevés.
   */
  archive?: (info: { audio: Uint8Array; filename: string }) => Promise<boolean>;
  /**
   * A felvétel beolvasása — cserélhető a teszthez. ⚠️ **Szűkebb, mint a `typeof readFile`**, és
   * ez szándékos: az utóbbi túlterhelt, amit egy hamis olvasó csak `as` átcímkézéssel tudott
   * kielégíteni. ⭐ Így a szerződést a fordító **tényleg őrzi**.
   */
  read?: (path: string) => Promise<Buffer>;
}): Promise<RecordingHandled> {
  if (params.userId !== params.ownerUserId) {
    return {
      fromOwner: false,
      transcribed: false,
      queued: false,
      detail: `Nem az owner beszélt (${params.userId}) — nem dolgozzuk fel.`,
    };
  }

  const read: (path: string) => Promise<Buffer> = params.read ?? readFile;
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

  // ⏱️ A HOSSZ MÉRÉSE — a hangból, ⛔ nem a fejléc állításából (az 22 369,6 mp-et mond).
  const audioSecs: number | null = SttAudioWindow_Util.durationSecs(audio);

  // 🎙️ A MEGŐRZÉS AZ ELSŐ — ⛔ minden downstream lépés ELŐTT. A sorrend SZÁNDÉKOS: innentől
  // bármi elhasalhat, a forrás akkor is a lemezen van. Owner: *„A megőrzés ELSŐBBSÉGET élvez
  // a tisztaság előtt."*
  const audioKept: boolean = params.archive
    ? await params.archive({ audio: audio, filename: params.filename })
    : false;

  // 🔊 Innentől TÉNYLEG dolgozunk rajta — a felvétel megvan és olvasható.
  // ⛔ Nem korábban: a „hallak" és a „dolgozom rajta" NEM ugyanaz a pillanat.
  params.onProcessingStart?.();

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
    const detail: string = understoodButDoubtful
      ? `Gyanús átirat — NEM cselekszem rá: ${result.suspicionReason ?? result.detail}`
      : `A felismerés nem adott használható szöveget: ${result.detail}`;

    // 🔴 A HANG NEM VESZHET EL — de CSAK a technikai bukást érdemes újrapróbálni.
    //
    // ⭐ A KÜLÖNBSÉG LÉNYEGES: a `recognition-failed` azt jelenti, hogy a felismerés **le sem
    // futott** *(időtúllépés, szolgáltatás-hiba)* — a hang ép, és egy későbbi próba, nyugodtabb
    // gép mellett, jó eséllyel sikerül. A `not-understood` viszont azt jelenti, hogy a
    // felismerés **lefutott**, csak kétes eredményt adott: ⛔ ugyanazt a bemenetet újra
    // feldolgozva **ugyanazt a kétes eredményt** kapnánk. Az újrapróbálás ott csak égetné az
    // amúgy is szűk erőforrást.
    if (!understoodButDoubtful) {
      params.onRecognitionFailed?.({ audio: audio, filename: params.filename, failure: detail });
    }

    return {
      fromOwner: true,
      transcribed: false,
      queued: false,
      missed: understoodButDoubtful ? 'not-understood' : 'recognition-failed',
      detail: detail,
      // ⭐ A NYERS ÁTIRAT TOVÁBBMEGY — ⛔ nem a kötegbe, hanem a VISSZAJELZÉSBE. A
      // hallucináció-őr változatlan: gyanús átiratra **továbbra sem cselekszünk**.
      ...(result.text.trim() ? { heard: result.text.trim() } : {}),
      ...(result.suspicionReason ? { reason: result.suspicionReason } : {}),
      // 🎤 A ZAJ-JELZŐ ÁTMEGY: ebből lesz a saját napló-kód, és ebből tudja a
      // visszajelzés-terv, hogy ⛔ NEM szólunk róla az ownernek.
      ...(result.isNoise ? { isNoise: true } : {}),
      audioKept: audioKept,
      filename: params.filename,
      ...(audioSecs === null ? {} : { audioSecs: audioSecs }),
    };
  }

  // ⭐ A FÁJLNÉV AZ AZONOSÍTÓ: megszólalásonként egyedi, és a híd duplikáció-védelme erre épül.
  const outcome = await params.bridge.handleOwnerSpeech({
    messageId: params.filename,
    channelId: params.channelId,
    speakerId: params.userId,
    speakerName: params.ownerName,
    transcript: result.text.trim(),
    // 🧩 A DARABOLÁS TOVÁBBMEGY a jelölésbe — ⛔ nem áll meg a naplónál. Az owner
    // csak így látja, hogy összefűzött szöveget kapott (és hogy hiányzik-e belőle részlet).
    ...(result.segmentation ? { segmentation: result.segmentation } : {}),
  });

  return {
    fromOwner: true,
    transcribed: true,
    queued: outcome.queued,
    detail: outcome.detail,
    heard: result.text.trim(),
    audioKept: audioKept,
    filename: params.filename,
    ...(audioSecs === null ? {} : { audioSecs: audioSecs }),
    // 🧩 A DARABOLÁS A NAPLÓIG MEGY — ⛔ nem áll meg a jelölésnél.
    ...(result.segmentation ? { segmentation: result.segmentation } : {}),
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
  /** 🔊 Továbbadva a `handleFinishedRecording`-nak — a feldolgozás kezdetén szól. */
  onProcessingStart?: () => void;
  /**
   * 🔍 Minden NÉMÁN ELDOBOTT felvételnél hívódik — másodpercben megadva, mennyi hang veszett el.
   *
   * ⭐ Ez válaszolja meg azt, amit a `onSpeechAttempt` NEM tudott: hogy a hiányzó megszólalás
   * beleolvadt-e egy futó felvételbe *(nem veszteség)*, vagy a felvevő beszéd-validációja
   * dobta ki *(veszteség)*. Részletek: `voice-drop-probe.ts`.
   */
  onSpeechDropped?: (observation: VoiceDropObservation) => void;
  /** 🔴 Technikai felismerés-bukásnál — a hang bájtjaival, újrapróbálásra. */
  onRecognitionFailed?: (info: { audio: Uint8Array; filename: string; failure: string }) => void;
  /** 🎙️ Továbbadva a `handleFinishedRecording`-nak — a nyers hang megőrzése a felismerés ELŐTT. */
  archive?: (info: { audio: Uint8Array; filename: string }) => Promise<boolean>;
  /** A szonda saját hibái. ⚠️ Sosem fatálisak — a megfigyelés nem buktathatja meg a felvételt. */
  onProbeError?: (detail: string) => void;
  /** Tesztelhetőség: kész szonda átadása. */
  probe?: VoiceDropProbe;
  /**
   * 🎨 AZ ÉLŐ, KERETENKÉNTI SZÍNES SÁV betöltője (T-52).
   *
   * ⚠️ Cserélhető, hogy a teszt **ne** töltse be a valódi, 19,5 s-es átemelt fát.
   * ⛔ Ha `null`-t ad vissza, a sáv egyszerűen elmarad — a felvétel ettől nem sérül.
   */
  loadAnalyzer?: () => Promise<AnalyzerLike | null>;
  /** A sáv példánya. Alapból a konzolra ír. */
  analysisBar?: VoiceAnalysisBar;
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

    // 🎨 AZ ÉLŐ SÁV RÁKÖTÉSE (T-52). Owner: `|` színesen, KERETENKÉNT, beszéd közben.
    // ⛔ A bukása SOHA nem fatális: a sáv diagnosztika, a felvétel a termék.
    //
    // 🔴 MÉRT CSAPDA (2026-09-08 09:47): ha a hívó **lecserélte a felvevőt** (teszt vagy más
    // gazda), de az elemzőt nem, akkor az alapértelmezés **behúzná a valódi átemelt fát** —
    // és a teszt-suite futásideje **5 mp-ről 317 mp-re** ugrott. Ezért a kettő EGYÜTT jár:
    // az átemelt fát **egységként** töltjük, vagy sehogy.
    await attachAnalysisBarSafely({
      load: params.loadAnalyzer ?? (params.loadRecorder
        ? async (): Promise<AnalyzerLike | null> => null
        : async (): Promise<AnalyzerLike | null> => loadTransplantedAnalyzer()),
      bar: params.analysisBar ?? createConsoleBar(),
      onError: (detail: string): void => params.onProbeError?.(detail),
    });

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
        ...(params.onRecognitionFailed ? { onRecognitionFailed: params.onRecognitionFailed } : {}),
        ...(params.onProcessingStart ? { onProcessingStart: params.onProcessingStart } : {}),
        ...(params.archive ? { archive: params.archive } : {}),
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
