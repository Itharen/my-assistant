// ⚠️ A ZAJ-SZŰRŐ VAK FOLTJA — MAGYARNAK HANGZÓ HALANDZSA (18. tétel)
//
// > **Owner, 2026-09-12 04:15 (a 04:14-es kötegből):**
// > *„Egyébként az számolóban a hátulágiakban, azért a terület szívesen kapcsánál…"*
// > *„A pro fysisz per lágrában. Én mindig a szóvaló értik a szóval."*
// > ⇒ *„Magyar szavak, magyar dallam, értelem nélkül — a 'nem magyar' feltétel nem fogja meg.
// > A megkülönböztető jel NEM a nyelv, hanem az ÉRTELMESSÉG."*
//
// ## 🔴 A KIKÖTÉS, AMI A TERVET MEGHATÁROZZA
//
// > **Owner:** *„bizonytalanságnál NE dobd el — JELÖLD MEG, és én döntök. A hibás pozitív itt
// > drága: egy valódi, de rosszul értett kérés veszne el."*
//
// ⇒ Ez a modul **SOHA nem dob el semmit**: egyetlen dolgot ad, egy **jelölést** a szöveg mellé
// *(a `⚠️ GYANÚS TAGOLÁS` mintájára)*. ⛔ A `suspicious`/`isNoise` ágakhoz **nem** nyúl.
//
// ## 🔬 A MÉRÉS — 207 beszéd-átirat, 6 felcímkézett halandzsa (2026-09-12)
//
// Korpusz: a megőrzött hang-archívum annotációi + a kötegbe jutott **beszéd**-tételek
// *(`voice-archive/*.json` + `discord/delivered-inbound.jsonl`)*, jelölés-mentesítve, egyediesítve.
//
// ### ⛔ AMIT MEGMÉRTEM ÉS ELVETETTEM *(⇒ ezek NINCSENEK a szabályban)*
//
// **1. A felismerő saját bizonytalansága — 🔴 NEM LÉTEZIK ezen a végponton.**
// Élőben mérve, egy archív felvétellel: a `/api/recognition` válasza
// `{ status, message, result.text, file_path }`; ⛔ `confidence` **nincs** benne, a
// `classification_confidence` `null`. *(Az OpenAI-kompatibilis `/v1/audio/transcriptions`
// API-kulcsot kér, ami nálunk nincs.)* ⇒ A handoff *„ez a legolcsóbb és legmegbízhatóbb jel,
// ha a modell adja"* feltétele **nem teljesül**.
//
// **2. Az `a`/`az` egyeztetés *(„az számolóban")* — 🔴 MEGCÁFOLVA.**
// A valódi üzenetek **8-11%**-a is „sérti", mert az `az` **mutató névmás** is *(„meg az,
// hogy…", „az volt, hogy…")*. A két halandzsa-példa ellenben 0/3 és 1/4-et adott
// ⇒ a jel **rosszabb, mint a véletlen**.
//
// **3. Az ismeretlen-arány EGYEDÜL — 🔴 NEM VÁLASZT EL.**
// A valódi beszéd-átiratok aránya **0,057 medián / 0,174 p95 / 0,250 MAX**, a halandzsa
// **0,125-0,375** ⇒ teljes átfedés. *(Ugyanaz a hibaosztály, mint a 17. tételnél a puszta hossz.)*
//
// ### ✅ AMI MARADT — a két feltétel EGYÜTT
//
// ```
// ÉRTELMESSÉG-GYANÚ  ⇐  ≥ 8 tartalmi szó
//                    ÉS  ismeretlen-arány ≥ 0,22
//                    ÉS  legalább 3 ismeretlen szó
// ```
//
// | Küszöb | A MÉRT horgony |
// |---|---|
// | **≥ 8 tartalmi szó** | rövid átiratnál az arány értelmezhetetlen *(3 szóból 1 ismeretlen = 0,33)* |
// | **arány ≥ 0,22** | a valódi beszéd-átiratok **p95-je 0,174** ⇒ a küszöb fölötte van |
// | **ismeretlen ≥ 3** | 🔴 **EZ ADJA A NULLA HAMIS JELÖLÉST** — l. a küszöb alatti bekezdést |
//
// 🔴 **A 3-AS ISMERETLEN-KÜSZÖB A DÖNTŐ:** az **egyetlen** valódi átirat, ami átlépi az
// arány-küszöböt *(0,250 — „Úgy látom, CCAT lett, de valójában az egy félre hallás, CCAP.")*
// mindössze **2** ismeretlen szót tartalmaz ⇒ kiesik. A két elkapott halandzsa **3** és **4**-et.
//
// ### 📊 AMIT EZ TUD, ÉS AMIT NEM — kimondva
//
// | | Érték |
// |---|---|
// | hamis jelölés a **207 valódi** beszéd-átiraton | ⭐ **0** |
// | elkapott halandzsa | ⚠️ **2 / 6** *(köztük az owner első példája: „A pro fysisz per lágrában", arány 0,375)* |
// | kimaradó halandzsa | 🔴 **4 / 6** — köztük a másik owner-példa *(„…hátulágiakban…", arány 0,125, 2 ismeretlen szó)* |
//
// 🔴 **A RECALL SZÁNDÉKOSAN ALACSONY.** A mért átfedés miatt **nincs** olyan szöveg-statisztikai
// küszöb, ami a 6-ból többet fog meg **hamis jelölés nélkül**: a legjobb magasabb-recall változat
// *(arány ≥ 0,22 **VAGY** ismétlődő ismeretlen szó)* 3/6-ot ad, de **4 valódi** átiratot is
// megjelöl. ⇒ A szűkebbet választottam, mert az owner *„egy sem"*-et kért a valódiakra.
// 🙋 **A tágítás owner-döntés** — a számok itt vannak hozzá.
//
// ⭐ **Ami a maradék 4-et is megfogná:** egy **értelmesség-ítélet helyi LLM-mel** *(a saját FDP AI
// `/api/v1/chat/completions`-je)*. ⛔ Nem építettem meg: a végpont modell-betöltést igényel,
// és **ugyanazon az éjszakán** a gép **100,5/127 GB**-on állt a nyitott mikrofon miatt — egy
// *jelölő* funkcióért ⛔ nem teszek 7B modell-betöltést az STT útjába. 🙋 Ez is owner-döntés.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { resolveProjectRoot } from '../utils/project-root.js';

