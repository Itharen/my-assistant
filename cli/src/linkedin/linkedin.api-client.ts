import { isRecord, requireNonEmptyString } from './linkedin.config.js';
import { LinkedInToolError } from './linkedin.error.js';
import {
  type LinkedInAuthorization,
  type LinkedInChangeLogEvent,
  type LinkedInChangeLogResult,
  type LinkedInSnapshotResult,
} from './linkedin.models.js';

const LINKEDIN_API_ROOT = 'https://api.linkedin.com/rest';
const LINKEDIN_VERSION = '202312';
const MAX_PAGES = 10_000;

export type LinkedInFetch = (input: string | URL, init?: RequestInit) => Promise<Response>;
export type LinkedInSleep = (milliseconds: number) => Promise<void>;

interface JsonResponse {
  status: number;
  body: unknown;
  headers: Headers;
}

export interface LinkedInApiClientOptions {
  fetch?: LinkedInFetch;
  sleep?: LinkedInSleep;
  apiRoot?: string;
  maxAttempts?: number;
  timeoutMs?: number;
}

export class LinkedInApiClient {
  private readonly fetch: LinkedInFetch;
  private readonly sleep: LinkedInSleep;
  private readonly apiRoot: string;
  private readonly maxAttempts: number;
  private readonly timeoutMs: number;

