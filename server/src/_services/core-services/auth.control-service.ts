// Auth service — extends FDPNTS_Auth_ServiceBase from `@futdevpro/nts-fdp-templates`.
// Inherits JWT/token validation, account ID extraction, and `authenticate_tokenSelf`
// middleware used by controllers' `preProcesses`.
//
// Pattern source: `LIVE-projects/master-prompter/server/src/_services/core-services/.auth-service.ts`.
//
// AGB-20 + AGB-23 (cycle 92): LOOPBACK BYPASS — ha `process.env.MA_LOCAL_DEV === 'true'`
// ÉS a request `req.ip` loopback (127.0.0.1 / ::1 / ::ffff:127.0.0.1), akkor a JWT-
// validációt **átugorja** (skip). Csak dev-on, env-flag-gel. Production-ban
// MA_LOCAL_DEV ne legyen 'true'.

import { Request, Response } from 'express';

import { FDPNTS_Auth_ServiceBase } from '@futdevpro/nts-fdp-templates';

/** IPv4/IPv6 loopback címek — express `req.ip` ezt adja a 127.0.0.1-ből. */
const LOOPBACK_IPS: ReadonlySet<string> = new Set<string>([
  '127.0.0.1', '::1', '::ffff:127.0.0.1',
]);

/** Permisszív fallback — bármi ami 127.-tel kezdődik vagy ::1-et tartalmaz. */
function isLoopbackIp(ip: string): boolean {
  if (!ip) return false;
  if (LOOPBACK_IPS.has(ip)) return true;
  if (ip.startsWith('127.')) return true;
  if (ip.endsWith('::1') || ip.includes('127.0.0.1')) return true;

  return false;
}

/** Auth control service. FDPNTS_Auth_ServiceBase-t terjeszti, JWT/token validation singleton-ként, loopback bypass-szal. */
export class Auth_ControlService extends FDPNTS_Auth_ServiceBase {

  /** Singleton accessor — `FDPNTS_Auth_ServiceBase.getSingletonInstance()` wrapper. */
  static getInstance(): Auth_ControlService {
    return Auth_ControlService.getSingletonInstance();
  }

  /**
   * Konstruktor — wrap-eli az örökölt `authenticate_tokenSelf` arrow-fn-t egy
   * loopback-bypass előfeltétel-ágával. Ha MA_LOCAL_DEV=true ÉS loopback req →
   * skip JWT (next()-szerű), egyébként az eredeti FDPNTS auth fut.
   */
  constructor() {
    super();
    const baseAuth: (req: Request, res: Response) => Promise<void> = this.authenticate_tokenSelf.bind(this);

    this.authenticate_tokenSelf = async (req: Request, res: Response): Promise<void> => {
      if (this.isLoopbackDevBypass(req)) {
        // No-op = next() (DyNTS preProcesses sequential await pattern).
        return;
      }
      await baseAuth(req, res);
    };
  }

  /** True ha `MA_LOCAL_DEV=true` env + a request loopback-ról jött (dev-only convenience). */
  private isLoopbackDevBypass(req: Request): boolean {
    if (process.env.MA_LOCAL_DEV !== 'true') {
      return false;
    }
    const ip: string = req.ip ?? req.socket?.remoteAddress ?? '';

    return isLoopbackIp(ip);
  }
}