/** Az értelmesség-vizsgálat eredménye. ⚠️ Szándékosan nem exportált: a döntés viszi. */
interface MeaningfulnessVerdict {
  /** ⚠️ Igaz, ha az átirat **gyanúsan értelmetlen** — ⛔ ez SOSEM eldobást jelent. */
  doubtful: boolean;
  /** Hány tartalmi szó *(3 karakter felett, nem szám)* van benne. */
  contentWords: number;
  /** A lexikonban nem szereplő szavak — a jelölés ezeket mutatja meg. */
  unknownWords: string[];
  /** Az ismeretlen szavak aránya a tartalmi szavakhoz. */
  unknownRatio: number;
  /** ⭐ Ember-olvasható indoklás, ha gyanús. */
  reason?: string;
}

/** Az értelmesség-vizsgálat — tiszta függvény, a szótár **injektált**. */
export class SttMeaningfulness_Util {

  /**
   * Ennyi tartalmi szó alatt ⛔ NEM ítélkezünk.
   *
   * ⚠️ MÉRT OK: rövid átiratnál az arány zajos — 3 szóból 1 ismeretlen már 0,33, miközben egy
   * *„Na jó, igazad van."* típusú valódi válasz pont ilyen rövid.
   */
  static readonly MIN_CONTENT_WORDS: number = 8;

  /**
   * Az ismeretlen szavak aránya ENNYI FELETT gyanús.
   *
   * 🔬 MÉRVE (2026-09-12, 177 valódi beszéd-átirat ≥ 8 szóval): medián **0,057**,
   * p95 **0,174**, maximum **0,250**. ⇒ A 0,22 a p95 FÖLÖTT van.
   */
  static readonly UNKNOWN_RATIO_THRESHOLD: number = 0.22;

  /**
   * 🔴 ENNYI ISMERETLEN SZÓ KELL — ez adja a nulla hamis jelölést.
   *
   * A **egyetlen** valódi átirat, ami átlépi az arány-küszöböt *(0,250: „Úgy látom, CCAT lett,
   * de valójában az egy félre hallás, CCAP.")* **2** ismeretlen szót tartalmaz. A két elkapott
   * halandzsa **3** és **4**-et. ⇒ A 3-as küszöb pontosan a kettő közé esik.
   */
  static readonly MIN_UNKNOWN_WORDS: number = 3;

