// Wave-marker HTTP controller — `GET /api/wave/markers?sinceMs=<>&untilMs=<>`.
// Az action-log fájlokat szűri a `event_class` mező alapján és visszaadja a
// trigger/törés/megoszló-erő marker-listát a wave-panel Phase 5e renderhez.
//
// FR #3b-WAVE-UI Phase 5e.2 (cycle 88). Pattern: WaveJsonl_Controller-rel
// egyező standalone DyNTS_Controller, unauth (action-log read-only).

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { readWaveMarkers, type WaveMarker_Row } from '../../_collections/wave-markers.util';

const RANGE_DEFAULT_HOURS: number = 24;
const RANGE_MAX_HOURS: number = 24 * 365;

/** Wave-marker HTTP controller. Unauth GET az action-log szűrt event-list-jéhez. */
export class WaveMarkers_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): WaveMarkers_Controller {
    return WaveMarkers_Controller.getSingletonInstance();
  }

  /** Regisztrálja a `GET /markers` endpoint-ot (rooted under `/api/wave`). */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'getMarkers',
        type: DyFM_HttpCallType.get,
        endpoint: '/markers',
        // NO preProcesses → unauth (FDPNTS-pattern, action-log read-only).
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const now: number = Date.now();
            const sinceMs: number = clampMs(Number(req.query.sinceMs), now - RANGE_DEFAULT_HOURS * 3600_000, now - RANGE_MAX_HOURS * 3600_000, now);
            const untilMs: number = clampMs(Number(req.query.untilMs), now, now - RANGE_MAX_HOURS * 3600_000, now);
            const rows: WaveMarker_Row[] = await readWaveMarkers(sinceMs, untilMs);

            res.send({ rows, sinceMs, untilMs });
          },
        ],
      }),
    ];
  }
}

/** Clamp + default helper a `sinceMs` / `untilMs` query-paramekhez. */
function clampMs(raw: number, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return fallback;

  return Math.max(min, Math.min(max, raw));
}
