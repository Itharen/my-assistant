// 🩺 ÉL-E A SZOLGÁLTATÁS? — és ha nem, KILÉPÜNK a hang-csatornából.
//
// > **Owner, 2026-09-10 18:28:** *„amikor leáll a szerver, illetve újraindul, olyankor **ki
// > kéne lépjél a csatornáról**, hogy **ne higgyem azt, hogy itt vagy**."*
//
// ## 🔴 MIÉRT NEM ELÉG A JEL ÉS A `stdin`-EOF — MÉRVE 2026-09-10 20:05
//
// Először két horgonyt építettem: `SIGINT`/`SIGTERM`, és a szülő `stdin`-jének bezárulása.
// Mindkettő **hatástalan maradt**, és a napló ezt mutatta: `19:32`, `19:38`, `19:44`, `19:49`,
// `20:00` — mind **belépés**, és **NULLA kilépés**, holott közben a szerver ötször újraindult.
//
// ⭐ AZ OK a folyamat-fa, amit meg kellett mérni:
//
// ```
// szerver (ldp-entry.cjs)
//   └─ node tsx/dist/cli.mjs …               ← a szerver GYERMEKE
//        └─ node --require tsx … comm listen ← a TÉNYLEGES figyelő
// ```
//
// A `tsx` **újabb folyamatot indít**. A figyelő tehát a szerver **UNOKÁJA**:
// ⛔ a szerver `stdin`-csöve a `tsx`-hez megy, nem hozzá; ⛔ a `child.kill()` (Windowson
// `TerminateProcess`) a köztes folyamatot öli meg, és **nem terjed** lefelé.
//
// ## ⭐ EZÉRT A HELYES KÉRDÉS NEM „ÉL-E A SZÜLŐM", HANEM „ÉL-E A SZOLGÁLTATÁS"
//
// Ez pontosan az, amit a handoff kért: *„a bent-ülés a szolgáltatás állapotát jelezze, ne a
// figyelő-folyamatét"*. És ez a megfogalmazás **független** a folyamat-fától: akkor is
// működik, ha a szerver **összeomlik**, ha **újraindul**, és ha a `tsx` közbeiktat egy folyamatot.
//
// ## ⚠️ ÉS EZ NEM POLLING A `core-no-polling` ÉRTELMÉBEN
//
// A szabály az **agent** háttér-figyelő taskjait tiltja *(azok beragadnak, az owner nem látja
// őket)*. Ez viszont **szolgáltatás-belső** életjel-figyelő, ugyanabból a fajtából, mint a már
// meglévő `HEARTBEAT_INTERVAL_MS` a figyelőben és a `PULSE_INTERVAL_MS` a szerverben.
// ⛔ Esemény-vezérelten NEM megoldható: egy meghalt folyamat **nem küld** értesítést arról,
// hogy meghalt.

import { SwallowedFailure_Util } from '../utils/swallowed-failure.js';
import { decideVoiceLifecycleAction, type VoiceLifecycleAction } from './voice-lifecycle.js';

/**
 * Milyen sűrűn kérdezzük meg, hogy él-e a szolgáltatás.
 *
 * ⚠️ 10 másodperc: ennyi ideig látszik legfeljebb hamis jelenlét. Ritkábban az owner épp azt
 * élné meg, amit kifogásolt; sűrűbben viszont fölöslegesen terhelnénk a szervert.
 */
export const SERVICE_WATCH_INTERVAL_MS: number = 10_000;

/** Ennyi idő után adjuk fel egy egészség-kérdést. */
export const SERVICE_WATCH_TIMEOUT_MS: number = 4_000;

/**
 * Ennyi EGYMÁS UTÁNI bukás után lépünk ki.
 *
 * 🔴 MIÉRT NEM AZ ELSŐ UTÁN: az újraindítás **normális** működés, és közben a szerver
 * másodpercekre elérhetetlen. Ha az első bukásnál kilépnénk, minden LDP-kör kiléptetne és
 * visszaléptetne — a hang-csatornában ez **hallható** kapcsolat-csapkodás lenne.
 *
 * ⚠️ De nem is túl nagy: 2 × 10 s ⇒ legfeljebb ~20-30 másodperc hamis jelenlét, szemben a
 * korábbi **végtelennel**.
 */
export const SERVICE_WATCH_FAILURES_BEFORE_LEAVE: number = 2;

export interface ServiceWatchOptions {
  /** A szolgáltatás egészség-végpontja. */
  healthUrl: string;
  /** Kilépés a hang-csatornából. */
  onLeave: (action: VoiceLifecycleAction) => Promise<void>;
  /** Visszalépés, amikor a szolgáltatás visszajött. */
  onRejoin: () => Promise<void>;
  /** Naplózás. */
  onNote?: (detail: string) => void;
  /** Tesztelhetőség: az egészség-kérdés. */
  probe?: (url: string) => Promise<boolean>;
  /** Tesztelhetőség: az időzítő köze. */
  intervalMs?: number;
}

