// Capture controller — thin endpoint layer per REQ-SYS-CONTROLLER-THIN.
// Business logic (including energy → wave fanout) lives in `Capture_DataService`.

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { Auth_ControlService } from '../../_services/core-services/auth.control-service';
import { Capture_DataService } from './capture.data-service';

/** Capture HTTP controller. Vékony endpoint réteg a Capture_DataService felett — list + add. */
export class Capture_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): Capture_Controller {
    return Capture_Controller.getSingletonInstance();
  }

  private readonly authService: Auth_ControlService = Auth_ControlService.getInstance();

  /** Regisztrálja a `/list` és `/add` endpoint-okat, mindkettőt auth pre-process-szel. */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'listCaptures',
        type: DyFM_HttpCallType.get,
        endpoint: '/list',
        preProcesses: [ this.authService.authenticate_tokenSelf ],
        tasks: [
          async (req: Request, res: Response, issuer: string): Promise<void> => {
            const capture_DS = new Capture_DataService({ issuer });
            const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 200);

            res.send(await capture_DS.listRecent(limit));
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'addCapture',
        type: DyFM_HttpCallType.post,
        endpoint: '/add',
        preProcesses: [ this.authService.authenticate_tokenSelf ],
        tasks: [
          async (req: Request, res: Response, issuer: string): Promise<void> => {
            const capture_DS = new Capture_DataService({
              data: req.body,
              issuer,
            });

            res.send(await capture_DS.saveWithFanout());
          },
        ],
      }),
    ];
  }
}
