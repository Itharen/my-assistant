// Insight data-service — extends `DyNTS_DataService<Insight>`. Adds open-list
// query + dismiss helper on top of the inherited CRUD.

import { DyFM_DBFilter, DyFM_Error } from '@futdevpro/fsm-dynamo';
import { DyNTS_DataService } from '@futdevpro/nts-dynamo';

import { Insight, insight_dataParams } from '../../_models/data-models/insight.data-model';

/** Insight DAO. Open-list query + dismiss helper az örökölt CRUD felett. */
export class Insight_DataService extends DyNTS_DataService<Insight> {

  /** Inicializál egy Insight_DataService-t — opcionális Insight data + kötelező issuer-rel. */
  constructor(set: { data?: Insight; issuer: string }) {
    super(new Insight(set?.data), insight_dataParams, set.issuer);
  }

  /** Visszaadja az undismissed Insight row-kat (default limit 15). */
  async listOpen(limit: number = 15): Promise<Insight[]> {
    try {
      const filterBy: DyFM_DBFilter<Insight> = { dismissedAt: { $exists: false } };
      const items: Insight[] = await this.findDataList(filterBy, true);

      return items.slice(0, limit);
    } catch (error: unknown) {
      throw new DyFM_Error({
        ...this.getDefaultErrorSettings('listOpen', error),
        errorCode: 'MA-INS-LIST1',
      });
    }
  }

  /** Visszaadja az összes (vagy csak az undismissed) Insight row-t a `limit`-ig. */
  async listAll(includeDismissed: boolean, limit: number = 25): Promise<Insight[]> {
    try {
      if (includeDismissed) {
        const items: Insight[] = await this.getAll(true);

        return items.slice(0, limit);
      }

      return await this.listOpen(limit);
    } catch (error: unknown) {
      throw new DyFM_Error({
        ...this.getDefaultErrorSettings('listAll', error),
        errorCode: 'MA-INS-LIST2',
      });
    }
  }

  /** `dismissedAt`-et beállítja az adott id-jű Insight-ra, és menti. */
  async dismissById(id: string): Promise<Insight> {
    try {
      const row: Insight | null = await this.getDataById(id);

      if (!row) {
        throw new DyFM_Error({
          ...this.getDefaultErrorSettings('dismissById', new Error(`no insight with id=${id}`)),
          errorCode: 'MA-INS-DSM1',
        });
      }
      row.dismissedAt = new Date();

      return await this.saveData(row);
    } catch (error: unknown) {
      // ⚠️ A „nincs ilyen" agat (`MA-INS-DSM1`) is ez a keret veszi at — a `DyFM_Error`
      // lanc megorzi, tehat az eredeti ok nem vesz el, csak egy szinttel beljebb kerul.
      throw new DyFM_Error({
        ...this.getDefaultErrorSettings('dismissById', error),
        errorCode: 'MA-INS-DSM2',
      });
    }
  }
}
