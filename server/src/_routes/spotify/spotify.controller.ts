// Spotify integration HTTP controller — DyNTS_Controller pattern.
//
// Endpointok:
//   GET  /status         status panel forrása a frontend-en (open)
//   GET  /auth/start     visszaad egy authorize URL-t a frontend-nek (open — auth nincs még)
//   GET  /auth/callback  Spotify redirectel ide kód-dal (open — state védi)
//   (POST /resume — V2: a notify orchestrator fogja meghívni; egyelőre nincs)

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { Spotify_DataService } from './spotify.data-service';

/** Spotify HTTP controller. Status + OAuth-flow endpoints. */
export class Spotify_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): Spotify_Controller {
    return Spotify_Controller.getSingletonInstance();
  }

  private readonly dataService: Spotify_DataService = new Spotify_DataService();

  /** Regisztrálja a Spotify endpoint-okat (mind open security — auth majd később). */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'getStatus',
        type: DyFM_HttpCallType.get,
        endpoint: '/status',
        preProcesses: [],
        tasks: [
          async (_req: Request, res: Response): Promise<void> => {
            res.send(await this.dataService.getStatus());
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'startAuth',
        type: DyFM_HttpCallType.get,
        endpoint: '/auth/start',
        preProcesses: [],
        tasks: [
          async (_req: Request, res: Response): Promise<void> => {
            const serverPort = Number(process.env.MA_SERVER_PORT ?? 39245);
            res.send(await this.dataService.startAuth(serverPort));
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'authCallback',
        type: DyFM_HttpCallType.get,
        endpoint: '/auth/callback',
        preProcesses: [],
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const code = req.query.code;
            const state = req.query.state;
            const err = req.query.error;
            if (typeof err === 'string' && err.length > 0) {
              res.status(400).send({ ok: false, error: `spotify oauth error: ${err}` });
              return;
            }
            if (typeof code !== 'string' || typeof state !== 'string') {
              res.status(400).send({ ok: false, error: 'missing code/state' });
              return;
            }
            const serverPort = Number(process.env.MA_SERVER_PORT ?? 39245);
            const result = await this.dataService.completeAuth({ code, state, serverPort });
            res.set('Content-Type', 'text/html; charset=utf-8').send(
              `<html><body><h2>${'ok' in result && result.ok ? '✅ Spotify OAuth complete' : '❌ Failed'}</h2>`
              + `<pre>${JSON.stringify(result, null, 2)}</pre>`
              + `<p>Visszamehetsz a my-assistant frontend-re.</p></body></html>`,
            );
          },
        ],
      }),
    ];
  }
}
