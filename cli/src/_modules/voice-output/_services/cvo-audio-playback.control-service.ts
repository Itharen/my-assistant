import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log, DyFM_Async, second, DyFM_Error } from '@futdevpro/fsm-dynamo';
import { 
  createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior, AudioPlayer,
  VoiceConnection, entersState, VoiceConnectionStatus, AudioPlayerState
} from '@discordjs/voice';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import { CV_Connection_ControlService } from '../../voice/_services/cv-connection.control-service.js';
import { CVO_PlaybackState } from '../_enums/cvo-playback-state.enum.js';
import { CVO_AudioPlaybackRequest } from '../_models/cvo-audio-playback-request.interface.js';
import { CVO_AudioPlaybackResponse } from '../_models/cvo-audio-playback-response.interface.js';
import { CVO_File_ControlService } from './cvo-file.control-service.js';
import { settings } from '../../../_collections/consts/settings.const.js';

/**
 * CVO Audio Playback Control Service
 * @author AI
 * @description Handles audio playback in Discord voice channels
 */
export class CVO_AudioPlayback_ControlService extends DyNTS_SingletonService {
  static getInstance(): CVO_AudioPlayback_ControlService {
    return CVO_AudioPlayback_ControlService.getSingletonInstance();
  }

  private readonly connection_CS: CV_Connection_ControlService = CV_Connection_ControlService.getInstance();
  private readonly file_CS: CVO_File_ControlService = CVO_File_ControlService.getInstance();
  
  private audioPlayer: AudioPlayer;
  private currentConnection: VoiceConnection;
  private playbackState: CVO_PlaybackState = CVO_PlaybackState.idle;
  private isInitialized = false;
  private currentPlaybackFile: string | null = null;

  constructor() {
    super();
  }

