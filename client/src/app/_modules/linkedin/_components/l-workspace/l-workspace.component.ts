import { Component, OnInit } from '@angular/core';

import { A_ErrorExtract_Util } from '../../../../_collections/error-extract.util';
import type {
  LinkedInWorkspaceDraft,
  LinkedInWorkspaceDraftReceipt,
  LinkedInWorkspaceFilter,
  LinkedInWorkspaceInboxItem,
  LinkedInWorkspaceInboxResponse,
  LinkedInWorkspaceMessage,
  LinkedInWorkspaceThreadResponse,
} from '@server-models';

import { L_LinkedInWorkspace_DataService } from '../../_services/l-linkedin-workspace.data-service';
import {
  L_LinkedInWorkspaceBridge_Service,
  type LinkedInWorkspaceLaunchResult,
} from '../../_services/l-linkedin-workspace-bridge.service';

interface LinkedInInboxViewItem extends LinkedInWorkspaceInboxItem {
  displayName: string;
  displayDate: string;
}

interface LinkedInMessageViewItem extends LinkedInWorkspaceMessage {
  displayDate: string;
  directionLabel: string;
}

type CvCheck = 'pending' | 'attached' | 'not-required';

@Component({
  selector: 'l-workspace',
  templateUrl: './l-workspace.component.html',
  styleUrl: './l-workspace.component.scss',
  standalone: false,
})
/** Owner-operated LinkedIn review/draft surface; it never sends through LinkedIn. */
export class L_Workspace_Component implements OnInit {
  filter: LinkedInWorkspaceFilter = 'needs-reply';
  sinceDays: number = 90;
  readonly pageSize: number = 12;
  offset: number = 0;
  total: number = 0;
  nextOffset: number | null = null;
  previousOffsets: number[] = [];
  cacheUpdatedAt: string | null = null;
  inboxItems: LinkedInInboxViewItem[] = [];
  selectedThreadId: string | null = null;
  messages: LinkedInMessageViewItem[] = [];
  drafts: LinkedInWorkspaceDraft[] = [];
  draftBody: string = '';
  selectedDraftId: string | null = null;
  savedDraftBody: string = '';
  cvCheck: CvCheck = 'pending';
  isManualSendArmed: boolean = false;
  isInboxLoading: boolean = false;
  isThreadLoading: boolean = false;
  isDraftSaving: boolean = false;
  isDraftDirty: boolean = false;
  error: string | null = null;
  notice: string | null = null;
  isBridgeConnected: boolean = false;

  constructor(
    private readonly data_DS: L_LinkedInWorkspace_DataService,
    private readonly bridge: L_LinkedInWorkspaceBridge_Service,
  ) {}

  ngOnInit(): void {
    this.isBridgeConnected = this.bridge.isConnected();
    void this.initialize();
  }

  async handleOpenWorkspace(): Promise<void> {
    this.clearFeedback();
    try {
      const result: LinkedInWorkspaceLaunchResult = await this.bridge.open();
      this.notice = result.message;
    } catch (error: unknown) {
      this.setError(error, 'linkedin.workspace.open');
    }
  }

  async handleFilterChange(): Promise<void> {
    this.offset = 0;
    this.previousOffsets = [];
    await this.loadInbox(true);
  }

  async handleNextPage(): Promise<void> {
    if (this.nextOffset === null) {
      return;
    }
    this.previousOffsets.push(this.offset);
    this.offset = this.nextOffset;
    await this.loadInbox(true);
  }

  async handlePreviousPage(): Promise<void> {
    const previous: number | undefined = this.previousOffsets.pop();
    if (previous === undefined) {
      return;
    }
    this.offset = previous;
    await this.loadInbox(true);
  }

  async handleSelectThread(threadId: string): Promise<void> {
    if (this.isThreadLoading) {
      return;
    }
    this.selectedThreadId = threadId;
    this.cvCheck = 'pending';
    this.isManualSendArmed = false;
    await this.loadThread(threadId);
  }

  handleLoadDraft(draft: LinkedInWorkspaceDraft): void {
    this.selectedDraftId = draft.id;
    this.draftBody = draft.body;
    this.savedDraftBody = draft.body;
    this.isDraftDirty = false;
    this.isManualSendArmed = false;
    this.notice = 'A mentett draft betöltve.';
  }

  async handleSaveDraft(): Promise<void> {
    await this.persistDraftIfNeeded(true);
  }

  handleDraftChange(body: string): void {
    this.draftBody = body;
    this.isDraftDirty = body !== this.savedDraftBody;
    this.isManualSendArmed = false;
  }

