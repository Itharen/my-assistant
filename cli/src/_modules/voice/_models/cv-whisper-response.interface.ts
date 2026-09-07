/**
 * Whisper Response Interface
 */
export interface CV_WhisperResponse {
  text: string;
  duration: number;
  segments?: Array<any>;
  language?: string;
  detected_language?: string;
} 