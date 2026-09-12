// 🗂️ EGY FELVÉTEL KIMENETELE — a szókincs, amit a felvevő ÍR és három modul OLVAS.
//
// ⭐ MIÉRT KÜLÖN FÁJL *(2026-09-11)*: a `voice-channel-recorder.ts` a megőrzés bekötésével
// **504 sor** lett, a `max-file-lines` felső határa viszont 500. ⛔ A szabályt nem kapcsoljuk
// ki — a fájlt bontjuk, pontosan ahogy a review tanácsolja.
//
// ⚠️ És a bontás **nem csak a sorszám miatt helyes**: ez a szókincs önálló szerződés. A
// felvevő **kitölti**, a `voice-feedback-plan` **eldönti belőle**, mi szóljon, a
// `discord.listener` **naplózza**, a `comm.doctor` pedig **visszaolvassa**. Négy fogyasztó
// egyetlen típus-halmazon — pont az, aminek saját helye van.

import type { SttSegmentation } from '../stt/stt.models.js';
import { VOICE_LOG_CODES } from './voice-log-codes.js';
import type { MissedSpeechKind } from './voice-missed-speech.js';

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

/** Egy elkészült felvétel feldolgozásának kimenetele — a naplózáshoz és a teszthez. */
export interface RecordingHandled {
  /**
   * 🎤 BULI-ZAJ volt-e *(rövid + nem magyar átirat)*.
   *
   * 🔴 KÉT KÖVETKEZMÉNYE VAN, és mindkettő fontos:
   *   1. **saját napló-kód** ⇒ a tölcsérben **külön sorban** látszik, ⛔ nem veszteségként;
   *   2. ⛔ **NINCS owner-jelentés** róla — mérve 2026-09-12: egy este **243** ilyen tétel
   *      keletkezett. Ha mindegyikről szólnánk, az **maga lenne** az elviselhetetlen zaj.
   */
  isNoise?: boolean;
  /**
   * ⏱️ A felvétel hossza másodpercben — a MÉRÉSHEZ, ⛔ nem a döntéshez.
   *
   * 🔴 MÉRT INDOK (2026-09-11): a „felismerés után elveszett" **23 megszólalás** mindegyike
   * **0,3-2,3 másodperces** töredék volt *(légzés, mondat-farok)*, amibe a felismerő
   * `„Thank you."`-t hallucinált — ⛔ **NEM elveszett mondat**. Enélkül a mérésből az a hamis
   * következtetés jött, hogy 23 owner-mondat veszett el, és a **javítást is oda** vitte.
   * ⇒ A hossz a naplóba kerül, hogy a tölcsér-jelentés ezt **meg tudja mutatni**.
   */
  audioSecs?: number;
  /**
   * 🧩 DARABOLVA ismertük fel? *(Csak ha TÖBB részlet volt.)*
   *
   * 🔴 MIÉRT UTAZIK EL A NAPLÓIG: a felismerő **30 mp-es ablaka** miatti veszteség eddig
   * **teljesen láthatatlan** volt a mérésben — a csonka átirat ✅ **sikerként** számolt.
   * ⇒ Ha a darabolás nem hagy nyomot a naplóban, ugyanúgy nem tudnánk, működik-e.
   */
  segmentation?: SttSegmentation;
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
  /**
   * ❓ AMIT ÉRTETTÜNK — akkor is, ha gyanús.
   *
   * > **Owner, 2026-09-11 01:29 (hang):** *„Ha hallottam, de nem értettem biztosan résznél,
   * > ott jó lenne, ha kiírnánk azt is, hogy mit hallottál, vagy miért nem lett biztos."*
   *
   * ⭐ Így **ő** dönti el, jól hallottam-e — ⛔ nem nekem kell eltalálnom.
   */
  heard?: string;
  /** MIÉRT nem lett biztos — rövid, konkrét ok. */
  reason?: string;
  /** ⭐ Megmaradt-e a nyers hang. ⛔ A hamis biztonság itt a legrosszabb kimenetel. */
  audioKept?: boolean;
  /**
   * A felvétel fájlneve — ⭐ a **korreláció** kulcsa a megőrzött hang felé.
   *
   * ⚠️ Enélkül a kimenetel nem rendelhető a felvételhez. *(A fájlnév „az azonosító".)*
   */
  filename?: string;
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
  | typeof VOICE_LOG_CODES.skipped
  /** 🎤 BULI-ZAJ: megszűrve — ⛔ se nem veszteség, se nem siker. */
  | typeof VOICE_LOG_CODES.noise;

/** A kimenetel osztályozása. */
export class VoiceRecordingOutcome_Util {

  /**
   * Melyik napló-kód illik a kimenetelre.
   *
   * ⭐ Tiszta függvény — ezért **tesztelhető**, és ezért nem rontottam el harmadszor is.
   */
  static classify(outcome: RecordingHandled): RecordingOutcomeCode {
    if (outcome.queued) return VOICE_LOG_CODES.queued;

    // 🎤 A ZAJ ELŐBB DŐL EL, mint a „veszteség": a nyitott mikrofon zaja ⛔ NEM az owner
    // elveszett mondata. ⚠️ Ha a `DROPPED` sorba esne, a tölcsér 243 veszteséget mutatna
    // ott, ahol 243 SIKERES szűrés történt — és a **valódi** veszteség eltűnne benne.
    if (outcome.isNoise) return VOICE_LOG_CODES.noise;

    if (outcome.missed !== undefined) return VOICE_LOG_CODES.dropped;

    return VOICE_LOG_CODES.skipped;
  }
}
