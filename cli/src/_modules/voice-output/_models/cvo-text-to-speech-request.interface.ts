import { CVO_TextToSpeechService } from '../_enums/cvo-text-to-speech-service.enum.js';
import { CVO_VoiceModel } from '../_enums/cvo-voice-model.enum.js';
import { CVO_AudioFormat } from '../_enums/cvo-audio-format.enum.js';
import { CVO_VoiceSettings } from './cvo-voice-settings.interface.js';

/**
 * CVO Text-to-Speech Request Interface
 * @author AI
 * @description Request parameters for text-to-speech conversion
 */
export interface CVO_TextToSpeechRequest {
  /**
   * Text to convert to speech
   */
  text: string;
  
  /**
   * Text-to-speech service to use
   * @default CVO_TextToSpeechService.openai
   */
  service?: CVO_TextToSpeechService;
  
  /**
   * Voice model to use
   * @default CVO_VoiceModel.default
   */
  model?: CVO_VoiceModel;
  
  /**
   * Output audio format
   * @default CVO_AudioFormat.mp3
   */
  format?: CVO_AudioFormat;
  
  /**
   * Voice settings (speed, pitch, etc.)
   */
  voiceSettings?: CVO_VoiceSettings;
  
  /**
   * Language code (ISO 639-1)
   * @default 'en'
   */
  language?: string;
  
  /**
   * Voice ID (for ElevenLabs)
   */
  voiceId?: string;
  
  /**
   * Maximum text length for processing
   * @default 4096
   */
  maxTextLength?: number;
  
  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;
  
  /**
   * Maximum retry attempts
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
} 