/**
 * CVO File Tracking Interface
 * @author AI
 * @description Interface for tracking file usage and managing on-demand cleanup
 */
export interface CVO_FileTracking {
  /**
   * Unique file ID
   */
  fileId: string;
  
  /**
   * File path
   */
  filePath: string;
  
  /**
   * File format
   */
  format: string;
  
  /**
   * File size in bytes
   */
  size: number;
  
  /**
   * Creation timestamp
   */
  createdAt: number;
  
  /**
   * Last access timestamp
   */
  lastAccessed: number;
  
  /**
   * Number of times the file has been accessed
   */
  accessCount: number;
  
  /**
   * Whether the file is currently in use
   */
  isInUse: boolean;
  
  /**
   * Whether the file should be cleaned up after use
   */
  cleanupAfterUse: boolean;
  
  /**
   * Associated playback ID (if any)
   */
  playbackId?: string;
  
  /**
   * Associated user ID (if any)
   */
  userId?: string;
  
  /**
   * Associated channel ID (if any)
   */
  channelId?: string;
  
  /**
   * Error message if cleanup failed
   */
  cleanupError?: string;
} 