// 🔊 HANGJELZÉSEK — hallhatóvá tenni, hogy hallak, értelek, vagy épp elvesztettelek.
//
// > **Owner (2026-09-07 21:49):** *„voltak hangvisszajelzések, kis ilyen-olyan printy-pringy
// > hangok a CCAP-ban, amik azt jelezték, hogy elkezdted a feldolgozást, eldobtad azt az
// > üzenetet, folyik az üzenet, megjött az üzenet… folyamatos visszajelzést adtak arról, hogy
// > hallottad, hogy mit mondtam, érted, hogy mit mondtam, beszédnek lett azonosítva."*
//
// ⭐ MIÉRT KELL HANG, AMIKOR MÁR VAN SZÖVEGES TÜKÖR IS: aki **beszél**, az nem a képernyőt
// nézi. A tükör utólag igazol; a hang **közben** mond valamit — és a beszélő ettől tudja, hogy
// folytathatja, vagy meg kell ismételnie. Ez a kettő nem helyettesíti egymást.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 MIÉRT NEM A TRANSZPLANTÁLT `playSound`-OT HASZNÁLJUK — MÉRVE, nem feltételezve
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
// Az átemelt `CVO_Main_ControlService.playSound()` út a következő:
//
//   playSound → playAudioFile → ensureVoiceConnection
//             → CV_Connection_ControlService.createVoiceConnection(settings.ccap.useVoiceChannel)
//             → CCAP_MasterService.getInstance() + a CCAP saját `discordServer`-e
//
// ⇒ **Saját, CCAP-specifikus hang-kapcsolatot építene** egy olyan Discord-kliensből és
// szerver-objektumból, ami a my-assistantban **nem létezik**. Nálunk a kapcsolat már megvan,
// a `VoiceChannelPresence`-ből — és **egy csatornába kétszer belépni** nem lehet.
//
// ⛔ Az átemelt kódot NEM írjuk át (`transplant-not-rewrite`), ezért az adapter **MELLÉ** kerül:
// ez a fájl a MEGLÉVŐ kapcsolatunkon játszik le, ugyanazzal a `@discordjs/voice` könyvtárral.
//
// ⭐ AMIT VISZONT ÁTEMELTÜNK: **maguk a hangok.** Ezek a CCAP eredeti fájljai
// (`LIVE-projects/ccap/discord-bot/src/_assets/sounds/`), beszédes néven másolva:
//
// | itt | eredeti CCAP-fájl | mért hossz |
// |---|---|---|
// | `cue-heard.mp3` | `typing.mp3` | 0,44 s |
// | `cue-understood.mp3` | `11L-subtle,_warm,_mallow-1752274832820.mp3` | 2,09 s |
// | `cue-dropped.mp3` | `skip.mp3` | 0,84 s |
// | `cue-unsure.mp3` | `hmmm.mp3` | 2,64 s |
// | `cue-error.mp3` | `error.mp3` | 3,32 s |
//
// ⚠️ A HOSSZAK MÉRVE (`ffprobe`, 2026-09-07) — nem szemre válogatva. A `whoosh.mp3` **4,68 s**
// volt, ezért NEM lett jelzés: egy jelzés, ami hosszabb, mint amire reagálni kell, útban van.
//
// ❓ **A HOZZÁRENDELÉS AZ ÉN DÖNTÉSEM, nem az owneré** — ő azt mondta, *„voltak ilyen hangok",
// nem azt, hogy melyik mit jelentsen. A nevek beszédesek, a csere egy fájlmásolás.
// Felvéve az `open-questions.md`-be, hogy át tudja hangolni.

import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import {
  AudioPlayerStatus,
  StreamType,
  createAudioPlayer,
  createAudioResource,
  type AudioPlayer,
  type VoiceConnection,
} from '@discordjs/voice';

