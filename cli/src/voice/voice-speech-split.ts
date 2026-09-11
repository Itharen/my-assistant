// ✂️ NEM CSONKOLUNK — DARABOLUNK.
//
// > **Owner, 2026-09-11 01:28 (hang):** *„az üzeneteidnél most így levágja a végét, és azt
// > mondja, hogy a folytatás írásban… túl hosszú az üzenet, akkor szét kéne bontani. Itt majd
// > akkor alapos kezelés kell, illetve, hogy lehetőleg **ne [vágjunk] le semmit**."*
//
// ## 🔴 A MÉRT VISELKEDÉS, amit ez felváltott
//
// `voice-speech-text.ts` *(a javítás előtt)*:
//
// ```ts
// return lastStop > SPEECH_MAX_CHARS / 2
//   ? `${head.slice(0, lastStop + 1)} A többi írásban.`
//   : `${head.trimEnd()}… A többi írásban.`;
// ```
//
// ⇒ A 700 karakter fölötti rész **elveszett a hang-csatornán**. ⛔ Nem hiba, nem
// figyelmeztetés: a függvény **csonkolt szöveget adott vissza**, és a hívó nem tudta, hogy
// volt még.
//
// ## ⭐ A SAJÁT MÉRÉSEM (2026-09-11 03:26) — ⚠️ ez KORRIGÁLJA a feladat-leírást
//
// A handoff a **nyers** üzenet-hosszokat idézte *(„1441 karakter, több mint a fele elveszett")*.
// A csonkolás viszont a **már kimondhatóvá alakított** szövegen történik, amiből a
// `prepareSpeechText` előbb kiveszi a táblázatokat, kód-blokkokat, emojikat és URL-eket.
//
// **A valódi adat a 444 kimenő üzenetből:**
//
// | mérés | érték |
// |---|---|
// | kimondható üzenet | 221 |
// | a 700 karakteres határ fölött | **14** *(6%)* |
// | a leghosszabb **kimondható** szöveg | **717** karakter |
// | összes elvesző karakter | **112** |
// | a legnagyobb veszteség EGY üzeneten | **17** karakter *(2%)* |
//
// ⇒ A veszteség **valódi, de jóval kisebb**, mint a feladat-leírás feltételezte.
// ⭐ A kérés ettől **változatlanul érvényes**, két okból: **(a)** a nulla veszteség az elvárás,
// és 112 karakter is veszteség; **(b)** a **mechanizmus** rossz — a néma csonkolás holnap, egy
// hosszabb üzenetnél, sokkal többet vinne el, és **ugyanúgy némán**.

import { SPEECH_MAX_CHARS } from './voice-speech-text.js';

/**
 * A mondatvégek, amiken darabolni érdemes.
 *
 * ⚠️ A `…` és a `:` **nem** mondatvég: az előbbi félbehagyott gondolat, az utóbbi felsorolást
 * nyit — mindkettőnél a vágás félreérthető lenne hangban.
 */
const SENTENCE_END: RegExp = /([.!?])\s+/gu;

/**
 * Ennyi darab fölött **nem** mondjuk be a darabszámot.
 *
 * ⭐ MIÉRT VAN FELSŐ KORLÁT: a *„tizenhét részben mondom"* nem segít, hanem elbátortalanít —
 * és ilyenkor amúgy is a **küldött üzenet hossza** a hiba, nem a felolvasás.
 */
const MAX_ANNOUNCED_PARTS: number = 6;

/** A magyar számnevek a darabszám bemondásához. */
const PART_COUNT_WORDS: readonly string[] = [
  '', '', 'két', 'három', 'négy', 'öt', 'hat',
];

/** A kimondható szöveg darabolása. */
export class VoiceSpeechSplit_Util {

  /**
   * Egy darab felső hossza.
   *
   * ⭐ A `SPEECH_MAX_CHARS` mostantól a **darab** mérete, ⛔ nem a teljes szövegé — pontosan
   * ahogy a feladat kéri. A teljes szövegnek **nincs** felső korlátja.
   */
  static readonly MAX_PART_CHARS: number = SPEECH_MAX_CHARS;

