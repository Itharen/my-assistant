// Shell-out helper for reading tasks from the organizer test env via the
// global `fo` CLI. The CLI emits a JSON envelope on stdout — we parse, normalise,
// return a short list. Failures degrade to `available=false` so the dashboard
// never breaks when organizer is down.
//
// Note: top-level function (not a static-util class) — chosen for consistency
// with other shell-out helpers in the workspace where shell I/O is the sole
// concern; if my-assistant later grows a static util suite, this gets folded in.

import { execFileSync } from 'child_process';

/** Egy normalizált organizer task — minimális mezőkkel a dashboard task-widget-hez. */
export interface FoTaskItem_Interface {
  ref: string;
  title: string;
  priority: number | null;
  status: string | null;
  dueDate: string | null;
  done: boolean;
}

/** A `readOrganizerTasks` helper eredménye — available flag + items vagy error message. */
export interface FoTasksResult_Interface {
  available: boolean;
  items: FoTaskItem_Interface[];
  error?: string;
}

interface FoEnvelope_Interface<T> {
  ok: boolean;
  result?: T;
  error?: { code: string; message: string };
}

interface FoTasksRaw_Interface {
  items?: unknown[];
  data?: unknown[];
  tasks?: unknown[];
}

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const p: FoTasksRaw_Interface = payload as FoTasksRaw_Interface;

    if (Array.isArray(p.items)) {
      return p.items;
    }

    if (Array.isArray(p.data)) {
      return p.data;
    }

    if (Array.isArray(p.tasks)) {
      return p.tasks;
    }
  }

  return [];
}

function pickString(o: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k];

    if (typeof v === 'string' && v.length > 0) {
      return v;
    }
  }

  return null;
}

function pickNumber(o: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = o[k];

    if (typeof v === 'number' && Number.isFinite(v)) {
      return v;
    }
  }

  return null;
}

function normalise(raw: unknown): FoTaskItem_Interface | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const o: Record<string, unknown> = raw as Record<string, unknown>;
  const ref: string | null = pickString(o, 'ref', 'id', '_id');
  const title: string | null = pickString(o, 'title', 'name', 'summary');

  if (!ref || !title) {
    return null;
  }
  const status: string | null = pickString(o, 'status', 'state');

  return {
    ref,
    title,
    priority: pickNumber(o, 'priority', 'prio'),
    status,
    dueDate: pickString(o, 'dueDate', 'due', 'due_at'),
    done: status === 'done' || status === 'completed' || o.done === true,
  };
}

/** Az `fo tasks.list` CLI-t hívja, parse-olja az envelope-ot, normalizálja a task-okat. */
export function readOrganizerTasks(limit: number = 12): FoTasksResult_Interface {
  try {
    const stdout: string = execFileSync('fo', [ 'tasks.list', '--limit', String(limit) ], {
      encoding: 'utf-8',
      timeout: 3000,
      windowsHide: true,
      stdio: [ 'ignore', 'pipe', 'pipe' ],
    });
    const env: FoEnvelope_Interface<unknown> = JSON.parse(stdout) as FoEnvelope_Interface<unknown>;

    if (!env.ok) {
      return { available: false, items: [], error: env.error?.message ?? 'fo returned ok=false' };
    }
    const items: FoTaskItem_Interface[] = extractItems(env.result)
      .map(normalise)
      .filter((x: FoTaskItem_Interface | null): x is FoTaskItem_Interface => x !== null);

    return { available: true, items };
  } catch (err) {
    return { available: false, items: [], error: (err as Error).message };
  }
}
