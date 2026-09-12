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
//
// ---
//
// # 🎤 A 19. TÉTEL — A KISZŰRT ZAJ NEM NYÚJTHATJA A KÖTEG-ABLAKOT
//
// > **Owner, 2026-09-12 (élesben KÉTSZER: 03:17 és 04:22):** *„miért nem mennek át az
// > üzeneteim?"* · a handoffban: *„minden új megszólalás újraindítja a gyűjtő-ablakot ⇒ nyitott
// > mikrofon mellett sosem csendesedik el, ezért a VALÓDI üzenetek is bent ragadnak."*
//
// ## 🔬 A MÉRÉS (`__agent/log/actions/2026-09-12.jsonl`, a teljes éjszaka)
//
// | Mit mértem | Érték |
// |---|---|
// | `speaking start` jel *(ez hívja a `noteStarted`-et)* | **757** |
// | ebből **lezárás-jelet kapott** *(felvétel-kimenetel)* | **295** |
// | 🔴 **LEZÁRATLAN** *(mindegyik 180 mp-ig tartja a kaput)* | **462** |
// | a kapu **zárva** volt | **90,0 perc** *(a 01:22-04:52 ablak **43%**-a)* |
// | ebből **valódi felvétel feldolgozása** alatt | **9,4 perc** |
// | 🔴 ⇒ a zárás **90%-a** puszta **észlelésből** jött, ⛔ nem feldolgozásból | **80,6 perc** |
//
// ⭐ **ÉS PONTOSAN ODA ESIK, AHOL KÉRDEZTE:**
//
// ```
// 03:17 (első kérdés)  → a kapu 03:11:54 óta ZÁRVA, folyamatosan  9,0 perc
// 04:22 (második)      → a kapu 04:21:01 óta ZÁRVA, folyamatosan  4,8 perc
// leghosszabb zárás    → 01:22:37 – 02:01:11,                    38,6 perc
// ```
//
// 🔴 **A SZERKEZETI HIBA:** a kaput a Discord **`speaking start`** eseménye tölti *(percenként
// többször, egy megszólalás alatt is ismételten)*, de a **felvétel-kimenetel** üríti *(felvételenként
// egyszer)*. ⇒ A kettő **nem 1:1** *(757 vs 295)*, és a maradék **saját jogán**, 180 mp-ig zár.
//
// ## ✅ A SZABÁLY — ⛔ NEM az ablak rövidítése
//
// > **Owner:** *„NE az ablak rövidítésével oldd meg — a cél nem gyorsabb, hanem **zaj-immunis**."*
//
// ```
// (1) egy VALÓDI FELVÉTEL feldolgozása alatt a kapu ZÁRVA          — mérve: median 2 mp, max 11 mp
// (2) ZAJ-ÖZÖN alatt a puszta ÉSZLELÉS NEM zárja a kaput           — a 19. tétel maga
// (3) egyébként (normál nap) minden változatlan: az észlelés zár   — a 2026-09-11-es viselkedés
// ```
//
// ⭐ **A hossz-küszöbök változatlanok** *(`collectWindowMs` 30 mp, `maxHoldMs` 15 perc)* — a
// javítás **kizárólag** azt változtatja meg, hogy **mi számít** „folyamatban lévő
// megszólalásnak".
//
// ⚠️ **AMIT EZ NEM TUD, KIMONDVA:** hogy egy megszólalás zaj-e, az **csak a felismerés után**
// derül ki ⇒ a zaj **saját feldolgozása** alatt a kapu zárva van. ⭐ De ez **mérve 2 mp
// (max 11 mp)** — szemben a korábbi 180 mp-es észlelés-tartással. A zaj-özön **mérése** is
// utólagos: az első néhány zaj-tétel még zár, amíg a küszöb össze nem gyűlik. 🔴 Ez **szándékos**:
// az özönt **mérni** kell, ⛔ nem feltételezni.

import { VoiceNoiseBurst_Util } from './voice-noise-burst.js';

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
 *
 * ⚠️ **2026-09-12:** ez az elévülés **nem elég** védelem, ha a lezáratlan jelek a **többséget**
 * adják *(mérve: 462 / 757)* — ezért jött mellé a zaj-özön ága. ⛔ A számot **nem** csökkentettük:
 * egy hosszú, valódi monológot továbbra is végig kell tartania.
 */
