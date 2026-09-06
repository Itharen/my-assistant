// CCAP CC-session adatmodellek — csak azok a mezők, amiket ténylegesen használunk.
//
// Forrás: élő mérés a futó CCAP szerveren (2026-09-06),
// `GET /api/cc-session` és `GET /api/cc-session/:id/inspect`.

/** Egy CC session a CCAP `GET /api/cc-session` listájából. */
export interface CcapCcSession {
  /** A CC session azonosítója, pl. `ccs-6f25a888-mtp9a8cx`. */
  sessionId: string;
  /** Ember-olvasható címke, pl. `My Assistant`. */
  label: string;
  workspacePath: string;
  status: string;
  /**
   * A Claude Code session azonosítója. ⭐ EZ a kapcsolóelem: a futó agent
   * `CLAUDE_CODE_SESSION_ID` környezeti változója ezzel egyezik meg.
   */
  claudeSessionId: string;
  isArchived: boolean;
}

/** A saját magunk azonosítása — a Discord-híd ezt használja címzéshez. */
export interface CcapSelfIdentity {
  /** A saját CC session azonosítóm a CCAP-ban. */
  sessionId: string;
  label: string;
  workspacePath: string;
  /** A CCAP instance azonosítója (`inspect` → `ccapId`). */
  ccapId: string;
  /** A Claude Code session azonosító, amivel megtaláltam magam. */
  claudeSessionId: string;
}

/**
 * A session futás-állapota — a KÖTEGELŐ ebből dönti el, hogy szabad vagyok-e.
 *
 * Owner-követelmény (2026-09-06): a Discord-üzeneteket a MI oldalunkon kötegeljük
 * egyetlen prompttá, mert „minden egyes prompt egy hosszabb futást eredményez".
 */
export interface CcapSessionRuntime {
  sessionId: string;
  ccapId: string;
  status: string;
  /** ⭐ Ha igaz, épp dolgozom → a köteg VÁR. */
  isBusyProcessing: boolean;
  /** Hány elem áll a CCAP saját sorában (normál esetben 0 vagy 1). */
  queuedItemCount: number;
  /** A CCAP sora zárolva van-e. */
  isQueueLocked: boolean;
}

/** A `POST /api/cc-session/:id/prompt` válasza — sorba került-e, vagy azonnal ment. */
export interface CcapPromptResult {
  /** Igaz, ha a CCAP sorba tette (a session foglalt volt). */
  queued: boolean;
  /** A nyers válasz — hibakereséshez megőrizzük. */
  raw: unknown;
}
