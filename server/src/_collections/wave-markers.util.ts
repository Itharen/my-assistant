// Wave-marker olvasó: az `__agent/log/actions/<date>.jsonl` fájlokat szűri
// az `extra.event_class IN ALLOWED_EVENT_CLASSES` mező alapján, és visszaadja
// a marker-rekordokat a wave-panel Phase 5e renderhez.
//
// FR #3b-WAVE-UI Phase 5e.2 (cycle 88).
//
// No-throw kontraktus: a beolvasás és a hibakezelés a közös `readActionLogJsonlDay`-ben van
// (hiányzó nap = várt, csendes; hibás olvasás = naplózott) — innen mindig lista jön vissza.

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readActionLogJsonlDay } from './action-log-jsonl.util';

/** Wave-marker event-class kategóriák — `current/feature-requests/wave-panel-ui.md` Phase 5e szakasz. */
export type WaveMarker_Kind = 'törés' | 'megoszló-erő' | '3x3-trigger';

/** Megengedett event_class értékek — a szűréshez. */
const ALLOWED_EVENT_CLASSES: Set<string> = new Set<string>([ 'törés', 'megoszló-erő', '3x3-trigger' ]);

/** Wave-marker output shape — kliens-render-friendly. */
export interface WaveMarker_Row {
  ts: string;
  kind: WaveMarker_Kind;
  subtype: string;
  summary: string;
  durationMin: number;
}

/** Raw action-log JSONL row — minden mező opcionális (resilience). */
interface RawActionLogRow_Interface {
  ts?: string;
  kind?: string;
  summary?: string;
  extra?: {
    event_class?: string;
    subtype?: string;
    duration_min?: number;
  };
}

/** Resolves the __agent/log/actions/ absolute path, ESM-compat. */
function resolveActionsDir(): string {
  const here: string = path.dirname(fileURLToPath(import.meta.url));

  return path.resolve(here, '..', '..', '..', '__agent', 'log', 'actions');
}

/** Iterates dates between two ms timestamps (inclusive day-bucket), returns YYYY-MM-DD strings. */
function* enumerateDateStrs(sinceMs: number, untilMs: number): Generator<string> {
  const start: Date = new Date(sinceMs);
  const end: Date = new Date(untilMs);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const cursor: Date = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    const y: number = cursor.getFullYear();
    const m: string = String(cursor.getMonth() + 1).padStart(2, '0');
    const d: string = String(cursor.getDate()).padStart(2, '0');

    yield `${y}-${m}-${d}`;
    cursor.setDate(cursor.getDate() + 1);
  }
}

/**
 * Beolvas minden napi action-log fájlt `sinceMs..untilMs` közt, szűri az
 * `event_class IN ALLOWED_EVENT_CLASSES`-re, és visszaadja a marker-listát.
 *
 * Hibás JSON sorok skip-elve (MA-WAVE-MARKERS-PARSE-FAIL action-log).
 * Fájl-nem-található / I/O hiba → skip (no action-log emit, a fájl hiánya
 * normál — nincs minden napra log).
 */
export async function readWaveMarkers(sinceMs: number, untilMs: number): Promise<WaveMarker_Row[]> {
  const dir: string = resolveActionsDir();
  const result: WaveMarker_Row[] = [];

  for (const dateStr of enumerateDateStrs(sinceMs, untilMs)) {
    // ⭐ A beolvasás + soronkénti értelmezés a közös `readActionLogJsonlDay`-ben van. Ott
    // dől el a HIÁNYZÓ nap (várt, csendes) és a HIBÁS olvasás (naplózott) különbsége is —
    // itt korábban mindkettő ugyanazon a néma `continue`-n távozott.
    const rows: RawActionLogRow_Interface[] = await readActionLogJsonlDay<RawActionLogRow_Interface>({
      filePath: path.join(dir, `${dateStr}.jsonl`),
      issuer: 'wave-markers.util.readWaveMarkers',
    });

    for (const raw of rows) {
      const eventClass: string | undefined = raw.extra?.event_class;

      if (!raw.ts || !eventClass || !ALLOWED_EVENT_CLASSES.has(eventClass)) {
        continue;
      }

      const tMs: number = new Date(raw.ts).getTime();

      if (Number.isNaN(tMs) || tMs < sinceMs || tMs > untilMs) {
        continue;
      }

      result.push({
        ts: raw.ts,
        kind: eventClass as WaveMarker_Kind,
        subtype: raw.extra?.subtype ?? '',
        summary: raw.summary ?? '',
        durationMin: Number(raw.extra?.duration_min ?? 0) || 0,
      });
    }
  }

  return result;
}
