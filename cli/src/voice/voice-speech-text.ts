// 🗣️ AMIT ÍRTAM → AMIT KI KELL MONDANI. **Tiszta függvény, hálózat nélkül.**
//
// > **Owner, 2026-09-08 08:02 (T-59/b):** *„…**TTS-szöveggé alakítás** (`→`, `=`, kódjelek
// > kimondhatóra)."*
//
// ## 🔴 MIÉRT NEM ADHATJUK ÁT A NYERS SZÖVEGET
//
// A Discord-üzeneteim **a szemnek** vannak formázva: emoji-horgonyok, `**félkövér**`,
// backtickes kódjelek, `→` nyilak, táblázatok. A beszédszintetizátor ezeket **felolvassa**
// vagy **elmondja a nevüket** — a `**kész**`-ből *„csillag csillag kész csillag csillag"*
// lesz, a `→`-ből a semmi vagy egy értelmezhetetlen hang.
//
// ⚠️ És ami a legrosszabb: a **táblázat** hangban teljesen érthetetlen. Egy `| a | b |` sor
// felolvasva zaj — a szemnek viszont pont az adja a szerkezetet.
//
// ⭐ EZÉRT ez a modul **nem „tisztít", hanem FORDÍT**: a jelentést viszi át abba a formába,
// ahol a hallás is érti. A `→` nem eltűnik, hanem *„ebből következik"* lesz belőle.
//
// ⛔ NEM rövidít, NEM összegez és ⛔ **NEM CSONKOL**: az a tartalom megváltoztatása lenne. Ami
// elhangzik, az **ugyanaz**, amit írtam — csak kimondhatóan. A **hossz** kezelése a
// `voice-speech-split.ts` dolga: az **darabol**, nem vág le.

/** Egy csere-szabály: mit mire. */
interface SpeechRule {
  pattern: RegExp;
  replacement: string;
}

/**
 * A JELENTÉST HORDOZÓ jelek kimondható alakja.
 *
 * ⚠️ A sorrend számít: a hosszabb minta előbb. A `⇒`-t a `→` előtt kell kezelni, különben a
 * kétszárú nyíl fele bennmaradna.
 */
const MEANING_RULES: SpeechRule[] = [
  { pattern: /\s*[⇒→]\s*/gu, replacement: ' ebből következik: ' },
  { pattern: /\s*↔\s*/gu, replacement: ' és ' },
  { pattern: /\s*≠\s*/gu, replacement: ' nem egyenlő ' },
  { pattern: /\s*≥\s*/gu, replacement: ' legalább ' },
  { pattern: /\s*≤\s*/gu, replacement: ' legfeljebb ' },
  { pattern: /\s*=\s*/gu, replacement: ' egyenlő ' },
  // ⚠️ A `·` a saját üzeneteimben TAGOLÓ (mint egy vessző), nem szorzás.
  { pattern: /\s*·\s*/gu, replacement: ', ' },
];

/**
 * A JELZÉS-EMOJIK, amiknek van kimondható jelentése.
 *
 * ⭐ MIÉRT MONDJUK KI ŐKET, ahelyett hogy eldobnánk: az owner **ezekre horgonyozza** a
 * mondanivalót *(„egy csomó emojit használtál, ami tök jól szétbontotta nekem a dolgokat")*.
 * A hangban ez a horgony a **hangsúly** — a `🔴` nem dísz, hanem azt jelenti, hogy figyelj.
 *
 * ⛔ A többi emoji (dekoráció) eltűnik: a nevét felolvasni zaj lenne.
 */
const SIGNAL_EMOJI: Record<string, string> = {
  '🔴': 'figyelem: ',
  '⛔': 'tilos: ',
  '⚠️': 'vigyázz: ',
  '✅': 'kész: ',
  '⭐': 'lényeg: ',
  '🙋': 'kérdés: ',
  '⏳': 'várakozik: ',
  '📌': 'megjegyzés: ',
};

/**
 * EGY felolvasott **darab** felső hossza.
 *
 * 🔴 2026-09-11: a jelentése megváltozott. Korábban a **teljes szöveg** felső korlátja volt, és
 * ⛔ ami fölé nyúlt, az **elveszett**. Mostantól a **darab** mérete — a teljes szövegnek
 * **nincs** korlátja, mert a `VoiceSpeechSplit_Util` **darabol** *(a feladat kikötése:
 * „a `SPEECH_MAX_CHARS` maradjon a darab mérete, ne a teljes szövegé")*.
 */
