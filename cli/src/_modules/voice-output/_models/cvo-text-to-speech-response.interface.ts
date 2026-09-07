import { CVO_TextToSpeechService } from '../_enums/cvo-text-to-speech-service.enum.js';
import { CVO_AudioFormat } from '../_enums/cvo-audio-format.enum.js';

/**
 * CVO Text-to-Speech Response Interface
 * @author AI
 * @description Response from text-to-speech conversion
 */
export interface CVO_TextToSpeechResponse {
  /**
   * Success status
   */
  success: boolean;
  
  /**
   * Audio data as buffer
   */
  audioBuffer?: Buffer;
  
  /**
   * Audio file path (if saved)
   */
  audioFilePath?: string;
  
  /**
   * Audio format
   */
  format: CVO_AudioFormat;
  
  /**
   * Audio duration in seconds
   */
  duration?: number;
  
  /**
   * Processing time in milliseconds
   */
  processingTime?: number;
  
  /**
   * Service used for conversion
   */
  service: CVO_TextToSpeechService;
  
  /**
   * Error message if failed
   */
  error?: string;
  
  /**
   * Raw response from the service
   */
  rawResponse?: any;
  
  /**
   * Character count processed
   */
  characterCount?: number;
  
  /**
   * Language detected
   */
  language?: string;
} 