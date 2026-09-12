// ⏱️ A PILLANATKÉP ADATSZERKEZETE — `ma doctor now` (20. tétel, 3).
//
// ⭐ MIÉRT KÜLÖN FÁJL: az összeállítás (`doctor-now.ts`) és a megjelenítés
// (`doctor-now.render.ts`) **ugyanezt** az alakot használja ⇒ a szerkezet a kettő **szerződése**.
// *(És így mindkét modul egyetlen dolgot exportál — `one-export-per-file`.)*
//
// 🔴 A VEZÉRELV: minden mező vagy **mért** érték, vagy **kimondottan** „nem tudom" (`null`).
// ⛔ Nincs olyan mező, aminek a 0 értéke összemosná a „nincs" és a „nem mértük" eseteket.

import type { DiscordFlushDecision } from '../discord/discord.models.js';
import type { HeartbeatStatus } from '../discord/discord.heartbeat.js';

/** Egy mért érték, ami ⛔ lehet „nem tudom" — és akkor azt is kimondja. */
export interface DoctorNowSnapshot {
  /** Mikor készült a pillanatkép. */
  takenAt: Date;
  /** 📨 A köteg: hány üzenet vár és mióta. */
  batch: {
    pendingCount: number;
    oldestAgeMs: number | null;
    newestAgeMs: number | null;
    /** ⭐ A kiküldési döntés — ez mondja meg, MIÉRT nem megy ki. `null` = nem volt mérhető. */
    decision: DiscordFlushDecision | null;
    /** Miért nem volt mérhető a döntés *(pl. a CCAP nem válaszolt)*. */
    decisionProblem?: string;
  };
  /** 🎙️ A figyelő életjele + a PILLANAT, amit csak ő tud. */
  listener: HeartbeatStatus;
  /** ⏳ Az újrapróbálási sor: hány hang vár és mikor esedékes a következő. */
  retry: { pendingCount: number; nextDueMs: number | null };
  /** 🖥️ A gép terhelése — az owner 03:12-kor külön kérte *(„hogyan pörög a gép")*. */
  machine: { cpuPercent: number | null; ramUsedGb: number; ramTotalGb: number };
  /** 🔴 Az utolsó hiba a napi akció-naplóból — `null`, ha ma nem volt. */
  lastError: { summary: string; ageMs: number } | null;
  /** ⚠️ Ami a pillanatképből NEM derült ki — ⛔ a hiány sosem néma. */
  gaps: string[];
}
