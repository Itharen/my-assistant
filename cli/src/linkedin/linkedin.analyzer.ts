import { randomUUID } from 'node:crypto';

import { LinkedInToolError } from './linkedin.error.js';
import {
  type LinkedInCache,
  type LinkedInDraft,
  type LinkedInDraftStatus,
  type LinkedInInboxSummary,
  type LinkedInMessage,
} from './linkedin.models.js';

export interface LinkedInInboxPage {
  items: LinkedInInboxSummary[];
  offset: number;
  limit: number;
  total: number;
  nextOffset: number | null;
}

export type LinkedInInboxFilter = 'all' | 'unread' | 'needs-reply';

export interface LinkedInInboxQueryOptions {
  sinceMs?: number;
}

export function summarizeInbox(
  cache: LinkedInCache,
  filter: LinkedInInboxFilter,
  offset: number,
  limit: number,
  options: LinkedInInboxQueryOptions = {},
): LinkedInInboxPage {
  validatePage(offset, limit);
  const grouped: Map<string, LinkedInMessage[]> = new Map<string, LinkedInMessage[]>();
  for (const message of cache.messages) {
    if (message.deleted) {
      continue;
    }
    const threadMessages: LinkedInMessage[] = grouped.get(message.threadId) ?? [];
    threadMessages.push(message);
    grouped.set(message.threadId, threadMessages);
  }
  const all: LinkedInInboxSummary[] = [...grouped.entries()]
    .map(([threadId, messages]: [string, LinkedInMessage[]]) => summarizeThread(cache, threadId, messages))
    .filter((summary: LinkedInInboxSummary) => matchesFilter(summary, filter))
    .filter((summary: LinkedInInboxSummary) => options.sinceMs === undefined || summary.latestMessageAt >= options.sinceMs)
    .sort((left: LinkedInInboxSummary, right: LinkedInInboxSummary) => filter === 'needs-reply'
      ? left.latestMessageAt - right.latestMessageAt || left.threadId.localeCompare(right.threadId)
      : right.latestMessageAt - left.latestMessageAt || left.threadId.localeCompare(right.threadId));
  const items: LinkedInInboxSummary[] = all.slice(offset, offset + limit);
  const nextOffset: number | null = offset + items.length < all.length ? offset + items.length : null;
  return { items: items, offset: offset, limit: limit, total: all.length, nextOffset: nextOffset };
}

export function getThread(cache: LinkedInCache, threadId: string): LinkedInMessage[] {
  const messages: LinkedInMessage[] = cache.messages
    .filter((message: LinkedInMessage) => message.threadId === threadId)
    .sort((left: LinkedInMessage, right: LinkedInMessage) => (
      left.createdAt - right.createdAt || left.id.localeCompare(right.id)
    ));
  if (messages.length === 0) {
    throw new LinkedInToolError('MA-LINKEDIN-THREAD-NOT-FOUND', 'No cached LinkedIn thread has that id.', {
      threadId: threadId,
    });
  }
  return messages;
}

export function createDraft(cache: LinkedInCache, threadId: string, body: string, now: Date = new Date()): LinkedInCache {
  if (body.trim().length === 0) {
    throw new LinkedInToolError('MA-LINKEDIN-DRAFT-EMPTY', 'LinkedIn draft body must not be empty.');
  }
  getThread(cache, threadId);
  const timestamp: string = now.toISOString();
  const draft: LinkedInDraft = {
    id: randomUUID(),
    threadId: threadId,
    body: body,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'draft',
  };
  return { ...cache, drafts: [...cache.drafts, draft] };
}

export function getDraft(cache: LinkedInCache, draftId: string): LinkedInDraft {
  const draft: LinkedInDraft | undefined = cache.drafts.find((candidate: LinkedInDraft) => candidate.id === draftId);
  if (!draft) {
    throw new LinkedInToolError('MA-LINKEDIN-DRAFT-NOT-FOUND', 'No local LinkedIn draft has that id.', {
      draftId: draftId,
    });
  }
  return draft;
}

export function deleteDraft(cache: LinkedInCache, draftId: string): LinkedInCache {
  getDraft(cache, draftId);
  return {
    ...cache,
    drafts: cache.drafts.filter((draft: LinkedInDraft) => draft.id !== draftId),
  };
}

export function updateDraftStatus(
  cache: LinkedInCache,
  draftId: string,
  status: LinkedInDraftStatus,
  now: Date = new Date(),
): LinkedInCache {
  getDraft(cache, draftId);
  return {
    ...cache,
    drafts: cache.drafts.map((draft: LinkedInDraft): LinkedInDraft => draft.id === draftId
      ? { ...draft, status: status, updatedAt: now.toISOString() }
      : draft),
  };
}

function summarizeThread(
  cache: LinkedInCache,
  threadId: string,
  messages: LinkedInMessage[],
): LinkedInInboxSummary {
  const ordered: LinkedInMessage[] = [...messages].sort((left: LinkedInMessage, right: LinkedInMessage) => (
    left.createdAt - right.createdAt || left.id.localeCompare(right.id)
  ));
  const latest: LinkedInMessage | undefined = ordered[ordered.length - 1];
  if (!latest) {
    throw new LinkedInToolError('MA-LINKEDIN-THREAD-EMPTY', 'Cannot summarize an empty LinkedIn thread.', {
      threadId: threadId,
    });
  }
  const unread: boolean = ordered.some((message: LinkedInMessage) => (
    message.direction === 'inbound' && message.readAt === null
  ));
  return {
    threadId: threadId,
    latestMessageId: latest.id,
    latestMessageAt: latest.createdAt,
    latestDirection: latest.direction,
    unread: unread,
    unreadConfidence: cache.calibration.unreadReliable ? 'authoritative' : 'candidate',
    needsReply: latest.direction === 'inbound',
    classificationRuleVersion: '1.0.0',
    messageCount: ordered.length,
  };
}

function matchesFilter(summary: LinkedInInboxSummary, filter: LinkedInInboxFilter): boolean {
  if (filter === 'unread') {
    return summary.unread;
  }
  if (filter === 'needs-reply') {
    return summary.needsReply;
  }
  return true;
}

function validatePage(offset: number, limit: number): void {
  if (!Number.isInteger(offset) || offset < 0) {
    throw new LinkedInToolError('MA-LINKEDIN-PAGE', 'offset must be a non-negative integer.', { offset: offset });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new LinkedInToolError('MA-LINKEDIN-PAGE', 'limit must be an integer between 1 and 100.', { limit: limit });
  }
}
