import { EL_TextToSpeechModels } from '../_enums/el-text-to-speech-models.enum.js';

/**
 * EL Text-to-Speech Response Interface
 * @author AI
 * @description Response from ElevenLabs text-to-speech conversion
 */
export interface EL_TextToSpeechResponse {
  /**
   * Success status
   */
  success: boolean;
  
  /**
   * Audio data as buffer
   */
  audioBuffer?: Buffer;
  
  /**
   * Audio duration in seconds
   */
  duration?: number;
  
  /**
   * Processing time in milliseconds
   */
  processingTime?: number;
  
  /**
   * Model used for conversion
   */
  model: EL_TextToSpeechModels;
  
  /**
   * Voice ID used
   */
  voiceId: string;
  
  /**
   * Character count processed
   */
  characterCount?: number;
  
  /**
   * Error message if failed
   */
  error?: string;
  
  /**
   * Raw response from the API
   */
  rawResponse?: any;
} 