  public constructor(options: LinkedInApiClientOptions = {}) {
    this.fetch = options.fetch ?? globalThis.fetch;
    this.sleep = options.sleep ?? defaultSleep;
    this.apiRoot = options.apiRoot ?? LINKEDIN_API_ROOT;
    this.maxAttempts = options.maxAttempts ?? 3;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    if (!Number.isInteger(this.maxAttempts) || this.maxAttempts < 1 || this.maxAttempts > 10) {
      throw new LinkedInToolError('MA-LINKEDIN-CLIENT-OPTIONS', 'maxAttempts must be an integer between 1 and 10.');
    }
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1 || this.timeoutMs > 300_000) {
      throw new LinkedInToolError('MA-LINKEDIN-CLIENT-OPTIONS', 'timeoutMs must be an integer between 1 and 300000.');
    }
  }

  public async getAuthorization(accessToken: string): Promise<LinkedInAuthorization> {
    const url = new URL(`${this.apiRoot}/memberAuthorizations`);
    url.searchParams.set('q', 'memberAndApplication');
    const response: JsonResponse = await this.getJson(url, accessToken);
    const elements: unknown[] = requireElements(response.body, 'memberAuthorizations');
    if (elements.length === 0) {
      throw new LinkedInToolError(
        'MA-LINKEDIN-NO-CONSENT',
        'LinkedIn returned no active Member Data Portability authorization.',
      );
    }
    const record: Record<string, unknown> = requireRecord(elements[0], 'memberAuthorizations.elements[0]');
    const memberUrn: string = authorizationMemberUrn(record);
    const consentAtMs: number = firstNumber(record, ['regulatedAt', 'consentAt', 'createdAt']);
    return { memberUrn: memberUrn, consentAtMs: consentAtMs };
  }

  public async getInboxSnapshot(accessToken: string, pageSize: number = 10): Promise<LinkedInSnapshotResult> {
    validatePageSize(pageSize, 100, 'snapshot');
    const rows: Record<string, unknown>[] = [];
    const seenUrls: Set<string> = new Set<string>();
    let pages: number = 0;
    let nextUrl: URL | null = snapshotUrl(this.apiRoot, 0, pageSize);

    while (nextUrl !== null) {
      guardPageTraversal(nextUrl, seenUrls, pages);
      let response: JsonResponse;
      try {
        response = await this.getJson(nextUrl, accessToken);
      } catch (error: unknown) {
        if (error instanceof LinkedInToolError && error.code === 'MA-LINKEDIN-NO-DATA') {
          if (pages === 0) {
            throw new LinkedInToolError(
              'MA-LINKEDIN-SNAPSHOT-NOT-READY',
              'LinkedIn snapshot is not ready yet; the existing cache was left untouched.',
              error.details,
            );
          }
          break;
        }
        throw error;
      }
      const elements: unknown[] = requireElements(response.body, 'memberSnapshotData');
      const pageRows: Record<string, unknown>[] = parseSnapshotPage(elements);
      rows.push(...pageRows);
      pages += 1;

      const linkedNext: string | null = findNextLink(response.body);
      if (linkedNext !== null) {
        nextUrl = new URL(linkedNext, this.apiRoot);
      } else {
        nextUrl = snapshotUrl(this.apiRoot, pages, pageSize);
      }
    }

    return { rows: rows, pages: pages, verifiedEmpty: rows.length === 0 };
  }

  public async getChangeLogs(
    accessToken: string,
    startTimeMs: number,
    pageSize: number = 50,
  ): Promise<LinkedInChangeLogResult> {
    validatePageSize(pageSize, 50, 'changelog');
    const events: LinkedInChangeLogEvent[] = [];
    const seenUrls: Set<string> = new Set<string>();
    let pages: number = 0;
    let nextUrl: URL | null = changeLogUrl(this.apiRoot, startTimeMs, pageSize);

    while (nextUrl !== null) {
      guardPageTraversal(nextUrl, seenUrls, pages);
      const response: JsonResponse = await this.getJson(nextUrl, accessToken);
      const elements: unknown[] = requireElements(response.body, 'memberChangeLogs');
      events.push(...elements.map((element: unknown) => parseChangeLogEvent(element)));
      pages += 1;
      const linkedNext: string | null = findNextLink(response.body);
      nextUrl = linkedNext === null ? null : new URL(linkedNext, this.apiRoot);
    }

    const latestProcessedAt: number = events.reduce(
      (latest: number, event: LinkedInChangeLogEvent) => Math.max(latest, event.processedAt),
      startTimeMs,
    );
    return { events: events, pages: pages, latestProcessedAt: latestProcessedAt };
  }

  private async getJson(url: URL, accessToken: string): Promise<JsonResponse> {
    let lastStatus: number | null = null;
    for (let attempt: number = 1; attempt <= this.maxAttempts; attempt += 1) {
      let response: Response;
      const controller = new AbortController();
      const timeout: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        response = await this.fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'LinkedIn-Version': LINKEDIN_VERSION,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        });
      } catch (error: unknown) {
        const normalized: Error = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.maxAttempts) {
          await this.sleep(backoffMilliseconds(attempt));
          continue;
        }
        throw new LinkedInToolError('MA-LINKEDIN-NETWORK', `LinkedIn request failed: ${normalized.message}`, {
          endpoint: safeEndpoint(url),
          attempts: attempt,
        });
      } finally {
        clearTimeout(timeout);
      }
      lastStatus = response.status;
      const body: unknown = await readResponseBody(response);
      if (response.ok) {
        return { status: response.status, body: body, headers: response.headers };
      }
      if (isNoDataResponse(response.status, body)) {
        throw new LinkedInToolError(
          'MA-LINKEDIN-NO-DATA',
          'LinkedIn reports that no snapshot data is available.',
          {
            status: response.status,
            endpoint: safeEndpoint(url),
            response: safeErrorBody(body),
          },
        );
      }
      if (response.status === 401 || response.status === 403) {
        throw new LinkedInToolError(
          'MA-LINKEDIN-AUTH',
          'LinkedIn rejected the token or required Member Data Portability permission is missing.',
          { status: response.status, endpoint: safeEndpoint(url), response: safeErrorBody(body) },
        );
      }
      if (response.status === 426) {
        throw new LinkedInToolError(
          'MA-LINKEDIN-API-VERSION',
          `LinkedIn rejected the configured API version ${LINKEDIN_VERSION}.`,
          { status: response.status, configuredVersion: LINKEDIN_VERSION, endpoint: safeEndpoint(url) },
        );
      }
      if (isRetryableStatus(response.status) && attempt < this.maxAttempts) {
        await this.sleep(retryDelayMilliseconds(response, attempt));
        continue;
      }
      throw new LinkedInToolError('MA-LINKEDIN-HTTP', `LinkedIn API returned HTTP ${response.status}.`, {
        status: response.status,
        endpoint: safeEndpoint(url),
        response: safeErrorBody(body),
        attempts: attempt,
      });
    }
    throw new LinkedInToolError('MA-LINKEDIN-HTTP', 'LinkedIn request exhausted its retry budget.', {
      endpoint: safeEndpoint(url),
      lastStatus: lastStatus,
    });
  }
}

