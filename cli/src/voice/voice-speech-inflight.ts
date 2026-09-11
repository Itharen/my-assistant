// ⏳ FOLYAMATBAN VAN-E EGY MEGSZÓLALÁS? — a köteg-kapu bemenete.
//
// > **Owner, 2026-09-11 02:28:** *„az üzenetcsomagot csak akkor szabad elküldeni, ha **nem
// > kezdtünk el következő üzenetet se**. Tehát ha most közben elkezdtünk egy **voice
// > detection**-t, akkor **meg kell várni, hogy abból mi lesz**, mielőtt elküldenénk a
// > következő csomagot. **( HACSAK! nem vár nagyon sok üzenet a sorban…)**"*
//
// > **Owner, 2026-09-11 03:27 — élesben, MÁSODSZOR:** *„Na, baszd meg, **még én beszélek**, a
// > csomó[g] nem megy át."*
//
// ## 🔴 A MÉRT RÉS
//
// A `decideFlush()` **hat** kaput ismert — üres köteg · `isBusyProcessing` · `queuedItemCount` ·
// `isQueueLocked` · elcsendesedési ablak · `maxHoldMs` szelep. ⛔ *„Folyamatban lévő
// megszólalás"* kapu **soha nem volt** *(mérve 2026-09-11 06:04 — nem elveszett kód, hanem
// megíratlan)*.
//
// ⇒ A 20 másodperces csend-ablak **akkor is letelhetett**, amikor az owner **épp beszélt**: a
// felvétel még tartott, a szöveg még nem volt kész, és a köteg **nélküle ment ki**. Ő pedig
// mondat közben kapott választ, és **elvesztette a fonalat**.
//
// ## ⭐ MIÉRT KELL IDŐKORLÁT IS — a kapu ⛔ nem ragadhat be
//
// A számláló akkor nő, amikor egy megszólalás **elindul**, és akkor csökken, amikor **lezárult**
// *(sikerrel VAGY bukással — mindkettő lezárás)*. ⚠️ De ha egy lezárás-jel **elmarad** *(a
// figyelő újraindul, egy kivétel kiszökik)*, a számláló **beragadna**, és a köteg örökre állna.
//
// ⇒ Ezért minden folyamatban lévő tételnek **saját kora** van, és egy megszólalás
// **elévül**. ⭐ Így a legrosszabb eset egy rövid késleltetés, ⛔ nem a kézbesítés halála.
//
// ⚠️ **A `maxHoldMs` szelep FÖLÉ van rendelve** ennek a kapunak *(a `decideFlush`-ban)* — ez az
// owner *„HACSAK nem vár nagyon sok üzenet"* kivétele: egy hosszú monológ alatt nem állhatnak
// korlátlanul az üzenetek.

/**
 * Meddig számít egy megszólalás „folyamatban lévőnek".
 *
 * ## ⭐ A MÉRT INDOKLÁS (2026-09-11 06:10)
 *
 * A felismerés **percekig** tarthat: mérve az élő naplóban **5 perces** időtúllépés is előfordult
 * *(RAM-terhelés mellett)*. ⛔ De a kapu **nem a felismerésre** vár, hanem arra, hogy a
 * megszólalás **feldolgozás alá kerüljön** — utána a `isBusyProcessing` és a `queuedItemCount`
 * kapuk veszik át a védelmet.
 *
 * ⇒ **3 perc**: bőven átfog egy hosszú megszólalást + a felvevő 1000 ms-os szegmens-zárását,
 * de ⛔ nem annyi, hogy egy elmaradt lezárás-jel a kézbesítést megbénítsa.
 */
const STALE_AFTER_MS: number = 180_000;

/**
 * ⏳ A folyamatban lévő megszólalások nyilvántartása.
 *
 * ⛔ **Hibát SOHA nem dob**: ez egy számláló. ⚠️ De a **kora** számít, ezért az `isInProgress`
 * mindig a **hívás pillanatában** dönt, ⛔ nem egy eltárolt logikai értékből.
 */
export class VoiceSpeechInFlight {

  /** Meddig számít egy megszólalás folyamatban lévőnek — a diagnosztikához és a teszthez. */
  static readonly STALE_AFTER_MS: number = STALE_AFTER_MS;

  /**
   * A még le nem zárult megszólalások **kezdési ideje**, érkezési sorrendben.
   *
   * ⭐ MIÉRT LISTA, ÉS NEM SZÁMLÁLÓ: a szám önmagában nem mondja meg, hogy egy tétel
   * **beragadt-e**. Az időbélyegekből ez eldönthető — egy puszta `count++/--` párosból nem.
   */
  private readonly startedAt: number[] = [];

  constructor(private readonly clock: () => number = (): number => Date.now()) {}

  /** 🎙️ Egy megszólalás ELINDULT. */
  noteStarted(): void {
    this.startedAt.push(this.clock());
  }

  /**
   * ✅ Egy megszólalás LEZÁRULT — sikerrel **vagy** bukással.
   *
   * ⚠️ Mindkettő lezárás: a bukott felismerésre sem érdemes tovább várni, mert abból már
   * ⛔ nem lesz üzenet. *(A hang attól még megmarad — l. `voice-utterance-archive.ts`.)*
   */
  noteSettled(): void {
    // ⚠️ A LEGRÉGEBBIT vesszük ki, ⛔ nem a legújabbat: a lezárások sorrendje ugyan
    // felcserélődhet, de a *kor* szempontjából a legrégebbi elengedése a helyes — különben
    // egy régi tétel maradna bent, és ő váltaná ki az elévülést.
    this.startedAt.shift();
  }

  /** Hány megszólalás van folyamatban *(elévülés nélkül számolva)* — a naplóhoz. */
  get trackedCount(): number {
    return this.startedAt.length;
  }

  /**
   * 🔴 Folyamatban van-e MOST egy megszólalás?
   *
   * @returns `true`, ha van **el nem évült** folyamatban lévő tétel.
   *
   * ⭐ Az elévülteket **el is dobja** — így egy beragadt jel ⛔ nem terheli örökre a kaput, és a
   * `trackedCount` sem hazudik utána.
   */
  isInProgress(): boolean {
    const cutoff: number = this.clock() - STALE_AFTER_MS;

    while (this.startedAt.length && (this.startedAt[0] ?? 0) < cutoff) {
      this.startedAt.shift();
    }

    return this.startedAt.length > 0;
  }
}
