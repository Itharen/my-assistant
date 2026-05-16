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
import { DyNTS_Logs_Service, DyNTS_getLogsRoutingModule } from '@futdevpro/nts-dynamo/logs';

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
import { WaveJsonl_Controller } from './_routes/wave/wave-jsonl.controller';
import { WaveMarkers_Controller } from './_routes/wave/wave-markers.controller';
import { Insight_Controller } from './_routes/insight/insight.controller';
import { Capture_Controller } from './_routes/capture/capture.controller';
import { Dashboard_Controller } from './_routes/dashboard/dashboard.controller';
import { Spotify_Controller } from './_routes/spotify/spotify.controller';
import { Google_Controller } from './_routes/google/google.controller';
import { Version_Controller } from './_routes/version/version.controller';

import { VersionBroadcast_SocketServerService } from './_services/socket-services/version-broadcast.socket-server-service';

/** my-assistant App bootstrap. DyNTS_AppExtended-t terjeszti — Mongo + routes + static client + sockets. */
export class App extends DyNTS_AppExtended {

  authService: Auth_ControlService = Auth_ControlService.getInstance();

  /** App-szintű paramétereket állítja össze: dbName / dbUri / version / systemShortCode. */
  getAppParams(): DyNTS_App_Params {
    DyFM_Log.testInfo(`my-assistant server starting (env: ${process.env.FDP_ENV ?? 'local'})`);

    const dbName: string = 'my-assistant';
    const mongoBase: string = process.env.MA_MONGO_URL ?? process.env.MONGO_URL ?? 'mongodb://0.0.0.0:29017';

    return new DyNTS_App_Params({
      name: 'my-assistant Server',
      title: 'my-assistant',
      version,
      dbName,
      dbUri: `${mongoBase}/${dbName}`,
      systemShortCodeName: 'MA',
    });
  }

  /** DyNTS globális log-beállítások override-ja — api_errors + setup + logs_endpoint. */
  override overrideDynamoNTSGlobalSettings(): void {
    DyNTS_global_settings.log_settings.api_errors = true;
    DyNTS_global_settings.log_settings.setup = true;
    // FR #3b Phase 1 (cycle 48): DyNTS_Logs_Service `/api/logs/*` endpoints — server-wide log lekérdezés.
    DyNTS_global_settings.log_settings.logs_endpoint = { enabled: true };
    DyNTS_Logs_Service.getInstance().install();
  }

  /** Az auth service, error handler, és a DB model registry-t adja vissza a DyNTS bootstrap-nek. */
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

  /** HTTP port beállítások — env override-olható `MA_SERVER_PORT`-tal. */
  getPortSettings(): DyNTS_Http_Settings {
    return {
      httpPort: Number(process.env.MA_SERVER_PORT ?? 39245),
    };
  }

  /** A REST API base path-ja — minden route ez alá mount-olódik. */
  override getApiBasePath(): string {
    return '/api';
  }

  /** Regisztrált routing modulok — wave / insight / capture / dashboard / errors / feedback. */
  override getRoutingModules(): DyNTS_RoutingModule[] {
    return [
      new DyNTS_RoutingModule({
        route: '/wave',
        controllers: [
          Wave_Controller.getInstance(),
          // FR #3b-WAVE-UI Phase 2.A (cycle 52): unauth GET /api/wave/get-from-jsonl
          // a `__agent/state/3x3-log.jsonl` fallback olvasáshoz (AUTH BLOCKER bypass).
          WaveJsonl_Controller.getInstance(),
          // FR #3b-WAVE-UI Phase 5e.2 (cycle 88): unauth GET /api/wave/markers
          // — action-log szűrve event_class IN ALLOWED-set alapján.
          WaveMarkers_Controller.getInstance(),
        ],
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
      new DyNTS_RoutingModule({
        route: '/spotify',
        controllers: [ Spotify_Controller.getInstance() ],
      }),
      new DyNTS_RoutingModule({
        route: '/google',
        controllers: [ Google_Controller.getInstance() ],
      }),
      // FR #3b Phase 1 (cycle 48): /api/logs/* — server-wide log endpoints
      // (unauth, FDPNTS pattern). Lásd `DyNTS_getLogsRoutingModule` util-t.
      DyNTS_getLogsRoutingModule(),
      // FR #3f Phase 6.B (cycle 80): GET /api/version — version + bootTime + gitSha (unauth).
      new DyNTS_RoutingModule({
        route: '/version',
        controllers: [ Version_Controller.getInstance() ],
      }),
    ];
  }

  /** Static client (Angular dist) serving config — root path + SPA fallback. */
  override getStaticClientSettings(): DyNTS_StaticClient_Settings | undefined {
    // ESM-compat: __dirname nincs ESM-modulban; import.meta.dirname helyettesíti (Node 20.11+).
    const clientDist: string = path.resolve(import.meta.dirname, '..', '..', 'client', 'dist', 'client', 'browser');

    return {
      root: clientDist,
      fallbackPath: 'index.html',
      assetCacheMaxAge: 60 * 60,
      fallbackCacheMaxAge: 0,
    };
  }

  // DyNTS_SocketServerService<T> requires T extends DyNTS_SocketPresence;
  // `any` is the master-prompter convention for the socket-service tuples
  // (heterogeneous service types).
  /**
   * Regisztrált socket szolgáltatások — FR #3f Phase 2.A+2.B (cycle 58):
   * `VersionBroadcast_SocketServerService` szerver-verzió broadcast-ot ad
   * (`server:hello` per-presence + `server:version` 30s tick).
   */
  getSocketServices(): DyNTS_SocketServerService<any>[] { // eslint-disable-line @typescript-eslint/no-explicit-any
    return [
      VersionBroadcast_SocketServerService.getInstance(),
    ];
  }

  /** Globális error handler — minden unhandled error-t `Errors_DataService.handleInternalError`-ral perzisztál. */
  getGlobalErrorHandler(): DyNTS_GlobalErrorHandlerFn {
    return async (err: DyFM_AnyError, req?: Request, _res?: Response, issuer?: string): Promise<void> => {
      const setIssuer: string = issuer ?? (req?.body)?.issuer ?? 'unknown';
      const errors_DS: Errors_DataService = new Errors_DataService({ data: err, issuer: setIssuer });

      await errors_DS.handleInternalError(err, setIssuer, true);
    };
  }
}
