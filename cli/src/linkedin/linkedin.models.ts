export const LINKEDIN_CACHE_SCHEMA_VERSION: '1.0.0' = '1.0.0';
export const LINKEDIN_CONFIG_SCHEMA_VERSION: '1.1.0' = '1.1.0';

export type LinkedInMessageDirection = 'inbound' | 'outbound' | 'unknown';
export type LinkedInUnreadConfidence = 'authoritative' | 'candidate';
export type LinkedInCredentialSource = 'environment' | 'fdp-keystore';

export interface LinkedInConfig {
  schemaVersion: typeof LINKEDIN_CONFIG_SCHEMA_VERSION;
  credentialSource: LinkedInCredentialSource;
  accessTokenKey: string;
  fdpProject: string | null;
  fdpBranch: string | null;
  fdpEnvironment: 'test' | 'prod' | null;
  selfIdentifiers: string[];
}

export interface LinkedInMessage {
  id: string;
  threadId: string;
  authorId: string | null;
  direction: LinkedInMessageDirection;
  content: string;
  deliveredAt: number | null;
  createdAt: number;
  readAt: number | null;
  deleted: boolean;
  source: 'snapshot' | 'changelog';
  sourceActivityId: string | null;
  rawFingerprint: string;
}

export interface LinkedInDraft {
  id: string;
  threadId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  status: LinkedInDraftStatus;
}

export type LinkedInDraftStatus = 'draft' | 'copied' | 'discarded' | 'manual-send-reported';

export interface LinkedInCalibration {
  snapshotSchemaObserved: boolean;
  directionReliable: boolean;
  unreadReliable: boolean;
  lastCheckedAt: string | null;
  notes: string[];
}

export interface LinkedInCache {
  schemaVersion: typeof LINKEDIN_CACHE_SCHEMA_VERSION;
  updatedAt: string;
  selfUrn: string | null;
  consentAtMs: number | null;
  changeCursorMs: number | null;
  processedActivities: LinkedInProcessedActivity[];
  messages: LinkedInMessage[];
  rawSnapshotRows: Record<string, unknown>[];
  drafts: LinkedInDraft[];
  calibration: LinkedInCalibration;
}

export interface LinkedInAuthorization {
  memberUrn: string;
  consentAtMs: number;
}

export interface LinkedInSnapshotResult {
  rows: Record<string, unknown>[];
  pages: number;
  verifiedEmpty: boolean;
}

export interface LinkedInChangeLogEvent {
  activityId: string;
  resourceName: string;
  method: 'CREATE' | 'UPDATE' | 'PARTIAL_UPDATE' | 'DELETE' | 'UNKNOWN';
  processedAt: number;
  activity: Record<string, unknown>;
  processedActivity: Record<string, unknown> | null;
}

export interface LinkedInChangeLogResult {
  events: LinkedInChangeLogEvent[];
  pages: number;
  latestProcessedAt: number;
}

export interface LinkedInInboxSummary {
  threadId: string;
  latestMessageId: string;
  latestMessageAt: number;
  latestDirection: LinkedInMessageDirection;
  unread: boolean;
  unreadConfidence: LinkedInUnreadConfidence;
  needsReply: boolean;
  classificationRuleVersion: '1.0.0';
  messageCount: number;
}

export interface LinkedInProcessedActivity {
  id: string;
  processedAt: number;
}

export function createEmptyLinkedInCache(now: Date = new Date()): LinkedInCache {
  return {
    schemaVersion: LINKEDIN_CACHE_SCHEMA_VERSION,
    updatedAt: now.toISOString(),
    selfUrn: null,
    consentAtMs: null,
    changeCursorMs: null,
    processedActivities: [],
    messages: [],
    rawSnapshotRows: [],
    drafts: [],
    calibration: {
      snapshotSchemaObserved: false,
      directionReliable: false,
      unreadReliable: false,
      lastCheckedAt: null,
      notes: [],
    },
  };
}