export const SPEECH_MAX_CHARS: number = 700;

/**
 * A kimondható szöveg előállítása.
 *
 * @param text a nyers üzenet-szöveg.
 * @returns a kimondható szöveg — üres, ha nem maradt kimondható tartalom.
 *
 * ⚠️ Az ÜRES eredmény érvényes válasz: egy csak-táblázatból álló üzenetnek nincs értelmes
 * hang-alakja. ⛔ Ilyenkor **nem** olvasunk fel semmit — a hívó ebből tudja, hogy kihagyja.
 */
export function prepareSpeechText(text: string): string {
  let out: string = text;

  // 1. KÓD-BLOKKOK: a tartalmuk hangban értelmezhetetlen (útvonalak, JSON, parancsok).
  //    ⭐ De a TÉNYÜKET kimondjuk: enélkül az owner nem tudná, hogy volt ott valami.
  out = out.replace(/```[\s\S]*?```/gu, ' (kódrészlet a szövegben) ');

  // 2. URL-EK — 🔴 EZ MUSZÁJ A JELENTÉS-CSERÉK ELŐTT ÁLLNIA. A teszt buktatta le: az
  //    `?x=1` query-részben az `=` cseréje lefutott, és a végén „hivatkozás egyenlő 1"
  //    hangzott volna el. Felolvasva egy URL amúgy is értelmezhetetlen, a TÉNYE viszont
  //    érdekes: az owner ebből tudja, hogy van mit megnézni írásban.
  out = out.replace(/https?:\/\/\S+/gu, ' (hivatkozás) ');

  // 3. TÁBLÁZAT-SOROK: hangban zaj. A fejléc-elválasztót és a sorokat kivesszük.
  out = out
    .split('\n')
    .filter((line: string): boolean => !/^\s*\|/u.test(line))
    .join('\n');

  // 4. JELZÉS-EMOJIK → kimondható előtag (a többi emoji a 7. lépésben esik ki).
  for (const [emoji, spoken] of Object.entries(SIGNAL_EMOJI)) {
    out = out.split(emoji).join(spoken);
  }

  // 5. JELENTÉST HORDOZÓ jelek.
  for (const rule of MEANING_RULES) {
    out = out.replace(rule.pattern, rule.replacement);
  }

  // 6. MARKDOWN-DÍSZ: a `**`, `*`, `` ` ``, `_`, `#` a szemnek szól. A KÖZTES SZÖVEG MARAD.
  out = out
    .replace(/`{1,3}([^`]*)`{1,3}/gu, '$1')
    .replace(/\*{1,3}([^*]*)\*{1,3}/gu, '$1')
    .replace(/(^|\s)_([^_]+)_(?=\s|$)/gu, '$1$2')
    .replace(/^#{1,6}\s*/gmu, '')
    .replace(/^\s*[-*•]\s+/gmu, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1');

  // 7. A MARADÉK EMOJI és a nem kimondható szimbólumok. ⚠️ A magyar ékezetek MARADNAK.
  out = out.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu, ' ');

  // 8. A szóközök és a sorvégek összevonása egy folyamatos beszéd-szöveggé.
  out = out
    .replace(/\n{2,}/gu, '. ')
    .replace(/\n/gu, ' ')
    .replace(/\s{2,}/gu, ' ')
    // ⚠️ A dupla írásjelek a cserékből keletkeznek (`kész: .`), és hangban akadásnak hallatszanak.
    .replace(/\s+([.,!?:])/gu, '$1')
    .replace(/([.,:])\1+/gu, '$1')
    .replace(/:\s*\./gu, '.')
    .trim();

  // 🔴 ITT KORÁBBAN CSONKOLÁS VOLT — 2026-09-11-én kivéve.
  //
  // > **Owner, 2026-09-11 01:28 (hang):** *„az üzeneteidnél most így levágja a végét… szét
  // > kéne bontani… lehetőleg **ne [vágjunk] le semmit**."*
  //
  // A régi kód a 700 karakter fölötti részt **eldobta** *(`„… A többi írásban."`)*, és a hívó
  // ⛔ nem tudta, hogy volt még. ⇒ A hossz-kezelés a **`VoiceSpeechSplit_Util`** dolga: az
  // **darabol**, nem csonkol.
  //
  // ⭐ EZ A FÜGGVÉNY MOSTANTÓL CSAK FORDÍT, és ⛔ soha nem veszít tartalmat.
  return out;
}
