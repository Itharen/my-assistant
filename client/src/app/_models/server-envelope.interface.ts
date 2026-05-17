// Wire shapes from the DyNTS/FDP-pattern server. DyFM_Metadata-based rows
// expose `_id` (Mongo ObjectId stringified) + `__created`/`__updated` ISO
// strings — clients reference these instead of legacy `id`/`ts`.

/** A DyNTS/FDP-pattern szerver "ok" envelope-ja generikus result-tal. */
export interface A_ServerEnvelopeOk<T> {
  ok: true;
  action: string;
  requestId: string;
  elapsedMs: number;
  result: T;
}

/** A DyNTS/FDP-pattern szerver "fail" envelope-ja standard error code+message-szel. */
export interface A_ServerEnvelopeFail {
  ok: false;
  action: string;
  requestId: string;
  elapsedMs: number;
  error: { code: string; message: string; details?: unknown };
}

export type A_ServerEnvelope<T = unknown> = A_ServerEnvelopeOk<T> | A_ServerEnvelopeFail;

// ── DyFM-Metadata baseline ────────────────────────────────────────────────────

/** DyFM_Metadata-alapú szerver row közös wire-mezői (`_id`, `__created`, `__updated`). */
export interface A_DyFMRow {
  _id: string;
  __created: string;
  __updated?: string;
}

// ── Status (legacy /status endpoint, may be removed in Phase 3) ──────────────

/** Legacy `/status` endpoint snapshot — uptime + tick + activity (Phase 3-ban deprecated). */
export interface A_StatusSnapshot {
  serverTime: string;
  uptimeSeconds: number;
  ticksToday: number;
  latestTick: unknown | null;
  activity: { latestSample: unknown | null; isAfk: boolean; isLikelyAsleep: boolean };
  recentActions: unknown[];
}

// ── Dashboard / Wave / Insight / Capture ──────────────────────────────────────

/** Wave kategória taxonómia kliens-oldalon — astral / mental / matter. */
export enum A_WaveKind { astral = 'astral', mental = 'mental', matter = 'matter' }

/** Wave time-series sample wire shape. */
export interface A_WaveRow extends A_DyFMRow {
  kind: A_WaveKind;
  value: number;
  source?: string;
  note?: string;
}

/** Insight súlyossági fokozat taxonómia kliens-oldalon. */
export enum A_InsightSeverity { info = 'info', notice = 'notice', warn = 'warn', urgent = 'urgent' }

/** Insight wire shape — agent-emitted megfigyelés a kliensnek megjelenítve. */
export interface A_InsightRow extends A_DyFMRow {
  severity: A_InsightSeverity;
  message: string;
  category?: string;
  source: string;
  dismissedAt?: string;
}

/** Capture kind taxonómia kliens-oldalon. */
export enum A_CaptureKind { text = 'text', energy = 'energy', mood = 'mood', voice = 'voice' }

/** Capture wire shape — quick-input bin row. */
export interface A_CaptureRow extends A_DyFMRow {
  kind: A_CaptureKind;
  text?: string;
  astral?: number;
  mental?: number;
  matter?: number;
  moodScore?: number;
}

/** Egyetlen `fo`-CLI task wire shape a dashboard task-widget-hez. */
export interface A_FoTaskItem {
  ref: string;
  title: string;
  priority: number | null;
  status: string | null;
  dueDate: string | null;
  done: boolean;
}

/** Az organizer-tasks integration eredménye — available flag + items vagy error. */
export interface A_FoTasksResult {
  available: boolean;
  items: A_FoTaskItem[];
  error?: string;
}

/**
 * Latest mood/vector/note kontextus a hullám-paneljéhez. Csak JSONL-fallback
 * path-en populated (FR #3b-WAVE-UI Phase 2.B+2.C). A normál `/dashboard/snapshot`
 * útvonalon `null` mert a `Wave` DB schema nem tartalmaz mood/vector mezőt
 * (Phase 4 előtt schema-bővítés kell).
 */
export interface A_WaveContext {
  ts: string;
  vector: A_WaveVector | null;
  vectorEmoji: string;
  mood: string | null;
  note: string | null;
}

/** Aggregált dashboard snapshot — tasks + waves + insights + recent captures. */
export interface A_DashboardSnapshot {
  serverTime: string;
  tasks: A_FoTasksResult;
  waves: {
    rangeHours: number;
    series: Record<A_WaveKind, A_WaveRow[]>;
    latest: Partial<Record<A_WaveKind, A_WaveRow>>;
    context?: A_WaveContext;
  };
  insights: { count: number; items: A_InsightRow[] };
  recentCaptures: { count: number; items: A_CaptureRow[] };
}

