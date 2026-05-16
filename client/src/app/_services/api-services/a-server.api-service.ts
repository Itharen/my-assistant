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
  type A_StatusSnapshot,
  type A_WaveJsonlAppendResponse,
  type A_WaveJsonlResponse,
  type A_WaveJsonlSnapshotPayload,
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
