import { EL_SpeechToTextModels } from '../../_enums/el-speech-to-text-models.enum.js';
import { EL_TextToSpeechModels } from '../../_enums/el-text-to-speech-models.enum.js';
import { EL_Languages } from '../../_enums/el-languages.enum.js';
import { EL_OutputFormats } from '../../_enums/el-output-formats.enum.js';

/**
 * ElevenLabs API Configuration Constants
 * @author AI
 * @description Default configuration values for ElevenLabs API
 */
export const EL_apiConfig = {
  /**
   * Base URL for ElevenLabs API
   */
  baseUrl: 'https://api.elevenlabs.io',
  
  /**
   * Default timeout for API requests in milliseconds
   */
  defaultTimeout: 30000,
  
  /**
   * Maximum number of retry attempts
   */
  maxRetries: 3,
  
  /**
   * Retry delay between attempts in milliseconds
   */
  retryDelay: 1000,
  
  /**
   * Default speech-to-text model
   */
  defaultModel: EL_SpeechToTextModels.scribe,
  
  /**
   * Default text-to-speech model
   */
  defaultTextToSpeechModel: EL_TextToSpeechModels.elevenV3,
  
  /**
   * Default language
   */
  defaultLanguage: EL_Languages.english,
  
  /**
   * Default output format
   */
  defaultOutputFormat: EL_OutputFormats.text,
  
  /**
   * Default temperature for generation
   */
  defaultTemperature: 0.0,
  
  /**
   * Maximum file size for audio uploads (25MB)
   */
  maxFileSize: 25 * 1024 * 1024,
  
  /**
   * Minimum file size for audio uploads (1KB)
   */
  minFileSize: 1024,
  
  /**
   * Supported audio formats
   */
  supportedFormats: ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'webm'],
  
  /**
   * User agent string
   */
  userAgent: 'ElevenLabs-NodeJS-Client/1.0.0'
}; 