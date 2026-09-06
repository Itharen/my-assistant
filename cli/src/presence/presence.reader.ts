// Jelenlét-olvasó — „a gépénél van-e az owner?"
//
// Owner-szabály (2026-09-06): „Az arról, hogy itthon vagyok-e, egyelőre elég lesz az, hogy
// használom a gépemet, mert más jelünk nem lehet arra."
//
// A forrás az `activity-monitor` percenkénti mérése: Windows `GetLastInputInfo` → az utolsó
// BÁRMILYEN bevitel (egér ÉS billentyű) óta eltelt idő + az aktív ablak.
//
// 🔴 Ha nincs friss mérés, az eredmény `unknown` — SOHA nem „nincs itthon" és SOHA nem
// „itthon van". A nem tudás külön állapot, mert a kapu erre tilt (owner: „ismeretlen ⇒ tilt").

import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Ennyi percen belüli aktív mérés jelenti azt, hogy a gépénél van. */
export const PRESENCE_ACTIVE_WINDOW_MINUTES: number = 10;

export interface PresenceSample {
  timestamp: Date;
  /** `active` = a mérés pillanatában frissen volt bevitel; `idle` = régóta nem. */
  idleState: 'active' | 'idle';
  idleSeconds: number;
  processName: string;
}

export interface PresenceSnapshot {
  /** `yes` = a gépét használja · `no` = van friss mérés, de tétlen · `unknown` = nincs mérés. */
  isHome: 'yes' | 'no' | 'unknown';
  /** Ember-olvasható indoklás — a kapu ezt viszi tovább a naplóba. */
  reason: string;
  /** A legutóbbi mérés, ha van. */
  latest?: PresenceSample;
  /** Hány perces a legutóbbi mérés. */
  ageMinutes?: number;
}

/**
 * Beolvassa a legfrissebb jelenlét-mérést és eldönti, itthon van-e az owner.
 *
 * @param dataDirectory az `activity-monitor` napi JSONL fájljainak könyvtára
 */
export async function readPresence(
  dataDirectory: string,
  now: Date = new Date(),
): Promise<PresenceSnapshot> {
  if (!existsSync(dataDirectory)) {
    return {
      isHome: 'unknown',
      reason: `Nincs jelenlét-adat (hiányzó könyvtár: ${dataDirectory}). A figyelő valószínűleg sosem futott.`,
    };
  }

  const latest: PresenceSample | null = await readLatestSample(dataDirectory);

  if (!latest) {
    return {
      isHome: 'unknown',
      reason: 'Van adatkönyvtár, de nincs benne értelmezhető mérés. A figyelő nem fut.',
    };
  }

  const ageMinutes: number = Math.round((now.getTime() - latest.timestamp.getTime()) / 60_000);

  if (ageMinutes > PRESENCE_ACTIVE_WINDOW_MINUTES) {
    return {
      isHome: 'unknown',
      reason: `A legutóbbi mérés ${ageMinutes} perces — a figyelő nem fut, ezért NEM TUDJUK, itthon van-e.`,
      latest,
      ageMinutes,
    };
  }

  if (latest.idleState === 'active') {
    return {
      isHome: 'yes',
      reason: `Friss mérés (${ageMinutes} perce), aktív bevitel — a gépét használja.`,
      latest,
      ageMinutes,
    };
  }

  return {
    isHome: 'no',
    reason: `Friss mérés (${ageMinutes} perce), de tétlen (${latest.idleSeconds} mp bevitel nélkül) `
      + '— a gép mellett nincs aktivitás.',
    latest,
    ageMinutes,
  };
}

/** Ennyi napi fájlon megyünk vissza, ha a legfrissebb még üres. */
const LOOKBACK_FILES: number = 3;

async function readLatestSample(dataDirectory: string): Promise<PresenceSample | null> {
  const files: string[] = (await readdir(dataDirectory))
    .filter((name) => name.endsWith('.jsonl'))
    .sort();

  if (files.length === 0) return null;

  // ⚠️ MÉRT HIBA VOLT (review-kör 1): csak a legfrissebb fájlt néztük. Éjfélkor a figyelő
  // ÚJ napi fájlt nyit, ami egy pillanatig ÜRES — ilyenkor „nincs mérés"-t jelentettünk
  // volna, és a hangszórós kapu feleslegesen tiltott volna. Ezért megyünk vissza néhány
  // fájlt, amíg találunk ép mintát.
  const newestFirst: string[] = files.slice(-LOOKBACK_FILES).reverse();

  for (const fileName of newestFirst) {
    const raw: string = await readFile(join(dataDirectory, fileName), 'utf-8');
    const lines: string[] = raw.split('\n').filter((line) => line.trim().length > 0);

    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const sample: PresenceSample | null = parseSample(lines[index]!);

      if (sample) return sample;
    }
  }

  return null;
}

function parseSample(line: string): PresenceSample | null {
  try {
    // A PowerShell-író BOM-ot tehet az első sor elé — azt le kell vágni.
    const parsed = JSON.parse(line.replace(/^﻿/, '')) as Record<string, unknown>;
    const timestampRaw: unknown = parsed['timestamp'];

    if (typeof timestampRaw !== 'string') return null;
    const timestamp: Date = new Date(timestampRaw);

    if (Number.isNaN(timestamp.getTime())) return null;

    const idleSeconds: number = typeof parsed['idleSeconds'] === 'number' ? parsed['idleSeconds'] : -1;
    const idleStateRaw: unknown = parsed['idleState'];

    return {
      timestamp,
      idleState: idleStateRaw === 'idle' ? 'idle' : 'active',
      idleSeconds,
      processName: typeof parsed['processName'] === 'string' ? parsed['processName'] : '',
    };
  } catch {
    return null;
  }
}
