import { Request, Response } from 'express';

/** Network boundary for the owner-only LinkedIn workspace endpoints. */
export class LinkedInWorkspace_LoopbackGuard {
  static allow(req: Request, res: Response): boolean {
    const remoteAddress: string | undefined = req.socket.remoteAddress;
    if (LinkedInWorkspace_LoopbackGuard.isLoopbackAddress(remoteAddress)) {
      return true;
    }

    res.status(403).send({
      ok: false,
      error: {
        code: 'MA-LINKEDIN-WORKSPACE-LOOPBACK-ONLY',
        message: 'The LinkedIn workspace API is available only from this computer.',
      },
    });

    return false;
  }

  static isLoopbackAddress(value: string | undefined): boolean {
    return value === '127.0.0.1' || value === '::1' || value === '::ffff:127.0.0.1';
  }
}
