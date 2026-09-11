/** Public loopback DTOs for the My Assistant LinkedIn review workspace. */

export type LinkedInWorkspaceFilter = 'all' | 'unread' | 'needs-reply' | 'review-needed';
export type LinkedInWorkspaceDraftStatus = 'draft' | 'copied' | 'discarded' | 'manual-send-reported';
export type LinkedInWorkspaceMessageDirection = 'inbound' | 'outbound' | 'unknown';
export type LinkedInWorkspaceSemanticCategory =
  | 'actionable'
  | 'priority-direct-project'
  | 'clarification-needed'
  | 'closed-no-reply'
  | 'automated-ignore'
  | 'duplicate-opportunity'
  | 'snoozed'
  | 'sent-confirmed';

export interface LinkedInWorkspaceInboxItem {
  threadId: string;
  latestMessageAt: number;
  latestDirection: LinkedInWorkspaceMessageDirection;
  unread: boolean;
  unreadConfidence: 'authoritative' | 'candidate';
  technicalNeedsReplyCandidate: boolean;
  needsReply: boolean;
  reviewState: 'fresh' | 'stale' | 'unreviewed';
  semanticCategory: LinkedInWorkspaceSemanticCategory | null;
  semanticConfidence: 'high' | 'medium' | 'low' | null;
  semanticReason: string | null;
  messageCount: number;
  counterpartId: string | null;
  draftCount: number;
  currentDraftCount: number;
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
  origin: 'agent' | 'owner';
  basedOnMessageId: string | null;
  currentForLatestMessage: boolean;
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

/**
 * 🔗 Egy profil-mező a frissítési felületen.
 *
 * > **Owner, 2026-09-11 01:52:** *„adhatnál majd egy felületet, meg valami **easy to use,
 * > copy-paste-es megoldást**, ugye azt sem tudjuk automatizálni teljesen."*
 *
 * ⭐ A LinkedIn API **csak olvas** ⇒ a profilt nem írjuk át; a felület a **súrlódás-mentes
 * átvitelt** adja: mezőnként a mostani és a javasolt szöveg, mezőnként vágólapra, mezőnként pipa.
 */
export interface LinkedInProfileField {
  key: string;
  /** Ahogy a LinkedIn-en hívják — ⚠️ azon a néven keresse, ahol beilleszti. */
  label: string;
  /** A LinkedIn karakter-korlátja *(headline 220 · about 2600)*. */
  limit: number;
  current: string;
  /** ⚠️ Üres, ha az asszisztens még nem írta meg a javaslatot. */
  proposed: string;
  currentLength: number;
  proposedLength: number;
  /** 🔴 Túllóg-e — ⭐ ITT derül ki, ⛔ nem a beillesztésnél. */
  isOverLimit: boolean;
  /** Van-e egyáltalán mit beilleszteni *(van javaslat, és MÁS, mint a mostani)*. */
  hasChange: boolean;
  /** ✅ Az owner már beillesztette. */
  isPasted: boolean;
}

/** 🔗 A profil-frissítés összesítése. */
export interface LinkedInProfileUpdatePlan {
  fields: LinkedInProfileField[];
  changeCount: number;
  pastedCount: number;
  overLimitCount: number;
  isComplete: boolean;
  /** ⚠️ Megvan-e egyáltalán a javaslat — ⛔ a hiánya NEM hiba. */
  hasProposal: boolean;
}

/** 🔗 A „beillesztettem" jelölés kérése. */
export interface LinkedInProfilePastedRequest {
  key: string;
  isPasted: boolean;
}
