// Cast receiver-namespace volume kezelés (per-device).
// connect → getStatus / setVolume → close. NEM launch-ol media app-ot, csak a
// receiver-szintű hangerőt és mute-ot olvassa/írja.
//
// Defaults stratégia: minden eszközt EGYEDILEG mentünk-állítunk. Group-szintű
// volume manipulációt SOHA nem csinálunk (lásd current/principles/cast-notifier-defaults.md).

import { capLevelForDevice, type DeviceVolumeCaps } from './device-caps.js';

// Lokál típusok (workspace szabály: nincs .d.ts; a használat helyén deklarálunk).
interface CastVolumeState {
  level: number;
  muted: boolean;
}

interface CastReceiverStatus {
  applications?: Array<{
    appId: string;
    displayName: string;
    sessionId: string;
    statusText?: string;
    transportId?: string;
  }>;
  volume: CastVolumeState;
}

interface CastReceiverClient {
  connect(opts: { host: string; port?: number }, cb: () => void): void;
  close(): void;
  on(event: 'error', cb: (err: Error) => void): void;
  getStatus(cb: (err: Error | null, status: CastReceiverStatus) => void): void;
  setVolume(
    volume: Partial<CastVolumeState>,
    cb: (err: Error | null, volume: CastVolumeState) => void,
  ): void;
}

// @ts-expect-error - castv2-client lacks published types; kept untyped on purpose (no .d.ts).
import { Client as ClientCtor } from 'castv2-client';
import { safeCall } from '../utils/safe-call.js';
const Client = ClientCtor as unknown as new () => CastReceiverClient;

export interface VolumeTargetRef {
  name: string;
  address: string;
  port?: number;
}

export interface SavedVolumeEntry {
  name: string;
  address: string;
  port: number;
  level: number;
  muted: boolean;
}

const DEFAULT_PORT = 8009;
const DEFAULT_TIMEOUT_MS = 8000;

export async function getReceiverStatus(
  ref: VolumeTargetRef,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<CastReceiverStatus> {
  const port = ref.port ?? DEFAULT_PORT;
  return withClient<CastReceiverStatus>(ref.address, port, timeoutMs, (client, settle) => {
    client.getStatus((err, status) => {
      if (err) {
        settle.err(new Error(`getStatus(${ref.name}): ${err.message}`));
        return;
      }
      settle.ok(status);
    });
  });
}

export async function setReceiverVolume(
  ref: VolumeTargetRef,
  volume: Partial<CastVolumeState>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<CastVolumeState> {
  const port = ref.port ?? DEFAULT_PORT;
  return withClient<CastVolumeState>(ref.address, port, timeoutMs, (client, settle) => {
    client.setVolume(volume, (err, vol) => {
      if (err) {
        settle.err(new Error(`setVolume(${ref.name}): ${err.message}`));
        return;
      }
      settle.ok(vol);
    });
  });
}

// === Orchestráció: SAVE → UP → RESTORE ====================================

export interface SaveAllResult {
  saved: SavedVolumeEntry[];
  failed: Array<{ name: string; error: string }>;
}

export async function saveVolumes(
  refs: VolumeTargetRef[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  onLog?: (msg: string) => void,
): Promise<SaveAllResult> {
  const saved: SavedVolumeEntry[] = [];
  const failed: Array<{ name: string; error: string }> = [];

  await Promise.all(
    refs.map(async (ref) => {
      try {
        const status = await getReceiverStatus(ref, timeoutMs);
        const port = ref.port ?? DEFAULT_PORT;
        saved.push({
          name: ref.name,
          address: ref.address,
          port,
          level: status.volume.level,
          muted: status.volume.muted,
        });
        onLog?.(`save ${ref.name}: level=${status.volume.level.toFixed(2)} muted=${status.volume.muted}`);
      } catch (err) {
        const e = err as Error;
        failed.push({ name: ref.name, error: e.message });
        onLog?.(`save ${ref.name}: FAILED — ${e.message}`);
      }
    }),
  );

  return { saved, failed };
}

export async function applyVolumeAll(
  refs: VolumeTargetRef[],
  level: number,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  onLog?: (msg: string) => void,
  caps?: DeviceVolumeCaps,
): Promise<{ applied: string[]; failed: Array<{ name: string; error: string }> }> {
  const applied: string[] = [];
  const failed: Array<{ name: string; error: string }> = [];

  await Promise.all(
    refs.map(async (ref) => {
      // Per-device cap (FR #7e): a cap-elt eszközöket (pl. BathCom) sose
      // emeljük a kemény felső határ fölé — min(level, cap).
      const capped: number = caps ? capLevelForDevice(ref.name, level, caps) : level;
      const clamped: number = clampLevel(capped);

      try {
        await setReceiverVolume(ref, { level: clamped, muted: false }, timeoutMs);
        applied.push(ref.name);
        const capNote: string = capped < level ? ` (capped from ${level.toFixed(2)})` : '';
        onLog?.(`set ${ref.name}: level=${clamped.toFixed(2)}${capNote} muted=false`);
      } catch (err) {
        const e = err as Error;
        failed.push({ name: ref.name, error: e.message });
        onLog?.(`set ${ref.name}: FAILED — ${e.message}`);
      }
    }),
  );

  return { applied, failed };
}

export async function restoreVolumes(
  saved: SavedVolumeEntry[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  onLog?: (msg: string) => void,
): Promise<{ restored: string[]; failed: Array<{ name: string; error: string }> }> {
  const restored: string[] = [];
  const failed: Array<{ name: string; error: string }> = [];

  await Promise.all(
    saved.map(async (entry) => {
      const ref: VolumeTargetRef = { name: entry.name, address: entry.address, port: entry.port };
      try {
        await setReceiverVolume(ref, { level: entry.level, muted: entry.muted }, timeoutMs);
        restored.push(entry.name);
        onLog?.(`restore ${entry.name}: level=${entry.level.toFixed(2)} muted=${entry.muted}`);
      } catch (err) {
        const e = err as Error;
        failed.push({ name: entry.name, error: e.message });
        onLog?.(`restore ${entry.name}: FAILED — ${e.message}`);
      }
    }),
  );

  return { restored, failed };
}

// === Helpers ===============================================================

function clampLevel(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

interface Settle<T> {
  ok: (value: T) => void;
  err: (e: Error) => void;
}

function withClient<T>(
  host: string,
  port: number,
  timeoutMs: number,
  body: (client: CastReceiverClient, settle: Settle<T>) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const client = new Client();
    let settled = false;

    const safety = setTimeout(() => {
      if (settled) return;
      settled = true;
      safeCall(() => client.close(), 'volume.client.close');
      reject(new Error(`Receiver timeout (${timeoutMs}ms) for ${host}:${port}`));
    }, timeoutMs);

    const settle: Settle<T> = {
      ok: (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(safety);
        safeCall(() => client.close(), 'volume.client.close');
        resolve(value);
      },
      err: (e) => {
        if (settled) return;
        settled = true;
        clearTimeout(safety);
        safeCall(() => client.close(), 'volume.client.close');
        reject(e);
      },
    };

    client.on('error', (err) => settle.err(err));
    client.connect({ host, port }, () => {
      try {
        body(client, settle);
      } catch (err) {
        settle.err(err as Error);
      }
    });
  });
}
