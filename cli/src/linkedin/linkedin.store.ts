import { readFile, rm } from 'node:fs/promises';

import { isRecord, pathExists, writeJsonAtomically } from './linkedin.config.js';
import { LinkedInToolError } from './linkedin.error.js';
import {
  createEmptyLinkedInCache,
  LINKEDIN_CACHE_SCHEMA_VERSION,
  type LinkedInCache,
  type LinkedInCalibration,
  type LinkedInDraft,
  type LinkedInMessage,
  type LinkedInMessageDirection,
  type LinkedInProcessedActivity,
} from './linkedin.models.js';

export class LinkedInStore {
  private readonly cachePath: string;

  public constructor(cachePath: string) {
    this.cachePath = cachePath;
  }

  public async load(): Promise<LinkedInCache> {
    if (!(await pathExists(this.cachePath))) {
      return createEmptyLinkedInCache();
    }
    return this.readExisting();
  }

  public async loadRequired(): Promise<LinkedInCache> {
    if (!(await pathExists(this.cachePath))) {
      throw new LinkedInToolError(
        'MA-LINKEDIN-CACHE-NOT-INITIALIZED',
        'LinkedIn inbox cache is not initialized. Run `ma linkedin inbox bootstrap` first.',
        { cachePath: this.cachePath },
      );
    }
    return this.readExisting();
  }

  private async readExisting(): Promise<LinkedInCache> {
    let raw: string;
    try {
      raw = await readFile(this.cachePath, 'utf8');
    } catch (error: unknown) {
      const normalized: Error = error instanceof Error ? error : new Error(String(error));
      throw new LinkedInToolError('MA-LINKEDIN-CACHE-READ', `Cannot read LinkedIn cache: ${normalized.message}`, {
        cachePath: this.cachePath,
      });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error: unknown) {
      const normalized: Error = error instanceof Error ? error : new Error(String(error));
      throw new LinkedInToolError('MA-LINKEDIN-CACHE-JSON', `LinkedIn cache contains invalid JSON: ${normalized.message}`, {
        cachePath: this.cachePath,
      });
    }
    return parseCache(parsed, this.cachePath);
  }

  public async save(cache: LinkedInCache): Promise<void> {
    const next: LinkedInCache = {
      ...cache,
      updatedAt: new Date().toISOString(),
    };
    parseCache(next, this.cachePath);
    await writeJsonAtomically(this.cachePath, next);
  }

  public async purge(): Promise<boolean> {
    const existed: boolean = await pathExists(this.cachePath);
    if (existed) {
      await rm(this.cachePath, { force: true });
    }
    return existed;
  }
}

function parseCache(value: unknown, cachePath: string): LinkedInCache {
  if (!isRecord(value)) {
    throw schemaError('LinkedIn cache must be an object.', cachePath);
  }
  if (value.schemaVersion !== LINKEDIN_CACHE_SCHEMA_VERSION) {
    throw new LinkedInToolError('MA-LINKEDIN-CACHE-VERSION', 'Unsupported LinkedIn cache schema.', {
      cachePath: cachePath,
      supportedVersion: LINKEDIN_CACHE_SCHEMA_VERSION,
      actualVersion: value.schemaVersion,
    });
  }
  return {
    schemaVersion: LINKEDIN_CACHE_SCHEMA_VERSION,
    updatedAt: requireString(value.updatedAt, 'updatedAt', cachePath),
    selfUrn: requireNullableString(value.selfUrn, 'selfUrn', cachePath),
    consentAtMs: requireNullableNumber(value.consentAtMs, 'consentAtMs', cachePath),
    changeCursorMs: requireNullableNumber(value.changeCursorMs, 'changeCursorMs', cachePath),
    processedActivities: requireArray(value.processedActivities, 'processedActivities', cachePath).map(
      (activity: unknown) => parseProcessedActivity(activity, cachePath),
    ),
    messages: requireArray(value.messages, 'messages', cachePath).map(
      (message: unknown) => parseMessage(message, cachePath),
    ),
    rawSnapshotRows: requireArray(value.rawSnapshotRows, 'rawSnapshotRows', cachePath).map(
      (row: unknown) => requireRecord(row, 'rawSnapshotRows[]', cachePath),
    ),
    drafts: requireArray(value.drafts, 'drafts', cachePath).map(
      (draft: unknown) => parseDraft(draft, cachePath),
    ),
    calibration: parseCalibration(value.calibration, cachePath),
  };
}

function parseProcessedActivity(value: unknown, cachePath: string): LinkedInProcessedActivity {
  const record: Record<string, unknown> = requireRecord(value, 'processedActivities[]', cachePath);
  return {
    id: requireString(record.id, 'processedActivities[].id', cachePath),
    processedAt: requireNumber(record.processedAt, 'processedActivities[].processedAt', cachePath),
  };
}

