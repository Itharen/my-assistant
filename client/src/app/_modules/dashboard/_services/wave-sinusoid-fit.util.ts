// Sinusoid least-squares fit a hullám-snapshot pontokra. A modell:
//
//     y(t) = A · sin(ω·t) + B · cos(ω·t) + C,   ω = 2π / T
//
// 3-paraméteres lineáris regresszió (A, B, C) — a periódus T fixált input,
// a hívó skennel a candidate-eken és a `ssr` (sum of squared residuals)
// alapján választ.
//
// Forrás: FR #3b-WAVE-UI Phase 5b (cycle 84). User-konfiguráció: astral kezdő
// hipotézis T~29,5 nap (lunar), mental/matter empirikus scan-elt.
//
// Megj: a `t` érték normalizált (ms relative to t0), hogy az `ω·t` ne lépje
// át a float precision-t hosszú periódusoknál.

/** Egy mintapont: t = ms timestamp, y = érték (0-100). */
export interface FitPoint_Interface {
  t: number;
  y: number;
}

/** Fit-eredmény — amplitude, phase, mean, period (ms), és SSR (modellválasztáshoz). */
export interface SinFit_Interface {
  A: number;
  B: number;
  C: number;
  T: number;     // period in ms
  ssr: number;   // sum of squared residuals
  N: number;     // sample count used
}

/** Period candidates msek-ben — astral 29.5d hipotézis + mental/matter empirikus alternatívák. */
export const PERIOD_CANDIDATES_MS: number[] = [
  1 * 24 * 3600_000,    // 1 nap (daily cycle)
  3 * 24 * 3600_000,    // 3 nap
  7 * 24 * 3600_000,    // 1 hét
  14 * 24 * 3600_000,   // 2 hét
  29.5 * 24 * 3600_000, // ~holdfázis (asztrál hipotézis)
];

/** Astral default-period — chat 2026-05-16 javaslat (AGB-19). */
export const ASTRAL_DEFAULT_PERIOD_MS: number = 29.5 * 24 * 3600_000;

/**
 * Lineáris legkisebb négyzetek illesztés a 3-paraméteres sin+cos+offset
 * modellre, fixált `T_ms` periódussal. Visszaadja a fit-paramétereket +
 * SSR-t, vagy null-t ha túl kevés pont van (<4) / determináns ≈ 0.
 *
 * Normal equations:
 *
 *     | Σs² Σsc Σs | | A |   | Σys |
 *     | Σsc Σc² Σc | | B | = | Σyc |
 *     | Σs  Σc  N  | | C |   | Σy  |
 *
 * Cramer's rule a 3×3 megoldáshoz.
 */
export function fitSinusoid(points: FitPoint_Interface[], T_ms: number): SinFit_Interface | null {
  if (points.length < 4) {
    return null;
  }

  const omega: number = (2 * Math.PI) / T_ms;
  const t0: number = points[0].t;

  // Accumulators
  let Ss: number = 0, Sc: number = 0, Ssc: number = 0, Ss2: number = 0, Sc2: number = 0;
  let Sy: number = 0, Sys: number = 0, Syc: number = 0;
  const N: number = points.length;

  for (const p of points) {
    const dt: number = p.t - t0;
    const s: number = Math.sin(omega * dt);
    const c: number = Math.cos(omega * dt);

    Ss += s; Sc += c; Ssc += s * c; Ss2 += s * s; Sc2 += c * c;
    Sy += p.y; Sys += p.y * s; Syc += p.y * c;
  }

  // Determinant via expansion along the 3rd row.
  const det: number =
    Ss2 * (Sc2 * N - Sc * Sc)
    - Ssc * (Ssc * N - Sc * Ss)
    + Ss * (Ssc * Sc - Sc2 * Ss);

  if (Math.abs(det) < 1e-9) {
    return null;
  }

  const detA: number =
    Sys * (Sc2 * N - Sc * Sc)
    - Ssc * (Syc * N - Sc * Sy)
    + Ss * (Syc * Sc - Sc2 * Sy);

  const detB: number =
    Ss2 * (Syc * N - Sc * Sy)
    - Sys * (Ssc * N - Sc * Ss)
    + Ss * (Ssc * Sy - Syc * Ss);

  const detC: number =
    Ss2 * (Sc2 * Sy - Sc * Syc)
    - Ssc * (Ssc * Sy - Syc * Ss)
    + Sys * (Ssc * Sc - Sc2 * Ss);

  const A: number = detA / det;
  const B: number = detB / det;
  const C: number = detC / det;

  // SSR = Σ (y_i - ŷ_i)²
  let ssr: number = 0;

  for (const p of points) {
    const dt: number = p.t - t0;
    const yhat: number = A * Math.sin(omega * dt) + B * Math.cos(omega * dt) + C;

    ssr += (p.y - yhat) ** 2;
  }

  return { A, B, C, T: T_ms, ssr, N };
}

/**
 * Period-scan: a candidate-listából azt a T-t választja amelyik a legkisebb
 * SSR-t adja. Ha `bias_T_ms` meg van adva, az ahhoz legközelebbi candidate-et
 * 5%-os SSR-bónusszal jutalmazza (preferred-hypothesis selection).
 */
export function pickBestPeriod(
  points: FitPoint_Interface[],
  candidates: number[] = PERIOD_CANDIDATES_MS,
  bias_T_ms?: number,
): SinFit_Interface | null {
  let best: SinFit_Interface | null = null;

  for (const T of candidates) {
    const fit: SinFit_Interface | null = fitSinusoid(points, T);

    if (!fit) continue;

    const isPreferred: boolean = bias_T_ms !== undefined && Math.abs(T - bias_T_ms) < 1e-3;
    const adjustedSsr: number = isPreferred ? fit.ssr * 0.95 : fit.ssr;

    if (!best || adjustedSsr < best.ssr * (isPreferred ? 1 : 0.95)) {
      best = fit;
    }
  }

  return best;
}

/**
 * Sampled (x, y) point-stream a fittelt görbéből, `count` mintával egyenletesen
 * a t0..t1 (ms) intervallumon. A `y` érték 0..100 clamped.
 */
export function sampleSinFit(
  fit: SinFit_Interface,
  t0: number,
  t1: number,
  count: number,
): { dt: number; y: number }[] {
  const omega: number = (2 * Math.PI) / fit.T;
  const result: { dt: number; y: number }[] = [];
  const step: number = (t1 - t0) / Math.max(1, count - 1);

  for (let i: number = 0; i < count; i++) {
    const t: number = t0 + i * step;
    const dt: number = t - t0;
    const yRaw: number = fit.A * Math.sin(omega * dt) + fit.B * Math.cos(omega * dt) + fit.C;
    const y: number = Math.max(0, Math.min(100, yRaw));

    result.push({ dt: t, y });
  }

  return result;
}
