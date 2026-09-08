// 🔍 A NÉMA ELDOBÁS MÉRŐSZALAGJA — hány MÁSODPERC beszéd vész el, és hol.
//
// > **Owner (2026-09-07 22:08):** *„beszéltem, beszéltem, tulajdonképpen annak egy százaléka
// > lett aztán transzkriptálva… De leginkább semmi nem ment át."*
//
// 🔴 MIÉRT NEM VOLT ELÉG A MEGSZÓLALÁS-SZÁMLÁLÓ (`SpeechAttemptStats`). Az két pontot mér:
// hány `speaking.start` jött, és hány jutott el a feldolgozó hookig. A kettő különbsége viszont
// **két, gyökeresen eltérő dolgot mos össze**:
//
//   1. a megszólalás **beleolvadt egy már futó felvételbe** — ez NEM veszteség (a felvevő
//      `wavUserStreams.has(userId)` ágán tér vissza korán, mert épp rögzít);
//   2. a felvevő **eldobta** a kész WAV-ot *(`handleStreamEnd` → `!hasSpeechActivity` →
//      `scheduleFileDeletion`)* — ez az IGAZI veszteség, és teljesen néma.
//
// ⇒ Egy „12 észlelt / 3 eljutott" szám ezért **nem dönt el semmit**: nem tudni, 9 beszéd veszett
// el, vagy 9 megszólalás simán ugyanabba a fájlba került. Küszöböt állítani ilyen adatra
// **találgatás** (`core-no-guessing`).
//
// ⭐ AMI ELDÖNTI: **maga a WAV-fájl.** A felvevő megszólalásonként nyit egyet a `recordings`
// könyvtárban, és ha eldobja, **törli**. Tehát a könyvtár figyelése pontosan a hiányzó
// információt adja meg:
//
//   • megjelent fájl, amiről szólt a hook  → **átjutott**
//   • megjelent fájl, ami TÖRLŐDÖTT hook nélkül → **eldobva** — és a **mérete megmondja,
//     hány másodperc hangot dobtunk ki**
//
// 🔊 A méret → idő átváltás pontos, mert a formátum rögzített (48 kHz · 2 csatorna · 16 bit,
// `cv-voice-recording.const.ts`): **192 000 bájt / másodperc**, 44 bájtos WAV-fejléc után.
// Így a jelentés nem „eldobott 1 fájlt", hanem **„eldobott 3,4 másodperc beszédet"** — ez az,
// amiből az owner és én is látjuk, mekkora a baj.
//
// ⛔ MEGFIGYELÉS, NEM MÓDOSÍTÁS. Az átemelt kódhoz nem nyúlunk (`transplant-not-rewrite`) — a
// szonda a fájlrendszert nézi, kívülről. A felvevő nem is tud róla.
//
// ⚠️ A DIAGNOSZTIKA SOSEM BUKTATHATJA MEG AZT, AMIT MEGFIGYEL. Minden hiba itt nyelődik el, és
// leíró eseményként jön vissza — egy olvashatatlan könyvtár nem némíthatja el a hang-csatornát.

import { readdir, stat } from 'node:fs/promises';
import { reportSwallowedFailure } from '../utils/swallowed-failure.js';

/** WAV-fejléc mérete a `wav` csomag `Writer`-énél — ennyi a „üres" fájl. */
const WAV_HEADER_BYTES: number = 44;

/**
 * Bájt / másodperc a felvevő rögzített formátumában.
 *
 * ⚠️ MÉRT ÉRTÉK, nem feltételezés: `cv-voice-recording.const.ts` →
 * `samplingFrequency: 48000` · `channels: 2` · `bitDepth: 16` ⇒ 48000 × 2 × 2 = 192 000.
 */
const BYTES_PER_SECOND: number = 48000 * 2 * (16 / 8);

/** Alapértelmezett mintavételi köz. */
const DEFAULT_POLL_MS: number = 400;

/**
 * Miért tűnt el a fájl — a szonda következtetése, **kizárólag mért adatból**.
 *
 * ⛔ Szándékosan NINCS „nem tudom, de tippelek" ág: amit nem lehet a méretből eldönteni, az
 * `discarded-by-recorder` marad, és a másodperc-adat mondja meg, mennyire fáj.
 */
