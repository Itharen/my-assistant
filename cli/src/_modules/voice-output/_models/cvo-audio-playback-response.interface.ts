import { CVO_PlaybackState } from '../_enums/cvo-playback-state.enum.js';

/**
 * CVO Audio Playback Response Interface
 * @author AI
 * @description Response from audio playback operations
 */
export interface CVO_AudioPlaybackResponse {
  /**
   * Success status
   */
  success: boolean;
  
  /**
   * Current playback state
   */
  state: CVO_PlaybackState;
  
  /**
   * Playback ID for tracking
   */
  playbackId?: string;
  
  /**
   * Error message if failed
   */
  error?: string;
  
  /**
   * Playback duration in seconds
   */
  duration?: number;
  
  /**
   * Current position in seconds
   */
  position?: number;
  
  /**
   * Volume level (0.0 to 1.0)
   */
  volume?: number;
  
  /**
   * Playback speed
   */
  speed?: number;
} 