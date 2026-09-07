import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { Elevenlabs_ApiService } from './el.api-service.js';
import { EL_SpeechToTextRequest } from '../_models/el-speech-to-text-request.interface.js';
import { EL_SpeechToTextResponse } from '../_models/el-speech-to-text-response.interface.js';
import { EL_SpeechToTextModels } from '../_enums/el-speech-to-text-models.enum.js';
import { EL_Languages } from '../_enums/el-languages.enum.js';
import { EL_OutputFormats } from '../_enums/el-output-formats.enum.js';
import { EL_Utils } from '../_collections/el-utils.utils.js';
import { EL_apiConfig } from '../_collections/consts/el-api.const.js';

/**
 * ElevenLabs Speech-to-Text Control Service
 * @author AI
 * @description High-level service for ElevenLabs speech-to-text functionality
 */
export class EL_SpeechToText_ControlService extends DyNTS_SingletonService {
  static getInstance(): EL_SpeechToText_ControlService {
    return EL_SpeechToText_ControlService.getSingletonInstance();
  }

  private readonly elevenlabe_AS: Elevenlabs_ApiService = Elevenlabs_ApiService.getInstance();

  /**
   * Initialize the service with API configuration
   * @param apiKey - ElevenLabs API key
   * @param config - Additional configuration options
   */
  initialize(apiKey: string, config?: Partial<{
    baseUrl: string;
    timeout: number;
    maxRetries: number;
    retryDelay: number;
    debug: boolean;
  }>): void {
    if (!EL_Utils.isValidApiKey(apiKey)) {
      throw new Error('Invalid ElevenLabs API key format. Must start with "xi-api-"');
    }

    this.elevenlabe_AS.configure({
      apiKey,
      ...config
    });

    DyFM_Log.info('✅ ElevenLabs Speech-to-Text service initialized');
  }

  /**
   * Transcribe audio file with default settings
   * @param audioPath - Path to audio file
   * @returns Transcription response
   */
  async transcribeFile(audioPath: string): Promise<EL_SpeechToTextResponse> {
    return this.transcribeAudio({
      audio: audioPath,
      model: EL_apiConfig.defaultModel,
      language: EL_apiConfig.defaultLanguage,
      outputFormat: EL_apiConfig.defaultOutputFormat,
      temperature: EL_apiConfig.defaultTemperature
    });
  }

  /**
   * Transcribe audio buffer with default settings
   * @param audioBuffer - Audio buffer
   * @returns Transcription response
   */
  async transcribeBuffer(audioBuffer: Buffer): Promise<EL_SpeechToTextResponse> {
    return this.transcribeAudio({
      audio: audioBuffer,
      model: EL_apiConfig.defaultModel,
      language: EL_apiConfig.defaultLanguage,
      outputFormat: EL_apiConfig.defaultOutputFormat,
      temperature: EL_apiConfig.defaultTemperature
    });
  }

  /**
   * Transcribe audio with custom parameters
   * @param request - Speech-to-text request parameters
   * @returns Transcription response
   */
  async transcribeAudio(request: EL_SpeechToTextRequest): Promise<EL_SpeechToTextResponse> {
    const startTime = Date.now();
    
    try {
      DyFM_Log.info('🎤 Starting ElevenLabs speech-to-text transcription...');
      
      // Validate audio format if it's a file path
      if (typeof request.audio === 'string') {
        if (!EL_Utils.isValidAudioFormat(request.audio)) {
          throw new Error(`Unsupported audio format. Supported formats: ${EL_apiConfig.supportedFormats.join(', ')}`);
        }
        DyFM_Log.info(`📁 Processing audio file: ${request.audio}`);
      } else {
        DyFM_Log.info(`📦 Processing audio buffer: ${request.audio.length} bytes`);
      }

      // Make API request
      const response = await this.elevenlabe_AS.transcribeAudio(request);
      
      const totalTime = EL_Utils.calculateProcessingTime(startTime);
      
      if ((response as any).error) {
        DyFM_Log.error(`❌ Transcription failed: ${(response as any).error}`);
        return response;
      }
      
      DyFM_Log.success(`✅ Transcription completed successfully`);
      DyFM_Log.info(`📊 Results:`);
      DyFM_Log.info(`  - Text: ${response.text}`);
      DyFM_Log.info(`  - Language: ${response.detectedLanguage || 'Unknown'}`);
      DyFM_Log.info(`  - Confidence: ${response.confidence?.toFixed(3) || 'N/A'}`);
      DyFM_Log.info(`  - Duration: ${response.duration?.toFixed(2)}s`);
      DyFM_Log.info(`  - Processing time: ${response.processingTime}ms`);
      DyFM_Log.info(`  - Total time: ${totalTime}ms`);
      
      return response;
      
    } catch (error) {
      const totalTime = EL_Utils.calculateProcessingTime(startTime);
      DyFM_Log.error(`❌ Transcription failed after ${totalTime}ms:`, error);
      
      return {
        text: '',
        processingTime: totalTime,
        error: EL_Utils.formatErrorMessage(error)
      } as EL_SpeechToTextResponse;
    }
  }

  /**
   * Transcribe audio with specific language
   * @param audio - Audio data (file path or buffer)
   * @param language - Target language
   * @returns Transcription response
   */
  async transcribeWithLanguage(
    audio: string | Buffer, 
    language: EL_Languages
  ): Promise<EL_SpeechToTextResponse> {
    return this.transcribeAudio({
      audio,
      language,
      model: EL_apiConfig.defaultModel,
      outputFormat: EL_apiConfig.defaultOutputFormat,
      temperature: EL_apiConfig.defaultTemperature
    });
  }

