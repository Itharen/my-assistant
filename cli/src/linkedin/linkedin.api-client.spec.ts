import { LinkedInApiClient, type LinkedInFetch } from './linkedin.api-client.js';
import { LinkedInToolError } from './linkedin.error.js';

describe('LinkedInApiClient', () => {
  it('walks snapshot pages without trusting paging.total and stops at official no-data', async () => {
    const requestedStarts: string[] = [];
    const fetch: LinkedInFetch = async (input: string | URL): Promise<Response> => {
      const url = new URL(input.toString());
      requestedStarts.push(url.searchParams.get('start') ?? 'missing');
      if (url.searchParams.get('start') === '0') {
        return jsonResponse(200, {
          elements: [{ snapshotDomain: 'INBOX', snapshotData: [{ id: 'm1' }, { id: 'm2' }] }],
          paging: { total: 1 },
        });
      }
      return jsonResponse(404, { message: 'No data available' });
    };
    const client = new LinkedInApiClient({ fetch: fetch, sleep: async () => undefined });

    const result = await client.getInboxSnapshot('secret', 2);

    expect(result.rows.length).toBe(2);
    expect(result.pages).toBe(1);
    expect(requestedStarts).toEqual(['0', '1']);
  });

  it('distinguishes a not-ready first snapshot page from a verified empty response', async () => {
    const client = new LinkedInApiClient({
      fetch: async (): Promise<Response> => jsonResponse(404, { message: 'Snapshot not ready' }),
      sleep: async () => undefined,
    });

    await expectAsync(client.getInboxSnapshot('secret')).toBeRejectedWithError(
      LinkedInToolError,
      'LinkedIn snapshot is not ready yet; the existing cache was left untouched.',
    );
  });

  it('preserves only safe LinkedIn not-ready diagnostics', async () => {
    const client = new LinkedInApiClient({
      fetch: async (): Promise<Response> => jsonResponse(404, {
        message: 'Snapshot not ready',
        hiddenPayload: 'sensitive-value',
      }),
      sleep: async () => undefined,
    });

    try {
      await client.getInboxSnapshot('secret');
      fail('Expected snapshot-not-ready rejection.');
    } catch (error: unknown) {
      const details: unknown = error instanceof LinkedInToolError ? error.details : null;
      expect(details).toEqual(jasmine.objectContaining({
        status: 404,
        response: { message: 'Snapshot not ready' },
      }));
      expect(JSON.stringify(details)).not.toContain('sensitive-value');
    }
  });

  it('follows changelog next links and preserves the latest processedAt cursor', async () => {
    let calls: number = 0;
    const client = new LinkedInApiClient({
      fetch: async (): Promise<Response> => {
        calls += 1;
        if (calls === 1) {
          return jsonResponse(200, {
            elements: [changeEvent('a1', 110)],
            paging: { links: [{ rel: 'next', href: '/rest/memberChangeLogs?page=2' }] },
          });
        }
        return jsonResponse(200, { elements: [changeEvent('a2', 120)], paging: { links: [] } });
      },
      sleep: async () => undefined,
    });

    const result = await client.getChangeLogs('secret', 100);

    expect(result.events.map((event) => event.activityId)).toEqual(['a1', 'a2']);
    expect(result.latestProcessedAt).toBe(120);
    expect(result.pages).toBe(2);
  });

  it('retries rate limits using Retry-After without exposing the bearer token', async () => {
    let calls: number = 0;
    const delays: number[] = [];
    const client = new LinkedInApiClient({
      fetch: async (): Promise<Response> => {
        calls += 1;
        if (calls === 1) {
          return jsonResponse(429, { message: 'slow down' }, { 'retry-after': '1' });
        }
        return jsonResponse(200, {
          elements: [{ member: 'urn:li:person:self', regulatedAt: 100 }],
        });
      },
      sleep: async (milliseconds: number): Promise<void> => {
        delays.push(milliseconds);
      },
    });

    const authorization = await client.getAuthorization('top-secret-token');

    expect(authorization.memberUrn).toBe('urn:li:person:self');
    expect(delays).toEqual([1_000]);
  });

  it('aborts a stuck request at the configured timeout boundary', async () => {
    const fetch: LinkedInFetch = async (_input: string | URL, init?: RequestInit): Promise<Response> => (
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      })
    );
    const client = new LinkedInApiClient({
      fetch: fetch,
      sleep: async () => undefined,
      maxAttempts: 1,
      timeoutMs: 5,
    });

    await expectAsync(client.getAuthorization('secret')).toBeRejectedWithError(LinkedInToolError);
  });

  it('reports API-version rejection with the centralized configured version', async () => {
    const client = new LinkedInApiClient({
      fetch: async (): Promise<Response> => jsonResponse(426, { message: 'version rejected' }),
      sleep: async () => undefined,
      maxAttempts: 1,
    });

    try {
      await client.getAuthorization('secret');
      fail('Expected version rejection.');
    } catch (error: unknown) {
      expect(error instanceof LinkedInToolError ? error.code : '').toBe('MA-LINKEDIN-API-VERSION');
      expect(error instanceof Error ? error.message : '').toContain('202312');
    }
  });

  it('fails closed when LinkedIn returns a repeated pagination link', async () => {
    const client = new LinkedInApiClient({
      fetch: async (): Promise<Response> => jsonResponse(200, {
        elements: [{ snapshotDomain: 'INBOX', snapshotData: [{ id: 'm1' }] }],
        paging: { links: [{ rel: 'next', href: '/rest/memberSnapshotData?q=criteria&domain=INBOX&start=0&count=10' }] },
      }),
      sleep: async () => undefined,
    });

    await expectAsync(client.getInboxSnapshot('secret')).toBeRejectedWithError(LinkedInToolError);
  });

  it('rejects a snapshot envelope for a domain other than INBOX', async () => {
    const client = new LinkedInApiClient({
      fetch: async (): Promise<Response> => jsonResponse(200, {
        elements: [{ snapshotDomain: 'PROFILE', snapshotData: [] }],
      }),
      sleep: async () => undefined,
    });

    await expectAsync(client.getInboxSnapshot('secret')).toBeRejectedWithError(LinkedInToolError);
  });

  it('rejects malformed authorization envelopes before domain logic', async () => {
    const client = new LinkedInApiClient({
      fetch: async (): Promise<Response> => jsonResponse(200, { notElements: [] }),
      sleep: async () => undefined,
    });

    await expectAsync(client.getAuthorization('secret')).toBeRejectedWithError(LinkedInToolError);
  });

  it('reports only field names when a live response shape differs', async () => {
    const client = new LinkedInApiClient({
      fetch: async (): Promise<Response> => jsonResponse(200, {
        elements: [{ unexpectedMemberField: 'sensitive-value', regulatedAt: 100 }],
      }),
      sleep: async () => undefined,
    });

    try {
      await client.getAuthorization('secret');
      fail('Expected response schema rejection.');
    } catch (error: unknown) {
      const details: unknown = error instanceof LinkedInToolError ? error.details : null;
      expect(details).toEqual(jasmine.objectContaining({
        availableFields: ['regulatedAt', 'unexpectedMemberField'],
        responseShape: {
          type: 'object',
          fields: {
            regulatedAt: 'number',
            unexpectedMemberField: 'string',
          },
        },
      }));
      expect(JSON.stringify(details)).not.toContain('sensitive-value');
    }
  });

  it('accepts the live Member Data Portability authorization key envelope', async () => {
    const client = new LinkedInApiClient({
      fetch: async (): Promise<Response> => jsonResponse(200, {
        elements: [{
          memberComplianceAuthorizationKey: {
            developerApplication: 'urn:li:developerApplication:app',
            member: 'urn:li:person:self',
          },
          memberComplianceScopes: ['INBOX'],
          regulatedAt: 100,
        }],
      }),
      sleep: async () => undefined,
    });

    const authorization = await client.getAuthorization('secret');

    expect(authorization).toEqual({ memberUrn: 'urn:li:person:self', consentAtMs: 100 });
  });
});

function changeEvent(activityId: string, processedAt: number): Record<string, unknown> {
  return {
    activityId: activityId,
    resourceName: 'messages',
    method: 'CREATE',
    processedAt: processedAt,
    activity: {},
    processedActivity: {},
  };
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}
