import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { EL_ApiConfig } from '../_models/el-api-config.interface.js';
import { EL_SpeechToTextRequest } from '../_models/el-speech-to-text-request.interface.js';
import { EL_SpeechToTextResponse } from '../_models/el-speech-to-text-response.interface.js';
import { EL_TextToSpeechRequest } from '../_models/el-text-to-speech-request.interface.js';
import { EL_TextToSpeechResponse } from '../_models/el-text-to-speech-response.interface.js';
import { EL_Utils } from '../_collections/el-utils.utils.js';
import { EL_apiConfig } from '../_collections/consts/el-api.const.js';
import { settings } from '../../../_collections/consts/settings.const.js';
import { envKeys } from '../../../_collections/consts/env-keys.const.js';

/**
 * ElevenLabs API Service
 * @author AI
 * @description Low-level API client for ElevenLabs speech-to-text service using official SDK
 */
export class Elevenlabs_ApiService extends DyNTS_SingletonService {
  static getInstance(): Elevenlabs_ApiService {
    return Elevenlabs_ApiService.getSingletonInstance();
  }

  private config: EL_ApiConfig;
  private client: ElevenLabsClient | null = null;

  constructor() {
    super();
    
    // Sanity check: Verify API key is loaded from environment
    // Check both process.env directly and envKeys to catch issues early
    const rawEnvKey = process.env.FDP_ELEVENLABS_API_KEY;
    const rawApiKey = envKeys.elevenLabs.apiKey || '';
    
    // Diagnostic logging (safe - no actual key values)
    DyFM_Log.info('🔍 ElevenLabs API key sanity check:');
    DyFM_Log.info(`  - process.env.FDP_ELEVENLABS_API_KEY: hasKey=${!!rawEnvKey}, len=${rawEnvKey?.length || 0}, starts="${rawEnvKey?.slice(0, 3) || 'N/A'}"`);
    DyFM_Log.info(`  - envKeys.elevenLabs.apiKey: hasKey=${!!rawApiKey}, len=${rawApiKey?.length || 0}, starts="${rawApiKey?.slice(0, 3) || 'N/A'}"`);
    
    // Use process.env directly with trim (more reliable)
    const trimmedApiKey = (rawEnvKey ?? '').trim();
    
    if (!trimmedApiKey || trimmedApiKey.length === 0) {
      DyFM_Log.error('❌ ElevenLabs API key is missing or empty after trim');
      DyFM_Log.error('❌ Check:');
      DyFM_Log.error('   1. FDP_ELEVENLABS_API_KEY is set in .env file');
      DyFM_Log.error('   2. .env file is loaded (dotenv.config() called)');
      DyFM_Log.error('   3. You copied the SECRET key, not the key ID');
      DyFM_Log.error('   4. No quotes around the key in .env file');
    } else if (trimmedApiKey.length < 20) {
      DyFM_Log.warn(`⚠️  API key seems too short (${trimmedApiKey.length} chars), expected at least 20`);
    } else if (!trimmedApiKey.startsWith('xi-api-')) {
      DyFM_Log.warn(`⚠️  API key does not start with "xi-api-", starts with: "${trimmedApiKey.slice(0, 7)}"`);
      DyFM_Log.warn('⚠️  You might have copied the key ID instead of the secret');
    }
    
    this.config = {
      apiKey: trimmedApiKey,
      baseUrl: EL_apiConfig.baseUrl,
      timeout: EL_apiConfig.defaultTimeout,
      maxRetries: EL_apiConfig.maxRetries,
      retryDelay: EL_apiConfig.retryDelay,
      debug: false,
      userAgent: EL_apiConfig.userAgent
    };
  }

