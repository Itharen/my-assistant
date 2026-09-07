/**
 * Audio Analysis Result Interface
 */
export interface CV_AudioAnalysisResult {
  isSpeech: boolean;
  isWhiteNoise: boolean;
  isSilence: boolean;
  quality: number;
  confidence: number;
  volume: number;
  frequency: number;
  zeroCrossings: number;
  zcrNormalized: number;  // Normalizált ZCR (0-1)
  variance: number;
  peakCount: number;
  energyVariance: number;
  voiceActivityScore: number;
} 