const STALE_AFTER_MS: number = 180_000;

/** A köteg-kapu állapota, indoklással — ⛔ nem puszta logikai érték. */
interface SpeechGateDiagnosis {
  /** Zárva van-e MOST a kapu. */
  inProgress: boolean;
  /** 🎤 Igaz, ha a zaj-özön miatt **nem** vettük figyelembe a puszta észleléseket. */
  suppressedByNoise: boolean;
  /** Hány felvétel van épp feldolgozás alatt *(ez mindig lezárul)*. */
  processingCount: number;
  /** Hány lezáratlan `speaking start` jel van *(ezek zárnák a kaput)*. */
  detectedCount: number;
  /** Hány zaj-tétel gyűlt össze a mérési ablakban. */
  noiseCount: number;
  /** ⭐ Ember-olvasható indoklás — a naplóba ez megy. */
  reason: string;
}

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

  /**
   * 🎙️ A **feldolgozás alatt lévő FELVÉTELEK** — fájlnév → a feldolgozás kezdete.
   *
   * ⭐ MIÉRT KÜLÖN, ÉS MIÉRT FÁJLNÉVVEL KULCSOLVA: ez a jel **1:1** a kimenetellel *(mérve
   * 2026-09-12: 279 felvétel → 279 kimenetel, 0 párosítatlan)*, tehát ⛔ nem tud beragadni —
   * szemben a `speaking start`-tal, ami ugyanazon az éjszakán **757 → 295** volt. ⇒ Ez az az ág,
   * ami zaj-özönben is **tarthat**.
   *
   * ⚠️ MIÉRT NEM SORBAN (FIFO): a felvételek feldolgozása **párhuzamos**, és vannak kimenetelek,
   * amik a feldolgozás ELŐTT keletkeznek *(idegen beszélő, olvashatatlan fájl)*. Egy sor-alapú
   * `shift()` ilyenkor **más** tétel tartását engedné el — a fájlnév *(a megszólalás azonosítója,
   * amire a duplikáció-védelem is épül)* ezt kizárja.
   */
  private readonly processingStartedAt: Map<string, number> = new Map<string, number>();

  /** 🎤 A zajnak jelölt kimenetelek időbélyegei — ebből mérjük az özönt. */
  private readonly noiseAt: number[] = [];

  constructor(private readonly clock: () => number = (): number => Date.now()) {}

  /** 🎙️ Egy megszólalás ELINDULT *(Discord `speaking start`)*. */
  noteStarted(): void {
    this.startedAt.push(this.clock());
  }

  /**
   * 🎙️ Egy FELVÉTEL feldolgozása elindult — a hang megvan, a felismerés fut.
   *
   * ⭐ Ez az a pont, ahonnan **tényleg** érdemes várni: innen **mindig** lesz kimenetel.
   *
   * @param filename a felvétel fájlneve — ⭐ ez a megszólalás azonosítója, a lezárás ezzel párosít.
   */
  noteProcessingStarted(filename: string): void {
    this.processingStartedAt.set(filename, this.clock());
  }

  /**
   * ✅ Egy megszólalás LEZÁRULT — sikerrel **vagy** bukással.
   *
   * ⚠️ Mindkettő lezárás: a bukott felismerésre sem érdemes tovább várni, mert abból már
   * ⛔ nem lesz üzenet. *(A hang attól még megmarad — l. `voice-utterance-archive.ts`.)*
   *
   * @param outcome ⭐ A **fájlnév** *(a feldolgozás-tartás elengedéséhez)* és a **zaj-jelölés**
   *   *(ebből mérjük az özönt — 19. tétel)*. Mindkettő elhagyható: a néma eldobásnál *(üres
   *   felvétel)* ⛔ nincs átirat, tehát a zajról sem tudunk semmit — az ilyen lezárás se
   *   zaj-bizonyíték, se ellene.
   */
  noteSettled(outcome?: { filename?: string; isNoise?: boolean }): void {
    // ⚠️ A LEGRÉGEBBIT vesszük ki, ⛔ nem a legújabbat: a lezárások sorrendje ugyan
    // felcserélődhet, de a *kor* szempontjából a legrégebbi elengedése a helyes — különben
    // egy régi tétel maradna bent, és ő váltaná ki az elévülést.
    this.startedAt.shift();

    // ⭐ A feldolgozás-tartás CSAK a saját fájljára oldódik — l. a `processingStartedAt` leírását.
    if (outcome?.filename) this.processingStartedAt.delete(outcome.filename);

    if (outcome?.isNoise) this.noiseAt.push(this.clock());
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
    return this.diagnose().inProgress;
  }

  /**
   * 🔬 A kapu állapota **indoklással** — a napló és a diagnosztika ezt mutatja.
   *
   * ⭐ MIÉRT NEM CSAK EGY `boolean`: a 19. tétel javítása után a kapu **kétféle okból** lehet
   * nyitva *(nincs megszólalás / zaj-özön van)*, és ezt élesben **látni kell** — különben egy
   * hibás elnyomás ugyanolyan néma lenne, mint amilyen néma volt a 90 perces zárás.
   */
  diagnose(): SpeechGateDiagnosis {
    const now: number = this.clock();

    VoiceSpeechInFlight.prune(this.startedAt, now - STALE_AFTER_MS);
    VoiceSpeechInFlight.prune(this.noiseAt, now - VoiceNoiseBurst_Util.WINDOW_MINUTES * 60_000);

    // ⚠️ A feldolgozás-tartás IS elévül: ha egy kimenetel-jel elmaradna *(kivétel, újraindulás)*,
    // a kapu ⛔ nem ragadhat be — ugyanaz az elv, mint az észlelés-jelnél.
    for (const [filename, startedAt] of this.processingStartedAt) {
      if (startedAt < now - STALE_AFTER_MS) this.processingStartedAt.delete(filename);
    }

    const processingCount: number = this.processingStartedAt.size;
    const detectedCount: number = this.startedAt.length;
    const noiseCount: number = this.noiseAt.length;
    // 🎤 A KÜSZÖB A MÉRT ÉRTÉK — ⛔ nem új szám: ugyanaz, amit a nyitott-mikrofon szignál
    // használ *(normál csúcs 4 / buli 42-84 ⇒ 12 a 10× üres sávban)*. Egy SSOT, két fogyasztó.
    const flooded: boolean = noiseCount >= VoiceNoiseBurst_Util.BURST_THRESHOLD;

    if (processingCount > 0) {
      return {
        inProgress: true,
        suppressedByNoise: false,
        processingCount: processingCount,
        detectedCount: detectedCount,
        noiseCount: noiseCount,
        reason: `${processingCount} felvétel feldolgozás alatt — megvárjuk, mi lesz belőle.`,
      };
    }

    if (flooded && detectedCount > 0) {
      return {
        inProgress: false,
        suppressedByNoise: true,
        processingCount: 0,
        detectedCount: detectedCount,
        noiseCount: noiseCount,
        reason: `🎤 ZAJ-ÖZÖN (${noiseCount} zaj-tétel ${VoiceNoiseBurst_Util.WINDOW_MINUTES} perc `
          + `alatt, küszöb: ${VoiceNoiseBurst_Util.BURST_THRESHOLD}): a ${detectedCount} nyitott `
          + 'észlelés NEM tartja vissza a köteget. Nyitott mikrofonnál a puszta észlelés nem '
          + 'bizonyít megszólalást — a valódi üzenetek nem ragadhatnak bent miatta.',
      };
    }

    return {
      inProgress: detectedCount > 0,
      suppressedByNoise: false,
      processingCount: 0,
      detectedCount: detectedCount,
      noiseCount: noiseCount,
      reason: detectedCount > 0
        ? `${detectedCount} megszólalás-jel nyitott — ÉPP BESZÉL, megvárjuk.`
        : 'Nincs folyamatban megszólalás.',
    };
  }

  /** Az ablakból kicsúszott időbélyegek eldobása — helyben, hogy a számlálók se hazudjanak. */
  private static prune(values: number[], cutoff: number): void {
    while (values.length && (values[0] ?? 0) < cutoff) values.shift();
  }
}
