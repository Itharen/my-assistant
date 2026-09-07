import { DyNTS_SingletonService, DyNTS_global_settings } from '@futdevpro/nts-dynamo';
import { DyFM_Error, DyFM_Log } from '@futdevpro/fsm-dynamo';
import { Porcupine } from '@picovoice/porcupine-node';
import { agt3Config } from '../../_collections/consts/agt3-config.const.js';
import { EventEmitter } from 'events';

/**
 * Porcupine wake word detection event interface.
 */
export interface CCAP_Agt3_PorcupineDetectionEvent {
  /** User ID who triggered the wake word. */
  userId: string;
  /** Detected wake word index. */
  keywordIndex: number;
  /** Timestamp of detection. */
  timestamp: Date;
}

/**
 * Event emitter for Porcupine detection events.
 */
class PorcupineEventEmitter extends EventEmitter {}

/**
 * Agent 3 Porcupine wake word detection control service.
 * Provides offline wake word detection using Porcupine engine.
 */
export class CCAP_Agt3_Porcupine_ControlService extends DyNTS_SingletonService {

  static getInstance(): CCAP_Agt3_Porcupine_ControlService {
    return CCAP_Agt3_Porcupine_ControlService.getSingletonInstance();
  }

  private porcupine: Porcupine | null = null;
  private isInitialized: boolean = false;
  private frameLength: number = 0;
  private eventEmitter: PorcupineEventEmitter = new PorcupineEventEmitter();
  private perUserFrameBuffers: Map<string, Buffer> = new Map();

  /**
   * Add event listener for wake word detection.
   */
  onWakeWordDetected(callback: (event: CCAP_Agt3_PorcupineDetectionEvent) => void): void {
    this.eventEmitter.on('wakeWordDetected', callback);
  }

  /**
   * Remove event listener for wake word detection.
   */
  offWakeWordDetected(callback: (event: CCAP_Agt3_PorcupineDetectionEvent) => void): void {
    this.eventEmitter.off('wakeWordDetected', callback);
  }

  /**
   * Initialize Porcupine engine.
   */
  async initialize(issuer: string): Promise<void> {
    try {
      if (this.isInitialized) {
        DyFM_Log.warn('⚠️  Porcupine already initialized');
        return;
      }

      // Check access key
      if (!agt3Config.porcupine.accessKey || agt3Config.porcupine.accessKey.trim().length === 0) {
        DyFM_Log.warn('⚠️  Porcupine access key not found, wake word detection will use transcription fallback');
        return;
      }

      DyFM_Log.info('🔧 Initializing Porcupine wake word detection engine');

      // Initialize Porcupine with built-in "computer" wake word
      this.porcupine = await Porcupine.fromBuiltInKeywords(
        agt3Config.porcupine.accessKey,
        [agt3Config.porcupine.wakeWord],
        [agt3Config.porcupine.sensitivity]
      );

      // Get frame length
      this.frameLength = this.porcupine.frameLength;

      this.isInitialized = true;

      DyFM_Log.success(
        `✅ Porcupine initialized successfully (wake word: "${agt3Config.porcupine.wakeWord}", ` +
        `sensitivity: ${agt3Config.porcupine.sensitivity}, frame length: ${this.frameLength})`
      );
    } catch (error) {
      this.isInitialized = false;
      this.porcupine = null;

      DyFM_Log.warn('⚠️  Porcupine initialization failed, will use transcription fallback', error);
      // Don't throw - graceful degradation to transcription-based detection
    }
  }

  /**
   * Process audio frame for wake word detection.
   * Audio must be 16kHz, mono, 16-bit PCM.
   */
  async processAudioFrame(set: {
    audioFrame: Buffer;
    userId: string;
    issuer: string;
  }): Promise<boolean> {
    try {
      if (!this.isInitialized || !this.porcupine) {
        return false;
      }

      // Get or create frame buffer for user
      let frameBuffer: Buffer = this.perUserFrameBuffers.get(set.userId) || Buffer.alloc(0);

      // Append new audio data to buffer
      frameBuffer = Buffer.concat([frameBuffer, set.audioFrame]);

      // Process complete frames
      const frameSizeBytes: number = this.frameLength * 2; // 16-bit = 2 bytes per sample
      let detected: boolean = false;

      while (frameBuffer.length >= frameSizeBytes) {
        // Extract one frame
        const frame: Buffer = frameBuffer.subarray(0, frameSizeBytes);
        frameBuffer = frameBuffer.subarray(frameSizeBytes);

        // Convert Buffer to Int16Array for Porcupine
        const samples: Int16Array = new Int16Array(frame.length / 2);
        for (let i: number = 0; i < samples.length; i++) {
          samples[i] = frame.readInt16LE(i * 2);
        }

        // Process frame with Porcupine
        const keywordIndex: number = this.porcupine.process(samples);

        if (keywordIndex >= 0) {
          // Wake word detected!
          DyFM_Log.success(
            `🎯 [PORCUPINE] Wake word detected for user: ${set.userId} (keyword index: ${keywordIndex})`
          );

          // Emit detection event
          this.eventEmitter.emit('wakeWordDetected', {
            userId: set.userId,
            keywordIndex: keywordIndex,
            timestamp: new Date(),
          } as CCAP_Agt3_PorcupineDetectionEvent);

          detected = true;

          // Clear frame buffer after detection
          frameBuffer = Buffer.alloc(0);
        }
      }

      // Update frame buffer for user
      this.perUserFrameBuffers.set(set.userId, frameBuffer);

      return detected;
    } catch (error) {
      DyFM_Log.error(`❌ [PORCUPINE] Error processing audio frame for user: ${set.userId}`, error);
      return false;
    }
  }

  /**
   * Reset frame buffer for user (after detection or cleanup).
   */
  resetUserBuffer(userId: string): void {
    this.perUserFrameBuffers.delete(userId);
  }

  /**
   * Reset all frame buffers.
   */
  resetAllBuffers(): void {
    this.perUserFrameBuffers.clear();
  }

  /**
   * Release Porcupine engine resources.
   */
  async release(issuer: string): Promise<void> {
    try {
      if (!this.isInitialized || !this.porcupine) {
        return;
      }

      DyFM_Log.info('🔧 Releasing Porcupine engine');

      this.porcupine.release();
      this.porcupine = null;
      this.isInitialized = false;
      this.resetAllBuffers();

      DyFM_Log.success('✅ Porcupine engine released');
    } catch (error) {
      throw new DyFM_Error({
        ...this.getDefaultErrorSettings('release', error, issuer),
        errorCode: `${DyNTS_global_settings.systemShortCodeName}|AGT3-PORCUPINE-RELEASE0`,
      });
    }
  }

  /**
   * Check if Porcupine is initialized and ready.
   */
  isReady(): boolean {
    return this.isInitialized && this.porcupine !== null;
  }

  /**
   * Get frame length in samples.
   */
  getFrameLength(): number {
    return this.frameLength;
  }

  /**
   * Get required sample rate.
   */
  getSampleRate(): number {
    return agt3Config.porcupine.sampleRate;
  }
}
