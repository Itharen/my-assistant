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

/**
 * 🎤 BULI-ZAJ: ennél nem hosszabb, NEM magyar átirat ⇒ zaj.
 *
 * ## 🔴 A MÉRÉS, amiből ez a szám jön (2026-09-12 éjjel, labelled korpusz)
 *
 * > **Owner, 02:51:** *„itt van a minta alap, meg a zaj alap, na ebből aztán fogsz tudni
 * > tanulni."* · **02:53:** *„minden ami angol és nem magyar, az mind zaj."*
 *
 * A nyitott mikrofon egy este alatt **722 érzékelést / 259 felvételt** termelt *(szemben egy
 * normál nap 123/9-ével)*, és ebből **16** volt valódi input. A kötegbe jutott 36 átiratot
 * kézzel felcímkéztem — **21 zaj · 15 valódi** —, és megmértem, mi választja el őket:
 *
 * ```
 *                          ZAJ (21)              VALÓDI (15)
 * magyar betű (á é í ó…)   0 / 21                15 / 15
 * magyar kötőszó/szó       0 / 21                15 / 15
 * karakter                 3-94   (medián 7)     33-325 (medián 110)
 * szó                      1-19   (medián 1)     7-47   (medián 21)
 * ```
 *
 * 🔴 **A HOSSZ ÖNMAGÁBAN NEM VÁLASZT EL** *(a 33-94 karakteres sávban átfedés van)* — a
 * **magyar-jel** viszont ezen a korpuszon **hibátlanul** szétvágja a kettőt. ⇒ Ezért a
 * magyar-jel a **szükséges** feltétel, a hossz pedig a **fék**.
 *
 * ⚠️ **MIÉRT KELL MÉGIS A HOSSZ-FÉK:** az owner kikötése — *„az owner használ angol
 * szakszavakat, és egy hosszabb angol mondat lehet valódi"*. ⇒ A hosszú, nem-magyar szöveget
 * ⛔ **NEM** dobjuk el *(a mért korpuszon ez 2 zaj-tételt átenged — vállalt csere)*.
 *
 * 📌 A 30 karakter a mért valódi minimum *(33)* **alatt** van, tehát a korpuszon **egyetlen**
 * valódi input sem esik ki.
 */
export const NOISE_MAX_CHARS: number = 30;

/**
 * 🎤 …és ennél nem több szó. ⭐ A két fék EGYÜTT *(`VAGY`-kapcsolatban)* jelöl zajt.
 *
 * ⚠️ MIÉRT KETTŐ: a karakterszám a **hosszú szavas** töredéket *(„Simple.")* engedné át, a
 * szószám a **sok rövid szavasat** *(„There I go.")*. A mért valódi minimum **7 szó**, tehát a
 * 6 itt is a valódi sáv **alatt** van.
 */
export const NOISE_MAX_WORDS: number = 6;

/**
 * A magyar helyesírás sajátos betűi — ⭐ az egyik magyar-jel.
 *
 * ⚠️ Ezek az angolban **nem** fordulnak elő, tehát a jelenlétük magyar szöveget jelez. ⛔ A
 * hiányuk viszont NEM bizonyít: van magyar mondat ékezet nélkül is *(„Nem megy a dolog")* —
 * ezért kell a szó-jel is.
 */