function parseSnapshotPage(elements: unknown[]): Record<string, unknown>[] {
  if (elements.length !== 1) {
    throw new LinkedInToolError(
      'MA-LINKEDIN-RESPONSE-SCHEMA',
      'memberSnapshotData must contain exactly one domain envelope per page.',
      { elementCount: elements.length },
    );
  }
  const envelope: Record<string, unknown> = requireRecord(elements[0], 'memberSnapshotData.elements[0]');
  if (envelope.snapshotDomain !== 'INBOX') {
    throw new LinkedInToolError(
      'MA-LINKEDIN-RESPONSE-SCHEMA',
      'memberSnapshotData returned an unexpected snapshot domain.',
      {
        expectedDomain: 'INBOX',
        observedDomain: typeof envelope.snapshotDomain === 'string'
          ? envelope.snapshotDomain
          : describeType(envelope.snapshotDomain),
      },
    );
  }
  if (!Array.isArray(envelope.snapshotData)) {
    throw new LinkedInToolError(
      'MA-LINKEDIN-RESPONSE-SCHEMA',
      'memberSnapshotData INBOX envelope is missing snapshotData[].',
      { responseShape: describeShape(envelope) },
    );
  }
  return envelope.snapshotData.map(
    (row: unknown) => requireRecord(row, 'memberSnapshotData.elements[0].snapshotData[]'),
  );
}

function authorizationMemberUrn(record: Record<string, unknown>): string {
  const directMember: string | null = optionalFirstString(record, ['member', 'memberUrn', 'owner']);
  if (directMember !== null) {
    return directMember;
  }
  const authorizationKey: unknown = record.memberComplianceAuthorizationKey;
  if (isRecord(authorizationKey)) {
    const nestedMember: string | null = optionalFirstString(authorizationKey, ['member']);
    if (nestedMember !== null) {
      return nestedMember;
    }
  }
  throw new LinkedInToolError(
    'MA-LINKEDIN-RESPONSE-SCHEMA',
    'Missing LinkedIn member identity in the authorization response.',
    {
      expectedFields: ['member', 'memberUrn', 'owner', 'memberComplianceAuthorizationKey.member'],
      availableFields: Object.keys(record).sort(),
      responseShape: describeShape(record),
    },
  );
}

function validatePageSize(pageSize: number, maximum: number, operation: string): void {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > maximum) {
    throw new LinkedInToolError(
      'MA-LINKEDIN-PAGE-SIZE',
      `LinkedIn ${operation} page size must be an integer between 1 and ${maximum}.`,
      { operation: operation, pageSize: pageSize },
    );
  }
}

function snapshotUrl(apiRoot: string, start: number, count: number): URL {
  const url = new URL(`${apiRoot}/memberSnapshotData`);
  url.searchParams.set('q', 'criteria');
  url.searchParams.set('domain', 'INBOX');
  url.searchParams.set('start', String(start));
  url.searchParams.set('count', String(count));
  return url;
}

function changeLogUrl(apiRoot: string, startTimeMs: number, count: number): URL {
  const url = new URL(`${apiRoot}/memberChangeLogs`);
  url.searchParams.set('q', 'memberAndApplication');
  url.searchParams.set('startTime', String(startTimeMs));
  url.searchParams.set('count', String(count));
  return url;
}

function parseChangeLogEvent(value: unknown): LinkedInChangeLogEvent {
  const record: Record<string, unknown> = requireRecord(value, 'memberChangeLogs.elements[]');
  const methodValue: string = optionalString(record.method) ?? 'UNKNOWN';
  const method: LinkedInChangeLogEvent['method'] = isChangeMethod(methodValue) ? methodValue : 'UNKNOWN';
  return {
    activityId: firstString(record, ['activityId']),
    resourceName: firstString(record, ['resourceName']),
    method: method,
    processedAt: firstNumber(record, ['processedAt']),
    activity: isRecord(record.activity) ? record.activity : {},
    processedActivity: isRecord(record.processedActivity) ? record.processedActivity : null,
  };
}

function findNextLink(body: unknown): string | null {
  if (!isRecord(body) || !isRecord(body.paging) || !Array.isArray(body.paging.links)) {
    return null;
  }
  for (const link of body.paging.links) {
    if (isRecord(link) && link.rel === 'next' && typeof link.href === 'string' && link.href.length > 0) {
      return link.href;
    }
  }
  return null;
}

