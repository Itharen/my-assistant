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

import { createReadStream, existsSync } from 'node:fs';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { readVoiceVolume } from './voice-volume.js';
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
/**
 * 🔴 A CCAP EREDETI LEKÉPEZÉSE — visszaellenőrizve a forrásban, 2026-09-10.
 *
 * > **Owner (2026-09-10 18:09, hangcsatorna):** *„ez egy furcsa hang, ami eddig nem létezett,
 * > szerintem ezt most szülted valahonnan… Vissza kéne nézned nagyon alaposan, hogy a CCAP-ba
 * > milyen eseményhez milyen hangok társultak, azt kéne reprodukáljuk, az már egy jól behangolt
 * > hangok voltak."*
 *
 * ⭐ **IGAZA VOLT.** A `cue-understood.mp3` a `11L-subtle,_warm,_mallow-1752274832820.mp3`
 * másolata volt — az a fájl a CCAP `sounds/` mappájában ott van, **de EGYETLEN eseményhez sem
 * volt kötve**. Vagyis nem reprodukáltuk a CCAP-ot: **választottunk** egy hangot.
 *
 * **A CCAP tényleges eseménye → hang párosítás** *(forrás: `ccap/discord-bot/src`)*:
 *
 * | CCAP-esemény | hang | hol |
 * |---|---|---|
 * | a **felismerés elindul** | `whoosh.mp3` | `cv-elevenlabs-speech-recognition:170`, `cv-local-speech-recognition:78` |
 * | eredmény **elfogadva** *(`OK` / `MISPELLED`)* · legjobb blokk kiválasztva | `typing.mp3` | `cv-result-review:178,185`, `cv-recording:908` |
 * | eredmény **kétes** *(`OUTOFCONTEXT`)* | `hmmm.mp3` | `cv-result-review:200` |
 * | **korai** eldobás *(osztályozás bukott, nincs zöld blokk)* | `early-skip` | `cv-processing:99`, `cv-recording:857,936` |
 * | eldobás | `skip.mp3` | `cv-processing:225` |
 * | hiba | `error.mp3` | — |
 *
 * ⚠️ **Ez megfordítja a korábbi `heard` jelentését is:** a `typing` a CCAP-ban **nem** a
 * „hallak", hanem az **„elfogadtam az eredményt"**. A „most kezdem feldolgozni" a `whoosh`.
 *
 * ⚠️ **MÉRT KOMPROMISSZUM:** a `whoosh.mp3` **77 kB / ~4,7 s** — jóval hosszabb a többinél
 * *(a `typing` 9,5 kB / 0,44 s)*. Ezért került korábban elutasításra. ⇒ Most **bekerül**,
 * mert az owner a **CCAP hűségét** kérte — de ha zavaróan hosszú, az **owner-döntés**, nem
 * az én ízlésem. *(`current/principles/transplant-not-rewrite.md` szelleme: a működő eredetit
 * reprodukáljuk, nem „jobbítjuk".)*
 */
const CUE_FILES: Record<VoiceCue, string> = {
  // 🔊 „most kezdem feldolgozni" — a CCAP-ban `whoosh.mp3`.
  heard: 'cue-processing.mp3',
  // ✅ „elfogadtam az eredményt" — a CCAP-ban `typing.mp3`.
  understood: 'cue-heard.mp3',
  dropped: 'cue-dropped.mp3',
  unsure: 'cue-unsure.mp3',
  error: 'cue-error.mp3',
};

