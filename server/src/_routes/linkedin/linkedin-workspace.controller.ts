import { Request, Response } from 'express';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNTS_Controller, DyNTS_Endpoint_Params } from '@futdevpro/nts-dynamo';

import {
  type LinkedInWorkspaceDraftCreateRequest,
  type LinkedInWorkspaceDraftStatus,
  type LinkedInWorkspaceDraftStatusRequest,
  type LinkedInWorkspaceFilter,
} from '../../_models/interfaces/integrations/linkedin.interface';
import { LinkedInWorkspace_DataService } from './linkedin-workspace.data-service';
import { LinkedInWorkspace_LoopbackGuard } from './linkedin-workspace-loopback.guard';

/** Open loopback endpoints for the owner-operated LinkedIn review surface. */
export class LinkedInWorkspace_Controller extends DyNTS_Controller {
  static getInstance(): LinkedInWorkspace_Controller {
    return LinkedInWorkspace_Controller.getSingletonInstance();
  }

  private readonly dataService: LinkedInWorkspace_DataService = new LinkedInWorkspace_DataService();

  setupEndpoints(): void {
    this.endpoints = [
      new DyNTS_Endpoint_Params({
        name: 'listLinkedInWorkspaceInbox',
        type: DyFM_HttpCallType.get,
        endpoint: '/inbox',
        preProcesses: [],
        tasks: [async (req: Request, res: Response): Promise<void> => {
          if (!LinkedInWorkspace_LoopbackGuard.allow(req, res)) {
            return;
          }
          const filter: LinkedInWorkspaceFilter = requireFilter(req.query.filter);
          const offset: number = requireInteger(req.query.offset, 'offset', 0, 100_000, 0);
          const limit: number = requireInteger(req.query.limit, 'limit', 1, 100, 20);
          const sinceDays: number = requireInteger(req.query.sinceDays, 'sinceDays', 1, 3650, 90);
          res.send(await this.dataService.listInbox({ filter, offset, limit, sinceDays }));
        }],
      }),
      new DyNTS_Endpoint_Params({
        name: 'getLinkedInWorkspaceThread',
        type: DyFM_HttpCallType.get,
        endpoint: '/thread',
        preProcesses: [],
        tasks: [async (req: Request, res: Response): Promise<void> => {
          if (!LinkedInWorkspace_LoopbackGuard.allow(req, res)) {
            return;
          }
          res.send(await this.dataService.getThread(requireString(req.query.threadId, 'threadId')));
        }],
      }),
      new DyNTS_Endpoint_Params({
        name: 'createLinkedInWorkspaceDraft',
        type: DyFM_HttpCallType.post,
        endpoint: '/draft',
        preProcesses: [],
        tasks: [async (req: Request, res: Response): Promise<void> => {
          if (!LinkedInWorkspace_LoopbackGuard.allow(req, res)) {
            return;
          }
          const request: LinkedInWorkspaceDraftCreateRequest = {
            threadId: requireString(req.body?.threadId, 'threadId'),
            body: requireString(req.body?.body, 'body', true),
          };
          res.send(await this.dataService.createDraft(request));
        }],
      }),
      new DyNTS_Endpoint_Params({
        name: 'updateLinkedInWorkspaceDraftStatus',
        type: DyFM_HttpCallType.post,
        endpoint: '/draft/status',
        preProcesses: [],
        tasks: [async (req: Request, res: Response): Promise<void> => {
          if (!LinkedInWorkspace_LoopbackGuard.allow(req, res)) {
            return;
          }
          const request: LinkedInWorkspaceDraftStatusRequest = {
            draftId: requireString(req.body?.draftId, 'draftId'),
            status: requireDraftStatus(req.body?.status),
          };
          res.send(await this.dataService.updateDraftStatus(request));
        }],
      }),
    ];
  }
}

function requireFilter(value: unknown): LinkedInWorkspaceFilter {
  const normalized: string = value === undefined ? 'needs-reply' : requireString(value, 'filter');
  if (normalized !== 'all' && normalized !== 'unread' && normalized !== 'needs-reply') {
    throw new Error('filter must be one of: all, unread, needs-reply.');
  }
  return normalized;
}

function requireDraftStatus(value: unknown): Exclude<LinkedInWorkspaceDraftStatus, 'draft'> {
  const normalized: string = requireString(value, 'status');
  if (normalized !== 'copied' && normalized !== 'discarded' && normalized !== 'manual-send-reported') {
    throw new Error('status must be one of: copied, discarded, manual-send-reported.');
  }
  return normalized;
}

function requireInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }
  const result: number = Number(value);
  if (!Number.isInteger(result) || result < minimum || result > maximum) {
    throw new Error(`${field} must be an integer between ${minimum} and ${maximum}.`);
  }
  return result;
}

function requireString(value: unknown, field: string, allowWhitespace: boolean = false): string {
  if (typeof value !== 'string' || value.length === 0 || (!allowWhitespace && value.trim().length === 0)) {
    throw new Error(`${field} must be a non-empty string.`);
  }
  return allowWhitespace ? value : value.trim();
}
