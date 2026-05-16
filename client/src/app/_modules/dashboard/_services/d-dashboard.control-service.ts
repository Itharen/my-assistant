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
  type A_WaveJsonlSnapshotPayload,
  type A_WaveMarker_Row
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

  /** FR #3b-WAVE-UI Phase 5c (cycle 85): user-választott interval, localStorage-persisted. Default 24h. */
  private rangeHours: number = 24;
  private static readonly STORAGE_KEY: string = 'ma:wave-range-hours';
  private static readonly RANGE_MIN_H: number = 1;
  private static readonly RANGE_MAX_H: number = 24 * 365;

  /** A dashboard-relevant domain topics — ezekre refresh-trigger. */
  private static readonly DASHBOARD_TOPICS: ReadonlySet<string> = new Set([ 'wave', 'insight', 'capture' ]);

  /** Konstruktor — localStorage-ból visszahúzza az utolsó user-választott interval-t. */
  constructor() {
    this.rangeHours = this.readPersistedRangeHours();
  }

  /** Pillanatkép a jelenlegi interval-ról (UI subscribe-hoz). */
  getRangeHours(): number {
    return this.rangeHours;
  }

  /**
   * User-választott új interval set-elése + localStorage-persist + azonnali refresh.
   * Clamp-elve [RANGE_MIN_H, RANGE_MAX_H] közé, NaN/0 → no-op.
   */
  setRangeHours(hours: number): void {
    if (!Number.isFinite(hours) || hours <= 0) {
      return;
    }
    const clamped: number = Math.max(D_Dashboard_ControlService.RANGE_MIN_H, Math.min(D_Dashboard_ControlService.RANGE_MAX_H, Math.round(hours)));

    if (clamped === this.rangeHours) {
      return;
    }
    this.rangeHours = clamped;
    this.persistRangeHours(clamped);
    void this.refresh();
  }

  /** localStorage read — fallback 24h ha üres / invalid. */
  private readPersistedRangeHours(): number {
    try {
      const raw: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem(D_Dashboard_ControlService.STORAGE_KEY) : null;

      if (!raw) return 24;
      const parsed: number = Number(raw);

      return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 24;
    } catch {
      return 24;
    }
  }

  /**
   * FR #3b-WAVE-UI Phase 5e.3 (cycle 89): wave-marker fetch a state-be a refresh
   * mellett. Hiba esetén csendben skip (a marker-overlay opcionális enrichment).
   */
  private async fetchMarkers(): Promise<void> {
    try {
      const now: number = Date.now();
      const sinceMs: number = now - this.rangeHours * 3600_000;
      const resp = await this.api.getWaveMarkers(sinceMs, now);
      this.data.setMarkers(resp.rows);
    } catch (err) {
      // No toast — marker overlay opcionális, NEM blocker. Csak action-log lenne értelmes,
      // de a server-side hibái már ott vannak (MA-WAVE-MARKERS-*).
      void err;
    }
  }

  /** localStorage write — silently ignore on quota/permission errors. */
  private persistRangeHours(hours: number): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(D_Dashboard_ControlService.STORAGE_KEY, String(hours));
      }
    } catch {
      /* ignore */
    }
  }

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
      const snap: A_DashboardSnapshot = await this.api.getDashboard(this.rangeHours);

      this.data.setSnapshot(snap);
      // FR #3b-WAVE-UI Phase 5e.3 (cycle 89): párhuzamos marker fetch, no-throw.
      void this.fetchMarkers();
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