/** A szolgáltatás-figyelő. */
export class VoiceServiceWatch {

  private timer: NodeJS.Timeout | null = null;
  private consecutiveFailures: number = 0;
  private isLeftBehind: boolean = false;
  private isChecking: boolean = false;

  constructor(private readonly options: ServiceWatchOptions) {}

  /** A figyelés indítása. */
  start(): void {
    this.stop();
    this.timer = setInterval(
      (): void => void this.check(),
      this.options.intervalMs ?? SERVICE_WATCH_INTERVAL_MS,
    );
    // ⚠️ `unref`: ez az időzítő SOSEM tarthatja életben a folyamatot.
    this.timer.unref();
  }

  /** A figyelés leállítása. */
  stop(): void {
    if (this.timer) clearInterval(this.timer);

    this.timer = null;
  }

  /**
   * Egy ellenőrzés.
   *
   * ⛔ **Hibát nem dob**: ez kísérő funkció. Ha maga az ellenőrzés hasal el, az nem
   * buktathatja meg a figyelőt — de ⛔ nem is néma.
   */
  async check(): Promise<void> {
    // ⚠️ Az átfedő ellenőrzés kétszer léptetné a számlálót ugyanarra a kimaradásra.
    if (this.isChecking) return;

    this.isChecking = true;
    try {
      const isAlive: boolean = await (this.options.probe ?? defaultProbe)(this.options.healthUrl);

      if (isAlive) {
        await this.handleAlive();

        return;
      }
      await this.handleDead();
    } catch (err: unknown) {
      SwallowedFailure_Util.report('voice.service-watch.check', err);
    } finally {
      this.isChecking = false;
    }
  }

  /** A szolgáltatás él — ha korábban kiléptünk, visszamegyünk. */
  private async handleAlive(): Promise<void> {
    this.consecutiveFailures = 0;

    if (!this.isLeftBehind) return;

    // ⭐ EZ A MÁSIK FELE: ha csak kilépnénk, de nem térnénk vissza, minden újraindítás után
    // NÉMÁN kimaradnánk a csatornából — az ugyanolyan félrevezető, mint a hamis jelenlét.
    this.isLeftBehind = false;
    this.options.onNote?.('A szolgáltatás visszajött — visszalépek a hang-csatornába.');
    await this.options.onRejoin();
  }

  /** A szolgáltatás nem válaszol. */
  private async handleDead(): Promise<void> {
    this.consecutiveFailures += 1;

    if (this.isLeftBehind) return;

    if (this.consecutiveFailures < SERVICE_WATCH_FAILURES_BEFORE_LEAVE) {
      // ⚠️ Az első bukás lehet egy ÚJRAINDULÁS közepe — még nem hazudunk jelenlétet.
      this.options.onNote?.(
        `A szolgáltatás nem válaszol (${this.consecutiveFailures}.) — még várok, `
        + 'lehet, hogy csak újraindul.',
      );

      return;
    }
    const action: VoiceLifecycleAction = decideVoiceLifecycleAction('service-unreachable');

    this.isLeftBehind = true;
    this.options.onNote?.(action.reason);
    await this.options.onLeave(action);
  }
}

/**
 * Az alapértelmezett egészség-kérdés.
 *
 * ⚠️ Bármilyen HTTP-válasz **életnek** számít: ha a szerver 500-at ad, akkor is **fut** —
 * a hang-jelenlét szempontjából az „ott van-e" a kérdés, nem az, hogy „hibátlan-e".
 */
async function defaultProbe(url: string): Promise<boolean> {
  const controller: AbortController = new AbortController();
  const timer: NodeJS.Timeout = setTimeout((): void => controller.abort(), SERVICE_WATCH_TIMEOUT_MS);

  try {
    await fetch(url, { signal: controller.signal });

    return true;
  } catch (err) {
    // ⚠️ A HÁLÓZATI HIBA ITT A VÁRT VÁLASZ — épp azt kérdezzük, elérhető-e. A `false` maga a
    // felelet, és a KÖVETKEZMÉNYT a hívó naplózza (`handleDead` → „nem válaszol", majd a
    // kilépés oka). ⛔ Itt mégsem hallgatunk teljesen: a jelentő **hatókörönként
    // deduplikál**, tehát ha a hiba MÁS lesz (pl. hibás URL, nem elérhetetlenség), az
    // kiderül — de egy tartós kiesés nem termel riasztás-özönt.
    SwallowedFailure_Util.report('voice.service-watch.probe', err);

    return false;
  } finally {
    clearTimeout(timer);
  }
}
