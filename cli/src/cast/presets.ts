// Volume preset matrix — egy parancs alkalmaz egy nevesített hangerő-konfigurációt
// minden eszközre (vagy egy alhalmazra). Plus capture-current: a jelenlegi állapotot
// preset-ként elmentjük új névvel.
//
// Config: config/volume-presets.json
// Schema: presetName → { deviceName: level | { level, muted } }

import { promises as fs } from 'node:fs';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { CastDevice } from './discover.js';
import {
  getReceiverStatus,
  setReceiverVolume,
  type VolumeTargetRef,
} from './volume.js';
import { isCastGroup } from './groups.js';

export interface PresetEntry {
  level: number;
  muted: boolean;
}

export type PresetSchema = Record<string, Record<string, PresetEntry>>;

export function defaultPresetsPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', '..', 'config', 'volume-presets.json');
}

export function loadPresets(path?: string): PresetSchema {
  const p = path ?? defaultPresetsPath();
  if (!existsSync(p)) return {};
  try {
    const raw = readFileSync(p, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: PresetSchema = {};
    for (const [presetName, body] of Object.entries(parsed)) {
      if (presetName.startsWith('_')) continue;
      if (!body || typeof body !== 'object') continue;
      const entries: Record<string, PresetEntry> = {};
      for (const [deviceName, val] of Object.entries(body as Record<string, unknown>)) {
        const norm = normalizeEntry(val);
        if (norm) entries[deviceName] = norm;
      }
      if (Object.keys(entries).length > 0) {
        out[presetName] = entries;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export async function savePresets(presets: PresetSchema, path?: string): Promise<void> {
  const p = path ?? defaultPresetsPath();
  await fs.mkdir(dirname(p), { recursive: true });
  // Megőrizzük a fájl tetején a meta kommenteket — ehhez újra-olvasunk és merge-elünk
  let existing: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(p, 'utf-8');
    existing = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    /* nincs meglévő fájl, OK */
  }
  // Meta (`_*`) kulcsokat megtartjuk; data kulcsokat felülírjuk a presets-szel
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(existing)) {
    if (k.startsWith('_')) out[k] = v;
  }
  for (const [k, v] of Object.entries(presets)) {
    out[k] = v;
  }
  await fs.writeFile(p, JSON.stringify(out, null, 2) + '\n', 'utf-8');
}

function normalizeEntry(v: unknown): PresetEntry | null {
  if (typeof v === 'number') {
    return { level: clamp01(v), muted: false };
  }
  if (v && typeof v === 'object') {
    const obj = v as { level?: unknown; muted?: unknown };
    if (typeof obj.level !== 'number') return null;
    return { level: clamp01(obj.level), muted: Boolean(obj.muted) };
  }
  return null;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

// === Apply ==================================================================

export interface ApplyPresetResult {
  preset: string;
  applied: Array<{ name: string; level: number; muted: boolean }>;
  notFound: string[];
  failures: Array<{ name: string; error: string }>;
}

export async function applyPreset(args: {
  presetName: string;
  presets: PresetSchema;
  devices: CastDevice[];
  onLog?: (msg: string) => void;
}): Promise<ApplyPresetResult> {
  const { presetName, presets, devices, onLog } = args;

  const entries = presets[presetName];
  if (!entries) {
    const names = Object.keys(presets).join(', ');
    throw new Error(`Preset "${presetName}" not found. Available: ${names || '(none)'}`);
  }

  // Csak individual eszközök kapnak volume — group-okat kizárjuk a config-ból is
  const individuals = devices.filter((d) => !isCastGroup(d));
  const byNameLower = new Map(individuals.map((d) => [d.name.toLowerCase(), d]));

  const result: ApplyPresetResult = { preset: presetName, applied: [], notFound: [], failures: [] };

  await Promise.all(
    Object.entries(entries).map(async ([wantedName, entry]) => {
      const dev = byNameLower.get(wantedName.toLowerCase());
      if (!dev) {
        result.notFound.push(wantedName);
        onLog?.(`preset apply: "${wantedName}" device not discovered — skip`);
        return;
      }
      const ref: VolumeTargetRef = { name: dev.name, address: dev.address, port: dev.port };
      try {
        await setReceiverVolume(ref, { level: entry.level, muted: entry.muted });
        result.applied.push({ name: dev.name, level: entry.level, muted: entry.muted });
        onLog?.(`preset apply: ${dev.name} → level=${entry.level.toFixed(2)} muted=${entry.muted}`);
      } catch (err) {
        const e = err as Error;
        result.failures.push({ name: dev.name, error: e.message });
        onLog?.(`preset apply: ${dev.name} FAILED — ${e.message}`);
      }
    }),
  );

  return result;
}

// === Capture current ========================================================

export interface CaptureResult {
  preset: string;
  captured: Array<{ name: string; level: number; muted: boolean }>;
  failures: Array<{ name: string; error: string }>;
}

export async function captureCurrentAsPreset(args: {
  presetName: string;
  devices: CastDevice[];
  path?: string;
  onLog?: (msg: string) => void;
}): Promise<CaptureResult> {
  const { presetName, devices, path, onLog } = args;
  if (presetName.startsWith('_')) {
    throw new Error('Preset name cannot start with "_" (reserved for meta)');
  }

  const individuals = devices.filter((d) => !isCastGroup(d));
  const presets = loadPresets(path);
  const entries: Record<string, PresetEntry> = {};
  const captured: Array<{ name: string; level: number; muted: boolean }> = [];
  const failures: Array<{ name: string; error: string }> = [];

  await Promise.all(
    individuals.map(async (d) => {
      const ref: VolumeTargetRef = { name: d.name, address: d.address, port: d.port };
      try {
        const status = await getReceiverStatus(ref);
        entries[d.name] = { level: status.volume.level, muted: status.volume.muted };
        captured.push({ name: d.name, level: status.volume.level, muted: status.volume.muted });
        onLog?.(`capture: ${d.name} → level=${status.volume.level.toFixed(2)} muted=${status.volume.muted}`);
      } catch (err) {
        const e = err as Error;
        failures.push({ name: d.name, error: e.message });
        onLog?.(`capture: ${d.name} FAILED — ${e.message}`);
      }
    }),
  );

  presets[presetName] = entries;
  await savePresets(presets, path);

  return { preset: presetName, captured, failures };
}
