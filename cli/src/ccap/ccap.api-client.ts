// CCAP REST kliens — a my-assistant CCAP-felé menő EGYETLEN kimenő pontja.
//
// ⛔ HARD RULE (owner, 2026-09-06): „Nem kerülheted meg a CCAP-t a neked szánt üzenetekkel."
// A nekem szánt üzenetek KIZÁRÓLAG a CCAP `prompt` végpontján át juthatnak be — sosem
// közvetlen fájlírással vagy más megkerülő úton.
//
// Mért végpontok (élő CCAP, 2026-09-06):
//   GET  /api/cc-session                  → { sessions: [...] }
//   GET  /api/cc-session/:id/inspect      → { ccapId, runtime, queue, flags, ... }
//   POST /api/cc-session/:id/prompt       → { content } ; foglaltság esetén sorba tesz

import { CcapError } from './ccap.error.js';
import type {
  CcapCcSession,
  CcapPromptResult,
  CcapSessionRuntime,
} from './ccap.models.js';

/** A CCAP szerver alapértelmezett címe (mérve: a `ccap status` a 39050-et mutatja). */
const DEFAULT_BASE_URL: string = 'http://localhost:39050';

/** Hálózati időkorlát — a CCAP lokális, tehát a lassú válasz már hiba. */
const REQUEST_TIMEOUT_MS: number = 15_000;

export class CcapApiClient {

  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl ?? process.env.CCAP_SERVER_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  /** A konfigurált alap-URL — a diagnosztika kiírja, hogy hova próbált csatlakozni. */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /** Az összes CC session lekérdezése. */
  async listCcSessions(): Promise<CcapCcSession[]> {
    const payload = await this.getJson<{ sessions?: unknown }>('/api/cc-session');
    const rawSessions: unknown = payload.sessions;

    if (!Array.isArray(rawSessions)) {
      throw new CcapError(
        'MA-CCAP-BAD-RESPONSE',
        `A CCAP /api/cc-session válaszában nincs "sessions" tömb.`,
        'Ellenőrizd a CCAP verzióját — a végpont szerződése megváltozhatott. `ccap ver`.',
        { received: payload },
      );
    }

    return rawSessions
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry) => ({
        sessionId: readString(entry, 'sessionId'),
        label: readString(entry, 'label'),
        workspacePath: readString(entry, 'workspacePath'),
        status: readString(entry, 'status'),
        claudeSessionId: readString(entry, 'claudeSessionId'),
        isArchived: entry['isArchived'] === true,
      }));
  }

  /**
   * Egy CC session futás-állapota. A KÖTEGELŐ ebből olvassa ki, hogy szabad vagyok-e —
   * enélkül vakon küldene, és minden üzenet külön futást indítana.
   */
  async inspectRuntime(sessionId: string): Promise<CcapSessionRuntime> {
    const payload = await this.getJson<Record<string, unknown>>(
      `/api/cc-session/${encodeURIComponent(sessionId)}/inspect`,
    );

    const runtime = asRecord(payload['runtime']);
    const flags = asRecord(payload['flags']);
    const queue = asRecord(payload['queue']);
    const queueItems: unknown = queue['items'];

    return {
      sessionId: readString(runtime, 'sessionId') || sessionId,
      ccapId: readString(payload, 'ccapId') || readString(runtime, 'ccapId'),
      status: readString(runtime, 'status'),
      isBusyProcessing: flags['isBusyProcessing'] === true,
      queuedItemCount: Array.isArray(queueItems) ? queueItems.length : 0,
      isQueueLocked: queue['isLocked'] === true,
    };
  }

  /**
   * Prompt bejuttatása egy CC sessionbe — a CCAP hivatalos útján.
   *
   * ⚠️ A hívó felelőssége, hogy MÁR KÖTEGELT tartalmat adjon át: egy hívás = egy futás.
   * Több különálló hívás több futást eredményez, ami pontosan az, amit el akarunk kerülni.
   */
  async sendPrompt(params: { sessionId: string; content: string }): Promise<CcapPromptResult> {
    if (!params.content.trim()) {
      throw new CcapError(
        'MA-CCAP-PROMPT-FAILED',
        'Üres promptot nem küldünk a CCAP-nak.',
        'Ellenőrizd a kötegelőt: üres köteg esetén nem szabad küldeni.',
      );
    }

    const raw = await this.requestJson<Record<string, unknown>>(
      `/api/cc-session/${encodeURIComponent(params.sessionId)}/prompt`,
      { method: 'POST', body: JSON.stringify({ content: params.content }) },
    );

    return { queued: raw['queued'] === true, raw: raw };
  }

  // --- belső segédek -------------------------------------------------------

  private async getJson<T>(path: string): Promise<T> {
    return this.requestJson<T>(path, { method: 'GET' });
  }

  private async requestJson<T>(path: string, init: RequestInit): Promise<T> {
    const url: string = `${this.baseUrl}${path}`;
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err: unknown) {
      // A leggyakoribb valós ok: nem fut a CCAP szerver. A hiba MONDJA MEG a megoldást.
      throw new CcapError(
        'MA-CCAP-SERVER-UNREACHABLE',
        `A CCAP szerver nem érhető el: ${url} (${err instanceof Error ? err.message : String(err)})`,
        'Indítsd el vagy ellenőrizd: `ccap status`, szükség esetén `ccap start`. '
          + 'Ha más porton fut, állítsd be a CCAP_SERVER_URL környezeti változót.',
        { url: url },
      );
    }

    const text: string = await response.text();

    if (!response.ok) {
      throw new CcapError(
        'MA-CCAP-BAD-RESPONSE',
        `A CCAP ${response.status} státusszal válaszolt a ${path} hívásra.`,
        response.status === 404
          ? 'Ellenőrizd a session-azonosítót — lehet, hogy a session már nem létezik (`ma ccap whoami`).'
          : 'Nézd meg a CCAP naplóját a részletekért.',
        { status: response.status, bodySnippet: text.slice(0, 400) },
      );
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new CcapError(
        'MA-CCAP-BAD-RESPONSE',
        `A CCAP nem JSON-t adott vissza a ${path} hívásra.`,
        'Valószínűleg más szolgáltatás figyel a porton. Ellenőrizd: `ccap status`.',
        { bodySnippet: text.slice(0, 400) },
      );
    }
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function readString(source: Record<string, unknown>, key: string): string {
  const value: unknown = source[key];

  return typeof value === 'string' ? value : '';
}