  /**
   * Értelmetlennek látszik-e az átirat?
   *
   * @param input a szöveg és a szótár-kérdés *(`isKnownWord`)* — ⭐ az utóbbi **injektált**,
   *   hogy a döntés fájl-olvasás nélkül tesztelhető legyen.
   * @returns a verdikt, **indoklással** — ⛔ soha nem eldobási utasítás.
   */
  static inspect(input: { text: string; isKnownWord?: (word: string) => boolean }): MeaningfulnessVerdict {
    const isKnown: (word: string) => boolean = input.isKnownWord
      ?? ((word: string): boolean => HuLexicon.has(word));
    const words: string[] = SttMeaningfulness_Util.contentWordsOf(input.text);
    const unknown: string[] = words.filter((word: string): boolean => !isKnown(word));
    const ratio: number = words.length ? unknown.length / words.length : 0;
    const enoughWords: boolean = words.length >= SttMeaningfulness_Util.MIN_CONTENT_WORDS;
    const doubtful: boolean = enoughWords
      && ratio >= SttMeaningfulness_Util.UNKNOWN_RATIO_THRESHOLD
      && unknown.length >= SttMeaningfulness_Util.MIN_UNKNOWN_WORDS;

    return {
      doubtful: doubtful,
      contentWords: words.length,
      unknownWords: unknown,
      unknownRatio: ratio,
      ...(doubtful
        ? {
          reason: `${unknown.length} ismeretlen szó a ${words.length} tartalmi szóból `
            + `(${Math.round(ratio * 100)}%, küszöb: `
            + `${Math.round(SttMeaningfulness_Util.UNKNOWN_RATIO_THRESHOLD * 100)}%): `
            + unknown.slice(0, 5).join(', '),
        }
        : {}),
    };
  }

  /** Hány szó van a betöltött lexikonban — a diagnosztikához és a teszthez. */
  static lexiconSize(): number {
    return HuLexicon.size();
  }

  /** Ismert szó-e a lexikon szerint *(kisbetűs, ékezet nélküli alakot vár)*. */
  static isKnownWord(word: string): boolean {
    return HuLexicon.has(word);
  }

  /** ⚠️ Csak a teszt hívja: a következő kérdés újratölti a lexikont. */
  static resetLexicon(): void {
    HuLexicon.reset();
  }

  /**
   * A tartalmi szavak — kisbetűsítve és **ékezet-lebontva**.
   *
   * ⭐ MIÉRT ÉKEZET NÉLKÜL: a felismerés hol ékezettel, hol anélkül ír ugyanazt a szót
   * *(mérve: „Nem megy a dolog" ékezet nélkül is előfordult)*. Ha a szótár ékezet-érzékeny
   * lenne, minden ékezet-vesztés **hamis ismeretlen** szót adna.
   */
  private static contentWordsOf(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/gu, '')
      .split(/[^0-9a-z'-]+/u)
      .filter((word: string): boolean => word.length > 2 && !/^[0-9]+$/u.test(word));
  }
}

// 📚 A MAGYAR SZÓ-LEXIKON — az értelmesség-vizsgálat szótára (18. tétel)
//
// ## ⭐ MI EZ, ÉS MIÉRT A REPÓBÓL JÖN
//
// A `cli/data/hu-lexicon.txt` **generált, git-trackelt** artefakt: a repó saját markdown-jaiban
// *(`current/`, `__documentations/`, `__specifications/`)* **legalább kétszer** előforduló szavak,
// kisbetűsítve és ékezet-lebontva. Újragenerálás:
//
// ```
// PYTHONUTF8=1 python scripts/build-hu-lexicon.py
// ```
//
// - ⛔ **NEM az átiratokból:** a halandzsa-szavak *(„fysisz", „szipotékig")* önmagukat
//   legitimálnák — a szűrő pont azt engedné át, amit meg kell fognia.
// - ⛔ **NEM az `__agent/`-ből:** a handoff és a napló **IDÉZI** a halandzsát ⇒ ugyanaz a
//   szennyezés, más úton.
// - ⭐ **gyakoriság ≥ 2:** egyetlen előfordulás lehet elírás vagy beidézett félrehallás.
//   **Mérve:** a ≥2-es szűrés a valódi átiratok ismeretlen-arányát 0,000→0,057 medián-ra tolta,
//   a halandzsát 0,200→**0,375**-re ⇒ ⭐ **széthúzta** a kettőt.
// - ⭐ **fájl, nem futásidejű bejárás:** 338 markdown beolvasása a felismerés útjában ⛔ nem
//   elfogadható; így a költség **egy** olvasás, folyamatonként.
//
// ## ⚠️ RAGOZÁS — ezért van prefix-egyezés is
//
// A magyar **agglutinál**: a *„számolóban"* alak nincs a lexikonban, a *„számoló"* viszont igen.
// ⇒ Egy szó akkor is ismert, ha a lexikon valamelyik **5-8 karakteres kezdete** illeszkedik rá.
// ⚠️ Ez **szándékosan megengedő**: a hamis pozitív *(valódi szót ismeretlennek hinni)* itt a
// drágább hiba, mert az vezet fölösleges jelöléshez.
//
// ## 🔴 A HIÁNY NEM HIBA — fail-open
//
// Ha a lexikon-fájl nem olvasható, a `has()` **mindenre igazat ad** ⇒ ⛔ nem lesz jelölés.
// A jelölés elmaradása a **biztonságos** irány *(a szöveg változatlanul megy)*; a fordítottja
// minden átiratot megjelölne.

/** A magyar szó-lexikon — lustán betöltve, folyamatonként egyszer. */
class HuLexicon {

