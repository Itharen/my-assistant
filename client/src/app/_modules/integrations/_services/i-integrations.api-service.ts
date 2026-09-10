// Integrations api-service — thin wrapper a server `/api/{spotify,google}/...`
// endpointokhoz. SSoT a típusoknak: `@server-models` barrel
// (`current/principles/ssot.md` cross-subproject pattern).

import { inject, Injectable } from '@angular/core';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNX_ApiCall_Settings, DyNX_ApiService } from '@futdevpro/ngx-dynamo';

import { API_CONFIG } from '../../../_collections/api-config.const';
import { A_StorageKey } from '../../../_enums/a-storage-key.enum';
import type {
  SpotifyStatusResponse,
  GoogleStatusResponse,
  GoogleQueryResult,
} from '@server-models';

@Injectable({ providedIn: 'root' })
/** Integrations API client — Spotify + Google status, OAuth start, query. */
export class I_Integrations_ApiService {

  private readonly Đ_AS: DyNX_ApiService = inject(DyNX_ApiService);

  private resolveBaseUrl(): string {
    const fromStorage: string | null =
      typeof window !== 'undefined' ? localStorage.getItem(A_StorageKey.serverBaseUrl) : null;
    return fromStorage ?? API_CONFIG.defaultBaseUrl;
  }

  // ===== Spotify ============================================================

  /** GET `/spotify/status` — config state + token validity + current playback + devices. */
  async getSpotifyStatus(): Promise<SpotifyStatusResponse> {
    return this.Đ_AS.call<SpotifyStatusResponse>(
      new DyNX_ApiCall_Settings({
        name: 'getSpotifyStatus',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/spotify/status',
      }),
    );
  }

  /** GET `/spotify/auth/start` — visszaadja az authorize URL-t (új ablakba kell nyitni). */
  async startSpotifyAuth(): Promise<{ url: string; state: string } | { error: string }> {
    return this.Đ_AS.call(
      new DyNX_ApiCall_Settings({
        name: 'startSpotifyAuth',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/spotify/auth/start',
      }),
    );
  }

  // ===== Google =============================================================

  /** GET `/google/status` — config + tokens + device IDs + nextStep. */
  async getGoogleStatus(): Promise<GoogleStatusResponse> {
    return this.Đ_AS.call<GoogleStatusResponse>(
      new DyNX_ApiCall_Settings({
        name: 'getGoogleStatus',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/google/status',
      }),
    );
  }

  /** GET `/google/auth/start` — visszaadja az authorize URL-t. */
  async startGoogleAuth(): Promise<{ url: string; state: string } | { error: string }> {
    return this.Đ_AS.call(
      new DyNX_ApiCall_Settings({
        name: 'startGoogleAuth',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/google/auth/start',
      }),
    );
  }

  /** POST `/google/query` — text query Assistant SDK-n. */
  async sendGoogleQuery(text: string, lang?: string): Promise<{ ok: boolean; result?: GoogleQueryResult; error?: string }> {
    return this.Đ_AS.call<{ ok: boolean; result?: GoogleQueryResult; error?: string }, { text: string; lang?: string }>(
      new DyNX_ApiCall_Settings({
        name: 'sendGoogleQuery',
        type: DyFM_HttpCallType.post,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/google/query',
      }),
      { body: { text, lang } },
    );
  }

  // ===== Hang-csatorna hangero ==============================================

  /**
   * GET `/voice/volume` — a jelenlegi hangero ES a SAV.
   *
   * ⚠️ A savot (`min`/`max`/`default`) a szerver adja, ⛔ nem egetjuk be a kliensbe: kulonben
   * a csuszka mast engedne, mint amit a tenyleges ellenorzes elfogad.
   */
  async getVoiceVolume(): Promise<{ volume: number; default: number; min: number; max: number }> {
    return this.Đ_AS.call<{ volume: number; default: number; min: number; max: number }>(
      new DyNX_ApiCall_Settings({
        name: 'getVoiceVolume',
        type: DyFM_HttpCallType.get,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/voice/volume',
      }),
    );
  }

  /**
   * PUT `/voice/volume` — a hangero beallitasa.
   *
   * ⭐ A valasz `ok: false` eseten is 200: a `detail` mondja meg, MIERT nem valtozott, es a
   * `volume` a VALTOZATLAN erteket adja vissza. Egy nyers HTTP-hiba a felületen csak
   * „valami elromlott"-kent latszana.
   */
  async setVoiceVolume(volume: number): Promise<{
    ok: boolean;
    volume: number;
    detail?: string;
    remedy?: string;
  }> {
    return this.Đ_AS.call<
      { ok: boolean; volume: number; detail?: string; remedy?: string },
      { volume: number }
    >(
      new DyNX_ApiCall_Settings({
        name: 'setVoiceVolume',
        type: DyFM_HttpCallType.put,
        baseUrl: this.resolveBaseUrl(),
        endpoint: '/voice/volume',
      }),
      { body: { volume: volume } },
    );
  }
}
