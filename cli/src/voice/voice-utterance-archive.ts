// 🎙️ AMIT KIMONDOTT, AZ MEGMARAD — a megszólalás archívuma.
//
// > **Owner, 2026-09-11 01:57 (hang):** *„megint ment át egy nagy adag beszédem… biztosítani
// > kéne azt, hogy **elmenthessem a hangüzeneteimet**… minél többet beszélek, annál fontosabb,
// > hogy ez **el legyen mentve, és ne kelljen újra elmondanom, mert nem mindig tudom ugyanúgy**."*
//
// ## 🔴 A MÉRT GYÖKÉR — és miért PONT ITT kell javítani
//
// `ma comm voice-funnel --day 2026-09-11` ⇒ **62,5% átvitel** 24 megszólalásból; ebből
// *„felismerés után elveszett: 6"*. A kódban ez a `handleFinishedRecording` **bizonytalan** ága:
//
// ```ts
// const understoodButDoubtful = result.ok && result.suspicious;
// if (!understoodButDoubtful) {
//   params.onRecognitionFailed?.({ audio, filename, failure: detail });   // ⬅ csak a TECHNIKAI bukás
// }
// ```
//
// ⇒ A *„hallottam, de nem értettem biztosan"* ágon **semmi nem hívódik**: a WAV-ot az átemelt
// felvevő takarítása törli, a **nyers átirat** pedig a `detail` szövegén kívül **nem marad meg
// sehol**. ⭐ Tehát nem a felismerés a hibás — **az eldobás**.
//
// ⚠️ A szándékos `null` továbbra is HELYES *(„inkább ne értsük, mint félreértsük")*. A hiba nem
// az, hogy nem cselekszünk a bizonytalanra, hanem hogy **el is dobjuk**. ⛔ Ez a modul **nem**
// lazítja a hallucináció-őrt: a bizonytalan átirat továbbra sem kerül a kötegbe — csak
// **megmarad**, hogy legyen mihez visszatérni.
//
// ## ⭐ A MEGŐRZÉS ELŐBB VAN, MINT A FELDOLGOZÁS
//
// A hangot **a felismerés ELŐTT** tesszük el — nem utána, kimenetel szerint. Ez szándékos:
// így a **még nem ismert** hibafajták ellen is véd. Ha a felismerés összeomlik, a folyamat
// meghal, vagy valami olyan történik, amire ma nem gondolunk, a **forrás akkor is a lemezen
// van**, és újrafeldolgozható.
//
// > Owner: *„A megőrzés ELSŐBBSÉGET élvez a tisztaság előtt."*
//
// ## 🔒 SZEMÉLYES ADAT
//
// A felvétel és a nyers átirat **az owner kimondott mondatai** ⇒ a `~/.config/my-assistant/`
// alá kerülnek, ⛔ **soha nem a repóba** *(ugyanaz a döntés, mint a `stt-ledger`-nél)*.

