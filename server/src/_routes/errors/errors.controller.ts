// Errors controller — FDPNTS pattern. Extends `FDPNTS_Errors_Controller` to
// get all 6 standard endpoints for free:
//
//   POST /api/errors/error/log
//   GET  /api/errors/error/mark-done/:errorId
//   GET  /api/errors/error/mark-all-done
//   GET  /api/errors/error/get-range/:range                  (FR #3b Phase 5)
//   GET  /api/errors/error/get-paged/:range/:pageSize/:pageIndex
//   GET  /api/errors/error/get-last-paged/:range/:pageSize/:pageIndex
//
// Pattern source: `LIVE-projects/master-prompter/server/src/_routes/server/errors/errors.controller.ts`.
//
// FR #3b Phase 5 (cycle 47): refactor standalone DyNTS_Controller → FDPNTS_Errors_Controller.
// Bonus: a parent base endpoints unauth-ok by default — `/error/log` mostantól
// működik 401 nélkül (kliens-side error report enabled — AGB-03 task B UI-pain
// "nem rögzíti" másik fele).

import { FDP_Errors } from '@futdevpro/fdp-templates';
import { DyFM_Error } from '@futdevpro/fsm-dynamo';
import { FDPNTS_Errors_Controller } from '@futdevpro/nts-fdp-templates';

import { Errors_DataService } from './errors.data-service';

/** Errors HTTP controller. FDPNTS_Errors_Controller-t terjeszti — 6 standard endpoint a base-ből. */
export class Errors_Controller extends FDPNTS_Errors_Controller<
  DyFM_Error,
  FDP_Errors<DyFM_Error>,
  Errors_DataService
> {

  /** Singleton accessor — `FDPNTS_Errors_Controller.getSingletonInstance()` wrapper. */
  static getInstance(): Errors_Controller {
    return Errors_Controller.getSingletonInstance();
  }

  /** A base class-nak megadja, hogy hogyan instanciálja az error-DataService-t (per-request). */
  override getError_ControlService(
    set: { data?: DyFM_Error; issuer: string },
  ): Errors_DataService {
    return new Errors_DataService(set);
  }
}
