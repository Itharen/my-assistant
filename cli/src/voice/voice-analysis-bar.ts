// 🎨 AZ ÉLŐ, KERETENKÉNTI SZÍNES SÁV — a döntés FOLYAMATA, nem az eredménye.
//
// **Owner szó szerint (2026-09-08 01:41):**
// > *„`|` színesen, egy sorban, miközben hallja a hangomat, és azok pirosak és zöldek, és
// > amikor elég sok zöld van egymás mellett, akkor minősítjük azt egy hangszövegű üzenetnek."*
//
// ⭐ MIÉRT SZÁMÍT: ez **közben** ad visszajelzést — ettől tudja beállítani magát *(hangosabban,
// közelebb, csendesebb környezet)*. Egy utólagos összegzés ezt nem adja meg. A korábbi
// 60 mp-enkénti szám-sor a döntés **eredményét** mutatta; ez a **folyamatát**.
//
// ---
//
// ## ⛔ AMIHEZ NEM NYÚLTUNK, ÉS MIÉRT
//
// Az átemelt kódban létezik egy ilyen sáv (`_logCompactAudioAnalysis`), és be is van kapcsolva.
// ⛔ **Nem módosítjuk** (`transplant-not-rewrite`) — ehelyett **mellé** ülünk: kívülről
// megfigyeljük ugyanazt az elemzést, és **saját** sávot rajzolunk.
//
// ## 🔴 EGY MÉRT ELTÉRÉS AZ EREDETITŐL — kocsivissza helyett teljes sorok
//
// Az eredeti `\r`-rel **helyben rajzol**. Mérve 2026-09-08: ez itt **nem működhet**, mert a
// konzolra **két külön folyamat** ír *(a figyelő rajzolja a sávot, a szerver a 60 mp-enkénti
// pulzus-sort)*, és a pulzus **ráragad** a sosem lezárt sorra:
//
// ```
// 🎤 Audio Analysis: |||||🫀 07:15 · fut 2p │ 💬 Discord ✅ │ 📬 köteg üres
// ```
//
// ⇒ A kettő **kölcsönösen tönkreteszi egymást**, és ez **szerkezeti** — a szerver nem tudhatja,
// hogy a figyelő épp rajzol.
//
// 🩹 **Ezért teljes, `\n`-nel lezárt sorokat írunk**, kötegenként. Egy lezárt sort a közéékelődő
// pulzus **nem tud elrontani** — legfeljebb közé kerül. Az élő jelleg megmarad: `BAR_WIDTH`
// keret ≈ **1 másodperc**, tehát beszéd közben másodpercenként érkezik egy friss sor.

/** ANSI színkódok — ugyanazok, amiket az eredeti CCAP-sáv használt. */
const GREEN: string = '\x1b[32m';
const YELLOW: string = '\x1b[33m';
const RED: string = '\x1b[31m';
const RESET: string = '\x1b[0m';

/**
 * A ZCR-küszöb, ami fölött egy keret „határeset" (sárga).
 *
 * ⚠️ Az átemelt `cv-voice.utils.ts`-ből **tükrözve** (`ZCR_GATE = 0.3`), mert ott lokális
 * konstans, nem exportált. ⛔ Ezért a sárga árnyalat **elcsúszhat**, ha az átemelt érték
 * változik — de a **zöld nem**, mert az a tényleges döntést használja (lásd lentebb).
 */
export const ZCR_GATE: number = 0.3;

/** Hány keret alkot egy kiírt sort. 20 ms/keret ⇒ ~1 másodperc. */
export const BAR_WIDTH: number = 48;

/** Ennyi EGYMÁS MELLETTI zöld keret fölött mondjuk ki, hogy ez megszólalás. */
export const MIN_GREEN_RUN: number = 8;

/**
 * Ennyi csend után tekintjük lezártnak a megszólalást.
 *
 * ⭐ MIÉRT ÍGY: a megszólalás vége az **átemelt** kódban dől el
 * (`receiver.speaking.on('end')`), amihez ⛔ nem nyúlhatunk. A csend viszont **kívülről is
 * látszik**: ha nem érkezik több keret, vége. Így a lezárás a mi oldalunkon marad.
 */
export const SEGMENT_IDLE_MS: number = 700;

/** Egy hangkeret minősítése. */
export type FrameVerdict = 'speech' | 'edge' | 'silence';

/** Amit egy keretről tudunk — pontosan az, amit az elemző visszaad. */
export interface AnalysisFrame {
  isSpeech: boolean;
  zcrNormalized: number;
}

/**
 * Egy keret besorolása.
 *
 * ⭐ A DÖNTÉS, AMI SZÁMÍT: a **zöld a tényleges `isSpeech`**, nem az én rekonstrukcióm a
 * küszöbökből. Ha a saját képletemmel színeznék, a sáv és a felvevő döntése **elcsúszhatna** —
 * és akkor a sáv **hazudna** arról, amit megfigyel. Így a zöld pontosan azt jelenti: *ezt a
 * keretet a felvevő beszédnek vette*.
 *
 * A sárga csak **árnyalat**: nem beszéd, de közel volt hozzá — ez mondja meg az ownernek,
 * hogy „majdnem".
 */
export function classifyFrame(frame: AnalysisFrame): FrameVerdict {
  if (frame.isSpeech) return 'speech';
  if (frame.zcrNormalized > ZCR_GATE * 0.9) return 'edge';

  return 'silence';
}

