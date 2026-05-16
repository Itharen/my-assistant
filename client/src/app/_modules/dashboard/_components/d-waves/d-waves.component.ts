// Waves panel (top-right, big). 3 line series — astral / mental / matter —
// rendered as inline SVG (no chart library). Values are 0..100, plotted across
// the configured range (default 24h from /dashboard). Feeding happens through
// the capture panel (kind=energy) which fans out to 3 wave rows server-side.
// The polylines + grid + Y-axis ticks are precomputed on each snapshot change
// so the template never calls a method during change detection.

import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnDestroy } from '@angular/core';

import {
  A_WaveKind,
  type A_DashboardSnapshot,
  type A_WaveContext,
  type A_WaveRow
} from '../../../../_models/server-envelope.interface';
import { D_WavesForm_Component } from '../d-waves-form/d-waves-form.component';
import { D_Dashboard_ControlService } from '../../_services/d-dashboard.control-service';
import {
  ASTRAL_DEFAULT_PERIOD_MS,
  pickBestPeriod,
  sampleSinFit,
  type FitPoint_Interface,
  type SinFit_Interface,
} from '../../_services/wave-sinusoid-fit.util';

interface D_WavePolyline_Interface {
  kind: A_WaveKind;
  points: string;
  color: string;
  label: string;
  emoji: string;
  latest: number | null;
}

interface D_WaveGridTick_Interface {
  value: number;
  y: number;
}

interface D_WaveXTick_Interface {
  x: number;
  label: string;
  isToday: boolean;
}

interface D_WaveFitPath_Interface {
  kind: A_WaveKind;
  points: string;   // SVG polyline points
  color: string;
  periodDays: number;
}

interface D_WavePoint_Interface {
  kind: A_WaveKind;
  cx: number;
  cy: number;
  tooltip: string;
}

const FIT_SAMPLE_COUNT: number = 120;
const FIT_MIN_POINTS: number = 4;

interface D_WaveRangePreset_Interface {
  label: string;
  hours: number;
}

