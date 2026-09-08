// 📊 AZ ÁTVITELI ARÁNY — a szám, amit az owner ténylegesen kérdezett.
//
// > **Owner (2026-09-07 22:08):** *„beszéltem, beszéltem, tulajdonképpen annak **egy százaléka**
// > lett aztán transzkriptálva… De leginkább semmi nem ment át."*
//
// ⭐ **A MÉRÉS ÖNMAGÁBAN NEM ELÉG — KI IS KELL TUDNI OLVASNI.** A szonda és a kiesés-jelentő
// napló-sorokat ír; de ha a válaszhoz kézzel kell `grep`-elni és fejben összeadni, akkor a
// mérés **gyakorlatilag nincs meg**. Ez a modul a napi akció-naplóból **egyetlen táblát**
// állít elő, a tetején azzal a számmal, ami eldönti, javult-e a helyzet:
//
//   🔴 **átviteli arány = ami bekerült a kötegbe / az összes owner-megszólalás**
//
// ⛔ MIÉRT A NAPLÓBÓL, ÉS NEM AZ ÉLŐ SZONDÁBÓL: a szonda a **szerver-folyamatban** él, a CLI
// pedig külön folyamat — nem látná. A napló viszont a **tartós rekord** (`core-document-everything`),
// és egy szerver-újraindítást is túlél. ⚠️ Ebből következik a korlát is: amit a napló nem
// rögzített, azt ez sem tudja — nem talál ki semmit.
//
// ═══════════════════════════════════════════════════════════════════════════════════════════
// 🔴 MIÉRT NEM NAPTÁRI NAP AZ ALAPÉRTELMEZÉS — MÉRT HIBA (2026-09-08 00:51)
// ═══════════════════════════════════════════════════════════════════════════════════════════
//
// Az owner ébrenléte **csúszik** *(fix 18 óra, `current/principles/sleep-system.md`)* — a napja
// tehát **nem** a naptári nap. Mérve: a 09-07-es beszéd adata a 09-07-es fájlban van, a 09-08-as
// jelentés viszont **üres** volt. ⇒ Egy **éjfélen átnyúló** beszélgetés **kettévágódna**, és
// **egyik nap sem** mutatná az igazi arányt — az owner reggel „nem működik"-et látna.
//
// ⚠️ És ez a rosszabbik fajta hiba: **nem hibázik, csak nem mond igazat.** *(„Üres állapot
// magyarázó hiba nélkül tilos" — `core-rich-error-handling`.)*
//
// ⭐ Ezért az alapértelmezés **gördülő ablak** (12 óra), ami átível az éjfélen; a naptári nap
// továbbra is kérhető (`--day`).

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { VOICE_LOG_CODES } from './voice-log-codes.js';

/** Egy időszak hang-tölcsére. */
export interface VoiceFunnelReport {
  /** `YYYY-MM-DD` — naptári nap módban a nézett nap; gördülő ablakban a vég-nap. */
  day: string;
  /**
   * Ember-olvasható leírás arról, **mit mértünk**.
   *
   * ⭐ A jelentés **mindig megmondja a saját ablakát** — különben egy üres tábláról nem dönthető
   * el, hogy „nem beszélt" vagy „rossz időszakot néztem".
   */
  windowLabel: string;
  /** Volt-e egyáltalán napló erre az időszakra. ⚠️ A „nincs adat" NEM ugyanaz, mint a „nulla". */
  hasData: boolean;
  /** Hány owner-megszólalást érzékelt a Discord (`speaking.start`). */
  speechDetected: number;
  /** Hány felvétel jutott el a feldolgozó hookig. */
  delivered: number;
  /** ✅ Hány került be a kötegbe — **ez jutott el hozzám**. */
  queued: number;
  /** 🎚️ A felvevő beszéd-validációja dobta ki (némán). */
  droppedByRecorder: number;
  /** A fejlécen túl üres felvételek — ott tényleg nem volt beszéd. */
  emptyFiles: number;
  /** ❌/❓ Eljutott a felismerésig, de nem lett belőle használható szöveg. */
  droppedAfterTranscribe: number;
  /** ⚪ Duplikátum vagy idegen beszélő — se siker, se veszteség. */
  skipped: number;
  /** Az eldobott felvételekben lévő hang összesen. */
  lostAudioSeconds: number;
  /**
   * 🔴 AZ ÁTVITELI ARÁNY százalékban, vagy `null`, ha nem volt mit mérni.
   *
   * ⚠️ **`null` ≠ 0%.** Ha nem hangzott el megszólalás, az arány **értelmezhetetlen** — és
   * a 0% odaírása azt hazudná, hogy minden elveszett. *(A mérés, ami hazudik, rosszabb, mint
   * a mérés hiánya.)*
   */
  transferRatePct: number | null;
  /**
   * 🔴 Hány valódi megszólalás-kísérletből jött az arány.
   *
   * ⚠️ **EZ NÉLKÜL AZ ARÁNY FÉLREVEZET.** Egyetlen sikeres felvétel „100%"-ot ad — és pontosan
   * ezt a túlállítást kifogásolta az owner 22:08-kor: *„egy mondat ≠ működik"*. Az arány csak
   * **elég mintával** jelent bármit, ezért a darabszám mindig vele együtt jár.
   */
  attempts: number;
}

