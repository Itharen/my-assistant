// HTTP client for the my-assistant server. Uses `DyNX_ApiService` from
// `@futdevpro/ngx-dynamo` — every call goes through `Đ_AS.call()` with a
// typed `DyNX_ApiCall_Settings` instance. Path params + body are passed via
// the standard `DyNX_ApiCallInput_Params` shape.
//
// Pattern source: `LIVE-projects/master-prompter/client/src/app/_services/api-services/a-user.api-service.ts`.

import { inject, Injectable } from '@angular/core';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNX_ApiCall_Settings, DyNX_ApiService } from '@futdevpro/ngx-dynamo';

import { API_CONFIG } from '../../_collections/api-config.const';
import { A_StorageKey } from '../../_enums/a-storage-key.enum';
import {
  type A_CapturePayload,
  type A_CaptureRow,
  type A_DashboardSnapshot,
  type A_InsightPayload,
  type A_InsightRow,
  type A_ReportAgentBus_Row,
  type A_ReportAgentLog_Row,
  type A_ReportCycle_Row,
  type A_ReportFr_Row,
  type A_ReportOpenQuestion_Row,
  type A_ReportShip_Row,
  type A_ReportStatusDev_Snapshot,
  type A_ReportUserInput_Row,
  type A_StatusSnapshot,
  type A_WaveJsonlAppendResponse,
  type A_WaveJsonlResponse,
  type A_WaveJsonlSnapshotPayload,
  type A_WaveMarkers_Response,
  type A_WavePayload,
  type A_WaveRow
} from '../../_models/server-envelope.interface';

@Injectable({ providedIn: 'root' })
/** my-assistant szerver HTTP kliense. Minden hívás DyNX_ApiService.call()-on át megy. */
export class A_Server_ApiService {

  private readonly Đ_AS: DyNX_ApiService = inject(DyNX_ApiService);

  private resolveBaseUrl(): string {
    const fromStorage: string | null =
      typeof window !== 'undefined' ? localStorage.getItem(A_StorageKey.serverBaseUrl) : null;

    return fromStorage ?? API_CONFIG.defaultBaseUrl;
  }

  /** GET `/status` — legacy uptime / tick / activity snapshot. */
  async getStatus(): Promise<A_StatusSnapshot> {
    return this.Đ_AS.call<A_StatusSnapshot>(
      new DyNX_ApiCall_Settings({
        name: 'getStatus',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/status',
      }),
    );
  }

  /** GET `/healthz` — szerver healthcheck (status + schema verzió + uptime). */
  async getHealthz(): Promise<{ status: string; schemaVersion: number; uptimeSeconds: number }> {
    return this.Đ_AS.call(
      new DyNX_ApiCall_Settings({
        name: 'getHealthz',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/healthz',
      }),
    );
  }

  /** GET `/dashboard/snapshot` — aggregált dashboard payload (tasks/waves/insights/captures). */
  async getDashboard(rangeHours: number = 24): Promise<A_DashboardSnapshot> {
    return this.Đ_AS.call<A_DashboardSnapshot>(
      new DyNX_ApiCall_Settings({
        name: 'getDashboardSnapshot',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/dashboard/snapshot',
      }),
      { queryParams: { rangeHours } },
    );
  }

  /**
   * GET `/wave/get-from-jsonl` — unauth JSONL-fallback path. AUTH BLOCKER mellett
   * a wave UI ezt használja a `/dashboard/snapshot` helyett (FR #3b-WAVE-UI Phase 2.A).
   */
  async getWavesFromJsonl(limit: number = 14): Promise<A_WaveJsonlResponse> {
    return this.Đ_AS.call<A_WaveJsonlResponse>(
      new DyNX_ApiCall_Settings({
        name: 'getWavesFromJsonl',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/wave/get-from-jsonl',
      }),
      { queryParams: { limit } },
    );
  }

  /**
   * GET `/wave/markers?sinceMs&untilMs` — unauth action-log szűrt marker-lista
   * (FR #3b-WAVE-UI Phase 5e.3, cycle 89). Wave-panel hover-markers/törés/
   * megoszló-erő/trigger render-hez.
   */
  async getWaveMarkers(sinceMs: number, untilMs: number): Promise<A_WaveMarkers_Response> {
    return this.Đ_AS.call<A_WaveMarkers_Response>(
      new DyNX_ApiCall_Settings({
        name: 'getWaveMarkers',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/wave/markers',
      }),
      { queryParams: { sinceMs, untilMs } },
    );
  }

  /** GET `/reports/frs` — unauth, FR-board (FR #3g Phase 1, cycle 96). */
  async getReportFrs(): Promise<{ rows: A_ReportFr_Row[] }> {
    return this.Đ_AS.call<{ rows: A_ReportFr_Row[] }>(
      new DyNX_ApiCall_Settings({
        name: 'getReportFrs',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/reports/frs',
      }),
    );
  }

  /** GET `/reports/cycles?limit` — unauth, cycle archív list. */
  async getReportCycles(limit: number = 50): Promise<{ rows: A_ReportCycle_Row[]; limit: number }> {
    return this.Đ_AS.call<{ rows: A_ReportCycle_Row[]; limit: number }>(
      new DyNX_ApiCall_Settings({
        name: 'getReportCycles',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/reports/cycles',
      }),
      { queryParams: { limit } },
    );
  }

