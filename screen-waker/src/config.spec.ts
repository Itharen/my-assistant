import { describe, expect, it } from 'vitest';

import { validateConfig } from './config.js';
import type { ScreenWakerConfig } from './types.js';

const validConfig: ScreenWakerConfig = {
  cameraIndex: 0,
  captureIntervalMs: 250,
  processingWidth: 320,
  processingHeight: 180,
  motionThreshold: 25,
  minimumChangedArea: 0.08,
  requiredMotionFrames: 2,
  wakeCooldownMs: 30_000,
  cameraReconnectMs: 5000,
  blurRadius: 2,
  ambientCompensation: true,
  roi: null,
  debug: false,
};

describe('validateConfig', (): void => {
  it('accepts the production defaults', (): void => {
    expect(validateConfig(validConfig)).toEqual(validConfig);
  });

  it('rejects an ROI that extends beyond the frame', (): void => {
    expect((): ScreenWakerConfig => validateConfig({
      ...validConfig,
      roi: { x: 0.8, y: 0, width: 0.3, height: 1 },
    })).toThrow(/roi must stay inside/);
  });

  it('rejects invalid sampling and confirmation values', (): void => {
    expect((): ScreenWakerConfig => validateConfig({ ...validConfig, captureIntervalMs: 20 })).toThrow(
      /captureIntervalMs/,
    );
    expect((): ScreenWakerConfig => validateConfig({ ...validConfig, requiredMotionFrames: 0 })).toThrow(
      /requiredMotionFrames/,
    );
  });
});