export type VoiceDropReason =
  /** A fájl a fejlécen túl semmit nem tartalmazott — tényleg nem volt mit felismerni. */
  | 'empty-file'
  /** Volt benne hang, mégis törölték ⇒ a felvevő beszéd-validációja dobta el. */
  | 'discarded-by-recorder';

/** Egy eldobott felvétel — ez megy a naplóba. */
export interface VoiceDropObservation {
  /** A fájl neve (útvonal nélkül) — a hook ugyanezzel az azonosítóval dolgozik. */
  filename: string;
  /** A legnagyobb megfigyelt méret. ⚠️ A törlés utáni méret már nem kérdezhető le. */
  maxSizeBytes: number;
  /** Mennyi HANG veszett el — ez a szám mondja meg, mekkora a baj. */
  lostAudioSeconds: number;
  /** Mennyi ideig létezett a fájl (mérve, nem becsülve). */
  lifetimeMs: number;
  reason: VoiceDropReason;
}

/**
 * A teljes tölcsér — ez a négy szám együtt válaszolja meg, hogy „hol vész el a beszéd".
 *
 * ⭐ A `speechStarts` és a `filesOpened` KÜLÖNBSÉGE az, ami eddig hiányzott: az összeolvadt
 * megszólalások itt válnak el a valódi veszteségtől.
 */
export interface VoiceFunnelStats {
  /** `receiver.speaking` → 'start' az ownertől. */
  speechStarts: number;
  /** Ennyi WAV-fájl nyílt meg ténylegesen (a többi beleolvadt egy futó felvételbe). */
  filesOpened: number;
  /** Ennyi jutott el a feldolgozó hookig. */
  filesDelivered: number;
  /** Ennyi tűnt el a hook megszólalása NÉLKÜL. */
  filesDropped: number;
  /** Az eldobott fájlokban lévő hang összesen — a veszteség „súlya". */
  lostAudioSeconds: number;
}

/** Egy figyelt fájl könyvelése. */
interface TrackedFile {
  firstSeenMs: number;
  maxSizeBytes: number;
  delivered: boolean;
}

export interface VoiceDropProbeOptions {
  /** A felvevő `recordings` könyvtára. */
  recordingsDir: string;
  /**
   * 🔴 CSAK AZ OWNER FELVÉTELEIT MÉRJÜK — ha megadva.
   *
   * ⚠️ MÉRT OK: az átemelt felvevő **mindenkit** rögzít, aki a csatornában megszólal
   * *(`handlePcmReceiver` → `receiver.speaking.on('start')`, szűrés nélkül)*. A szonda viszont
   * arra a kérdésre felel, hogy **az OWNER beszédéből** mennyi vész el. Szűrés nélkül egy
   * belépő idegen beszéde „elveszett hangként" jelenne meg — és a mérés, ami hazudik, rosszabb,
   * mint a mérés hiánya.
   *
   * ⭐ A fájlnév hordozza az azonosítót: `recording-<userId>-<timestamp>.wav`
   * *(`cv-recording.control-service.ts:110`)*.
   */
  ownerUserId?: string;
  /** Minden eldobásnál hívódik. ⚠️ A dobott hibája nem állíthatja meg a szondát. */
  onDrop?: (observation: VoiceDropObservation) => void;
  /** A szonda saját hibái — ⛔ soha nem dobjuk tovább, csak jelentjük. */
  onProbeError?: (detail: string) => void;
  /** Mintavételi köz. Alapérték 400 ms. */
  pollMs?: number;
  /** Tesztelhetőség: könyvtár-listázás. */
  listDir?: (dir: string) => Promise<string[]>;
  /** Tesztelhetőség: fájlméret. */
  sizeOf?: (path: string) => Promise<number>;
}

/**
 * 🔍 A szonda.
 *
 * Használat: `start()` a felvétel elindítása után, `markSpeechStart()` a `speaking.start`
 * eseménynél, `markDelivered(filename)` a feldolgozó hookban, `stop()` leálláskor.
 *
 * ⭐ MIÉRT MINTAVÉTEL, ÉS NEM `fs.watch`: a törlést kell elkapni, és arra a `watch` platformonként
 * eltérően viselkedik. A mintavétel viszont **mért alsó korláttal** biztonságos: a felvevő az
 * opus-folyamot `AfterSilence`-szel, **1000 ms** csenddel zárja
 * *(`handlePcmReceiver` → `end: { behavior: AfterSilence, duration: 1000 }`)*, tehát egy fájl
 * legalább ~1 másodpercig létezik. A 400 ms-os köz ezt bőven elkapja.
 */
