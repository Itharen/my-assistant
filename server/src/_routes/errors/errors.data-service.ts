// Errors data-service — extends `FDPNTS_Errors_DataService` for unified error
// persistence + logging. Uses the generic `FDP_Errors<DyFM_Error>` data model
// from `@futdevpro/fdp-templates`.
//
// Pattern source: `LIVE-projects/master-prompter/server/src/_routes/server/errors/errors.data-service.ts`.

import { FDP_Errors, FDP_errors_dataParams } from '@futdevpro/fdp-templates';
import { DyFM_Error } from '@futdevpro/fsm-dynamo';
import { FDPNTS_Errors_DataService } from '@futdevpro/nts-fdp-templates';

/** Errors DAO. FDPNTS_Errors_DataService-t terjeszti, unified error perzisztencia + logolás. */
export class Errors_DataService extends FDPNTS_Errors_DataService<
  DyFM_Error,
  FDP_Errors<DyFM_Error>
> {

  /** Inicializál egy Errors_DataService-t — opcionális FDP_Errors data + kötelező issuer-rel. */
  constructor(set: { data?: FDP_Errors<DyFM_Error>; issuer: string }) {
    super(set, FDP_errors_dataParams, set.issuer);
  }
}
