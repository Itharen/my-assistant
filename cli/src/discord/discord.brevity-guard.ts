// ✂️ RÖVIDSÉG-ŐR — a hosszú üzenetet a RENDSZER állítja meg, nem a jó szándék.
//
// > **Owner (2026-09-07 21:06):** *„Én nem olvastam, hogy mit írtál, kicsit hosszú üzeneteket
// > írsz, ezt valahogy javítanunk kéne, hogy ilyenkor Discordon tömörebben fogalmazzál, mind
// > itt, mind a Voice-on."*
//
// 🔴 MIÉRT KELL GÉPI KORLÁT, ÉS MIÉRT NEM ELÉG A SZABÁLY:
// A `discord-message-style.md` **már létezett**, és ki is mondta, hogy rövid legyek. Mégis
// hosszú üzeneteket küldtem — és az owner **el sem olvasta őket**. ⇒ A szabály önmagában nem
// tartott vissza. Ami nem mérhető, azt nem tartom be.
//
// ⚠️ AZ IGAZI KÁR NEM A HOSSZ, HANEM A CSEND: egy el nem olvasott üzenet pontosan úgy néz ki,
// mintha meg sem írtam volna — de közben én azt hiszem, tájékoztattam. Ez ugyanaz a hibaosztály,
// mint amikor a köteg a fájlban maradt: a **feladó szemszögéből minden rendben**.
//
// ⛔ EZÉRT NEM CSONKOLUNK: a levágott üzenet félreérthető lenne. A hosszú üzenet vagy
// **átfogalmazandó**, vagy a hívó **tudatosan** vállalja (`allowLong`).

/**
 * Efölött már túl hosszú.
 *
 * ⚠️ ASSZISZTENS-VÁLASZTÁS, nem owner-adat — ő számot nem mondott. A mérés, amiből indultam:
 * a 2026-09-07 20:33-as és 20:55-ös üzeneteim **~1100 és ~1200 karakter** voltak, és
 * **egyiket sem olvasta el**. A korábbi, elolvasott üzenetek 400-500 körül mozogtak.
 *
 * ⇒ Felülvizsgálandó, ha kiderül, hogy túl szűk vagy túl bő (`open-questions.md`).
 */
export const MAX_MESSAGE_CHARS: number = 1200;

/**
 * Ennél több sor már „falnak" néz ki a telefonon, akkor is, ha karakterben belefér.
 *
 * ⚠️ Szintén assziszens-választás. A telefon-képernyő az igazi korlát, nem a karakterszám.
 */
export const MAX_MESSAGE_LINES: number = 40;

export interface BrevityVerdict {
  /**
   * Tagoltnak és olvashatónak látszik-e.
   *
   * ⛔ 2026-09-07 21:45 ÓTA NEM KAPU — csak jelzés. Az owner javította ki: a kemény korlát
   * nem rövidebbé tett, hanem **feldarabolóvá**, és a tagolást adó **emojikat** hagytam el
   * miatta. A hossz nem a mérendő mennyiség.
   */
  acceptable: boolean;
  chars: number;
  lines: number;
  /** Miért nem — ⛔ üres, ha rendben van. */
  reason?: string;
  /** MIT KELL TENNI. Nem „hiba", hanem munka: át kell fogalmazni. */
  remedy?: string;
}

/**
 * Elég tömör-e az üzenet?
 *
 * ⛔ SOHA nem változtat a szövegen — csak ítél. A rövidítés **fogalmazási** munka, amit nem
 * lehet gépiesen elvégezni anélkül, hogy a jelentés sérülne.
 */
export function inspectBrevity(text: string): BrevityVerdict {
  const trimmed: string = text.trim();
  const chars: number = trimmed.length;
  const lines: number = trimmed ? trimmed.split('\n').length : 0;

  if (chars > MAX_MESSAGE_CHARS) {
    return {
      acceptable: false,
      chars: chars,
      lines: lines,
      reason: `Az üzenet ${chars} karakter, a korlát ${MAX_MESSAGE_CHARS}.`,
      remedy: 'Fogalmazd át rövidebbre: mi történt · mit kell tenned · milyen döntés vár rád. '
        + 'A magyarázat és a mérési adat a repóba megy, nem ide. '
        + 'Ha tényleg hosszúnak KELL lennie, add meg a `--long` kapcsolót.',
    };
  }

  if (lines > MAX_MESSAGE_LINES) {
    return {
      acceptable: false,
      chars: chars,
      lines: lines,
      reason: `Az üzenet ${lines} soros, a korlát ${MAX_MESSAGE_LINES}.`,
      remedy: 'Vond össze vagy hagyd el a sorokat. Telefonon a sorok száma számít, nem a karakter. '
        + 'Ha tényleg ennyi KELL, add meg a `--long` kapcsolót.',
    };
  }

  return { acceptable: true, chars: chars, lines: lines };
}
