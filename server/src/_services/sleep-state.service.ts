// 😴 ALVÁS-ÁLLAPOT — ⭐ MÉRÉSBŐL, ⛔ nem fix órarendből.
//
// Egyetlen igazságforrás arról, hogy az owner éber- vagy alvás-állapotban van-e *most*. Más
// service-ek *(notify-cast, weather-poll noti)* és a `GET /api/sleep-state` végpont ide
// kérdeznek be, MIELŐTT hangos notifikációt emitálnak.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 2026-09-12 — A FIX ÓRAREND KICSERÉLVE MÉRÉSRE (MP-5)
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
// Ez a service **fix órarendből tippelt** *(`02:00-10:00 = alvás-ablak`)*, és a `comm doctor`
// ezt **régóta sárgán** jelezte.
//
// ⭐ **MEGMÉRVE a teljes jelenlét-adaton** *(8 nap, 5 698 perc-minta)*: a tipp és a mérhető
// valóság **35-44%-ban ELTÉR** *(három különböző osztályozással: 43,9% · 38,5% · 35,3%)* —
// vagyis a fix órarend gyakorlatilag **érme-feldobás**. Strukturális ok: a **csúszó, ~26 órás**
// alvás-ciklus *(`sleep-system.md`)* egy fix órarenddel összeférhetetlen.
// 📌 A teljes mérés és a handoff két példájának korrekciója: `cli/src/presence/presence.awake.ts`.
//
// ⭐ A jel viszont **ott van a lemezen**, és a CLI-oldalon **már mérjük**.
//
// 🔴 **EZÉRT NEM ÍRUNK ITT MÁSODIK IMPLEMENTÁCIÓT** *(`core-ssot-unified`)*: a döntés a CLI
// `presence.awake` moduljában lakik, és ugyanazt használja a **hangszóró-kapu** is. Két
// implementáció azt jelentené, hogy a rendszer **két különböző igazságot** mond ugyanarról az
// emberről — pontosan ez volt a mért hiba.
//
// ⚠️ **AZ ÓRA-ABLAK MEGMARADT, DE ⛔ NEM DÖNT.** A `hour` és a `window` mező **tájékoztató**
// *(a régi konfiguráció nem tűnik el némán)*. Ha valaki újra döntésre használná: **ne**.

import { DyFM_Error } from '@futdevpro/fsm-dynamo';

import { SwallowedFailure_Util } from '../_collections/swallowed-failure.util.js';

/**
 * Az ébrenlét-döntés alakja — ⚠️ **a CLI adja**, itt csak a szerződést írjuk le.
 *
 * ⭐ MIÉRT SZŰK TÍPUS: így a teszt egy **egyszerű objektummal** kielégíti *(fixtúra)*, ⛔ `as`
 * átcímkézés nélkül — és a hétvégi kikötés szerint ⛔ **élő hangszóró-kísérlet nélkül**.
 */
export interface SleepState_AwakeReading {
  awake: {
    state: 'awake' | 'asleep' | 'unknown';
    isAwake: boolean;
    signal: string;
    reason: string;
    ageMinutes?: number;
  };
}

/** Sleep-state output shape — kliens / cron-job / notify-gate olvashatja. */
export interface SleepState_Snapshot {
  /**
   * 🔴 Néma ablak-e MOST *(⇒ ne szólaljon meg a hangszóró)*.
   *
   * ⚠️ **`true` mind az `asleep`, mind az `unknown` ágon.** Az `unknown` ⛔ nem „valószínűleg
   * ébren": *a téves csend olcsó, a téves hangos megszólalás nem az* — erre épül a kapu.
   */
  isInSleepWindow: boolean;
  /**
   * Honnan jön a döntés.
   *
   * ⭐ `presence-measurement` = MÉRVE *(ez a jó eset)* ·
   * 🔴 `measurement-unavailable` = a mérés nem olvasható ⇒ a biztonságos ág nyer.
   */
  source: 'presence-measurement' | 'measurement-unavailable';
  ts: string;
  /** A jelenlegi local-time óra (0-23, Europe/Budapest). ⚠️ **Tájékoztató**, ⛔ nem dönt. */
  hour: number;
  /** A régi óra-ablak konfigurációja. ⚠️ **Tájékoztató**, ⛔ nem dönt. */
  window: { startHour: number; endHour: number };
  /** ⭐ A döntés INDOKLÁSA — melyik jel, milyen friss. ⛔ Nem puszta logikai érték. */
  awake: SleepState_AwakeReading['awake'];
}

/** A korábbi, óra-alapú ablak — ⚠️ **csak tájékoztató** mező marad belőle. */
const DEFAULT_SLEEP_START_HOUR: number = 2;
const DEFAULT_SLEEP_END_HOUR: number = 10;

/**
 * Az ébrenlét-olvasó betöltése a CLI-ből.
 *
 * 🔴 A FUTÁSIDEI HIVATKOZÁS **RELATÍV**, NEM `@cli/...` ALIAS — MÉRVE 2026-09-10.
 * A `tsconfig` `paths` bejegyzése **csak fordítási időben** létezik; a `tsx` futásidőben NEM
 * alkalmazza a dinamikus importra. ⚠️ A Google- és a Spotify-panel **élesben elromlott** emiatt,
 * miközben a típus-ellenőrzés **zöld** volt.
 */
let cliModulePromise: Promise<typeof import('@cli/presence/presence.awake-runner')> | null = null;

function loadAwakeRunner(): Promise<typeof import('@cli/presence/presence.awake-runner')> {
  cliModulePromise ??= import('../../../cli/src/presence/presence.awake-runner.js');

  return cliModulePromise;
}

