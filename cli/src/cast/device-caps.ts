// Per-device hangerő-cap: bizonyos hangszórókat sose emelünk egy kemény
// felső határ fölé (pl. BathCom fürdő → max 0.50 az áthallás miatt).
//
// Forrás: current/principles/cast-notifier-defaults.md "2026-05-12 — per-device
// hangerő-cap". A notify SAVE→UP→PLAY→RESTORE flow UP fázisában a
// `--announcement-volume`-ot per-device clamp-eljük: min(announcement, cap).
//
// Config: config/device-volume-caps.json — { deviceName: maxLevel } (0..1).
// Pattern: groups.ts loadGroupConfig (fs-read no-throw + path resolution).

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { logAction } from '../action-log/action-log.client.js';

/** Device-név → max hangerő (0..1). Hiányzó device = nincs cap. */
export type DeviceVolumeCaps = Record<string, number>;

export function defaultDeviceCapsPath(): string {
  const here: string = dirname(fileURLToPath(import.meta.url));

  return resolve(here, '..', '..', 'config', 'device-volume-caps.json');
}

/**
 * Beolvassa a per-device cap-konfigot. Hiányzó fájl / malformed JSON →
 * üres map (no-throw, strukturált action-log a malformed esetre).
 * Csak a `[0,1]`-be eső numerikus értékeket fogadja el; `_`-prefix kulcs skip.
 */
export function loadDeviceVolumeCaps(path?: string): DeviceVolumeCaps {
  const p: string = path ?? defaultDeviceCapsPath();

  if (!existsSync(p)) return {};

  try {
    const raw: string = readFileSync(p, 'utf-8');
    const parsed: Record<string, unknown> = JSON.parse(raw) as Record<string, unknown>;
    const out: DeviceVolumeCaps = {};

    for (const [name, val] of Object.entries(parsed)) {
      if (name.startsWith('_')) continue;
      if (typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 1) {
        out[name] = val;
      }
    }

    return out;
  } catch (err) {
    const msg: string = err instanceof Error ? err.message : String(err);

    void logAction({
      kind: 'error',
      summary: `[cast/device-caps] MA-CAST-DEVICE-CAPS-PARSE-FAIL: ${msg}`,
      ref: p,
      extra: { code: 'MA-CAST-DEVICE-CAPS-PARSE-FAIL', file: p, error: msg },
    });

    return {};
  }
}

/**
 * Egy adott device-re alkalmazza a cap-et: `min(level, cap)`, ha van
 * konfigurált cap. Cap-keresés case-insensitive (a discovery friendly-name
 * casing-je nem garantált). Cap hiányában a `level` változatlan.
 */
export function capLevelForDevice(deviceName: string, level: number, caps: DeviceVolumeCaps): number {
  const target: string = deviceName.trim().toLowerCase();

  for (const [name, cap] of Object.entries(caps)) {
    if (name.toLowerCase() === target) {
      return Math.min(level, cap);
    }
  }

  return level;
}
