import { CVO_AudioFormat } from '../_enums/cvo-audio-format.enum.js';

/**
 * CVO Audio Playback Request Interface
 * @author AI
 * @description Request parameters for audio playback
 */
export interface CVO_AudioPlaybackRequest {
  /**
   * Audio data as buffer
   */
  audioBuffer?: Buffer;
  
  /**
   * Audio file path
   */
  audioFilePath?: string;
  
  /**
   * Audio format
   */
  format: CVO_AudioFormat;
  
  /**
   * Volume level (0.0 to 1.0)
   * @default 1.0
   */
  volume?: number;
  
  /**
   * Playback speed (0.25 to 4.0)
   * @default 1.0
   */
  speed?: number;
  
  /**
   * Whether to loop the audio
   * @default false
   */
  loop?: boolean;
  
  /**
   * Priority level (higher = more important)
   * @default 0
   */
  priority?: number;
  
  /**
   * User ID for the playback
   */
  userId?: string;
  
  /**
   * Channel ID for the playback
   */
  channelId?: string;
} 