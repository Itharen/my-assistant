/**
 * Speech Detection Parameters Interface
 */
export interface CV_SpeechDetectionParams {
  volume: number;
  frequency: number;
  zeroCrossings: number;
  variance: number;
  peakCount: number;
  voiceActivityScore: number;
  isWhiteNoise: boolean;
  isSilence: boolean;
} 