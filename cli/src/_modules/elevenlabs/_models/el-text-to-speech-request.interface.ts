import { EL_TextToSpeechModels } from '../_enums/el-text-to-speech-models.enum.js';
import { EL_Languages } from '../_enums/el-languages.enum.js';

/**
 * EL Text-to-Speech Request Interface
 * @author AI
 * @description Request parameters for ElevenLabs text-to-speech conversion
 */
export interface EL_TextToSpeechRequest {
  /**
   * Text to convert to speech
   */
  text: string;
  
  /**
   * Voice ID to use
   */
  voiceId: string;
  
  /**
   * Text-to-speech model to use
   * @default EL_TextToSpeechModels.multilingualV2
   */
  model?: EL_TextToSpeechModels;
  
  /**
   * Language of the text (ISO 639-1 code)
   * @default EL_Languages.english
   */
  language?: EL_Languages;
  
  /**
   * Voice settings for customization
   */
  voiceSettings?: {
    /**
     * Stability (0.0 to 1.0)
     * @default 0.5
     */
    stability?: number;
    
    /**
     * Similarity boost (0.0 to 1.0)
     * @default 0.75
     */
    similarityBoost?: number;
    
    /**
     * Style (0.0 to 1.0)
     * @default 0.0
     */
    style?: number;
    
    /**
     * Use speaker boost
     * @default false
     */
    useSpeakerBoost?: boolean;
  };
  
  /**
   * Output format
   * @default 'mp3'
   */
  outputFormat?: string;
  
  /**
   * Maximum text length for processing
   * @default 5000
   */
  maxTextLength?: number;
  
  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;
  
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;
} 