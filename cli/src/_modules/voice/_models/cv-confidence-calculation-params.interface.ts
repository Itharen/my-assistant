/**
 * Confidence Calculation Parameters Interface
 */
export interface CV_ConfidenceCalculationParams {
  isSpeech: boolean;
  isWhiteNoise: boolean;
  isSilence: boolean;
  quality: number;
  voiceActivityScore: number;
} 