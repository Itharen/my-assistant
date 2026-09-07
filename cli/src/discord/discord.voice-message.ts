// Discord HANGÜZENET — felismerés, letöltés, korlátok.
//
// > **Owner-kérés (2026-09-07):** *„Folytasd a discord STT fejlesztést amíg kész nincs"* —
// > és korábban: *„egy voice üzenetet … feldolgozzuk az STT-vel és ilyenkor egyrészt egy
// > mirror üzenetet is kéne küldjél, hogy lássam, hogy jól olvastad fel"*
//
// 🔴 MÉRT BLOKKOLÓ, EZÉRT KÉSZÜLT: a Discord-hangüzenet **üres szöveggel** érkezik, a hang
// egy csatolmány. A bejövő szűrőnk viszont az üres tartalmat elutasította
// *(„Üres üzenet (pl. csak csatolmány) — nincs mit átadni")* ⇒ a hangüzenetek **némán
// elvesztek**. Ez a modul adja a szűrőnek azt a tudást, amivel meg tudja különböztetni a
// „semmit" a „hangüzenettől".

/** Egy Discord-csatolmány — csak az a néhány mező, amit a döntéshez használunk. */
export interface DiscordAttachment {
  id: string;
  /** A letöltési cím. ⚠️ Aláírt és LEJÁR — nem tároljuk, azonnal használjuk. */
  url: string;
  name: string;
  /** A Discord által megadott MIME-típus. Hiányozhat. */
  contentType?: string;
  /** Méret bájtban. */
  size: number;
  /** Hangüzenetnél a hossz másodpercben (a Discord küldi). */
  durationSecs?: number;
}

/**
 * Ekkora hangfájlt még letöltünk.
 *
 * ⚠️ Ez **védőkorlát**, nem a Discord korlátja: egy hibás vagy rosszindulatú csatolmány ne
 * tudja megenni a memóriát. A Discord sima felhasználónál 25 MB-ot enged, egy hangüzenet
 * pedig nagyságrendekkel kisebb — tehát ez a korlát a valós használatot nem érinti.
 * *(Az FDP AI oldali korlát ettől független: 100 MB.)*
 */
export const MAX_VOICE_BYTES: number = 25 * 1024 * 1024;

/** Ennyit várunk a csatolmány letöltésére. */
export const VOICE_DOWNLOAD_TIMEOUT_MS: number = 60_000;

/**
 * Hang-e ez a csatolmány?
 *
 * Két jelre támaszkodunk, mert egyik sem megbízható önmagában: a `contentType` hiányozhat,
 * a fájlnév pedig tetszőleges lehet. Ha BÁRMELYIK hangra utal, hangnak vesszük — a rosszabb
 * hiba az, ha egy valódi hangüzenetet dobunk el.
 */
export function isAudioAttachment(attachment: DiscordAttachment): boolean {
  if (attachment.contentType?.toLowerCase().startsWith('audio/')) return true;

  return AUDIO_EXTENSIONS.some((ext: string): boolean => attachment.name.toLowerCase().endsWith(ext));
}

/** A Discord hangüzenete `.ogg`; a többi a kézzel feltöltött fájlok kedvéért van itt. */
const AUDIO_EXTENSIONS: string[] = [
  '.ogg', '.mp3', '.wav', '.m4a', '.webm', '.opus', '.flac', '.aac', '.mp4',
];

export interface VoiceSelection {
  /** A feldolgozandó hang-csatolmány, ha van. */
  attachment?: DiscordAttachment;
  /** Miért nem — naplózáshoz és a felhasználónak. Csak elutasításnál kitöltött. */
  rejection?: string;
}

/**
 * Melyik csatolmányt dolgozzuk fel?
 *
 * ⛔ Szándékosan **CSAK AZ ELSŐ** hang-csatolmányt: több hangüzenet egy üzenetben nem valós
 * eset, és a „mindet feldolgozom" viselkedés kiszámíthatatlan sorrendű tükör-üzeneteket
 * szülne. Ha mégis több van, az elsőt visszük, és ezt **meg is mondjuk**.
 */
