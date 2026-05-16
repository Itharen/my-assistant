// Weather poll service — OpenMeteo `current.precipitation`-t poll-oz 15 percenként
// (Budapest, lat=47.4979 lon=19.0402), és átmenet száraz→csapadékos esetén
// action-log eseményt emit-el `event_class: "3x3-trigger" subtype: "rain"`
// mezővel — a wave-panel marker-overlay automatikusan megjeleníti (🌧️ ikon).
//
// FR #8a weather-rain-notification Phase 1 (cycle 90).
// Pattern: VersionBroadcast_SocketServerService singleton + setInterval-from-constructor.
// No paid solutions (OpenMeteo no-key, lásd `current/principles/no-paid-solutions.md`).

import { emitServerActionLog } from '../_collections/action-log.util';
import { VersionBroadcast_SocketServerService } from './socket-services/version-broadcast.socket-server-service';

/** Poll interval — 15 perc per FR scope. */
const POLL_INTERVAL_MS: number = 15 * 60 * 1000;

/** Budapest koordináták (default user-lokáció). */
const DEFAULT_LAT: number = 47.4979;
const DEFAULT_LON: number = 19.0402;

/** OpenMeteo response shape — minimal a current.precipitation lekérdezéshez. */
interface OpenMeteoCurrent_Response {
  current?: {
    precipitation?: number;
    time?: string;
    weather_code?: number;
  };
}

/** Internal weather state — átmenet-detekció (száraz↔csapadékos). */
type WeatherState = 'dry' | 'rain' | 'unknown';

/**
 * Weather poll service — singleton, konstruktor-init-kor indít 15min interval-t.
 * Az interval-ban OpenMeteo-t poll-oz, átmenet száraz→csapadékos esetén emit.
 *
 * `WeatherPoll_Service.getInstance()` triggereli a singleton-példányt; a hívó
 * `app.server.ts` `getRootServices()`-ben példányosítja boot-időben.
 */
export class WeatherPoll_Service {

  private static instance: WeatherPoll_Service | null = null;

  /** Singleton accessor. */
  static getInstance(): WeatherPoll_Service {
    if (!WeatherPoll_Service.instance) {
      WeatherPoll_Service.instance = new WeatherPoll_Service();
    }

    return WeatherPoll_Service.instance;
  }

  private lastState: WeatherState = 'unknown';
  private readonly lat: number = DEFAULT_LAT;
  private readonly lon: number = DEFAULT_LON;
  private tickHandle: NodeJS.Timeout | null = null;

  private constructor() {
    // First tick after 5s to give server boot some grace.
    setTimeout((): void => {
      void this.tick();
    }, 5_000);

    this.tickHandle = setInterval((): void => {
      void this.tick();
    }, POLL_INTERVAL_MS);
    this.tickHandle.unref();
  }

  /**
   * Egy poll-ciklus: lekéri az OpenMeteo current.precipitation-t és detect-eli
   * az átmenetet. Első tick (state=`unknown`) baseline-set, no emit.
   */
  private async tick(): Promise<void> {
    try {
      const url: string = `https://api.open-meteo.com/v1/forecast?latitude=${this.lat}&longitude=${this.lon}&current=precipitation,weather_code`;
      const resp: Response = await fetch(url);

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }

      const data: OpenMeteoCurrent_Response = await resp.json() as OpenMeteoCurrent_Response;
      const precip: number = Number(data.current?.precipitation ?? 0);
      const newState: WeatherState = precip > 0 ? 'rain' : 'dry';

      // First tick — baseline-set, no emit.
      if (this.lastState === 'unknown') {
        this.lastState = newState;

        return;
      }

      // dry → rain transition: emit.
      if (this.lastState === 'dry' && newState === 'rain') {
        await this.emitRainStart(precip, data.current?.weather_code);
      }

      this.lastState = newState;
    } catch (err) {
      const e: Error = err instanceof Error ? err : new Error(String(err));

      await emitServerActionLog({
        actor: 'server',
        kind: 'error',
        summary: `[MA-WEATHER-POLL-FAIL] ${e.message.slice(0, 200)}`,
        extra: { errorCode: 'MA-WEATHER-POLL-FAIL', issuer: 'weather-poll.tick', stack: e.stack },
      });
    }
  }

  /**
   * Eső-kezdés esemény emit: action-log entry `event_class: 3x3-trigger`
   * `subtype: rain` mezővel → wave-panel marker-overlay automatikus 🌧️ ikon.
   * Bónusz: socket broadcast a kliensnek (domain:weather), real-time noti.
   */
  private async emitRainStart(precipMm: number, weatherCode: number | undefined): Promise<void> {
    const summary: string = `Eső kezdődött (precip=${precipMm}mm, weather_code=${weatherCode ?? '?'})`;

    await emitServerActionLog({
      actor: 'server',
      kind: 'note',
      summary,
      extra: {
        event_class: '3x3-trigger',
        subtype: 'rain',
        source: 'weather-poll',
        precip_mm: precipMm,
        weather_code: weatherCode,
        location: { lat: this.lat, lon: this.lon },
      },
    });

    // Push event a kliensnek (FR #3f Phase 5 channel) — real-time UX trigger.
    await VersionBroadcast_SocketServerService.getInstance().broadcastDomainEvent('weather', 'create', {
      subtype: 'rain',
      precip_mm: precipMm,
      weather_code: weatherCode,
      summary,
    });
  }
}