const HUNGARIAN_LETTERS: RegExp = /[áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/u;

/**
 * Gyakori magyar szavak — ⭐ a másik magyar-jel *(ékezet nélküli magyar mondatokhoz)*.
 *
 * ⚠️ **CSAK TELJES SZÓRA** egyezünk, ⛔ nem részszóra: az angol „not" különben a magyar „not"
 * keresésére illeszkedne. A lista szándékosan **rövid és gyakori** — funkciószavak, amik
 * majdnem minden magyar mondatban előfordulnak, és angolban nem léteznek.
 */
const HUNGARIAN_MARKER_WORDS: readonly string[] = [
  'hogy', 'nem', 'meg', 'van', 'ezt', 'akkor', 'mert', 'kell', 'csak', 'most',
  'ami', 'lehet', 'igen', 'azt', 'ez', 'az', 'és', 'de', 'itt', 'majd',
  'kicsit', 'olyan', 'mondom', 'jó', 'vagy', 'mint', 'fog', 'lesz', 'volt', 'mi',
];

/**
 * Magyarnak látszik-e a szöveg? ⭐ Két jel, `VAGY`-kapcsolatban.
 *
 * @returns `true`, ha van benne magyar betű **vagy** gyakori magyar szó.
 *
 * 🔴 MIÉRT MEGENGEDŐ *(`VAGY`, nem `ÉS`)*: a **hamis „nem magyar"** a drága hiba — az az
 * owner **valódi** mondatát dobná el. ⚠️ A mért korpuszon mindkét jel önmagában is hibátlanul
 * működött *(15/15 valódi, 0/21 zaj)*, tehát a megengedő kapcsolat **nem rontott** semmit.
 */
function looksHungarian(text: string): boolean {
  if (HUNGARIAN_LETTERS.test(text)) return true;

  const words: string[] = splitWords(text);

  return HUNGARIAN_MARKER_WORDS.some((marker: string): boolean => words.includes(marker));
}

/**
 * Szavakra bontás — ⚠️ a magyar ékezetes betűket is szó-karakternek véve.
 *
 * ⭐ MIÉRT EXPLICIT BETŰ-OSZTÁLY, és ⛔ miért nem Unicode-tulajdonság-szökés: ez a modul
 * **magyar és angol** szöveget bont *(a zaj-jel és a magyar-jel is ezen áll)*, tehát a szűkebb
 * osztály itt **pontosabb** is. ⚠️ Ráadásul a tulajdonság-szökés kapcsos zárójelét a
 * `no-object-shorthand` review **objektum-rövidítésnek** olvasta — mindkét írásmódban.
 * ⇒ Ez a forma **egyszerre** oldja meg a jelentést és az eszköz-félreolvasást.
 *
 * ⚠️ KÖVETKEZMÉNY, kimondva: egy nem-latin betű *(pl. a finn `ä`)* **szóhatárként** viselkedik.
 * A zaj-felismerésre ez ⛔ nem hat *(a szószám csak nő, a küszöb pedig felső korlát)*, a
 * magyar-jelre pedig azért nem, mert a magyar betűk **benne vannak** az osztályban.
 */
function splitWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^0-9a-záéíóöőúüű']+/u)
    .filter((word: string): boolean => word.length > 0);
}

/** Az átirat-ellenőrzés eredménye. */
export interface GuardVerdict {
  suspicious: boolean;
  reason?: string;
  /**
   * 🎤 **BULI-ZAJ-e** *(rövid + nem magyar)*.
   *
   * ⭐ MIÉRT KÜLÖN JELZŐ, és ⛔ miért nem elég a `suspicious`: a *„nem értettem"* és a
   * *„ez a szomszéd asztal beszélt"* **más jelenség**, más teendővel. A nyitott mikrofon
   * **kapacitás-problémát** okoz *(mérve: 259 felvétel egy este alatt)*, ezért **külön
   * kell látszódnia** a tölcsér-jelentésben, ⛔ nem beleolvadni a 243 „elveszett"-be.
   */
  isNoise?: boolean;
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

  // 🎤 BULI-ZAJ — rövid ÉS nem magyar. ⭐ A két jel EGYÜTT; egyik sem elég önmagában.
  //
  // ⚠️ A SORREND: ez a töltelék-lista ELŐTT fut, mert **konkrétabb** indokot ad *(megnevezi a
  // hosszt és a nyelvet)*, és mert a zaj-tételek többsége ⛔ **nincs** a töltelék-listán
  // *(„There I go", „Simple", „Merci")*.
  const noiseWords: number = splitWords(trimmed).length;
  const isShort: boolean = trimmed.length <= NOISE_MAX_CHARS || noiseWords <= NOISE_MAX_WORDS;

  if (isShort && !looksHungarian(trimmed)) {
    return {
      suspicious: true,
      isNoise: true,
      reason: `BULI-ZAJ: rövid (${trimmed.length} karakter, ${noiseWords} szó) és NEM magyar `
        + `("${trimmed}") — nyitott mikrofonnál a környezet beszéde. ⛔ Nem cselekszem rá. `
        + '⚠️ A hosszabb, nem magyar szöveget NEM jelölöm így: az lehet valódi.',
    };
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
