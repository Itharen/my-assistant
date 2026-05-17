// Spec for wave-sinusoid-fit.util — pure-math LSQ regresszió + period scan.
// Cycle 106 (FR #3g utáni safe-orthogonal spec-coverage).
//
// Pattern: wave-jsonl-fallback.util.spec.ts — Jasmine describe/it/expect,
// makeXxx() helper + numerical tolerance.

import {
  ASTRAL_DEFAULT_PERIOD_MS,
  PERIOD_CANDIDATES_MS,
  fitSinusoid,
  pickBestPeriod,
  sampleSinFit,
  type FitPoint_Interface,
  type SinFit_Interface,
} from './wave-sinusoid-fit.util';

const DAY_MS: number = 24 * 3600_000;

/** Generate `N` egyenletesen elhelyezett `y = A·sin(ω·t) + B·cos(ω·t) + C` pontokat. */
function generateSinusoidPoints(opts: {
  A: number; B: number; C: number; T_ms: number; N: number; spanMs?: number; t0?: number;
}): FitPoint_Interface[] {
  const t0: number = opts.t0 ?? 0;
  const span: number = opts.spanMs ?? opts.T_ms * 2;
  const omega: number = (2 * Math.PI) / opts.T_ms;
  const step: number = span / (opts.N - 1);
  const out: FitPoint_Interface[] = [];

  for (let i: number = 0; i < opts.N; i++) {
    const t: number = t0 + i * step;
    const y: number = opts.A * Math.sin(omega * (t - t0)) + opts.B * Math.cos(omega * (t - t0)) + opts.C;

    out.push({ t, y });
  }

  return out;
}

describe('wave-sinusoid-fit.util', () => {

  describe('fitSinusoid', () => {

    it('returns null for fewer than 4 points', () => {
      const pts: FitPoint_Interface[] = [
        { t: 0, y: 50 }, { t: 1000, y: 60 }, { t: 2000, y: 55 },
      ];

      expect(fitSinusoid(pts, DAY_MS)).toBeNull();
    });

    it('returns null when all points share the same t (degenerate determinant)', () => {
      const pts: FitPoint_Interface[] = [
        { t: 1000, y: 10 }, { t: 1000, y: 20 }, { t: 1000, y: 30 }, { t: 1000, y: 40 },
      ];

      expect(fitSinusoid(pts, DAY_MS)).toBeNull();
    });

    it('recovers known A/B/C with near-zero SSR on clean data', () => {
      const A: number = 20, B: number = -10, C: number = 50, T_ms: number = 7 * DAY_MS;
      const pts: FitPoint_Interface[] = generateSinusoidPoints({ A, B, C, T_ms, N: 50, spanMs: 3 * T_ms });
      const fit: SinFit_Interface | null = fitSinusoid(pts, T_ms);

      expect(fit).not.toBeNull();
      expect(fit!.A).toBeCloseTo(A, 4);
      expect(fit!.B).toBeCloseTo(B, 4);
      expect(fit!.C).toBeCloseTo(C, 4);
      expect(fit!.T).toBe(T_ms);
      expect(fit!.N).toBe(50);
      expect(fit!.ssr).toBeLessThan(1e-6);
    });

    it('returns positive SSR when input data has noise', () => {
      const T_ms: number = 7 * DAY_MS;
      const clean: FitPoint_Interface[] = generateSinusoidPoints({ A: 15, B: 5, C: 50, T_ms, N: 30 });
      // Add deterministic noise (no randomness — repeatable).
      const noisy: FitPoint_Interface[] = clean.map((p, i): FitPoint_Interface => ({
        t: p.t,
        y: p.y + (i % 5 === 0 ? 3 : -2),
      }));
      const fit: SinFit_Interface | null = fitSinusoid(noisy, T_ms);

      expect(fit).not.toBeNull();
      expect(fit!.ssr).toBeGreaterThan(0);
    });

    it('recovers a constant offset (A=B=0)', () => {
      const C: number = 42;
      const pts: FitPoint_Interface[] = generateSinusoidPoints({ A: 0, B: 0, C, T_ms: DAY_MS, N: 20 });
      const fit: SinFit_Interface | null = fitSinusoid(pts, DAY_MS);

      expect(fit).not.toBeNull();
      expect(fit!.A).toBeCloseTo(0, 4);
      expect(fit!.B).toBeCloseTo(0, 4);
      expect(fit!.C).toBeCloseTo(C, 4);
    });
  });

  describe('pickBestPeriod', () => {

    it('returns null when no candidate fits (too few points)', () => {
      const pts: FitPoint_Interface[] = [
        { t: 0, y: 50 }, { t: 1000, y: 60 },
      ];

      expect(pickBestPeriod(pts)).toBeNull();
    });

    it('picks the candidate matching the underlying period when data is clean', () => {
      const T_true: number = 7 * DAY_MS;
      const pts: FitPoint_Interface[] = generateSinusoidPoints({
        A: 30, B: 0, C: 50, T_ms: T_true, N: 60, spanMs: 4 * T_true,
      });
      const fit: SinFit_Interface | null = pickBestPeriod(pts, PERIOD_CANDIDATES_MS);

      expect(fit).not.toBeNull();
      expect(fit!.T).toBe(T_true);
    });

    it('uses the provided candidates instead of the default set', () => {
      const T_true: number = 5 * DAY_MS;
      const pts: FitPoint_Interface[] = generateSinusoidPoints({
        A: 10, B: 5, C: 50, T_ms: T_true, N: 40,
      });
      const customCandidates: number[] = [ 3 * DAY_MS, 5 * DAY_MS, 10 * DAY_MS ];
      const fit: SinFit_Interface | null = pickBestPeriod(pts, customCandidates);

      expect(fit).not.toBeNull();
      expect(fit!.T).toBe(T_true);
    });

    it('exposes ASTRAL_DEFAULT_PERIOD_MS as a candidate (lunar 29.5d)', () => {
      const lunar: number = 29.5 * DAY_MS;

      expect(ASTRAL_DEFAULT_PERIOD_MS).toBe(lunar);
      expect(PERIOD_CANDIDATES_MS).toContain(lunar);
    });
  });

  describe('sampleSinFit', () => {

    it('generates the requested number of samples', () => {
      const fit: SinFit_Interface = { A: 10, B: 0, C: 50, T: DAY_MS, ssr: 0, N: 20 };
      const samples: { dt: number; y: number }[] = sampleSinFit(fit, 0, DAY_MS, 25);

      expect(samples.length).toBe(25);
    });

    it('first sample dt = t0, last sample dt = t1', () => {
      const fit: SinFit_Interface = { A: 5, B: 5, C: 50, T: DAY_MS, ssr: 0, N: 10 };
      const t0: number = 100_000;
      const t1: number = t0 + 2 * DAY_MS;
      const samples: { dt: number; y: number }[] = sampleSinFit(fit, t0, t1, 10);

      expect(samples[0].dt).toBe(t0);
      expect(samples[samples.length - 1].dt).toBe(t1);
    });

    it('clamps y to [0, 100] even if fit predicts outside the range', () => {
      // Egy A=200 amplitude-ű fit kihúz a 0–100-on kívülre — a sampler clamp-eljen.
      const fit: SinFit_Interface = { A: 200, B: 0, C: 50, T: DAY_MS, ssr: 0, N: 10 };
      const samples: { dt: number; y: number }[] = sampleSinFit(fit, 0, DAY_MS, 50);

      for (const s of samples) {
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeLessThanOrEqual(100);
      }
    });
  });
});
