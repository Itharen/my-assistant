import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { settings } from '../../../_collections/consts/settings.const.js';
import { CV_Whisper_ApiService } from './cv-whisper.api-service.js';
import { CV_LocalSpeechRecognition_ApiService } from './cv-local-speech-recognition.api-service.js';
import { CV_ElevenLabsSpeechRecognition_ApiService } from './cv-elevenlabs-speech-recognition.api-service.js';
import { CV_WhisperResponse } from '../_models/cv-whisper-response.interface.js';
import { CV_LocalSpeechRecognitionResponse } from '../_models/cv-local-speech-recognition-response.interface.js';
import { EL_SpeechToTextResponse } from '../../elevenlabs/_models/el-speech-to-text-response.interface.js';
import { CV_SpeechRecognizerService } from '../_enums/cv-speech-recognizer-service.enum.js';
import { envKeys } from '../../../_collections/consts/env-keys.const.js';

/**
 * Unified Speech Recognition Response Interface
 */
export interface CV_UnifiedSpeechRecognitionResponse {
  /** Provider used for recognition */
  provider: CV_SpeechRecognizerService;
  
  /** Transcribed text */
  text: string;
  
  /** Confidence score (0.0 - 1.0) */
  confidence?: number;
  
  /** Language detected */
  language?: string;
  
  /** Detected language from the audio */
  detectedLanguage?: string;
  
  /** Processing time in milliseconds */
  processingTime?: number;
  
  /** Audio duration in seconds */
  duration?: number;
  
  /** Success status */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Raw response from the provider */
  rawResponse?: any;
}

/**
 * CCAP Unified Speech Recognition Control Service
 * @author AI
 * @description Unified speech recognition service that can handle multiple providers
 */
export class CV_UnifiedSpeechRecognition_ControlService extends DyNTS_SingletonService {
  
  static getInstance(): CV_UnifiedSpeechRecognition_ControlService {
    return CV_UnifiedSpeechRecognition_ControlService.getSingletonInstance();
  }

  private readonly whisper_AS: CV_Whisper_ApiService = CV_Whisper_ApiService.getInstance();
  private readonly localModel_AS: CV_LocalSpeechRecognition_ApiService = CV_LocalSpeechRecognition_ApiService.getInstance();
  private readonly elevenLabs_AS: CV_ElevenLabsSpeechRecognition_ApiService = CV_ElevenLabsSpeechRecognition_ApiService.getInstance();