export function selectVoiceAttachment(attachments: DiscordAttachment[]): VoiceSelection {
  const audio: DiscordAttachment[] = attachments.filter(isAudioAttachment);

  if (audio.length === 0) {
    return attachments.length === 0
      ? { rejection: 'Nincs csatolmány.' }
      : { rejection: `A csatolmány(ok) között nincs hang (${attachments.map((a) => a.name).join(', ')}).` };
  }

  // A `length === 0` ágat fentebb már kizártuk, de a típusrendszer ezt nem tudja —
  // védekezünk explicit módon, `!` helyett.
  const chosen: DiscordAttachment | undefined = audio[0];

  if (!chosen) return { rejection: 'Nincs feldolgozható hang-csatolmány.' };

  if (chosen.size > MAX_VOICE_BYTES) {
    return {
      rejection: `A hangfájl túl nagy: ${formatMegabytes(chosen.size)} `
        + `(a korlát ${formatMegabytes(MAX_VOICE_BYTES)}).`,
    };
  }

  return { attachment: chosen };
}

function formatMegabytes(bytes: number): string {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

export interface VoiceDownloadResult {
  ok: boolean;
  bytes?: Uint8Array;
  /** Mi történt — sikernél is kitöltött, hogy naplózható legyen. */
  detail: string;
  /** MIT KELL TENNI, ha nem sikerült. */
  remedy?: string;
}

/**
 * A hang-csatolmány letöltése.
 *
 * 🔴 Hibát NEM dob — leíró eredményt ad. Egy letöltési hiba nem döntheti meg a figyelőt,
 * és a hívónak az a hasznos, hogy MI hiányzik.
 *
 * ⚠️ A méretet **letöltés közben is** ellenőrizzük, nem csak a Discord által bemondott
 * `size` alapján: a bemondott érték egy külső rendszer állítása, nem a mi mérésünk.
 */
export async function downloadVoiceAttachment(
  attachment: DiscordAttachment,
  fetchImpl: typeof fetch = fetch,
): Promise<VoiceDownloadResult> {
  const controller = new AbortController();
  const timer = setTimeout((): void => controller.abort(), VOICE_DOWNLOAD_TIMEOUT_MS);

  try {
    const response = await fetchImpl(attachment.url, { signal: controller.signal });

    if (!response.ok) {
      return {
        ok: false,
        detail: `A hangfájl letöltése HTTP ${response.status}-tel elbukott.`,
        remedy: 'A Discord csatolmány-linkjei ALÁÍRTAK és lejárnak. Küldd újra a hangüzenetet.',
      };
    }

    const bytes = new Uint8Array(await response.arrayBuffer());

    if (bytes.byteLength > MAX_VOICE_BYTES) {
      return {
        ok: false,
        detail: `A letöltött fájl nagyobb a megengedettnél (${formatMegabytes(bytes.byteLength)}).`,
        remedy: 'Küldj rövidebb hangüzenetet.',
      };
    }

    if (bytes.byteLength === 0) {
      return {
        ok: false,
        detail: 'A letöltött hangfájl ÜRES (0 bájt).',
        remedy: 'Küldd újra a hangüzenetet.',
      };
    }

    return { ok: true, bytes, detail: `Letöltve ${formatMegabytes(bytes.byteLength)}.` };
  } catch (err: unknown) {
    const aborted: boolean = err instanceof Error && err.name === 'AbortError';

    return {
      ok: false,
      detail: aborted
        ? `A letöltés ${VOICE_DOWNLOAD_TIMEOUT_MS / 1000} mp alatt sem fejeződött be.`
        : `A letöltés nem futott le: ${err instanceof Error ? err.message : String(err)}`,
      remedy: 'Ellenőrizd a hálózatot, majd küldd újra a hangüzenetet.',
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A kötegbe kerülő szöveg egy felismert hangüzenetből.
 *
 * ⭐ A jelölés KÖTELEZŐ: a sessionnek tudnia kell, hogy ez **gépi átirat**, nem gépelt
 * szöveg — egy félrehallott szó máskülönben az owner szó szerinti utasításának látszana.
 */
export function composeTranscriptForBatch(params: {
  transcript: string;
  durationSecs?: number;
}): string {
  const length: string = params.durationSecs
    ? ` (${Math.round(params.durationSecs)} mp)`
    : '';

  return `🎙️ HANGÜZENET — gépi átirat${length}, NEM gépelt szöveg:\n${params.transcript}`;
}
