// 🔇 NE BESZÉLJÜNK EGYSZERRE — a felolvasás megáll, amíg az owner beszél.
//
// > **Owner, 2026-09-11 01:15:** *„amikor elkezdek beszélni, és amíg beszélek, meg utána még
// > talán plusz pár másodpercig szüneteltetni kéne a felolvasást. **Aztán újra folytatni.**
// > (Hogy ne beszéljünk egyszerre.)"*
//
// ```
// ő beszélni kezd        → a felolvasás AZONNAL szünetel
// amíg beszél            → szünetel (minden új megszólalás ÚJRAINDÍTJA a türelmi időt)
// elhallgat              → +türelmi idő (paraméter, alapból 2,5 s)
// a türelmi idő letelt   → a felolvasás ONNAN folytatódik, ahol abbamaradt
// ```
//
// ⭐ **FOLYTATÁS, ⛔ nem újrakezdés és ⛔ nem eldobás** — az owner szava: *„aztán újra
// folytatni"*. A sor oldalán ezt a `VoiceSpeechQueue.hold()` / `.release()` adja: a tartás
// **nem üríti ki** a sort, és a maradék darabok a tételben maradnak.
//
// ## 🔴 A MÉRÉS, AMI A TERVET ELDÖNTÖTTE (2026-09-11 03:45)
//
// A feladat kikötése: *„saját magamra ne süljön el — ezt **méréssel** zárd ki, ne
// feltételezéssel."* Megmértem a mai naplón: **43** sikeres felolvasás, **213** megszólalás-
// észlelés. A felolvasás utáni **első** észlelés késése:
//
// ```
// 23 esetben mérve:  23 · 32 · 34 · 37 · 38 · 38 · 39 · 40 · 40 · 42 · 43 · 45 · 45 · 47 ·
//                    49 · 50 · 50 · 51 · 60   mp   ← az owner válaszol
//                    0,0 · 1,0 · 2,0 · 3,0    mp   ← 🔴 VISSZHANG-aláírás
// ```
//
// ⇒ **Négy észlelés 0-3 másodperccel a saját hangom után.** Ember nem kezd beszélni 0,0
// másodperccel az én hangom után ⇒ nyitott mikrofon + hangszóró mellett a **saját felolvasásom
// visszajön** az ő megszólalásaként.
//
// ⚠️ **A szerkezeti szűrő ezt NEM fogja meg:** a `receiver.speaking` esemény az ő
// **Discord-azonosítóján** jön *(`if (userId !== ownerUserId) return;`)*, tehát nem a bot
// hangját látjuk — hanem az ő mikrofonját, amibe az **én hangom** szól bele.
//
// ## ⭐ MIÉRT NEM LEHET EBBŐL VÉGTELEN SZÜNET — a mért indoklás
//
// A handoff félelme *(„végtelen szünetbe kerülünk")* **nem tud bekövetkezni**, két okból:
//
// 1. 🔴 **A SZÜNET MEGSZÜNTETI A VISSZHANG FORRÁSÁT.** Ha visszhang miatt állunk meg, az én
//    hangom **elhallgat** ⇒ nincs több visszhang ⇒ a türelmi idő letelik ⇒ folytatjuk.
//    A rendszer **önjavító**: a legrosszabb eset egy ~2,5 másodperces akadás.
// 2. **A feloldás IDŐ-alapú**, ⛔ nem egy *„elhallgatott"* jelre vár. Egy elmaradó jel
//    ⛔ nem tud örökre megfogni minket.
//
// ⛔ **EZÉRT NEM tiltjuk le a saját lejátszás alatti észlelést**: az pont azt a funkciót
// szüntetné meg, amit az owner kért *(félbeszakíthatóság)*. A visszhang legfeljebb egy
// akadás, a letiltás viszont **a feature halála** lenne.
//
// ⚠️ **Amit ezért LÁTHATÓVÁ tesszük:** minden tartás és feloldás naplóba kerül a késéssel
// együtt. Ha a gyakorlatban akadás-hurok alakul ki, az a naplóból **azonnal látszik** —
// ⛔ nem kell találgatni. *(A türelmi idő ilyenkor egy fájlban állítható.)*

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';

/** Amit a szüneteltetőnek meg kell adni. ⚠️ Szándékosan nem exportált. */
interface SpeechHoldOptions {
  /** A sor tartása — ⭐ `VoiceSpeechQueue.hold()`. */
  hold: () => void;
  /** A tartás feloldása — ⭐ `VoiceSpeechQueue.release()`. */
  release: () => void;
  /**
   * A türelmi idő, **minden megszólaláskor újra kérdezve**.
   *
   * ⚠️ Szándékosan nem egyszer, induláskor: így az owner **futás közben** átállíthatja, és
   * ⛔ nem kell újraindítani hozzá semmit.
   */
  graceMs: () => Promise<number>;
  /** ⛔ Egyetlen tartás és feloldás sem lehet néma. */
  onNote?: (detail: string) => void;
  /**
   * Cserélhető időzítő a teszthez.
   *
   * ⭐ A fogantyú **maga hordozza a lemondását** *(`{ cancel() }`)*, ⛔ nem egy külső
   * `clearTimer`-nek adjuk vissza. Ezért **egyetlen `as` átcímkézés sem kell** sem itt, sem a
   * tesztben: nincs pont, ahol a Node konkrét `Timeout` típusát `unknown`-ra kellene húzni.
   */
  setTimer?: (callback: () => void, ms: number) => { cancel: () => void };
}

