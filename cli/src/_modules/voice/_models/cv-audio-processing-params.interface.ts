/**
 * Audio Processing Parameters Interface
 */
export interface CV_AudioProcessingParams {
  volume: number;
  frequency: number;
  zeroCrossings: number;
  variance: number;
  peakCount: number;
  energyVariance: number;
} 