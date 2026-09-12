// ⏱️ A PILLANATKÉP MEGJELENÍTÉSE — a `ma doctor now` ember-olvasható alakja.
//
// ⭐ MIÉRT KÜLÖN MODUL: a gyűjtés és a megjelenítés külön változik, és a `max-file-lines` is
// ezt kéri. *(Ugyanaz a bontás, mint a `voice-funnel-report` ↔ `voice-funnel-render` párnál.)*
//
// 🔴 A SZABÁLY, AMI A SZÖVEGET MEGHATÁROZZA: **egy képernyő**, és minden sor **mért** adat.
// ⛔ Nincs „valószínűleg", ⛔ nincs becslés. Ahol nincs adat, ott az áll, hogy **nincs**.

import { DISPLAY_TIME_ZONE, formatDuration, localStamp } from '../utils/local-time.js';
import type { DoctorNowSnapshot } from './doctor-now.models.js';

/** A pillanatkép szöveges alakja. */
export class DoctorNowRender_Util {

  /** Az egész pillanatkép — soronként egy mért tény. */
  static render(snapshot: DoctorNowSnapshot): string {
    return [
      `⏱️  MI TÖRTÉNIK MOST — ${localStamp(snapshot.takenAt)} (${DISPLAY_TIME_ZONE})`,
      '',
      ...DoctorNowRender_Util.batchLines(snapshot),
      '',
      ...DoctorNowRender_Util.listenerLines(snapshot),
      '',
      ...DoctorNowRender_Util.machineLines(snapshot),
      ...DoctorNowRender_Util.gapLines(snapshot),
    ].join('\n');
  }

  /** 📨 A köteg — ez válaszol arra, hogy „miért nem mennek át az üzeneteim". */
  private static batchLines(snapshot: DoctorNowSnapshot): string[] {
    const batch = snapshot.batch;
    const lines: string[] = [`📨 KÖTEG: ${batch.pendingCount} üzenet vár`];

    if (batch.pendingCount > 0) {
      lines.push(`    a legrégebbi: ${DoctorNowRender_Util.age(batch.oldestAgeMs)} · `
        + `a legújabb: ${DoctorNowRender_Util.age(batch.newestAgeMs)}`);
    }

    if (batch.decision) {
      lines.push(`    ${batch.decision.shouldFlush ? '➡️  KIMEGY' : '⏸️  VÁR'} — ${batch.decision.reason}`);
    } else {
      lines.push(`    ❓ a döntés NEM mérhető: ${batch.decisionProblem ?? 'ismeretlen ok'}`);
    }

    if (snapshot.retry.pendingCount > 0) {
      const due: string = snapshot.retry.nextDueMs === null
        ? 'nincs esedékes'
        : `a következő ${DoctorNowRender_Util.age(snapshot.retry.nextDueMs)} múlva`;

      lines.push(`⏳ ÚJRAPRÓBÁLÁS: ${snapshot.retry.pendingCount} hang vár — ${due}`);
    }

    return lines;
  }

  /** 🎙️ A figyelő: él-e, és mit csinál ÉPP. */
  private static listenerLines(snapshot: DoctorNowSnapshot): string[] {
    const status = snapshot.listener;
    const icon: string = status.state === 'alive' ? '✅' : (status.state === 'stale' ? '🟡' : '🔴');
    const age: string = status.ageMs === undefined ? 'nincs életjel' : `${DoctorNowRender_Util.age(status.ageMs)} régi`;
    const lines: string[] = [`${icon} FIGYELŐ: ${status.state} (${age})`];
    const moment = status.heartbeat?.moment;

    if (status.heartbeat?.voice) {
      const voice = status.heartbeat.voice;

      lines.push(`    🔊 hang-csatorna: ${voice.joined ? `bent (${voice.channelName ?? '?'})` : 'NINCS BENT'}`
        + ` · ${voice.speechStarts} megszólalás-jel · ${voice.filesDelivered} felvétel feldolgozva`);
    }

    if (!moment) {
      // ⚠️ Kimondjuk: a hallgatás itt ⛔ nem nyugalom.
      lines.push('    ❓ a PILLANAT nem mérhető — a figyelő életjelében nincs `moment` blokk');

      return lines;
    }

    lines.push(`    🎙️ felismerés ÉPP: ${moment.isRecognizing ? 'FUT' : 'nem fut'}`
      + ` · feldolgozás alatt ${moment.processingRecordings} felvétel`
      + ` · nyitott megszólalás-jel ${moment.openDetections}`);
    lines.push(`    ⏳ köteg-kapu: ${moment.isGateClosed ? '🔴 ZÁRVA' : '✅ nyitva'}`
      + `${moment.isNoiseFlooded ? ' · 🎤 ZAJ-ÖZÖN (a puszta észlelés nem tart)' : ''}`
      + ` · zaj az ablakban: ${moment.noiseInWindow}`);

    if (moment.gateReason) lines.push(`    ↳ ${moment.gateReason}`);

    return lines;
  }

  /** 🖥️ A gép + az utolsó hiba. */
  private static machineLines(snapshot: DoctorNowSnapshot): string[] {
    const machine = snapshot.machine;
    const cpu: string = machine.cpuPercent === null ? '?' : `${Math.round(machine.cpuPercent)}%`;
    const ramPercent: number = machine.ramTotalGb > 0
      ? Math.round((machine.ramUsedGb / machine.ramTotalGb) * 100)
      : 0;
    const lines: string[] = [
      `🖥️  GÉP: CPU ${cpu} · RAM ${machine.ramUsedGb.toFixed(1)}/${machine.ramTotalGb.toFixed(1)} GB (${ramPercent}%)`,
    ];

    // 🧪 A KIHAGYOTT TESZT-HIBÁK SZÁMA KIMONDVA (21. tétel) — ⛔ a némítás nem elfogadható:
    // ugyanaz az elv, mint a tölcsérnél a töredékeknél. Így a szűrés maga is ellenőrizhető.
    const skipped: string = snapshot.skippedTestErrors > 0
      ? ` (⚠️ ${snapshot.skippedTestErrors} teszt-eredetű hiba kihagyva)`
      : '';

    lines.push(snapshot.lastError
      ? `🔴 UTOLSÓ HIBA (${DoctorNowRender_Util.age(snapshot.lastError.ageMs)}): `
        + `${snapshot.lastError.summary}${skipped}`
      : `✅ UTOLSÓ HIBA: ma nem volt VALÓDI hiba${skipped}`);

    return lines;
  }

  /** ⚠️ Amit nem sikerült megmérni — ⛔ a hiány sosem néma. */
  private static gapLines(snapshot: DoctorNowSnapshot): string[] {
    if (!snapshot.gaps.length) return [];

    return ['', '⚠️ AMIT NEM SIKERÜLT MEGMÉRNI:', ...snapshot.gaps.map((gap: string): string => `    · ${gap}`)];
  }

  /** Egy időtartam — vagy a kimondott „nem tudom". */
  private static age(ms: number | null | undefined): string {
    return ms === null || ms === undefined ? 'nem tudom' : formatDuration(ms);
  }
}
