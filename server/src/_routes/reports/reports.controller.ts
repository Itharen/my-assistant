// Reports controller — 3 unauth GET endpoint a Reports panel (FR #3g Phase 1)
// kliens fetch-eihez. Fájl-alapú aggregátorok (reports.util.ts) kimenetét
// adja vissza JSON-ban.
//
// FR #3g Phase 1 (cycle 95). Pattern: WaveJsonl_Controller standalone DyNTS_Controller,
// no preProcesses (unauth, loopback-only safety via Auth_ControlService bypass).

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import {
  listCycles,
  listFeatureRequests,
  listRecentShips,
  type ReportCycle_Row,
  type ReportFr_Row,
  type ReportShip_Row,
} from '../../_collections/reports.util';

const SHIPS_DEFAULT_LIMIT: number = 30;
const SHIPS_DEFAULT_DAYS: number = 14;
const CYCLES_DEFAULT_LIMIT: number = 50;

/** Reports HTTP controller. 3 unauth GET endpoint — FR-board, cycle history, recent ships. */
export class Reports_Controller extends DyNTS_Controller {

  /** Singleton accessor — DyNTS_Controller.getSingletonInstance() wrapper. */
  static getInstance(): Reports_Controller {
    return Reports_Controller.getSingletonInstance();
  }

  /** Regisztrálja a `/frs`, `/cycles`, `/recent-ships` GET endpointokat (root: `/api/reports`). */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'listFrs',
        type: DyFM_HttpCallType.get,
        endpoint: '/frs',
        // NO preProcesses → unauth (loopback-gated via Auth_ControlService bypass).
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const rows: ReportFr_Row[] = await listFeatureRequests();

            res.send({ rows });
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'listCycles',
        type: DyFM_HttpCallType.get,
        endpoint: '/cycles',
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const limit: number = clampInt(req.query.limit, 1, 500, CYCLES_DEFAULT_LIMIT);
            const rows: ReportCycle_Row[] = await listCycles(limit);

            res.send({ rows, limit });
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'listRecentShips',
        type: DyFM_HttpCallType.get,
        endpoint: '/recent-ships',
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const limit: number = clampInt(req.query.limit, 1, 500, SHIPS_DEFAULT_LIMIT);
            const days: number = clampInt(req.query.days, 1, 90, SHIPS_DEFAULT_DAYS);
            const rows: ReportShip_Row[] = await listRecentShips(limit, days);

            res.send({ rows, limit, days });
          },
        ],
      }),
    ];
  }
}

/** Query int parse + clamp helper. */
function clampInt(raw: unknown, min: number, max: number, fallback: number): number {
  const n: number = Number(raw);

  if (!Number.isFinite(n) || n < 1) return fallback;

  return Math.max(min, Math.min(max, Math.floor(n)));
}
