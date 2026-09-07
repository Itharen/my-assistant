import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { CVO_AudioPlaybackRequest } from '../_models/cvo-audio-playback-request.interface.js';
import { CVO_QueueItem } from '../_models/cvo-queue-item.interface.js';
import { CVO_PlaybackState } from '../_enums/cvo-playback-state.enum.js';
import { CVO_AudioPlayback_ControlService } from './cvo-audio-playback.control-service.js';

/**
 * CVO Queue Control Service
 * @author AI
 * @description Manages audio playback queue with priority handling
 */
export class CVO_Queue_ControlService extends DyNTS_SingletonService {
  static getInstance(): CVO_Queue_ControlService {
    return CVO_Queue_ControlService.getSingletonInstance();
  }

  private readonly audioPlayback_CS: CVO_AudioPlayback_ControlService = CVO_AudioPlayback_ControlService.getInstance();
  
  private queue: CVO_QueueItem[] = [];
  private isProcessing = false;
  private isInitialized = false;

  constructor() {
    super();
  }

  /**
   * Initialize queue management
   */
  initializeQueue(): void {
    try {
      DyFM_Log.info('🔊 Initializing CVO Queue Control Service...');
      this.isInitialized = true;
      DyFM_Log.success('✅ CVO Queue Control Service initialized successfully');
    } catch (error) {
      DyFM_Log.error('❌ Failed to initialize CVO Queue Control Service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Add audio to queue
   * @param request - Audio playback request
   */
  async addToQueue(request: CVO_AudioPlaybackRequest): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('CVO Queue Control Service not initialized');
    }

    try {
      const queueItem: CVO_QueueItem = {
        id: this.generateQueueId(),
        request,
        state: CVO_PlaybackState.idle,
        priority: request.priority || 0,
        createdAt: Date.now()
      };

      // Add to queue based on priority
      this.insertByPriority(queueItem);
      
      DyFM_Log.info(`🔊 Added audio to queue (ID: ${queueItem.id}, Priority: ${queueItem.priority})`);

      // Start processing if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }
    } catch (error) {
      DyFM_Log.error('❌ Error adding to queue:', error);
      throw error;
    }
  }

  /**
   * Process queue items
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        if (!item) continue;

        DyFM_Log.info(`🔊 Processing queue item: ${item.id}`);

        try {
          // Play audio based on source type
          if (item.request.audioBuffer) {
            await this.audioPlayback_CS.playAudioBuffer(item.request);
          } else if (item.request.audioFilePath) {
            await this.audioPlayback_CS.playAudioFile(item.request);
          } else {
            DyFM_Log.error('❌ Queue item has no audio source');
            continue;
          }

          // Wait for playback to complete (simple delay for now)
          // In a more sophisticated implementation, you'd listen for playback events
          await this.waitForPlaybackCompletion();

        } catch (error) {
          DyFM_Log.error(`❌ Error processing queue item ${item.id}:`, error);
        }
      }
    } finally {
      this.isProcessing = false;
      DyFM_Log.info('🔇 Queue processing completed');
    }
  }

  /**
   * Wait for current playback to complete
   */
  private async waitForPlaybackCompletion(): Promise<void> {
    // Simple implementation - wait for a reasonable duration
    // In a real implementation, you'd listen for AudioPlayerStatus.Idle event
    return new Promise(resolve => {
      setTimeout(resolve, 1000); // Wait 1 second as placeholder
    });
  }

  /**
   * Insert item into queue by priority
   * @param item - Queue item to insert
   */
  private insertByPriority(item: CVO_QueueItem): void {
    // Find position to insert based on priority (higher priority first)
    let insertIndex = 0;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < item.priority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }

    this.queue.splice(insertIndex, 0, item);
  }

  /**
   * Remove item from queue by ID
   * @param queueId - Queue item ID
   */
  removeFromQueue(queueId: string): boolean {
    const index = this.queue.findIndex(item => item.id === queueId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      DyFM_Log.info(`🗑️ Removed queue item: ${queueId}`);
      return true;
    }
    return false;
  }

  /**
   * Clear entire queue
   */
  clearQueue(): void {
    this.queue = [];
    DyFM_Log.info('🗑️ Queue cleared');
  }

  /**
   * Get queue status
   */
  getQueueStatus(): any {
    return {
      initialized: this.isInitialized,
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      items: this.queue.map(item => ({
        id: item.id,
        priority: item.priority,
        createdAt: item.createdAt,
        hasAudioBuffer: !!item.request.audioBuffer,
        hasAudioFile: !!item.request.audioFilePath
      }))
    };
  }

  /**
   * Generate unique queue ID
   */
  private generateQueueId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get next queue item without removing it
   */
  peekNextItem(): CVO_QueueItem | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isQueueEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Check if queue is processing
   */
  isQueueProcessing(): boolean {
    return this.isProcessing;
  }
} 