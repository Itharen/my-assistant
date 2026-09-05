import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createEmptyLinkedInCache,
  type LinkedInCache,
  type LinkedInMessage,
} from '../../../../cli/src/linkedin/linkedin.models.js';
import { LinkedInStore } from '../../../../cli/src/linkedin/linkedin.store.js';

import { LinkedInWorkspace_DataService } from './linkedin-workspace.data-service.js';

describe('LinkedInWorkspace_DataService user journey', (): void => {
  let directory: string;
  let store: LinkedInStore;
  let service: LinkedInWorkspace_DataService;

  beforeEach(async (): Promise<void> => {
    directory = await mkdtemp(join(tmpdir(), 'ma-linkedin-workspace-'));
    store = new LinkedInStore(join(directory, 'cache.json'));
    service = new LinkedInWorkspace_DataService(store, async (): Promise<void> => undefined);
  });

  afterEach(async (): Promise<void> => {
    await rm(directory, { recursive: true, force: true });
  });

  it('carries inbox selection into thread read, draft copy and owner-reported manual send', async (): Promise<void> => {
    const now: number = Date.now();
    const cache: LinkedInCache = createEmptyLinkedInCache(new Date(now));
    cache.messages = [message('m1', 'thread-a', 'inbound', now - 1000, 'https://www.linkedin.com/in/example')];
    await store.save(cache);

    const inbox = await service.listInbox({ filter: 'needs-reply', offset: 0, limit: 12, sinceDays: 90 });
    expect(inbox.total).toBe(1);
    expect(inbox.items[0]?.counterpartId).toContain('/in/example');

    const thread = await service.getThread(inbox.items[0]!.threadId);
    expect(thread.messages[0]?.content).toBe('hello');
    expect(thread.sendCapability).toBe('manual-linkedin-ui-only');

    const created = await service.createDraft({ threadId: thread.threadId, body: 'Thanks for reaching out.' });
    expect(created.deliveryEvidence).toBe('none-owner-action-required');
    expect(created.draft.status).toBe('draft');

    const copied = await service.updateDraftStatus({ draftId: created.draft.id, status: 'copied' });
    expect(copied.draft.status).toBe('copied');

    const ownerReport = await service.updateDraftStatus({
      draftId: copied.draft.id,
      status: 'manual-send-reported',
    });
    expect(ownerReport.draft.status).toBe('manual-send-reported');
    expect(ownerReport.deliveryEvidence).toBe('none-owner-action-required');

    const resumed = await new LinkedInWorkspace_DataService(store, async (): Promise<void> => undefined)
      .getThread(thread.threadId);
    expect(resumed.drafts[0]?.status).toBe('manual-send-reported');
  });

  it('paginates after applying the requested time window', async (): Promise<void> => {
    const now: number = Date.now();
    const cache: LinkedInCache = createEmptyLinkedInCache(new Date(now));
    cache.messages = [
      message('recent-a', 'thread-a', 'inbound', now - 1000, 'other-a'),
      message('recent-b', 'thread-b', 'inbound', now - 2000, 'other-b'),
      message('old', 'thread-old', 'inbound', now - 120 * 24 * 60 * 60 * 1000, 'other-old'),
    ];
    await store.save(cache);

    const first = await service.listInbox({ filter: 'needs-reply', offset: 0, limit: 1, sinceDays: 90 });
    const second = await service.listInbox({ filter: 'needs-reply', offset: first.nextOffset!, limit: 1, sinceDays: 90 });

    expect(first.total).toBe(2);
    expect(first.nextOffset).toBe(1);
    expect(second.nextOffset).toBeNull();
    expect([first.items[0]?.threadId, second.items[0]?.threadId]).not.toContain('thread-old');
  });
});

function message(
  id: string,
  threadId: string,
  direction: LinkedInMessage['direction'],
  createdAt: number,
  authorId: string,
): LinkedInMessage {
  return {
    id,
    threadId,
    authorId,
    direction,
    content: 'hello',
    deliveredAt: createdAt,
    createdAt,
    readAt: null,
    deleted: false,
    source: 'snapshot',
    sourceActivityId: null,
    rawFingerprint: id,
  };
}
