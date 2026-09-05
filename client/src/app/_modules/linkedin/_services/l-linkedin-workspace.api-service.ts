import { inject, Injectable } from '@angular/core';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNX_ApiCall_Settings, DyNX_ApiService } from '@futdevpro/ngx-dynamo';

import { API_CONFIG } from '../../../_collections/api-config.const';
import { A_StorageKey } from '../../../_enums/a-storage-key.enum';
import type {
  LinkedInWorkspaceDraftCreateRequest,
  LinkedInWorkspaceDraftReceipt,
  LinkedInWorkspaceDraftStatusRequest,
  LinkedInWorkspaceFilter,
  LinkedInWorkspaceInboxResponse,
  LinkedInWorkspaceThreadResponse,
} from '@server-models';

@Injectable({ providedIn: 'root' })
/** Typed loopback client for the local LinkedIn workspace API. */
export class L_LinkedInWorkspace_ApiService {
  private readonly api_AS: DyNX_ApiService = inject(DyNX_ApiService);

  async getInbox(set: {
    filter: LinkedInWorkspaceFilter;
    offset: number;
    limit: number;
    sinceDays: number;
  }): Promise<LinkedInWorkspaceInboxResponse> {
    return this.api_AS.call<LinkedInWorkspaceInboxResponse>(
      new DyNX_ApiCall_Settings({
        name: 'getLinkedInWorkspaceInbox',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/linkedin/inbox',
      }),
      { queryParams: set },
    );
  }

  async getThread(threadId: string): Promise<LinkedInWorkspaceThreadResponse> {
    return this.api_AS.call<LinkedInWorkspaceThreadResponse>(
      new DyNX_ApiCall_Settings({
        name: 'getLinkedInWorkspaceThread',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/linkedin/thread',
      }),
      { queryParams: { threadId } },
    );
  }

  async createDraft(request: LinkedInWorkspaceDraftCreateRequest): Promise<LinkedInWorkspaceDraftReceipt> {
    return this.api_AS.call<LinkedInWorkspaceDraftReceipt, LinkedInWorkspaceDraftCreateRequest>(
      new DyNX_ApiCall_Settings({
        name: 'createLinkedInWorkspaceDraft',
        type: DyFM_HttpCallType.post,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/linkedin/draft',
      }),
      { body: request },
    );
  }

  async updateDraftStatus(request: LinkedInWorkspaceDraftStatusRequest): Promise<LinkedInWorkspaceDraftReceipt> {
    return this.api_AS.call<LinkedInWorkspaceDraftReceipt, LinkedInWorkspaceDraftStatusRequest>(
      new DyNX_ApiCall_Settings({
        name: 'updateLinkedInWorkspaceDraftStatus',
        type: DyFM_HttpCallType.post,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/linkedin/draft/status',
      }),
      { body: request },
    );
  }

  private resolveBaseUrl(): string {
    const fromStorage: string | null = typeof window !== 'undefined'
      ? localStorage.getItem(A_StorageKey.serverBaseUrl)
      : null;
    return fromStorage ?? API_CONFIG.defaultBaseUrl;
  }
}
