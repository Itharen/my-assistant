// Teljes notify flow:
// 1) discovery vagy direct host
// 2) volume targets resolve (group→members vagy single)
// 3) MUSIC pre-snapshot (Cast getStatus + Spotify Web API ha config van)
// 4) volume SAVE (per device current level + muted)
// 5) volume UP (announcement loudness, default 0.7) — per device
// 6) TTS gen + mini server + cast play
// 7) volume RESTORE (per device exact saved values) — finally blockban
// 8) MUSIC RESUME (Spotify-on át, ha pre-snapshot szerint ment) — finally után
//
// A volume save+restore és a music capture+resume egyaránt KÖTELEZŐ minden hívásnál
// (lásd current/principles/cast-notifier-defaults.md).

import { fetchTtsMp3 } from './tts.js';
import { startMp3Server } from './mp3-server.js';
import { discoverCastDevices, type CastDevice } from './discover.js';
import { playOnCast, launchAppOnCast, type PlayResult } from './cast-client.js';
import {
  saveVolumes,
  applyVolumeAll,
  restoreVolumes,
  getReceiverStatus,
  type SavedVolumeEntry,
  type VolumeTargetRef,
} from './volume.js';
import { loadGroupConfig, resolveVolumeTargets } from './groups.js';
import {
  loadConfig as loadSpotifyConfig,
  ensureFreshToken,
  getCurrentPlayback,
  listDevices,
  transferPlayback,
  resolveResumeDevice,
  isSpotifyApp,
  type PlaybackSnapshot,
} from '../spotify/spotify.client.js';

export const DEFAULT_TARGET = 'All Speakers';
export const DEFAULT_ANNOUNCEMENT_VOLUME = 0.7;

export interface NotifyOptions {
  text: string;
  target?: string;
  host?: string;
  port?: number;
  lang?: string;
  voice?: string;
  discoveryTimeoutMs?: number;
  interfaces?: string[];
  announcementVolume?: number;
  noVolume?: boolean;
  volumeTargets?: string[];
  noResume?: boolean;
  onLog?: (msg: string) => void;
}

export interface NotifyResult {
  device: { name: string; address: string; port: number };
  play: PlayResult;
  ttsBytes: number;
  voice: string;
  serverUrl: string;
  serverBoundIp: string;
  mode: 'discovery' | 'direct';
  volume: VolumeOrchestrationResult;
  music: MusicOrchestrationResult;
}

export interface VolumeOrchestrationResult {
  enabled: boolean;
  announcementLevel?: number;
  targets: Array<{ name: string; address: string; port: number }>;
  saved: SavedVolumeEntry[];
  saveFailures: Array<{ name: string; error: string }>;
  applied: string[];
  applyFailures: Array<{ name: string; error: string }>;
  restored: string[];
  restoreFailures: Array<{ name: string; error: string }>;
}

export interface MusicOrchestrationResult {
  enabled: boolean;
  spotifyConfigured: boolean;
  detectedApps: Array<{ deviceName: string; appId: string; displayName: string }>;
  preSnapshot?: PlaybackSnapshot;
  resumed: boolean;
  resumedDevice?: { id: string; name: string };
  resumeError?: string;
  skipped?: string;
}

