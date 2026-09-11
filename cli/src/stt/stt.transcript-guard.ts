// ÁTIRAT-ŐR — megbízható-e, amit a felismerés visszaadott?
//
// 🔴 MÉRT OK (2026-09-07 08:05): az első élő próbán egy csendes/zajos hangmintára a
// szolgáltatás ezt adta vissza:
//
//     "Продолжение следует..."      (oroszul: „folytatása következik")
//
// Ez a Whisper-családú modellek **közismert hallucinációja**: csendre vagy zajra a
// tanítóanyagból vett gyakori feliratot köp ki. A válasz `status: processed` volt, tehát a
// szolgáltatás szempontjából **minden rendben** — a hiba a mi oldalunkon látszik csak.
//
// ⚠️ MIÉRT VESZÉLYES: az owner **hangüzenetére adott válasz** épülne rá. Egy félrehallott
// üzenetre adott magabiztos válasz **rosszabb, mint a semmi** — ezért ez a szűrő nem
// kényelmi extra, hanem a képesség része.

/** Ismert hallucináció-minták. Kisbetűsítve, ékezet-érzékenyen hasonlítunk. */
const KNOWN_HALLUCINATIONS: string[] = [
  'продолжение следует',
  'субтитры сделал',
  'субтитры создавал',
  'редактор субтитров',
  'thanks for watching',
  'thank you for watching',
  'subscribe to my channel',
  'feliratozta',
  '[zene]',
  '[music]',
  'amara.org',
];

/**
 * ⭐ AMIRE A BUKOTT FELISMERÉS ÖSSZEOMLIK — az owner mérése, 2026-09-07 20:32:
 *
 * > *„az STT transkript hibákhoz felírhatnád, hogy általában amikor hibásan dolgozódik föl,
 * > akkor csak ennyi lesz benne, mint most az előbb, hogy köszönöm, meg thank you, meg you."*
 *
 * 🔴 EZ NEM A FENTI LISTA: ezek **valódi, értelmes szavak**, amiket az owner **tényleg
 * mondhat**. Ezért ⛔ NEM `includes`-szal keressük — csak akkor gyanús, ha a **TELJES átirat**
 * ennyi. *(Egy „Köszönöm, akkor ezt csináld" mondat teljesen rendben van.)*
 */
const COLLAPSE_FILLERS: string[] = [
  'köszönöm',
  'köszi',
  'köszönjük',
  'thank you',
  'thanks',
  'you',
  // 🔴 MÉRVE 2026-09-11: az 56 megőrzött átirat közül ezek is TELJES átiratként fordultak elő,
  // bukott felismerésből — ugyanaz az osztály, mint a „thanks". ⛔ Az owner magyarul beszél,
  // tehát egy teljes átiratként álló angol köszönés sosem az, amit mondott.
  'yeah',
  'bye',
];

// ⛔ „igen" és „ok" SZÁNDÉKOSAN NINCS a listán, pedig kézenfekvő lenne.
//
// Az owner konkrétan ezt a hármat nevezte meg: *„köszönöm, meg thank you, meg you"*.
// Az „igen"/„ok" **más osztály**: valódi, rövid VÁLASZOK, amiket tényleg ad — és egy korábbi,
// szándékos döntés (`accepts a short but meaningful answer` teszt) épp ezt védi.
//
// 📌 Amikor először mégis felvettem őket, ez a teszt bukott el — helyesen. A bukott
// felismerésből származó „igen"-t úgyis az ARÁNY-ellenőrzés fogja meg, ha hosszú a hang;
// az pedig nem téveszti össze a valódi rövid válasszal, mert a hanghosszt is nézi.

