// Google Assistant SDK HTTP controller — DyNTS_Controller pattern.
//
// Endpointok:
//   GET  /status         status panel (UI)
//   GET  /auth/start     authorize URL
//   GET  /auth/callback  Google redirectel ide
//   POST /query          test query — visszaad responseText-et

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { Google_DataService } from './google.data-service';

/** Google Assistant SDK HTTP controller. */
export class Google_Controller extends DyNTS_Controller {

  /** Singleton accessor. */
  static getInstance(): Google_Controller {
    return Google_Controller.getSingletonInstance();
  }

  private readonly dataService: Google_DataService = new Google_DataService();

  /** Status + OAuth + query endpointok. */
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
              res.status(400).send({ ok: false, error: `google oauth error: ${err}` });
              return;
            }
            if (typeof code !== 'string' || typeof state !== 'string') {
              res.status(400).send({ ok: false, error: 'missing code/state' });
              return;
            }
            const serverPort = Number(process.env.MA_SERVER_PORT ?? 39245);
            const result = await this.dataService.completeAuth({ code, state, serverPort });
            // Browser-friendly válasz — onMessage close-olja az opener-t a kliensből
            res.set('Content-Type', 'text/html; charset=utf-8').send(
              `<html><body><h2>${'ok' in result && result.ok ? '✅ OAuth complete' : '❌ Failed'}</h2>`
              + `<pre>${JSON.stringify(result, null, 2)}</pre>`
              + `<p>Visszamehetsz a my-assistant frontend-re.</p></body></html>`,
            );
          },
        ],
      }),

      new DyNTS_Endpoint_Params({
        name: 'sendQuery',
        type: DyFM_HttpCallType.post,
        endpoint: '/query',
        preProcesses: [],
        tasks: [
          async (req: Request, res: Response): Promise<void> => {
            const text = req.body?.text;
            const lang = req.body?.lang;
            if (typeof text !== 'string' || text.length === 0) {
              res.status(400).send({ ok: false, error: 'missing or empty `text` in body' });
              return;
            }
            try {
              const result = await this.dataService.sendQuery(text, typeof lang === 'string' ? lang : undefined);
              res.send({ ok: true, result });
            } catch (err) {
              res.status(500).send({ ok: false, error: (err as Error).message });
            }
          },
        ],
      }),
    ];
  }
}
