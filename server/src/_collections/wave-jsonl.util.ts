// 3x3-log JSONL reader + writer. Maps `__agent/state/3x3-log.jsonl` (the
// canonical append-only source-of-truth for 3x3 wave snapshots) to a numeric
// series the dashboard panel can render without DB access, and accepts new
// snapshots from the UI form (Phase 3.A).
//
// FR #3b-WAVE-UI Phase 2.A (cycle 52): a read útvonal bypass-eli az AUTH
// BLOCKER-t a `/api/dashboard/snapshot`-on.
// FR #3b-WAVE-UI Phase 3.A (cycle 54): a write útvonal egy unauth POST
// endpoint-en át append-eli a kliens-formról érkező snapshotokat.
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

// ── Writer ────────────────────────────────────────────────────────────────────

/** Wave snapshot payload — a kliens-form által POST-olt új-snapshot body shape-je. */
export interface WaveJsonlSnapshot_Payload {
  astral?: string;
  mental?: string;
  material?: string;
  wave_vector?: WaveJsonl_Vector;
  mood?: string;
  note?: string;
}

/** Append-result — sikeresség + a generált ts (a hívó visszaadhatja a kliensnek). */
export interface WaveJsonlAppend_Result {
  ok: boolean;
  ts: string;
  errorCode?: string;
  message?: string;
}

const ALLOWED_LEVELS: Set<string> = new Set([
  'very-low', 'low', 'low-mid', 'mid', 'mid+', 'normal', 'high', 'very-high',
]);
const ALLOWED_VECTORS: Set<WaveJsonl_Vector> = new Set([ 'up', 'down', 'flat' ]);
const MOOD_MAX_LEN: number = 120;
const NOTE_MAX_LEN: number = 2000;

/** Európa/Budapest ISO timestamp, mint az action-log.util `nowIsoBudapest`. */
function nowIsoBudapest(): string {
  const d: Date = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  const offMin: number = -d.getTimezoneOffset();
  const sign: string = offMin >= 0 ? '+' : '-';
  const abs: number = Math.abs(offMin);
  const offset: string = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;

  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${offset}`
  );
}

/**
 * Snapshot payload validáció. Legalább egy szint (astral/mental/material) kötelező,
 * a megadott szintek a `ALLOWED_LEVELS` halmazból. Mood/note hossz-korlát.
 * Hibás → `MA-WAVE-JSONL-INVALID-PAYLOAD` errorCode + leíró message.
 */
function validatePayload(payload: WaveJsonlSnapshot_Payload): { ok: true } | { ok: false; errorCode: string; message: string } {
  const hasAnyLevel: boolean = !!(payload.astral || payload.mental || payload.material);

  if (!hasAnyLevel) {
    return { ok: false, errorCode: 'MA-WAVE-JSONL-INVALID-PAYLOAD', message: 'At least one of astral/mental/material required' };
  }

  const levelFields: (keyof WaveJsonlSnapshot_Payload)[] = [ 'astral', 'mental', 'material' ];

  for (const f of levelFields) {
    const v: string | undefined = payload[f] as string | undefined;

    if (v && !ALLOWED_LEVELS.has(v)) {
      return { ok: false, errorCode: 'MA-WAVE-JSONL-INVALID-PAYLOAD', message: `Field '${f}' has invalid level '${v}'` };
    }
  }

  if (payload.wave_vector && !ALLOWED_VECTORS.has(payload.wave_vector)) {
    return { ok: false, errorCode: 'MA-WAVE-JSONL-INVALID-PAYLOAD', message: `Invalid wave_vector '${payload.wave_vector}'` };
  }

  if (payload.mood && payload.mood.length > MOOD_MAX_LEN) {
    return { ok: false, errorCode: 'MA-WAVE-JSONL-INVALID-PAYLOAD', message: `mood exceeds ${MOOD_MAX_LEN} chars` };
  }

  if (payload.note && payload.note.length > NOTE_MAX_LEN) {
    return { ok: false, errorCode: 'MA-WAVE-JSONL-INVALID-PAYLOAD', message: `note exceeds ${NOTE_MAX_LEN} chars` };
  }

  return { ok: true };
}

/**
 * Új wave snapshotot append-el a `__agent/state/3x3-log.jsonl` végére. Payload
 * validáció előtte (legalább 1 szint, allowed levels, mood/note hossz-cap).
 *
 * Sikeres write → `{ ok: true, ts }`. Validáció-hiba / fájl-write hiba →
 * `{ ok: false, errorCode, message }` + emitServerActionLog. No-throw.
 */
export async function appendWaveSnapshotToJsonl(
  payload: WaveJsonlSnapshot_Payload,
): Promise<WaveJsonlAppend_Result> {
  const ts: string = nowIsoBudapest();
  const validation: ReturnType<typeof validatePayload> = validatePayload(payload);

  if (!validation.ok) {
    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[${validation.errorCode}] ${validation.message}`,
      extra: { errorCode: validation.errorCode, issuer: 'wave-jsonl.util.appendWaveSnapshotToJsonl' },
    });

    return { ok: false, ts, errorCode: validation.errorCode, message: validation.message };
  }

  const row: Record<string, unknown> = { ts, actor: 'user' };

  if (payload.astral) row.astral = payload.astral;
  if (payload.mental) row.mental = payload.mental;
  if (payload.material) row.material = payload.material;
  if (payload.wave_vector) row.wave_vector = payload.wave_vector;
  if (payload.mood) row.mood = payload.mood;
  if (payload.note) row.note = payload.note;

  const jsonlPath: string = resolveJsonlPath();

  try {
    await fs.mkdir(path.dirname(jsonlPath), { recursive: true });
    await fs.appendFile(jsonlPath, JSON.stringify(row) + '\n', { encoding: 'utf8' });
  } catch (err) {
    const e: Error = err instanceof Error ? err : new Error(String(err));
    const errorCode: string = 'MA-WAVE-JSONL-WRITE-FAIL';

    await emitServerActionLog({
      actor: 'server',
      kind: 'error',
      summary: `[${errorCode}] ${e.message.slice(0, 200)}`,
      extra: { errorCode, issuer: 'wave-jsonl.util.appendWaveSnapshotToJsonl', path: jsonlPath, stack: e.stack },
    });

    return { ok: false, ts, errorCode, message: e.message };
  }

  await emitServerActionLog({
    actor: 'server',
    kind: 'state-change',
    summary: `wave snapshot appended (astral=${payload.astral ?? '-'}/mental=${payload.mental ?? '-'}/material=${payload.material ?? '-'}/vector=${payload.wave_vector ?? '-'})`,
    extra: { issuer: 'wave-jsonl.util.appendWaveSnapshotToJsonl', ts },
  });

  return { ok: true, ts };
}

