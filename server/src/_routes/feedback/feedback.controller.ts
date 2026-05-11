// Feedback controller — extends the FDPNTS abstract base, wires the my-assistant
// `Auth_ControlService` into the `requireAuth` and `requireManageFeedback` pre-process
// hooks. Per-system pattern: feedback records persist into the my-assistant DB
// (`fdp_feedbacks` + `fdp_feedback_votes` collections registered in `app.server.ts >
// getGlobalServiceCollection().dbModels`).
//
// Pattern source: `LIVE-projects/master-prompter/server/src/_routes/feedback/feedback.controller.ts`.

import { Request, Response } from 'express';

import { FDP_Permission } from '@futdevpro/fdp-templates/account';
import { FDPNTS_Feedback_Controller } from '@futdevpro/nts-fdp-templates';

import { Auth_ControlService } from '../../_services/core-services/auth.control-service';


export class Feedback_Controller extends FDPNTS_Feedback_Controller {

  static getInstance(): Feedback_Controller {
    return Feedback_Controller.getSingletonInstance();
  }

  protected readonly auth_CS: Auth_ControlService = Auth_ControlService.getInstance();

  protected requireAuth = async (req: Request, res: Response): Promise<void> => {
    await this.auth_CS.authenticate_token(req, res);
  };

  protected requireManageFeedback = async (req: Request, res: Response): Promise<void> => {
    await this.auth_CS.authenticate_tokenAndPermission(req, res, FDP_Permission.resolveFeedback);
  };

  protected override getAccountIdFromRequest(req: Request): string {
    return this.auth_CS.getAccountIdFromRequest(req) ?? '';
  }
}
