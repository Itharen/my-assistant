// Errors controller — thin endpoint layer for client-side error persistence
// and listing. The client `A_Error_ControlService` POSTs every captured error
// (HTTP, uncaught, manually shown) to `/api/errors/error/log`; this writes
// the row to the `fdp_errors` Mongo collection via `Errors_DataService`.
//
// REQ-SYS-CONTROLLER-THIN: tasks delegate to the DataService. No business
// logic in the controller. Pattern source: REQ-SYS spec.

import { Request, Response } from 'express';

import { DyFM_Error, DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';
import { FDP_Errors } from '@futdevpro/fdp-templates';

import { Auth_ControlService } from '../../_services/core-services/auth.control-service';
import { Errors_DataService } from './errors.data-service';

/** Errors HTTP controller. Kliens-oldali error persistence + listázás endpoint-jai. */
export class Errors_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): Errors_Controller {
    return Errors_Controller.getSingletonInstance();
  }

  private readonly authService: Auth_ControlService = Auth_ControlService.getInstance();

  /** Regisztrálja a `/error/log` és `/error/list` endpoint-okat. */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'logError',
        type: DyFM_HttpCallType.post,
        endpoint: '/error/log',
        preProcesses: [ this.authService.authenticate_tokenSelf ],
        tasks: [
          async (req: Request, _res: Response, issuer: string): Promise<void> => {
            const body: Record<string, unknown> = (req.body ?? {}) as Record<string, unknown>;
            const wrapped: DyFM_Error = new DyFM_Error({
              message: typeof body.message === 'string' ? body.message : 'Client-reported error',
              errorCode: typeof body.errorCode === 'string' ? body.errorCode : 'CLIENT-UNKNOWN',
              stack: typeof body.stack === 'string' ? body.stack : undefined,
              additionalContent: body.additionalContent ?? body,
              issuerService: typeof body.source === 'string' ? body.source : 'client',
              error: new Error(typeof body.message === 'string' ? body.message : 'client'),
            });
            const errors_DS: Errors_DataService = new Errors_DataService({ issuer });

            await errors_DS.handleInternalError(wrapped, issuer, true);
            _res.send({ ok: true });
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'listErrors',
        type: DyFM_HttpCallType.get,
        endpoint: '/error/list',
        preProcesses: [ this.authService.authenticate_tokenSelf ],
        tasks: [
          async (req: Request, res: Response, issuer: string): Promise<void> => {
            const errors_DS: Errors_DataService = new Errors_DataService({ issuer });
            const items: FDP_Errors<DyFM_Error>[] = await errors_DS.getAll(true);
            const limit: number = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);

            res.send(items.slice(-limit).reverse());
          },
        ],
      }),
    ];
  }
}
