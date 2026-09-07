/**
 * ElevenLabs Speech-to-Text Response Interface
 * @author AI
 * @description Response structure for ElevenLabs speech-to-text API
 */
export interface EL_SpeechToTextResponse {
  /**
   * Transcribed text
   */
  text: string;
  
  /**
   * Language detected in the audio
   */
  detectedLanguage?: string;
  
  /**
   * Confidence score (0.0 to 1.0)
   */
  confidence?: number;
  
  /**
   * Processing time in milliseconds
   */
  processingTime?: number;
  
  /**
   * Audio duration in seconds
   */
  duration?: number;
  
  /**
   * Timestamps for each word/sentence (if requested)
   */
  timestamps?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  
  /**
   * Raw API response
   */
  rawResponse?: any;
  
  /**
   * Error message if transcription failed
   */
  error?: string;
}