  /**
   * A szöveg darabolása kimondható részekre.
   *
   * @param text a MÁR kimondhatóvá alakított szöveg *(`prepareSpeechText`)*.
   * @returns a darabok sorrendben. ⭐ Üres bemenetre **üres lista** — ⛔ nem egy üres darab.
   *
   * ## A határok, ebben a sorrendben
   *
   * 1. **mondathatár** *(`.`, `!`, `?`)* — hangban ez az egyetlen természetes vágás;
   * 2. **szóhatár** — ha egy mondat maga hosszabb a határnál;
   * 3. ⛔ **szó közepén SOHA** — ez a feladat kikötése.
   *
   * ⭐ **Tiszta függvény**, és ⛔ **nem veszít**: a darabok összefűzve ugyanazt a tartalmat
   * adják. Ezt teszt állítja, karakterre.
   */
  static split(text: string): string[] {
    const trimmed: string = text.trim();

    if (!trimmed) return [];
    if (trimmed.length <= VoiceSpeechSplit_Util.MAX_PART_CHARS) return [trimmed];

    const parts: string[] = [];
    let current: string = '';

    for (const sentence of VoiceSpeechSplit_Util.toSentences(trimmed)) {
      // ⚠️ Egy MAGA IS túl hosszú mondat: szóhatáron bontjuk. Ilyenkor a folyó darabot
      // előbb lezárjuk, hogy a sorrend ne csavarodjon össze.
      if (sentence.length > VoiceSpeechSplit_Util.MAX_PART_CHARS) {
        if (current) {
          parts.push(current);
          current = '';
        }

        parts.push(...VoiceSpeechSplit_Util.splitByWords(sentence));

        continue;
      }

      const candidate: string = current ? `${current} ${sentence}` : sentence;

      if (candidate.length <= VoiceSpeechSplit_Util.MAX_PART_CHARS) {
        current = candidate;

        continue;
      }

      parts.push(current);
      current = sentence;
    }

    if (current) parts.push(current);

    return parts;
  }

  /**
   * A darabszám bemondása — **egyszer, az elején**.
   *
   * > A feladat kikötése: *„ha több rész lesz, a darabszám hangozzon el egyszer az elején
   * > (»négy részben mondom«), ⛔ ne minden rész végén"*.
   *
   * @param count hány darab lesz.
   * @returns a bemondandó szöveg, vagy **üres sztring**, ha nem kell bemondani.
   *
   * ⭐ Tiszta függvény. ⚠️ Egy darabnál **nincs** bemondás: a *„egy részben mondom"* zaj.
   */
  static describeParts(count: number): string {
    if (count < 2 || count > MAX_ANNOUNCED_PARTS) return '';

    return `${PART_COUNT_WORDS[count]} részben mondom.`;
  }

  /**
   * A KIMONDANDÓ darabok — a bemondással együtt, ha kell.
   *
   * @param text a már kimondhatóvá alakított szöveg.
   * @returns amit sorban ki kell mondani. ⭐ Ez megy be a sorba **egyetlen tételként**, hogy
   *   más üzenet ⛔ ne ékelődhessen közé.
   */
  static toSpokenParts(text: string): string[] {
    const parts: string[] = VoiceSpeechSplit_Util.split(text);
    const announcement: string = VoiceSpeechSplit_Util.describeParts(parts.length);

    // ⚠️ A bemondás a MÁSODIK darab elé is kerülhetett volna, de akkor az első darab után
    // derülne ki, hogy van még — a feladat szerint az elején kell tudni.
    return announcement ? [`${announcement} ${parts[0] ?? ''}`.trim(), ...parts.slice(1)] : parts;
  }

  /**
   * Mondatokra bontás.
   *
   * ⚠️ A mondatvégi írásjel a mondatnál **MARAD** — enélkül a hang elveszítené a tagolást, és
   * a következő darab kérdésből kijelentéssé válhatna.
   */
  private static toSentences(text: string): string[] {
    const sentences: string[] = [];
    let last: number = 0;

    for (const match of text.matchAll(SENTENCE_END)) {
      const end: number = (match.index ?? 0) + (match[1]?.length ?? 0);

      sentences.push(text.slice(last, end).trim());
      last = end;
    }

    const tail: string = text.slice(last).trim();

    if (tail) sentences.push(tail);

    return sentences.filter((sentence: string): boolean => sentence.length > 0);
  }

  /**
   * Szóhatáron bontás — ⛔ SOHA szó közepén.
   *
   * ⚠️ Ez a **tartalék**: csak akkor fut, ha egy mondat maga hosszabb a határnál *(pl. egy
   * hosszú felsorolás pontok nélkül)*.
   */
  private static splitByWords(sentence: string): string[] {
    const parts: string[] = [];
    let current: string = '';

    for (const word of sentence.split(/\s+/u)) {
      const candidate: string = current ? `${current} ${word}` : word;

      if (candidate.length <= VoiceSpeechSplit_Util.MAX_PART_CHARS) {
        current = candidate;

        continue;
      }

      if (current) parts.push(current);

      // ⚠️ EGYETLEN szó is lehet hosszabb a határnál *(pl. egy beillesztett azonosító)*.
      // ⛔ Ezt sem csonkoljuk: saját darabot kap. Jobb egy hosszú darab, mint egy elveszett.
      current = word;
    }

    if (current) parts.push(current);

    return parts;
  }
}
