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

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Egy nap hang-tölcsére. */
export interface VoiceFunnelReport {
  /** `YYYY-MM-DD` — melyik napot néztük. */
  day: string;
  /** Volt-e egyáltalán napló erre a napra. ⚠️ A „nincs adat" NEM ugyanaz, mint a „nulla". */
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

interface ActionLogLine {
  extra?: {
    code?: string;
    detected?: number;
    delivered?: number;
    reason?: string;
    lostAudioSeconds?: number;
  };
}

/** A napi akció-napló útvonala. */
export function resolveActionLogPath(projectRoot: string, day: string): string {
  return join(projectRoot, '__agent', 'log', 'actions', `${day}.jsonl`);
}

/**
 * A tölcsér kiszámítása a napi naplóból.
 *
 * ⚠️ HIBÁT NEM DOB hiányzó naplóra: a `hasData: false` **leíró válasz**, nem kivétel — egy
 * olyan napra kérdezni, amikor nem futott semmi, teljesen jogos.
 */
export async function buildVoiceFunnelReport(params: {
  projectRoot: string;
  day: string;
  read?: (path: string) => Promise<string>;
}): Promise<VoiceFunnelReport> {
  const read: (path: string) => Promise<string> = params.read
    ?? (async (path: string): Promise<string> => readFile(path, 'utf8'));

  const empty: VoiceFunnelReport = {
    day: params.day,
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

  let raw: string;

  try {
    raw = await read(resolveActionLogPath(params.projectRoot, params.day));
  } catch {
    return empty;
  }

  const report: VoiceFunnelReport = { ...empty, hasData: true };

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

    applyEntry(report, entry);
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
    case 'MA-VOICE-SPEECH-DETECTED':
      // ⭐ A számláló KUMULATÍV: minden sor az addigi összesítést hordozza, tehát a
      // MAXIMUMOT kell venni, nem az összeget. *(Összeadva 1+2+3… jönne ki.)*
      report.speechDetected = Math.max(report.speechDetected, entry.extra?.detected ?? 0);
      report.delivered = Math.max(report.delivered, entry.extra?.delivered ?? 0);

      return;

    case 'MA-VOICE-SPEECH-DROPPED-SILENTLY':
      if (entry.extra?.reason === 'empty-file') report.emptyFiles += 1;
      else report.droppedByRecorder += 1;

      report.lostAudioSeconds += entry.extra?.lostAudioSeconds ?? 0;

      return;

    case 'MA-VOICE-SPEECH-QUEUED':
      report.queued += 1;

      return;

    case 'MA-VOICE-SPEECH-DROPPED':
      report.droppedAfterTranscribe += 1;

      return;

    case 'MA-VOICE-SPEECH-SKIPPED':
      report.skipped += 1;

      return;

    default:
      return;
  }
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
    return `\n📊 Hang-tölcsér — ${report.day}\n\n`
      + '  ⚪ Nincs napló erre a napra — nem futott semmi, vagy más a dátum.\n\n';
  }

  const weak: boolean = report.attempts > 0 && report.attempts < WEAK_SAMPLE_THRESHOLD;
  const rate: string = report.transferRatePct === null
    ? '❓ nem mérhető (nem hangzott el megszólalás)'
    : `${report.transferRatePct}%  (${report.attempts} megszólalásból)`;

  // 🔴 KEVÉS MINTA = NINCS KOVETKEZTETES. Egyetlen sikeres felvetel „100%"-ot ad — es epp ez
  // a tulallitas volt az, amit az owner 22:08-kor kijavitott: „egy mondat ≠ mukodik".
  const icon: string = report.transferRatePct === null || weak
    ? '⚪'
    : report.transferRatePct >= 80 ? '✅' : report.transferRatePct >= 50 ? '🟡' : '🔴';

  return [
    '',
    `📊 Hang-tölcsér — ${report.day}`,
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