  /**
   * Initialize audio playback system
   */
  initializePlayback(): void {
    try {
      DyFM_Log.info('🔊 Initializing CVO Audio Playback Control Service...');

      this.audioPlayer = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }
      });

      this.setupAudioPlayerEvents();
      this.isInitialized = true;
      DyFM_Log.success('✅ CVO Audio Playback Control Service initialized successfully');
    } catch (error) {
      DyFM_Error.logSimple('❌ Failed to initialize CVO Audio Playback Control Service:', error);

      this.isInitialized = false;
    }
  }

  /**
   * Setup audio player event handlers
   */
  private setupAudioPlayerEvents(): void {
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.playbackState = CVO_PlaybackState.idle;
      DyFM_Log.info('🔇 Audio playback finished');
      
      // Trigger on-demand cleanup for the current file
      if (this.currentPlaybackFile) {
        this.file_CS.markFileNotInUse(this.currentPlaybackFile);
        this.currentPlaybackFile = null;
      }
    });

    this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
      this.playbackState = CVO_PlaybackState.playing;
      DyFM_Log.info('▶️  Audio playback started');
    });

    this.audioPlayer.on(AudioPlayerStatus.Paused, () => {
      this.playbackState = CVO_PlaybackState.paused;
      DyFM_Log.info('⏸️ Audio playback paused');
    });

    this.audioPlayer.on('error', (error) => {
      this.playbackState = CVO_PlaybackState.error;
      DyFM_Error.logSimple('❌ Audio playback error:', error);
      
      // Trigger cleanup even on error
      if (this.currentPlaybackFile) {
        this.file_CS.markFileNotInUse(this.currentPlaybackFile);
        this.currentPlaybackFile = null;
      }
    });
  }

  /**
   * Ensure voice connection is available
   */
  private async ensureVoiceConnection(): Promise<VoiceConnection> {
    try {
      if (!this.currentConnection) {
        DyFM_Log.info('🔗 Creating voice connection for audio playback...');
        this.currentConnection = await this.connection_CS.createVoiceConnection(
          settings.ccap.useVoiceChannel,
        );
        
        // Subscribe audio player to connection
        this.currentConnection.subscribe(this.audioPlayer);
        DyFM_Log.info('✅ Audio player subscribed to voice connection');
      }

      // Ensure connection is ready
      await entersState(this.currentConnection, VoiceConnectionStatus.Ready, 30_000);
      return this.currentConnection;
    } catch (error) {
      DyFM_Error.logSimple('❌ Error ensuring voice connection:', error);

      throw error;
    }
  }

  /**
   * Play audio from buffer
   * @param request - Audio playback request
   * @returns Playback response
   */
  async playAudioBuffer(request: CVO_AudioPlaybackRequest): Promise<CVO_AudioPlaybackResponse> {
    if (!this.isInitialized) {
      throw new Error('CVO Audio Playback Control Service not initialized');
    }

    try {
      DyFM_Log.info('🔊 Playing audio from buffer...');

      // Ensure voice connection
      await this.ensureVoiceConnection();

      // Create audio stream from buffer
      const audioStream = Readable.from(request.audioBuffer!);

      // Create audio resource
      const resource = createAudioResource(audioStream, {
        inlineVolume: true
      });

      // Set volume if specified
      if (request.volume !== undefined) {
        resource.volume.setVolume(request.volume);
      }

      // Play audio
      this.audioPlayer.play(resource);

      await DyFM_Async.waitUntil(() => this.playbackState === CVO_PlaybackState.playing, 100, 30 * second);
      await DyFM_Async.waitUntil(() => this.playbackState !== CVO_PlaybackState.playing, 100, 30 * second).catch((error) => {
        DyFM_Error.logSimple('❌ Error waiting for audio playback to start:', error);
      });

      const response: CVO_AudioPlaybackResponse = {
        success: true,
        state: this.playbackState
      };

      DyFM_Log.success('✅ Audio buffer playback started');
      return response;

    } catch (error) {
      DyFM_Error.logSimple('❌ Error playing audio buffer:', error);
      
      const response: CVO_AudioPlaybackResponse = {
        success: false,
        state: CVO_PlaybackState.error,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      return response;
    }
  }

  /**
   * Play audio from file
   * @param request - Audio playback request
   * @returns Playback response
   */
  async playAudioFile(request: CVO_AudioPlaybackRequest): Promise<CVO_AudioPlaybackResponse> {
    if (!this.isInitialized) {
      throw new Error('CVO Audio Playback Control Service not initialized');
    }

    try {
      DyFM_Log.info(`🔊 Playing audio file: ${request.audioFilePath}`);

      // Mark file as accessed for tracking
      if (request.audioFilePath) {
        this.file_CS.markFileAccessed(request.audioFilePath);
        this.currentPlaybackFile = request.audioFilePath;
      }

      // Ensure voice connection
      await this.ensureVoiceConnection();

      // Create audio stream from file
      const audioStream = createReadStream(request.audioFilePath!);

      // Create audio resource
      const resource = createAudioResource(audioStream, {
        inlineVolume: true
      });

      // Set volume if specified
      if (request.volume !== undefined) {
        resource.volume.setVolume(request.volume);
      }

      // Play audio
      this.audioPlayer.play(resource);

      const response: CVO_AudioPlaybackResponse = {
        success: true,
        state: this.playbackState
      };

      DyFM_Log.success('✅ Audio file playback started');
      return response;

    } catch (error) {
      DyFM_Error.logSimple('❌ Error playing audio file:', error);
      
      // Trigger cleanup on error
      if (request.audioFilePath) {
        this.file_CS.markFileNotInUse(request.audioFilePath);
        this.currentPlaybackFile = null;
      }
      
      const response: CVO_AudioPlaybackResponse = {
        success: false,
        state: CVO_PlaybackState.error,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      return response;
    }
  }

  /**
   * Pause audio playback
   */
  async pausePlayback(): Promise<void> {
    if (!this.isInitialized || !this.audioPlayer) {
      return;
    }

    try {
      this.audioPlayer.pause();
      DyFM_Log.info('⏸️ Audio playback paused');
    } catch (error) {
      DyFM_Error.logSimple('❌ Error pausing audio playback:', error);
    }
  }

  /**
   * Resume audio playback
   */
  async resumePlayback(): Promise<void> {
    if (!this.isInitialized || !this.audioPlayer) {
      return;
    }

    try {
      this.audioPlayer.unpause();
      DyFM_Log.info('▶️ Audio playback resumed');
    } catch (error) {
      DyFM_Error.logSimple('❌ Error resuming audio playback:', error);
    }
  }

  /**
   * Stop all audio playback
   */
  async stopAllPlayback(): Promise<void> {
    if (!this.isInitialized || !this.audioPlayer) {
      return;
    }

    try {
      this.audioPlayer.stop();
      this.playbackState = CVO_PlaybackState.idle;
      DyFM_Log.info('🔇 All audio playback stopped');
    } catch (error) {
      DyFM_Error.logSimple('❌ Error stopping audio playback:', error);
    }
  }

  /**
   * Get current playback status
   */
  getPlaybackStatus(): any {
    return {
      initialized: this.isInitialized,
      playbackState: this.playbackState,
      hasConnection: !!this.currentConnection,
      hasAudioPlayer: !!this.audioPlayer
    };
  }

  /**
   * Get input type for audio format
   * @param format - Audio format
   * @returns Input type string
   */
  private getInputType(format: string): string {
    switch (format.toLowerCase()) {
      case 'mp3':
        return 'mp3';
      case 'wav':
        return 'wav';
      case 'ogg':
        return 'ogg';
      case 'webm':
        return 'webm';
      default:
        return 'mp3'; // Default to mp3
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      DyFM_Log.info('🧹 Cleaning up CVO Audio Playback Control Service');
      
      await this.stopAllPlayback();
      
      if (this.audioPlayer) {
        this.audioPlayer.removeAllListeners();
      }
      
      this.isInitialized = false;
      DyFM_Log.success('✅ CVO Audio Playback Control Service cleanup completed');
    } catch (error) {
      DyFM_Error.logSimple('❌ Error during cleanup:', error);
    }
  }
} 