// Auth service — extends FDPNTS_Auth_ServiceBase from `@futdevpro/nts-fdp-templates`.
// Inherits JWT/token validation, account ID extraction, and `authenticate_tokenSelf`
// middleware used by controllers' `preProcesses`.
//
// Pattern source: `LIVE-projects/master-prompter/server/src/_services/core-services/.auth-service.ts`.

import { FDPNTS_Auth_ServiceBase } from '@futdevpro/nts-fdp-templates';

/** Auth control service. FDPNTS_Auth_ServiceBase-t terjeszti, JWT/token validation singleton-ként. */
export class Auth_ControlService extends FDPNTS_Auth_ServiceBase {

  /** Singleton accessor — `FDPNTS_Auth_ServiceBase.getSingletonInstance()` wrapper. */
  static getInstance(): Auth_ControlService {
    return Auth_ControlService.getSingletonInstance();
  }
}
