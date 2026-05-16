// Waves panel (top-right, big). 3 line series — astral / mental / matter —
// rendered as inline SVG (no chart library). Values are 0..100, plotted across
// the configured range (default 24h from /dashboard). Feeding happens through
// the capture panel (kind=energy) which fans out to 3 wave rows server-side.
// The polylines + grid + Y-axis ticks are precomputed on each snapshot change
// so the template never calls a method during change detection.

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import {
  A_WaveKind,
  type A_DashboardSnapshot,
  type A_WaveContext,
  type A_WaveRow
} from '../../../../_models/server-envelope.interface';
import { D_WavesForm_Component } from '../d-waves-form/d-waves-form.component';

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

@Component({
  standalone: true,
  selector: 'd-waves',
  templateUrl: './d-waves.component.html',
  styleUrl: './d-waves.component.scss',
  imports: [ CommonModule, D_WavesForm_Component ],
})
/** Waves panel — 3 vonalas SVG diagram astral/mental/matter time-series-szel, precomputált polyline-okkal. */
export class D_Waves_Component {
  readonly viewBox: string = `0 0 ${VIEW.width} ${VIEW.height}`;
  readonly axisLeft: number = VIEW.padX;
  readonly axisRight: number = VIEW.width - VIEW.padX;
  readonly gridTicks: D_WaveGridTick_Interface[] =
    Y_GRID_VALUES.map((v: number): D_WaveGridTick_Interface => ({ value: v, y: yFor(v) }));

  rangeHours: number = 24;
  hasData: boolean = false;
  polylines: D_WavePolyline_Interface[] = [];
  context: A_WaveContext | null = null;

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
  }
}
