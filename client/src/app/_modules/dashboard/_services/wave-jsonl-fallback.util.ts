// JSONL-fallback → A_DashboardSnapshot transformer. A `GET /api/wave/get-from-jsonl`
// unauth válaszának row-jait (`A_WaveJsonl_Row[]`) konvertálja a panel-ek által
// fogyasztott `A_DashboardSnapshot` shape-re, üres tasks/insights/captures-szel.
//
// A `mood` + `vector` mező A_WaveJsonl_Row-on marad — a d-waves komponens egy
// külön `latestSnapshot` view-modell-en keresztül használja (FR #3b-WAVE-UI
// Phase 2.C).
//
// FR #3b-WAVE-UI Phase 2.B (cycle 53). Pure function, side-effect-free.

import {
  A_WaveKind,
  type A_DashboardSnapshot,
  type A_WaveContext,
  type A_WaveJsonl_Row,
  type A_WaveRow
} from '../../../_models/server-envelope.interface';

const PSEUDO_ID_PREFIX: string = 'jsonl-';

/**
 * Konvertál JSONL-fallback row-okat A_DashboardSnapshot shape-re. Üres tasks /
 * insights / captures (a JSONL csak wave-eket tartalmaz). A wave row-okhoz
 * pseudo-id-t generál (`jsonl-<ts>-<kind>`) hogy a DyFMRow shape kompatibilis legyen.
 */
export function buildJsonlFallbackSnapshot(rows: A_WaveJsonl_Row[]): A_DashboardSnapshot {
  const series: Record<A_WaveKind, A_WaveRow[]> = {
    [A_WaveKind.astral]: [],
    [A_WaveKind.mental]: [],
    [A_WaveKind.matter]: [],
  };

  for (const row of rows) {
    const waveRow: A_WaveRow = {
      _id: `${PSEUDO_ID_PREFIX}${row.ts}-${row.kind}`,
      __created: row.ts,
      kind: row.kind,
      value: row.value,
      note: row.note ?? undefined,
    };

    series[row.kind].push(waveRow);
  }

  const latest: Partial<Record<A_WaveKind, A_WaveRow>> = {};
  const kinds: A_WaveKind[] = [ A_WaveKind.astral, A_WaveKind.mental, A_WaveKind.matter ];

  for (const kind of kinds) {
    const arr: A_WaveRow[] = series[kind];

    if (arr.length > 0) {
      latest[kind] = arr[arr.length - 1];
    }
  }

  const context: A_WaveContext | undefined = extractLatestContext(rows) ?? undefined;

  return {
    serverTime: new Date().toISOString(),
    tasks: { available: false, items: [] },
    waves: { rangeHours: computeRangeHours(rows), series, latest, context },
    insights: { count: 0, items: [] },
    recentCaptures: { count: 0, items: [] },
  };
}

/** A JSONL row-ok ts-eiből számolja a range-hours-t (most ↔ legrégebbi). 24h min, 168h max. */
function computeRangeHours(rows: A_WaveJsonl_Row[]): number {
  if (rows.length === 0) {
    return 24;
  }

  const now: number = Date.now();
  const oldest: number = Math.min(...rows.map((r: A_WaveJsonl_Row): number => new Date(r.ts).getTime()));
  const hours: number = Math.ceil((now - oldest) / (60 * 60 * 1000));

  return Math.max(24, Math.min(168, hours));
}

const VECTOR_EMOJI: Record<'up' | 'down' | 'flat', string> = {
  up: '↗',
  down: '↘',
  flat: '→',
};

/** Visszaadja a legutóbbi JSONL row mood/vector/note kontextusát, vagy null-t ha nincs row. */
export function extractLatestContext(rows: A_WaveJsonl_Row[]): A_WaveContext | null {
  if (rows.length === 0) {
    return null;
  }

  const sorted: A_WaveJsonl_Row[] = [ ...rows ].sort(
    (a: A_WaveJsonl_Row, b: A_WaveJsonl_Row): number =>
      new Date(a.ts).getTime() - new Date(b.ts).getTime(),
  );
  const last: A_WaveJsonl_Row = sorted[sorted.length - 1];

  return {
    ts: last.ts,
    vector: last.vector,
    vectorEmoji: last.vector ? VECTOR_EMOJI[last.vector] : '·',
    mood: last.mood,
    note: last.note,
  };
}