  /**
   * Transcribe audio with timestamps
   * @param audio - Audio data (file path or buffer)
   * @param includeTimestamps - Whether to include timestamps
   * @returns Transcription response
   */
  async transcribeWithTimestamps(
    audio: string | Buffer, 
    includeTimestamps: boolean = true
  ): Promise<EL_SpeechToTextResponse> {
    return this.transcribeAudio({
      audio,
      includeTimestamps,
      model: EL_apiConfig.defaultModel,
      language: EL_apiConfig.defaultLanguage,
      outputFormat: includeTimestamps ? EL_OutputFormats.json : EL_apiConfig.defaultOutputFormat,
      temperature: EL_apiConfig.defaultTemperature
    });
  }

  /**
   * Transcribe audio with custom prompt
   * @param audio - Audio data (file path or buffer)
   * @param prompt - Custom prompt to guide transcription
   * @returns Transcription response
   */
  async transcribeWithPrompt(
    audio: string | Buffer, 
    prompt: string
  ): Promise<EL_SpeechToTextResponse> {
    return this.transcribeAudio({
      audio,
      prompt: EL_Utils.sanitizeText(prompt),
      model: EL_apiConfig.defaultModel,
      language: EL_apiConfig.defaultLanguage,
      outputFormat: EL_apiConfig.defaultOutputFormat,
      temperature: EL_apiConfig.defaultTemperature
    });
  }

  /**
   * Transcribe audio with specific model
   * @param audio - Audio data (file path or buffer)
   * @param model - Speech-to-text model to use
   * @returns Transcription response
   */
  async transcribeWithModel(
    audio: string | Buffer, 
    model: EL_SpeechToTextModels
  ): Promise<EL_SpeechToTextResponse> {
    return this.transcribeAudio({
      audio,
      model,
      language: EL_apiConfig.defaultLanguage,
      outputFormat: EL_apiConfig.defaultOutputFormat,
      temperature: EL_apiConfig.defaultTemperature
    });
  }

  /**
   * Batch transcribe multiple audio files
   * @param audioFiles - Array of audio file paths
   * @param options - Transcription options
   * @returns Array of transcription responses
   */
  async batchTranscribe(
    audioFiles: string[],
    options?: Partial<{
      model: EL_SpeechToTextModels;
      language: EL_Languages;
      outputFormat: EL_OutputFormats;
      includeTimestamps: boolean;
      prompt: string;
      temperature: number;
      maxConcurrency: number;
    }>
  ): Promise<EL_SpeechToTextResponse[]> {
    const maxConcurrency = options?.maxConcurrency || 3;
    const results: EL_SpeechToTextResponse[] = [];
    
    DyFM_Log.info(`🔄 Starting batch transcription of ${audioFiles.length} files with max concurrency: ${maxConcurrency}`);
    
    // Process files in batches
    for (let i = 0; i < audioFiles.length; i += maxConcurrency) {
      const batch = audioFiles.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(filePath => 
        this.transcribeAudio({
          audio: filePath,
          model: options?.model || EL_apiConfig.defaultModel,
          language: options?.language || EL_apiConfig.defaultLanguage,
          outputFormat: options?.outputFormat || EL_apiConfig.defaultOutputFormat,
          includeTimestamps: options?.includeTimestamps || false,
          prompt: options?.prompt,
          temperature: options?.temperature || EL_apiConfig.defaultTemperature
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      DyFM_Log.info(`✅ Completed batch ${Math.floor(i / maxConcurrency) + 1}/${Math.ceil(audioFiles.length / maxConcurrency)}`);
    }
    
    const successCount = results.filter(r => !(r as any).error).length;
    const errorCount = results.filter(r => (r as any).error).length;
    
    DyFM_Log.success(`🎉 Batch transcription completed: ${successCount} successful, ${errorCount} failed`);
    
    return results;
  }

  /**
   * Test API connectivity
   * @returns true if API is accessible
   */
  /* async testConnection(): Promise<boolean> {
    try {
      const isConnected = await this.apiService.testConnection();
      if (isConnected) {
        DyFM_Log.success('✅ ElevenLabs API connection test successful');
      } else {
        DyFM_Log.error('❌ ElevenLabs API connection test failed');
      }
      return isConnected;
    } catch (error) {
      DyFM_Log.error('❌ ElevenLabs API connection test failed:', error);
      return false;
    }
  } */

  /**
   * Get API usage statistics
   * @returns Usage statistics
   */
  async getUsageStats(): Promise<any> {
    try {
      const stats = await this.elevenlabe_AS.getUsageStats();
      DyFM_Log.info('📊 ElevenLabs API usage statistics:', stats);
      return stats;
    } catch (error) {
      DyFM_Log.error('❌ Failed to get usage statistics:', error);
      throw error;
    }
  }

  /**
   * Validate audio file before processing
   * @param filePath - Path to audio file
   * @returns Validation result
   */
  async validateAudioFile(filePath: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check file format
    if (!EL_Utils.isValidAudioFormat(filePath)) {
      errors.push(`Unsupported audio format. Supported formats: ${EL_apiConfig.supportedFormats.join(', ')}`);
    }
    
    // Check file size
    const isValidSize = await EL_Utils.isValidFileSize(filePath);
    if (!isValidSize) {
      errors.push(`File size must be between ${EL_apiConfig.minFileSize} and ${EL_apiConfig.maxFileSize} bytes`);
    }
    
    // Check if file exists and is readable
    try {
      await EL_Utils.readAudioFile(filePath);
    } catch (error) {
      errors.push(`Cannot read audio file: ${error}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}