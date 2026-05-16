// Wave JSONL controller — UNAUTH read endpoint a `__agent/state/3x3-log.jsonl`
// hullám-snapshot forrásból. A dashboard waves-panel-jét táplálja AUTH-mentes
// fallback útvonalon (FR #3b-WAVE-UI Phase 2.A, cycle 52).
//
// Pattern source: `server/src/_routes/errors/errors.controller.ts` (FDPNTS-extend),
// de itt nincs DB → standalone DyNTS_Controller, unauth (nincs preProcesses).
//
// AUTH BLOCKER kontextus: a `/api/dashboard/snapshot` auth-gated; ez az endpoint
// **szándékosan unauth**, hogy a wave UI a chat AGB-03 task B döntés nélkül is
// működjön (AGB-2026-05-16-02 Phase 2 anchor explicit alternatívája).

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { readWavesFromJsonl, type WaveJsonl_Row } from '../../_collections/wave-jsonl.util';

/** Wave JSONL HTTP controller. Unauth read-only — 3x3-log.jsonl → JSON. */
export class WaveJsonl_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): WaveJsonl_Controller {
    return WaveJsonl_Controller.getSingletonInstance();
  }

  /** Regisztrálja a `/get-from-jsonl` unauth endpoint-ot. */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'getFromJsonl',
        type: DyFM_HttpCallType.get,
        endpoint: '/get-from-jsonl',
        // NO preProcesses → unauth (FDPNTS-pattern, mint /api/logs/*, /api/errors/error/log).
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const limit: number = Math.min(Math.max(Number(req.query.limit) || 14, 1), 100);
            const rows: WaveJsonl_Row[] = await readWavesFromJsonl(limit);

            res.send({ rows });
          },
        ],
      }),
    ];
  }
}
