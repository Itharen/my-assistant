import { createHash } from 'node:crypto';

import { isRecord } from './linkedin.config.js';
import {
  type LinkedInChangeLogEvent,
  type LinkedInMessage,
  type LinkedInMessageDirection,
} from './linkedin.models.js';

const MESSAGE_ID_KEYS: string[] = ['resourceId', 'messageId', 'id', 'entityUrn'];
const THREAD_ID_KEYS: string[] = [
  'thread', 'threadId', 'conversation', 'conversationUrn', 'CONVERSATION ID',
];
const AUTHOR_ID_KEYS: string[] = [
  'author', 'authorId', 'sender', 'from', 'actor', 'SENDER PROFILE URL', 'FROM',
];
const CREATED_AT_KEYS: string[] = ['deliveredAt', 'createdAt', 'sentAt', 'timestamp', 'DATE'];

export function normalizeSnapshotRows(
  rows: Record<string, unknown>[],
  selfIdentifiers: Set<string>,
): LinkedInMessage[] {
  const messages: Map<string, LinkedInMessage> = new Map<string, LinkedInMessage>();
  for (const row of rows) {
    const message: LinkedInMessage = normalizeSnapshotRow(row, selfIdentifiers);
    messages.set(message.id, message);
  }
  return [...messages.values()].sort(compareMessages);
}

export function applyChangeLogEvents(
  existing: LinkedInMessage[],
  events: LinkedInChangeLogEvent[],
  selfIdentifiers: Set<string>,
): LinkedInMessage[] {
  const messages: Map<string, LinkedInMessage> = new Map<string, LinkedInMessage>(
    existing.map((message: LinkedInMessage) => [message.id, message]),
  );
  for (const event of events) {
    if (event.resourceName.toLowerCase() !== 'messages') {
      continue;
    }
    if (event.method === 'UNKNOWN') {
      continue;
    }
    const resource: Record<string, unknown> = event.processedActivity ?? event.activity;
    const id: string = optionalNestedString(resource, MESSAGE_ID_KEYS)
      ?? optionalNestedString(event.activity, MESSAGE_ID_KEYS)
      ?? `activity:${event.activityId}`;
    if (event.method === 'DELETE') {
      const prior: LinkedInMessage | undefined = messages.get(id);
      if (prior) {
        messages.set(id, { ...prior, deleted: true, sourceActivityId: event.activityId });
      } else {
        messages.set(id, makeDeletionPlaceholder(id, event));
      }
      continue;
    }
    const normalized: LinkedInMessage = normalizeChangeEvent(event, resource, id, selfIdentifiers);
    const prior: LinkedInMessage | undefined = messages.get(id);
    messages.set(
      id,
      event.method === 'PARTIAL_UPDATE' && prior
        ? mergePartialMessage(prior, normalized, resource)
        : normalized,
    );
  }
  return [...messages.values()].sort(compareMessages);
}

function mergePartialMessage(
  prior: LinkedInMessage,
  update: LinkedInMessage,
  resource: Record<string, unknown>,
): LinkedInMessage {
  const hasAuthor: boolean = hasNestedKey(resource, AUTHOR_ID_KEYS);
  return {
    ...prior,
    threadId: hasNestedKey(resource, THREAD_ID_KEYS) ? update.threadId : prior.threadId,
    authorId: hasAuthor ? update.authorId : prior.authorId,
    direction: hasAuthor ? update.direction : prior.direction,
    content: hasNestedKey(resource, ['content', 'text', 'body', 'message']) ? update.content : prior.content,
    deliveredAt: hasNestedKey(resource, ['deliveredAt']) ? update.deliveredAt : prior.deliveredAt,
    createdAt: hasNestedKey(resource, CREATED_AT_KEYS) ? update.createdAt : prior.createdAt,
    readAt: hasNestedKey(resource, ['readAt', 'seenAt']) ? update.readAt : prior.readAt,
    deleted: false,
    source: 'changelog',
    sourceActivityId: update.sourceActivityId,
    rawFingerprint: update.rawFingerprint,
  };
}