export async function notify(opts: NotifyOptions): Promise<NotifyResult> {
  const {
    text,
    target = DEFAULT_TARGET,
    host,
    port = 8009,
    lang = 'hu',
    voice,
    discoveryTimeoutMs = 4000,
    interfaces,
    announcementVolume = DEFAULT_ANNOUNCEMENT_VOLUME,
    noVolume = false,
    volumeTargets: volumeTargetsOverride,
    noResume = false,
    onLog,
  } = opts;

  // 1. Eszköz kiválasztása — discovery vagy direct
  let playDevice: CastDevice;
  let allDevices: CastDevice[] = [];
  let mode: 'discovery' | 'direct';

  if (host) {
    onLog?.(`Direct mode: ${host}:${port} (discovery skipped)`);
    playDevice = { name: host, host, address: host, port, txt: {} };
    mode = 'direct';
  } else {
    allDevices = await discoverCastDevices({ timeoutMs: discoveryTimeoutMs, interfaces, onLog });
    if (allDevices.length === 0) {
      throw new Error(
        'No Cast devices discovered. Próbáld a `discover` parancsot --pretty + --verbose-szal, ' +
          'vagy add meg a hangszóró IP-jét a --host flag-gel (alapértelmezett port 8009).',
      );
    }
    playDevice = pickDevice(allDevices, target);
    mode = 'discovery';
  }

  // 2. Volume targets resolve
  const groupConfig = loadGroupConfig();
  const volumeRefs =
    noVolume || mode === 'direct'
      ? []
      : resolveVolumeTargets({
          playTarget: playDevice,
          allDevices,
          config: groupConfig,
          override: volumeTargetsOverride,
          onLog,
        });

  const volume: VolumeOrchestrationResult = {
    enabled: !noVolume && volumeRefs.length > 0,
    announcementLevel: !noVolume && volumeRefs.length > 0 ? announcementVolume : undefined,
    targets: volumeRefs.map((r) => ({ name: r.name, address: r.address, port: r.port ?? 8009 })),
    saved: [],
    saveFailures: [],
    applied: [],
    applyFailures: [],
    restored: [],
    restoreFailures: [],
  };

  // 3. MUSIC pre-snapshot — Cast getStatus a volume target eszközökön + Spotify API
  const music = await preSnapshotMusic({
    volumeRefs: volume.enabled ? volumeRefs : [toRef(playDevice)],
    skip: noResume || mode === 'direct',
    onLog,
  });

  // 4. Volume SAVE
  if (volume.enabled) {
    onLog?.(`volume save: ${volumeRefs.length} target(s)`);
    const saveRes = await saveVolumes(volumeRefs, 8000, onLog);
    volume.saved = saveRes.saved;
    volume.saveFailures = saveRes.failed;
  }

  // 5. Volume UP
  if (volume.enabled && volume.saved.length > 0) {
    onLog?.(`volume up to ${announcementVolume.toFixed(2)} on ${volume.saved.length} device(s)`);
    const applyRes = await applyVolumeAll(
      volume.saved.map((s) => ({ name: s.name, address: s.address, port: s.port })),
      announcementVolume,
      8000,
      onLog,
    );
    volume.applied = applyRes.applied;
    volume.applyFailures = applyRes.failed;
  }

  // 6. TTS gen + server + play. Restore mindig fut a finally-ben.
  let result: NotifyResult | undefined;
  try {
    const mp3 = await fetchTtsMp3({ text, voice, lang });
    onLog?.(`TTS generated: ${mp3.length} bytes (voice ${voice ?? 'auto'})`);

    const serverHandle = await startMp3Server({ buffer: mp3, targetIp: playDevice.address });
    onLog?.(`MP3 server: ${serverHandle.url} (boundIp ${serverHandle.boundIp})`);

    let play: PlayResult;
    try {
      play = await playOnCast({
        host: playDevice.address,
        port: playDevice.port,
        mediaUrl: serverHandle.url,
      });
    } finally {
      await serverHandle.close().catch(() => {
        /* swallow */
      });
    }

    result = {
      device: { name: playDevice.name, address: playDevice.address, port: playDevice.port },
      play,
      ttsBytes: mp3.length,
      voice: voice ?? defaultVoiceForLang(lang),
      serverUrl: serverHandle.url,
      serverBoundIp: serverHandle.boundIp,
      mode,
      volume,
      music,
    };
  } finally {
    // 7. Volume RESTORE — best-effort
    if (volume.enabled && volume.saved.length > 0) {
      onLog?.(`volume restore: ${volume.saved.length} device(s)`);
      const restoreRes = await restoreVolumes(volume.saved, 8000, onLog);
      volume.restored = restoreRes.restored;
      volume.restoreFailures = restoreRes.failed;
    }
  }

  // 8. MUSIC RESUME — best-effort, a finally után
  if (result) {
    await resumeMusic({
      music,
      playDevice,
      onLog,
    });
  }

  if (!result) {
    // Hipotetikus path — csak ha a try-finally korábban abortált
    throw new Error('Unreachable: notify result is undefined');
  }
  return result;
}

// ===== Music pre-snapshot ====================================================

async function preSnapshotMusic(args: {
  volumeRefs: VolumeTargetRef[];
  skip: boolean;
  onLog?: (msg: string) => void;
}): Promise<MusicOrchestrationResult> {
  const { volumeRefs, skip, onLog } = args;
  const out: MusicOrchestrationResult = {
    enabled: !skip,
    spotifyConfigured: false,
    detectedApps: [],
    resumed: false,
  };

  if (skip) {
    out.skipped = 'noResume flag or direct mode';
    return out;
  }

  // Cast getStatus minden volume targeten — látjuk mi fut
  await Promise.all(
    volumeRefs.map(async (ref) => {
      try {
        const status = await getReceiverStatus(ref, 6000);
        for (const app of status.applications ?? []) {
          out.detectedApps.push({
            deviceName: ref.name,
            appId: app.appId,
            displayName: app.displayName,
          });
        }
      } catch (err) {
        onLog?.(`pre-snapshot getStatus(${ref.name}): ${(err as Error).message}`);
      }
    }),
  );

  const spotifyDetected = out.detectedApps.some((a) => isSpotifyApp(a.appId, a.displayName));
  if (!spotifyDetected) {
    onLog?.('music pre-snapshot: no Spotify app detected on volume targets');
    return out;
  }

  // Spotify config betöltés
  const cfg = await loadSpotifyConfig();
  if (!cfg) {
    out.skipped = 'spotify config missing — run pnpm spotify:auth';
    onLog?.(`music pre-snapshot: ${out.skipped}`);
    return out;
  }
  out.spotifyConfigured = true;

  try {
    const token = await ensureFreshToken(cfg);
    const playback = await getCurrentPlayback(token);
    if (playback) {
      out.preSnapshot = playback;
      onLog?.(
        `music pre-snapshot: Spotify on "${playback.deviceName}" — ${playback.trackName ?? '?'} (${playback.isPlaying ? 'playing' : 'paused'} @ ${Math.floor(playback.positionMs / 1000)}s)`,
      );
    } else {
      onLog?.('music pre-snapshot: Spotify Web API reports no active playback');
    }
  } catch (err) {
    out.skipped = `spotify api error: ${(err as Error).message}`;
    onLog?.(`music pre-snapshot: ${out.skipped}`);
  }

  return out;
}