/** A leghosszabb egymást követő zöld sorozat. */
export function longestGreenRun(verdicts: FrameVerdict[]): number {
  let best: number = 0;
  let current: number = 0;

  for (const verdict of verdicts) {
    current = verdict === 'speech' ? current + 1 : 0;
    if (current > best) best = current;
  }

  return best;
}

/**
 * A sáv kirajzolása egy keret-kötegből.
 *
 * ⚠️ `\n`-nel lezárt, **teljes** sor — a fenti mért ok miatt.
 */
export function renderBar(verdicts: FrameVerdict[]): string {
  const bars: string = verdicts
    .map((verdict: FrameVerdict): string => {
      if (verdict === 'speech') return `${GREEN}|${RESET}`;
      if (verdict === 'edge') return `${YELLOW}|${RESET}`;

      return `${RED}|${RESET}`;
    })
    .join('');

  return `🎤 ${bars}`;
}

/**
 * A megszólalás záró ítélete — *„elég sok zöld egymás mellett"*.
 *
 * 🔴 EZ AZ OWNER SZABÁLYA, SZÓ SZERINT: nem a zöldek **száma** dönt, hanem hogy van-e elég
 * hosszú **megszakítatlan** zöld sorozat. Szórt zöldek = zaj, nem beszéd.
 */
export function summarizeSegment(verdicts: FrameVerdict[]): string {
  const green: number = verdicts.filter((v: FrameVerdict): boolean => v === 'speech').length;
  const run: number = longestGreenRun(verdicts);
  const qualifies: boolean = run >= MIN_GREEN_RUN;

  return `🎤 ${qualifies ? '✅ MEGSZÓLALÁS' : '⚪ nem elég'} — `
    + `${green}/${verdicts.length} zöld keret, leghosszabb sorozat: ${run}`
    + ` (kell: ${MIN_GREEN_RUN})`;
}

/**
 * Az élő sáv — kereteket gyűjt, és kötegenként kiír egy teljes sort.
 *
 * ⛔ **SOHA NEM DOB.** A sáv **diagnosztika**: ha elhasal, az nem viheti magával a felvételt.
 * *(Mért precedens: a megszólalás-számláló `?.` nélkül megölte volna a felvételt.)*
 */
export class VoiceAnalysisBar {

  private buffer: FrameVerdict[] = [];

  /** A teljes megszólalás minden kerete — a záró ítélethez. */
  private segment: FrameVerdict[] = [];

  /** A csend-figyelő. ⚠️ `unref`-elt: ⛔ nem tarthatja életben a folyamatot. */
  private idleTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly write: (line: string) => void,
    private readonly idleMs: number = SEGMENT_IDLE_MS,
    /**
     * Hova megy a **kiíró saját hibája**.
     *
     * ⚠️ Alapból `stderr` — de **cserélhető**, mert a teszt szándékosan elrontott kiírója
     * különben **az owner LDP-konzolját szennyezné**. Mérve 2026-09-08 10:05: a saját
     * pozitív kontrollom **3 zaj-sort** tett a szerver logjába. ⛔ Ez pont a T-52 célja ellen
     * dolgozik: a konzolnak **olvashatónak** kell maradnia.
     */
    private readonly reportWriteError: (detail: string) => void =
      (detail: string): void => void process.stderr.write(detail),
  ) {}

  /** Egy keret hozzáadása. Ha betelt a köteg, kiír egy sort. */
  push(frame: AnalysisFrame): void {
    const verdict: FrameVerdict = classifyFrame(frame);

    this.buffer.push(verdict);
    this.segment.push(verdict);

    if (this.buffer.length >= BAR_WIDTH) this.flushLine();

    this.armIdleTimer();
  }

  /**
   * A megszólalás lezárása: a maradék sáv + a záró ítélet.
   *
   * ⚠️ Üres megszólalásnál NEM ír semmit — egy „0/0 zöld keret" sor csak zaj lenne.
   */
  endSegment(): void {
    this.clearIdleTimer();

    if (this.buffer.length > 0) this.flushLine();
    if (this.segment.length > 0) this.safeWrite(summarizeSegment(this.segment));

    this.segment = [];
  }

  /**
   * 🔴 A KIÍRÁS SOHA NEM DOBHAT — ez a modul legfontosabb szabálya.
   *
   * ⚠️ **MÉRT HIBA (2026-09-08 09:40, a saját tesztem fogta meg):** korábban csak a `push()`
   * volt védve. A csend-időzítőből hívott `endSegment()` viszont **nem** — és egy elhasalt
   * kiíró onnan **elkapatlan kivételként** szállt fel. Élesben ez `uncaughtException` lett
   * volna a **figyelő folyamatban**: a diagnosztika ölte volna meg a felvételt, pontosan az
   * a hibaosztály, amit a DEV-HANDOFF kemény korlátként tilt.
   *
   * ⛔ A hiba nem néma: `stderr`-re megy. De tovább **nem terjed**.
   */
  private safeWrite(line: string): void {
    try {
      this.write(line);
    } catch (error: unknown) {
      this.reportWriteError(
        `[voice] a sáv kiírása nem sikerült (a felvétel ettől ÉRINTETLEN): `
        + `${error instanceof Error ? error.message : String(error)}
`,
      );
    }
  }

  private flushLine(): void {
    this.safeWrite(renderBar(this.buffer));
    this.buffer = [];
  }

  private armIdleTimer(): void {
    this.clearIdleTimer();

    this.idleTimer = setTimeout((): void => {
      this.idleTimer = null;
      this.endSegment();
    }, this.idleMs);

    // ⛔ A diagnosztika nem tarthatja életben a folyamatot leállításkor.
    this.idleTimer.unref?.();
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }
}
