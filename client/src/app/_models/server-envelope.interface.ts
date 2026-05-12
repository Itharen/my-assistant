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

/** Aggregált dashboard snapshot — tasks + waves + insights + recent captures. */
export interface A_DashboardSnapshot {
  serverTime: string;
  tasks: A_FoTasksResult;
  waves: {
    rangeHours: number;
    series: Record<A_WaveKind, A_WaveRow[]>;
    latest: Partial<Record<A_WaveKind, A_WaveRow>>;
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

/** Insight POST payload — kliens által emit-elt új insight bemeneti shape. */
export interface A_InsightPayload {
  message: string;
  severity?: A_InsightSeverity;
  category?: string;
  source?: string;
}