export class VoiceDropProbe {
  private readonly options: VoiceDropProbeOptions;
  private readonly tracked: Map<string, TrackedFile> = new Map();
  private readonly stats: VoiceFunnelStats = {
    speechStarts: 0,
    filesOpened: 0,
    filesDelivered: 0,
    filesDropped: 0,
    lostAudioSeconds: 0,
  };

  private timer: ReturnType<typeof setInterval> | undefined;
  private sweeping: boolean = false;

  constructor(options: VoiceDropProbeOptions) {
    this.options = options;
  }

  /** A pillanatnyi tölcsér — másolat, hogy a hívó ne tudja elrontani a könyvelést. */
  get funnel(): VoiceFunnelStats {
    return { ...this.stats };
  }

  /** Elindítja a mintavételt. Kétszeri hívás ártalmatlan. */
  start(): void {
    if (this.timer) return;

    const pollMs: number = this.options.pollMs ?? DEFAULT_POLL_MS;

    this.timer = setInterval((): void => void this.sweep(), pollMs);

    // ⭐ A ciklus NEM tartja életben a folyamatot: a szonda diagnosztika, nem szolgáltatás.
    this.timer.unref?.();
  }

  /** Leállítja a mintavételt. */
  stop(): void {
    if (!this.timer) return;

    clearInterval(this.timer);
    this.timer = undefined;
  }

  /** A `receiver.speaking` 'start' eseménynél hívandó. */
  markSpeechStart(): void {
    this.stats.speechStarts += 1;
  }

  /** Az owner felvétele-e a fájl — a nem-owner hangja NEM az ő vesztesége. */
  private isOwnerRecording(name: string): boolean {
    return isOwnerRecordingName(name, this.options.ownerUserId);
  }

  /**
   * A feldolgozó hookban hívandó — innen tudjuk, hogy ez a fájl NEM veszett el.
   *
   * @param filenameOrPath teljes útvonal is lehet; csak a fájlnevet nézzük.
   */
  markDelivered(filenameOrPath: string): void {
    const name: string = baseName(filenameOrPath);
    const entry: TrackedFile | undefined = this.tracked.get(name);

    // ⚠️ IDEMPOTENS. Az átemelt kód KÉT helyről hívja a hookot
    // *(`cv-recording.control-service.ts:848` és `:928`)*, és bár van duplikátum-védelme, a
    // szonda nem támaszkodhat rá: a kétszer könyvelt kézbesítés **túl rózsás** tölcsért adna.
    if (entry?.delivered) return;

    this.stats.filesDelivered += 1;

    if (!entry) {
      // ⚠️ Előfordulhat, hogy a hook GYORSABB volt, mint az első mintavétel. Ilyenkor
      // előre elkönyveljük kézbesítettként, hogy a későbbi eltűnés NE számítson eldobásnak.
      this.tracked.set(name, { firstSeenMs: Date.now(), maxSizeBytes: 0, delivered: true });

      return;
    }

    entry.delivered = true;
  }