// ===== Music resume ==========================================================

const SPOTIFY_RECEIVER_APP_ID = '705D30C6';

async function resumeMusic(args: {
  music: MusicOrchestrationResult;
  playDevice: CastDevice;
  onLog?: (msg: string) => void;
}): Promise<void> {
  const { music, playDevice, onLog } = args;
  const snap = music.preSnapshot;

  if (!snap) return;
  if (!snap.isPlaying) {
    onLog?.('music resume: pre-snapshot was not playing — skip');
    return;
  }

  const cfg = await loadSpotifyConfig();
  if (!cfg) {
    music.resumeError = 'spotify config disappeared mid-flow';
    return;
  }

  try {
    const token = await ensureFreshToken(cfg);

    // 1. saved deviceId direkt
    if (await tryTransfer(token, snap.deviceId, snap.deviceName, music, onLog, 'saved deviceId')) {
      return;
    }

    // 2. KEY HACK: relaunch Spotify Receiver app a Cast target-en, hogy
    //    visszakerüljön a Spotify Connect device-listába
    onLog?.(`music resume: launching Spotify Receiver on ${playDevice.name} (${playDevice.address}:${playDevice.port}) to re-register device`);
    try {
      await launchAppOnCast({
        host: playDevice.address,
        port: playDevice.port,
        appId: SPOTIFY_RECEIVER_APP_ID,
        timeoutMs: 8000,
      });
      onLog?.(`music resume: Spotify Receiver launched, waiting for Connect re-register`);
      // Várunk hogy a Spotify Connect észlelje a device-ot
      await sleep(3000);
    } catch (err) {
      onLog?.(`music resume: Spotify Receiver launch failed: ${(err as Error).message} — continuing fallback retries`);
    }

    // 3. backoff + re-list + name-match
    const waits = [1000, 2000, 4000];
    for (let attempt = 0; attempt < waits.length; attempt++) {
      const w = waits[attempt]!;
      onLog?.(`music resume retry ${attempt + 1}: wait ${w}ms then re-list`);
      await sleep(w);
      const devices = await listDevices(token);
      const resolved = resolveResumeDevice(snap.deviceName, devices);
      if (resolved.device) {
        if (await tryTransfer(token, resolved.device.id, resolved.device.name, music, onLog, `re-listed`)) {
          return;
        }
      } else {
        onLog?.(`music resume retry ${attempt + 1}: "${snap.deviceName}" not in [${devices.map((d) => d.name).join(', ')}]`);
      }
    }

    music.resumeError = `resume failed — "${snap.deviceName}" did not re-register in Spotify Connect even after Spotify Receiver re-launch. This is a known Cast Group limitation; manual recovery: re-cast from Spotify app on phone.`;
    onLog?.(`music resume: ${music.resumeError}`);
  } catch (err) {
    music.resumeError = (err as Error).message;
    onLog?.(`music resume: FAILED — ${music.resumeError}`);
  }
}

async function tryTransfer(
  token: string,
  deviceId: string,
  deviceName: string,
  music: MusicOrchestrationResult,
  onLog: ((m: string) => void) | undefined,
  via: string,
): Promise<boolean> {
  try {
    await transferPlayback(token, deviceId, true);
    music.resumed = true;
    music.resumedDevice = { id: deviceId, name: deviceName };
    onLog?.(`music resume: transferred via ${via} to "${deviceName}"`);
    return true;
  } catch (err) {
    onLog?.(`music resume via ${via}: ${(err as Error).message}`);
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===== Helpers ===============================================================

function pickDevice(devices: CastDevice[], target: string): CastDevice {
  const exact = devices.find((d) => d.name.toLowerCase() === target.toLowerCase());
  if (exact) return exact;
  const t = target.toLowerCase();
  const match = devices.find((d) => d.name.toLowerCase().includes(t));
  if (!match) {
    const names = devices.map((d) => d.name).join(', ');
    throw new Error(`Target "${target}" not found. Available: ${names}`);
  }
  return match;
}

function toRef(d: CastDevice): VolumeTargetRef {
  return { name: d.name, address: d.address, port: d.port };
}

function defaultVoiceForLang(lang: string): string {
  const m: Record<string, string> = {
    hu: 'hu-HU-TamasNeural',
    en: 'en-US-GuyNeural',
    de: 'de-DE-ConradNeural',
    fr: 'fr-FR-HenriNeural',
  };
  return m[lang] ?? 'hu-HU-TamasNeural';
}
