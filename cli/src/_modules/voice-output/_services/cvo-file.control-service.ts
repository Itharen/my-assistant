import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { CVO_config } from '../_collections/consts/cvo-config.const.js';
import { CVO_AudioFormat } from '../_enums/cvo-audio-format.enum.js';
import { CVO_FileTracking } from '../_models/cvo-file-tracking.interface.js';

/**
 * CVO File Control Service
 * @author AI
 * @description File management for voice output audio files
 */
export class CVO_File_ControlService extends DyNTS_SingletonService {
  static getInstance(): CVO_File_ControlService {
    return CVO_File_ControlService.getSingletonInstance();
  }

  private readonly audioOutputDir: string = path.join(process.cwd(), CVO_config.audioOutputDir);
  private fileTracking: Map<string, CVO_FileTracking> = new Map();
  private isInitialized = false;

  /**
   * Initialize audio output directory and file tracking
   */
  async initializeAudioOutputDirectory(): Promise<void> {
    try {
      if (!existsSync(this.audioOutputDir)) {
        mkdirSync(this.audioOutputDir, { recursive: true });
        DyFM_Log.info(`📁 Created audio output directory: ${this.audioOutputDir}`);
      } else {
        DyFM_Log.info(`📁 Audio output directory already exists: ${this.audioOutputDir}`);
      }

      this.isInitialized = true;
      DyFM_Log.success('✅ CVO File Control Service initialized successfully');
    } catch (error) {
      DyFM_Log.error('❌ Error initializing audio output directory:', error);
      throw error;
    }
  }