/**
 * 🌐 BETŰK, AMIK A MAGYARBAN NEM LÉTEZNEK — a nyelv-eltérés MÉRHETŐ jele.
 *
 * ## 🔴 MIÉRT EZ, ÉS MIÉRT NEM A NYELV-PARAMÉTER
 *
 * > **Owner, 2026-09-11 01:24:** *„a felismerés nyelve legyen rögzítve magyarra, ne
 * > találgasson."* — és **01:30:** *„ne építs köré nagy detektálás-logikát: egy paraméter,
 * > és kész."*
 *
 * ⭐ **MEGMÉRTEM (2026-09-11 04:10), hogy van-e ilyen paraméter.** Ugyanazt a megőrzött
 * felvételt kétszer küldtem be az FDP AI `/api/recognition`-jára:
 *
 * ```
 * language paraméter NÉLKÜL  →  { "text": "Thanks." }
 * ?language=hu               →  { "text": "Thanks." }     ← BETŰRE UGYANAZ
 * ```
 *
 * ⇒ A végpont a paramétert **elfogadja, de FIGYELMEN KÍVÜL HAGYJA**, és a közzétett
 * végpont-lista sem említi. ⛔ **A kért paraméter tehát nem létezik** — nem elfelejtettük
 * átadni, hanem nincs mit átadni. *(⛔ Az FDP AI szolgáltatáshoz nem nyúlunk:
 * `fdp-ai-never-restart`.)*
 *
 * ⇒ Ezért a handoff **tartalék**-ágát valósítjuk meg *(„a válasz nyelvét ellenőrizni kell")*,
 * a kért **minimális** formában: **EGY szabály**, ⛔ nem detektálás-rendszer.
 *
 * ## ⭐ MIÉRT PONT A BETŰK — és miért NEM az ékezet-hiány
 *
 * Az 56 megőrzött átiratból **13** nem tartalmazott magyar ékezetet, és **mind a 13** bukott
 * felismerés volt *(`Það er hann.` · `Dziękuję.` · `ありがとうございました` · `Thanks.` · …)*.
 * ⚠️ **DE az ékezet-hiány mégis rossz szabály lenne:** az *„Igen."* és a *„Nem."* is ékezet
 * nélküli — és azok az owner **legfontosabb válaszai**. Egy ilyen szabály a **jóváhagyását**
 * dobná el. *(A kód ezt a csapdát már ismerte: az „igen"/„ok" szándékosan nincs a
 * filler-listán.)*
 *
 * ⭐ Ez a szabály viszont **magyarban NEM LÉTEZŐ betűkre** figyel. A magyar helyesírás ezeket
 * soha nem használja, tehát ⛔ nincs olyan magyar mondat, amit tévesen megjelölne — az angol
 * szavak *(Hunglish)* pedig érintetlenek, mert az angol sem használ ilyet.
 */
const FOREIGN_LETTERS: RegExp =
  // izlandi (þ ð æ) · lengyel (ą ę ł ń ś ź ż ć) · cseh/szlovák (č ř š ž ě ů ť ď ľ ĺ)
  // · román (ă ș ț) · német (ß) · északi (å ø) · török (ı ğ) · spanyol (ñ) · francia (ç œ)
  // · és MINDEN nem-latin írás (cirill · görög · héber · arab · CJK · hiragana · katakana)
  /[þðæąęłńśźżćčřšžěůťďľĺășțßåøığñçЀ-ӿͰ-Ͽ֐-׿؀-ۿ぀-ヿ一-鿿가-힯]/u;

/**
 * Ennél rövidebb átiratot önmagában nem tekintünk megbízhatónak.
 *
 * ⚠️ ASSZISZTENS-VÁLASZTÁS, nem owner-adat: egy „igen" vagy „ok" értelmes válasz lehet,
 * ezért NEM dobjuk el — csak **megjelöljük**, és a tükör-üzenetben rákérdezünk.
 */
export const SHORT_TRANSCRIPT_CHARS: number = 3;

/**
 * ⭐ A LEGERŐSEBB JEL: karakter / hangmásodperc arány.
 *
 * 🔴 MÉRT ESET (2026-09-07 20:32): egy **9 másodperces** hangüzenetből *„Köszönöm"* lett —
 * 8 karakter. A puszta hossz-küszöb (3 karakter) ezt **átengedte**, és az üzenet tartalma
 * **elveszett**; az owner csak azért vette észre, mert ő maga ismerte fel a mintát.
 *
 * ⇒ A tell nem a rövidség, hanem az **ARÁNYTALANSÁG**: hosszú hang + pár karakter.
 *
 * ⚠️ ASSZISZTENS-VÁLASZTÁS, nem owner-adat. A magyar beszéd ~10–15 karakter/másodperc; ez a
 * küszöb **szándékosan nagyon megengedő** *(a hetede)*, hogy a lassú, szünetekkel tagolt
 * beszédet NE jelölje meg feleslegesen. Felülvizsgálandó: `open-questions.md`.
 */