/**
 * Sleep-state service — singleton, időzítés-mentes *(request-time evaluate, no timers)*.
 */
export class SleepState_Service {

  private static instance: SleepState_Service | null = null;

  /** Singleton accessor. */
  static getInstance(): SleepState_Service {
    if (!SleepState_Service.instance) {
      SleepState_Service.instance = new SleepState_Service();
    }

    return SleepState_Service.instance;
  }

  private readonly startHour: number;
  private readonly endHour: number;

  private constructor() {
    this.startHour = readEnvHour('MA_SLEEP_START_HOUR', DEFAULT_SLEEP_START_HOUR);
    this.endHour = readEnvHour('MA_SLEEP_END_HOUR', DEFAULT_SLEEP_END_HOUR);
  }

  /**
   * Aktuális snapshot — a MÉRT ébrenlét alapján.
   *
   * @param now a „most" — a teszt injektálja.
   * @param read a mérés-olvasó — ⭐ **fixtúrából** cserélhető, ⛔ élő kísérlet nélkül.
   *
   * 🔴 **HA A MÉRÉS NEM OLVASHATÓ, A BIZTONSÁGOS ÁG NYER:** `isInSleepWindow: true` és a
   * `source` **kimondja**, hogy nincs mérés. ⛔ NEM esünk vissza az óra-tippelésre — az volt
   * az eredeti hiba, és **némán** hazudott volna tovább.
   */
  async getSnapshot(
    now: Date = new Date(),
    read?: (when: Date) => Promise<SleepState_AwakeReading>,
  ): Promise<SleepState_Snapshot> {
    const context = this.describeContext(now);

    try {
      const reader = read ?? (await loadAwakeRunner()).runAwakeDecision;
      const reading: SleepState_AwakeReading = await reader(now);

      return {
        // ⭐ ÉBREN ⇒ nincs néma ablak. Minden más ág ⇒ van.
        isInSleepWindow: !reading.awake.isAwake,
        source: 'presence-measurement',
        ...context,
        awake: reading.awake,
      };
    } catch (error: unknown) {
      // ⛔ NEM NÉMA, de ⛔ nem is dobunk.
      //
      // ## ⚠️ EGY VÁLLALT REVIEW-TALÁLAT — `controller-handler-error-wrapping`
      //
      // A szabály azt kéri, hogy a vezérlőből elérhető függvény a hibát **`DyFM_Error`-ba
      // csomagolja**. 🔴 Itt **szándékosan nem dobunk**, és ezt meg is indoklom:
      //
      // | Ha DOBUNK | Ha a biztonságos ágat ADJUK VISSZA |
      // |---|---|
      // | a végpont **500**-at ad | a hívó **használható** választ kap: „NÉMA, mert nincs mérés" |
      // | a `comm doctor` azt írja: *„a szerver nem válaszolt"* | azt írja: *„a mérés nem olvasható"* — ⭐ a VALÓDI ok |
      // | a notify-kapu **nem tud dönteni** | a kapu a **csendet** választja *(a helyes ág)* |
      //
      // ⇒ Pont akkor rontanánk el, amikor a jelenlét-figyelő elhasal — tehát amikor a
      // legfontosabb, hogy a rendszer **csendben, de érthetően** maradjon.
      //
      // ⭐ **DE A HIBA NEM VESZIK EL:** az okot **(a)** a válasz `awake.reason`-je viszi
      // *(így a `comm doctor` kiírja)*, **(b)** a hiba-tár is megkapja az alábbi jelentéssel.
      SwallowedFailure_Util.report('sleep-state.getSnapshot.awakeReader', error);

      return {
        isInSleepWindow: true,
        source: 'measurement-unavailable',
        ...context,
        awake: {
          state: 'unknown',
          isAwake: false,
          signal: 'none',
          reason: 'A jelenlét-mérés nem olvasható '
            + `(${error instanceof Error ? error.message : String(error)}) ⇒ a biztonságos ág `
            + 'nyer: NÉMA. ⛔ Fix órarendre NEM esünk vissza — az tippelés volt.',
        },
      };
    }
  }

  /** Convenience — `true`, ha most **nem** szabad hangosan megszólalni. */
  async isInSleepWindow(
    now: Date = new Date(),
    read?: (when: Date) => Promise<SleepState_AwakeReading>,
  ): Promise<boolean> {
    return (await this.getSnapshot(now, read)).isInSleepWindow;
  }

  /**
   * Az óra-kontextus — ⚠️ **tájékoztató**, ⛔ nem dönt.
   *
   * @throws `DyFM_Error` érvénytelen `Date` esetén: a `toISOString()` dob, és egy nyers
   *   kivétel itt azt jelentené, hogy az értesítések néma-ablaka kiszámíthatatlan.
   */
  private describeContext(now: Date): { ts: string; hour: number; window: { startHour: number; endHour: number } } {
    try {
      return {
        ts: now.toISOString(),
        hour: now.getHours(),
        window: { startHour: this.startHour, endHour: this.endHour },
      };
    } catch (error: unknown) {
      throw new DyFM_Error({
        error: error,
        errorCode: 'MA-SLEEP-SNAPSHOT-FAILED',
        message: 'Az alvas-ablak allapota nem allapithato meg.',
      });
    }
  }
}

/** Env-érték olvasás óraként, fallback ha invalid / üres. */
function readEnvHour(envKey: string, fallback: number): number {
  const raw: string | undefined = process.env[envKey];

  if (!raw) return fallback;

  const parsed: number = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 23) return fallback;

  return Math.floor(parsed);
}
