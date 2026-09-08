import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { readActionLogFailureStats } from '../../_collections/action-log.util.js';

const BOOT_TIME_MS: number = Date.now();
// A valasz bovult a `pid`-del (2026-09-08), majd az elveszett action-log irasok merlegevel
// (2026-09-09) => a schema-verzio no.
const HEALTH_SCHEMA_VERSION: number = 3;

interface HealthResponse {
  status: 'ok';
  schemaVersion: number;
  uptimeSeconds: number;
  /**
   * A KISZOLGALO FOLYAMAT azonositoja.
   *
   * MERT HIANY (2026-09-08 10:12): az LDP detached aga a spawn-olt PID-et a health-valaszban
   * levo `pid`-hez hasonlitja (`DyCLI_LDP_HealthCheck_Util.waitForExpectedPid`). Enelkul a
   * keszenlet-ellenorzes CSAK annyit tud, hogy a FOLYAMAT el — azt nem, hogy az ALKALMAZAS
   * elindult-e.
   *
   * Es pontosan ez tortent: a wrapper `server ready`-t irt, mikozben a naploban
   * `Application start failed` allt. A hamis „ready" 22 percig fedte el, hogy a szerver halott.
   */
  pid: number;
  /**
   * Hany action-log bejegyzes veszett el ugy, hogy MEG JELEZNI SEM tudtuk.
   *
   * A `> 0` azt jelenti, hogy a naplo HIANYOS. Ezt azert adjuk ki itt, mert az `action-log`
   * vegso hiba-aga definicio szerint nem tud naplozni (nincs mukodo kimenete) — a szamlalo
   * viszont a memoriaban el, tehat lekerdezheto. A hiany igy nem marad lathatatlan.
   */
  actionLogDroppedCount: number;
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
            pid: process.pid,
            actionLogDroppedCount: readActionLogFailureStats().count,
          };
          res.send(response);
        } ],
      }),
    ];
  }
}
