// 3x3-log JSONL reader. Maps `__agent/state/3x3-log.jsonl` (the canonical
// append-only source-of-truth for 3x3 wave snapshots) to a numeric series
// the dashboard panel can render without DB access.
//
// FR #3b-WAVE-UI Phase 2.A (cycle 52): the JSONL-fallback path bypasses
// AUTH BLOCKER on `/api/dashboard/snapshot` so the wave UI can render even
// before the chat-decision on AGB-03 task B lands.
//
// No-throw kontraktus a read util-en — fájl-olvasási hiba esetén
// emitServerActionLog + üres `rows: []` vissza, recurse-mentes.

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { emitServerActionLog } from './action-log.util';

/** Wave kategória taxonómia — egyezik a Wave_Kind enummal. */
export type WaveJsonl_Kind = 'astral' | 'mental' | 'matter';

/** Hullám-vektor irány — opcionális, csak ha a JSONL row tartalmazza. */
export type WaveJsonl_Vector = 'up' | 'down' | 'flat';

/** Output row shape — A_WaveRow-kompatibilis kind/value + JSONL-only mezők (level, vector, mood). */
export interface WaveJsonl_Row {
  ts: string;
  kind: WaveJsonl_Kind;
  value: number;
  level: string;
  vector: WaveJsonl_Vector | null;
  mood: string | null;
  note: string | null;
}

/** Raw JSONL sor shape — minden mező opcionális, mert a forrás nem strict-szigorú. */
interface RawJsonlRow_Interface {
  ts?: string;
  actor?: string;
  astral?: string;
  mental?: string;
  material?: string;
  wave_vector?: WaveJsonl_Vector;
  mood?: string;
  note?: string;
}

// String level → 0..100 numeric mapping. Forrás: `current/principles/three-by-three-system.md`
// + 3x3-log.jsonl tényleges értékkészlete. Ismeretlen szint → 50 (mid default).
const LEVEL_MAP: Record<string, number> = {
  'very-low': 10,
  'low': 20,
  'low-mid': 35,
  'mid': 50,
  'mid+': 60,
  'normal': 70,
  'high': 85,
  'very-high': 95,
};

const KIND_FIELD_MAP: Record<WaveJsonl_Kind, keyof RawJsonlRow_Interface> = {
  astral: 'astral',
  mental: 'mental',
  matter: 'material',
};

/** Resolves the absolute path to `__agent/state/3x3-log.jsonl`, ESM-compat. */
function resolveJsonlPath(): string {
  // Server build layout: server/build/_collections/wave-jsonl.util.js → up 3 = repo root
  // Server source layout: server/src/_collections/wave-jsonl.util.ts → up 3 = repo root
  const here: string = path.dirname(fileURLToPath(import.meta.url));

  return path.resolve(here, '..', '..', '..', '__agent', 'state', '3x3-log.jsonl');
}

/** String level → numeric (0..100). Ismeretlen szint → 50 (mid). */
function levelToValue(level: string | undefined): number {
  if (!level) {
    return 50;
  }

  return LEVEL_MAP[level] ?? 50;
}

/**
 * Olvas `__agent/state/3x3-log.jsonl`-ből és explode-ol minden sort 3 wave row-ra
 * (astral/mental/matter). A `limit` az utolsó N JSONL sorra szűkít (max 100).
 *
 * Hibás JSON sorok skip-elve (`MA-WAVE-JSONL-PARSE-FAIL` action-log emit-tel).
 * Fájl-nem-található / olvasási hiba → üres `rows: []` + action-log
 * (`MA-WAVE-JSONL-READ-FAIL`), no-throw.
 */
export async function readWavesFromJsonl(limit: number): Promise<WaveJsonl_Row[]> {
  const safeLimit: number = Math.min(Math.max(limit, 1), 100);
  const jsonlPath: string = resolveJsonlPath();

  let content: string;
  try {
    content = await fs.readFile(jsonlPath, 'utf8');
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));
    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[MA-WAVE-JSONL-READ-FAIL] ${e.message.slice(0, 200)}`,
      extra: { errorCode: 'MA-WAVE-JSONL-READ-FAIL', issuer: 'wave-jsonl.util.readWavesFromJsonl', path: jsonlPath, stack: e.stack },
    });

    return [];
  }

  const lines: string[] = content.split(/\r?\n/).filter((l: string): boolean => l.trim().length > 0);
  const tail: string[] = lines.slice(-safeLimit);

  const rows: WaveJsonl_Row[] = [];

  for (const line of tail) {
    let raw: RawJsonlRow_Interface;
    try {
      raw = JSON.parse(line) as RawJsonlRow_Interface;
    } catch (err) {
      const e: Error = err instanceof Error ? err : new Error(String(err));
      await emitServerActionLog({
        actor: 'server',
        kind: 'error',
        summary: `[MA-WAVE-JSONL-PARSE-FAIL] ${e.message.slice(0, 100)} — line skipped`,
        extra: { errorCode: 'MA-WAVE-JSONL-PARSE-FAIL', issuer: 'wave-jsonl.util.readWavesFromJsonl', linePreview: line.slice(0, 120) },
      });
      continue;
    }

    if (!raw.ts) {
      continue;
    }

    const kinds: WaveJsonl_Kind[] = [ 'astral', 'mental', 'matter' ];

    for (const kind of kinds) {
      const field: keyof RawJsonlRow_Interface = KIND_FIELD_MAP[kind];
      const level: string | undefined = raw[field] as string | undefined;

      if (!level) {
        continue;
      }

      rows.push({
        ts: raw.ts,
        kind,
        value: levelToValue(level),
        level,
        vector: raw.wave_vector ?? null,
        mood: raw.mood ?? null,
        note: raw.note ?? null,
      });
    }
  }

  return rows;
}