import { mkdir, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';

/** Egy megszólalás sorsa az archívumban. */
type UtteranceStatus =
  /** ✅ Lett belőle használható szöveg, és bekerült a kötegbe. */
  | 'queued'
  /** ❓ Volt átirat, de gyanús — ⛔ nem cselekszünk rá, de MEGMARAD. */
  | 'uncertain'
  /** ❌ A felismerés nem adott használható szöveget (hiba, üres válasz, időtúllépés). */
  | 'recognition-failed';

/** A megőrzés kimenetele. ⚠️ Szándékosan nem exportált: a fájl egyetlen exportja a segéd-osztály. */
interface ArchiveOutcome {
  /** Sikerült-e a hangot lemezre tenni. */
  kept: boolean;
  /** A bejegyzés törzse — erre hivatkozik a napló és a jegyzet is. */
  stem: string;
  /** A hangfájl teljes útvonala, ha megvan. */
  audioPath?: string;
  /** MI történt — ⛔ bukásnál soha nem üres. */
  detail: string;
}

/** Amit a bizonytalanságról tudunk — a jegyzethez és az owner visszajelzéséhez. */
interface UncertaintyInput {
  /** A felismerés LEFUTOTT-e egyáltalán. */
  ok: boolean;
  /** A nyers, felismert szöveg — akkor is, ha gyanús. */
  text: string;
  /** A hallucináció-őr indoka, ha adott. */
  suspicionReason?: string;
  /** A felismerő általános leírása. */
  detail: string;
}

/**
 * A megszólalás-archívum.
 *
 * ⛔ **Hibát SOHA nem dob.** A megőrzés **kísérő** funkció: ha elhasal, az nem viheti magával a
 * felismerést vagy a kézbesítést. ⚠️ De ⛔ nem is néma — minden művelet leíró eredményt ad,
 * és a bukás a `SwallowedFailure_Util`-on át naplózódik.
 */
export class VoiceUtteranceArchive_Util {

  /** Az archívum könyvtárneve. */
  static readonly DIR_NAME: string = 'voice-archive';

  /**
   * Az archívum helye.
   *
   * 🔒 A `~/.config` alatt, a `stt-ledger` mellett — ⛔ **nem a repóban**: ezek nyers
   * felhasználói tartalmak *(kimondott mondatok és a hangjuk)*.
   */
  static resolveRoot(userHome: string = homedir()): string {
    return join(userHome, '.config', 'my-assistant', VoiceUtteranceArchive_Util.DIR_NAME);
  }

  /**
   * A bejegyzés törzse — **dátumozva**, ahogy az owner kérte.
   *
   * @param now a megszólalás ideje.
   * @param speakerId ki beszélt — több beszélő mellett is visszakereshető marad.
   * @returns pl. `2026-09-11T02-14-33-123Z__1234567890`.
   *
   * ⭐ Tiszta függvény. ⚠️ A `:` és a `.` **nem lehet** fájlnévben Windowson, ezért kötőjelre
   * cseréljük — az ISO-alak rendezhetősége viszont megmarad *(a névsorrend = időrend)*.
   */
  static buildStem(now: Date, speakerId: string): string {
    const stamp: string = now.toISOString().replace(/[:.]/gu, '-');
    // ⚠️ A beszélő-azonosítót is szűrjük: útvonal-elválasztó SOHA nem juthat a fájlnévbe.
    const speaker: string = speakerId.replace(/[^a-zA-Z0-9_-]/gu, '') || 'unknown';

    return `${stamp}__${speaker}`;
  }

  /**
   * MIÉRT bizonytalan — kimondható, rövid indok.
   *
   * > **Owner, 2026-09-11 01:29 (hang):** *„Ha hallottam, de nem értettem biztosan résznél, ott
   * > jó lenne, ha kiírnánk azt is, hogy mit hallottál, vagy miért nem lett biztos."*
   *
   * ⭐ Tiszta függvény. ⭐ MIÉRT ÉR EZ SOKAT: így **ő** dönti el, hogy jól hallottam-e — ⛔ nem
   * nekem kell eltalálnom. A mai *„nem cselekszem rá"* igaz, de **használhatatlan**: nem tudja,
   * mit ismételjen meg és hogyan mondja másképp.
   */
  static describeUncertainty(input: UncertaintyInput): string {
    // ⚠️ A SORREND SZÁMÍT: a konkrét ok többet mond, mint az általános leírás.
    const reason: string = (input.suspicionReason ?? '').trim() || input.detail.trim();

    if (!input.ok) {
      // 🔴 Ez NEM bizonytalanság, hanem technikai bukás. A hazug diagnózis rossz irányba küldi
      // azt, aki javítani próbál — mérve 2026-09-08: 3 időtúllépés jelent meg „nem értettem"-ként.
      return reason || 'a felismerés le sem futott';
    }

    return reason || 'a felismerő nem adta meg az okot';
  }

  /**
   * A NYERS HANG eltétele — ⭐ **a feldolgozás ELŐTT**.
   *
   * @param input a hang bájtjai, a törzs, és az archívum gyökere.
   * @returns a megőrzés kimenetele. ⛔ Sosem dob.
   *
   * ⚠️ **Írás átmeneti fájlba, majd `rename`** — ugyanaz a minta, mint a hangerőnél: egy
   * félbeszakadt írás ⛔ nem hagyhat maga után csonka hangfájlt, mert az a „megvan, de
   * használhatatlan" legmegtévesztőbb állapotát hozná létre.
   */
  static async keep(input: {
    audio: Uint8Array;
    stem: string;
    root?: string;
  }): Promise<ArchiveOutcome> {
    const root: string = input.root ?? VoiceUtteranceArchive_Util.resolveRoot();
    const target: string = join(root, `${input.stem}.wav`);

    if (!input.audio.length) {
      // ⚠️ A NULLA BÁJTOS felvétel „megőrzés"-ként hazug siker lenne: a fájl ott van, de nincs
      // benne semmi, amit újra fel lehetne dolgozni.
      return { kept: false, stem: input.stem, detail: 'A felvétel ÜRES — nincs mit megőrizni.' };
    }

    try {
      await mkdir(root, { recursive: true });

      const temp: string = `${target}.tmp`;

      await writeFile(temp, input.audio);
      await rename(temp, target);

      return {
        kept: true,
        stem: input.stem,
        audioPath: target,
        detail: `A felvétel megőrizve (${input.audio.length} bájt).`,
      };
    } catch (err: unknown) {
      SwallowedFailure_Util.report('voice.utterance-archive.keep', err);

      return {
        kept: false,
        stem: input.stem,
        // 🔴 EZ A LEGSÚLYOSABB BUKÁS ITT: ha nem sikerült eltenni, a hang tényleg elveszhet.
        detail: 'A felvételt NEM sikerült megőrizni, ezért elveszhet: '
          + `${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * A megszólalás SORSÁNAK feljegyzése a hang mellé.
   *
   * ⭐ A NYERS ÁTIRAT AKKOR IS BEKERÜL, HA BIZONYTALAN — ez a 02:00-as kérés **2. rétege**.
   * ⛔ Ez **nem** jelenti, hogy cselekszünk rá: a köteg változatlanul csak a megbízható
   * átiratot kapja meg.
   *
   * @returns sikerült-e. ⛔ Sosem dob: a jegyzet elmaradása nem viheti magával a hangot, ami
   * ekkorra már a lemezen van.
   */
  static async annotate(input: {
    stem: string;
    status: UtteranceStatus;
    /** A nyers, felismert szöveg — üres, ha nem lett. */
    transcript?: string;
    /** MIÉRT nem lett használható — ⛔ `queued`-en kívül soha nem üres. */
    reason?: string;
    speakerId: string;
    channelId?: string;
    audioKept: boolean;
    root?: string;
    now?: Date;
  }): Promise<boolean> {
    const root: string = input.root ?? VoiceUtteranceArchive_Util.resolveRoot();
    const target: string = join(root, `${input.stem}.json`);

    try {
      await mkdir(root, { recursive: true });

      const temp: string = `${target}.tmp`;
      const note = {
        stem: input.stem,
        status: input.status,
        recordedAt: (input.now ?? new Date()).toISOString(),
        speakerId: input.speakerId,
        audioKept: input.audioKept,
        ...(input.channelId === undefined ? {} : { channelId: input.channelId }),
        ...(input.transcript === undefined ? {} : { transcript: input.transcript }),
        ...(input.reason === undefined ? {} : { reason: input.reason }),
      };

      await writeFile(temp, `${JSON.stringify(note, null, 2)}\n`, 'utf-8');
      await rename(temp, target);

      return true;
    } catch (err: unknown) {
      SwallowedFailure_Util.report('voice.utterance-archive.annotate', err);

      return false;
    }
  }
}