  /** GET `/reports/recent-ships?limit&days` — unauth, last N ship-action-log entries. */
  async getRecentShips(limit: number = 30, days: number = 14): Promise<{ rows: A_ReportShip_Row[]; limit: number; days: number }> {
    return this.Đ_AS.call<{ rows: A_ReportShip_Row[]; limit: number; days: number }>(
      new DyNX_ApiCall_Settings({
        name: 'getRecentShips',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/reports/recent-ships',
      }),
      { queryParams: { limit, days } },
    );
  }

  /** GET `/reports/status-dev` — unauth, STATUS_DEV.md YAML snapshot (FR #3g Phase 2). */
  async getStatusDev(): Promise<A_ReportStatusDev_Snapshot> {
    return this.Đ_AS.call<A_ReportStatusDev_Snapshot>(
      new DyNX_ApiCall_Settings({
        name: 'getStatusDev',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/reports/status-dev',
      }),
    );
  }

  /** GET `/reports/agent-log?date&actor&limit` — unauth, action-log JSONL filter (default ma + dev-agent). */
  async getAgentLog(date?: string, actor?: string, limit: number = 100): Promise<{ rows: A_ReportAgentLog_Row[]; date: string; actor: string; limit: number }> {
    const queryParams: Record<string, string | number> = { limit };

    if (date) queryParams['date'] = date;
    if (actor) queryParams['actor'] = actor;

    return this.Đ_AS.call<{ rows: A_ReportAgentLog_Row[]; date: string; actor: string; limit: number }>(
      new DyNX_ApiCall_Settings({
        name: 'getAgentLog',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/reports/agent-log',
      }),
      { queryParams },
    );
  }

  /** GET `/reports/agent-bus?limit` — unauth, AGENT_BUS.md entries. */
  async getAgentBus(limit: number = 30): Promise<{ rows: A_ReportAgentBus_Row[]; limit: number }> {
    return this.Đ_AS.call<{ rows: A_ReportAgentBus_Row[]; limit: number }>(
      new DyNX_ApiCall_Settings({
        name: 'getAgentBus',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/reports/agent-bus',
      }),
      { queryParams: { limit } },
    );
  }

  /** GET `/reports/user-input?limit` — unauth, USER_INPUT.md entries (FR #3g Phase 3). */
  async getUserInput(limit: number = 30): Promise<{ rows: A_ReportUserInput_Row[]; limit: number }> {
    return this.Đ_AS.call<{ rows: A_ReportUserInput_Row[]; limit: number }>(
      new DyNX_ApiCall_Settings({
        name: 'getUserInput',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/reports/user-input',
      }),
      { queryParams: { limit } },
    );
  }

  /** GET `/reports/open-questions?limit` — unauth, current/open-questions.md entries. */
  async getOpenQuestions(limit: number = 50): Promise<{ rows: A_ReportOpenQuestion_Row[]; limit: number }> {
    return this.Đ_AS.call<{ rows: A_ReportOpenQuestion_Row[]; limit: number }>(
      new DyNX_ApiCall_Settings({
        name: 'getOpenQuestions',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/reports/open-questions',
      }),
      { queryParams: { limit } },
    );
  }

  /**
   * POST `/wave/log-public` — unauth új-snapshot append a `3x3-log.jsonl`-be.
   * A response 200/400 alapján a hívó eldönti az ack/error útvonalat
   * (FR #3b-WAVE-UI Phase 3.B).
   */
  async postWaveLogPublic(payload: A_WaveJsonlSnapshotPayload): Promise<A_WaveJsonlAppendResponse> {
    return this.Đ_AS.call<A_WaveJsonlAppendResponse, A_WaveJsonlSnapshotPayload>(
      new DyNX_ApiCall_Settings({
        name: 'postWaveLogPublic',
        type: DyFM_HttpCallType.post,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/wave/log-public',
      }),
      { body: payload },
    );
  }

  /** POST `/capture/add` — új capture mentés (text/energy/mood/voice). */
  async postCapture(payload: A_CapturePayload): Promise<A_CaptureRow> {
    return this.Đ_AS.call<A_CaptureRow, A_CapturePayload>(
      new DyNX_ApiCall_Settings({
        name: 'addCapture',
        type: DyFM_HttpCallType.post,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/capture/add',
      }),
      { body: payload },
    );
  }

  /** POST `/wave/add` — közvetlen Wave sample insert (manuális, ritka). */
  async postWave(payload: A_WavePayload): Promise<A_WaveRow> {
    return this.Đ_AS.call<A_WaveRow, A_WavePayload>(
      new DyNX_ApiCall_Settings({
        name: 'addWave',
        type: DyFM_HttpCallType.post,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/wave/add',
      }),
      { body: payload },
    );
  }

  /** POST `/insight/add` — új insight emit-elése. */
  async postInsight(payload: A_InsightPayload): Promise<A_InsightRow> {
    return this.Đ_AS.call<A_InsightRow, A_InsightPayload>(
      new DyNX_ApiCall_Settings({
        name: 'addInsight',
        type: DyFM_HttpCallType.post,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/insight/add',
      }),
      { body: payload },
    );
  }

  /** POST `/insight/dismiss/:id` — adott insight dismissed-re állítása. */
  async dismissInsight(id: string): Promise<A_InsightRow> {
    return this.Đ_AS.call<A_InsightRow>(
      new DyNX_ApiCall_Settings({
        name: 'dismissInsight',
        type: DyFM_HttpCallType.post,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/insight/dismiss/:id',
      }),
      { pathParams: { id } },
    );
  }
}
