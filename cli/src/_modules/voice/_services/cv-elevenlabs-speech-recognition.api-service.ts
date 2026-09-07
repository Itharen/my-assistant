import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { promises as fsPromises } from 'fs';
import { settings } from '../../../_collections/consts/settings.const.js';
import { EL_SpeechToText_ControlService } from '../../elevenlabs/_services/el-speech-to-text.control-service.js';
import { EL_SpeechToTextRequest } from '../../elevenlabs/_models/el-speech-to-text-request.interface.js';
import { EL_SpeechToTextResponse } from '../../elevenlabs/_models/el-speech-to-text-response.interface.js';
import { EL_SpeechToTextModels } from '../../elevenlabs/_enums/el-speech-to-text-models.enum.js';
import { EL_Languages } from '../../elevenlabs/_enums/el-languages.enum.js';
import { EL_OutputFormats } from '../../elevenlabs/_enums/el-output-formats.enum.js';
import { envKeys } from '../../../_collections/consts/env-keys.const.js';
import { CVO_Main_ControlService } from '../../voice-output/_services/cvo-main.control-service.js';
import { CVO_CCAPSound } from '../../voice-output/_enums/cvo-ccap-sound.enum.js';

/**
 * CCAP ElevenLabs Speech Recognition Service
 * @author AI
 * @description ElevenLabs speech recognition integration using official SDK
 * 
 * NOTE: ElevenLabs STT is currently disabled due to known SDK issues.
 * The @elevenlabs/elevenlabs-js SDK has routing/auth problems with STT endpoints,
 * causing 401 invalid_api_key errors even with valid keys.
 * 
 * ElevenLabs is only used for TTS (text-to-speech).
 * STT uses fallback providers (Whisper/OpenAI/Local).
 */
export class CV_ElevenLabsSpeechRecognition_ApiService extends DyNTS_SingletonService {
  static getInstance(): CV_ElevenLabsSpeechRecognition_ApiService {
    return CV_ElevenLabsSpeechRecognition_ApiService.getSingletonInstance();
  }

  /**
   * Feature flag: Enable/disable ElevenLabs STT
   * Currently disabled due to known SDK issues with STT endpoints
   * @see https://help.elevenlabs.io/hc/en-us/articles/19572237925521-API-Error-Code-400-or-401
   */
  private static readonly ENABLE_ELEVENLABS_STT: boolean = false;

