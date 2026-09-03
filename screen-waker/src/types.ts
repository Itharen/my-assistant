export interface RegionOfInterest {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScreenWakerConfig {
  cameraIndex: number;
  captureIntervalMs: number;
  processingWidth: number;
  processingHeight: number;
  motionThreshold: number;
  minimumChangedArea: number;
  requiredMotionFrames: number;
  wakeCooldownMs: number;
  cameraReconnectMs: number;
  blurRadius: number;
  ambientCompensation: boolean;
  roi: RegionOfInterest | null;
  debug: boolean;
}

export interface Frame {
  data: Uint8Array;
  width: number;
  height: number;
  capturedAt: number;
}

export interface MotionResult {
  detected: boolean;
  score: number;
  changedPixels: number;
  evaluatedPixels: number;
  motionFrames: number;
  requiredMotionFrames: number;
  ambientDelta: number;
  isWarmup: boolean;
}
