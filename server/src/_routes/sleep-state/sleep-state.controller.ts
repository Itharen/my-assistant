// Sleep-state controller — `GET /api/sleep-state` unauth endpoint, ami a
// `SleepState_Service.getSnapshot()`-ot exposálja. Kliens / cron-job /
// külső monitor a snapshot-on át dönt: hangos notifikáció vagy néma queue.
//
// FR #5 sleep-aware notifications Phase 1 (cycle 91).

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { SleepState_Service } from '../../_services/sleep-state.service';

/** Sleep-state HTTP controller. Unauth GET az aktuális sleep-window snapshot-hoz. */
export class SleepState_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): SleepState_Controller {
    return SleepState_Controller.getSingletonInstance();
  }

  /** Regisztrálja a `GET /` (rooted under `/api/sleep-state`) endpoint-ot. */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'getSleepState',
        type: DyFM_HttpCallType.get,
        endpoint: '/',
        // NO preProcesses → unauth (public state-info, status-page friendly).
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const snapshot = SleepState_Service.getInstance().getSnapshot();

            res.send(snapshot);
          },
        ],
      }),
    ];
  }
}
