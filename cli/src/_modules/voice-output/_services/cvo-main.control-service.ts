import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Error, DyFM_Log, DyFM_Random, DyFM_Async, second } from '@futdevpro/fsm-dynamo';
import { CVO_UnifiedTextToSpeech_ControlService } from './cvo-unified-text-to-speech.control-service.js';
import { CVO_AudioPlayback_ControlService } from './cvo-audio-playback.control-service.js';
import { CVO_File_ControlService } from './cvo-file.control-service.js';
import { CVO_Queue_ControlService } from './cvo-queue.control-service.js';
import { CVO_TextToSpeechRequest } from '../_models/cvo-text-to-speech-request.interface.js';
import { CVO_AudioPlaybackRequest } from '../_models/cvo-audio-playback-request.interface.js';
import { CVO_config } from '../_collections/consts/cvo-config.const.js';
import { settings } from '../../../_collections/consts/settings.const.js';
import { VoiceChannel } from 'discord.js';
import { createReadStream } from 'fs';
import { 
  createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior, AudioPlayer
} from '@discordjs/voice';
import * as path from 'path';
import { CVO_CCAPSound } from '../_enums/cvo-ccap-sound.enum.js';
import { CVO_Echo_ControlService } from './cvo-echo.control-service.js';
import { CVO_AudioFormat } from '../_enums/cvo-audio-format.enum.js';

/**
 * CVO Main Control Service
 * @author AI
 * @description Main control service for voice output functionality
 */
export class CVO_Main_ControlService extends DyNTS_SingletonService {

  static getInstance(): CVO_Main_ControlService {
    return CVO_Main_ControlService.getSingletonInstance();
  }

  private readonly unifiedTTS_CS: CVO_UnifiedTextToSpeech_ControlService = CVO_UnifiedTextToSpeech_ControlService.getInstance();
  private readonly audioPlayback_CS: CVO_AudioPlayback_ControlService = CVO_AudioPlayback_ControlService.getInstance();
  private readonly file_CS: CVO_File_ControlService = CVO_File_ControlService.getInstance();
  private readonly queue_CS: CVO_Queue_ControlService = CVO_Queue_ControlService.getInstance();
  private readonly echo_CS: CVO_Echo_ControlService = CVO_Echo_ControlService.getInstance();

  private _isInitialized = false;
  get initialized(): boolean {
    return this._isInitialized;
  }

  private _isPlaying = false;
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  constructor() {
    super();

    this.initialize();
  }

  /**
   * Initialize the voice output module
   */
  private async initialize(): Promise<void> {
    try {
      DyFM_Log.info('🔊 Initializing CVO Main Control Service...');

      // Initialize file management
      await this.file_CS.initializeAudioOutputDirectory();

      // Clean up any leftover files from previous sessions (if enabled)
      if (settings.voice.output.startupCleanup.enabled) {
        await this.performStartupCleanup();
      } else {
        DyFM_Log.info('⏭️ Startup cleanup disabled in settings');
      }

      // Initialize queue management
      this.queue_CS.initializeQueue();

      // Initialize audio playback
      this.audioPlayback_CS.initializePlayback();

      this._isInitialized = true;
      DyFM_Log.success('✅ CVO Main Control Service initialized successfully');
    } catch (error) {
      DyFM_Error.logSimple('❌ Failed to initialize CVO Main Control Service:', error);

      this._isInitialized = false;
    }
  }

  /**
   * Perform cleanup of leftover files from previous sessions
   */
  private async performStartupCleanup(): Promise<void> {
    try {
      DyFM_Log.info('🧹 Performing startup cleanup of leftover files...');

      // Use the enhanced startup cleanup method from file control service
      await this.file_CS.performStartupCleanup({
        cleanupAllFiles: settings.voice.output.startupCleanup.cleanupAllFiles,
        maxAge: settings.voice.output.startupCleanup.maxAge,
        preserveRecent: settings.voice.output.startupCleanup.preserveRecent
      });

    } catch (error) {
      DyFM_Error.logSimple('❌ Error during startup cleanup:', error);

      // Don't throw error - startup cleanup failure shouldn't prevent initialization
    }
  }

