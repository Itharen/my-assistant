// Sleep-state service — egyetlen igazságforrás, hogy a user éber- vagy alvás-
// állapotban van-e *most*. Más service-ek (notify-cast, weather-poll noti,
// `/api/sleep-state` endpoint) ide kérdeznek be MIELŐTT hangos notifikációt
// emit-elnek (FR #5 sleep-aware notifications, Phase 1).
//
// FR forrás: `current/feature-requests/sleep-aware-notifications.md`.
// Phase 1 MVP: time-of-day heuristic (02:00-10:00 Europe/Budapest = sleep-window).
// Phase 2 finomítás később: activity-monitor integration + sleep-system.md formula.

/** Sleep-state output shape — kliens/cron-job/notify-gate olvashatja. */
export interface SleepState_Snapshot {
  isInSleepWindow: boolean;
  source: 'time-of-day-heuristic';
  ts: string;
  /** A jelenlegi local-time óra (0-23, Europe/Budapest). */
  hour: number;
  /** Window-config: kezdő + záró óra (zárt-félig-nyílt: [start, end)). */
  window: { startHour: number; endHour: number };
}

/** Default sleep-window: 02:00-10:00 Europe/Budapest. Env-override-olható. */
const DEFAULT_SLEEP_START_HOUR: number = 2;
const DEFAULT_SLEEP_END_HOUR: number = 10;

/**
 * Sleep-state service — singleton. Egyetlen `getSnapshot()` method-ot exposál,
 * időzítés-mentes (request-time evaluate, no background timers).
 *
 * Más service-ek hívják (server-side notify-gate-hez), és a `GET /api/sleep-state`
 * unauth endpoint is ezt szolgálja ki.
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

  /** Aktuális snapshot — request-time evaluate, no caching. */
  getSnapshot(now: Date = new Date()): SleepState_Snapshot {
    const hour: number = now.getHours();
    const isInSleepWindow: boolean = isInWindow(hour, this.startHour, this.endHour);

    return {
      isInSleepWindow,
      source: 'time-of-day-heuristic',
      ts: now.toISOString(),
      hour,
      window: { startHour: this.startHour, endHour: this.endHour },
    };
  }

  /** Convenience — true ha jelenleg alvás-ablak (semmi notifikáció). */
  isInSleepWindow(now: Date = new Date()): boolean {
    return this.getSnapshot(now).isInSleepWindow;
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

/**
 * Inclusive-exclusive [start, end) félig-nyílt intervallum tesztelés óra-skálán.
 * Wraps-around támogatás (pl. 22 → 6 = "este 10-től reggel 6-ig").
 */
function isInWindow(hour: number, start: number, end: number): boolean {
  if (start <= end) {
    return hour >= start && hour < end;
  }
  // Wrap-around (pl. 22..6): hour >= 22 OR hour < 6.
  return hour >= start || hour < end;
}
