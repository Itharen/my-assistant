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
  LinkedInProfileUpdatePlan,
  LinkedInProfilePastedRequest,
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

  /**
   * 🔗 A profil-frissítési terv — mezőnként a mostani és a javasolt szöveg.
   *
   * ⭐ A limitek és a „kész"-fogalom a **szervertől** jönnek *(SSOT a CLI-ben)* — ⛔ a kliens
   * semmit nem éget be, mert különben a felület és a tényleges ellenőrzés elcsúszhatna.
   */
  async getProfileUpdatePlan(): Promise<LinkedInProfileUpdatePlan> {
    return this.api_AS.call<LinkedInProfileUpdatePlan>(
      new DyNX_ApiCall_Settings({
        name: 'getLinkedInProfileUpdate',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/linkedin/profile-update',
      }),
    );
  }

  /**
   * ✅ „Beillesztettem" jelölés egy mezőre.
   *
   * ⭐ MIÉRT KELL: négy mezőt beilleszteni több percnyi kattintás — ha félbeszakad, tudnia
   * kell, hol tartott.
   *
   * @returns a FRISS terv, hogy a felület ⛔ ne a saját feltevéséből rajzoljon újra.
   */
  async markProfileFieldPasted(request: LinkedInProfilePastedRequest): Promise<LinkedInProfileUpdatePlan> {
    return this.api_AS.call<LinkedInProfileUpdatePlan, LinkedInProfilePastedRequest>(
      new DyNX_ApiCall_Settings({
        name: 'putLinkedInProfilePasted',
        type: DyFM_HttpCallType.put,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/linkedin/profile-update/pasted',
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
