import { NextFunction, Request, Response } from 'express';

const SIDE_PANEL_SURFACE = 'sidepanel';
const COMPANION_EXTENSION_ORIGIN = 'chrome-extension://amdkdmdajbhlhfgacbodpnlkjjfioclm';

/** Relaxes framing only for the dedicated local companion surface and only for the pinned extension origin. */
export class LinkedInWorkspace_FrameMiddleware {
  public static handle(req: Request, res: Response, next: NextFunction): void {
    if (req.path === '/linkedin' && req.query.surface === SIDE_PANEL_SURFACE) {
      res.removeHeader('X-Frame-Options');
      res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${COMPANION_EXTENSION_ORIGIN}`);
    }
    next();
  }
}