  /**
   * Audio fájl beszéd felismerése a kiválasztott szolgáltatóval
   * Automatikusan fallback-et használ, ha az első szolgáltató sikertelen
   * @param filename - Audio fájl útvonala
   * @param userId - Discord felhasználó ID
   * @returns Egységesített felismerési eredmény
   */
  async recognizeAudioFile(
    filename: string, 
    userId: string
  ): Promise<CV_UnifiedSpeechRecognitionResponse | null> {
    const startTime = Date.now();
    const selectedProvider = settings.voice.speechRecognizer.selectedService;
    
    DyFM_Log.log(
      `🎤 [UNIFIED] Beszéd felismerés indítása (${userId}): ${filename} - Provider: ${selectedProvider}`
    );
    
    try {
      let result: CV_UnifiedSpeechRecognitionResponse | null = null;
      
      // First try the selected provider
      switch (selectedProvider) {
        case CV_SpeechRecognizerService.whisper:
          result = await this.recognizeWithWhisper(filename, userId);
          break;

        case CV_SpeechRecognizerService.elevenlabs:
          result = await this.recognizeWithElevenLabs(filename, userId);
          break;

        case CV_SpeechRecognizerService.local:
          result = await this.recognizeWithLocal(filename, userId);
          break;

        default:
          DyFM_Log.error(`❌ Ismeretlen beszéd felismerő szolgáltató: ${selectedProvider}`);
          return null;
      }
      
      // If selected provider succeeded, return the result
      if (result && result.success) {
        result.processingTime = Date.now() - startTime;
        DyFM_Log.testSuccess('result:\n', result);
        DyFM_Log.success(
          `✅ [UNIFIED] Beszéd felismerés sikeres (${userId}): ${result.provider} - ${result.text}`
        );
        return result;
      }
      
      // If selected provider failed, try fallback providers
      if (!result || !result.success) {
        DyFM_Log.warn(`⚠️  [FALLBACK] ${selectedProvider} sikertelen, próbálkozás más szolgáltatókkal (${userId})`);
        
        const fallbackProviders: CV_SpeechRecognizerService[] = [
          CV_SpeechRecognizerService.whisper, 
          CV_SpeechRecognizerService.elevenlabs, 
          CV_SpeechRecognizerService.local
        ];
        const currentIndex = fallbackProviders.indexOf(selectedProvider);
        
        // Try other providers in order
        for (let i = 0; i < fallbackProviders.length; i++) {
          if (i === currentIndex) continue; // Skip the already tried provider
          
          const fallbackProvider = fallbackProviders[i];
          DyFM_Log.info(`🔄 [FALLBACK] Próbálkozás: ${fallbackProvider} (${userId})`);
          
          try {
            switch (fallbackProvider) {
              case CV_SpeechRecognizerService.whisper:
                result = await this.recognizeWithWhisper(filename, userId);
                break;
                
              case CV_SpeechRecognizerService.elevenlabs:
                result = await this.recognizeWithElevenLabs(filename, userId);
                break;

              case CV_SpeechRecognizerService.local:
                result = await this.recognizeWithLocal(filename, userId);
                break;
            }
            
            if (result && result.success) {
              result.processingTime = Date.now() - startTime;
              DyFM_Log.success(
                `✅ [FALLBACK] Beszéd felismerés sikeres (${userId}): ${result.provider} - ${result.text}`
              );
              return result;
            }
          } catch (fallbackError) {
            DyFM_Log.warn(`⚠️  [FALLBACK] ${fallbackProvider} is sikertelen (${userId}):`, fallbackError);
            // Continue to next fallback provider
          }
        }
      }
      
      // All providers failed
      const processingTime = Date.now() - startTime;
      DyFM_Log.error(`❌ [UNIFIED] Minden beszéd felismerő szolgáltató sikertelen (${userId})`);
      
      return {
        provider: selectedProvider,
        text: '',
        success: false,
        error: result?.error || 'All speech recognition providers failed',
        processingTime
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      DyFM_Log.error(`❌ [UNIFIED] Hiba a beszéd felismerés során (${userId}):`, error);
      
      return {
        provider: selectedProvider,
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      };
    }
  }

  /**
   * Beszéd felismerés Whisper-rel
   * @param filename - Audio fájl útvonala
   * @param userId - Discord felhasználó ID
   * @returns Egységesített eredmény
   */
  private async recognizeWithWhisper(
    filename: string, 
    userId: string
  ): Promise<CV_UnifiedSpeechRecognitionResponse | null> {
    try {
      const whisperResponse = await this.whisper_AS.processWavFileWithWhisper(filename, userId);
      
      if (!whisperResponse || !whisperResponse.text) {
        return null;
      }
      
      return {
        provider: CV_SpeechRecognizerService.whisper,
        text: whisperResponse.text,
        confidence: 0.9, // Whisper doesn't provide confidence scores
        language: whisperResponse.language,
        duration: whisperResponse.duration,
        success: true,
        rawResponse: whisperResponse
      };
      
    } catch (error) {
      DyFM_Log.error(`❌ Whisper felismerés hiba (${userId}):`, error);
      return {
        provider: CV_SpeechRecognizerService.whisper,
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Beszéd felismerés ElevenLabs-szel
   * @param filename - Audio fájl útvonala
   * @param userId - Discord felhasználó ID
   * @returns Egységesített eredmény
   */
  private async recognizeWithElevenLabs(
    filename: string, 
    userId: string
  ): Promise<CV_UnifiedSpeechRecognitionResponse | null> {
    try {
      const elevenLabsResponse = await this.elevenLabs_AS.recognizeAudioFile(filename, userId);
      
      if (!elevenLabsResponse || !elevenLabsResponse.text) {
        return {
          provider: CV_SpeechRecognizerService.elevenlabs,
          text: '',
          success: false,
          error: 'No transcription text received from ElevenLabs'
        };
      }
      
      return {
        provider: CV_SpeechRecognizerService.elevenlabs,
        text: elevenLabsResponse.text,
        confidence: elevenLabsResponse.confidence,
        detectedLanguage: elevenLabsResponse.detectedLanguage,
        duration: elevenLabsResponse.duration,
        success: true,
        rawResponse: elevenLabsResponse
      };
      
    } catch (error) {
      // Don't log as error here, let the fallback mechanism handle it
      // The error is already logged in the ElevenLabs service
      return {
        provider: CV_SpeechRecognizerService.elevenlabs,
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Beszéd felismerés helyi API-val
   * @param filename - Audio fájl útvonala
   * @param userId - Discord felhasználó ID
   * @returns Egységesített eredmény
   */
  private async recognizeWithLocal(
    filename: string, 
    userId: string
  ): Promise<CV_UnifiedSpeechRecognitionResponse | null> {
    try {
      // For local API, skip classification by default to avoid double classification
      const localResponse = await this.localModel_AS.recognizeAudioFile(filename, userId, undefined, true);
      
      if (!localResponse || localResponse.status !== 'processed' || !localResponse.text) {
        return null;
      }
      
      return {
        provider: CV_SpeechRecognizerService.local,
        text: localResponse.text,
        confidence: localResponse.confidence,
        language: localResponse.result?.language,
        detectedLanguage: localResponse.result?.detected_language,
        success: true,
        rawResponse: localResponse
      };
      
    } catch (error) {
      DyFM_Log.error(`❌ Helyi felismerés hiba (${userId}):`, error);
      return {
        provider: CV_SpeechRecognizerService.local,
        text: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Ellenőrzi, hogy a kiválasztott szolgáltató elérhető-e
   * @returns Promise<boolean> true ha elérhető
   */
  async isSelectedProviderAvailable(): Promise<boolean> {
    const selectedProvider = settings.voice.speechRecognizer.selectedService;
    return await this.isProviderAvailable(selectedProvider);
  }

  /**
   * Ellenőrzi, hogy egy adott szolgáltató elérhető-e
   * @param provider - Szolgáltató neve
   * @returns Promise<boolean> true ha elérhető
   */
  async isProviderAvailable(provider: CV_SpeechRecognizerService): Promise<boolean> {
    try {
      switch (provider) {
        case CV_SpeechRecognizerService.whisper:
          // Whisper doesn't have a health check, assume it's available if API key is configured
          return !!(envKeys.openAi.apiKey);

        case CV_SpeechRecognizerService.elevenlabs:
          return await this.elevenLabs_AS.isApiAvailable();

        case CV_SpeechRecognizerService.local:
          return await this.localModel_AS.isApiAvailable();

        default:
          return false;
      }
    } catch (error) {
      DyFM_Log.error(`❌ Hiba a szolgáltató elérhetőség ellenőrzésekor (${provider}):`, error);
      return false;
    }
  }

  /**
   * Automatikus fallback kezelés
   * @param filename - Audio fájl útvonala
   * @param userId - Discord felhasználó ID
   * @returns Egységesített eredmény
   */
  async recognizeWithFallback(
    filename: string, 
    userId: string
  ): Promise<CV_UnifiedSpeechRecognitionResponse | null> {
    const selectedProvider = settings.voice.speechRecognizer.selectedService;
    
    // First try the selected provider
    let result = await this.recognizeAudioFile(filename, userId);
    
    if (result && result.success) {
      return result;
    }
    
    // If selected provider fails, try fallback providers
    DyFM_Log.warn(`⚠️  [FALLBACK] ${selectedProvider} sikertelen, próbálkozás más szolgáltatókkal (${userId})`);
    
    const fallbackProviders: CV_SpeechRecognizerService[] = [
      CV_SpeechRecognizerService.whisper, 
      CV_SpeechRecognizerService.elevenlabs, 
      CV_SpeechRecognizerService.local
    ];
    const currentIndex = fallbackProviders.indexOf(selectedProvider);
    
    // Try other providers in order
    for (let i = 0; i < fallbackProviders.length; i++) {
      if (i === currentIndex) continue; // Skip the already tried provider
      
      const fallbackProvider = fallbackProviders[i];
      DyFM_Log.info(`🔄 [FALLBACK] Próbálkozás: ${fallbackProvider} (${userId})`);
      
      try {
        switch (fallbackProvider) {
          case CV_SpeechRecognizerService.whisper:
            result = await this.recognizeWithWhisper(filename, userId);
            break;
            
          case CV_SpeechRecognizerService.elevenlabs:
            result = await this.recognizeWithElevenLabs(filename, userId);
            break;

          case CV_SpeechRecognizerService.local:
            result = await this.recognizeWithLocal(filename, userId);
            break;
        }
        
        if (result && result.success) {
          DyFM_Log.success(`✅ [FALLBACK] Sikeres felismerés: ${fallbackProvider} (${userId})`);
          return result;
        }
      } catch (error) {
        DyFM_Log.warn(`⚠️  [FALLBACK] ${fallbackProvider} hiba (${userId}):`, error);
      }
    }
    
    DyFM_Log.error(`❌ [FALLBACK] Minden szolgáltató sikertelen (${userId})`);
    return null;
  }
} 