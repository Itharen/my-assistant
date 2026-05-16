// Errors data-service — extends `FDPNTS_Errors_DataService` for unified error
// persistence + logging. Uses the generic `FDP_Errors<DyFM_Error>` data model
// from `@futdevpro/fdp-templates`.
//
// Pattern source: `LIVE-projects/master-prompter/server/src/_routes/server/errors/errors.data-service.ts`.
//
// FR #3b Phase 4b (cycle 46): `handleInternalError` override → DB persist +
// action-log emit (mirror-write a Dev Agent `02-audit` számára, lásd
// `__agent/WORKFLOW_DEV.md` alapelv #21).

import { FDP_Errors, FDP_errors_dataParams } from '@futdevpro/fdp-templates';
import { DyFM_AnyError, DyFM_Error } from '@futdevpro/fsm-dynamo';
import { FDPNTS_Errors_DataService } from '@futdevpro/nts-fdp-templates';

import { emitServerActionLog } from '../../_collections/action-log.util';

/** Errors DAO. FDPNTS_Errors_DataService-t terjeszti, unified error perzisztencia + action-log mirror. */
export class Errors_DataService extends FDPNTS_Errors_DataService<
  DyFM_Error,
  FDP_Errors<DyFM_Error>
> {

  /** Inicializál egy Errors_DataService-t — opcionális FDP_Errors data + kötelező issuer-rel. */
  constructor(set: { data?: FDP_Errors<DyFM_Error>; issuer: string }) {
    super(set, FDP_errors_dataParams, set.issuer);
  }

  /**
   * Override: DB persist + action-log emit. Az action-log emit fire-and-forget,
   * no-throw — nem blokkolja a DB-perzisztálást, sem a hívó error-handler-t.
   * FR #3b Phase 4b (cycle 46).
   */
  override async handleInternalError(
    error: DyFM_AnyError | unknown,
    issuer: string,
    alwaysRecord?: boolean,
  ): Promise<void> {
    // DB persist (FDPNTS pattern változatlan).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await super.handleInternalError(error as any, issuer, alwaysRecord);

    // Action-log mirror — Dev Agent `02-audit` látja (per WORKFLOW_DEV #21).
    // DyFM_Error API: minden mező-kinyerő STATIC (per error-handling.md "Pattern source" szakasz).
    const message: string = DyFM_Error.getErrorMessage(error) ?? String(error);
    const errorCode: string = DyFM_Error.getErrorCode(error) ?? 'CLIENT-OR-INTERNAL';
    const stack: string | undefined = DyFM_Error.getErrorStack(error) ?? (error instanceof Error ? error.stack : undefined);

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[${errorCode}] ${message.slice(0, 200)}`,
      extra: { errorCode, issuer, stack },
    });
  }
}
