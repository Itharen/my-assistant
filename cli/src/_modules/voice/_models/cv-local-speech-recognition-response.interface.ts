import { CV_AudioClassificationResponse } from './cv-audio-classification-response.interface.js';

/**
 * Local Speech Recognition Response Interface
 */
export interface CV_LocalSpeechRecognitionResponse {
  /** Response status */
  status: 'processed' | 'failed' | 'classified_non_speech';
  
  /** Error message if status is failed */
  error?: string;
  
  /** Transcribed text */
  text?: string;
  
  /** Transcription confidence (0.0 - 1.0) */
  confidence?: number;
  
  /** Additional message */
  message?: string;
  
  /** Transcription skipped flag */
  transcription_skipped?: boolean;
  
  /** Classification result from the same API call */
  classification_result?: CV_AudioClassificationResponse;
  
  /** Audio category from classification */
  audio_category?: string;
  
  /** Classification confidence */
  classification_confidence?: number;
  
  /** Result object containing text (alternative structure) */
  result?: {
    text: string;
    language?: string;
    detected_language?: string;
    segments?: Array<any>;
  };
} 