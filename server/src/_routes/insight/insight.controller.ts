// Insight controller — thin endpoint layer per REQ-SYS-CONTROLLER-THIN.
// All business logic lives in `Insight_DataService`.

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { Auth_ControlService } from '../../_services/core-services/auth.control-service';
import { Insight_DataService } from './insight.data-service';
import { VersionBroadcast_SocketServerService } from '../../_services/socket-services/version-broadcast.socket-server-service';

/** Insight HTTP controller. Vékony endpoint réteg — list / add / dismiss endpointokkal. */
export class Insight_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): Insight_Controller {
    return Insight_Controller.getSingletonInstance();
  }

  private readonly authService: Auth_ControlService = Auth_ControlService.getInstance();

  /** Regisztrálja a `/list`, `/add` és `/dismiss/:id` endpoint-okat. */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'listInsights',
        type: DyFM_HttpCallType.get,
        endpoint: '/list',
        preProcesses: [ this.authService.authenticate_tokenSelf ],
        tasks: [
          async (req: Request, res: Response, issuer: string): Promise<void> => {
            const insight_DS = new Insight_DataService({ issuer });
            const includeDismissed: boolean =
              req.query.includeDismissed === 'true' || req.query.includeDismissed === '1';
            const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 200);

            res.send(await insight_DS.listAll(includeDismissed, limit));
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'addInsight',
        type: DyFM_HttpCallType.post,
        endpoint: '/add',
        preProcesses: [ this.authService.authenticate_tokenSelf ],
        tasks: [
          async (req: Request, res: Response, issuer: string): Promise<void> => {
            const insight_DS = new Insight_DataService({
              data: req.body,
              issuer,
            });

            await insight_DS.validateForSave();
            await insight_DS.saveData();

            // FR #3f Phase 5.B-extra (cycle 81): socket push-event a kliensnek.
            await VersionBroadcast_SocketServerService.getInstance().broadcastDomainEvent('insight', 'create', insight_DS.data);

            res.send(insight_DS.data);
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'dismissInsight',
        type: DyFM_HttpCallType.post,
        endpoint: '/dismiss/:id',
        preProcesses: [ this.authService.authenticate_tokenSelf ],
        tasks: [
          async (req: Request, res: Response, issuer: string): Promise<void> => {
            const insight_DS = new Insight_DataService({ issuer });
            const result: unknown = await insight_DS.dismissById(req.params.id);

            // FR #3f Phase 5.B-extra: dismiss is mutation → push-event update.
            await VersionBroadcast_SocketServerService.getInstance().broadcastDomainEvent('insight', 'update', { id: req.params.id, dismissed: true });

            res.send(result);
          },
        ],
      }),
    ];
  }
}
