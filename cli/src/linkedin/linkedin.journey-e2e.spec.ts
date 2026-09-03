import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { LinkedInApiClient, type LinkedInFetch } from './linkedin.api-client.js';
import { createDraft, summarizeInbox } from './linkedin.analyzer.js';
import { type LinkedInConfig } from './linkedin.models.js';
import { LinkedInToolError } from './linkedin.error.js';
import { type LinkedInSecretProvider } from './linkedin.secret-provider.js';
import { LinkedInStore } from './linkedin.store.js';
import { LinkedInSyncService } from './linkedin.sync-service.js';

describe('LinkedIn user journeys', () => {
  let directory: string;
  let store: LinkedInStore;
  const config: LinkedInConfig = {
    schemaVersion: '1.1.0',
    credentialSource: 'environment',
    accessTokenKey: 'LI_TOKEN',
    fdpProject: null,
    fdpBranch: null,
    fdpEnvironment: null,
    selfIdentifiers: [],
  };
  const secrets: LinkedInSecretProvider = { getAccessToken: async () => 'secret' };

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ma-linkedin-journey-'));
    store = new LinkedInStore(join(directory, 'cache.json'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('LI-J01: consent -> snapshot -> local inbox reaches useful conversation output', async () => {
    const service = createService(store, routeFetch([snapshotMessage('m1', 'thread-1', 'other', 100)]));

    await service.bootstrap();
    const inbox = summarizeInbox(await store.load(), 'all', 0, 20);

    expect(inbox.items.length).toBe(1);
    expect(inbox.items[0]?.threadId).toBe('thread-1');
  });

  it('LI-J02: snapshot -> changelog -> needs-reply carries the same thread state forward', async () => {
    const service = createService(store, routeFetch([snapshotMessage('m1', 'thread-1', 'self', 100)], [
      changeMessage('a1', 'm2', 'thread-1', 'other', 200),
    ]));

    await service.bootstrap();
    await service.sync();
    const needsReply = summarizeInbox(await store.load(), 'needs-reply', 0, 20);

    expect(needsReply.items.map((item) => item.threadId)).toEqual(['thread-1']);
  });

  it('LI-J03: boundary dedupe plus later outbound sync clears needs-reply', async () => {
    const changes: Record<string, unknown>[] = [changeMessage('a1', 'm1', 'thread-1', 'other', 200)];
    const service = createService(store, routeFetch([], changes));

    await service.bootstrap();
    const first = await service.sync();
    changes.push(changeMessage('a2', 'm2', 'thread-1', 'self', 300));
    const second = await service.sync();
    const third = await service.sync();

    expect(first.appliedEvents).toBe(1);
    expect(second.appliedEvents).toBe(1);
    expect(third.appliedEvents).toBe(0);
    expect((await store.load()).messages.length).toBe(2);
    expect(summarizeInbox(await store.load(), 'needs-reply', 0, 20).items).toEqual([]);
  });

  it('LI-J04: failed incremental sync preserves the previous cursor and cache', async () => {
    const bootstrapService = createService(store, routeFetch([snapshotMessage('m1', 'thread-1', 'other', 100)]));
    await bootstrapService.bootstrap();
    const before = await store.load();
    const failingApi = new LinkedInApiClient({
      fetch: async (input: string | URL): Promise<Response> => {
        if (input.toString().includes('memberChangeLogs')) {
          return jsonResponse(500, { message: 'temporary failure' });
        }
        return jsonResponse(500, { message: 'unexpected' });
      },
      sleep: async () => undefined,
      maxAttempts: 1,
    });
    const failingService = new LinkedInSyncService(failingApi, secrets, store, config);

    await expectAsync(failingService.sync()).toBeRejected();
    const after = await store.load();

    expect(after.changeCursorMs).toBe(before.changeCursorMs);
    expect(after.messages).toEqual(before.messages);

    const resumedService = createService(store, routeFetch([], [
      changeMessage('resume-1', 'm2', 'thread-1', 'self', 300),
    ]));
    const resumed = await resumedService.sync();
    expect(resumed.appliedEvents).toBe(1);
    expect((await store.load()).changeCursorMs).toBe(300);
  });

  it('LI-J05: missing permission fails before any cache replacement', async () => {
    const api = new LinkedInApiClient({
      fetch: async (): Promise<Response> => jsonResponse(403, { message: 'forbidden' }),
      sleep: async () => undefined,
      maxAttempts: 1,
    });
    const service = new LinkedInSyncService(api, secrets, store, config);

    await expectAsync(service.bootstrap()).toBeRejected();

    expect((await store.load()).messages).toEqual([]);
  });

  it('LI-J05: missing secret -> provisioned secret -> API -> token never persisted', async () => {
    let provisioned: boolean = false;
    const secretProvider: LinkedInSecretProvider = {
      getAccessToken: async (): Promise<string> => {
        if (!provisioned) {
          throw new LinkedInToolError('MA-LINKEDIN-TOKEN-MISSING', 'Token missing.');
        }
        return 'never-persist-this-token';
      },
    };
    const api = new LinkedInApiClient({
      fetch: routeFetch([snapshotMessage('m1', 'thread-1', 'other', 100)]),
      sleep: async () => undefined,
      maxAttempts: 1,
    });
    const service = new LinkedInSyncService(api, secretProvider, store, config);

    await expectAsync(service.bootstrap()).toBeRejected();
    provisioned = true;
    await service.bootstrap();
    const cacheText: string = await readFile(join(directory, 'cache.json'), 'utf8');

    expect(cacheText).not.toContain('never-persist-this-token');
    expect((await store.load()).messages.length).toBe(1);
  });

  it('LI-J06: inbox -> needs-reply -> local draft -> purge completes with cleanup', async () => {
    const service = createService(store, routeFetch([snapshotMessage('m1', 'thread-1', 'other', 100)]));
    await service.bootstrap();
    const cache = await store.load();
    const target = summarizeInbox(cache, 'needs-reply', 0, 20).items[0];
    expect(target).toBeDefined();
    if (!target) {
      fail('Expected a needs-reply target.');
      return;
    }
    await store.save(createDraft(cache, target.threadId, 'Local draft'));

    expect((await store.load()).drafts.length).toBe(1);
    expect(await store.purge()).toBeTrue();
    expect((await store.load()).messages.length).toBe(0);
  });

  it('dry-run bootstrap traverses the API but leaves local state untouched', async () => {
    const service = createService(store, routeFetch([snapshotMessage('m1', 'thread-1', 'other', 100)]));

    const result = await service.bootstrap(false);

    expect(result.written).toBeFalse();
    expect(result.messages).toBe(1);
    expect((await store.load()).messages).toEqual([]);
  });
});

function createService(store: LinkedInStore, fetch: LinkedInFetch): LinkedInSyncService {
  const api = new LinkedInApiClient({ fetch: fetch, sleep: async () => undefined, maxAttempts: 1 });
  const secrets: LinkedInSecretProvider = { getAccessToken: async () => 'secret' };
  return new LinkedInSyncService(api, secrets, store, {
    schemaVersion: '1.1.0',
    credentialSource: 'environment',
    accessTokenKey: 'LI_TOKEN',
    fdpProject: null,
    fdpBranch: null,
    fdpEnvironment: null,
    selfIdentifiers: [],
  });
}

function routeFetch(snapshotRows: Record<string, unknown>[], changes: Record<string, unknown>[] = []): LinkedInFetch {
  return async (input: string | URL): Promise<Response> => {
    const url: string = input.toString();
    if (url.includes('memberAuthorizations')) {
      return jsonResponse(200, { elements: [{ member: 'self', regulatedAt: 50 }] });
    }
    if (url.includes('memberSnapshotData')) {
      const parsed = new URL(url);
      if (parsed.searchParams.get('start') === '0') {
        return jsonResponse(200, {
          elements: [{ snapshotDomain: 'INBOX', snapshotData: snapshotRows }],
          paging: { links: [] },
        });
      }
      return jsonResponse(404, { message: 'No data available' });
    }
    if (url.includes('memberChangeLogs')) {
      return jsonResponse(200, { elements: changes, paging: { links: [] } });
    }
    return jsonResponse(404, { message: 'unknown route' });
  };
}

function snapshotMessage(
  id: string,
  thread: string,
  author: string,
  deliveredAt: number,
): Record<string, unknown> {
  return { resourceId: id, thread: thread, author: author, deliveredAt: deliveredAt, content: id };
}

function changeMessage(
  activityId: string,
  id: string,
  thread: string,
  author: string,
  deliveredAt: number,
): Record<string, unknown> {
  return {
    activityId: activityId,
    resourceName: 'messages',
    method: 'CREATE',
    processedAt: deliveredAt,
    activity: {},
    processedActivity: snapshotMessage(id, thread, author, deliveredAt),
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status: status, headers: { 'content-type': 'application/json' } });
}
