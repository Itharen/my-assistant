// Cast Group → tag eszközök mapping. A Cast protocol nem ad publikus utat a
// group-tagok kiderítésére, ezért kézzel karbantartott config: config/groups.json.
//
// Ha egy play-target Cast Group, és nincs explicit config bejegyzés, akkor
// fallback: minden discovery-ben látott INDIVIDUAL hangszórót (md != "Google Cast Group")
// volume-target-nek tekintünk. Ez a tipikus "All Speakers" use case-re jó default.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { CastDevice } from './discover.js';
import type { VolumeTargetRef } from './volume.js';

export interface GroupConfig {
  [groupName: string]: string[];
}

const GROUP_TYPE_MD = 'Google Cast Group';

export function loadGroupConfig(configPath?: string): GroupConfig {
  const path = configPath ?? defaultConfigPath();
  if (!existsSync(path)) return {};

  try {
    const raw = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: GroupConfig = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (k.startsWith('_')) continue;
      if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
        out[k] = v as string[];
      }
    }
    return out;
  } catch {
    return {};
  }
}

function defaultConfigPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', '..', 'config', 'groups.json');
}

export function isCastGroup(device: CastDevice): boolean {
  return device.txt['md'] === GROUP_TYPE_MD;
}

// A play target alapján visszaadja azokat az INDIVIDUAL hangszórókat, amiknek
// volume-ot kell save→up→restore-olni.
//
// 1. Ha override (--volume-targets) adott: azokat a neveket resolve-oljuk discovery-ből
// 2. Ha a play target individual: csak az
// 3. Ha a play target group:
//    a) config-ban van bejegyzés a group nevére → azok a tagok
//    b) különben fallback: minden individual hangszóró a discovery-ben
export function resolveVolumeTargets(args: {
  playTarget: CastDevice;
  allDevices: CastDevice[];
  config: GroupConfig;
  override?: string[];
  onLog?: (msg: string) => void;
}): VolumeTargetRef[] {
  const { playTarget, allDevices, config, override, onLog } = args;

  if (override && override.length > 0) {
    const refs = override.map((n) => findByName(allDevices, n)).filter((d): d is CastDevice => d !== null);
    onLog?.(`volume-targets override: ${refs.map((d) => d.name).join(', ')}`);
    return refs.map(toRef);
  }

  if (!isCastGroup(playTarget)) {
    onLog?.(`single device target: ${playTarget.name}`);
    return [toRef(playTarget)];
  }

  const configured = config[playTarget.name];
  if (configured && configured.length > 0) {
    const refs = configured
      .map((n) => findByName(allDevices, n))
      .filter((d): d is CastDevice => d !== null);
    onLog?.(`group "${playTarget.name}" → ${refs.length} member(s) from config`);
    return refs.map(toRef);
  }

  // Fallback: minden individual
  const allIndividuals = allDevices.filter((d) => !isCastGroup(d));
  onLog?.(
    `group "${playTarget.name}" → no config entry, fallback to all ${allIndividuals.length} individuals`,
  );
  return allIndividuals.map(toRef);
}

function findByName(devices: CastDevice[], name: string): CastDevice | null {
  const target = name.trim().toLowerCase();
  // 1) exact friendly name
  const exact = devices.find((d) => d.name.toLowerCase() === target);
  if (exact) return exact;
  // 2) substring fallback (csak individual eszközökre nézzük)
  const subs = devices.filter((d) => !isCastGroup(d) && d.name.toLowerCase().includes(target));
  return subs[0] ?? null;
}

function toRef(d: CastDevice): VolumeTargetRef {
  return { name: d.name, address: d.address, port: d.port };
}
