import { createDraft, getThread, summarizeInbox, updateDraftStatus } from './linkedin.analyzer.js';
import { createEmptyLinkedInCache, type LinkedInMessage } from './linkedin.models.js';
import { redactLinkedInCommandArgs, redactLinkedInSensitiveText } from './linkedin.error.js';
import { applyChangeLogEvents } from './linkedin.normalizer.js';

describe('LinkedIn inbox classification and drafts', () => {
  it('marks needs-reply only when the latest non-deleted known message is inbound', () => {
    const cache = createEmptyLinkedInCache();
    cache.messages = [
      message('a1', 'thread-a', 'inbound', 100, null),
      message('a2', 'thread-a', 'outbound', 110, 111),
      message('b1', 'thread-b', 'outbound', 120, 121),
      message('b2', 'thread-b', 'inbound', 130, null),
    ];

    const result = summarizeInbox(cache, 'needs-reply', 0, 20);

    expect(result.items.map((item) => item.threadId)).toEqual(['thread-b']);
    expect(result.items[0]?.unreadConfidence).toBe('candidate');
  });

  it('paginates deterministic newest-first conversation summaries', () => {
    const cache = createEmptyLinkedInCache();
    cache.messages = [
      message('a', 'thread-a', 'inbound', 100, null),
      message('b', 'thread-b', 'inbound', 300, null),
      message('c', 'thread-c', 'inbound', 200, null),
    ];

    const first = summarizeInbox(cache, 'all', 0, 2);
    expect(first.nextOffset).not.toBeNull();
    const second = summarizeInbox(cache, 'all', first.nextOffset ?? 0, 2);

    expect(first.items.map((item) => item.threadId)).toEqual(['thread-b', 'thread-c']);
    expect(second.items.map((item) => item.threadId)).toEqual(['thread-a']);
    expect(second.nextOffset).toBeNull();
  });

  it('applies the time window before pagination totals are calculated', () => {
    const cache = createEmptyLinkedInCache();
    cache.messages = [
      message('old', 'thread-old', 'inbound', 100, null),
      message('new', 'thread-new', 'inbound', 300, null),
    ];

    const result = summarizeInbox(cache, 'needs-reply', 0, 20, { sinceMs: 200 });

    expect(result.total).toBe(1);
    expect(result.items[0]?.threadId).toBe('thread-new');
  });

  it('creates a local draft for an existing thread without any send operation', () => {
    const cache = createEmptyLinkedInCache();
    cache.messages = [message('a', 'thread-a', 'inbound', 100, null)];

    const next = createDraft(cache, 'thread-a', 'Köszönöm, hamarosan válaszolok.', new Date('2026-08-26T09:00:00Z'));

    expect(next.drafts.length).toBe(1);
    expect(next.drafts[0]?.status).toBe('draft');
    expect(getThread(next, 'thread-a').length).toBe(1);
  });

  it('records manual-send-reported as local draft evidence only', () => {
    const cache = createEmptyLinkedInCache();
    cache.messages = [message('a', 'thread-a', 'inbound', 100, null)];
    const withDraft = createDraft(cache, 'thread-a', 'Draft', new Date('2026-08-26T09:00:00Z'));
    const draftId: string = withDraft.drafts[0]!.id;

    const next = updateDraftStatus(withDraft, draftId, 'manual-send-reported', new Date('2026-08-26T09:05:00Z'));

    expect(next.drafts[0]?.status).toBe('manual-send-reported');
    expect(next.drafts[0]?.updatedAt).toBe('2026-08-26T09:05:00.000Z');
  });

  it('preserves prior fields when a PARTIAL_UPDATE only changes readAt', () => {
    const existing: LinkedInMessage[] = [message('a', 'thread-a', 'inbound', 100, null)];

    const updated = applyChangeLogEvents(existing, [{
      activityId: 'activity-1',
      resourceName: 'messages',
      method: 'PARTIAL_UPDATE',
      processedAt: 200,
      activity: { resourceId: 'a' },
      processedActivity: { resourceId: 'a', readAt: 150 },
    }], new Set<string>(['self']));

    expect(updated[0]?.threadId).toBe('thread-a');
    expect(updated[0]?.content).toBe('a');
    expect(updated[0]?.readAt).toBe(150);
  });

  it('redacts thread identifiers, body paths and bearer tokens from persistent diagnostics', () => {
    expect(redactLinkedInCommandArgs(['show', '--id', 'thread-secret', '--body-file', 'C:\\secret.txt']))
      .toEqual(['show', '--id', '[REDACTED]', '--body-file', '[REDACTED]']);
    expect(redactLinkedInSensitiveText('Authorization: Bearer abc.def')).not.toContain('abc.def');
  });

  it('clears needs-reply after a later outbound message and ignores a deleted latest message', () => {
    const cache = createEmptyLinkedInCache();
    const deletedLatest: LinkedInMessage = { ...message('c', 'thread-a', 'inbound', 300, null), deleted: true };
    cache.messages = [
      message('a', 'thread-a', 'inbound', 100, null),
      message('b', 'thread-a', 'outbound', 200, 200),
      deletedLatest,
    ];

    expect(summarizeInbox(cache, 'needs-reply', 0, 20).items).toEqual([]);
    expect(summarizeInbox(cache, 'all', 0, 20).items[0]?.latestMessageId).toBe('b');
  });
});

function message(
  id: string,
  threadId: string,
  direction: LinkedInMessage['direction'],
  createdAt: number,
  readAt: number | null,
): LinkedInMessage {
  return {
    id: id,
    threadId: threadId,
    authorId: direction === 'outbound' ? 'self' : 'other',
    direction: direction,
    content: id,
    deliveredAt: createdAt,
    createdAt: createdAt,
    readAt: readAt,
    deleted: false,
    source: 'snapshot',
    sourceActivityId: null,
    rawFingerprint: id,
  };
}