/**
 * Ennyi kísérlet alatt az arány **nem értelmezhető** megbízhatóan.
 *
 * ⚠️ Ez **asszisztensi becslés**, nem mért érték — de a `null`-nál jobb, mert legalább
 * **jelzi**, hogy a szám gyenge. Az owner átállíthatja, ha van jobb küszöbe.
 */
export const WEAK_SAMPLE_THRESHOLD: number = 5;

/**
 * Az alapértelmezett gördülő ablak.
 *
 * ⭐ 12 óra: bőven átfog egy estét és az azt követő reggelt, tehát az éjfél **nem vágja ketté** a
 * beszélgetést — de nem is olyan hosszú, hogy tegnapelőtti adatot keverne a mába.
 * ⚠️ Asszisztensi választás, nem owner-adat; a `--hours` felülírja.
 */
export const DEFAULT_WINDOW_HOURS: number = 12;

/**
 * A leghosszabb értelmes ablak — **90 nap**.
 *
 * ⚠️ MIÉRT KELL FELSŐ HATÁR: az ablak **napi fájlokra** bomlik, tehát egy elgépelt
 * `--hours 100000` **több ezer** fájl-olvasást indítana, és a parancs látszólag „beragadna".
 * ⭐ A látható, azonnali hiba mindig jobb, mint a néma lassulás — a felhasználó nem tudná
 * eldönteni, hogy dolgozik-e vagy elakadt.
 */
export const MAX_WINDOW_HOURS: number = 90 * 24;

interface ActionLogLine {
  ts?: string;
  extra?: {
    code?: string;
    detected?: number;
    delivered?: number;
    reason?: string;
    lostAudioSeconds?: number;
    deliveredSoFar?: number;
  };
}

/** A napi akció-napló útvonala. */
export function resolveActionLogPath(projectRoot: string, day: string): string {
  return join(projectRoot, '__agent', 'log', 'actions', `${day}.jsonl`);
}

/**
 * A tölcsér kiszámítása — **gördülő ablakból** (alap) vagy egy megadott **naptári napból**.
 *
 * ⚠️ HIBÁT NEM DOB hiányzó naplóra: a `hasData: false` **leíró válasz**, nem kivétel — egy
 * olyan időszakra kérdezni, amikor nem futott semmi, teljesen jogos.
 */
