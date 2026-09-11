// FDP AI beszédfelismerés — a hívó oldal.
//
// A saját, HELYI szolgáltatásunkat használjuk (owner: *„STT-hez általában a saját rendszert
// szoktuk használni, most is fut a gépen. FDP AI-ként szerepel sok-sok kódban"*).
// ⛔ Nem fizetős szolgáltatás (`current/principles/no-paid-solutions.md`).
//
// A szerződés a `stt.models.ts` fejlécében — MÉRVE, nem feltételezve.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 A HOSSZÚ HANG DARABOLÁSA — a 2026-09-11-i mérés miatt
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
// A szolgáltatás **30 másodpercnél** befagy: a 56,9 mp-es felvételből **295 karaktert** ad, a
// felezettjéből **627-et**. A teljes mérés és a kizárt gyanúk: `stt-audio-window.ts`.
//
// ⇒ Ezért az ablaknál hosszabb hangot **darabonként** ismertetjük fel, és az átiratokat
// összefűzzük. ⛔ **Az FDP AI szolgáltatáshoz nem nyúlunk** *(`fdp-ai-never-restart`)* — a
// darabolás **teljesen a mi oldalunkon** van, a szolgáltatás hívása változatlan.
//
// ⚠️ A RÖVID ESET BÁJTRA VÁLTOZATLAN: az ablak alatti hang *(a nap 84 felvételéből 73)*
// ugyanazon az élesben bizonyított úton megy, mint eddig.

import { inspectTranscript } from './stt.transcript-guard.js';
import { SttAudioWindow_Util } from './stt-audio-window.js';
import type { SttRawResponse, SttResult, SttSegmentation } from './stt.models.js';

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
 *
 * ⚠️ **DARABONKÉNT** él, nem a teljes hangra: egy hosszú üzenet 3 darabja 3× ennyit is
 * várhat. Ez szándékos — a részleges átirat rosszabb, mint a lassú teljes.
 */
export const STT_TIMEOUT_MS: number = 5 * 60_000;

/**
 * A felismerő hívása — ⭐ **SZŰK** alak, ⛔ nem a teljes `typeof fetch`.
 *
 * ⚠️ MIÉRT SZŰK ÉS MIÉRT CSERÉLHETŐ: a darabolás **összefűz** — és az összefűzés logikája
 * *(mit csinálunk, ha EGY darab elbukik)* pont az, ami némán hiányos szöveget adhat. ⇒ Ezt
 * **tesztelni kell**, hálózat nélkül. A `typeof fetch` felülete viszont olyan nagy, hogy egy
 * teszt csak `as` átcímkézéssel tudná utánozni — az pedig elhazudná a típust.
 */
type RecognitionCall = (url: string, init: {
  method: string;
  headers: Record<string, string>;
  body: ArrayBuffer;
  signal: AbortSignal;
}) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

/** Egy hívás nyers kimenete — ⚠️ verdikt nélkül, azt a teljes szövegre mondjuk ki. */
interface RawRecognition {
  ok: boolean;
  text: string;
  detail: string;
  remedy?: string;
  elapsedMs: number;
}

/**
 * Egy hangfájl átirata.
 *
 * 🔴 Hiba esetén NEM dob kivételt, hanem leíró eredményt ad — a hívónak (és az ownernek)
 * az a hasznos, hogy MI hiányzik, nem egy verem-nyom.
 *
 * ⭐ Az ablaknál **hosszabb** hangot darabonként ismerteti fel, és a `segmentation` mezőben
 * **kimondja**, hogy ez történt — ⛔ a néma darabolás ugyanolyan rossz lenne, mint a néma
 * csonkolás *(a `⚠️ GYANÚS TAGOLÁS` jelző mintájára)*.
 */