/** FR #3b-WAVE-UI Phase 5c (cycle 85): preset gombok az interval-választóhoz. */
const RANGE_PRESETS: D_WaveRangePreset_Interface[] = [
  { label: '24h', hours: 24 },
  { label: '3d', hours: 72 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
  { label: '60d', hours: 1440 },
  { label: '90d', hours: 2160 },
];

const PALETTE: Record<A_WaveKind, { color: string; label: string; emoji: string }> = {
  astral: { color: '#a78bfa', label: 'Asztrál', emoji: '🌌' },
  mental: { color: '#60a5fa', label: 'Mentál', emoji: '🧠' },
  matter: { color: '#34d399', label: 'Anyag', emoji: '🪨' },
};

const VIEW: { width: number; height: number; padX: number; padTop: number; padBottom: number } =
  { width: 600, height: 220, padX: 30, padTop: 10, padBottom: 22 };
const INNER_W: number = VIEW.width - 2 * VIEW.padX;
const INNER_H: number = VIEW.height - VIEW.padTop - VIEW.padBottom;
const Y_GRID_VALUES: number[] = [ 0, 25, 50, 75, 100 ];

function yFor(value: number): number {
  const clamped: number = Math.max(0, Math.min(100, value));

  return VIEW.padTop + INNER_H * (1 - clamped / 100);
}

function pointFor(row: A_WaveRow, tStart: number, tEnd: number): string {
  const t: number = new Date(row.__created).getTime();
  const ratio: number = (t - tStart) / (tEnd - tStart);
  const x: number = VIEW.padX + INNER_W * Math.max(0, Math.min(1, ratio));

  return `${x.toFixed(1)},${yFor(row.value).toFixed(1)}`;
}

/** Density-aware X-tick step + format table (FR #3b-WAVE-UI Phase 5a, cycle 83). */
const X_TICK_DENSITY: { maxHours: number; stepMs: number; format: 'HH:00' | 'MM-dd HH' | 'MM-dd' }[] = [
  { maxHours: 36, stepMs: 4 * 3600_000, format: 'HH:00' },
  { maxHours: 72, stepMs: 12 * 3600_000, format: 'MM-dd HH' },
  { maxHours: 168, stepMs: 24 * 3600_000, format: 'MM-dd' },
  { maxHours: 720, stepMs: 3 * 24 * 3600_000, format: 'MM-dd' },
  { maxHours: 1440, stepMs: 7 * 24 * 3600_000, format: 'MM-dd' },
  { maxHours: Number.POSITIVE_INFINITY, stepMs: 14 * 24 * 3600_000, format: 'MM-dd' },
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatTickLabel(d: Date, fmt: 'HH:00' | 'MM-dd HH' | 'MM-dd'): string {
  switch (fmt) {
    case 'HH:00': return `${pad2(d.getHours())}:00`;
    case 'MM-dd HH': return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}`;
    case 'MM-dd': return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
}

/**
 * Density-aware X-tick computation. Visszaadja a tick-pontokat a tStart..tEnd
 * intervallumon a `rangeHours`-hoz illő step + label-formatum-mal. Ha egy tick
 * az aktuális nap-on van, `isToday=true` (HTML kiemeli).
 */
function computeXTicks(tStart: number, tEnd: number, rangeHours: number): D_WaveXTick_Interface[] {
  const density = X_TICK_DENSITY.find((d): boolean => rangeHours <= d.maxHours) ?? X_TICK_DENSITY[X_TICK_DENSITY.length - 1];
  const todayStart: Date = new Date();

  todayStart.setHours(0, 0, 0, 0);
  const todayMs: number = todayStart.getTime();
  const todayEndMs: number = todayMs + 24 * 3600_000;

  // First tick: round down tStart to step boundary.
  let firstTickMs: number = Math.ceil(tStart / density.stepMs) * density.stepMs;
  const ticks: D_WaveXTick_Interface[] = [];

  while (firstTickMs <= tEnd) {
    const d: Date = new Date(firstTickMs);
    const ratio: number = (firstTickMs - tStart) / (tEnd - tStart);
    const x: number = VIEW.padX + INNER_W * Math.max(0, Math.min(1, ratio));
    const isToday: boolean = firstTickMs >= todayMs && firstTickMs < todayEndMs;

    ticks.push({ x, label: formatTickLabel(d, density.format), isToday });
    firstTickMs += density.stepMs;
  }

  return ticks;
}

@Component({
  standalone: true,
  selector: 'd-waves',
  templateUrl: './d-waves.component.html',
  styleUrl: './d-waves.component.scss',
  imports: [ CommonModule, D_WavesForm_Component ],
})
/** Waves panel — 3 vonalas SVG diagram astral/mental/matter time-series-szel, precomputált polyline-okkal. */
export class D_Waves_Component implements OnDestroy {

  private readonly control: D_Dashboard_ControlService = inject(D_Dashboard_ControlService);

  readonly viewBox: string = `0 0 ${VIEW.width} ${VIEW.height}`;
  readonly axisLeft: number = VIEW.padX;
  readonly axisRight: number = VIEW.width - VIEW.padX;
  readonly gridTicks: D_WaveGridTick_Interface[] =
    Y_GRID_VALUES.map((v: number): D_WaveGridTick_Interface => ({ value: v, y: yFor(v) }));
  readonly rangePresets: D_WaveRangePreset_Interface[] = RANGE_PRESETS;

  /** FR #3b-WAVE-UI Phase 5d (cycle 86): fullscreen toggle state. Esc → kilépés. */
  isFullscreen: boolean = false;

  /** Esc key listener — fullscreen exit handler, attached when isFullscreen=true. */
  private escListener: ((e: KeyboardEvent) => void) | null = null;

  rangeHours: number = 24;
  hasData: boolean = false;
  polylines: D_WavePolyline_Interface[] = [];
  context: A_WaveContext | null = null;
  xTicks: D_WaveXTick_Interface[] = [];
  fitPaths: D_WaveFitPath_Interface[] = [];
  /** FR #3b-WAVE-UI Phase 5e.1 (cycle 87): per-pont hover tooltip-hez invisible circle markers. */
  points: D_WavePoint_Interface[] = [];
  readonly xAxisY: number = VIEW.padTop + INNER_H + 4;          // line position
  readonly xAxisLabelY: number = VIEW.padTop + INNER_H + 16;    // label baseline

  /** Snapshot setter — precomputálja a 3 polyline-t, latest értékeket, palettát és a context-et. */
  @Input() set snapshot(value: A_DashboardSnapshot | null) {
    this.rangeHours = value?.waves.rangeHours ?? 24;
    this.context = value?.waves.context ?? null;

    if (!value) {
      this.hasData = false;
      this.polylines = [];

      return;
    }
    const s: Record<A_WaveKind, A_WaveRow[]> = value.waves.series;

    this.hasData = s.astral.length + s.mental.length + s.matter.length > 0;

    if (!this.hasData) {
      this.polylines = [];

      return;
    }

    const now: number = Date.now();
    const tStart: number = now - this.rangeHours * 60 * 60 * 1000;

    const kinds: A_WaveKind[] = [ A_WaveKind.astral, A_WaveKind.mental, A_WaveKind.matter ];

    this.polylines = kinds.map((kind: A_WaveKind): D_WavePolyline_Interface => {
      const series: A_WaveRow[] = s[kind];
      const points: string = series.map((r: A_WaveRow): string => pointFor(r, tStart, now)).join(' ');
      const latest: number | null = series.length > 0 ? series[series.length - 1].value : null;

      return { kind, points, latest, ...PALETTE[kind] };
    });

    // FR #3b-WAVE-UI Phase 5a (cycle 83): density-aware X-axis ticks.
    this.xTicks = computeXTicks(tStart, now, this.rangeHours);

    // FR #3b-WAVE-UI Phase 5b (cycle 84): sin/cos fit overlay per kind.
    this.fitPaths = this.computeFitPaths(s, tStart, now);

    // FR #3b-WAVE-UI Phase 5e.1 (cycle 87): per-pont hover-tooltip markers.
    this.points = this.computePoints(s, tStart, now);
  }

  /** Per-snapshot-pont marker + tooltip-string építés (kind/ts/value/note). */
  private computePoints(
    series: Record<A_WaveKind, A_WaveRow[]>,
    tStart: number,
    tEnd: number,
  ): D_WavePoint_Interface[] {
    const result: D_WavePoint_Interface[] = [];
    const kinds: A_WaveKind[] = [ A_WaveKind.astral, A_WaveKind.mental, A_WaveKind.matter ];

    for (const kind of kinds) {
      for (const r of series[kind]) {
        const t: number = new Date(r.__created).getTime();
        const ratio: number = (t - tStart) / (tEnd - tStart);

        if (ratio < 0 || ratio > 1) continue;

        const cx: number = VIEW.padX + INNER_W * ratio;
        const cy: number = yFor(r.value);
        const d: Date = new Date(t);
        const tsLabel: string = `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
        const palette = PALETTE[kind];
        const noteSuffix: string = r.note ? ` · ${r.note}` : '';
        const tooltip: string = `${tsLabel} · ${palette.emoji} ${palette.label}=${r.value}${noteSuffix}`;

        result.push({ kind, cx, cy, tooltip });
      }
    }

    return result;
  }

  /** Aktuálisan kiválasztott interval — a preset gombok highlight-jához. */
  get selectedRangeHours(): number {
    return this.control.getRangeHours();
  }

  /** Preset gomb click → control-service-en át új interval + refresh. */
  handleSelectRange(hours: number): void {
    this.control.setRangeHours(hours);
  }

  /**
   * Custom interval — egyszerű prompt() input napokban (1-365 között).
   * Phase 5c MVP: később date-picker komponens-re cserélhető (~Phase 5c-extra).
   */
  handleCustomRange(): void {
    if (typeof window === 'undefined') return;
    const raw: string | null = window.prompt('Egyéni intervallum napokban (1-365):', '14');

    if (!raw) return;
    const days: number = Number(raw.trim());

    if (!Number.isFinite(days) || days <= 0) return;
    this.control.setRangeHours(Math.round(days * 24));
  }

  /** FR #3b-WAVE-UI Phase 5d (cycle 86): fullscreen toggle + esc listener. */
  handleFullscreenToggle(): void {
    this.isFullscreen = !this.isFullscreen;
    if (this.isFullscreen) {
      this.attachEscListener();
    } else {
      this.detachEscListener();
    }
  }

  private attachEscListener(): void {
    if (typeof window === 'undefined' || this.escListener) return;
    this.escListener = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && this.isFullscreen) {
        this.isFullscreen = false;
        this.detachEscListener();
      }
    };
    window.addEventListener('keydown', this.escListener);
  }

  private detachEscListener(): void {
    if (typeof window === 'undefined' || !this.escListener) return;
    window.removeEventListener('keydown', this.escListener);
    this.escListener = null;
  }

  /** Cleanup — esc listener uninstall on component destroy. */
  ngOnDestroy(): void {
    this.detachEscListener();
  }

  /**
   * Per-kind sin/cos fit. Asztrálnál bias-T=29.5d (chat AGB-19), mentál/anyag
   * empirikus scan a PERIOD_CANDIDATES_MS-en. <4 pont → skip.
   */
  private computeFitPaths(
    series: Record<A_WaveKind, A_WaveRow[]>,
    tStart: number,
    tEnd: number,
  ): D_WaveFitPath_Interface[] {
    const kinds: A_WaveKind[] = [ A_WaveKind.astral, A_WaveKind.mental, A_WaveKind.matter ];
    const paths: D_WaveFitPath_Interface[] = [];

    for (const kind of kinds) {
      const points: FitPoint_Interface[] = series[kind].map(
        (r: A_WaveRow): FitPoint_Interface => ({ t: new Date(r.__created).getTime(), y: r.value }),
      );

      if (points.length < FIT_MIN_POINTS) continue;

      const bias: number | undefined = kind === A_WaveKind.astral ? ASTRAL_DEFAULT_PERIOD_MS : undefined;
      const fit: SinFit_Interface | null = pickBestPeriod(points, undefined, bias);

      if (!fit) continue;

      const samples = sampleSinFit(fit, tStart, tEnd, FIT_SAMPLE_COUNT);
      const svgPoints: string = samples.map((s): string => {
        const ratio: number = (s.dt - tStart) / (tEnd - tStart);
        const x: number = VIEW.padX + INNER_W * Math.max(0, Math.min(1, ratio));

        return `${x.toFixed(1)},${yFor(s.y).toFixed(1)}`;
      }).join(' ');

      paths.push({
        kind,
        points: svgPoints,
        color: PALETTE[kind].color,
        periodDays: fit.T / (24 * 3600_000),
      });
    }

    return paths;
  }
}