/** Capture POST payload — kliens által küldött új capture bemeneti shape. */
export interface A_CapturePayload {
  kind: A_CaptureKind;
  text?: string;
  astral?: number;
  mental?: number;
  matter?: number;
  moodScore?: number;
}

/** Wave POST payload — kliens által küldött manuális wave sample. */
export interface A_WavePayload {
  kind: A_WaveKind;
  value: number;
  source?: string;
  note?: string;
}

// ── Wave JSONL fallback (FR #3b-WAVE-UI Phase 2.A, AUTH BLOCKER bypass) ───────

/** Hullám-vektor irány — JSONL-fallback path-en megőrzött szándék-mező. */
export type A_WaveVector = 'up' | 'down' | 'flat';

/**
 * JSONL-fallback wave row — `GET /api/wave/get-from-jsonl` (unauth) válaszában.
 * Mood + vector még nincs a `Wave` DB schema-ban (Phase 4 előtt schema-bővítés
 * kell), tehát ezeket csak JSONL-path-en kapjuk meg.
 */
export interface A_WaveJsonl_Row {
  ts: string;
  kind: A_WaveKind;
  value: number;
  level: string;
  vector: A_WaveVector | null;
  mood: string | null;
  note: string | null;
}

/** `GET /api/wave/get-from-jsonl` válasz-shape — `{ rows: A_WaveJsonl_Row[] }`. */
export interface A_WaveJsonlResponse {
  rows: A_WaveJsonl_Row[];
}

/** A 3×3 szint-skála kliens-oldali kanonikus értékkészlete (server `ALLOWED_LEVELS`-szel egyezik). */
export type A_WaveLevel =
  | 'very-low' | 'low' | 'low-mid' | 'mid' | 'mid+' | 'normal' | 'high' | 'very-high';

/**
 * `POST /api/wave/log-public` body — kliens-form payload. Server-side a
 * `WaveJsonlSnapshot_Payload` interface-tükre (egyezőség kötelező).
 */
export interface A_WaveJsonlSnapshotPayload {
  astral?: A_WaveLevel;
  mental?: A_WaveLevel;
  material?: A_WaveLevel;
  wave_vector?: A_WaveVector;
  mood?: string;
  note?: string;
}

/** `POST /api/wave/log-public` válasz-shape — sikeres append vagy validáció-hiba envelope. */
export type A_WaveJsonlAppendResponse =
  | { ok: true; ts: string }
  | { ok: false; errorCode: string; message: string };

/** FR #3b-WAVE-UI Phase 5e (cycle 88): action-log szűrt wave-marker kind. */
export type A_WaveMarkerKind = 'törés' | 'megoszló-erő' | '3x3-trigger';

/** Egy action-log-eredetű wave-marker rekord (server side `WaveMarkers_Controller`-ből). */
export interface A_WaveMarker_Row {
  ts: string;
  kind: A_WaveMarkerKind;
  subtype: string;
  summary: string;
  durationMin: number;
}

/** `GET /api/wave/markers` válasz-shape. */
export interface A_WaveMarkers_Response {
  rows: A_WaveMarker_Row[];
  sinceMs: number;
  untilMs: number;
}

/** FR #3g Reports panel Phase 1 (cycle 96): FR-board row shape. */
export interface A_ReportFr_Row {
  id: string;
  title: string;
  status: string;
  lastModifiedMs: number;
}

/** Cycle archív row shape. */
export interface A_ReportCycle_Row {
  cycleId: number;
  date: string;
  title: string;
  commitSha: string;
  filePath: string;
}

/** Recent ship row shape (action-log kind:'ship'). */
export interface A_ReportShip_Row {
  ts: string;
  actor: string;
  summary: string;
  ref: string;
  loc_delta: string;
  ldp: string;
}

/** FR #3g Phase 2 (cycle 98): Dev I/O panel — STATUS_DEV snapshot. */
export interface A_ReportStatusDev_Snapshot {
  cycle: number | null;
  phase: string;
  phaseNotes: string;
  lastCycleId: number | null;
  lastCycleSha: string;
  activePlan: string;
  activePlanStep: string;
  raw: string;
}

/** Action-log row Dev I/O activity feed-hez. */
export interface A_ReportAgentLog_Row {
  ts: string;
  actor: string;
  kind: string;
  summary: string;
  ref: string;
}

/** AGENT_BUS bejegyzés. */
export interface A_ReportAgentBus_Row {
  id: string;
  status: 'OPEN' | 'ANSWERED' | 'ACTED' | 'DROPPED' | 'UNKNOWN';
  title: string;
  from: string;
  to: string;
  kind: string;
  created: string;
  updated: string;
  preview: string;
}

/** Insight POST payload — kliens által emit-elt új insight bemeneti shape. */
export interface A_InsightPayload {
  message: string;
  severity?: A_InsightSeverity;
  category?: string;
  source?: string;
}
