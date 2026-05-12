// Dashboard orchestrator. Owns the polling timer and the post-mutation refresh
// strategy. Every async path catches the error here, routes it through
// `A_Error_ControlService.showError()` (debug-level toast + server-side
// persistence) exactly once, and does NOT rethrow — callers see the side
// effect via the data-service state, not via exception.

import { inject, Injectable, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';

import { A_Server_ApiService } from '../../../_services/api-services/a-server.api-service';
import { A_Error_ControlService } from '../../../_services/control-services/a-error.control-service';
import { D_Dashboard_DataService } from './d-dashboard.data-service';
import {
  type A_CapturePayload,
  type A_DashboardSnapshot,
  type A_InsightPayload
} from '../../../_models/server-envelope.interface';

const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
/** Dashboard orchestrator — polling timer + post-mutation refresh, központosított error routing. */
export class D_Dashboard_ControlService implements OnDestroy {

  private readonly api: A_Server_ApiService = inject(A_Server_ApiService);
  private readonly data: D_Dashboard_DataService = inject(D_Dashboard_DataService);
  private readonly error_CS: A_Error_ControlService = inject(A_Error_ControlService);

  private pollSub: Subscription | null = null;
  private isInFlight: boolean = false;

  /** Elindítja a 30s-os polling timer-t. Idempotens — duplikált hívás no-op. */
  startPolling(): void {
    if (this.pollSub) {
      return;
    }
    this.pollSub = timer(0, POLL_INTERVAL_MS).subscribe((): void => {
      void this.refresh();
    });
  }

  /** Leállítja a polling-ot és felszabadítja a Subscription-t. */
  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }

  /** Angular lifecycle — service destroy esetén automatikusan stopPolling. */
  ngOnDestroy(): void {
    this.stopPolling();
  }

  /** Egy snapshot lekérés a szervertől. Hiba esetén az error_CS-en át route-ol és state-be írja. */
  async refresh(): Promise<void> {
    if (this.isInFlight) {
      return;
    }
    this.isInFlight = true;

    if (!this.data.current().snapshot) {
      this.data.setLoading();
    }
    try {
      const snap: A_DashboardSnapshot = await this.api.getDashboard(24);

      this.data.setSnapshot(snap);
    } catch (err) {
      const details = this.error_CS.showError(err, 'd-dashboard.refresh');

      this.data.setError(details.message);
    } finally {
      this.isInFlight = false;
    }
  }

  /** Capture submit + post-mutation snapshot refresh. Hiba esetén toaszt + rethrow. */
  async submitCapture(payload: A_CapturePayload): Promise<void> {
    try {
      await this.api.postCapture(payload);
      await this.refresh();
    } catch (err) {
      this.error_CS.showError(err, 'd-dashboard.submitCapture');

      throw err;
    }
  }

  /** Új Insight submit + post-mutation snapshot refresh. Hiba esetén toaszt + rethrow. */
  async submitInsight(payload: A_InsightPayload): Promise<void> {
    try {
      await this.api.postInsight(payload);
      await this.refresh();
    } catch (err) {
      this.error_CS.showError(err, 'd-dashboard.submitInsight');

      throw err;
    }
  }

  /** Insight dismiss + post-mutation refresh. Hiba esetén toaszt + rethrow. */
  async dismissInsight(id: string): Promise<void> {
    try {
      await this.api.dismissInsight(id);
      await this.refresh();
    } catch (err) {
      this.error_CS.showError(err, 'd-dashboard.dismissInsight');

      throw err;
    }
  }
}
