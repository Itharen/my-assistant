// Insights panel (bottom-left, small). Shows agent-emitted observations
// ("amit észrevettem"). Each line has a one-tap ✕ button that dismisses the
// insight server-side and triggers a snapshot refresh. Icons are precomputed
// per row when the snapshot changes so the template makes no method calls.

import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';

import {
  type A_DashboardSnapshot,
  type A_InsightRow,
  type A_InsightSeverity
} from '../../../../_models/server-envelope.interface';

import { D_Dashboard_ControlService } from '../../_services/d-dashboard.control-service';

interface D_InsightRow_Interface {
  item: A_InsightRow;
  icon: string;
  isUrgent: boolean;
}

const SEVERITY_ICON: Record<A_InsightSeverity, string> = {
  info: '💬',
  notice: '👀',
  warn: '⚠️',
  urgent: '🔴',
};

@Component({
  standalone: true,
  selector: 'd-insights',
  templateUrl: './d-insights.component.html',
  styleUrl: './d-insights.component.scss',
  imports: [ CommonModule ],
})
/** Insights panel — agent-emit-elt megfigyelések listája egy-tap dismiss-szel. */
export class D_Insights_Component {

  private readonly control: D_Dashboard_ControlService = inject(D_Dashboard_ControlService);

  rows: D_InsightRow_Interface[] = [];
  busyId: string | null = null;

  /** Snapshot setter — előszámolja a sor-objektumokat (icon, isUrgent) hogy a template ne hívjon metódusokat. */
  @Input() set snapshot(value: A_DashboardSnapshot | null) {
    const items: A_InsightRow[] = value?.insights.items ?? [];

    this.rows = items.map((item: A_InsightRow): D_InsightRow_Interface => ({
      item,
      icon: SEVERITY_ICON[item.severity],
      isUrgent: item.severity === 'urgent',
    }));
  }

  /** Dismiss-eli az adott id-jű insight-ot a szerveren át, kezeli a per-row busy flag-et. */
  async handleDismiss(id: string): Promise<void> {
    this.busyId = id;
    try {
      await this.control.dismissInsight(id);
    } catch {
      // control-service already routed through A_Error_ControlService.
    } finally {
      this.busyId = null;
    }
  }
}