// ── JSONL ↔ Wave DB sync (FR #3b-WAVE-UI Phase 4) ────────────────────────────

/**
 * Egy JSONL snapshot payload explode-olása a DB-be. Mind a 3 csatorna (astral/
 * mental/matter) egy-egy Wave row-ként kerül be, denormalizált mood/wave_vector/
 * note-tal. Idempotency: `snapshotTs + kind` unique combo. A hívó (controller
 * vagy script) felelős a Wave_DataService konstrukciójáért + saveData-ért.
 *
 * Visszaadja a kész Wave-payload listát + a duplikációkat (Wave-array, nem
 * Wave_DataService).
 *
 * NOTE: a beillesztést maga NEM végzi — ez egy tiszta pure mapper. A DB-side
 * effect a hívó controller-ben történik (DB connection a DyNTS_GlobalService-ben).
 */
export function buildWaveRowsFromSnapshot(
  payload: WaveJsonlSnapshot_Payload,
  ts: string,
): { kind: WaveJsonl_Kind; value: number; level: string; vector: WaveJsonl_Vector | null; mood: string | null; note: string | null; snapshotTs: string }[] {
  const rows: { kind: WaveJsonl_Kind; value: number; level: string; vector: WaveJsonl_Vector | null; mood: string | null; note: string | null; snapshotTs: string }[] = [];
  const kinds: WaveJsonl_Kind[] = [ 'astral', 'mental', 'matter' ];

  for (const kind of kinds) {
    const field: keyof RawJsonlRow_Interface = KIND_FIELD_MAP[kind];
    const level: string | undefined = payload[field as keyof WaveJsonlSnapshot_Payload] as string | undefined;

    if (!level) {
      continue;
    }

    rows.push({
      kind,
      value: levelToValue(level),
      level,
      vector: payload.wave_vector ?? null,
      mood: payload.mood ?? null,
      note: payload.note ?? null,
      snapshotTs: ts,
    });
  }

  return rows;
}

/**
 * Olvas `__agent/state/3x3-log.jsonl`-ből MINDEN sort (nem csak limit-szelet),
 * és buildeli az explode-olt Wave-payload listát snapshot-szintű ts-szel.
 * A controller / sync-script ezt iterálja és per-row idempotens `findDataList`
 * + `saveData` ciklust futtat.
 *
 * Hibás JSON sorok skip-elve + emitServerActionLog. Fájl-hiba esetén üres `[]`
 * + MA-WAVE-JSONL-READ-FAIL action-log, no-throw.
 */
export async function loadAllSnapshotRowsForSync(): Promise<{ kind: WaveJsonl_Kind; value: number; level: string; vector: WaveJsonl_Vector | null; mood: string | null; note: string | null; snapshotTs: string }[]> {
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
      extra: { errorCode: 'MA-WAVE-JSONL-READ-FAIL', issuer: 'wave-jsonl.util.loadAllSnapshotRowsForSync', path: jsonlPath, stack: e.stack },
    });

    return [];
  }

  const lines: string[] = content.split(/\r?\n/).filter((l: string): boolean => l.trim().length > 0);
  const result: { kind: WaveJsonl_Kind; value: number; level: string; vector: WaveJsonl_Vector | null; mood: string | null; note: string | null; snapshotTs: string }[] = [];

  for (const line of lines) {
    let raw: RawJsonlRow_Interface;
    try {
      raw = JSON.parse(line) as RawJsonlRow_Interface;
    } catch (err) {
      const e: Error = err instanceof Error ? err : new Error(String(err));
      await emitServerActionLog({
        actor: 'server',
        kind: 'error',
        summary: `[MA-WAVE-JSONL-PARSE-FAIL] ${e.message.slice(0, 100)} — line skipped`,
        extra: { errorCode: 'MA-WAVE-JSONL-PARSE-FAIL', issuer: 'wave-jsonl.util.loadAllSnapshotRowsForSync', linePreview: line.slice(0, 120) },
      });
      continue;
    }

    if (!raw.ts) {
      continue;
    }

    const synthPayload: WaveJsonlSnapshot_Payload = {
      astral: raw.astral,
      mental: raw.mental,
      material: raw.material,
      wave_vector: raw.wave_vector,
      mood: raw.mood,
      note: raw.note,
    };

    result.push(...buildWaveRowsFromSnapshot(synthPayload, raw.ts));
  }

  return result;
}