export async function buildVoiceFunnelReport(params: {
  projectRoot: string;
  /** Naptári nap mód. Ha nincs megadva, **gördülő ablak** jár (l. `hours`). */
  day?: string;
  /** Gördülő ablak órában. Alapérték 12 — csak `day` nélkül érvényes. */
  hours?: number;
  /** Tesztelhetőség: a „most". */
  now?: () => Date;
  read?: (path: string) => Promise<string>;
}): Promise<VoiceFunnelReport> {
  const read: (path: string) => Promise<string> = params.read
    ?? (async (path: string): Promise<string> => readFile(path, 'utf8'));
  const now: Date = (params.now ?? ((): Date => new Date()))();
  const rolling: boolean = !params.day;
  const hours: number = params.hours ?? DEFAULT_WINDOW_HOURS;
  const cutoffMs: number = rolling ? now.getTime() - hours * 3_600_000 : Number.NEGATIVE_INFINITY;
  const days: string[] = rolling ? daysSpanned(cutoffMs, now) : [params.day as string];

  const report: VoiceFunnelReport = {
    day: days[days.length - 1] ?? budapestDay(now),
    windowLabel: rolling ? `az elmúlt ${hours} óra` : `${params.day as string} (naptári nap)`,
    hasData: false,
    speechDetected: 0,
    delivered: 0,
    queued: 0,
    droppedByRecorder: 0,
    emptyFiles: 0,
    droppedAfterTranscribe: 0,
    skipped: 0,
    lostAudioSeconds: 0,
    transferRatePct: null,
    attempts: 0,
  };

  for (const day of days) {
    let raw: string;

    try {
      raw = await read(resolveActionLogPath(params.projectRoot, day));
    } catch {
      // ⚠️ Hiányzó napi fájl NEM hiba: az ablak átívelhet olyan napra, amelyen nem futott semmi.
      continue;
    }

    report.hasData = true;

    for (const line of raw.split('\n')) {
      const trimmed: string = line.trim();

      if (!trimmed) continue;

      let entry: ActionLogLine;

      try {
        entry = JSON.parse(trimmed) as ActionLogLine;
      } catch {
        // ⚠️ Egy sérült sor NEM buktathatja meg a jelentést — a napló append-only, és egy
        // félbeszakadt írás utolsó sora csonka lehet. A többi sor adata attól még érvényes.
        continue;
      }

      // ⏰ Gördülő ablakban az ablakon kívüli sorok kimaradnak. ⚠️ Az értelmezhetetlen időbélyeg
      // **BENT marad**: egy hiányzó `ts` miatt nem dobunk el mérési adatot.
      if (isBeforeCutoff(entry.ts, cutoffMs)) continue;

      applyEntry(report, entry);
    }
  }

  report.lostAudioSeconds = round1(report.lostAudioSeconds);
  report.attempts = countAttempts(report);
  report.transferRatePct = computeTransferRate(report);

  return report;
}

function applyEntry(report: VoiceFunnelReport, entry: ActionLogLine): void {
  const code: string | undefined = entry.extra?.code;

  if (!code) return;

  switch (code) {
    case VOICE_LOG_CODES.speechDetected:
      // ⭐ A számláló KUMULATÍV: minden sor az addigi összesítést hordozza, tehát a
      // MAXIMUMOT kell venni, nem az összeget. *(Összeadva 1+2+3… jönne ki.)*
      report.speechDetected = Math.max(report.speechDetected, entry.extra?.detected ?? 0);
      report.delivered = Math.max(report.delivered, entry.extra?.delivered ?? 0);

      return;

    case VOICE_LOG_CODES.droppedSilently:
      if (entry.extra?.reason === 'empty-file') report.emptyFiles += 1;
      else report.droppedByRecorder += 1;

      report.lostAudioSeconds += entry.extra?.lostAudioSeconds ?? 0;

      return;

    case VOICE_LOG_CODES.queued:
      report.queued += 1;
      applyDelivered(report, entry);

      return;

    case VOICE_LOG_CODES.dropped:
      report.droppedAfterTranscribe += 1;
      applyDelivered(report, entry);

      return;

    case VOICE_LOG_CODES.skipped:
      report.skipped += 1;
      applyDelivered(report, entry);

      return;

    default:
      return;
  }
}

/**
 * A kézbesített darabszám átvezetése a kimenetel-sorokból.
 *
 * 🔴 MIÉRT KELL: a `MA-VOICE-SPEECH-DETECTED` sor **csak új megszólaláskor** íródik, a
 * feldolgozás viszont **percekkel később** fejeződik be *(mérve: az STT 5 percig is futhat)*.
 * ⇒ Az utolsó megszólalás UTÁN befejeződő kézbesítések a régi úton **sosem** kerültek naplóba,
 * és a tölcsér `delivered` száma **strukturálisan alulmért** volt.
 *
 * ⚠️ Mérve 2026-09-08 01:35: `delivered: 2`, miközben **3** kimenetel-sor keletkezett.
 */
function applyDelivered(report: VoiceFunnelReport, entry: ActionLogLine): void {
  report.delivered = Math.max(report.delivered, entry.extra?.deliveredSoFar ?? 0);
}

/**
 * Az átviteli arány.
 *
 * ⭐ A NEVEZŐ SZÁNDÉKOSAN a **valódi megszólalás-kísérletek** száma: ami bekerült + amit a
 * felvevő eldobott + ami a felismerésnél veszett el.
 *
 * ⛔ **Az üres fájl NINCS benne** — ott nem volt beszéd, tehát nem is veszteség; beszámítva
 * mesterségesen rontaná az arányt. ⛔ A `skipped` sincs benne: a duplikátum és az idegen
 * beszélő **nem az owner elveszett mondata**.
 */
