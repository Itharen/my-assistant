// Wave JSONL controller — UNAUTH endpoint pár a `__agent/state/3x3-log.jsonl`
// hullám-snapshot forrásból. A dashboard waves-panel-jét táplálja (read) és
// az új-snapshot form-jából fogad payload-okat (write).
//
// FR #3b-WAVE-UI Phase 2.A (cycle 52): `GET /get-from-jsonl` unauth read.
// FR #3b-WAVE-UI Phase 3.A (cycle 54): `POST /log-public` unauth write.
//
// Pattern source: `server/src/_routes/errors/errors.controller.ts` (FDPNTS-extend),
// de itt nincs DB → standalone DyNTS_Controller, unauth (nincs preProcesses).
//
// AUTH BLOCKER kontextus: a `/api/dashboard/snapshot` és `/api/wave/add`
// auth-gated; ezek az endpointok **szándékosan unauth**, hogy a wave UI a chat
// AGB-03 task B döntés nélkül is működjön (AGB-2026-05-16-02 explicit alternatíva).

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import {
  appendWaveSnapshotToJsonl,
  readWavesFromJsonl,
  type WaveJsonlAppend_Result,
  type WaveJsonlSnapshot_Payload,
  type WaveJsonl_Row,
} from '../../_collections/wave-jsonl.util';

/** Wave JSONL HTTP controller. Unauth read + write a 3x3-log.jsonl forrás-of-truth-on. */
export class WaveJsonl_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): WaveJsonl_Controller {
    return WaveJsonl_Controller.getSingletonInstance();
  }

  /** Regisztrálja a `/get-from-jsonl` (GET) és `/log-public` (POST) unauth endpoint-okat. */
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

      new DyNTS_Endpoint_Params({
        name: 'logPublic',
        type: DyFM_HttpCallType.post,
        endpoint: '/log-public',
        // NO preProcesses → unauth. A util validál + emit-eli az MA-WAVE-JSONL-* error-okat.
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const payload: WaveJsonlSnapshot_Payload = (req.body ?? {}) as WaveJsonlSnapshot_Payload;
            const result: WaveJsonlAppend_Result = await appendWaveSnapshotToJsonl(payload);

            if (!result.ok) {
              res.status(400).send({ ok: false, errorCode: result.errorCode, message: result.message });

              return;
            }

            res.send({ ok: true, ts: result.ts });
          },
        ],
      }),
    ];
  }
}