export async function transcribeAudio(params: {
  /** A nyers hangfájl. `Buffer` is elfogadott — az is `Uint8Array`. */
  audio: Uint8Array;
  filename: string;
  contentType?: string;
  confidenceThreshold?: number;
  /**
   * A hangfájl hossza másodpercben, ha a forrás megadja (a Discord küldi).
   *
   * ⭐ MIÉRT SZÁMÍT: enélkül a bukott felismerést csak a szöveg hosszából lehetne sejteni —
   * és a mért eset (9 mp hang → „Köszönöm") pontosan azt csúsztatta át. Az arány a jel.
   */
  audioDurationSecs?: number;
  /** A HTTP-hívás — cserélhető a teszthez. ⚠️ Élesben a valódi `fetch`. */
  fetchImpl?: RecognitionCall;
}): Promise<SttResult> {
  const startedAt: number = Date.now();
  const threshold: number = params.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;
  const chunks = SttAudioWindow_Util.split(params.audio);
  // ⭐ A HOSSZ A HANGBÓL, ha a hívó nem adta meg — a gyanú-ellenőrzés aránya ezen áll.
  const measuredSecs: number | null = SttAudioWindow_Util.durationSecs(params.audio);
  const durationSecs: number | undefined = params.audioDurationSecs
    ?? (measuredSecs === null ? undefined : measuredSecs);

  // ── A RÖVID (VAGY NEM-WAV) ESET — ⛔ bájtra a mai út ─────────────────────────────────────
  if (chunks.length <= 1) {
    const single: RawRecognition = await recognizeOnce({
      audio: params.audio,
      filename: params.filename,
      ...(params.contentType ? { contentType: params.contentType } : {}),
      threshold: threshold,
      ...(params.fetchImpl ? { fetchImpl: params.fetchImpl } : {}),
    });

    return finish({ parts: [single], startedAt: startedAt, midSpeechCuts: 0, ...(durationSecs === undefined ? {} : { durationSecs: durationSecs }) });
  }

  // ── A HOSSZÚ ESET — darabonként, EGYMÁS UTÁN ─────────────────────────────────────────────
  //
  // ⛔ SZÁNDÉKOSAN NEM PÁRHUZAMOSAN: a szolgáltatás **egy** modellt futtat egy GPU-n. A
  // párhuzamos hívás nem gyorsítana, viszont a mért 5 perces időtúllépés-ablakot **mindegyik**
  // darabnál kimeríthetné — és a szolgáltatást se terheljük jobban, mint eddig.
  const parts: RawRecognition[] = [];
  let midSpeechCuts: number = 0;

  for (let index: number = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];

    if (!chunk) continue;

    if (chunk.cutMidSpeech) midSpeechCuts += 1;

    parts.push(await recognizeOnce({
      audio: chunk.audio,
      // ⚠️ A darab SAJÁT nevet kap: a szolgáltatás naplójában így követhető, melyik szakasz
      // melyik hívás volt — ⛔ három azonos nevű kérés nem nyomozható.
      filename: `${params.filename}.part${index + 1}.wav`,
      contentType: 'audio/wav',
      threshold: threshold,
      ...(params.fetchImpl ? { fetchImpl: params.fetchImpl } : {}),
    }));
  }

  return finish({
    parts: parts,
    startedAt: startedAt,
    midSpeechCuts: midSpeechCuts,
    ...(durationSecs === undefined ? {} : { durationSecs: durationSecs }),
  });
}

/**
 * A darab-eredményekből EGY válasz — a verdikt a **teljes** szövegre szól.
 *
 * 🔴 AMIT ITT NEM SZABAD ELHALLGATNI: ha **egy darab elbukott**, a szöveg **hiányos**, akkor is,
 * ha a többi sikerült. ⇒ Ilyenkor a `segmentation.failedParts` nem nulla, és a hívó ezt
 * **megjeleníti**. ⚠️ Egy hiányos átirat pontosan úgy néz ki, mint egy teljes — ez az a
 * hibaosztály, ami ezt az egész munkát kiváltotta.
 */
