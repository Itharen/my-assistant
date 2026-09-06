// „Gépel…" visszajelzés a Discordon — owner-kérés, 2026-09-06:
//   *„vagy dolgozol, vagy valami visszajelzést … egy typing üzét küldhetnél a Discordon
//    időnként. Ugye az egy idővel le is jár, ilyenkor frissíteni kell."*
//
// 🔴 MIÉRT KELL: küldés után az owner oldalán SEMMI nem látszik addig, amíg a válasz meg
// nem érkezik — és egy hosszabb futás percekig tart. Kívülről ez pontosan úgy néz ki, mint
// egy halott csatorna. A „gépel…" jelzés a különbség a „dolgozik rajta" és a „nem jött meg"
// között.
//
// ⏱️ A Discord jelzése magától LEJÁR (~10 mp), ezért ismételni kell — ez a fájl a
// frissítés ütemét és a leállás feltételeit tartja karban.

/** Frissítési ütem. A Discord ~10 mp után elengedi a jelzést, ezért ez alatt kell maradni. */
export const TYPING_REFRESH_MS: number = 7_000;

/**
 * Biztonsági szelep: ennyi idő után MINDENKÉPP abbahagyjuk.
 *
 * Az örökké „gépelő" bot rosszabb, mint a néma: azt sugallná, hogy mindjárt jön a válasz,
 * miközben lehet, hogy már régen elakadt valami.
 */
export const TYPING_MAX_MS: number = 15 * 60_000;

export interface TypingDecisionInput {
  /** Hány üzenet vár még átadásra (köteg). */
  pendingCount: number;
  /** Tartozunk-e Discord-válasszal (az üzenet átment, de válasz még nem ment ki). */
  owesReply: boolean;
  /** Mióta jelzünk folyamatosan (ms időbélyeg); `undefined`, ha most nem jelzünk. */
  typingStartedAt?: number;
  /** A mostani idő (ms). */
  now: number;
  /** Felülírható felső korlát — a teszt ezzel dolgozik. */
  maxMs?: number;
}

export interface TypingDecision {
  shouldType: boolean;
  /** Miért — ez kerül a naplóba, hogy utólag is érthető legyen. */
  reason: string;
}

/**
 * Jelezzünk-e most „gépel…"-t?
 *
 * A sorrend SZÁMÍT:
 *   1. biztonsági szelep — a túl régóta tartó jelzés félrevezető, ezért elsőként vizsgáljuk,
 *   2. várakozó köteg — megkaptam, de még nem adtam át: az owner lássa, hogy megérkezett,
 *   3. válasz-tartozás — átadva, dolgozom rajta, válasz még nem ment ki,
 *   4. egyébként csend.
 */
export function decideTyping(input: TypingDecisionInput): TypingDecision {
  const maxMs: number = input.maxMs ?? TYPING_MAX_MS;

  if (input.typingStartedAt !== undefined && input.now - input.typingStartedAt >= maxMs) {
    return {
      shouldType: false,
      reason: `Biztonsági szelep: ${Math.round((input.now - input.typingStartedAt) / 60_000)} perce `
        + 'jelzünk megszakítás nélkül — abbahagyjuk, mert a végtelen „gépel…" félrevezető.',
    };
  }

  if (input.pendingCount > 0) {
    return {
      shouldType: true,
      reason: `${input.pendingCount} üzenet vár átadásra — jelezzük, hogy megérkezett.`,
    };
  }

  if (input.owesReply) {
    return { shouldType: true, reason: 'Az üzenet átment, válasz még nem ment ki — dolgozunk rajta.' };
  }

  return { shouldType: false, reason: 'Nincs várakozó üzenet és nincs válasz-tartozás.' };
}

/**
 * A „gépel…" jelzés karbantartója.
 *
 * Szándékosan NEM ismeri a Discordot: egy `sendTyping` függvényt kap. Így egységtesztelhető
 * élő kapcsolat nélkül, és a figyelő marad az egyetlen hely, ahol Discord-kliens van.
 */
export class TypingIndicator {

  private typingStartedAt: number | undefined = undefined;
  private timer: NodeJS.Timeout | null = null;

  /**
   * Elsült-e már a biztonsági szelep az AKTUÁLIS munkára.
   *
   * 🔴 MIÉRT KELL KÜLÖN ÁLLAPOT: a szelep elsülésekor nullázzuk a kezdő-időbélyeget, így a
   * következő körben a döntés újra „jelezz"-t adna — a szelep tehát mindössze EGY kört
   * (7 másodpercet) szüneteltetne, és a bot valójában örökké gépelne. A zászlót csak az
   * oldja fel, ha a munka ténylegesen lezárult (nincs várakozó üzenet és nincs tartozás).
   */
  private suppressedUntilIdle: boolean = false;

  constructor(
    private readonly sendTyping: () => Promise<void>,
    private readonly readState: () => Promise<{ pendingCount: number; owesReply: boolean }>,
    private readonly onProblem: (message: string) => void = (): void => undefined,
  ) {}

  /** Az ismétlődő frissítés indítása. */
  start(): void {
    if (this.timer) return;

    this.timer = setInterval((): void => {
      void this.tick();
    }, TYPING_REFRESH_MS);

    // Ne tartsa életben a folyamatot önmagában.
    this.timer.unref();
  }

  /** Leállítás — a figyelő életciklusának végén. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.typingStartedAt = undefined;
    this.suppressedUntilIdle = false;
  }

  /**
   * Egy kör.
   *
   * 🔴 SOHA nem dob: a „gépel…" kozmetika — ha elromlik, attól a csatorna még működjön.
   * A hibát viszont KIÍRJUK, mert a néma elhalás pont az, ami ellen az egész készült.
   */
  async tick(now: number = Date.now()): Promise<TypingDecision> {
    try {
      const state = await this.readState();

      // A munka lezárult → tiszta lap: a szelep is feloldódik.
      if (state.pendingCount === 0 && !state.owesReply) {
        this.typingStartedAt = undefined;
        this.suppressedUntilIdle = false;

        return { shouldType: false, reason: 'Nincs várakozó üzenet és nincs válasz-tartozás.' };
      }

      if (this.suppressedUntilIdle) {
        return {
          shouldType: false,
          reason: 'A biztonsági szelep már elsült erre a munkára — csendben maradunk, '
            + 'amíg a munka le nem zárul.',
        };
      }

      const decision: TypingDecision = decideTyping({
        pendingCount: state.pendingCount,
        owesReply: state.owesReply,
        typingStartedAt: this.typingStartedAt,
        now,
      });

      if (!decision.shouldType) {
        // Munka VAN, mégsem jelzünk ⇒ csak a szelep szólhatott közbe. Rögzítjük, hogy ne
        // induljon újra a következő körben.
        this.typingStartedAt = undefined;
        this.suppressedUntilIdle = true;

        return decision;
      }

      if (this.typingStartedAt === undefined) this.typingStartedAt = now;

      await this.sendTyping();

      return decision;
    } catch (err: unknown) {
      this.onProblem(
        `[discord/typing] A „gépel…" jelzés nem ment: ${err instanceof Error ? err.message : String(err)}`,
      );

      return { shouldType: false, reason: 'Hiba a jelzés közben — kihagyjuk ezt a kört.' };
    }
  }
}
