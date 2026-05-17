// Spec for D_Dashboard_DataService — pure BehaviorSubject state container.
// Cycle 108 (safe-orthogonal spec-coverage).
//
// Pattern: error-extract.util.spec.ts (cycle 107) + wave-jsonl-fallback.util.spec.ts —
// Jasmine describe/it/expect, makeXxx() factory helpers.

import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

import {
  A_WaveKind,
  type A_DashboardSnapshot,
  type A_WaveMarker_Row,
  type A_WaveRow,
} from '../../../_models/server-envelope.interface';

import { D_Dashboard_DataService, type D_DashboardState_Interface } from './d-dashboard.data-service';

function makeSnapshot(overrides: Partial<A_DashboardSnapshot> = {}): A_DashboardSnapshot {
  return {
    serverTime: '2026-05-17T06:00:00+02:00',
    tasks: { available: true, items: [] },
    waves: {
      rangeHours: 24,
      series: {
        [A_WaveKind.astral]: [],
        [A_WaveKind.mental]: [],
        [A_WaveKind.matter]: [],
      },
      latest: {},
    },
    insights: { count: 0, items: [] },
    recentCaptures: { count: 0, items: [] },
    ...overrides,
  };
}

function makeWaveRow(kind: A_WaveKind, value: number, ts: string = '2026-05-17T06:00:00+02:00'): A_WaveRow {
  return { _id: `id-${kind}-${value}`, __created: ts, kind, value };
}

function makeMarker(kind: A_WaveMarker_Row['kind'] = '3x3-trigger'): A_WaveMarker_Row {
  return {
    ts: '2026-05-17T05:00:00+02:00',
    kind,
    subtype: 'test',
    summary: 'sample',
    durationMin: 0,
  };
}

describe('D_Dashboard_DataService', () => {

  let svc: D_Dashboard_DataService;

  beforeEach(() => {
    svc = new D_Dashboard_DataService();
  });

  describe('initial state', () => {

    it('starts in loading state with no snapshot/error and empty markers', () => {
      const s: D_DashboardState_Interface = svc.current();

      expect(s.isLoading).toBe(true);
      expect(s.snapshot).toBeNull();
      expect(s.error).toBeNull();
      expect(s.lastFetchedAt).toBeNull();
      expect(s.markers).toEqual([]);
    });

    it('emits initial state to new subscribers via state$', async () => {
      const first: D_DashboardState_Interface = await firstValueFrom(svc.state$.pipe(take(1)));

      expect(first.isLoading).toBe(true);
      expect(first.snapshot).toBeNull();
    });
  });

  describe('setLoading', () => {

    it('flips isLoading=true and clears error, keeps snapshot/markers', () => {
      const snap: A_DashboardSnapshot = makeSnapshot();
      svc.setSnapshot(snap);
      svc.setError('temp');
      svc.setLoading();

      const s: D_DashboardState_Interface = svc.current();
      expect(s.isLoading).toBe(true);
      expect(s.error).toBeNull();
      expect(s.snapshot).toBe(snap);
    });
  });

  describe('setSnapshot', () => {

    it('updates snapshot, clears loading, clears error, sets lastFetchedAt', () => {
      const snap: A_DashboardSnapshot = makeSnapshot();
      svc.setError('prev');
      svc.setSnapshot(snap);

      const s: D_DashboardState_Interface = svc.current();
      expect(s.snapshot).toBe(snap);
      expect(s.isLoading).toBe(false);
      expect(s.error).toBeNull();
      expect(s.lastFetchedAt).toBeTruthy();
      // ISO format check.
      expect(new Date(s.lastFetchedAt!).toString()).not.toBe('Invalid Date');
    });

    it('preserves the existing markers array across setSnapshot', () => {
      const m: A_WaveMarker_Row = makeMarker();
      svc.setMarkers([ m ]);
      svc.setSnapshot(makeSnapshot());

      expect(svc.current().markers).toEqual([ m ]);
    });
  });

  describe('setError', () => {

    it('flips isLoading=false and stores the error message', () => {
      svc.setError('boom');

      const s: D_DashboardState_Interface = svc.current();
      expect(s.isLoading).toBe(false);
      expect(s.error).toBe('boom');
    });

    it('keeps the existing snapshot when an error follows a successful fetch', () => {
      const snap: A_DashboardSnapshot = makeSnapshot();
      svc.setSnapshot(snap);
      svc.setError('next-call-failed');

      expect(svc.current().snapshot).toBe(snap);
    });
  });

  describe('setMarkers', () => {

    it('replaces the markers array without touching the rest of the state', () => {
      const snap: A_DashboardSnapshot = makeSnapshot();
      svc.setSnapshot(snap);
      const m1: A_WaveMarker_Row = makeMarker('törés');
      const m2: A_WaveMarker_Row = makeMarker('megoszló-erő');

      svc.setMarkers([ m1, m2 ]);

      const s: D_DashboardState_Interface = svc.current();
      expect(s.markers).toEqual([ m1, m2 ]);
      expect(s.snapshot).toBe(snap);
    });

    it('accepts an empty array (reset semantics)', () => {
      svc.setMarkers([ makeMarker() ]);
      svc.setMarkers([]);

      expect(svc.current().markers).toEqual([]);
    });
  });

  describe('static helpers', () => {

    it('seriesFor returns the series array for a kind from a non-null snapshot', () => {
      const row: A_WaveRow = makeWaveRow(A_WaveKind.astral, 70);
      const snap: A_DashboardSnapshot = makeSnapshot({
        waves: {
          rangeHours: 24,
          series: {
            [A_WaveKind.astral]: [ row ],
            [A_WaveKind.mental]: [],
            [A_WaveKind.matter]: [],
          },
          latest: {},
        },
      });

      expect(D_Dashboard_DataService.seriesFor(snap, A_WaveKind.astral)).toEqual([ row ]);
      expect(D_Dashboard_DataService.seriesFor(snap, A_WaveKind.mental)).toEqual([]);
    });

    it('seriesFor returns empty array for a null snapshot', () => {
      expect(D_Dashboard_DataService.seriesFor(null, A_WaveKind.astral)).toEqual([]);
    });

    it('latestValue returns the latest wave value when present', () => {
      const row: A_WaveRow = makeWaveRow(A_WaveKind.mental, 42);
      const snap: A_DashboardSnapshot = makeSnapshot({
        waves: {
          rangeHours: 24,
          series: {
            [A_WaveKind.astral]: [],
            [A_WaveKind.mental]: [],
            [A_WaveKind.matter]: [],
          },
          latest: { [A_WaveKind.mental]: row },
        },
      });

      expect(D_Dashboard_DataService.latestValue(snap, A_WaveKind.mental)).toBe(42);
    });

    it('latestValue returns null when the kind has no entry', () => {
      expect(D_Dashboard_DataService.latestValue(makeSnapshot(), A_WaveKind.astral)).toBeNull();
    });

    it('latestValue returns null for a null snapshot', () => {
      expect(D_Dashboard_DataService.latestValue(null, A_WaveKind.astral)).toBeNull();
    });
  });
});
