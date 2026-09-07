import { CVO_TextToSpeechService } from '../../_enums/cvo-text-to-speech-service.enum.js';
import { CVO_VoiceModel } from '../../_enums/cvo-voice-model.enum.js';
import { CVO_AudioFormat } from '../../_enums/cvo-audio-format.enum.js';
import { second } from '@futdevpro/fsm-dynamo';
import { settings } from '../../../../_collections/consts/settings.const.js';

/**
 * CVO Configuration Constants
 * @author AI
 * @description Default configuration values for voice output module
 */
export const CVO_config = {
  /**
   * Default text-to-speech service
   */
  defaultService: CVO_TextToSpeechService.openai,
  
  /**
   * Default voice model
   */
  defaultModel: CVO_VoiceModel.tts1,
  
  /**
   * Default audio format
   */
  defaultFormat: CVO_AudioFormat.mp3,
  
  /**
   * Default language
   */
  defaultLanguage: 'en',
  
  /**
   * Default request timeout in milliseconds
   */
  defaultTimeout: 30 * second,
  
  /**
   * Default maximum retry attempts
   */
  defaultMaxRetries: 3,
  
  /**
   * Default maximum text length
   */
  defaultMaxTextLength: 4096,
  
  /**
   * Default voice settings
   */
  defaultVoiceSettings: {
    speed: 1.0,
    pitch: 0.0,
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    useSpeakerBoost: false
  },
  
  /**
   * Audio output directory (from settings)
   */
  audioOutputDir: settings.voice.output.audioOutputDir,
  
  /**
   * Maximum queue size
   */
  maxQueueSize: 100,
  
  /**
   * Default playback volume (0.0 to 1.0) (from settings)
   */
  defaultVolume: settings.voice.output.defaultVolume,
  
  /**
   * Default playback speed (0.25 to 4.0) (from settings)
   */
  defaultSpeed: settings.voice.output.defaultSpeed,
  
  /**
   * File cleanup interval in milliseconds
   */
  fileCleanupInterval: 5 * 60 * second, // 5 minutes
  
  /**
   * Maximum file age for cleanup in milliseconds (from settings)
   */
  maxFileAge: settings.voice.output.maxFileAge,
}; 