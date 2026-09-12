// 📊 A HANG-TÖLCSÉR MEGJELENÍTÉSE — a tábla, amit az owner lát.
//
// ⭐ MIÉRT KÜLÖN FÁJL *(2026-09-12)*: a `voice-funnel-report.ts` a zaj-sorral és a
// nyitott-mikrofon gyanúval **517 sorra** nőtt, a `max-file-lines` felső határa viszont 500.
// ⛔ A szabályt nem kapcsoljuk ki — a fájlt bontjuk, pontosan ahogy a review tanácsolja.
//
// ⚠️ És a bontás **nem csak a sorszám miatt helyes**: a **számolás** és a **megjelenítés** két
// külön dolog. A számolás a napló szerződéséhez kötött, a tábla viszont az **owner szeméhez** —
// a kettő külön-külön változik.

import { localTimeHeader } from '../utils/local-time.js';
import {
  WEAK_SAMPLE_THRESHOLD,
  type VoiceFunnelReport,
} from './voice-funnel-report.js';

/** Ember-olvasható tábla. */
export function renderVoiceFunnel(report: VoiceFunnelReport, now: Date = new Date()): string {
  if (!report.hasData) {
    return `\n📊 Hang-tölcsér — ${report.windowLabel}\n  ${localTimeHeader(now)}\n\n`
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
    `  ${localTimeHeader(now)}`,
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
    `  ❌  felismerés után elveszett ..... ${report.droppedAfterTranscribe}`
      + (report.droppedTinyFragments
        // ⏱️ Mérve 2026-09-11: aznap MIND a 23 ilyen 0,3-2,3 mp-es töredék volt (légzés,
        // mondat-farok) — ⛔ egyik sem elveszett mondat. A tábla ezt mondja ki.
        ? `  ⏱️ ebből ${report.droppedTinyFragments} a másodperc alatti töredék (nem mondat)`
        : ''),
    `  ⚪  kihagyva (duplikátum/idegen) .. ${report.skipped}`,
    // 🎤 A SZŰRT ZAJ — ⭐ ez NEM veszteség, hanem a szűrő munkája.
    `  🎤  buli-zaj (megszűrve) ......... ${report.noise}`,
    // 🎤 A NYITOTT MIKROFON GYANUJA — ⛔ csak JELZES, a hangos figyelmeztetes nem itt tortenik.
    ...(report.noiseBurst.isBurst
      ? ['', `  🔴 ${report.noiseBurst.reason}`]
      : []),
    `  ⬜  üres felvétel (nem veszteség) . ${report.emptyFiles}`,
    // 🧩 A HOSSZU MEGSZOLALAS — 2026-09-11 óta LATHATO. Korábban ez a veszteség a
    // ✅ sikerek közt bújt meg: a 30 mp-en túli beszéd átirata csonkult, de bekerült.
    `  🧩  darabolva ismerve (>30 mp) .... ${report.segmentedUtterances}`
      + (report.segmentsFailed
        ? `  🔴 ebből ${report.segmentsFailed} részlet ELBUKOTT — HIÁNYOS szöveg`
        : ''),
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
