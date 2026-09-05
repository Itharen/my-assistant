import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

const BOOT_TIME_MS: number = Date.now();
const HEALTH_SCHEMA_VERSION: number = 1;

interface HealthResponse {
  status: 'ok';
  schemaVersion: number;
  uptimeSeconds: number;
}

/** Minimal liveness proof used by the client and the deterministic workspace launcher. */
export class Health_Controller extends DyNTS_Controller {
  static getInstance(): Health_Controller {
    return Health_Controller.getSingletonInstance();
  }

  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'getHealthz',
        type: DyFM_HttpCallType.get,
        endpoint: '/healthz',
        preProcesses: [],
        tasks: [ async (_req: Request, res: Response): Promise<void> => {
          const response: HealthResponse = {
            status: 'ok',
            schemaVersion: HEALTH_SCHEMA_VERSION,
            uptimeSeconds: Math.max(0, Math.floor((Date.now() - BOOT_TIME_MS) / 1000)),
          };
          res.send(response);
        } ],
      }),
    ];
  }
}
