import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RegionOfInterest, ScreenWakerConfig } from './types.js';

const packageRoot: string = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const defaultConfigPath: string = path.join(packageRoot, 'config.json');

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }

  return value as Record<string, unknown>;
}

function requireNumber(
  input: Record<string, unknown>,
  key: string,
  options: { min: number; max: number; integer?: boolean },
): number {
  const value: unknown = input[key];
  const integerIsRequired: boolean = options.integer ?? false;

  if (
    typeof value !== 'number'
    || !Number.isFinite(value)
    || value < options.min
    || value > options.max
    || (integerIsRequired && !Number.isInteger(value))
  ) {
    const numberType: string = integerIsRequired ? 'integer' : 'number';
    throw new Error(`${key} must be a ${numberType} between ${options.min} and ${options.max}`);
  }

  return value;
}

function requireBoolean(input: Record<string, unknown>, key: string): boolean {
  const value: unknown = input[key];
  if (typeof value !== 'boolean') {
    throw new Error(`${key} must be a boolean`);
  }

  return value;
}

function parseRoi(value: unknown): RegionOfInterest | null {
  if (value === null) return null;

  const roi: Record<string, unknown> = requireRecord(value, 'roi');
  const parsed: RegionOfInterest = {
    x: requireNumber(roi, 'x', { min: 0, max: 1 }),
    y: requireNumber(roi, 'y', { min: 0, max: 1 }),
    width: requireNumber(roi, 'width', { min: Number.EPSILON, max: 1 }),
    height: requireNumber(roi, 'height', { min: Number.EPSILON, max: 1 }),
  };

  if (parsed.x + parsed.width > 1 || parsed.y + parsed.height > 1) {
    throw new Error('roi must stay inside normalized 0..1 frame coordinates');
  }

  return parsed;
}

export function validateConfig(value: unknown): ScreenWakerConfig {
  const input: Record<string, unknown> = requireRecord(value, 'config');

  return {
    cameraIndex: requireNumber(input, 'cameraIndex', { min: 0, max: 32, integer: true }),
    captureIntervalMs: requireNumber(input, 'captureIntervalMs', { min: 100, max: 5000, integer: true }),
    processingWidth: requireNumber(input, 'processingWidth', { min: 64, max: 1920, integer: true }),
    processingHeight: requireNumber(input, 'processingHeight', { min: 64, max: 1080, integer: true }),
    motionThreshold: requireNumber(input, 'motionThreshold', { min: 1, max: 255, integer: true }),
    minimumChangedArea: requireNumber(input, 'minimumChangedArea', { min: 0.001, max: 1 }),
    requiredMotionFrames: requireNumber(input, 'requiredMotionFrames', { min: 1, max: 20, integer: true }),
    wakeCooldownMs: requireNumber(input, 'wakeCooldownMs', { min: 0, max: 3_600_000, integer: true }),
    cameraReconnectMs: requireNumber(input, 'cameraReconnectMs', { min: 1000, max: 300_000, integer: true }),
    blurRadius: requireNumber(input, 'blurRadius', { min: 0, max: 2, integer: true }),
    ambientCompensation: requireBoolean(input, 'ambientCompensation'),
    roi: parseRoi(input.roi),
    debug: requireBoolean(input, 'debug'),
  };
}

export async function loadConfig(configPath: string = defaultConfigPath): Promise<ScreenWakerConfig> {
  let raw: string;

  try {
    raw = await readFile(configPath, 'utf8');
  } catch (error: unknown) {
    const detail: string = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot read config at ${configPath}: ${detail}`, { cause: error });
  }

  try {
    return validateConfig(JSON.parse(raw));
  } catch (error: unknown) {
    const detail: string = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid config at ${configPath}: ${detail}`, { cause: error });
  }
}
