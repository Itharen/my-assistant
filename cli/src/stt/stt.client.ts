// FDP AI beszédfelismerés — a hívó oldal.
//
// A saját, HELYI szolgáltatásunkat használjuk (owner: *„STT-hez általában a saját rendszert
// szoktuk használni, most is fut a gépen. FDP AI-ként szerepel sok-sok kódban"*).
// ⛔ Nem fizetős szolgáltatás (`current/principles/no-paid-solutions.md`).
//
// A szerződés a `stt.models.ts` fejlécében — MÉRVE, nem feltételezve.

import { inspectTranscript } from './stt.transcript-guard.js';
import type { SttRawResponse, SttResult } from './stt.models.js';

/** A helyi FDP AI alapcíme. Felülírható, ha a szolgáltatás máshol figyel. */
export const FDP_AI_BASE_URL: string = process.env['MA_FDP_AI_URL']?.trim() || 'http://127.0.0.1:38321';

/** A szolgáltatás beállított küszöbe (mérve: `/api/diagnostics` → 0.55). */
export const DEFAULT_CONFIDENCE_THRESHOLD: number = 0.55;

/**
 * Ennyit várunk egy felismerésre.
 *
 * ⚠️ A futásidő ERŐSEN INGADOZIK, és ezt MÉRTÜK, nem becsültük:
 *  - hideg modell + **93%-os rendszer-RAM** mellett 5 percen túl sem futott le (2026-09-07);
 *  - ugyanaz a fájl közvetlenül utána **77,6 mp** alatt, helyes átirattal;
 *  - terheletlen, bemelegedett modellel ~2 s.
 * Ezért a korlát nagyvonalú — inkább várjunk, mint hamisan „nem sikerült"-et mondjunk.
 */
export const STT_TIMEOUT_MS: number = 5 * 60_000;

/**
 * Egy hangfájl átirata.
 *
 * 🔴 Hiba esetén NEM dob kivételt, hanem leíró eredményt ad — a hívónak (és az ownernek)
 * az a hasznos, hogy MI hiányzik, nem egy verem-nyom.
 */
export async function transcribeAudio(params: {
  /** A nyers hangfájl. `Buffer` is elfogadott — az is `Uint8Array`. */
  audio: Uint8Array;
  filename: string;
  contentType?: string;
  confidenceThreshold?: number;
}): Promise<SttResult> {
  const startedAt: number = Date.now();
  const threshold: number = params.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
  const url = new URL('/api/recognition', FDP_AI_BASE_URL);

  url.searchParams.set('confidence_threshold', String(threshold));
  // A besorolást kihagyjuk: a Discord-hangüzenetről tudjuk, hogy szándékolt beszéd.
  url.searchParams.set('skip_classification', '1');

  const controller = new AbortController();
  const timer = setTimeout((): void => controller.abort(), STT_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        // ⚠️ NYERS bájtok mennek, NEM multipart — ezt mértük a működő CCAP-kódból.
        'Content-Type': params.contentType ?? 'audio/webm',
        'Filename': params.filename,
      },
      // A `fetch` típusa nem ismeri el a `Uint8Array`-t testként, futásidőben viszont
      // tökéletesen kezeli. A mögöttes ArrayBuffer-t adjuk át — az szerepel a `BodyInit`-ben.
      body: params.audio.buffer.slice(
        params.audio.byteOffset,
        params.audio.byteOffset + params.audio.byteLength,
      ) as ArrayBuffer,
      signal: controller.signal,
    });

    if (!response.ok) {
      const body: string = await response.text().catch((): string => '');

      return {
        ok: false,
        text: '',
        detail: `A felismerés HTTP ${response.status}-tel elbukott. ${body.slice(0, 200)}`,
        remedy: `Ellenőrizd, hogy fut-e az FDP AI: GET ${FDP_AI_BASE_URL}/api/health. `
          + 'Modell-betöltés: `GET /api/ready`.',
        elapsedMs: Date.now() - startedAt,
        suspicious: true,
      };
    }

    const raw = await response.json() as SttRawResponse;
    // A CCAP-implementáció mindkét alakot kezelte — átvesszük, mert a szolgáltatás
    // verziói eltérhetnek.
    const text: string = (raw.result?.text ?? raw.text ?? '').trim();
    const verdict = inspectTranscript(text);

    return {
      ok: true,
      text,
      detail: `Felismerve ${Math.round((Date.now() - startedAt) / 100) / 10} mp alatt `
        + `(státusz: ${raw.status ?? 'ismeretlen'}).`,
      elapsedMs: Date.now() - startedAt,
      suspicious: verdict.suspicious,
      ...(verdict.reason ? { suspicionReason: verdict.reason } : {}),
    };
  } catch (err: unknown) {
    const aborted: boolean = err instanceof Error && err.name === 'AbortError';

    return {
      ok: false,
      text: '',
      detail: aborted
        ? `A felismerés ${STT_TIMEOUT_MS / 60_000} perc után sem fejeződött be.`
        : `A felismerés nem futott le: ${err instanceof Error ? err.message : String(err)}`,
      remedy: aborted
        ? 'ELŐSZÖR A RENDSZER-RAM-OT NÉZD, ne a GPU-t: 90% fölött a szolgáltatás várakozik '
          + '(owner + mérés, 2026-09-07: 93%-nál 5 perc timeout, közvetlenül utána 77,6 mp). '
          + 'Zárj memóriaéhes folyamatot, vagy próbáld újra — a bemelegedett modell gyors.'
        : `Fut-e az FDP AI? GET ${FDP_AI_BASE_URL}/api/health`,
      elapsedMs: Date.now() - startedAt,
      suspicious: true,
    };
  } finally {
    clearTimeout(timer);
  }
}