function parseMessage(value: unknown, cachePath: string): LinkedInMessage {
  const record: Record<string, unknown> = requireRecord(value, 'messages[]', cachePath);
  const direction: string = requireString(record.direction, 'messages[].direction', cachePath);
  if (!isDirection(direction)) {
    throw schemaError(`Invalid message direction: ${direction}.`, cachePath);
  }
  const source: string = requireString(record.source, 'messages[].source', cachePath);
  if (source !== 'snapshot' && source !== 'changelog') {
    throw schemaError(`Invalid message source: ${source}.`, cachePath);
  }
  return {
    id: requireString(record.id, 'messages[].id', cachePath),
    threadId: requireString(record.threadId, 'messages[].threadId', cachePath),
    authorId: requireNullableString(record.authorId, 'messages[].authorId', cachePath),
    direction: direction,
    content: requireString(record.content, 'messages[].content', cachePath, true),
    deliveredAt: requireNullableNumber(record.deliveredAt, 'messages[].deliveredAt', cachePath),
    createdAt: requireNumber(record.createdAt, 'messages[].createdAt', cachePath),
    readAt: requireNullableNumber(record.readAt, 'messages[].readAt', cachePath),
    deleted: requireBoolean(record.deleted, 'messages[].deleted', cachePath),
    source: source,
    sourceActivityId: requireNullableString(record.sourceActivityId, 'messages[].sourceActivityId', cachePath),
    rawFingerprint: requireString(record.rawFingerprint, 'messages[].rawFingerprint', cachePath),
  };
}

function parseDraft(value: unknown, cachePath: string): LinkedInDraft {
  const record: Record<string, unknown> = requireRecord(value, 'drafts[]', cachePath);
  const status: string = requireString(record.status, 'drafts[].status', cachePath);
  if (status !== 'draft' && status !== 'copied' && status !== 'discarded') {
    throw schemaError(`Invalid draft status: ${status}.`, cachePath);
  }
  return {
    id: requireString(record.id, 'drafts[].id', cachePath),
    threadId: requireString(record.threadId, 'drafts[].threadId', cachePath),
    body: requireString(record.body, 'drafts[].body', cachePath, true),
    createdAt: requireString(record.createdAt, 'drafts[].createdAt', cachePath),
    updatedAt: requireString(record.updatedAt, 'drafts[].updatedAt', cachePath),
    status: status,
  };
}

function parseCalibration(value: unknown, cachePath: string): LinkedInCalibration {
  const record: Record<string, unknown> = requireRecord(value, 'calibration', cachePath);
  return {
    snapshotSchemaObserved: requireBoolean(record.snapshotSchemaObserved, 'calibration.snapshotSchemaObserved', cachePath),
    directionReliable: requireBoolean(record.directionReliable, 'calibration.directionReliable', cachePath),
    unreadReliable: requireBoolean(record.unreadReliable, 'calibration.unreadReliable', cachePath),
    lastCheckedAt: requireNullableString(record.lastCheckedAt, 'calibration.lastCheckedAt', cachePath),
    notes: requireStringArray(record.notes, 'calibration.notes', cachePath),
  };
}

function isDirection(value: string): value is LinkedInMessageDirection {
  return value === 'inbound' || value === 'outbound' || value === 'unknown';
}

function requireRecord(value: unknown, field: string, cachePath: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw schemaError(`${field} must be an object.`, cachePath);
  }
  return value;
}

function requireArray(value: unknown, field: string, cachePath: string): unknown[] {
  if (!Array.isArray(value)) {
    throw schemaError(`${field} must be an array.`, cachePath);
  }
  return value;
}

function requireString(
  value: unknown,
  field: string,
  cachePath: string,
  allowEmpty: boolean = false,
): string {
  if (typeof value !== 'string' || (!allowEmpty && value.length === 0)) {
    throw schemaError(`${field} must be a string${allowEmpty ? '' : ' with content'}.`, cachePath);
  }
  return value;
}

function requireNullableString(value: unknown, field: string, cachePath: string): string | null {
  return value === null ? null : requireString(value, field, cachePath);
}

function requireNumber(value: unknown, field: string, cachePath: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw schemaError(`${field} must be a finite number.`, cachePath);
  }
  return value;
}

function requireNullableNumber(value: unknown, field: string, cachePath: string): number | null {
  return value === null ? null : requireNumber(value, field, cachePath);
}

function requireBoolean(value: unknown, field: string, cachePath: string): boolean {
  if (typeof value !== 'boolean') {
    throw schemaError(`${field} must be boolean.`, cachePath);
  }
  return value;
}

function requireStringArray(value: unknown, field: string, cachePath: string): string[] {
  return requireArray(value, field, cachePath).map((item: unknown) => requireString(item, `${field}[]`, cachePath));
}

function schemaError(message: string, cachePath: string): LinkedInToolError {
  return new LinkedInToolError('MA-LINKEDIN-CACHE-SCHEMA', message, { cachePath: cachePath });
}
