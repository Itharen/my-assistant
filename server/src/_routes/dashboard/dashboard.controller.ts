// Dashboard controller — read-only aggregator that powers the 4 panels in
// one round-trip (tasks + waves + insights + recent captures). Client polls
// this endpoint; mutations go to /wave, /insight, /capture.

import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import { Auth_ControlService } from '../../_services/core-services/auth.control-service';
import { readOrganizerTasks } from '../../_collections/fo-tasks.util';

import { Wave, Wave_Kind } from '../../_models/data-models/wave.data-model';
import { Insight } from '../../_models/data-models/insight.data-model';
import { Capture } from '../../_models/data-models/capture.data-model';
import { Wave_DataService } from '../wave/wave.data-service';
import { Insight_DataService } from '../insight/insight.data-service';
import { Capture_DataService } from '../capture/capture.data-service';

/** Dashboard HTTP controller. Egy round-trip aggregátor — tasks + waves + insights + recent captures. */
export class Dashboard_Controller extends DyNTS_Controller {

  /** Singleton accessor — `DyNTS_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): Dashboard_Controller {
    return Dashboard_Controller.getSingletonInstance();
  }

  private readonly authService: Auth_ControlService = Auth_ControlService.getInstance();

  /** Regisztrálja a `/snapshot` endpoint-ot az aggregált dashboard payload-hoz. */
  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'getSnapshot',
        type: DyFM_HttpCallType.get,
        endpoint: '/snapshot',
        preProcesses: [ this.authService.authenticate_tokenSelf ],
        tasks: [
          async (req: Request, res: Response, issuer: string): Promise<void> => {
            const rangeHours: number = Math.min(Math.max(Number(req.query.rangeHours) || 24, 1), 168);

            const wave_DS: Wave_DataService = new Wave_DataService({ issuer });
            const insight_DS: Insight_DataService = new Insight_DataService({ issuer });
            const capture_DS: Capture_DataService = new Capture_DataService({ issuer });

            const [ waveRows, insights, captures ]: [ Wave[], Insight[], Capture[] ] = await Promise.all([
              wave_DS.listRecent(rangeHours),
              insight_DS.listOpen(15),
              capture_DS.listRecent(10),
            ]);

            const series: Record<Wave_Kind, Wave[]> = { astral: [], mental: [], matter: [] };
            const latest: Partial<Record<Wave_Kind, Wave>> = {};

            for (const w of waveRows) {
              series[w.kind].push(w);
              latest[w.kind] = w;
            }

            const tasks: ReturnType<typeof readOrganizerTasks> = readOrganizerTasks(12);

            res.send({
              serverTime: new Date().toISOString(),
              tasks,
              waves: { rangeHours, series, latest },
              insights: { count: insights.length, items: insights },
              recentCaptures: { count: captures.length, items: captures },
            });
          },
        ],
      }),
    ];
  }
}