/** Mit jelez a hang. */
export type VoiceCue =
  /** 🎙️ Hallak — megkezdtem a feldolgozást. */
  | 'heard'
  /** ✅ Megvan: felismertem, és bekerült a kötegbe. */
  | 'understood'
  /** 🎚️ A felvevő eldobta — nem lett belőle semmi. */
  | 'dropped'
  /** ❓ Hallottam, de nem értettem biztosan. */
  | 'unsure'
  /** ❌ Hiba történt a feldolgozás közben. */
  | 'error';

/** A jelzés → fájl hozzárendelés. ⭐ Cseréhez elég a fájlt kicserélni, a kód marad. */
const CUE_FILES: Record<VoiceCue, string> = {
  heard: 'cue-heard.mp3',
  understood: 'cue-understood.mp3',
  dropped: 'cue-dropped.mp3',
  unsure: 'cue-unsure.mp3',
  error: 'cue-error.mp3',
};

/**
 * Két jelzés között ennyi időnek el kell telnie.
 *
 * 🔴 MÉRT INDOK: ma az eldobás a **többség**, tehát fék nélkül a csatorna egy szakadatlan
 * „pling-pling" lenne — és a **folyamatos** jelzés pontosan annyit ér, mint a semmi: nem
 * hordoz információt. ⭐ Ugyanaz a logika, amiért a szöveges kiesés-jelentés is összevon
 * (`voice-missed-speech.ts`).
 */
const DEFAULT_MIN_GAP_MS: number = 3_000;

/** A hangok helye. ⚠️ Ugyanaz a `process.cwd()`-konvenció, amit a felvevő is használ. */
export function resolveSoundsDir(): string {
  return join(process.cwd(), 'src', '_assets', 'sounds');
}

/**
 * 🔇 KI LEHET KAPCSOLNI — `MA_VOICE_CUES=off`.
 *
 * 🔴 MIÉRT KELL KAPCSOLÓ, MÉRT KOCKÁZAT MIATT: a jelzés a hang-csatornába szól, tehát az owner
 * **hangszórójából** is megszólal. Ha nem fejhallgatót használ, a saját mikrofonja **vissza is
 * veheti** — és akkor a jelzés maga jelenne meg „megszólalásként", pont abban a láncban,
 * aminek a veszteségét mérjük.
 *
 * ⚠️ Ez **nem mért tény, hanem mért KOCKÁZAT**: nem tudom, fejhallgatót használ-e
 * *(`open-questions.md`)*. Ezért nem tiltom le előre — de **egy környezeti változóval**
 * azonnal kikapcsolható, kódmódosítás nélkül. A `heard` jelzés a legérzékenyebb: az a
 * megszólalás KÖZBEN szól.
 */
export function areCuesEnabled(): boolean {
  return (process.env['MA_VOICE_CUES'] ?? '').trim().toLowerCase() !== 'off';
}

export interface VoiceCuePlayerOptions {
  /** Ennyi időnek el kell telnie két jelzés között. Alapérték 3000 ms. */
  minGapMs?: number;
  /** ⚠️ A jelzés hibája SOSEM fatális — csak jelentjük. */
  onError?: (detail: string) => void;
  /** Tesztelhetőség: a hangok könyvtára. */
  soundsDir?: string;
  /** Tesztelhetőség: létezik-e a fájl. */
  fileExists?: (path: string) => Promise<boolean>;
  /** Tesztelhetőség: a tényleges lejátszás. */
  playFile?: (path: string) => Promise<void>;
  /** Tesztelhetőség: az idő. */
  now?: () => number;
  /** Be van-e kapcsolva. Alapértelmezés: a `MA_VOICE_CUES` környezeti változó. */
  enabled?: () => boolean;
}

/**
 * 🔊 A jelzés-lejátszó.
 *
 * ⚠️ **A JELZÉS SOSEM BUKTATHATJA MEG A FELVÉTELT.** Minden hiba itt nyelődik el és
 * `onError`-ként jön vissza: egy hiányzó mp3, egy elszállt ffmpeg vagy egy megszakadt
 * kapcsolat **nem** némíthatja el a hang-csatornát. *(Ugyanaz a szabály, amit a
 * megszólalás-számlálónál is betartottunk: a megfigyelés nem lehet drágább, mint amit
 * megfigyel.)*
 */
