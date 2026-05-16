// Dashboard orchestrator. Owns the polling timer and the post-mutation refresh
// strategy. Every async path catches the error here, routes it through
// `A_Error_ControlService.showError()` (debug-level toast + server-side
// persistence) exactly once, and does NOT rethrow — callers see the side
// effect via the data-service state, not via exception.
//
// FR #3b-WAVE-UI Phase 2.B (cycle 53): refresh() egy 401 esetén automatikusan
// átvált JSONL-fallback path-re (`/api/wave/get-from-jsonl`), így a wave-panel
// auth-tokent nélkülözve is megjelenik. AUTH BLOCKER (AGB-03 task B) bypass.

import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { Subscription, timer } from 'rxjs';

import { A_Server_ApiService } from '../../../_services/api-services/a-server.api-service';
import { A_Error_ControlService } from '../../../_services/control-services/a-error.control-service';
import {
  A_DomainEvent_DataService,
  type A_DomainEvent_Interface,
} from '../../../_services/data-services/a-domain-event.data-service';
import { D_Dashboard_DataService } from './d-dashboard.data-service';
import { buildJsonlFallbackSnapshot } from './wave-jsonl-fallback.util';
import {
  type A_CapturePayload,
  type A_DashboardSnapshot,
  type A_InsightPayload,
  type A_WaveJsonlAppendResponse,
  type A_WaveJsonlResponse,
  type A_WaveJsonlSnapshotPayload
} from '../../../_models/server-envelope.interface';

const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
/** Dashboard orchestrator — polling timer + post-mutation refresh, központosított error routing. */
export class D_Dashboard_ControlService implements OnDestroy {

  private readonly api: A_Server_ApiService = inject(A_Server_ApiService);
  private readonly data: D_Dashboard_DataService = inject(D_Dashboard_DataService);
  private readonly error_CS: A_Error_ControlService = inject(A_Error_ControlService);
  private readonly domainEvent_DS: A_DomainEvent_DataService = inject(A_DomainEvent_DataService);

  private pollSub: Subscription | null = null;
  private domainSub: Subscription | null = null;
  private isInFlight: boolean = false;

  /** A dashboard-relevant domain topics — ezekre refresh-trigger. */
  private static readonly DASHBOARD_TOPICS: ReadonlySet<string> = new Set([ 'wave', 'insight', 'capture' ]);

  /** Elindítja a 30s-os polling timer-t + socket-driven refresh-trigger-t. Idempotens — duplikált hívás no-op. */
  startPolling(): void {
    if (this.pollSub) {
      return;
    }
    this.pollSub = timer(0, POLL_INTERVAL_MS).subscribe((): void => {
      void this.refresh();
    });

    // FR #3f Phase 5.C (cycle 82): socket-driven push-refresh — bárhol a server-en
    // egy mutation történik, a kliens azonnal frissül (no polling delay).
    if (!this.domainSub) {
      this.domainSub = this.domainEvent_DS.events$().subscribe(
        (e: A_DomainEvent_Interface): void => {
          if (D_Dashboard_ControlService.DASHBOARD_TOPICS.has(e.topic)) {
            void this.refresh();
          }
        },
      );
    }
  }

  /** Leállítja a polling-ot és a domain-subscription-t. */
  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
    this.domainSub?.unsubscribe();
    this.domainSub = null;
  }

  /** Angular lifecycle — service destroy esetén automatikusan stopPolling. */
  ngOnDestroy(): void {
    this.stopPolling();
  }

  /**
   * Egy snapshot lekérés a szervertől. 401 esetén automatikusan JSONL-fallback-re
   * vált át (FR #3b-WAVE-UI Phase 2.B), így a wave-panel auth-tokent nélkülözve
   * is megjelenik. Egyéb hiba az error_CS-en át route-olódik.
   */
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
      if (this.isAuthError(err)) {
        const fellBack: boolean = await this.tryJsonlFallback();

        if (fellBack) {
          this.isInFlight = false;

          return;
        }
      }

      const details = this.error_CS.showError(err, 'd-dashboard.refresh');

      this.data.setError(details.message);
    } finally {
      this.isInFlight = false;
    }
  }

  /** 401 vagy DyFM-AuthHeader hiba detekt. */
  private isAuthError(err: unknown): boolean {
    if (err instanceof HttpErrorResponse) {
      return err.status === 401;
    }

    return false;
  }

  /**
   * JSONL-fallback path — `/api/wave/get-from-jsonl` unauth endpoint hívása,
   * majd a JSONL row-okat A_DashboardSnapshot shape-re konvertálja és state-be
   * írja. Ha a fallback maga is failel, visszaadja false-t és a hívó normál
   * error-routing-ot indít.
   */
  private async tryJsonlFallback(): Promise<boolean> {
    try {
      const resp: A_WaveJsonlResponse = await this.api.getWavesFromJsonl(14);
      const snap: A_DashboardSnapshot = buildJsonlFallbackSnapshot(resp.rows);

      this.data.setSnapshot(snap);

      return true;
    } catch (fallbackErr) {
      this.error_CS.showError(fallbackErr, 'd-dashboard.refresh.jsonl-fallback');

      return false;
    }
  }

  /**
   * Új hullám-snapshot submit a `POST /api/wave/log-public` (unauth) endpoint-re.
   * Sikeres append után automatikusan refresh-eli a dashboardot. Validáció-hibát
   * (`ok: false` envelope-pal) Error-rá konvertál hogy a hívó form ack helyett
   * error-routing-ot kapjon. FR #3b-WAVE-UI Phase 3.B (cycle 55).
   */
  async submitWaveSnapshot(payload: A_WaveJsonlSnapshotPayload): Promise<A_WaveJsonlAppendResponse> {
    try {
      const result: A_WaveJsonlAppendResponse = await this.api.postWaveLogPublic(payload);

      if (!result.ok) {
        throw new Error(`[${result.errorCode}] ${result.message}`);
      }
      await this.refresh();

      return result;
    } catch (err) {
      this.error_CS.showError(err, 'd-dashboard.submitWaveSnapshot');

      throw err;
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