  private readonly elevenLabs_CS: EL_SpeechToText_ControlService = EL_SpeechToText_ControlService.getInstance();
  private readonly voiceOutput_CS: CVO_Main_ControlService = CVO_Main_ControlService.getInstance();
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.initializeService();
  }

  /**
   * Initialize the ElevenLabs service with API key from settings
   */
  private initializeService(): void {
    try {
      // Check if STT is enabled
      if (!CV_ElevenLabsSpeechRecognition_ApiService.ENABLE_ELEVENLABS_STT) {
        DyFM_Log.info('ℹ️  ElevenLabs STT is disabled (known SDK issue with STT endpoints)');
        DyFM_Log.info('ℹ️  ElevenLabs is only used for TTS. STT uses fallback providers.');
        this.isInitialized = false;
        return;
      }

      DyFM_Log.info('🔧 Starting ElevenLabs service initialization...');
      const rawApiKey = envKeys.elevenLabs.apiKey;
      
      if (!rawApiKey) {
        DyFM_Log.warn('⚠️  ElevenLabs API key not configured in environment variables');
        DyFM_Log.warn('⚠️  Please set FDP_ELEVENLABS_API_KEY in your .env file');
        DyFM_Log.warn('⚠️  ElevenLabs speech recognition will not be available');
        DyFM_Log.warn('⚠️  Fallback to Whisper or Local will be used');
        this.isInitialized = false;
        return;
      }

      // Trim whitespace characters (common issue with .env files)
      const apiKey = rawApiKey.trim();
      
      // Check if trimming changed the key (indicates whitespace issue)
      if (apiKey !== rawApiKey) {
        DyFM_Log.warn('⚠️  API key contained whitespace characters, trimmed');
        DyFM_Log.warn('⚠️  Original length:', rawApiKey.length, 'Trimmed length:', apiKey.length);
      }
      
      if (!apiKey || apiKey.length === 0) {
        DyFM_Log.error('❌ ElevenLabs API key is empty after trimming');
        DyFM_Log.error('❌ Please check your FDP_ELEVENLABS_API_KEY in .env file');
        DyFM_Log.warn('⚠️  Fallback to Whisper or Local will be used');
        this.isInitialized = false;
        return;
      }

      // Validate API key format (optional check, but helpful for debugging)
      if (apiKey.length < 20) {
        DyFM_Log.warn('⚠️  API key seems too short (expected at least 20 characters)');
        DyFM_Log.warn('⚠️  Current length:', apiKey.length);
      }

      // Log API key info (masked for security)
      const maskedKey = apiKey.substring(0, Math.min(10, apiKey.length)) + '...' + 
                        apiKey.substring(Math.max(0, apiKey.length - 4));
      DyFM_Log.info(`🔑 Using ElevenLabs API key: ${maskedKey} (length: ${apiKey.length})`);

      // Initialize the service with trimmed API key
      this.elevenLabs_CS.initialize(apiKey);
      
      this.isInitialized = true;
      DyFM_Log.success('✅ ElevenLabs Speech Recognition service initialized successfully');
      DyFM_Log.info('💡 If you get 401 errors, check:');
      DyFM_Log.info('   1. API key is valid and active in ElevenLabs dashboard');
      DyFM_Log.info('   2. Your subscription includes Speech-to-Text feature');
      DyFM_Log.info('   3. API key has proper permissions for STT');
      DyFM_Log.info('   4. API key does not contain extra whitespace or newlines');
    } catch (error) {
      DyFM_Log.error('❌ Failed to initialize ElevenLabs service');
      DyFM_Log.error('❌ Error details:', error);
      if (error instanceof Error) {
        DyFM_Log.error(`❌ Error message: ${error.message}`);
        if (error.stack) {
          DyFM_Log.error(`❌ Stack trace: ${error.stack}`);
        }
      }
      DyFM_Log.warn('⚠️  Fallback to Whisper or Local will be used');
      this.isInitialized = false;
    }
  }

  /**
   * Audio fájl beszéd felismerése ElevenLabs-szel
   * @param filename - Audio fájl útvonala
   * @param userId - Discord felhasználó ID
   * @returns Felismerési eredmény
   */
  async recognizeAudioFile(
    filename: string, 
    userId: string
  ): Promise<EL_SpeechToTextResponse | null> {
    try {
      // Hard guard: ElevenLabs STT is disabled due to known SDK issues
      if (!CV_ElevenLabsSpeechRecognition_ApiService.ENABLE_ELEVENLABS_STT) {
        DyFM_Log.info(`ℹ️  ElevenLabs STT skipped (${userId}) - Feature disabled due to SDK issues`);
        DyFM_Log.info(`ℹ️  Using fallback providers (Whisper/OpenAI/Local)`);
        return null;
      }

      // Check if service is initialized
      if (!this.isInitialized) {
        DyFM_Log.info(`ℹ️  ElevenLabs STT not available (${userId}) - Service not initialized`);
        DyFM_Log.info(`ℹ️  Using fallback providers (Whisper/OpenAI/Local)`);
        return null;
      }

      // Fájl létezésének ellenőrzése
      const stats = await fsPromises.stat(filename);
      if (stats.size === 0) {
        DyFM_Log.error(`❌ Az audio fájl üres (${userId}): ${filename}`);
        return null;
      }
      
      if (stats.size < settings.voice.speechRecognizer.elevenlabs.minFileSize) {
        DyFM_Log.error(`❌ Az audio fájl nagyon kicsi (${stats.size} byte) (${userId}): ${filename}`);
        return null;
      }
      
      if (stats.size > settings.voice.speechRecognizer.elevenlabs.maxFileSize) {
        DyFM_Log.error(`❌ Az audio fájl túl nagy (${stats.size} byte) (${userId}): ${filename}`);
        return null;
      }
      
      DyFM_Log.testInfo(
        `🎤 Audio fájl beszéd felismerése ElevenLabs-szel (${userId}): ${filename} (${stats.size} byte)`
      );
      this.voiceOutput_CS.playSound(CVO_CCAPSound.whoosh, 'elevenlabs-speech-recognition');

      // Audio fájl beolvasása
      const audioBuffer = await fsPromises.readFile(filename);
      
      // ElevenLabs Speech-to-Text API hívás - settings-ből olvasott konfigurációval
      const elevenlabsConfig = settings.voice.speechRecognizer.elevenlabs;
      const request: EL_SpeechToTextRequest = {
        audio: audioBuffer,
        model: elevenlabsConfig.defaultModel || EL_SpeechToTextModels.scribe,
        language: EL_Languages.hungarian,
        outputFormat: EL_OutputFormats.text,
        temperature: 0.0, // Deterministic output
        includeTimestamps: false,
        diarize: elevenlabsConfig.enableDiarization || false,
        numSpeakers: elevenlabsConfig.defaultNumSpeakers,
        tagAudioEvents: elevenlabsConfig.enableAudioEventTagging || false,
        entityDetection: elevenlabsConfig.enableEntityDetection || false
      };
      
      const recognition = await this.elevenLabs_CS.transcribeAudio(request);
      
      // Check if there was an error in the response
      if ((recognition as any).error) {
        const errorMessage = (recognition as any).error;
        DyFM_Log.error(`❌ ElevenLabs API hiba (${userId}): ${errorMessage}`);
        
        // Check for authentication errors (401)
        if (errorMessage.includes('401') || errorMessage.includes('invalid_api_key') || errorMessage.includes('Invalid API key')) {
          DyFM_Log.error(`❌ ElevenLabs API kulcs érvénytelen (${userId})`);
          DyFM_Log.error(`❌ A rendszer automatikusan fallback-et használ (Whisper/Local)`);
          DyFM_Log.error(`❌ Az ElevenLabs használatához:`);
          DyFM_Log.error(`   1. Ellenőrizd az FDP_ELEVENLABS_API_KEY environment változót`);
          DyFM_Log.error(`   2. Az API kulcs formátuma: xi-api-...`);
          DyFM_Log.error(`   3. Az ElevenLabs dashboardban ellenőrizd, hogy:`);
          DyFM_Log.error(`      - Az API kulcs aktív és érvényes`);
          DyFM_Log.error(`      - Az előfizetésed támogatja a Speech-to-Text funkciót`);
          DyFM_Log.error(`      - Az API kulcsnak van hozzáférése a STT endpoint-okhoz`);
          DyFM_Log.error(`   4. Új API kulcs létrehozása: https://elevenlabs.io/app/settings/api-keys`);
          throw new Error(`ElevenLabs API kulcs érvénytelen: ${errorMessage}`);
        }
        
        throw new Error(`ElevenLabs API hiba: ${errorMessage}`);
      }
      
      DyFM_Log.info(`🎯 ElevenLabs felismerési eredmény (${userId}):`);
      DyFM_Log.info(`  - Átirat: ${recognition.text || 'Nincs átirat'}`);
      DyFM_Log.info(`  - Bizonyosság: ${recognition.confidence?.toFixed(3) || 'N/A'}`);
      
      if (recognition.text && recognition.text.trim()) {
        DyFM_Log.success(`📝 ElevenLabs átirat (${userId}): ${recognition.text}`);
        return recognition;
      } else {
        DyFM_Log.warn(`🔇 Nincs ElevenLabs átirat (${userId}) - üres válasz`);
        return null;
      }
      
    } catch (err) {
      DyFM_Log.error(`❌ Hiba az ElevenLabs audio felismerésekor (${userId}):`, err);
      DyFM_Log.error(`❌ Error details:`, {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : 'Unknown',
        fullError: err
      });
      
      return null;
    }
  }

  /**
   * Ellenőrzi, hogy az ElevenLabs API elérhető-e
   * @returns Promise<boolean> true ha elérhető
   */
  async isApiAvailable(): Promise<boolean> {
    try {
      // Check if service is initialized
      if (!this.isInitialized) {
        DyFM_Log.error('❌ ElevenLabs service not initialized');
        return false;
      }

      // Check if API key is configured
      if (!envKeys.elevenLabs.apiKey) {
        DyFM_Log.error('❌ ElevenLabs API key is not configured');
        return false;
      }
      
      // Test connection using the service
      /* const isAvailable = await this.elevenLabsService.testConnection();
      
      if (isAvailable) {
        DyFM_Log.success('✅ ElevenLabs API is available');
      } else {
        DyFM_Log.error('❌ ElevenLabs API is not available');
      } */
      
      return true;
    } catch (err) {
      DyFM_Log.error('❌ ElevenLabs API availability check failed:', err);
      return false;
    }
  }
} 