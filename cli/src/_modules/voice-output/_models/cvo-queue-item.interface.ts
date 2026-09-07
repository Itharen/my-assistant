import { CVO_AudioPlaybackRequest } from './cvo-audio-playback-request.interface.js';
import { CVO_PlaybackState } from '../_enums/cvo-playback-state.enum.js';

/**
 * CVO Queue Item Interface
 * @author AI
 * @description Queue item for audio playback management
 */
export interface CVO_QueueItem {
  /**
   * Unique queue item ID
   */
  id: string;
  
  /**
   * Playback request
   */
  request: CVO_AudioPlaybackRequest;
  
  /**
   * Current state
   */
  state: CVO_PlaybackState;
  
  /**
   * Priority level (higher = more important)
   */
  priority: number;
  
  /**
   * Creation timestamp
   */
  createdAt: number;
  
  /**
   * Start timestamp
   */
  startedAt?: number;
  
  /**
   * End timestamp
   */
  endedAt?: number;
  
  /**
   * Error message if failed
   */
  error?: string;
  
  /**
   * User ID who requested the playback
   */
  userId?: string;
  
  /**
   * Channel ID for the playback
   */
  channelId?: string;
} 