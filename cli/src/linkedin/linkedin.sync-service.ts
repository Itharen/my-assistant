import { type LinkedInChangeLogResult, type LinkedInConfig } from './linkedin.models.js';
import { LinkedInToolError } from './linkedin.error.js';
import { LinkedInApiClient } from './linkedin.api-client.js';
import { applyChangeLogEvents, normalizeSnapshotRows } from './linkedin.normalizer.js';
import { type LinkedInSecretProvider } from './linkedin.secret-provider.js';
import { LinkedInStore } from './linkedin.store.js';

export interface LinkedInBootstrapResult {
  written: boolean;
  pages: number;
  snapshotRows: number;
  messages: number;
  duplicateRows: number;
  unresolvedMessages: number;
  verifiedEmpty: boolean;
  terminalReason: 'verified-empty' | 'no-data-after-pages';
  memberIdentityAvailable: boolean;
  consentAtMs: number;
}

export interface LinkedInSyncResult {
  written: boolean;
  pages: number;
  receivedEvents: number;
  appliedEvents: number;
  skippedDuplicateEvents: number;
  createdEvents: number;
  updatedEvents: number;
  deletedEvents: number;
  unsupportedEvents: number;
  messages: number;
  previousCursorMs: number;
  nextCursorMs: number;
}

export class LinkedInSyncService {
  private readonly api: LinkedInApiClient;
  private readonly secrets: LinkedInSecretProvider;
  private readonly store: LinkedInStore;
  private readonly config: LinkedInConfig;

  public constructor(
    api: LinkedInApiClient,
    secrets: LinkedInSecretProvider,
    store: LinkedInStore,
    config: LinkedInConfig,
  ) {
    this.api = api;
    this.secrets = secrets;
    this.store = store;
    this.config = config;
  }

  public async bootstrap(write: boolean = true): Promise<LinkedInBootstrapResult> {
    const accessToken: string = await this.secrets.getAccessToken(this.config);
    const authorization = await this.api.getAuthorization(accessToken);
    const snapshot = await this.api.getInboxSnapshot(accessToken);
    const oldCache = await this.store.load();
    const selfIdentifiers: Set<string> = new Set<string>([
      authorization.memberUrn,
      ...this.config.selfIdentifiers,
    ]);
    const messages = normalizeSnapshotRows(snapshot.rows, selfIdentifiers);
    const nextCache = {
      ...oldCache,
      selfUrn: authorization.memberUrn,
      consentAtMs: authorization.consentAtMs,
      changeCursorMs: authorization.consentAtMs,
      processedActivities: [],
      messages: messages,
      rawSnapshotRows: snapshot.rows,
      calibration: {
        ...oldCache.calibration,
        snapshotSchemaObserved: snapshot.rows.length > 0,
        directionReliable: messages.length > 0 && messages.every((message) => message.direction !== 'unknown'),
        unreadReliable: false,
        lastCheckedAt: new Date().toISOString(),
        notes: snapshot.rows.length === 0
          ? ['LinkedIn returned a verified empty INBOX snapshot.']
          : ['Snapshot schema observed; unread semantics still require live calibration.'],
      },
    };
    if (write) {
      await this.store.save(nextCache);
    }
    return {
      written: write,
      pages: snapshot.pages,
      snapshotRows: snapshot.rows.length,
      messages: messages.length,
      duplicateRows: snapshot.rows.length - messages.length,
      unresolvedMessages: messages.filter((message) => message.direction === 'unknown').length,
      verifiedEmpty: snapshot.verifiedEmpty,
      terminalReason: snapshot.verifiedEmpty ? 'verified-empty' : 'no-data-after-pages',
      memberIdentityAvailable: authorization.memberUrn.length > 0,
      consentAtMs: authorization.consentAtMs,
    };
  }

  public async sync(write: boolean = true): Promise<LinkedInSyncResult> {
    const cache = await this.store.load();
    if (cache.selfUrn === null || cache.changeCursorMs === null) {
      throw new LinkedInToolError(
        'MA-LINKEDIN-BOOTSTRAP-REQUIRED',
        'LinkedIn inbox has not been bootstrapped. Run `ma linkedin inbox bootstrap`.',
      );
    }
    const accessToken: string = await this.secrets.getAccessToken(this.config);
    let changes: LinkedInChangeLogResult;
    try {
      changes = await this.api.getChangeLogs(accessToken, cache.changeCursorMs);
    } catch (error: unknown) {
      const normalized: Error = error instanceof Error ? error : new Error(String(error));
      throw new LinkedInToolError(
        'MA-LINKEDIN-SYNC-INTERRUPTED',
        'LinkedIn incremental sync did not complete; the previous cache and cursor were preserved.',
        {
          resumeFromMs: cache.changeCursorMs,
          causeCode: error instanceof LinkedInToolError ? error.code : normalized.name,
          cause: normalized.message,
        },
      );
    }
    const processedIds: Set<string> = new Set<string>(
      cache.processedActivities.map((activity) => activity.id),
    );
    const seenInBatch: Set<string> = new Set<string>();
    const freshEvents = changes.events.filter((event) => {
      if (processedIds.has(event.activityId) || seenInBatch.has(event.activityId)) {
        return false;
      }
      seenInBatch.add(event.activityId);
      return true;
    });
    const selfIdentifiers: Set<string> = new Set<string>([cache.selfUrn, ...this.config.selfIdentifiers]);
    const messages = applyChangeLogEvents(cache.messages, freshEvents, selfIdentifiers);
    const retentionStartMs: number = changes.latestProcessedAt - (28 * 24 * 60 * 60 * 1_000);
    const nextProcessedActivities = [
      ...cache.processedActivities,
      ...freshEvents.map((event) => ({ id: event.activityId, processedAt: event.processedAt })),
    ].filter((activity) => activity.processedAt >= retentionStartMs);
    const nextCache = {
      ...cache,
      messages: messages,
      processedActivities: nextProcessedActivities,
      changeCursorMs: changes.latestProcessedAt,
    };
    if (write) {
      await this.store.save(nextCache);
    }
    return {
      written: write,
      pages: changes.pages,
      receivedEvents: changes.events.length,
      appliedEvents: freshEvents.length,
      skippedDuplicateEvents: changes.events.length - freshEvents.length,
      createdEvents: freshEvents.filter((event) => event.method === 'CREATE').length,
      updatedEvents: freshEvents.filter((event) => (
        event.method === 'UPDATE' || event.method === 'PARTIAL_UPDATE'
      )).length,
      deletedEvents: freshEvents.filter((event) => event.method === 'DELETE').length,
      unsupportedEvents: freshEvents.filter((event) => (
        event.method === 'UNKNOWN' || event.resourceName.toLowerCase() !== 'messages'
      )).length,
      messages: messages.length,
      previousCursorMs: cache.changeCursorMs,
      nextCursorMs: changes.latestProcessedAt,
    };
  }
}