  /** A lexikon helye a repóban — generált artefakt. */
  static readonly RELATIVE_PATH: string = join('cli', 'data', 'hu-lexicon.txt');

  /** A betöltött szavak. `null` = még nem próbáltuk betölteni. */
  private static words: Set<string> | null = null;

  /** Az 5-8 karakteres kezdetek — a ragozott alakok egyeztetéséhez. */
  private static prefixes: Set<string> | null = null;

  /**
   * Ismert szó-e? *(kisbetűs, ékezet nélküli alakot vár)*
   *
   * @returns `true`, ha a szó szerepel a lexikonban, ha ragozott alakja illeszkedik egy
   *   lexikon-szó kezdetére, **vagy ha a lexikon nem olvasható** *(fail-open — l. a fejlécet)*.
   */
  static has(word: string): boolean {
    HuLexicon.ensureLoaded();

    const words: Set<string> | null = HuLexicon.words;

    // ⛔ A lexikon nélkül NEM ítélkezünk: minden szó „ismert".
    if (!words || !words.size) return true;
    if (words.has(word)) return true;
    if (word.length < 7) return false;

    const prefixes: Set<string> = HuLexicon.prefixes ?? new Set<string>();

    for (let length: number = 5; length <= Math.min(word.length, 8); length += 1) {
      if (prefixes.has(word.slice(0, length))) return true;
    }

    return false;
  }

  /** Hány szó van betöltve — a diagnosztikához és a teszthez. */
  static size(): number {
    HuLexicon.ensureLoaded();

    return HuLexicon.words?.size ?? 0;
  }

  /** ⚠️ Csak a teszt hívja: a következő kérdés újratöltést végez. */
  static reset(): void {
    HuLexicon.words = null;
    HuLexicon.prefixes = null;
  }

  /** A lexikon betöltése — hibát ⛔ SOHA nem dob, csak jelent és fail-openbe megy. */
  private static ensureLoaded(): void {
    if (HuLexicon.words) return;

    HuLexicon.words = new Set<string>();
    HuLexicon.prefixes = new Set<string>();

    try {
      const path: string = join(resolveProjectRoot(), HuLexicon.RELATIVE_PATH);

      if (!existsSync(path)) {
        SwallowedFailure_Util.report(
          'stt.hu-lexicon.load',
          new Error(`A magyar lexikon nem található (${path}) — értelmesség-jelölés NEM lesz.`),
        );

        return;
      }

      for (const line of readFileSync(path, 'utf-8').split('\n')) {
        const word: string = line.trim();

        if (word.length < 3) continue;

        HuLexicon.words.add(word);

        if (word.length >= 5) {
          for (let length: number = 5; length <= Math.min(word.length, 8); length += 1) {
            HuLexicon.prefixes.add(word.slice(0, length));
          }
        }
      }
    } catch (error: unknown) {
      // ⚠️ A betöltés bukása ⛔ nem buktathatja a felismerést: a jelölés elmarad, a szöveg megy.
      SwallowedFailure_Util.report('stt.hu-lexicon.load', error);
      HuLexicon.words = new Set<string>();
    }
  }
}
