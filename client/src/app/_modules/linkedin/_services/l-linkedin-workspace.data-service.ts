import { inject, Injectable } from '@angular/core';

import type {
  LinkedInWorkspaceDraftCreateRequest,
  LinkedInWorkspaceDraftReceipt,
  LinkedInWorkspaceDraftStatusRequest,
  LinkedInWorkspaceFilter,
  LinkedInWorkspaceInboxResponse,
  LinkedInWorkspaceThreadResponse,
} from '@server-models';

import { L_LinkedInWorkspace_ApiService } from './l-linkedin-workspace.api-service';

/** Single client-side access layer for the LinkedIn workspace read and draft lifecycle. */
@Injectable({ providedIn: 'root' })
export class L_LinkedInWorkspace_DataService {
  private readonly api_AS: L_LinkedInWorkspace_ApiService = inject(L_LinkedInWorkspace_ApiService);

  getInbox(set: {
    filter: LinkedInWorkspaceFilter;
    offset: number;
    limit: number;
    sinceDays: number;
  }): Promise<LinkedInWorkspaceInboxResponse> {
    return this.api_AS.getInbox(set);
  }

  getThread(threadId: string): Promise<LinkedInWorkspaceThreadResponse> {
    return this.api_AS.getThread(threadId);
  }

  createDraft(request: LinkedInWorkspaceDraftCreateRequest): Promise<LinkedInWorkspaceDraftReceipt> {
    return this.api_AS.createDraft(request);
  }

  updateDraftStatus(request: LinkedInWorkspaceDraftStatusRequest): Promise<LinkedInWorkspaceDraftReceipt> {
    return this.api_AS.updateDraftStatus(request);
  }
}