export class VoiceCuePlayer {
  private readonly options: VoiceCuePlayerOptions;
  private readonly player: AudioPlayer = createAudioPlayer();
  private connection: VoiceConnection | null = null;
  private lastPlayedAtMs: number = 0;
  private missingSounds: Set<string> = new Set();

  constructor(options: VoiceCuePlayerOptions = {}) {
    this.options = options;

    // ⚠️ A lejátszó saját hibája sem dobhat: `@discordjs/voice`-ban ez `EventEmitter`-en jön,
    // és kezeletlenül **megölné a folyamatot**.
    this.player.on('error', (error: Error): void => {
      this.options.onError?.(`[voice/cues] A lejátszó hibája: ${error.message}`);
    });
  }

  /**
   * Rákötés a MEGLÉVŐ hang-kapcsolatra.
   *
   * ⭐ Nem hoz létre újat — a `VoiceChannelPresence` kapcsolatát használja, mert egy csatornába
   * kétszer belépni nem lehet, és nem is kell.
   */
  attach(connection: VoiceConnection): void {
    this.connection = connection;
    connection.subscribe(this.player);
  }

  /** Lekötés — a kapcsolat bontásakor. */
  detach(): void {
    this.player.stop(true);
    this.connection = null;
  }

  /**
   * Egy jelzés lejátszása.
   *
   * ⛔ **Csendben kihagyja**, ha (a) nincs kapcsolat, (b) még szól az előző, vagy (c) túl
   * hamar jönne az előző után. Ezek **nem hibák** — a fék a lényeg.
   */
  async play(cue: VoiceCue): Promise<void> {
    if (!this.connection) return;
    if (!(this.options.enabled ?? areCuesEnabled)()) return;

    const now: () => number = this.options.now ?? Date.now;
    const minGap: number = this.options.minGapMs ?? DEFAULT_MIN_GAP_MS;

    if (now() - this.lastPlayedAtMs < minGap) return;
    if (this.player.state.status !== AudioPlayerStatus.Idle) return;

    const soundsDir: string = this.options.soundsDir ?? resolveSoundsDir();
    const path: string = join(soundsDir, CUE_FILES[cue]);
    const exists: (p: string) => Promise<boolean> = this.options.fileExists ?? defaultFileExists;

    if (!await exists(path)) {
      // ⚠️ EGYSZER jelentjük fájlonként: egy hiányzó hangról nem kell minden megszólalásnál
      // új hibasort írni — a napló olvashatatlanná válna, és épp a valódi hibák vesznének el.
      if (!this.missingSounds.has(path)) {
        this.missingSounds.add(path);
        this.options.onError?.(
          `[voice/cues] A hangfájl NEM található: ${path}. `
          + 'Ellenőrizd a `cli/src/_assets/sounds/` mappát (CCAP-ból átemelt hangok).',
        );
      }

      return;
    }

    this.lastPlayedAtMs = now();

    try {
      const playFile: (p: string) => Promise<void> = this.options.playFile
        ?? ((p: string): Promise<void> => this.playOnConnection(p));

      await playFile(path);
    } catch (error: unknown) {
      this.options.onError?.(
        `[voice/cues] A(z) „${cue}" jelzés lejátszása ELBUKOTT: `
        + `${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * A tényleges lejátszás a Discord-kapcsolaton.
   *
   * ⚠️ Az mp3 dekódolásához **ffmpeg** kell (a `prism-media` ezt hívja). Mérve 2026-09-07:
   * `ffmpeg 7.0` a PATH-on van. Ha egy gépen mégsem lenne, a `player`-hiba `onError`-ként jön
   * — ⛔ nem néma bukásként.
   */
  private async playOnConnection(path: string): Promise<void> {
    const resource = createAudioResource(createReadStream(path), {
      inputType: StreamType.Arbitrary,
      inlineVolume: false,
    });

    this.player.play(resource);
  }
}

async function defaultFileExists(path: string): Promise<boolean> {
  try {
    await access(path);

    return true;
  } catch {
    return false;
  }
}