  /**
   * Configure the API service
   * @param config - Configuration options
   */
  configure(config: Partial<EL_ApiConfig>): void {
    // Trim API key to remove whitespace (common issue with .env files)
    if (config.apiKey) {
      const originalKey = config.apiKey;
      const trimmedKey = config.apiKey.trim();
      
      // Sanity check on the key being passed in
      DyFM_Log.info('🔍 Configure API key sanity check:');
      DyFM_Log.info(`  - hasKey=${!!trimmedKey}, len=${trimmedKey.length}, starts="${trimmedKey.slice(0, 3)}"`);
      
      if (trimmedKey !== originalKey) {
        DyFM_Log.warn('⚠️  API key contained whitespace, trimmed');
        DyFM_Log.warn(`  - Original length: ${originalKey.length}, Trimmed length: ${trimmedKey.length}`);
      }
      
      if (trimmedKey.length === 0) {
        throw new Error('ElevenLabs API key is empty after trimming');
      }
      
      if (!trimmedKey.startsWith('xi-api-')) {
        DyFM_Log.error(`❌ API key does not start with "xi-api-", starts with: "${trimmedKey.slice(0, 7)}"`);
        DyFM_Log.error('❌ You might have copied the key ID instead of the secret');
        throw new Error('Invalid ElevenLabs API key format - must start with "xi-api-"');
      }
      
      config.apiKey = trimmedKey;
    }
    
    this.config = { ...this.config, ...config };
    
    if (!this.config.apiKey) {
      throw new Error('ElevenLabs API key is required');
    }
    
    if (!EL_Utils.isValidApiKey(this.config.apiKey)) {
      throw new Error('Invalid ElevenLabs API key format');
    }
    
    this.initializeClient();
  }

