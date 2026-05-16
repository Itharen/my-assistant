// Wave controller — thin endpoint layer per REQ-SYS-CONTROLLER-THIN.
// All business logic lives in `Wave_DataService`. Each endpoint constructs the
// DS with the issuer from the auth middleware, optionally hydrates from
// `req.body`, and delegates.
//
// Pattern source: `LIVE-projects/master-prompter/server/src/_routes/flow/flow/flow.controller.ts`.

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { Auth_ControlService } from '../../_services/core-services/auth.control-service';
import { Wave_Kind } from '../../_models/data-models/wave.data-model';
import { Wave_DataService } from './wave.data-service';
import { VersionBroadcast_SocketServerService } from '../../_services/socket-services/version-broadcast.socket-server-service';

/** Wave HTTP controller. Vékony endpoint réteg — list + add Wave time-series row-okhoz. */
export class Wave_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): Wave_Controller {
    return Wave_Controller.getSingletonInstance();
  }

  private readonly authService: Auth_ControlService = Auth_ControlService.getInstance();

  /** Regisztrálja a `/list` és `/add` endpoint-okat. */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'listWaves',
        type: DyFM_HttpCallType.get,
        endpoint: '/list',
        preProcesses: [ this.authService.authenticate_tokenSelf ],
        tasks: [
          async (req: Request, res: Response, issuer: string): Promise<void> => {
            const wave_DS = new Wave_DataService({ issuer });
            const rangeHours = Math.min(Math.max(Number(req.query.rangeHours) || 24, 1), 168);
            const kind: Wave_Kind | undefined =
              typeof req.query.kind === 'string' ? (req.query.kind as Wave_Kind) : undefined;

            res.send(await wave_DS.listRecent(rangeHours, kind));
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'addWave',
        type: DyFM_HttpCallType.post,
        endpoint: '/add',
        preProcesses: [ this.authService.authenticate_tokenSelf ],
        tasks: [
          async (req: Request, res: Response, issuer: string): Promise<void> => {
            const wave_DS = new Wave_DataService({
              data: req.body,
              issuer,
            });

            await wave_DS.validateForSave();
            await wave_DS.saveData();

            // FR #3f Phase 5.B-extra (cycle 81): socket push-event a kliensnek.
            // (A wave-jsonl /log-public path-en már megvan Phase 5.B-ben; ez a
            // direkt auth-gated /api/wave/add path.)
            await VersionBroadcast_SocketServerService.getInstance().broadcastDomainEvent('wave', 'create', wave_DS.data);

            res.send(wave_DS.data);
          },
        ],
      }),
    ];
  }
}
