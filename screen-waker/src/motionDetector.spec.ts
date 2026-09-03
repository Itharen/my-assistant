import { describe, expect, it } from 'vitest';

import { gaussianBlur, MotionDetector } from './motionDetector.js';
import type { Frame, ScreenWakerConfig } from './types.js';

function config(overrides: Partial<ScreenWakerConfig> = {}): ScreenWakerConfig {
  return {
    cameraIndex: 0,
    captureIntervalMs: 250,
    processingWidth: 10,
    processingHeight: 10,
    motionThreshold: 20,
    minimumChangedArea: 0.1,
    requiredMotionFrames: 2,
    wakeCooldownMs: 30_000,
    cameraReconnectMs: 5000,
    blurRadius: 0,
    ambientCompensation: true,
    roi: null,
    debug: false,
    ...overrides,
  };
}

function frame(value: number = 0): Frame {
  return { data: new Uint8Array(100).fill(value), width: 10, height: 10, capturedAt: Date.now() };
}

function paint(input: Frame, left: number, right: number, value: number = 255): Frame {
  for (let y: number = 0; y < input.height; y += 1) {
    for (let x: number = left; x < right; x += 1) input.data[y * input.width + x] = value;
  }
  return input;
}

describe('MotionDetector', (): void => {
  it('requires consecutive motion frames before confirmation', (): void => {
    const detector: MotionDetector = new MotionDetector(config());

    expect(detector.detect(frame()).isWarmup).toBe(true);
    expect(detector.detect(paint(frame(), 0, 3)).detected).toBe(false);
    const confirmed = detector.detect(paint(frame(), 7, 10));

    expect(confirmed.detected).toBe(true);
    expect(confirmed.motionFrames).toBe(2);
    expect(confirmed.score).toBeGreaterThanOrEqual(0.5);
  });

  it('resets the confirmation streak after a quiet frame', (): void => {
    const detector: MotionDetector = new MotionDetector(config());
    detector.detect(frame());
    expect(detector.detect(paint(frame(), 0, 3)).motionFrames).toBe(1);
    expect(detector.detect(paint(frame(), 0, 3)).motionFrames).toBe(0);
  });

  it('compensates for a uniform full-frame brightness change', (): void => {
    const detector: MotionDetector = new MotionDetector(config({ requiredMotionFrames: 1 }));
    detector.detect(frame(50));
    const result = detector.detect(frame(100));

    expect(result.detected).toBe(false);
    expect(result.score).toBe(0);
    expect(result.ambientDelta).toBe(50);
  });

  it('ignores motion outside the configured ROI', (): void => {
    const detector: MotionDetector = new MotionDetector(config({
      requiredMotionFrames: 1,
      roi: { x: 0.5, y: 0, width: 0.5, height: 1 },
    }));
    detector.detect(frame());
    const result = detector.detect(paint(frame(), 0, 5));

    expect(result.detected).toBe(false);
    expect(result.evaluatedPixels).toBe(50);
    expect(result.score).toBe(0);
  });

  it('rejects frames with unexpected dimensions', (): void => {
    const detector: MotionDetector = new MotionDetector(config());
    expect(() => detector.detect({ data: new Uint8Array(99), width: 10, height: 10, capturedAt: 0 })).toThrow(
      /Unexpected frame dimensions/,
    );
  });
});

describe('gaussianBlur', (): void => {
  it('preserves a constant image', (): void => {
    expect(gaussianBlur(new Uint8Array(25).fill(42), 5, 5, 2)).toEqual(new Uint8Array(25).fill(42));
  });
});
