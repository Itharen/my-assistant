// Wave data-service — extends `DyNTS_DataService<Wave>`. Inherits `saveData`,
// `validateForSave`, `findDataList`, `getDataById`, `searchData`, etc. against
// the Mongoose model wired into `wave_dataParams`. Controller delegates here
// per REQ-SYS-CONTROLLER-THIN.
//
// Pattern source: `LIVE-projects/master-prompter/server/src/_routes/flow/flow/flow.data-service.ts`.

import { DyFM_DBFilter } from '@futdevpro/fsm-dynamo';
import { DyNTS_DataService } from '@futdevpro/nts-dynamo';

import { Wave, wave_dataParams, Wave_Kind } from '../../_models/data-models/wave.data-model';

/** Wave DAO. Recent-range listázó + örökölt CRUD a Mongoose Wave model felett. */
export class Wave_DataService extends DyNTS_DataService<Wave> {

  /** Inicializál egy Wave_DataService-t — opcionális Wave data + kötelező issuer-rel. */
  constructor(set: { data?: Wave; issuer: string }) {
    super(new Wave(set?.data), wave_dataParams, set.issuer);
  }

  /** Visszaadja a Wave row-kat az utolsó `rangeHours` órából, opcionális `kind` szűrővel. */
  async listRecent(rangeHours: number, kind?: Wave_Kind): Promise<Wave[]> {
    const since: Date = new Date(Date.now() - rangeHours * 60 * 60 * 1000);
    const filterBy: DyFM_DBFilter<Wave> = {
      __created: { $gte: since },
      ...(kind ? { kind } : {}),
    };

    return await this.findDataList(filterBy, true);
  }
}