function normalizeSnapshotRow(row: Record<string, unknown>, selfIdentifiers: Set<string>): LinkedInMessage {
  const fingerprint: string = fingerprintRecord(row);
  const id: string = optionalNestedString(row, MESSAGE_ID_KEYS) ?? `snapshot:${fingerprint}`;
  const threadId: string = optionalNestedString(row, THREAD_ID_KEYS) ?? `unresolved:${id}`;
  const authorId: string | null = optionalNestedString(row, AUTHOR_ID_KEYS);
  const createdAt: number = optionalNestedNumber(row, CREATED_AT_KEYS) ?? 0;
  const deliveredAt: number | null = optionalNestedNumber(row, ['deliveredAt']);
  const readAt: number | null = optionalNestedNumber(row, ['readAt', 'seenAt']);
  return {
    id: id,
    threadId: threadId,
    authorId: authorId,
    direction: inferDirection(authorId, selfIdentifiers),
    content: extractContent(row),
    deliveredAt: deliveredAt,
    createdAt: createdAt,
    readAt: readAt,
    deleted: false,
    source: 'snapshot',
    sourceActivityId: null,
    rawFingerprint: fingerprint,
  };
}

function normalizeChangeEvent(
  event: LinkedInChangeLogEvent,
  resource: Record<string, unknown>,
  id: string,
  selfIdentifiers: Set<string>,
): LinkedInMessage {
  const authorId: string | null = optionalNestedString(resource, AUTHOR_ID_KEYS);
  const createdAt: number = optionalNestedNumber(resource, CREATED_AT_KEYS) ?? event.processedAt;
  return {
    id: id,
    threadId: optionalNestedString(resource, THREAD_ID_KEYS) ?? `unresolved:${id}`,
    authorId: authorId,
    direction: inferDirection(authorId, selfIdentifiers),
    content: extractContent(resource),
    deliveredAt: optionalNestedNumber(resource, ['deliveredAt']),
    createdAt: createdAt,
    readAt: optionalNestedNumber(resource, ['readAt', 'seenAt']),
    deleted: false,
    source: 'changelog',
    sourceActivityId: event.activityId,
    rawFingerprint: fingerprintRecord(resource),
  };
}

function makeDeletionPlaceholder(id: string, event: LinkedInChangeLogEvent): LinkedInMessage {
  return {
    id: id,
    threadId: `unresolved:${id}`,
    authorId: null,
    direction: 'unknown',
    content: '',
    deliveredAt: null,
    createdAt: event.processedAt,
    readAt: null,
    deleted: true,
    source: 'changelog',
    sourceActivityId: event.activityId,
    rawFingerprint: fingerprintRecord(event.activity),
  };
}

function inferDirection(authorId: string | null, selfIdentifiers: Set<string>): LinkedInMessageDirection {
  if (authorId === null) {
    return 'unknown';
  }
  return selfIdentifiers.has(authorId) ? 'outbound' : 'inbound';
}

function extractContent(record: Record<string, unknown>): string {
  const direct: string | null = optionalNestedString(record, ['text', 'body', 'message', 'CONTENT']);
  if (direct !== null) {
    return direct;
  }
  const content: unknown = findNestedValue(record, 'content');
  if (typeof content === 'string') {
    return content;
  }
  if (isRecord(content)) {
    return optionalNestedString(content, ['text', 'body', 'message']) ?? JSON.stringify(content);
  }
  return '';
}

function optionalNestedString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value: unknown = findNestedValue(record, key);
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return null;
}

function optionalNestedNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value: unknown = findNestedValue(record, key);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.length > 0) {
      const parsed: number = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
      const timestamp: number = Date.parse(value);
      if (Number.isFinite(timestamp)) {
        return timestamp;
      }
    }
  }
  return null;
}

function findNestedValue(record: Record<string, unknown>, key: string, depth: number = 0): unknown {
  if (key in record) {
    return record[key];
  }
  if (depth >= 3) {
    return undefined;
  }
  for (const value of Object.values(record)) {
    if (isRecord(value)) {
      const result: unknown = findNestedValue(value, key, depth + 1);
      if (result !== undefined) {
        return result;
      }
    }
  }
  return undefined;
}

function hasNestedKey(record: Record<string, unknown>, keys: string[], depth: number = 0): boolean {
  if (keys.some((key: string) => key in record)) {
    return true;
  }
  if (depth >= 3) {
    return false;
  }
  return Object.values(record).some((value: unknown) => (
    isRecord(value) && hasNestedKey(value, keys, depth + 1)
  ));
}

function fingerprintRecord(record: Record<string, unknown>): string {
  return createHash('sha256').update(stableStringify(record)).digest('hex');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item: unknown) => stableStringify(item)).join(',')}]`;
  }
  if (isRecord(value)) {
    const entries: string[] = Object.keys(value)
      .sort()
      .map((key: string) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

function compareMessages(left: LinkedInMessage, right: LinkedInMessage): number {
  return left.createdAt - right.createdAt || left.id.localeCompare(right.id);
}