  async handleCopyDraft(): Promise<void> {
    this.clearFeedback();
    const draft: LinkedInWorkspaceDraft | null = await this.persistDraftIfNeeded(false);
    if (!draft) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.draftBody);
      await this.data_DS.updateDraftStatus({ draftId: draft.id, status: 'copied' });
      this.notice = 'A draft a vágólapra került. Illeszd be a LinkedInbe, ellenőrizd, majd ott küldd el.';
      await this.loadThread(draft.threadId, false);
    } catch (error: unknown) {
      this.setError(error, 'linkedin.workspace.copy');
    }
  }

  handleArmManualSend(): void {
    this.isManualSendArmed = true;
    this.notice = 'Ez csak helyi jelölés. Előbb küldd el a LinkedIn natív felületén, majd erősítsd meg itt.';
  }

  async handleConfirmManualSend(): Promise<void> {
    if (!this.selectedDraftId || this.isDraftDirty || this.cvCheck === 'pending') {
      this.error = 'Mentsd a jelenlegi draftot, majd jelöld, hogy a CV csatolva van vagy ehhez az üzenethez nem szükséges.';
      return;
    }
    this.clearFeedback();
    try {
      await this.data_DS.updateDraftStatus({ draftId: this.selectedDraftId, status: 'manual-send-reported' });
      this.isManualSendArmed = false;
      this.notice = 'Kézi küldés owner-jelentésként rögzítve. Ez nem LinkedIn API kézbesítési igazolás.';
      if (this.selectedThreadId) {
        await this.loadThread(this.selectedThreadId, false);
      }
    } catch (error: unknown) {
      this.setError(error, 'linkedin.workspace.manual-send');
    }
  }

  private async loadInbox(selectFirst: boolean): Promise<void> {
    this.isInboxLoading = true;
    this.clearFeedback();
    try {
      const response: LinkedInWorkspaceInboxResponse = await this.data_DS.getInbox({
        filter: this.filter,
        offset: this.offset,
        limit: this.pageSize,
        sinceDays: this.sinceDays,
      });
      this.inboxItems = response.items.map((item: LinkedInWorkspaceInboxItem): LinkedInInboxViewItem => ({
        ...item,
        displayName: this.toDisplayName(item.counterpartId, item.threadId),
        displayDate: new Date(item.latestMessageAt).toLocaleString('hu-HU'),
      }));
      this.total = response.total;
      this.nextOffset = response.nextOffset;
      this.cacheUpdatedAt = new Date(response.cacheUpdatedAt).toLocaleString('hu-HU');
      if (selectFirst && this.inboxItems[0]) {
        await this.handleSelectThread(this.inboxItems[0].threadId);
      } else if (this.inboxItems.length === 0) {
        this.selectedThreadId = null;
        this.messages = [];
        this.drafts = [];
      }
    } catch (error: unknown) {
      this.setError(error, 'linkedin.workspace.inbox');
    } finally {
      this.isInboxLoading = false;
    }
  }

  private async loadThread(threadId: string, resetDraft: boolean = true): Promise<void> {
    this.isThreadLoading = true;
    this.error = null;
    try {
      const response: LinkedInWorkspaceThreadResponse = await this.data_DS.getThread(threadId);
      this.messages = response.messages.map((message: LinkedInWorkspaceMessage): LinkedInMessageViewItem => ({
        ...message,
        displayDate: new Date(message.createdAt).toLocaleString('hu-HU'),
        directionLabel: message.direction === 'inbound' ? 'Bejövő' : message.direction === 'outbound' ? 'Kimenő' : 'Ismeretlen',
      }));
      this.drafts = response.drafts;
      if (resetDraft) {
        const latestDraft: LinkedInWorkspaceDraft | undefined = [...response.drafts]
          .filter((draft: LinkedInWorkspaceDraft) => draft.status !== 'discarded')
          .sort((left: LinkedInWorkspaceDraft, right: LinkedInWorkspaceDraft) => right.updatedAt.localeCompare(left.updatedAt))[0];
        this.selectedDraftId = latestDraft?.id ?? null;
        this.draftBody = latestDraft?.body ?? '';
        this.savedDraftBody = latestDraft?.body ?? '';
        this.isDraftDirty = false;
      }
    } catch (error: unknown) {
      this.setError(error, 'linkedin.workspace.thread');
    } finally {
      this.isThreadLoading = false;
    }
  }

  private async persistDraftIfNeeded(showSavedNotice: boolean): Promise<LinkedInWorkspaceDraft | null> {
    this.clearFeedback();
    if (!this.selectedThreadId || this.draftBody.trim().length === 0) {
      this.error = 'Válassz beszélgetést, és írj nem üres draftot.';
      return null;
    }
    if (this.selectedDraftId && this.draftBody === this.savedDraftBody) {
      return this.drafts.find((draft: LinkedInWorkspaceDraft) => draft.id === this.selectedDraftId) ?? null;
    }
    this.isDraftSaving = true;
    try {
      const receipt: LinkedInWorkspaceDraftReceipt = await this.data_DS.createDraft({
        threadId: this.selectedThreadId,
        body: this.draftBody,
      });
      this.selectedDraftId = receipt.draft.id;
      this.savedDraftBody = receipt.draft.body;
      this.isDraftDirty = false;
      await this.loadThread(this.selectedThreadId, false);
      if (showSavedNotice) {
        this.notice = 'A draft helyben elmentve. LinkedIn-küldés nem történt.';
      }
      return receipt.draft;
    } catch (error: unknown) {
      this.setError(error, 'linkedin.workspace.draft-save');
      return null;
    } finally {
      this.isDraftSaving = false;
    }
  }

  private async initialize(): Promise<void> {
    await this.loadInbox(true);
  }

  private toDisplayName(counterpartId: string | null, threadId: string): string {
    if (counterpartId) {
      try {
        const url: URL = new URL(counterpartId);
        const slug: string = url.pathname.split('/').filter(Boolean).pop() ?? counterpartId;
        return slug.replace(/[-_]+/gu, ' ');
      } catch {
        return counterpartId;
      }
    }
    return `Beszélgetés ${threadId.slice(-8)}`;
  }

  private clearFeedback(): void {
    this.error = null;
    this.notice = null;
  }

  private setError(error: unknown, source: string): void {
    const details = A_ErrorExtract_Util.extract(error, source);
    this.error = `${details.errorCode}: ${details.message}`;
  }
}