function countAttempts(report: VoiceFunnelReport): number {
  return report.queued + report.droppedByRecorder + report.droppedAfterTranscribe;
}

function computeTransferRate(report: VoiceFunnelReport): number | null {
  if (!report.attempts) return null;

  return Math.round((report.queued / report.attempts) * 1000) / 10;
}

/** Ember-olvasható tábla. */
export function renderVoiceFunnel(report: VoiceFunnelReport): string {
  if (!report.hasData) {
    return `\n📊 Hang-tölcsér — ${report.windowLabel}\n\n`
      + '  ⚪ Nincs napló erre az időszakra — nem futott semmi, vagy más időszakot kell nézni.\n\n';
  }

  const weak: boolean = report.attempts > 0 && report.attempts < WEAK_SAMPLE_THRESHOLD;
  const rate: string = report.transferRatePct === null
    ? '❓ nem mérhető (nem hangzott el megszólalás)'
    : `${report.transferRatePct}%  (${report.attempts} megszólalásból)`;

  // 🔴 KEVES MINTA = NINCS KOVETKEZTETES. Egyetlen sikeres felvetel „100%"-ot ad — es epp ez
  // a tulallitas volt az, amit az owner 22:08-kor kijavitott: „egy mondat ≠ mukodik".
  const icon: string = report.transferRatePct === null || weak
    ? '⚪'
    : report.transferRatePct >= 80 ? '✅' : report.transferRatePct >= 50 ? '🟡' : '🔴';

  return [
    '',
    `📊 Hang-tölcsér — ${report.windowLabel}`,
    '',
    `  ${icon} ÁTVITELI ARÁNY: ${rate}`,
    ...(weak
      ? [`  ⚠️  KEVÉS MINTA (< ${WEAK_SAMPLE_THRESHOLD}) — ebből MÉG NEM lehet következtetni.`]
      : []),
    '',
    `  🎙️  megszólalás érzékelve ......... ${report.speechDetected}`,
    `  📼  felvétel a feldolgozásig ...... ${report.delivered}`,
    `  ✅  kötegbe került ................ ${report.queued}`,
    `  🎚️  a felvevő eldobta ............. ${report.droppedByRecorder}`,
    `  ❌  felismerés után elveszett ..... ${report.droppedAfterTranscribe}`,
    `  ⚪  kihagyva (duplikátum/idegen) .. ${report.skipped}`,
    `  ⬜  üres felvétel (nem veszteség) . ${report.emptyFiles}`,
    '',
    `  🔊 ELVESZETT HANG: ${report.lostAudioSeconds} másodperc`,
    '',
    '  ⚠️ A „megszólalás érzékelve" és a „felvétel" különbsége NEM veszteség —',
    '     a megszólalás beleolvadhatott egy már futó felvételbe.',
    '',
  ].join('\n');
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Egy dátum `YYYY-MM-DD` alakban, **Europe/Budapest** szerint. */
export function budapestDay(when: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(when);
}

/**
 * Mely napi fájlokat kell beolvasni egy `[cutoff, now]` ablakhoz.
 *
 * ⚠️ Naptári napokban gondolkodunk, mert a napló így van szervezve — az ablak két (hosszabb
 * ablaknál több) fájlt is érinthet. ⭐ A hiányzó fájl nem hiba, csak kimarad.
 */
function daysSpanned(cutoffMs: number, now: Date): string[] {
  const days: string[] = [];
  const dayMs: number = 24 * 3_600_000;

  for (let t: number = cutoffMs; t <= now.getTime(); t += dayMs) {
    const day: string = budapestDay(new Date(t));

    if (!days.includes(day)) days.push(day);
  }

  const today: string = budapestDay(now);

  if (!days.includes(today)) days.push(today);

  return days;
}

/**
 * Az ablak előtti-e a bejegyzés.
 *
 * ⚠️ **A hiányzó vagy értelmezhetetlen időbélyeg NEM zár ki.** Egy mérési adatot nem dobunk el
 * azért, mert a metaadata hiányos — inkább legyen bent egy régi sor, mint hiányozzon egy friss.
 */
function isBeforeCutoff(ts: string | undefined, cutoffMs: number): boolean {
  if (cutoffMs === Number.NEGATIVE_INFINITY) return false;
  if (!ts) return false;

  const parsed: number = Date.parse(ts);

  if (Number.isNaN(parsed)) return false;

  return parsed < cutoffMs;
}
