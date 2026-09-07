import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { Elevenlabs_ApiService } from './el.api-service.js';
import { EL_TextToSpeechRequest } from '../_models/el-text-to-speech-request.interface.js';
import { EL_TextToSpeechResponse } from '../_models/el-text-to-speech-response.interface.js';
import { EL_TextToSpeechModels } from '../_enums/el-text-to-speech-models.enum.js';
import { EL_Languages } from '../_enums/el-languages.enum.js';
import { settings } from '../../../_collections/consts/settings.const.js';
import { envKeys } from '../../../_collections/consts/env-keys.const.js';

/**
 * ElevenLabs Text-to-Speech Control Service
 * @author AI
 * @description High-level control service for ElevenLabs text-to-speech functionality
 */
export class EL_TextToSpeech_ControlService extends DyNTS_SingletonService {
  static getInstance(): EL_TextToSpeech_ControlService {
    return EL_TextToSpeech_ControlService.getSingletonInstance();
  }

  private readonly elevenlabs_AS: Elevenlabs_ApiService = Elevenlabs_ApiService.getInstance();
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.initializeService();
  }

  /**
   * Initialize the ElevenLabs text-to-speech service with API key from settings
   */
  private initializeService(): void {
    try {
      DyFM_Log.info('🔊 Starting ElevenLabs text-to-speech service initialization...');
      const apiKey = envKeys.elevenLabs.apiKey;
      if (!apiKey) {
        DyFM_Log.warn('⚠️  ElevenLabs API key not configured in settings');
        return;
      }

      this.elevenlabs_AS.configure({ apiKey });
      
      this.isInitialized = true;
      DyFM_Log.success('✅ ElevenLabs Text-to-Speech service initialized');
    } catch (error) {
      DyFM_Log.error('❌ ElevenLabs text-to-speech service not initialized', envKeys.elevenLabs.apiKey);
      DyFM_Log.error('❌ Failed to initialize ElevenLabs text-to-speech service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Convert text to speech using ElevenLabs
   * @param request - Text-to-speech request parameters
   * @returns Text-to-speech response
   */
  async convertTextToSpeech(request: EL_TextToSpeechRequest): Promise<EL_TextToSpeechResponse> {
    try {
      // Check if service is initialized
      if (!this.isInitialized) {
        DyFM_Log.error('❌ ElevenLabs text-to-speech service not initialized');
        return {
          success: false,
          model: request.model || EL_TextToSpeechModels.multilingualV2,
          voiceId: request.voiceId,
          error: 'Service not initialized'
        };
      }

      DyFM_Log.info('🔊 Converting text to speech with ElevenLabs...');
      
      // Call the API service
      const response = await this.elevenlabs_AS.convertTextToSpeech(request);
      
      if (response.success) {
        DyFM_Log.success(`✅ ElevenLabs text-to-speech conversion successful (${response.characterCount} characters)`);
      } else {
        DyFM_Log.error(`❌ ElevenLabs text-to-speech conversion failed: ${response.error}`);
      }
      
      return response;
      
    } catch (err) {
      DyFM_Log.error('❌ Hiba az ElevenLabs text-to-speech konverzió során:', err);
      return {
        success: false,
        model: request.model || EL_TextToSpeechModels.multilingualV2,
        voiceId: request.voiceId,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert text to speech with default settings
   * @param text - Text to convert
   * @param voiceId - Voice ID to use
   * @returns Text-to-speech response
   */
  async convertTextToSpeechSimple(text: string, voiceId: string): Promise<EL_TextToSpeechResponse> {
    const request: EL_TextToSpeechRequest = {
      text,
      voiceId,
      model: EL_TextToSpeechModels.multilingualV2,
      language: EL_Languages.english,
      outputFormat: 'mp3'
    };
    
    return this.convertTextToSpeech(request);
  }

  /**
   * Get available voices from ElevenLabs
   * @returns List of available voices
   */
  async getAvailableVoices(): Promise<any> {
    try {
      if (!this.isInitialized) {
        DyFM_Log.error('❌ ElevenLabs text-to-speech service not initialized');
        return [];
      }

      const voices = await this.elevenlabs_AS.getVoices();
      DyFM_Log.info(`✅ Retrieved ${voices.length || 0} available voices from ElevenLabs`);
      return voices;
    } catch (error) {
      DyFM_Log.error('❌ Failed to get available voices:', error);
      return [];
    }
  }

  /**
   * Check if ElevenLabs text-to-speech service is available
   * @returns true if service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return false;
      }

      const isAvailable = await this.elevenlabs_AS.testConnection();
      return isAvailable;
    } catch (error) {
      DyFM_Log.error('❌ ElevenLabs text-to-speech availability check failed:', error);
      return false;
    }
  }

  /**
   * Get usage statistics
   * @returns Usage statistics
   */
  async getUsageStats(): Promise<any> {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const stats = await this.elevenlabs_AS.getUsageStats();
      return stats;
    } catch (error) {
      DyFM_Log.error('❌ Failed to get usage stats:', error);
      throw error;
    }
  }
} 