import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Error, DyFM_Log } from '@futdevpro/fsm-dynamo';
import { CVO_TextToSpeechService } from '../_enums/cvo-text-to-speech-service.enum.js';
import { CVO_VoiceModel } from '../_enums/cvo-voice-model.enum.js';
import { CVO_TextToSpeechRequest } from '../_models/cvo-text-to-speech-request.interface.js';
import { CVO_TextToSpeechResponse } from '../_models/cvo-text-to-speech-response.interface.js';
import { CVO_config } from '../_collections/consts/cvo-config.const.js';
import { settings } from '../../../_collections/consts/settings.const.js';
import OpenAI from 'openai';
import { EL_TextToSpeech_ControlService } from '../../elevenlabs/_services/el-text-to-speech.control-service.js';
import { EL_TextToSpeechModels } from '../../elevenlabs/_enums/el-text-to-speech-models.enum.js';
import { EL_Languages } from '../../elevenlabs/_enums/el-languages.enum.js';
import { envKeys } from '../../../_collections/consts/env-keys.const.js';

/**
 * CVO Unified Text-to-Speech Control Service
 * @author AI
 * @description Unified service for managing multiple text-to-speech providers
 */
export interface CVO_UnifiedTextToSpeechResponse {
  /** Provider used for conversion */
  provider: CVO_TextToSpeechService;
  
  /** Audio data as buffer */
  audioBuffer?: Buffer;
  
  /** Audio file path (if saved) */
  audioFilePath?: string;
  
  /** Audio format */
  format: string;
  
  /** Audio duration in seconds */
  duration?: number;
  
  /** Processing time in milliseconds */
  processingTime?: number;
  
  /** Success status */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Raw response from the provider */
  rawResponse?: any;
  
  /** Character count processed */
  characterCount?: number;
  
  /** Language detected */
  language?: string;
}

export class CVO_UnifiedTextToSpeech_ControlService extends DyNTS_SingletonService {
  static getInstance(): CVO_UnifiedTextToSpeech_ControlService {
    return CVO_UnifiedTextToSpeech_ControlService.getSingletonInstance();
  }

  private openai_AS: OpenAI | null = null;
  private elevenlabs_AS: EL_TextToSpeech_ControlService | null = null;

  constructor() {
    super();
    this.initializeServices();
  }

  /**
   * Initialize TTS services
   */
  private async initializeServices(): Promise<void> {
    try {
      // Initialize OpenAI TTS service
      if (envKeys.openAi.apiKey) {
        this.openai_AS = new OpenAI({
          apiKey: envKeys.openAi.apiKey,
          organization: envKeys.openAi.organization,
          project: envKeys.openAi.project,
        });
        DyFM_Log.info('🔊 OpenAI TTS service initialized successfully');
      } else {
        DyFM_Log.warn('⚠️  OpenAI API key not configured, TTS service will not be available');
      }

      // Initialize ElevenLabs TTS service
      if (envKeys.elevenLabs.apiKey) {
        this.elevenlabs_AS = EL_TextToSpeech_ControlService.getInstance();
        DyFM_Log.info('🔊 ElevenLabs TTS service initialized successfully');
      } else {
        DyFM_Log.warn('⚠️  ElevenLabs API key not configured, TTS service will not be available');
      }

      DyFM_Log.success('✅ CVO Unified Text-to-Speech service initialized');
    } catch (error) {
      DyFM_Error.logSimple('❌ Failed to initialize CVO Unified Text-to-Speech service:', error);
    }
  }

