import { NextFunction, Request, Response } from 'express';

import { LinkedInWorkspace_FrameMiddleware } from './linkedin-workspace-frame.middleware.js';

describe('LinkedIn workspace frame middleware', (): void => {
  it('permits only the pinned companion extension on the explicit side-panel surface', (): void => {
    const removed: string[] = [];
    const headers: Record<string, string> = {};
    const response: Pick<Response, 'removeHeader' | 'setHeader'> = {
      removeHeader: (name: string): Response => {
        removed.push(name);
        return response as Response;
      },
      setHeader: (name: string, value: string | number | readonly string[]): Response => {
        headers[name] = String(value);
        return response as Response;
      },
    };
    let didContinue: boolean = false;
    LinkedInWorkspace_FrameMiddleware.handle(
      { path: '/linkedin', query: { surface: 'sidepanel' } } as unknown as Request,
      response as Response,
      (() => { didContinue = true; }) as NextFunction,
    );
    expect(removed).toEqual(['X-Frame-Options']);
    expect(headers['Content-Security-Policy'])
      .toBe("frame-ancestors 'self' chrome-extension://amdkdmdajbhlhfgacbodpnlkjjfioclm");
    expect(didContinue).toBeTrue();
  });

  it('keeps the default frame protection on ordinary application routes', (): void => {
    let didRemove: boolean = false;
    const response: Pick<Response, 'removeHeader' | 'setHeader'> = {
      removeHeader: (): Response => {
        didRemove = true;
        return response as Response;
      },
      setHeader: (): Response => response as Response,
    };
    LinkedInWorkspace_FrameMiddleware.handle(
      { path: '/linkedin', query: {} } as unknown as Request,
      response as Response,
      (() => undefined) as NextFunction,
    );
    expect(didRemove).toBeFalse();
  });
});