  /**
   * Save audio buffer to file with tracking
   * @param audioBuffer - Audio data buffer
   * @param format - Audio format
   * @param options - Additional options for file tracking
   * @returns File path of saved audio
   */
  async saveAudioBuffer(
    audioBuffer: Buffer, 
    format: CVO_AudioFormat,
    options?: {
      cleanupAfterUse?: boolean;
      playbackId?: string;
      userId?: string;
      channelId?: string;
    }
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `audio-${timestamp}.${format}`;
      const filePath = path.join(this.audioOutputDir, filename);

      await fs.writeFile(filePath, audioBuffer);
      DyFM_Log.info(`💾 Saved audio file: ${filePath} (${audioBuffer.length} bytes)`);

      // Track the file for on-demand cleanup
      this.trackFile(filePath, {
        format,
        size: audioBuffer.length,
        cleanupAfterUse: options?.cleanupAfterUse ?? true,
        playbackId: options?.playbackId,
        userId: options?.userId,
        channelId: options?.channelId
      });

      return filePath;
    } catch (error) {
      DyFM_Log.error('❌ Error saving audio buffer:', error);
      throw error;
    }
  }

  /**
   * Track a file for on-demand cleanup
   * @param filePath - Path to the file
   * @param options - File tracking options
   */
  private trackFile(filePath: string, options: {
    format: string;
    size: number;
    cleanupAfterUse: boolean;
    playbackId?: string;
    userId?: string;
    channelId?: string;
  }): void {
    const fileId = this.generateFileId(filePath);
    const now = Date.now();

    const fileTracking: CVO_FileTracking = {
      fileId,
      filePath,
      format: options.format,
      size: options.size,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
      isInUse: true,
      cleanupAfterUse: options.cleanupAfterUse,
      playbackId: options.playbackId,
      userId: options.userId,
      channelId: options.channelId
    };

    this.fileTracking.set(fileId, fileTracking);
    DyFM_Log.info(`📊 Tracking file for cleanup: ${filePath} (ID: ${fileId})`);
  }

  /**
   * Read audio file to buffer
   * @param filePath - Path to audio file
   * @returns Audio buffer
   */
  async readAudioFile(filePath: string): Promise<Buffer> {
    try {
      const buffer = await fs.readFile(filePath);
      DyFM_Log.info(`📖 Read audio file: ${filePath} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      DyFM_Log.error('❌ Error reading audio file:', error);
      throw error;
    }
  }

  /**
   * Delete audio file
   * @param filePath - Path to audio file
   */
  async deleteAudioFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      DyFM_Log.info(`🗑️  Deleted audio file: ${filePath}`);
    } catch (error) {
      DyFM_Log.error('❌ Error deleting audio file:', error);
      throw error;
    }
  }

  /**
   * Get audio file info
   * @param filePath - Path to audio file
   * @returns File info
   */
  async getAudioFileInfo(filePath: string): Promise<any> {
    try {
      const stats = await fs.stat(filePath);
      return {
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        exists: true
      };
    } catch (error) {
      DyFM_Log.error('❌ Error getting audio file info:', error);
      return { exists: false };
    }
  }

  /**
   * List all audio files in output directory
   * @returns List of audio files
   */
  async listAudioFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.audioOutputDir);
      const audioFiles = files.filter(file => 
        Object.values(CVO_AudioFormat).some(format => file.endsWith(`.${format}`))
      );
      
      DyFM_Log.info(`📋 Found ${audioFiles.length} audio files in output directory`);
      return audioFiles.map(file => path.join(this.audioOutputDir, file));
    } catch (error) {
      DyFM_Log.error('❌ Error listing audio files:', error);
      return [];
    }
  }

  /**
   * Clean up old audio files
   * @param maxAge - Maximum file age in milliseconds
   */
  async cleanupAudioFiles(maxAge?: number): Promise<void> {
    try {
      const maxFileAge = maxAge || CVO_config.maxFileAge;
      const files = await this.listAudioFiles();
      const now = Date.now();
      let deletedCount = 0;

      for (const filePath of files) {
        const fileInfo = await this.getAudioFileInfo(filePath);
        if (fileInfo.exists && (now - fileInfo.modified.getTime()) > maxFileAge) {
          await this.deleteAudioFile(filePath);
          deletedCount++;
        }
      }

      DyFM_Log.info(`🧹 Cleaned up ${deletedCount} old audio files`);
    } catch (error) {
      DyFM_Log.error('❌ Error cleaning up audio files:', error);
    }
  }

  /**
   * Get output directory path
   * @returns Output directory path
   */
  getOutputDirectory(): string {
    return this.audioOutputDir;
  }

  /**
   * Generate unique file ID
   * @param filePath - File path
   * @returns Unique file ID
   */
  private generateFileId(filePath: string): string {
    const filename = path.basename(filePath);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${filename}_${timestamp}_${random}`;
  }

  /**
   * Mark file as accessed
   * @param filePath - File path
   */
  markFileAccessed(filePath: string): void {
    const fileId = this.findFileIdByPath(filePath);
    if (fileId) {
      const tracking = this.fileTracking.get(fileId);
      if (tracking) {
        tracking.lastAccessed = Date.now();
        tracking.accessCount++;
        DyFM_Log.info(`📊 File accessed: ${filePath} (Count: ${tracking.accessCount})`);
      }
    }
  }

  /**
   * Mark file as no longer in use
   * @param filePath - File path
   */
  markFileNotInUse(filePath: string): void {
    const fileId = this.findFileIdByPath(filePath);
    if (fileId) {
      const tracking = this.fileTracking.get(fileId);
      if (tracking) {
        tracking.isInUse = false;
        DyFM_Log.info(`📊 File marked as not in use: ${filePath}`);
        
        // Trigger cleanup if configured
        if (tracking.cleanupAfterUse) {
          this.cleanupFileOnDemand(fileId);
        }
      }
    }
  }

  /**
   * Clean up file on demand
   * @param fileId - File ID to clean up
   */
  private async cleanupFileOnDemand(fileId: string): Promise<void> {
    const tracking = this.fileTracking.get(fileId);
    if (!tracking) {
      return;
    }

    try {
      DyFM_Log.info(`🧹 Cleaning up file on demand: ${tracking.filePath}`);
      await this.deleteAudioFile(tracking.filePath);
      this.fileTracking.delete(fileId);
      DyFM_Log.success(`✅ File cleaned up successfully: ${tracking.filePath}`);
    } catch (error) {
      tracking.cleanupError = error instanceof Error ? error.message : 'Unknown error';
      DyFM_Log.error(`❌ Failed to clean up file: ${tracking.filePath}`, error);
    }
  }

  /**
   * Find file ID by path
   * @param filePath - File path
   * @returns File ID or undefined
   */
  private findFileIdByPath(filePath: string): string | undefined {
    for (const [fileId, tracking] of this.fileTracking.entries()) {
      if (tracking.filePath === filePath) {
        return fileId;
      }
    }
    return undefined;
  }

  /**
   * Get file tracking information
   * @param filePath - File path
   * @returns File tracking information or undefined
   */
  getFileTracking(filePath: string): CVO_FileTracking | undefined {
    const fileId = this.findFileIdByPath(filePath);
    return fileId ? this.fileTracking.get(fileId) : undefined;
  }

  /**
   * Get all tracked files
   * @returns Array of file tracking information
   */
  getAllTrackedFiles(): CVO_FileTracking[] {
    return Array.from(this.fileTracking.values());
  }

  /**
   * Clean up all tracked files that are no longer in use
   */
  async cleanupAllUnusedFiles(): Promise<void> {
    const unusedFiles = Array.from(this.fileTracking.values())
      .filter(tracking => !tracking.isInUse && tracking.cleanupAfterUse);

    DyFM_Log.info(`🧹 Cleaning up ${unusedFiles.length} unused files`);

    for (const tracking of unusedFiles) {
      await this.cleanupFileOnDemand(tracking.fileId);
    }
  }

  /**
   * Perform comprehensive startup cleanup
   * @param options - Cleanup options
   */
  async performStartupCleanup(options?: {
    cleanupAllFiles?: boolean;
    maxAge?: number;
    preserveRecent?: boolean;
  }): Promise<void> {
    try {
      DyFM_Log.info('🧹 Performing comprehensive startup cleanup...');

      const cleanupAllFiles = options?.cleanupAllFiles ?? true;
      const maxAge = options?.maxAge ?? 24 * 60 * 60 * 1000; // 24 hours default
      const preserveRecent = options?.preserveRecent ?? false;

      if (cleanupAllFiles) {
        // Clean up all files in the output directory
        const allFiles = await this.listAudioFiles();
        let cleanedCount = 0;

        for (const filePath of allFiles) {
          try {
            const fileInfo = await this.getAudioFileInfo(filePath);
            
            if (fileInfo.exists) {
              const fileAge = Date.now() - fileInfo.modified.getTime();
              
              // Skip recent files if preserveRecent is enabled
              if (preserveRecent && fileAge < maxAge) {
                DyFM_Log.info(`⏭️ Preserving recent file: ${filePath} (age: ${Math.round(fileAge / 1000)}s)`);
                continue;
              }

              await this.deleteAudioFile(filePath);
              cleanedCount++;
              DyFM_Log.info(`🗑️  Cleaned up file during startup: ${filePath}`);
            }
          } catch (error) {
            DyFM_Log.error(`❌ Failed to clean up file ${filePath} during startup:`, error);
          }
        }

        DyFM_Log.success(`✅ Startup cleanup completed: ${cleanedCount} files cleaned up`);
      } else {
        // Only clean up tracked files that are no longer in use
        await this.cleanupAllUnusedFiles();
      }

      // Clear any stale tracking data
      this.clearStaleTrackingData();

    } catch (error) {
      DyFM_Log.error('❌ Error during comprehensive startup cleanup:', error);
    }
  }

  /**
   * Clear stale tracking data
   */
  private clearStaleTrackingData(): void {
    const initialCount = this.fileTracking.size;
    
    // Remove tracking entries for files that no longer exist
    for (const [fileId, tracking] of this.fileTracking.entries()) {
      if (!existsSync(tracking.filePath)) {
        this.fileTracking.delete(fileId);
        DyFM_Log.info(`🗑️ Removed stale tracking data for: ${tracking.filePath}`);
      }
    }

    const removedCount = initialCount - this.fileTracking.size;
    if (removedCount > 0) {
      DyFM_Log.info(`🧹 Cleared ${removedCount} stale tracking entries`);
    }
  }
} 