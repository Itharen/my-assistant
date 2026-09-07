import { EL_SpeechToTextModels } from '../_enums/el-speech-to-text-models.enum.js';
import { EL_Languages } from '../_enums/el-languages.enum.js';
import { EL_OutputFormats } from '../_enums/el-output-formats.enum.js';

/**
 * ElevenLabs Speech-to-Text Request Interface
 * @author AI
 * @description Request parameters for ElevenLabs speech-to-text API
 */
export interface EL_SpeechToTextRequest {
  /**
   * Audio file buffer or file path
   */
  audio: Buffer | string;
  
  /**
   * Speech-to-text model to use
   * @default EL_SpeechToTextModels.multilingualV2
   */
  model?: EL_SpeechToTextModels;
  
  /**
   * Language of the audio (ISO 639-1 code)
   * @default EL_Languages.english
   */
  language?: EL_Languages;
  
  /**
   * Output format for the transcription
   * @default EL_OutputFormats.text
   */
  outputFormat?: EL_OutputFormats;
  
  /**
   * Include timestamps in the output
   * @default false
   */
  includeTimestamps?: boolean;
  
  /**
   * Custom prompt to guide transcription
   * @default undefined
   */
  prompt?: string;
  
  /**
   * Temperature for generation (0.0 to 1.0)
   * @default 0.0
   */
  temperature?: number;
  
  /**
   * Enable speaker diarization (identify different speakers)
   * @default false
   */
  diarize?: boolean;
  
  /**
   * Expected number of speakers (used when diarize is true)
   * @default undefined (auto-detect)
   */
  numSpeakers?: number;
  
  /**
   * Tag audio events (laughter, applause, background noise, etc.)
   * @default false
   */
  tagAudioEvents?: boolean;
  
  /**
   * Key terms to prioritize during transcription (Scribe v2 feature)
   * Helps improve accuracy for specific terms, names, or technical vocabulary
   * @default undefined
   */
  keyterms?: string[];
  
  /**
   * Enable entity detection (names, locations, dates, etc.) (Scribe v2 feature)
   * @default false
   */
  entityDetection?: boolean;
  
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Timeout for API requests in milliseconds
   * @default 30000
   */
  timeout?: number;
} 