// Reports home container — FR #3g Phase 1 (cycle 96, AGB-24).
// 3 read-only szekció: FR-board / cycle history / recent ships.
// Adat: server-side /api/reports/{frs,cycles,recent-ships} unauth endpoint-ok.
// Cycle 97+ bővítés: kanban-rendezés FR-eken, blockers, plan-doc roadmap.

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { A_Server_ApiService } from '../../../../_services/api-services/a-server.api-service';
import { A_Error_ControlService } from '../../../../_services/control-services/a-error.control-service';
import {
  type A_ReportActivePlan_Row,
  type A_ReportBlocker_Row,
  type A_ReportCycle_Row,
  type A_ReportFr_Row,
  type A_ReportShip_Row,
} from '../../../../_models/server-envelope.interface';

@Component({
  standalone: true,
  selector: 'r-home',
  templateUrl: './r-home.component.html',
  styleUrl: './r-home.component.scss',
  imports: [ CommonModule, RouterModule ],
})
/** Reports home container — 3 szekció (FR-board, cycle history, recent ships) read-only fetch + render. */
export class R_Home_Component implements OnInit {

  private readonly api: A_Server_ApiService = inject(A_Server_ApiService);
  private readonly error_CS: A_Error_ControlService = inject(A_Error_ControlService);

  isLoading: boolean = true;
  frs: A_ReportFr_Row[] = [];
  cycles: A_ReportCycle_Row[] = [];
  ships: A_ReportShip_Row[] = [];
  plans: A_ReportActivePlan_Row[] = [];
  blockers: A_ReportBlocker_Row[] = [];

  /** Boot fetch — minden endpoint párhuzamosan (Phase 1 + Phase 6). */
  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      const [ frRes, cycleRes, shipRes, planRes, blockerRes ] = await Promise.all([
        this.api.getReportFrs(),
        this.api.getReportCycles(15),
        this.api.getRecentShips(20, 14),
        this.api.getActivePlans(),
        this.api.getBlockers(20),
      ]);

      this.frs = frRes.rows;
      this.cycles = cycleRes.rows;
      this.ships = shipRes.rows;
      this.plans = planRes.rows;
      this.blockers = blockerRes.rows;
    } catch (err) {
      this.error_CS.showError(err, 'r-home.ngOnInit');
    } finally {
      this.isLoading = false;
    }
  }

  /** A plan-percent helper a roadmap-progress-hez (0–100). */
  planPercent(p: A_ReportActivePlan_Row): number {
    if (!p.totalPhases) return 0;

    return Math.round((p.completedPhases / p.totalPhases) * 100);
  }

  /** Aktív (in-progress) plan-ek a list élén. */
  get inProgressPlans(): A_ReportActivePlan_Row[] {
    return this.plans.filter((p): boolean => p.completedPhases > 0 && p.completedPhases < p.totalPhases);
  }

  /** Plan-ek 0% (frissen tervezett) vagy 100% (kész) — backlog/done. */
  get otherPlans(): A_ReportActivePlan_Row[] {
    return this.plans.filter((p): boolean => p.completedPhases === 0 || p.completedPhases >= p.totalPhases);
  }

  /** A status-string első emoji-jából kanban-bucket. */
  bucketFor(status: string): 'active' | 'progress' | 'done' | 'parked' | 'unknown' {
    if (status.includes('✅')) return 'done';
    if (status.includes('🚀') || status.includes('🚧')) return 'progress';
    if (status.includes('🟢')) return 'active';
    if (status.includes('🅿️')) return 'parked';
    if (status.includes('🟡')) return 'active';

    return 'unknown';
  }

  /** Filter FRs by bucket — template helper for kanban columns. */
  frsByBucket(bucket: 'active' | 'progress' | 'done' | 'parked' | 'unknown'): A_ReportFr_Row[] {
    return this.frs.filter((f): boolean => this.bucketFor(f.status) === bucket);
  }

  /** Manual refresh button handler. */
  async handleRefresh(): Promise<void> {
    await this.ngOnInit();
  }
}