/**
 * 🔴 KÉT SÁV, KÉT FÉK — és ez NEM finomhangolás, hanem hibajavítás.
 *
 * ⚠️ **A HIBA, amit ez megszüntet** *(a záró review-körben, az időzítés végigkövetésével
 * találtam meg)*: egyetlen közös fékkel a leggyakoribb eset **elnyelte a fontos jelzést**.
 *
 * ```
 * t=0,0 s   az owner megszólal        → 🎙️ „hallak"  ▸ a fék elindul
 * t~1,0 s   csend ⇒ a felvétel lezárul
 * t~1,4 s   a szonda látja: a felvevő ELDOBTA
 *           → 🎚️ „eldobva"           ⛔ A 3 s-os fék MEGETTE
 * ```
 *
 * ⇒ Az owner hallotta volna, hogy *„hallak"*, és **sosem** azt, hogy elveszett — pedig épp ez
 * az információ. ⭐ Az „hallak" **hangulatjelzés**; a kimenetel **maga az információ**. Egy
 * hangulatjelzés nem némíthat el egy információt.
 */
const AMBIENT_MIN_GAP_MS: number = 3_000;

/**
 * A KIMENETEL-jelzések féke — sokkal rövidebb.
 *
 * ⭐ Nem kell hosszú: a felvevő `AfterSilence`-szel **1000 ms** csenddel zár, tehát két
 * kimenetel eleve nem eshet ennél sűrűbben; és az egyidejű megszólalás ellen amúgy is véd a
 * „még szól az előző" ellenőrzés.
 */
const OUTCOME_MIN_GAP_MS: number = 800;

/**
 * Melyik sávba tartozik a jelzés.
 *
 * ⭐ `ambient` = *„figyelek"* · `outcome` = *„ez lett belőle"*. A kettő nem versenyezhet
 * ugyanazért a fékért.
 */
function cueTier(cue: VoiceCue): 'ambient' | 'outcome' {
  return cue === 'heard' ? 'ambient' : 'outcome';
}

/**
 * A hangok helye — a MODUL helyéhez képest, ⛔ NEM a `process.cwd()`-hez.
 *
 * 🔴 MÉRT HIBA, 2026-09-09 00:17 — az owner élőben tesztelte a hang-csatornát:
 * *„ha működik, akkor semmilyen hangvisszajelzést nem kapok jelenleg."* A napló megmondta,
 * miért:
 *
 * ```
 * MA-VOICE-CUE-FAILED: A hangfájl NEM található:
 *   E:\…\my-assistant\src\_assets\sounds\cue-unsure.mp3
 * ```
 *
 * ⚠️ A fájl a **`cli/src/_assets/sounds/`**-ban van — a keresés a **repó gyökerében** történt.
 *
 * **Az ok:** a korábbi `process.cwd()` azt jelentette, hogy a hangok helye attól függött,
 * **KI INDÍTOTTA a figyelőt**:
 *
 * | Indító | `cwd` | Eredmény |
 * |---|---|---|
 * | a szerver (`SupervisedChild`) | `…/my-assistant/cli` | ✅ megtalálta |
 * | kézi `ma comm listen` a repó gyökeréből | `…/my-assistant` | 🔴 **néma** |
 *
 * ⭐ **A hiba a NÉMASÁGBAN volt, nem a hangban:** minden más működött *(a beszéd átment, az
 * átirat elkészült)*, csak épp az owner **semmit nem hallott** — és emiatt azt hihette, hogy
 * a hang-jelzés meg sem épült. Az `onError` **naplózott**, csak senki nem nézte.
 *
 * ⇒ A modul saját helyéből indulunk, és **felfelé keressük** azt a könyvtárat, amiben a
 * `src/_assets/sounds` létezik. Így a **forrásból** (`cli/src/voice/`) és a **buildből**
 * (`cli/dist/cli/src/voice/`) is ugyanoda mutat, a `cwd` pedig **nem számít**.
 */