  /**
   * Convert text to speech and optionally play it
   * @param request - Text-to-speech request
   * @param options - Playback options including Discord channel
   * @returns Conversion result
   */
  async speakText(
    request: CVO_TextToSpeechRequest, 
    options?: {
      playAudio?: boolean;
      discordChannel?: VoiceChannel;
      volume?: number;
      speed?: number;
      priority?: number;
    }
  ): Promise<any> {
    if (!this._isInitialized) {
      throw new Error('CVO Main Control Service not initialized');
    }

    const playAudio = options?.playAudio ?? true;
    const discordChannel = options?.discordChannel;

    try {
      DyFM_Log.info('🔊 Processing text-to-speech request...');
      //DyFM_Log.info(`🔊 Processing text-to-speech request: "${request.text.substring(0, 50)}${request.text.length > 50 ? '...' : ''}"`);

      // Convert text to speech
      const ttsResponse = await this.unifiedTTS_CS.convertTextToSpeech(request);

      if (!ttsResponse.success) {
        throw new Error(`Text-to-speech conversion failed: ${ttsResponse.error}`);
      }

      // Save audio file if buffer is available
      let audioFilePath: string | undefined;
      if (ttsResponse.audioBuffer) {
        audioFilePath = await this.file_CS.saveAudioBuffer(
          ttsResponse.audioBuffer,
          request.format || CVO_config.defaultFormat,
          {
            cleanupAfterUse: true,
            playbackId: `tts_${Date.now()}`,
            userId: options?.discordChannel?.guild?.ownerId,
            channelId: options?.discordChannel?.id
          }
        );
        ttsResponse.audioFilePath = audioFilePath;
      }

      // Play audio if requested
      if (playAudio && ttsResponse.audioBuffer) {
        const playbackRequest: CVO_AudioPlaybackRequest = {
          audioBuffer: ttsResponse.audioBuffer,
          format: request.format || CVO_config.defaultFormat,
          volume: options?.volume || CVO_config.defaultVolume,
          speed: options?.speed || CVO_config.defaultSpeed,
          priority: options?.priority || 0,
          channelId: discordChannel?.id
        };

        // If Discord channel is specified, play directly in that channel
        if (discordChannel) {
          DyFM_Log.info(`🎵 Playing TTS audio in Discord channel: ${discordChannel.name}`);
          await this.playAudioInDiscordChannel(playbackRequest, discordChannel);
        } else {
          // Use queue system for general playback
          await this.queue_CS.addToQueue(playbackRequest);
        }
      }

      DyFM_Log.success(`✅ Text-to-speech processing completed successfully`);
      return ttsResponse;

    } catch (error) {
      DyFM_Error.logSimple('❌ Error in speakText:', error);

      throw error;
    }
  }

  /**
   * Play audio in specific Discord voice channel
   * @param playbackRequest - Audio playback request
   * @param discordChannel - Discord voice channel
   */
  private async playAudioInDiscordChannel(
    playbackRequest: CVO_AudioPlaybackRequest,
    discordChannel: VoiceChannel
  ): Promise<void> {
    try {
      DyFM_Log.info(`🎵 Playing audio in Discord channel: ${discordChannel.name}`);

      if (this._isPlaying) {
        //await DyFM_Async.waitUntil(() => !this._isPlaying, 100, 30 * second);
        await DyFM_Async.waitUntil(() => !this._isPlaying);
      }
      this._isPlaying = true;

      // Use the audio playback service to play in the specified channel
      if (playbackRequest.audioBuffer) {
        await this.audioPlayback_CS.playAudioBuffer(playbackRequest);
      } else if (playbackRequest.audioFilePath) {
        await this.audioPlayback_CS.playAudioFile(playbackRequest);
      } else {
        throw new Error('No audio source available for playback');
      }

      this._isPlaying = false;

      DyFM_Log.success(`✅ Audio playback started in Discord channel: ${discordChannel.name}`);
    } catch (error) {
      DyFM_Error.logSimple(`❌ Error playing audio in Discord channel ${discordChannel.name}:`, error);
      
      this._isPlaying = false;
      throw error;
    }
  }

