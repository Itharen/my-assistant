import type { Frame, MotionResult, RegionOfInterest, ScreenWakerConfig } from './types.js';

interface PixelBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function gaussianKernel(radius: number): number[] {
  if (!radius) return [1];
  if (radius === 1) return [1, 2, 1];
  return [1, 4, 6, 4, 1];
}

export function gaussianBlur(source: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  if (!radius) return new Uint8Array(source);

  const kernel: number[] = gaussianKernel(radius);
  const divisor: number = kernel.reduce((sum: number, value: number): number => sum + value, 0);
  const horizontal: Float32Array = new Float32Array(source.length);
  const result: Uint8Array = new Uint8Array(source.length);

  for (let y: number = 0; y < height; y += 1) {
    for (let x: number = 0; x < width; x += 1) {
      let sum: number = 0;
      for (let offset: number = -radius; offset <= radius; offset += 1) {
        const sourceX: number = Math.max(0, Math.min(width - 1, x + offset));
        sum += (source[y * width + sourceX] ?? 0) * (kernel[offset + radius] ?? 0);
      }
      horizontal[y * width + x] = sum / divisor;
    }
  }

  for (let y: number = 0; y < height; y += 1) {
    for (let x: number = 0; x < width; x += 1) {
      let sum: number = 0;
      for (let offset: number = -radius; offset <= radius; offset += 1) {
        const sourceY: number = Math.max(0, Math.min(height - 1, y + offset));
        sum += (horizontal[sourceY * width + x] ?? 0) * (kernel[offset + radius] ?? 0);
      }
      result[y * width + x] = Math.round(sum / divisor);
    }
  }

  return result;
}

function toBounds(roi: RegionOfInterest | null, width: number, height: number): PixelBounds {
  if (!roi) return { left: 0, top: 0, right: width, bottom: height };

  const left: number = Math.floor(roi.x * width);
  const top: number = Math.floor(roi.y * height);

  return {
    left,
    top,
    right: Math.max(left + 1, Math.ceil((roi.x + roi.width) * width)),
    bottom: Math.max(top + 1, Math.ceil((roi.y + roi.height) * height)),
  };
}

export class MotionDetector {
  private previousFrame: Uint8Array | null = null;
  private motionFrames: number = 0;

  public constructor(private readonly config: ScreenWakerConfig) {}

  public detect(frame: Frame): MotionResult {
    const expectedSize: number = this.config.processingWidth * this.config.processingHeight;
    if (
      frame.width !== this.config.processingWidth
      || frame.height !== this.config.processingHeight
      || frame.data.length !== expectedSize
    ) {
      throw new Error(
        `Unexpected frame dimensions ${frame.width}x${frame.height} (${frame.data.length} bytes); expected `
          + `${this.config.processingWidth}x${this.config.processingHeight} (${expectedSize} bytes)`,
      );
    }

    const currentFrame: Uint8Array = gaussianBlur(
      frame.data,
      frame.width,
      frame.height,
      this.config.blurRadius,
    );
    if (!this.previousFrame) {
      this.previousFrame = currentFrame;
      return this.result(false, 0, 0, 0, 0, true);
    }

    const bounds: PixelBounds = toBounds(this.config.roi, frame.width, frame.height);
    const evaluatedPixels: number = (bounds.right - bounds.left) * (bounds.bottom - bounds.top);
    let signedDifferenceSum: number = 0;

    if (this.config.ambientCompensation) {
      for (let y: number = bounds.top; y < bounds.bottom; y += 1) {
        for (let x: number = bounds.left; x < bounds.right; x += 1) {
          const index: number = y * frame.width + x;
          signedDifferenceSum += (currentFrame[index] ?? 0) - (this.previousFrame[index] ?? 0);
        }
      }
    }

    const ambientDelta: number = signedDifferenceSum / evaluatedPixels;
    let changedPixels: number = 0;
    for (let y: number = bounds.top; y < bounds.bottom; y += 1) {
      for (let x: number = bounds.left; x < bounds.right; x += 1) {
        const index: number = y * frame.width + x;
        const difference: number = (currentFrame[index] ?? 0) - (this.previousFrame[index] ?? 0) - ambientDelta;
        if (Math.abs(difference) >= this.config.motionThreshold) changedPixels += 1;
      }
    }

    this.previousFrame = currentFrame;
    const score: number = changedPixels / evaluatedPixels;
    this.motionFrames = score >= this.config.minimumChangedArea ? this.motionFrames + 1 : 0;
    const detected: boolean = this.motionFrames >= this.config.requiredMotionFrames;

    return this.result(detected, score, changedPixels, evaluatedPixels, ambientDelta, false);
  }

  public reset(): void {
    this.previousFrame = null;
    this.motionFrames = 0;
  }

  public resetConfirmation(): void {
    this.motionFrames = 0;
  }

  private result(
    detected: boolean,
    score: number,
    changedPixels: number,
    evaluatedPixels: number,
    ambientDelta: number,
    isWarmup: boolean,
  ): MotionResult {
    return {
      detected,
      score,
      changedPixels,
      evaluatedPixels,
      motionFrames: this.motionFrames,
      requiredMotionFrames: this.config.requiredMotionFrames,
      ambientDelta,
      isWarmup,
    };
  }
}
