import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { createEmptyLinkedInCache, type LinkedInMessage } from '../cli/src/linkedin/linkedin.models';
import { LinkedInStore } from '../cli/src/linkedin/linkedin.store';
import { LinkedInWorkspace_DataService } from '../server/src/_routes/linkedin/linkedin-workspace.data-service';
import { openLinkedInWorkspace } from '../browser-extension/src/background';
import { isServerHealthy } from './start-my-assistant';

describe('LI-J07 guided manual-send journey', (): void => {
  it('carries state from healthy app through review, draft, panel handoff and manual owner report', async (): Promise<void> => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-li-j07-'));
    try {
      assert.equal(await isServerHealthy(async (): Promise<Response> => new Response('{}', { status: 200 })), true);
      const store = new LinkedInStore(join(directory, 'cache.json'));
      const cache = createEmptyLinkedInCache();
      cache.messages = [message(Date.now())];
      await store.save(cache);
      const workspace = new LinkedInWorkspace_DataService(store, async (): Promise<void> => undefined);

      const inbox = await workspace.listInbox({ filter: 'needs-reply', offset: 0, limit: 12, sinceDays: 90 });
      assert.equal(inbox.total, 1);
      const thread = await workspace.getThread(inbox.items[0]!.threadId);
      assert.equal(thread.messages.at(-1)?.direction, 'inbound');
      const receipt = await workspace.createDraft({ threadId: thread.threadId, body: 'A concise answer.' });
      assert.equal(receipt.deliveryEvidence, 'none-owner-action-required');

      const browserActions: string[] = [];
      const handoff = await openLinkedInWorkspace({
        openSidePanel: async (): Promise<void> => { browserActions.push('panel'); },
        createTab: async (): Promise<void> => { browserActions.push('linkedin-tab'); },
      }, 3, 'journey-request');
      assert.equal(handoff.ok, true);
      assert.deepEqual(browserActions, ['panel', 'linkedin-tab']);

      await workspace.updateDraftStatus({ draftId: receipt.draft.id, status: 'copied' });
      await workspace.updateDraftStatus({ draftId: receipt.draft.id, status: 'manual-send-reported' });
      const resumed = await workspace.getThread(thread.threadId);
      assert.equal(resumed.drafts[0]?.status, 'manual-send-reported');
      assert.equal(resumed.sendCapability, 'manual-linkedin-ui-only');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('keeps the local draft usable when side-panel opening is permission-restricted', async (): Promise<void> => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-li-j07-restricted-'));
    try {
      const store = new LinkedInStore(join(directory, 'cache.json'));
      const cache = createEmptyLinkedInCache();
      cache.messages = [message(Date.now())];
      await store.save(cache);
      const workspace = new LinkedInWorkspace_DataService(store, async (): Promise<void> => undefined);
      const receipt = await workspace.createDraft({ threadId: 'thread-j07', body: 'Still available.' });

      const handoff = await openLinkedInWorkspace({
        openSidePanel: async (): Promise<void> => { throw new Error('user gesture required'); },
        createTab: async (): Promise<void> => undefined,
      }, 3, 'restricted-request');

      assert.equal(handoff.ok, false);
      assert.equal((await workspace.getThread('thread-j07')).drafts[0]?.id, receipt.draft.id);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

function message(createdAt: number): LinkedInMessage {
  return {
    id: 'message-j07',
    threadId: 'thread-j07',
    authorId: 'https://www.linkedin.com/in/example',
    direction: 'inbound',
    content: 'Opportunity details',
    deliveredAt: createdAt,
    createdAt,
    readAt: null,
    deleted: false,
    source: 'snapshot',
    sourceActivityId: null,
    rawFingerprint: 'fixture-j07',
  };
}
