import {
  A_WaveKind,
  type A_DashboardSnapshot,
  type A_WaveContext,
  type A_WaveJsonl_Row,
} from '../../../_models/server-envelope.interface';
import {
  buildJsonlFallbackSnapshot,
  extractLatestContext,
} from './wave-jsonl-fallback.util';

function makeRow(overrides: Partial<A_WaveJsonl_Row> = {}): A_WaveJsonl_Row {
  return {
    ts: '2026-05-16T10:00:00+02:00',
    kind: A_WaveKind.astral,
    value: 50,
    level: 'mid',
    vector: null,
    mood: null,
    note: null,
    ...overrides,
  };
}

describe('wave-jsonl-fallback.util', () => {
  describe('buildJsonlFallbackSnapshot', () => {
    it('returns empty snapshot for zero rows', () => {
      const snap: A_DashboardSnapshot = buildJsonlFallbackSnapshot([]);
      expect(snap.serverTime).toBeTruthy();
      expect(snap.tasks.items.length).toBe(0);
      expect(snap.waves.series[A_WaveKind.astral].length).toBe(0);
      expect(snap.waves.series[A_WaveKind.mental].length).toBe(0);
      expect(snap.waves.series[A_WaveKind.matter].length).toBe(0);
      expect(snap.insights.count).toBe(0);
      expect(snap.recentCaptures.count).toBe(0);
    });

    it('routes rows into the matching kind series', () => {
      const rows: A_WaveJsonl_Row[] = [
        makeRow({ kind: A_WaveKind.astral, value: 30 }),
        makeRow({ kind: A_WaveKind.mental, value: 60, ts: '2026-05-16T11:00:00+02:00' }),
        makeRow({ kind: A_WaveKind.matter, value: 75, ts: '2026-05-16T12:00:00+02:00' }),
      ];
      const snap: A_DashboardSnapshot = buildJsonlFallbackSnapshot(rows);
      expect(snap.waves.series[A_WaveKind.astral].length).toBe(1);
      expect(snap.waves.series[A_WaveKind.mental].length).toBe(1);
      expect(snap.waves.series[A_WaveKind.matter].length).toBe(1);
    });

    it('generates pseudo-id with jsonl- prefix + ts + kind', () => {
      const rows: A_WaveJsonl_Row[] = [makeRow({ kind: A_WaveKind.astral, ts: '2026-05-16T09:00:00+02:00' })];
      const snap: A_DashboardSnapshot = buildJsonlFallbackSnapshot(rows);
      const row = snap.waves.series[A_WaveKind.astral][0]!;
      expect(row._id).toBe('jsonl-2026-05-16T09:00:00+02:00-astral');
    });

    it('populates latest per kind with the last appended row', () => {
      const rows: A_WaveJsonl_Row[] = [
        makeRow({ kind: A_WaveKind.astral, value: 30, ts: '2026-05-16T08:00:00+02:00' }),
        makeRow({ kind: A_WaveKind.astral, value: 55, ts: '2026-05-16T11:00:00+02:00' }),
      ];
      const snap: A_DashboardSnapshot = buildJsonlFallbackSnapshot(rows);
      expect(snap.waves.latest[A_WaveKind.astral]?.value).toBe(55);
      expect(snap.waves.latest[A_WaveKind.mental]).toBeUndefined();
    });

    it('passes the row note through to the A_WaveRow', () => {
      const rows: A_WaveJsonl_Row[] = [makeRow({ note: 'morning low' })];
      const snap: A_DashboardSnapshot = buildJsonlFallbackSnapshot(rows);
      expect(snap.waves.series[A_WaveKind.astral][0]!.note).toBe('morning low');
    });

    it('attaches latest context (vector+mood) from the most-recent ts row', () => {
      const rows: A_WaveJsonl_Row[] = [
        makeRow({ ts: '2026-05-16T08:00:00+02:00', mood: 'old-mood', vector: 'down' }),
        makeRow({ ts: '2026-05-16T11:00:00+02:00', mood: 'recent-mood', vector: 'up' }),
      ];
      const snap: A_DashboardSnapshot = buildJsonlFallbackSnapshot(rows);
      expect(snap.waves.context?.mood).toBe('recent-mood');
      expect(snap.waves.context?.vector).toBe('up');
      expect(snap.waves.context?.vectorEmoji).toBe('↗');
    });

    it('rangeHours clamps to >=24 with very-fresh rows', () => {
      // Just-now ts → range hours < 1, clamp to 24.
      const rows: A_WaveJsonl_Row[] = [makeRow({ ts: new Date().toISOString() })];
      const snap: A_DashboardSnapshot = buildJsonlFallbackSnapshot(rows);
      expect(snap.waves.rangeHours).toBe(24);
    });

    it('rangeHours clamps to <=168 with very-old rows', () => {
      // 30 days ago → 720h, clamp to 168.
      const past: string = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const rows: A_WaveJsonl_Row[] = [makeRow({ ts: past })];
      const snap: A_DashboardSnapshot = buildJsonlFallbackSnapshot(rows);
      expect(snap.waves.rangeHours).toBe(168);
    });
  });

  describe('extractLatestContext', () => {
    it('returns null for empty rows', () => {
      expect(extractLatestContext([])).toBeNull();
    });

    it('returns the single row context when only one row exists', () => {
      const rows: A_WaveJsonl_Row[] = [makeRow({ mood: 'solo', vector: 'flat' })];
      const ctx: A_WaveContext | null = extractLatestContext(rows);
      expect(ctx?.mood).toBe('solo');
      expect(ctx?.vector).toBe('flat');
      expect(ctx?.vectorEmoji).toBe('→');
    });

    it('returns the most-recent-ts row regardless of input order', () => {
      const rows: A_WaveJsonl_Row[] = [
        makeRow({ ts: '2026-05-16T12:00:00+02:00', mood: 'latest', vector: 'up' }),
        makeRow({ ts: '2026-05-16T08:00:00+02:00', mood: 'earliest', vector: 'down' }),
        makeRow({ ts: '2026-05-16T10:00:00+02:00', mood: 'middle', vector: 'flat' }),
      ];
      const ctx: A_WaveContext | null = extractLatestContext(rows);
      expect(ctx?.mood).toBe('latest');
      expect(ctx?.ts).toBe('2026-05-16T12:00:00+02:00');
    });

    it('maps vector null to fallback dot emoji', () => {
      const rows: A_WaveJsonl_Row[] = [makeRow({ vector: null })];
      const ctx: A_WaveContext | null = extractLatestContext(rows);
      expect(ctx?.vectorEmoji).toBe('·');
    });

    it('maps up/down/flat to correct arrow emojis', () => {
      const upCtx = extractLatestContext([makeRow({ vector: 'up' })]);
      const downCtx = extractLatestContext([makeRow({ vector: 'down' })]);
      const flatCtx = extractLatestContext([makeRow({ vector: 'flat' })]);
      expect(upCtx?.vectorEmoji).toBe('↗');
      expect(downCtx?.vectorEmoji).toBe('↘');
      expect(flatCtx?.vectorEmoji).toBe('→');
    });
  });
});