export const MIN_CHARS_PER_SECOND: number = 2;

/** Ennél rövidebb hangnál nem számolunk arányt — ott a szórás túl nagy. */
export const RATIO_MIN_DURATION_SECS: number = 4;

/** Az átirat-ellenőrzés eredménye. */
export interface GuardVerdict {
  suspicious: boolean;
  reason?: string;
}

/**
 * Megbízhatónak látszik-e az átirat?
 *
 * ⛔ SOHA nem dob el szöveget — csak **megjelöl**. A döntés a felhasználóé; a mi dolgunk,
 * hogy a bizonytalanság **látható** legyen.
 */
export function inspectTranscript(
  text: string,
  options: {
    /** A hangfájl hossza másodpercben, ha tudjuk. ⭐ Enélkül az arány-ellenőrzés kimarad. */
    audioDurationSecs?: number;
  } = {},
): GuardVerdict {
  const trimmed: string = text.trim();

  if (!trimmed) {
    return {
      suspicious: true,
      reason: 'A felismerés ÜRES szöveget adott — valószínűleg nem volt benne beszéd.',
    };
  }

  const lowered: string = trimmed.toLowerCase();
  const hit: string | undefined = KNOWN_HALLUCINATIONS.find((pattern) => lowered.includes(pattern));

  if (hit) {
    return {
      suspicious: true,
      reason: `Ismert modell-hallucináció mintája ("${hit}") — csendre/zajra adott szemét-kimenet, `
        + 'nem valódi beszéd.',
    };
  }

  // 🌐 NYELV-ELTÉRÉS — magyarban nem létező betű az átiratban.
  //
  // ⚠️ A SORREND: a konkrét hallucináció-minta ELŐBB fut (az nevesíti a mintát), de ez még az
  // arány-ellenőrzés ELŐTT — mert a nyelv-eltérés **hanghossz nélkül is** biztos jel, az arány
  // viszont csak elég hosszú hangnál működik.
  const foreign: RegExpMatchArray | null = trimmed.match(FOREIGN_LETTERS);

  if (foreign) {
    return {
      suspicious: true,
      reason: `NYELV-ELTÉRÉS: az átirat magyarban nem létező betűt tartalmaz ("${foreign[0]}") `
        + '— a felismerő más nyelvre tévedt. ⛔ Nem cselekszem rá.',
    };
  }

  // ⭐ ARÁNY-ELLENŐRZÉS — ez fogja meg azt, amit a puszta hossz nem.
  // A sorrend szándékos: EZ ELŐBB fut, mint a filler-lista, mert konkrétabb indokot ad
  // (megnevezi a hanghosszt), és mert filler nélküli bukásra is működik.
  const duration: number | undefined = options.audioDurationSecs;

  if (duration !== undefined && duration >= RATIO_MIN_DURATION_SECS) {
    const ratio: number = trimmed.length / duration;

    if (ratio < MIN_CHARS_PER_SECOND) {
      return {
        suspicious: true,
        reason: `${duration.toFixed(0)} másodperc hangból mindössze ${trimmed.length} karakter `
          + `lett (${ratio.toFixed(1)} karakter/mp) — a felismerés valószínűleg ELBUKOTT, `
          + 'és a tartalom elveszett. Kérd meg az ownert, hogy küldje újra.',
      };
    }
  }

  // A teljes átirat egyetlen töltelék-szó. ⛔ Csak PONTOS egyezésre — ezek valódi szavak.
  if (COLLAPSE_FILLERS.includes(lowered.replace(/[.!?,…]+$/, ''))) {
    return {
      suspicious: true,
      reason: `A teljes átirat egyetlen töltelék-szó ("${trimmed}") — ez a bukott felismerés `
        + 'jellegzetes kimenete (owner mérése, 2026-09-07). Lehet valódi is, de nem cselekszünk rá.',
    };
  }

  if (trimmed.length < SHORT_TRANSCRIPT_CHARS) {
    return {
      suspicious: true,
      reason: `Nagyon rövid átirat (${trimmed.length} karakter) — lehet, hogy csak zaj volt.`,
    };
  }

  return { suspicious: false };
}