  /**
   * Egy mintavételi kör: mi jelent meg, mi nőtt, mi tűnt el.
   *
   * ⚠️ Az átfedő futások kizárva (`sweeping`): egy lassú lemez különben duplán könyvelne.
   */
  private async sweep(): Promise<void> {
    if (this.sweeping) return;

    this.sweeping = true;

    try {
      const list: (dir: string) => Promise<string[]> = this.options.listDir ?? defaultListDir;
      const present: string[] = (await list(this.options.recordingsDir))
        .filter((name: string): boolean => name.toLowerCase().endsWith('.wav'))
        .filter((name: string): boolean => this.isOwnerRecording(name));
      const presentSet: Set<string> = new Set(present);

      await this.observePresent(present);
      this.reportVanished(presentSet);
    } catch (error: unknown) {
      this.options.onProbeError?.(
        `[voice/drop-probe] A könyvtár nem olvasható (${this.options.recordingsDir}): `
        + `${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.sweeping = false;
    }
  }

  /** Az ÉPP LÉTEZŐ fájlok könyvelése — új megjelenés + méret-csúcs. */
  private async observePresent(present: string[]): Promise<void> {
    const sizeOf: (path: string) => Promise<number> = this.options.sizeOf ?? defaultSizeOf;

    for (const name of present) {
      let entry: TrackedFile | undefined = this.tracked.get(name);

      if (!entry) {
        entry = { firstSeenMs: Date.now(), maxSizeBytes: 0, delivered: false };
        this.tracked.set(name, entry);
        this.stats.filesOpened += 1;
      }

      try {
        const size: number = await sizeOf(joinPath(this.options.recordingsDir, name));

        // ⭐ CSÚCSOT tartunk: a törlés pillanatában a méret már nem kérdezhető le, tehát a
        // legnagyobb megfigyelt érték az egyetlen, amit az elveszett hangról tudhatunk.
        if (size > entry.maxSizeBytes) entry.maxSizeBytes = size;
      } catch (err) {
        // ⚠️ A fajl epp eltunhetett ket muvelet kozott (`ENOENT`) — ez NEM hiba, a kovetkezo
        // kor kezeli. Barmi mas viszont az: e nelkul a szonda „0 bajtos elveszett hangot"
        // jelentene egy olvasasi hiba miatt, es pont a meres valna hamissa.
        reportSwallowedFailure('voice.drop-probe.sizeOf', err, ['ENOENT']);
      }
    }
  }

  /** Ami eltűnt: kézbesítve volt-e, vagy némán eldobva. */
  private reportVanished(presentSet: Set<string>): void {
    for (const [name, entry] of [...this.tracked.entries()]) {
      if (presentSet.has(name)) continue;

      this.tracked.delete(name);

      if (entry.delivered) continue;

      const lostAudioSeconds: number = toAudioSeconds(entry.maxSizeBytes);

      this.stats.filesDropped += 1;
      this.stats.lostAudioSeconds = round2(this.stats.lostAudioSeconds + lostAudioSeconds);

      this.options.onDrop?.({
        filename: name,
        maxSizeBytes: entry.maxSizeBytes,
        lostAudioSeconds: lostAudioSeconds,
        lifetimeMs: Date.now() - entry.firstSeenMs,
        reason: entry.maxSizeBytes > WAV_HEADER_BYTES ? 'discarded-by-recorder' : 'empty-file',
      });
    }
  }
}

/**
 * Bájtból hang-másodperc.
 *
 * A fejléc levonása után a rögzített formátum egyértelműen átváltható. Negatív sosem lesz
 * belőle: a fejlécnél kisebb fájl 0 másodperc.
 */
export function toAudioSeconds(sizeBytes: number): number {
  return round2(Math.max(0, sizeBytes - WAV_HEADER_BYTES) / BYTES_PER_SECOND);
}

/** Egy mondat a naplóba — a mérésből, nem a hangulatból. */
export function describeFunnel(stats: VoiceFunnelStats): string {
  const merged: number = Math.max(0, stats.speechStarts - stats.filesOpened);

  return `${stats.speechStarts} megszólalás → ${stats.filesOpened} felvétel `
    + `(${merged} beleolvadt) → ${stats.filesDelivered} feldolgozva, `
    + `${stats.filesDropped} eldobva (${stats.lostAudioSeconds} mp hang).`;
}

/**
 * Az owner felvétele-e.
 *
 * ⚠️ Ha nincs megadva `ownerUserId`, MINDENT figyelünk — ez a tesztek és a kézi vizsgálat
 * módja. Élesben viszont mindig meg van adva (`voice-channel-recorder.ts`).
 */
function isOwnerRecordingName(name: string, ownerUserId: string | undefined): boolean {
  if (!ownerUserId) return true;

  return name.startsWith(`recording-${ownerUserId}-`);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function baseName(pathOrName: string): string {
  return pathOrName.replace(/^.*[\\/]/, '');
}

function joinPath(dir: string, name: string): string {
  return `${dir.replace(/[\\/]+$/, '')}/${name}`;
}

async function defaultListDir(dir: string): Promise<string[]> {
  return readdir(dir);
}

async function defaultSizeOf(path: string): Promise<number> {
  return (await stat(path)).size;
}
