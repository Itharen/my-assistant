// App bootstrap — extends `DyNTS_AppExtended` (`@futdevpro/nts-dynamo/socket`).
// DyNTS handles Mongo connect, route mounting, /api base prefix, static client
// serving (Angular dist), auth middleware wiring, error handler, socket server.
//
// Pattern source: `LIVE-projects/master-prompter/server/src/app.server.ts`.

import { Request, Response } from 'express';
import * as path from 'path';

import { DyFM_AnyError, DyFM_Log } from '@futdevpro/fsm-dynamo';
import {
  DyNTS_App_Params,
  DyNTS_global_settings,
  DyNTS_GlobalErrorHandlerFn,
  DyNTS_GlobalService_Settings,
  DyNTS_Http_Settings,
  DyNTS_RoutingModule,
  DyNTS_StaticClient_Settings
} from '@futdevpro/nts-dynamo';
import { DyNTS_AppExtended, DyNTS_SocketServerService } from '@futdevpro/nts-dynamo/socket';

import {
  FDP_errors_dataParams,
  FDP_feedback_dataParams,
  FDP_feedbackVote_dataParams
} from '@futdevpro/fdp-templates';

import { version } from '../package.json';

import { Auth_ControlService } from './_services/core-services/auth.control-service';
import { Errors_DataService } from './_routes/errors/errors.data-service';
import { Errors_Controller } from './_routes/errors/errors.controller';
import { Feedback_Controller } from './_routes/feedback/feedback.controller';

import { wave_dataParams } from './_models/data-models/wave.data-model';
import { insight_dataParams } from './_models/data-models/insight.data-model';
import { capture_dataParams } from './_models/data-models/capture.data-model';

import { Wave_Controller } from './_routes/wave/wave.controller';
import { Insight_Controller } from './_routes/insight/insight.controller';
import { Capture_Controller } from './_routes/capture/capture.controller';
import { Dashboard_Controller } from './_routes/dashboard/dashboard.controller';

export class App extends DyNTS_AppExtended {

  authService: Auth_ControlService = Auth_ControlService.getInstance();

  getAppParams(): DyNTS_App_Params {
    DyFM_Log.testInfo(`my-assistant server starting (env: ${process.env.FDP_ENV ?? 'local'})`);

    const dbName = 'my-assistant';
    const mongoBase = process.env.MA_MONGO_URL ?? process.env.MONGO_URL ?? 'mongodb://0.0.0.0:29017';

    return new DyNTS_App_Params({
      name: 'my-assistant Server',
      title: 'my-assistant',
      version,
      dbName,
      dbUri: `${mongoBase}/${dbName}`,
      systemShortCodeName: 'MA',
    });
  }

  override overrideDynamoNTSGlobalSettings(): void {
    DyNTS_global_settings.log_settings.api_errors = true;
    DyNTS_global_settings.log_settings.setup = true;
  }

  getGlobalServiceCollection(): DyNTS_GlobalService_Settings {
    return {
      authService: this.authService,
      errorHandler: this.getGlobalErrorHandler(),
      dbModels: [
        wave_dataParams,
        insight_dataParams,
        capture_dataParams,
        FDP_errors_dataParams,
        // Global feedback system (M5a-pattern rollout)
        FDP_feedback_dataParams,
        FDP_feedbackVote_dataParams,
      ],
    };
  }

  getPortSettings(): DyNTS_Http_Settings {
    return {
      httpPort: Number(process.env.MA_SERVER_PORT ?? 39245),
    };
  }

  override getApiBasePath(): string {
    return '/api';
  }

  override getRoutingModules(): DyNTS_RoutingModule[] {
    return [
      new DyNTS_RoutingModule({
        route: '/wave',
        controllers: [ Wave_Controller.getInstance() ],
      }),
      new DyNTS_RoutingModule({
        route: '/insight',
        controllers: [ Insight_Controller.getInstance() ],
      }),
      new DyNTS_RoutingModule({
        route: '/capture',
        controllers: [ Capture_Controller.getInstance() ],
      }),
      new DyNTS_RoutingModule({
        route: '/dashboard',
        controllers: [ Dashboard_Controller.getInstance() ],
      }),
      new DyNTS_RoutingModule({
        route: '/errors',
        controllers: [ Errors_Controller.getInstance() ],
      }),
      new DyNTS_RoutingModule({
        route: '/feedback',
        controllers: [ Feedback_Controller.getInstance() ],
      }),
    ];
  }

  override getStaticClientSettings(): DyNTS_StaticClient_Settings | undefined {
    const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist', 'client', 'browser');

    return {
      root: clientDist,
      fallbackPath: 'index.html',
      assetCacheMaxAge: 60 * 60,
      fallbackCacheMaxAge: 0,
    };
  }

  // ccap-review-disable-line no-any-type — DyNTS_SocketServerService<T> requires T extends DyNTS_SocketPresence; `any` is the master-prompter convention.
  getSocketServices(): DyNTS_SocketServerService<any>[] {
    return [];
  }

  getGlobalErrorHandler(): DyNTS_GlobalErrorHandlerFn {
    return async (err: DyFM_AnyError, req?: Request, _res?: Response, issuer?: string): Promise<void> => {
      const setIssuer = issuer ?? (req?.body)?.issuer ?? 'unknown';
      const errors_DS = new Errors_DataService({ data: err, issuer: setIssuer });

      await errors_DS.handleInternalError(err, setIssuer, true);
    };
  }
}
