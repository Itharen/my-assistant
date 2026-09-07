export enum CV_AudioClassificationStatus {
  classified = 'classified',
  classifiedAudioset = 'classified_audioset',
  classifiedFallback = 'classified_fallback',
  failed = 'failed',

  // local
  apiUnavailable = 'api-unavailable',
}
/**
 * CCAP Audio Classification Response Interface
 * @author AI
 * @description Interface for audio classification API response
 */
export interface CV_AudioClassificationResponse {
  /** Response status */
  status: CV_AudioClassificationStatus;
  
  /** Error message if status is failed */
  error?: string;
  
  /** Audio category (speech, music, noise, etc.) */
  category: string;
  
  /** Classification confidence (0.0 - 1.0) */
  confidence: number;
  
  /** Whether the audio contains speech */
  is_speech: boolean;
  
  /** Audio duration in seconds */
  duration_sec?: number;
  
  /** Additional message */
  message?: string;
  
  /** Transcription skipped flag */
  transcription_skipped?: boolean;
  
  /** Top N AudioSet classification results */
  topN_audioset?: Array<{
    label: string;
    score: number;
  }>;
  
  /** AudioSet evaluation details */
  audioset_evaluation?: {
    isSpeech: boolean;
    reason: string;
    topMatch?: { label: string; score: number };
    acceptedMatches: Array<{ label: string; score: number }>;
  };
} 