  /**
   * Convert text to speech using the selected provider
   * @param request - Text-to-speech request
   * @returns Unified text-to-speech response
   */
  async convertTextToSpeech(request: CVO_TextToSpeechRequest): Promise<CVO_UnifiedTextToSpeechResponse> {
    const startTime = Date.now();
    const selectedProvider = request.service || CVO_config.defaultService;

    try {
      DyFM_Log.info(`🔊 Converting text to speech with ${selectedProvider}...`);

      let response: CVO_UnifiedTextToSpeechResponse;

      switch (selectedProvider) {
        case CVO_TextToSpeechService.openai:
          response = await this.convertWithOpenAI(request);
          break;

        case CVO_TextToSpeechService.elevenlabs:
          response = await this.convertWithElevenLabs(request);
          break;

        default:
          throw new Error(`Unsupported text-to-speech provider: ${selectedProvider}`);
      }

      const processingTime = Date.now() - startTime;
      response.processingTime = processingTime;

      if (response.success) {
        DyFM_Log.H_success(`✅ Text-to-speech conversion successful with ${selectedProvider} (${response.characterCount} characters, ${processingTime}ms)`);
      } else {
        DyFM_Log.error(`❌ Text-to-speech conversion failed with ${selectedProvider}: ${response.error}`);
      }

      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      DyFM_Error.logSimple(`❌ Text-to-speech conversion error with ${selectedProvider}:`, error);

      return {
        provider: selectedProvider,
        format: request.format || CVO_config.defaultFormat,
        success: false,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convert text to speech with OpenAI
   * @param request - Text-to-speech request
   * @returns Unified response
   */
  private async convertWithOpenAI(request: CVO_TextToSpeechRequest): Promise<CVO_UnifiedTextToSpeechResponse> {
    if (!this.openai_AS) {
      return {
        provider: CVO_TextToSpeechService.openai,
        format: request.format || CVO_config.defaultFormat,
        success: false,
        error: 'OpenAI TTS service not initialized'
      };
    }

    try {
      // Validate request
      if (!request.text || request.text.trim().length === 0) {
        throw new Error('Text is required and cannot be empty');
      }

      const maxLength = request.maxTextLength || CVO_config.defaultMaxTextLength;
      if (request.text.length > maxLength) {
        throw new Error(`Text too long. Maximum length: ${maxLength} characters`);
      }

      // Prepare OpenAI TTS request
      const model = request.model || CVO_config.defaultModel;
      const voice = request.voiceId || 'alloy'; // Default OpenAI voice
      const format = request.format || CVO_config.defaultFormat;
      const language = request.language || CVO_config.defaultLanguage;

      DyFM_Log.info(`🔊 Making OpenAI TTS API call with model: ${model}, voice: ${voice}, format: ${format}`);

      // Make API request
      const response = await this.openai_AS.audio.speech.create({
        model: model,
        voice: voice as any,
        input: request.text,
        response_format: format as any,
        speed: request.voiceSettings?.speed || 1.0
      });

      // Convert response to buffer
      const audioBuffer = Buffer.from(await response.arrayBuffer());

      return {
        provider: CVO_TextToSpeechService.openai,
        audioBuffer,
        format: format,
        success: true,
        characterCount: request.text.length,
        language: language,
        rawResponse: response
      };

    } catch (error) {
      DyFM_Error.logSimple('❌ OpenAI TTS conversion failed:', error);
      
      return {
        provider: CVO_TextToSpeechService.openai,
        format: request.format || CVO_config.defaultFormat,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown OpenAI TTS error'
      };
    }
  }

  /**
   * Convert text to speech with ElevenLabs
   * @param request - Text-to-speech request
   * @returns Unified response
   */
  private async convertWithElevenLabs(request: CVO_TextToSpeechRequest): Promise<CVO_UnifiedTextToSpeechResponse> {
    if (!this.elevenlabs_AS) {
      return {
        provider: CVO_TextToSpeechService.elevenlabs,
        format: request.format || CVO_config.defaultFormat,
        success: false,
        error: 'ElevenLabs TTS service not initialized'
      };
    }

    try {
      // Validate request
      if (!request.text || request.text.trim().length === 0) {
        throw new Error('Text is required and cannot be empty');
      }

      if (!request.voiceId) {
        throw new Error('Voice ID is required for ElevenLabs TTS');
      }

      const maxLength = request.maxTextLength || CVO_config.defaultMaxTextLength;
      if (request.text.length > maxLength) {
        throw new Error(`Text too long. Maximum length: ${maxLength} characters`);
      }

      // Prepare ElevenLabs TTS request
      const voiceId = request.voiceId;
      const format = request.format || CVO_config.defaultFormat;
      
      // Map language to EL_Languages enum
      let language: EL_Languages;
      switch (request.language || CVO_config.defaultLanguage) {
        case 'en':
          language = EL_Languages.english;
          break;

        case 'es':
          language = EL_Languages.spanish;
          break;

        case 'fr':
          language = EL_Languages.french;
          break;

        case 'de':
          language = EL_Languages.german;
          break;

        case 'it':
          language = EL_Languages.italian;
          break;

        case 'pt':
          language = EL_Languages.portuguese;
          break;

        case 'ru':
          language = EL_Languages.russian;
          break;

        case 'ja':
          language = EL_Languages.japanese;
          break;

        case 'ko':
          language = EL_Languages.korean;
          break;

        case 'zh':
          language = EL_Languages.chinese;
          break;

        default:
          language = EL_Languages.english;
      }
      
      // Map CVO_VoiceModel to EL_TextToSpeechModels
      let model: EL_TextToSpeechModels;
      switch (request.model) {
        case CVO_VoiceModel.elevenMultilingualV1:
          model = EL_TextToSpeechModels.multilingualV1;
          break;

        case CVO_VoiceModel.elevenEnglishV1:
          model = EL_TextToSpeechModels.englishV1;
          break;

        case CVO_VoiceModel.elevenEnglishV2:
          model = EL_TextToSpeechModels.englishV2;
          break;

        default:
          model = EL_TextToSpeechModels.multilingualV2;
      }

      DyFM_Log.info(`🔊 Making ElevenLabs TTS API call with model: ${model}, voice: ${voiceId}, format: ${format}`);

      // Prepare voice settings
      const voiceSettings = {
        stability: request.voiceSettings?.stability || CVO_config.defaultVoiceSettings.stability,
        similarityBoost: request.voiceSettings?.similarityBoost || CVO_config.defaultVoiceSettings.similarityBoost,
        style: request.voiceSettings?.style || CVO_config.defaultVoiceSettings.style,
        useSpeakerBoost: request.voiceSettings?.useSpeakerBoost || CVO_config.defaultVoiceSettings.useSpeakerBoost
      };

      // Use the existing ElevenLabs service
      const elRequest = {
        text: request.text,
        voiceId: voiceId,
        model: model,
        language: language,
        outputFormat: format,
        voiceSettings: voiceSettings,
        maxTextLength: request.maxTextLength,
        timeout: request.timeout,
        maxRetries: request.maxRetries
      };

      const response = await this.elevenlabs_AS.convertTextToSpeech(elRequest);
      const audioBuffer = response.audioBuffer;

      return {
        provider: CVO_TextToSpeechService.elevenlabs,
        audioBuffer,
        format: format,
        success: true,
        characterCount: request.text.length,
        language: language,
        rawResponse: response
      };

    } catch (error) {
      DyFM_Error.logSimple('❌ ElevenLabs TTS conversion failed:', error);
      
      return {
        provider: CVO_TextToSpeechService.elevenlabs,
        format: request.format || CVO_config.defaultFormat,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown ElevenLabs TTS error'
      };
    }
  }

  /**
   * Check if the selected provider is available
   * @param provider - Text-to-speech provider
   * @returns true if provider is available
   */
  async isProviderAvailable(provider: CVO_TextToSpeechService): Promise<boolean> {
    try {
      switch (provider) {
        case CVO_TextToSpeechService.openai:
          return !!(envKeys.openAi.apiKey && this.openai_AS);

        case CVO_TextToSpeechService.elevenlabs:
          return !!(envKeys.elevenLabs.apiKey && this.elevenlabs_AS);

        default:
          return false;
      }
    } catch (error) {
      DyFM_Error.logSimple(`❌ Provider availability check failed for ${provider}:`, error);
      
      return false;
    }
  }

  /**
   * Convert text to speech with fallback providers
   * @param request - Text-to-speech request
   * @returns Unified response
   */
  async convertTextToSpeechWithFallback(request: CVO_TextToSpeechRequest): Promise<CVO_UnifiedTextToSpeechResponse> {
    const providers = [CVO_TextToSpeechService.openai, CVO_TextToSpeechService.elevenlabs];
    
    for (const provider of providers) {
      const isAvailable = await this.isProviderAvailable(provider);
      if (isAvailable) {
        try {
          const response = await this.convertTextToSpeech({
            ...request,
            service: provider
          });
          
          if (response.success) {
            return response;
          }
        } catch (error) {
          DyFM_Log.warn(`⚠️  Provider ${provider} failed, trying next provider:`, error);
        }
      }
    }
    
    throw new Error('No available text-to-speech providers');
  }
} 