  /**
   * Play audio from file
   * @param audioFilePath - Path to audio file
   * @param options - Playback options including Discord channel
   */
  async playAudioFile(
    audioFilePath: string, 
    options?: Partial<CVO_AudioPlaybackRequest> & {
      discordChannel?: VoiceChannel;
    }
  ): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('CVO Main Control Service not initialized');
    }

    try {
      DyFM_Log.info(`🔊 Playing audio file: ${audioFilePath}`);

      const playbackRequest: CVO_AudioPlaybackRequest = {
        audioFilePath,
        format: options?.format || CVO_config.defaultFormat,
        volume: options?.volume || CVO_config.defaultVolume,
        speed: options?.speed || CVO_config.defaultSpeed,
        loop: options?.loop || false,
        priority: options?.priority || 0,
        channelId: options?.discordChannel?.id
      };

      // If Discord channel is specified, play directly in that channel
      if (options?.discordChannel) {
        DyFM_Log.info(`🎵 Playing audio file in Discord channel: ${options.discordChannel.name}`);
        await this.playAudioInDiscordChannel(playbackRequest, options.discordChannel);
      } else {
        // Use queue system for general playback
        await this.queue_CS.addToQueue(playbackRequest);
      }

    } catch (error) {
      DyFM_Error.logSimple('❌ Error playing audio file:', error);

      throw error;
    }
  }

  /**
   * Stop all audio playback
   */
  async stopAllAudio(): Promise<void> {
    if (!this._isInitialized) {
      return;
    }

    try {
      DyFM_Log.info('🔇 Stopping all audio playback');
      await this.audioPlayback_CS.stopAllPlayback();
      this.queue_CS.clearQueue();
    } catch (error) {
      DyFM_Error.logSimple('❌ Error stopping audio playback:', error);
    }
  }

  /**
   * Pause audio playback
   */
  async pauseAudio(): Promise<void> {
    if (!this._isInitialized) {
      return;
    }

    try {
      DyFM_Log.info('⏸️ Pausing audio playback');
      await this.audioPlayback_CS.pausePlayback();
    } catch (error) {
      DyFM_Error.logSimple('❌ Error pausing audio playback:', error);
    }
  }

  /**
   * Resume audio playback
   */
  async resumeAudio(): Promise<void> {
    if (!this._isInitialized) {
      return;
    }

    try {
      DyFM_Log.info('▶️ Resuming audio playback');
      await this.audioPlayback_CS.resumePlayback();
    } catch (error) {
      DyFM_Error.logSimple('❌ Error resuming audio playback:', error);
    }
  }

  /**
   * Get current playback status
   */
  getPlaybackStatus(): any {
    if (!this._isInitialized) {
      return { initialized: false };
    }

    return {
      initialized: true,
      queueStatus: this.queue_CS.getQueueStatus(),
      playbackStatus: this.audioPlayback_CS.getPlaybackStatus()
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (!this._isInitialized) {
      return;
    }

    try {
      DyFM_Log.info('🧹 Cleaning up CVO Main Control Service');
      
      await this.stopAllAudio();
      await this.file_CS.cleanupAllUnusedFiles();
      
      this._isInitialized = false;
      DyFM_Log.success('✅ CVO Main Control Service cleanup completed');
    } catch (error) {
      DyFM_Error.logSimple('❌ Error during cleanup:', error);
    }
  }

  /**
   * Clean up specific file on demand
   * @param filePath - Path to the file to clean up
   */
  async cleanupFileOnDemand(filePath: string): Promise<void> {
    if (!this._isInitialized) {
      return;
    }

    try {
      DyFM_Log.info(`🧹 Manual cleanup requested for file: ${filePath}`);
      this.file_CS.markFileNotInUse(filePath);
      DyFM_Log.success(`✅ Manual cleanup completed for file: ${filePath}`);
    } catch (error) {
      DyFM_Error.logSimple(`❌ Error during manual cleanup for file ${filePath}:`, error);
    }
  }

  /**
   * Get file tracking information
   * @param filePath - Path to the file
   * @returns File tracking information or undefined
   */
  getFileTracking(filePath: string): any {
    if (!this._isInitialized) {
      return undefined;
    }

    return this.file_CS.getFileTracking(filePath);
  }

  /**
   * Get all tracked files
   * @returns Array of file tracking information
   */
  getAllTrackedFiles(): any[] {
    if (!this._isInitialized) {
      return [];
    }

    return this.file_CS.getAllTrackedFiles();
  }

  /**
   * Perform manual startup cleanup with custom options
   * @param options - Cleanup options
   */
  async performManualStartupCleanup(options?: {
    cleanupAllFiles?: boolean;
    maxAge?: number;
    preserveRecent?: boolean;
  }): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('CVO Main Control Service not initialized');
    }

    try {
      DyFM_Log.info('🧹 Performing manual startup cleanup...');
      await this.file_CS.performStartupCleanup(options);
      DyFM_Log.success('✅ Manual startup cleanup completed');
    } catch (error) {
      DyFM_Error.logSimple('❌ Error during manual startup cleanup:', error);
      throw error;
    }
  }

  async playSound(ccapSound: CVO_CCAPSound, issuer: string): Promise<void> {
    try {
      if (this.isPlaying) {
        return;
      }

      if (ccapSound === CVO_CCAPSound.earlySkip) {
        ccapSound = `${CVO_CCAPSound.earlySkip}-${DyFM_Random.getRandomInt(0, 15)}.mp3` as CVO_CCAPSound;
      }

      const testFile = path.join(
        process.cwd(), 
        'src', 
        '_assets',
        'sounds',
        ccapSound
      );
      
      // Fájl létezésének ellenőrzése
      try {
        const fs = require('fs').promises;
        await fs.access(testFile);
        /* DyFM_Log.log('✅ Teszt fájl megtalálható'); */
      } catch (err) {
        DyFM_Log.error('❌ Teszt fájl nem található:', testFile);
        return;
      }
      
      // Audio stream létrehozása
      const audioStream = createReadStream(testFile);
      
      // Audio resource létrehozása
      const resource = createAudioResource(audioStream, {
        inlineVolume: true
      });

      if (this.isPlaying) {
        return;
      }
      DyFM_Log.info(`🔊 Playing sound: ${ccapSound}`);
      
      await this.audioPlayback_CS.playAudioFile({
        audioFilePath: testFile,
        format: CVO_AudioFormat.mp3,
        volume: settings.ccap.soundsVolume,
        /* ccapSound === CVO_CCAPSound.skip ? 
          settings.ccap.volume * 0.25 : 
          settings.ccap.volume * 0.5, */
        speed: 1,
        loop: false,
      });
      
      // Hangerej beállítása (0.0 - 1.0 között, ahol 1.0 a maximális)
      /* if (ccapSound === CVO_CCAPSound.skip) {
        resource.volume?.setVolume(settings.ccap.volume * 0.5);
      } else {
        resource.volume?.setVolume(settings.ccap.volume);
      } */

      // Lejátszás
      /* this.echo_CS.echoPlayer.play(resource); */
    } catch (error) {
      DyFM_Error.logSimple('❌ Error playing sound:', error);
      
      throw new DyFM_Error({
        ...this.getDefaultErrorSettings('playSound', error, issuer),
        errorCode: 'CVO-MS-PS0',
      });
    }
  }
} 