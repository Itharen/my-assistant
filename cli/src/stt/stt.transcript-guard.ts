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