function requireElements(body: unknown, endpoint: string): unknown[] {
  if (!isRecord(body) || !Array.isArray(body.elements)) {
    throw new LinkedInToolError('MA-LINKEDIN-RESPONSE-SCHEMA', `${endpoint} response is missing elements[].`, {
      endpoint: endpoint,
    });
  }
  return body.elements;
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new LinkedInToolError('MA-LINKEDIN-RESPONSE-SCHEMA', `${field} must be an object.`, { field: field });
  }
  return value;
}

function firstString(record: Record<string, unknown>, keys: string[]): string {
  const value: string | null = optionalFirstString(record, keys);
  if (value !== null) {
    return value;
  }
  throw new LinkedInToolError('MA-LINKEDIN-RESPONSE-SCHEMA', `Missing string field: ${keys.join(' or ')}.`, {
    expectedFields: keys,
    availableFields: Object.keys(record).sort(),
    responseShape: describeShape(record),
  });
}

function optionalFirstString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value: unknown = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return null;
}

function firstNumber(record: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value: unknown = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  throw new LinkedInToolError('MA-LINKEDIN-RESPONSE-SCHEMA', `Missing numeric field: ${keys.join(' or ')}.`, {
    expectedFields: keys,
    availableFields: Object.keys(record).sort(),
    responseShape: describeShape(record),
  });
}

function describeShape(value: unknown, depth: number = 0): unknown {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return {
      type: 'array',
      elementTypes: [...new Set<string>(value.map((item: unknown) => describeType(item)))].sort(),
    };
  }
  if (isRecord(value)) {
    if (depth >= 2) {
      return { type: 'object', fields: Object.keys(value).sort() };
    }
    const fields: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      fields[key] = describeShape(value[key], depth + 1);
    }
    return { type: 'object', fields: fields };
  }
  return typeof value;
}

function describeType(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function isChangeMethod(value: string): value is LinkedInChangeLogEvent['method'] {
  return value === 'CREATE'
    || value === 'UPDATE'
    || value === 'PARTIAL_UPDATE'
    || value === 'DELETE'
    || value === 'UNKNOWN';
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text: string = await response.text();
  if (text.length === 0) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 1_000) };
  }
}

function isNoDataResponse(status: number, body: unknown): boolean {
  if (status !== 400 && status !== 404) {
    return false;
  }
  const bodyText: string = JSON.stringify(body).toLowerCase();
  return bodyText.includes('no data') || bodyText.includes('not available') || bodyText.includes('not ready');
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function retryDelayMilliseconds(response: Response, attempt: number): number {
  const retryAfter: string | null = response.headers.get('retry-after');
  if (retryAfter !== null) {
    const seconds: number = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1_000, 60_000);
    }
  }
  return backoffMilliseconds(attempt);
}

function backoffMilliseconds(attempt: number): number {
  return Math.min(500 * (2 ** (attempt - 1)), 5_000);
}

function guardPageTraversal(url: URL, seenUrls: Set<string>, pages: number): void {
  const serialized: string = url.toString();
  if (seenUrls.has(serialized)) {
    throw new LinkedInToolError('MA-LINKEDIN-PAGINATION-LOOP', 'LinkedIn pagination URL repeated.', {
      endpoint: safeEndpoint(url),
      pages: pages,
    });
  }
  if (pages >= MAX_PAGES) {
    throw new LinkedInToolError('MA-LINKEDIN-PAGINATION-LIMIT', 'LinkedIn pagination exceeded the safety limit.', {
      pages: pages,
    });
  }
  seenUrls.add(serialized);
}

function safeEndpoint(url: URL): string {
  return `${url.origin}${url.pathname}`;
}

function safeErrorBody(body: unknown): unknown {
  if (!isRecord(body)) {
    return String(body).slice(0, 1_000);
  }
  const output: Record<string, unknown> = {};
  for (const key of ['status', 'serviceErrorCode', 'code', 'message']) {
    const value: unknown = body[key];
    if (typeof value === 'string' || typeof value === 'number') {
      output[key] = typeof value === 'string' ? value.slice(0, 1_000) : value;
    }
  }
  return output;
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise<void>((resolvePromise: () => void) => setTimeout(resolvePromise, milliseconds));
}