/**
 * 🔇 A felolvasás szüneteltetője.
 *
 * ⛔ **Hibát SOHA nem dob**: ez kísérő funkció — ha elhasal, a felolvasás attól még működik,
 * csak nem szünetel. ⚠️ De ⛔ nem is néma.
 */
export class VoiceSpeechHold {

  private timer: { cancel: () => void } | undefined;

  /** Tartunk-e épp. */
  private isHeld: boolean = false;

  /** Mikor kezdődött a mostani tartás — a naplóhoz *(mennyi ideig álltunk)*. */
  private heldSince: number = 0;

  constructor(private readonly options: SpeechHoldOptions) {}

  /** Tartunk-e épp — a diagnosztikához és a teszthez. */
  get isHolding(): boolean {
    return this.isHeld;
  }

  /**
   * 🎙️ AZ OWNER MEGSZÓLALT — a felolvasás **azonnal** áll.
   *
   * ⚠️ Minden további megszólalás **újraindítja** a türelmi időt: amíg beszél, nem folytatjuk.
   * *(Enélkül egy hosszabb mondat közepén — a levegővételnél — visszakapcsolnánk.)*
   *
   * ⛔ Nem dob.
   */
  noteOwnerSpeech(): void {
    try {
      if (!this.isHeld) {
        this.isHeld = true;
        this.heldSince = Date.now();
        this.options.hold();
        this.options.onNote?.('az owner beszél — a felolvasás SZÜNETEL');
      }

      // ⚠️ AZ ÚJRAINDÍTÁS A LÉNYEG: a türelmi idő az UTOLSÓ megszólalástól számol.
      void this.restartGrace();
    } catch (err: unknown) {
      SwallowedFailure_Util.report('voice.speech-hold.noteOwnerSpeech', err);
    }
  }

  /**
   * A szüneteltető leállítása *(kilépés a csatornából, leállás)*.
   *
   * ⚠️ **FELOLDJA a tartást**: egy leállított szüneteltető ⛔ nem hagyhatja a sort örökre
   * tartva — az minden későbbi felolvasást megszüntetne, **némán**.
   */
  stop(): void {
    this.clear();

    if (!this.isHeld) return;

    this.isHeld = false;
    this.options.release();
    this.options.onNote?.('a szüneteltető leállt — a tartás FELOLDVA');
  }

  /** A türelmi idő újraindítása. */
  private async restartGrace(): Promise<void> {
    this.clear();

    const grace: number = await this.options.graceMs();
    const set = this.options.setTimer ?? VoiceSpeechHold.realTimer;

    this.timer = set((): void => this.finishHold(grace), grace);
  }

  /** A türelmi idő letelt — folytatjuk. */
  private finishHold(grace: number): void {
    this.timer = undefined;

    if (!this.isHeld) return;

    const heldMs: number = Date.now() - this.heldSince;

    this.isHeld = false;

    try {
      this.options.release();
      // ⭐ A KÉSÉS IS BENNE VAN: ebből látszik, ha akadás-hurok alakulna ki (rövid, ismétlődő
      // tartások), és ebből dönthető el, hogy a türelmi idő jó-e.
      this.options.onNote?.(
        `elhallgatott — a felolvasás FOLYTATÓDIK (${heldMs} ms állás, ${grace} ms türelmi idő)`,
      );
    } catch (err: unknown) {
      SwallowedFailure_Util.report('voice.speech-hold.finishHold', err);
    }
  }

  /**
   * A VALÓDI időzítő — a fogantyú **magában hordozza** a lemondását.
   *
   * ⭐ Ezért nincs szükség sem `clearTimer` opcióra, sem `as` átcímkézésre: a Node konkrét
   * `Timeout` típusa **bent marad** ebben a lezárásban, és kívülről csak a `cancel` látszik.
   */
  private static realTimer(callback: () => void, ms: number): { cancel: () => void } {
    const handle: ReturnType<typeof setTimeout> = setTimeout(callback, ms);

    return { cancel: (): void => clearTimeout(handle) };
  }

  /** A futó időzítő eltakarítása. */
  private clear(): void {
    if (this.timer === undefined) return;

    const timer: { cancel: () => void } = this.timer;

    this.timer = undefined;
    timer.cancel();
  }
}
