/** Public loopback DTOs for the My Assistant LinkedIn review workspace. */

export type LinkedInWorkspaceFilter = 'all' | 'unread' | 'needs-reply';
export type LinkedInWorkspaceDraftStatus = 'draft' | 'copied' | 'discarded' | 'manual-send-reported';
export type LinkedInWorkspaceMessageDirection = 'inbound' | 'outbound' | 'unknown';

export interface LinkedInWorkspaceInboxItem {
  threadId: string;
  latestMessageAt: number;
  latestDirection: LinkedInWorkspaceMessageDirection;
  unread: boolean;
  unreadConfidence: 'authoritative' | 'candidate';
  needsReply: boolean;
  messageCount: number;
  counterpartId: string | null;
}

export interface LinkedInWorkspaceInboxResponse {
  items: LinkedInWorkspaceInboxItem[];
  offset: number;
  limit: number;
  total: number;
  nextOffset: number | null;
  filter: LinkedInWorkspaceFilter;
  sinceDays: number;
  cacheUpdatedAt: string;
}

export interface LinkedInWorkspaceMessage {
  id: string;
  direction: LinkedInWorkspaceMessageDirection;
  authorId: string | null;
  content: string;
  createdAt: number;
  deliveredAt: number | null;
  readAt: number | null;
}

export interface LinkedInWorkspaceDraft {
  id: string;
  threadId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  status: LinkedInWorkspaceDraftStatus;
}

export interface LinkedInWorkspaceThreadResponse {
  threadId: string;
  messages: LinkedInWorkspaceMessage[];
  drafts: LinkedInWorkspaceDraft[];
  sendCapability: 'manual-linkedin-ui-only';
}

export interface LinkedInWorkspaceDraftCreateRequest {
  threadId: string;
  body: string;
}

export interface LinkedInWorkspaceDraftStatusRequest {
  draftId: string;
  status: Exclude<LinkedInWorkspaceDraftStatus, 'draft'>;
}

export interface LinkedInWorkspaceDraftReceipt {
  draft: LinkedInWorkspaceDraft;
  deliveryEvidence: 'none-owner-action-required';
}