function finish(input: {
  parts: RawRecognition[];
  startedAt: number;
  midSpeechCuts: number;
  durationSecs?: number;
}): SttResult {
  const succeeded: RawRecognition[] = input.parts.filter((part: RawRecognition): boolean => part.ok);
  const failed: RawRecognition[] = input.parts.filter((part: RawRecognition): boolean => !part.ok);
  const text: string = succeeded
    .map((part: RawRecognition): string => part.text.trim())
    .filter((part: string): boolean => part.length > 0)
    .join(' ')
    .trim();
  const elapsedMs: number = Date.now() - input.startedAt;

  // 🔴 MINDEN darab elbukott ⇒ ez NEM részleges eredmény, hanem bukás. A hívó ilyenkor
  // újrapróbálhatja (és a hangot elteszi) — ezért a `remedy` az első bukásból jön.
  if (!succeeded.length) {
    const first: RawRecognition | undefined = input.parts[0];

    return {
      ok: false,
      text: '',
      detail: first?.detail ?? 'A felismerés nem futott le.',
      ...(first?.remedy ? { remedy: first.remedy } : {}),
      elapsedMs: elapsedMs,
      suspicious: true,
      ...(input.parts.length > 1
        ? { segmentation: describeSegmentation(input.parts.length, failed.length, input.midSpeechCuts) }
        : {}),
    };
  }

  const verdict = inspectTranscript(
    text,
    input.durationSecs === undefined ? {} : { audioDurationSecs: input.durationSecs },
  );
  // 🔴 A HIÁNY-JELZÉS MINDIG ELŐRE KERÜL — ⛔ soha nem szorítja ki más gyanú.
  //
  // ⚠️ MÉRT HIBA, a teszt fogta meg (2026-09-11): egy elbukott darabnál az arány-őr
  // *(„70 mp hangból 25 karakter")* is megszólalt, és a korábbi `!verdict.reason` feltétel
  // miatt **AZ** került az indoklásba. ⇒ A leglényegesebb tény — hogy a szöveg **HIÁNYOS**,
  // mert egy részlet felismerése elbukott — **eltűnt** egy általánosabb panasz mögött.
  // ⭐ Most a kettő EGYÜTT megy ki: az ok és a tünet is látszik.
  const failureNote: string = failed.length
    ? `A hang ${input.parts.length} részletéből ${failed.length} felismerése elbukott — a `
      + `szöveg HIÁNYOS. Első hiba: ${failed[0]?.detail ?? '(nincs részlet)'}`
    : '';
  const reason: string = [failureNote, verdict.reason ?? '']
    .filter((part: string): boolean => part.length > 0)
    .join(' · ');
  const partNote: string = input.parts.length > 1
    ? ` ${input.parts.length} részletben (a felismerő ${SttAudioWindow_Util.RECOGNIZER_WINDOW_SECS} `
      + `mp-es ablaka miatt)${failed.length ? `, ebből ${failed.length} elbukott` : ''}.`
    : '';

  return {
    ok: true,
    text: text,
    detail: `Felismerve ${Math.round(elapsedMs / 100) / 10} mp alatt.${partNote}`,
    elapsedMs: elapsedMs,
    // 🔴 A HIÁNYOS ÁTIRAT GYANÚS — akkor is, ha a szöveg maga rendben van. ⛔ Egy elbukott
    // darab utáni „minden oké" pont a néma veszteség lenne.
    suspicious: verdict.suspicious || failed.length > 0,
    ...(reason ? { suspicionReason: reason } : {}),
    ...(input.parts.length > 1
      ? { segmentation: describeSegmentation(input.parts.length, failed.length, input.midSpeechCuts) }
      : {}),
  };
}

/** A darabolás kimondott képe — ez kerül a jelölésbe. */
function describeSegmentation(parts: number, failedParts: number, midSpeechCuts: number): SttSegmentation {
  return {
    parts: parts,
    failedParts: failedParts,
    midSpeechCuts: midSpeechCuts,
    windowSecs: SttAudioWindow_Util.RECOGNIZER_WINDOW_SECS,
  };
}

/** EGY felismerő-hívás. ⚠️ Verdiktet nem mond — azt a teljes szövegre mondjuk ki. */
async function recognizeOnce(params: {
  audio: Uint8Array;
  filename: string;
  contentType?: string;
  threshold: number;
  fetchImpl?: RecognitionCall;
}): Promise<RawRecognition> {
  const startedAt: number = Date.now();
  const call: RecognitionCall = params.fetchImpl ?? fetch;
  const url = new URL('/api/recognition', FDP_AI_BASE_URL);

  url.searchParams.set('confidence_threshold', String(params.threshold));
  // A besorolást kihagyjuk: a Discord-hangüzenetről tudjuk, hogy szándékolt beszéd.
  url.searchParams.set('skip_classification', '1');

  const controller = new AbortController();
  const timer = setTimeout((): void => controller.abort(), STT_TIMEOUT_MS);

  try {
    const response = await call(url.toString(), {
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
      };
    }

    const raw = await response.json() as SttRawResponse;
    // A CCAP-implementáció mindkét alakot kezelte — átvesszük, mert a szolgáltatás
    // verziói eltérhetnek.
    const text: string = (raw.result?.text ?? raw.text ?? '').trim();

    return {
      ok: true,
      text: text,
      detail: `Felismerve ${Math.round((Date.now() - startedAt) / 100) / 10} mp alatt `
        + `(státusz: ${raw.status ?? 'ismeretlen'}).`,
      elapsedMs: Date.now() - startedAt,
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
    };
  } finally {
    clearTimeout(timer);
  }
}