export function resolveSoundsDir(): string {
  const here: string = dirname(fileURLToPath(import.meta.url));
  let dir: string = here;

  // ⛔ Felfelé lépkedünk a gyökérig — a `cli/` a keresett szint, de a build mélyebben ül,
  // ezért a MÉLYSÉGET nem égetjük be (az elcsúszna a `outDir` bármely változásán).
  for (let step = 0; step < 8; step++) {
    const candidate: string = join(dir, 'src', '_assets', 'sounds');

    if (existsSync(candidate)) return candidate;

    const parent: string = dirname(dir);

    if (parent === dir) break;

    dir = parent;
  }

  // ⚠️ Ha nem találtuk meg, a RÉGI viselkedést adjuk vissza — így a hibaüzenet továbbra is
  // egy konkrét útvonalat nevez meg, amit meg lehet nézni. ⛔ Néma `''` nem lenne segítség.
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
  /** A „hallak" jelzés féke. Alapérték 3000 ms. */
  minGapMs?: number;
  /** A KIMENETEL-jelzések féke. Alapérték 800 ms. ⭐ Külön sáv — l. `cueTier`. */
  outcomeMinGapMs?: number;
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
  /**
   * 🔊 A hangerő beolvasása lejátszás ELŐTT.
   *
   * ⭐ MIÉRT MINDEN LEJÁTSZÁSNÁL, és nem egyszer indulásnál: az owner **menet közben** állítja
   * *(a felületről vagy `ma voice volume`-mal)*, és a figyelő **napokig fut**. Egy induláskor
   * beolvasott érték azt jelentené, hogy az állítás csak újraindítás után hallható — vagyis
   * gyakorlatilag nem működne.
   *
   * ⚠️ A fájl-olvasás itt elhanyagolható: egy jelzés amúgy is I/O-t indít (mp3 stream).
   */
  readVolume?: () => Promise<number>;
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
  private lastAmbientAtMs: number = 0;
  private lastOutcomeAtMs: number = 0;
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
    const tier: 'ambient' | 'outcome' = cueTier(cue);
    const minGap: number = tier === 'ambient'
      ? this.options.minGapMs ?? AMBIENT_MIN_GAP_MS
      : this.options.outcomeMinGapMs ?? OUTCOME_MIN_GAP_MS;
    const lastAtMs: number = tier === 'ambient' ? this.lastAmbientAtMs : this.lastOutcomeAtMs;

    if (now() - lastAtMs < minGap) return;

    // ⛔ Az egyidejű megszólalás ellen ez véd — sávtól függetlenül.
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

    if (tier === 'ambient') this.lastAmbientAtMs = now();
    else this.lastOutcomeAtMs = now();

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
    // 🔴 KORÁBBAN `inlineVolume: false` VOLT — vagyis a hangerő **egyáltalán nem volt
    // állítható**, a jelzés a fájl natív szintjén szólt. Az owner 2026-09-10-i kérése
    // *(„a My Assistant felületén is szeretném tudni állítani")* ezért nem egy meglévő érték
    // átállítása volt, hanem az, hogy **legyen egyáltalán mit állítani**.
    const resource = createAudioResource(createReadStream(path), {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
    });
    const readVolume: () => Promise<number> = this.options.readVolume ?? readVoiceVolume;
    const volume: number = await readVolume();

    // ⚠️ A `volume` akkor is `undefined` lehet, ha az `inlineVolume` be van kapcsolva (a
    // transzformáció felállítása bukhat) — ezért `?.`, és ⛔ ilyenkor sem hallgatunk el:
    // a jelzés natív szinten szól, ami rosszabb, mint a kért hangerő, de jobb a semminél.
    resource.volume?.setVolume(volume);

    this.player.play(resource);
  }
}

async function defaultFileExists(path: string): Promise<boolean> {
  try {
    await access(path);

    return true;
  } catch (err) {
    // A hianyzo fajl VART eset (`ENOENT`) — ez a fuggveny epp ezt kerdezi. De egy
    // JOGOSULTSAGI hiba mast jelent: a fajl OTT VAN, csak nem erjuk el. A nema `false`
    // ezt „nincs ilyen hangjelzes"-nek mondta volna, orokre.
    SwallowedFailure_Util.report('voice.cues.fileExists', err, ['ENOENT']);

    return false;
  }
}