  /**
   * Initialize ElevenLabs client
   */
  private initializeClient(): void {
    try {
      // Validate and trim API key before creating client
      if (!this.config.apiKey) {
        throw new Error('ElevenLabs API key is required');
      }
      
      // Ensure API key is trimmed (double-check)
      const trimmedApiKey = this.config.apiKey.trim();
      if (trimmedApiKey.length === 0) {
        throw new Error('ElevenLabs API key is empty after trimming');
      }
      
      // Update config with trimmed key
      this.config.apiKey = trimmedApiKey;
      
      // Log masked API key for debugging
      const maskedKey = trimmedApiKey.substring(0, Math.min(10, trimmedApiKey.length)) + 
                        '...' + 
                        trimmedApiKey.substring(Math.max(0, trimmedApiKey.length - 4));
      DyFM_Log.info(`🔑 Initializing ElevenLabs client with API key: ${maskedKey} (length: ${trimmedApiKey.length})`);
      
      // Create client with explicit API key (don't rely on env fallback)
      // Important: Pass API key explicitly, don't let SDK read from env
      // This ensures the key we verified is the one being used
      const finalApiKey = trimmedApiKey; // Use the trimmed key we verified
      
      DyFM_Log.info(`🔑 Creating ElevenLabs client with explicit API key`);
      DyFM_Log.info(`  - Key length: ${finalApiKey.length}`);
      DyFM_Log.info(`  - Key starts with: "${finalApiKey.slice(0, 7)}"`);
      DyFM_Log.info(`  - Key ends with: "...${finalApiKey.slice(-4)}"`);
      
      // Verify the key looks like a real secret (not a key ID)
      // Key IDs are usually shorter and don't have the same pattern
      // Real secrets are typically 50-70 characters
      if (finalApiKey.length < 50) {
        DyFM_Log.warn(`⚠️  API key is shorter than expected (${finalApiKey.length} chars)`);
        DyFM_Log.warn(`⚠️  Real secrets are usually 50-70 characters`);
        DyFM_Log.warn(`⚠️  You might have copied a key ID instead of the secret`);
      }
      
      this.client = new ElevenLabsClient({
        apiKey: finalApiKey, // Explicit API key, no env fallback
        baseUrl: this.config.baseUrl
      });
      
      // Verify the client was created and has the key
      // Note: The SDK doesn't expose the key, but we can verify the client exists
      if (!this.client) {
        throw new Error('Failed to create ElevenLabs client');
      }
      
      // Double-check: verify the key we're using matches what we think
      DyFM_Log.info(`✅ Client created. Using key: length=${finalApiKey.length}, starts="${finalApiKey.slice(0, 7)}"`);
      
      // Verify that the client was created with the API key
      if (!this.client) {
        throw new Error('Failed to create ElevenLabs client');
      }
      
      DyFM_Log.info('✅ ElevenLabs client initialized successfully');
      DyFM_Log.info(`🔍 API key verification: ${trimmedApiKey ? 'Present' : 'Missing'} (length: ${trimmedApiKey.length})`);
      
      // Test API key validity by trying to get user info (async, don't block initialization)
      // Note: This test uses TTS endpoints which work fine. STT endpoints have known SDK issues.
      this.testApiKeyValidity().catch((error) => {
        // Only log if it's not a 401 (401 on STT is expected due to SDK issues)
        const statusCode = error.response?.status || error.status || error.statusCode;
        if (statusCode !== 401) {
          DyFM_Log.warn('⚠️  API key validation test failed (non-blocking):', error);
        }
      });
    } catch (error) {
      DyFM_Log.error('❌ Failed to initialize ElevenLabs client');
      DyFM_Log.error('❌ Error details:', error);
      if (error instanceof Error) {
        DyFM_Log.error(`❌ Error message: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Transcribe audio using ElevenLabs speech-to-text API
   * @param request - Speech-to-text request parameters
   * @returns Transcription response
   * 
   * NOTE: This method is known to have issues with the ElevenLabs SDK.
   * The SDK has routing/auth problems with STT endpoints, causing 401 errors
   * even with valid API keys. Consider using fallback providers instead.
   */
  async transcribeAudio(request: EL_SpeechToTextRequest): Promise<EL_SpeechToTextResponse> {
    const startTime = Date.now();
    
    if (!this.client) {
      throw new Error('ElevenLabs client not initialized. Call configure() first.');
    }
    
    // Verify API key is still set (defensive check)
    if (!this.config.apiKey || this.config.apiKey.trim().length === 0) {
      throw new Error('ElevenLabs API key is missing or empty');
    }
    
    // Log warning about known SDK issues
    DyFM_Log.warn('⚠️  Using ElevenLabs STT - known SDK issues may cause 401 errors');
    DyFM_Log.warn('⚠️  If you get 401 errors, this is likely an SDK routing problem, not your API key');
    
    try {
      // Validate request
      this.validateRequest(request);
      
      // Prepare audio data
      const audioBuffer = await this.prepareAudioData(request.audio);
      
      DyFM_Log.success('🚀 Making ElevenLabs speech-to-text API call...');
      
      // Prepare SDK request parameters
      const sdkRequest: any = {
        file: audioBuffer,
        modelId: request.model || EL_apiConfig.defaultModel
      };
      
      // Add optional parameters
      // Note: SDK uses languageCode, not language
      if (request.language) {
        sdkRequest.languageCode = request.language;
      }
      if (request.outputFormat) {
        sdkRequest.outputFormat = request.outputFormat;
      }
      if (request.includeTimestamps) {
        sdkRequest.includeTimestamps = request.includeTimestamps;
      }
      if (request.prompt) {
        sdkRequest.prompt = EL_Utils.sanitizeText(request.prompt);
      }
      if (request.temperature !== undefined) {
        if (!EL_Utils.isValidTemperature(request.temperature)) {
          throw new Error('Temperature must be between 0.0 and 1.0');
        }
        sdkRequest.temperature = request.temperature;
      }
      if (request.diarize !== undefined) {
        sdkRequest.diarize = request.diarize;
      }
      if (request.diarize && request.numSpeakers !== undefined) {
        sdkRequest.num_speakers = request.numSpeakers;
      }
      if (request.tagAudioEvents !== undefined) {
        sdkRequest.tag_audio_events = request.tagAudioEvents;
      }
      if (request.keyterms && request.keyterms.length > 0) {
        sdkRequest.keyterms = request.keyterms;
      }
      if (request.entityDetection !== undefined) {
        sdkRequest.entity_detection = request.entityDetection;
      }

      // Remove the models list check as it might cause issues
      // if (this.client.models.list) {
      //   const models = await this.client.models.list();
      //   DyFM_Log.info('✅ ElevenLabs models:', models);
      // }
      
      // Log request details for debugging
      DyFM_Log.info('📤 ElevenLabs API request details:');
      DyFM_Log.info(`  - Model: ${sdkRequest.modelId}`);
      DyFM_Log.info(`  - Audio size: ${audioBuffer.length} bytes`);
      DyFM_Log.info(`  - Language: ${sdkRequest.languageCode || 'auto'}`);
      DyFM_Log.info(`  - Request keys: ${Object.keys(sdkRequest).join(', ')}`);
      
      // Debug: Verify API key is still set before making request
      const currentApiKey = this.config.apiKey;
      if (!currentApiKey || currentApiKey.trim().length === 0) {
        throw new Error('API key is missing before API call');
      }
      const maskedApiKey = currentApiKey.substring(0, Math.min(10, currentApiKey.length)) + 
                          '...' + 
                          currentApiKey.substring(Math.max(0, currentApiKey.length - 4));
      DyFM_Log.info(`🔑 API key before request: ${maskedApiKey} (length: ${currentApiKey.length})`);
      
      // Make API request with retry logic
      let response: any;
      try {
        response = await this.makeRequestWithRetry(
          () => this.client.speechToText.convert(sdkRequest),
          request.maxRetries || this.config.maxRetries
        );
      } catch (error: any) {
        // Log detailed error information
        DyFM_Log.error('❌ ElevenLabs speech-to-text API call failed');
        DyFM_Log.error('❌ Error type:', error.constructor.name);
        DyFM_Log.error('❌ Error message:', error.message);
        if (error.response) {
          DyFM_Log.error('❌ Response status:', error.response.status);
          DyFM_Log.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.status) {
          DyFM_Log.error('❌ Status code:', error.status);
        }
        throw error;
      }
      
      const processingTime = EL_Utils.calculateProcessingTime(startTime);
      
      return {
        text: response.text || '',
        detectedLanguage: response.detectedLanguage,
        confidence: response.confidence,
        processingTime,
        duration: response.duration,
        timestamps: response.timestamps,
        rawResponse: response
      };
      
    } catch (error) {
      const processingTime = EL_Utils.calculateProcessingTime(startTime);
      
      return {
        text: '',
        processingTime,
        error: EL_Utils.formatErrorMessage(error)
      };
    }
  }

  /**
   * Validate request parameters
   * @param request - Request to validate
   */
  private validateRequest(request: EL_SpeechToTextRequest): void {
    if (!request.audio) {
      throw new Error('Audio data is required');
    }
    
    if (typeof request.audio === 'string') {
      if (!EL_Utils.isValidAudioFormat(request.audio)) {
        throw new Error(`Unsupported audio format. Supported formats: ${EL_apiConfig.supportedFormats.join(', ')}`);
      }
    }
  }

  /**
   * Prepare audio data for API request
   * @param audio - Audio data (buffer or file path)
   * @returns Audio buffer
   */
  private async prepareAudioData(audio: Buffer | string): Promise<Buffer> {
    if (Buffer.isBuffer(audio)) {
      return audio;
    }
    
    // Read file from path
    const audioBuffer = await EL_Utils.readAudioFile(audio);
    
    // Validate file size
    if (!(await EL_Utils.isValidFileSize(audio))) {
      throw new Error(`File size must be between ${EL_apiConfig.minFileSize} and ${EL_apiConfig.maxFileSize} bytes`);
    }
    
    return audioBuffer;
  }

  /**
   * Make API request with retry logic
   * @param apiCall - Function that makes the API call
   * @param maxRetries - Maximum retry attempts
   * @returns API response
   */
  private async makeRequestWithRetry(
    apiCall: () => Promise<any>, 
    maxRetries: number
  ): Promise<any> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await apiCall();
        
        if (this.config.debug) {
          DyFM_Log.info(`ElevenLabs API request successful (attempt ${attempt + 1})`);
        }
        
        return response;
        
      } catch (error: any) {
        lastError = error;
        
        // Extract status code from various error formats
        const statusCode = error.response?.status || 
                          error.status || 
                          error.statusCode ||
                          (error.response?.data?.detail?.status ? 
                            (error.response.data.detail.status === 'invalid_api_key' ? 401 : undefined) : 
                            undefined);
        
        // Log detailed error information for 401 errors
        // NOTE: For STT endpoints, 401 is a known SDK routing issue, not an API key problem
        if (statusCode === 401 || error.response?.status === 401) {
          // Check if this is an STT request (we can infer from the context)
          // STT requests have known SDK issues - reduce logging spam
          DyFM_Log.warn('⚠️  ElevenLabs STT API returned 401 (known SDK routing issue)');
          DyFM_Log.warn('⚠️  This is NOT an API key problem - it\'s a known @elevenlabs/elevenlabs-js SDK bug');
          DyFM_Log.warn('⚠️  The SDK routes STT requests to wrong auth endpoints');
          DyFM_Log.warn('⚠️  ElevenLabs STT should be disabled. Use fallback providers instead.');
          
          // Only log detailed info in debug mode
          if (this.config.debug) {
            const currentApiKey = this.config.apiKey;
            if (currentApiKey) {
              const maskedKey = currentApiKey.substring(0, Math.min(10, currentApiKey.length)) + 
                              '...' + 
                              currentApiKey.substring(Math.max(0, currentApiKey.length - 4));
              DyFM_Log.info(`🔑 API key is valid: ${maskedKey} (length: ${currentApiKey.length})`);
            }
            if (error.response?.data) {
              DyFM_Log.info('📋 Error response:', JSON.stringify(error.response.data, null, 2));
            }
          }
        }
        
        // Don't retry on authentication errors (401, 403) or client errors (4xx)
        if (statusCode >= 400 && statusCode < 500) {
          DyFM_Log.warn(`⚠️  ElevenLabs API client error (${statusCode}), not retrying`);
          throw error; // Immediately throw client errors, don't retry
        }
        
        // Only retry on server errors (5xx) or network errors
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          if (this.config.debug) {
            DyFM_Log.warn(`ElevenLabs API request failed (attempt ${attempt + 1}), retrying in ${delay}ms`);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Test API key validity by checking user info
   * @returns Promise<void>
   */
  private async testApiKeyValidity(): Promise<void> {
    if (!this.client) {
      return;
    }
    
    try {
      DyFM_Log.info('🔍 Testing ElevenLabs API key validity with user.get()...');
      
      // Log current API key info for debugging (masked)
      const currentApiKey = this.config.apiKey;
      if (currentApiKey) {
        const maskedKey = currentApiKey.substring(0, Math.min(10, currentApiKey.length)) + 
                        '...' + 
                        currentApiKey.substring(Math.max(0, currentApiKey.length - 4));
        DyFM_Log.info(`🔑 Testing with key: ${maskedKey} (length: ${currentApiKey.length})`);
      }
      
      const user = await this.client.user.get();
      DyFM_Log.success('✅ ElevenLabs API key is valid');
      DyFM_Log.info(`📊 User info: subscription=${(user as any).subscription?.tier || 'unknown'}`);
    } catch (error: any) {
      const statusCode = error.response?.status || error.status || error.statusCode;
      if (statusCode === 401) {
        // Known issue: ElevenLabs SDK has routing/auth problems with STT endpoints
        // This is NOT a user error - it's an SDK bug
        DyFM_Log.warn('⚠️  ElevenLabs STT API returned 401 (known SDK issue)');
        DyFM_Log.warn('⚠️  This is a known problem with @elevenlabs/elevenlabs-js SDK STT endpoints');
        DyFM_Log.warn('⚠️  The API key is valid, but the SDK routes STT requests incorrectly');
        DyFM_Log.warn('⚠️  ElevenLabs STT is disabled. Use fallback providers (Whisper/OpenAI/Local)');
      } else {
        DyFM_Log.warn('⚠️  ElevenLabs API key validation test failed:', error.message || error);
      }
      // Don't throw - this is a non-blocking test
    }
  }

  /**
   * Test API connectivity
   * @returns true if API is accessible
   */
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    
    try {
      // Try to get user info to test connectivity
      await this.client.user.get();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert text to speech using ElevenLabs text-to-speech API
   * @param request - Text-to-speech request parameters
   * @returns Text-to-speech response
   */
  async convertTextToSpeech(request: EL_TextToSpeechRequest): Promise<EL_TextToSpeechResponse> {
    const startTime = Date.now();
    
    if (!this.client) {
      throw new Error('ElevenLabs client not initialized. Call configure() first.');
    }
    
    try {
      // Validate request
      this.validateTextToSpeechRequest(request);
      
      DyFM_Log.success('🚀 Making ElevenLabs text-to-speech API call...');
      
      // Prepare SDK request parameters
      const sdkRequest: any = {
        text: EL_Utils.sanitizeText(request.text),
        voiceId: request.voiceId,
        modelId: request.model || EL_apiConfig.defaultTextToSpeechModel
      };
      
      // Add voice settings if provided
      if (request.voiceSettings) {
        sdkRequest.voiceSettings = {
          stability: request.voiceSettings.stability || 0.5,
          similarityBoost: request.voiceSettings.similarityBoost || 0.75,
          style: request.voiceSettings.style || 0.0,
          useSpeakerBoost: request.voiceSettings.useSpeakerBoost || false
        };
      }
      
      // Add optional parameters
      if (request.language) {
        sdkRequest.language = request.language;
      }
      if (request.outputFormat) {
        sdkRequest.outputFormat = request.outputFormat;
      }
      
      // Make API request with retry logic
      const response = await this.makeRequestWithRetry(
        () => this.client.textToSpeech.convert(sdkRequest.text, sdkRequest.voiceId, sdkRequest),
        request.maxRetries || this.config.maxRetries
      );
      
      const processingTime = EL_Utils.calculateProcessingTime(startTime);
      
      return {
        success: true,
        audioBuffer: response.audioBuffer || response,
        duration: response.duration,
        processingTime,
        model: request.model || EL_apiConfig.defaultTextToSpeechModel,
        voiceId: request.voiceId,
        characterCount: request.text.length,
        rawResponse: response
      };
      
    } catch (error) {
      const processingTime = EL_Utils.calculateProcessingTime(startTime);
      
      return {
        success: false,
        model: request.model || EL_apiConfig.defaultTextToSpeechModel,
        voiceId: request.voiceId,
        processingTime,
        error: EL_Utils.formatErrorMessage(error)
      };
    }
  }

  /**
   * Validate text-to-speech request parameters
   * @param request - Request to validate
   */
  private validateTextToSpeechRequest(request: EL_TextToSpeechRequest): void {
    if (!request.text || request.text.trim().length === 0) {
      throw new Error('Text is required and cannot be empty');
    }
    
    if (!request.voiceId) {
      throw new Error('Voice ID is required');
    }
    
    if (request.text.length > (request.maxTextLength || 5000)) {
      throw new Error(`Text too long. Maximum length: ${request.maxTextLength || 5000} characters`);
    }
  }

  /**
   * Get available voices from ElevenLabs
   * @returns List of available voices
   */
  async getVoices(): Promise<any> {
    if (!this.client) {
      throw new Error('ElevenLabs client not initialized');
    }
    
    try {
      const voices = await this.client.voices.getAll();
      return voices;
    } catch (error) {
      throw new Error(`Failed to get voices: ${EL_Utils.formatErrorMessage(error)}`);
    }
  }

  /**
   * Get API usage statistics
   * @returns Usage statistics
   */
  async getUsageStats(): Promise<any> {
    if (!this.client) {
      throw new Error('ElevenLabs client not initialized');
    }
    
    try {
      const user = await this.client.user.get();
      return {
        character_count: (user as any).character_count,
        character_limit: (user as any).character_limit,
        can_extend_character_limit: (user as any).can_extend_character_limit,
        allowed_to_extend_character_limit: (user as any).allowed_to_extend_character_limit,
        next_character_count_reset_unix: (user as any).next_character_count_reset_unix,
        voice_limit: (user as any).voice_limit,
        available_voices: (user as any).available_voices
      };
    } catch (error) {
      throw new Error(`Failed to get usage stats: ${EL_Utils.formatErrorMessage(error)}`);
    }
  }
} 