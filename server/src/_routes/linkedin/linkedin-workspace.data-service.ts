import {
  createDraft,
  getDraft,
  getThread,
  summarizeInbox,
  updateDraftStatus,
} from '../../../../cli/src/linkedin/linkedin.analyzer.js';
import { resolveLinkedInPaths } from '../../../../cli/src/linkedin/linkedin.config.js';
import {
  type LinkedInCache,
  type LinkedInDraft,
  type LinkedInInboxSummary,
  type LinkedInMessage,
} from '../../../../cli/src/linkedin/linkedin.models.js';
import { LinkedInStore } from '../../../../cli/src/linkedin/linkedin.store.js';

import { emitServerActionLog } from '../../_collections/action-log.util.js';
import {
  type LinkedInWorkspaceDraftCreateRequest,
  type LinkedInWorkspaceDraftReceipt,
  type LinkedInWorkspaceDraftStatusRequest,
  type LinkedInWorkspaceFilter,
  type LinkedInWorkspaceInboxItem,
  type LinkedInWorkspaceInboxResponse,
  type LinkedInWorkspaceThreadResponse,
} from '../../_models/interfaces/integrations/linkedin.interface.js';

const DAY_MS: number = 24 * 60 * 60 * 1000;

/** Loopback LinkedIn workspace service backed by the canonical CLI cache. */
export class LinkedInWorkspace_DataService {
  private readonly store: LinkedInStore;
  private readonly actionLog: typeof emitServerActionLog;

  constructor(
    store: LinkedInStore = new LinkedInStore(resolveLinkedInPaths().cache),
    actionLog: typeof emitServerActionLog = emitServerActionLog,
  ) {
    this.store = store;
    this.actionLog = actionLog;
  }

  async listInbox(set: {
    filter: LinkedInWorkspaceFilter;
    offset: number;
    limit: number;
    sinceDays: number;
  }): Promise<LinkedInWorkspaceInboxResponse> {
    const cache: LinkedInCache = await this.store.loadRequired();
    const page = summarizeInbox(
      cache,
      set.filter,
      set.offset,
      set.limit,
      { sinceMs: Date.now() - set.sinceDays * DAY_MS },
    );
    return {
      ...page,
      items: page.items.map((item: LinkedInInboxSummary): LinkedInWorkspaceInboxItem => ({
        threadId: item.threadId,
        latestMessageAt: item.latestMessageAt,
        latestDirection: item.latestDirection,
        unread: item.unread,
        unreadConfidence: item.unreadConfidence,
        needsReply: item.needsReply,
        messageCount: item.messageCount,
        counterpartId: findCounterpart(cache, item.threadId),
      })),
      filter: set.filter,
      sinceDays: set.sinceDays,
      cacheUpdatedAt: cache.updatedAt,
    };
  }

  async getThread(threadId: string): Promise<LinkedInWorkspaceThreadResponse> {
    const cache: LinkedInCache = await this.store.loadRequired();
    return {
      threadId: threadId,
      messages: getThread(cache, threadId).map((message: LinkedInMessage) => ({
        id: message.id,
        direction: message.direction,
        authorId: message.authorId,
        content: message.content,
        createdAt: message.createdAt,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
      })),
      drafts: cache.drafts.filter((draft: LinkedInDraft): boolean => draft.threadId === threadId),
      sendCapability: 'manual-linkedin-ui-only',
    };
  }

  async createDraft(request: LinkedInWorkspaceDraftCreateRequest): Promise<LinkedInWorkspaceDraftReceipt> {
    const cache: LinkedInCache = await this.store.loadRequired();
    const next: LinkedInCache = createDraft(cache, request.threadId, request.body);
    await this.store.save(next);
    const draft: LinkedInDraft | undefined = next.drafts[next.drafts.length - 1];
    if (!draft) {
      throw new Error('Draft creation completed without a draft receipt.');
    }
    await this.actionLog({
      kind: 'external-action',
      summary: 'LinkedIn workspace draft persisted locally; no send action occurred.',
      ref: 'linkedin-workspace',
      extra: { bodyLength: draft.body.length, status: draft.status },
    });
    return { draft: draft, deliveryEvidence: 'none-owner-action-required' };
  }

  async updateDraftStatus(request: LinkedInWorkspaceDraftStatusRequest): Promise<LinkedInWorkspaceDraftReceipt> {
    const cache: LinkedInCache = await this.store.loadRequired();
    const next: LinkedInCache = updateDraftStatus(cache, request.draftId, request.status);
    await this.store.save(next);
    const draft: LinkedInDraft = getDraft(next, request.draftId);
    await this.actionLog({
      kind: 'state-change',
      summary: request.status === 'manual-send-reported'
        ? 'Owner reported a manual LinkedIn UI send; no API delivery receipt exists.'
        : `LinkedIn workspace draft status changed to ${request.status}.`,
      ref: 'linkedin-workspace',
      extra: { status: request.status },
    });
    return { draft: draft, deliveryEvidence: 'none-owner-action-required' };
  }
}

function findCounterpart(cache: LinkedInCache, threadId: string): string | null {
  const candidates: LinkedInMessage[] = cache.messages
    .filter((message: LinkedInMessage): boolean => (
      message.threadId === threadId && message.direction === 'inbound'
    ))
    .sort((left: LinkedInMessage, right: LinkedInMessage): number => right.createdAt - left.createdAt);
  return candidates[0]?.authorId ?? null;
}
