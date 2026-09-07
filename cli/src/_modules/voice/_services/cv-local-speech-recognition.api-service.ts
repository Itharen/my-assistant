import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Error, DyFM_Log } from '@futdevpro/fsm-dynamo';
import { promises as fsPromises } from 'fs';
import { settings } from '../../../_collections/consts/settings.const.js';
import { CV_LocalSpeechRecognitionResponse } from '../_models/cv-local-speech-recognition-response.interface.js';
import { CVO_CCAPSound } from '../../voice-output/_enums/cvo-ccap-sound.enum.js';
import { CVO_Main_ControlService } from '../../voice-output/_services/cvo-main.control-service.js';

/**
 * CCAP Local Speech Recognition Service
 * @author AI
 * @description Local speech recognition using the speech recognition API
 * 
 * This service supports skipping audio classification to avoid double classification
 * when the audio has already been classified by the main processing pipeline.
 * Use skipClassification=true when calling from the unified speech recognition service.
 */
export class CV_LocalSpeechRecognition_ApiService extends DyNTS_SingletonService {
  
  static getInstance(): CV_LocalSpeechRecognition_ApiService {
    return CV_LocalSpeechRecognition_ApiService.getSingletonInstance();
  }

  private voiceOutput_CS: CVO_Main_ControlService = CVO_Main_ControlService.getInstance();

  private localSpeechRecognitionApiUrl = settings.voice.speechRecognizer.local.apiUrl;

  /**
   * Audio fájl beszéd felismerése
   * @param filename - Audio fájl útvonala
   * @param userId - Discord felhasználó ID
   * @param confidenceThreshold - Bizonyossági küszöb
   * @param skipClassification - Osztályozás kihagyása (alapértelmezett: true a local API-nál)
   * @returns Felismerési eredmény
   */
  async recognizeAudioFile(
    filename: string, 
    userId: string,
    confidenceThreshold?: number,
    skipClassification: boolean = true
  ): Promise<CV_LocalSpeechRecognitionResponse> {
    try {
      // Fájl létezésének ellenőrzése
      const stats = await fsPromises.stat(filename);
      if (stats.size === 0) {
        DyFM_Log.warn(`⚠️   Az audio fájl üres (${userId}): ${filename}`);
        return {
          status: 'failed',
          error: 'Audio file is empty',
          text: '',
          confidence: 0.0
        };
      }
      
      if (stats.size < settings.voice.speechRecognizer.local.minFileSize) {
        DyFM_Log.warn(`⚠️   Az audio fájl nagyon kicsi (${stats.size} byte) (${userId}): ${filename}`);
        return {
          status: 'failed',
          error: 'Audio file too small',
          text: '',
          confidence: 0.0
        };
      }
      
      if (stats.size > settings.voice.speechRecognizer.local.maxFileSize) {
        DyFM_Log.warn(`⚠️   Az audio fájl túl nagy (${stats.size} byte) (${userId}): ${filename}`);
        return {
          status: 'failed',
          error: 'Audio file too large',
          text: '',
          confidence: 0.0
        };
      }
      
      DyFM_Log.testInfo(
        `🎤 Audio fájl beszéd felismerése (${userId}): ${filename} (${stats.size} byte)`
      );
      this.voiceOutput_CS.playSound(CVO_CCAPSound.whoosh, 'local-speech-recognition');
      
      // Audio fájl beolvasása
      const audioBuffer = await fsPromises.readFile(filename);
      
      // Local Speech Recognition API hívás
      const recognition = await this.callRecognitionApi(audioBuffer, confidenceThreshold, skipClassification);
      
      // Extract text from the nested result structure
      const transcribedText = recognition.result?.text || recognition.text || '';
      const confidence = recognition.confidence || 0.0;
      
      // Debug logging for response structure
      DyFM_Log.log(`🔍 [DEBUG] Response structure analysis (${userId}):`);
      DyFM_Log.log(`  - recognition.text: ${recognition.text || 'undefined'}`);
      DyFM_Log.log(`  - recognition.result?.text: ${recognition.result?.text || 'undefined'}`);
      DyFM_Log.log(`  - Final transcribedText: ${transcribedText || 'empty'}`);
      
      DyFM_Log.log(
        `🎯 Felismerési eredmény (${userId}):` +
        `\n  - Átirat: ${transcribedText || 'Nincs átirat'}` +
        `\n  - Bizonyosság: ${confidence.toFixed(3)}` +
        `\n  - Státusz: ${recognition.status}`
      );
      
      if (recognition.classification_result) {
        DyFM_Log.log(`  - Osztályozás: ${recognition.classification_result.category} (${recognition.classification_result.confidence?.toFixed(3)})`);
      }
      
      // Return the response with properly extracted text
      const finalResponse = {
        ...recognition,
        text: transcribedText,
        confidence: confidence
      };
      
      // Validate that we have extracted the text correctly
      if (!transcribedText && recognition.status === 'processed') {
        DyFM_Log.warn(`⚠️  [WARNING] No text extracted despite successful status (${userId})`);
        DyFM_Log.warn(`⚠️  [WARNING] Response keys: ${Object.keys(recognition).join(', ')}`);
      }
      
      return finalResponse;
      
    } catch (err) {
      DyFM_Log.error(`❌ Hiba az audio felismerésekor (${userId}):`, err);
      DyFM_Log.error(`❌ Error details:`, {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : 'Unknown',
        fullError: err
      });
      
      // Check if it's a connection error (API server not running)
      const isConnectionError = err instanceof Error && (
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('fetch failed') ||
        err.message.includes('ENOTFOUND') ||
        err.message.includes('ECONNRESET')
      );
      
      if (isConnectionError) {
        DyFM_Log.warn(
          `⚠️  Local Speech Recognition API nem elérhető (${userId}), próbálkozás más URL-ekkel`
        );
        const workingUrl = await this.findWorkingApiUrl();
        if (workingUrl) {
          DyFM_Log.success(`✅ Working API URL found: ${workingUrl}`);
          this.setApiUrl(workingUrl);
          // Retry with new URL
          return this.recognizeAudioFile(filename, userId, confidenceThreshold, skipClassification);
        }
      }
      
      return {
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
        text: '',
        confidence: 0.0
      };
    }
  }

  /**
   * Local Speech Recognition API felismerési endpoint hívása
   * @param audioBuffer - Audio buffer
   * @param confidenceThreshold - Bizonyossági küszöb
   * @param skipClassification - Osztályozás kihagyása
   * @returns Felismerési eredmény
   */
  private async callRecognitionApi(
    audioBuffer: Buffer, 
    confidenceThreshold?: number,
    skipClassification: boolean = true
  ): Promise<CV_LocalSpeechRecognitionResponse> {
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('❌ Üres audio buffer a felismeréshez!');
    }

    // Ellenőrizzük a minimális méretet
    if (audioBuffer.length < settings.voice.speechRecognizer.local.minFileSize) {
      throw new Error('❌ Túl kicsi audio buffer!');
    }

    // Ellenőrizzük a maximális méretet
    if (audioBuffer.length > settings.voice.speechRecognizer.local.maxFileSize) {
      throw new Error(
        `❌ Túl nagy audio buffer! ` +
        `(max ${settings.voice.speechRecognizer.local.maxFileSize / (1024*1024)}MB)`
      );
    }

    const url = new URL('/api/recognition', this.localSpeechRecognitionApiUrl);
    const threshold = confidenceThreshold ?? settings.voice.speechRecognizer.local.confidenceThreshold;
    url.searchParams.append('confidence_threshold', threshold.toString());
    
    // Add skip_classification parameter to skip audio classification
    url.searchParams.append('skip_classification', skipClassification ? '1' : '0');
    
    // Debug: Log the URL parameters
    DyFM_Log.log(`🔧 API URL parameters: ${url.searchParams.toString()}`);
    DyFM_Log.log(`🔧 Skip classification: ${skipClassification ? 'Yes' : 'No'}`);

    // Check if API is available before making the call
    const isAvailable = await this.isApiAvailable();
    if (!isAvailable) {
      DyFM_Log.warn('⚠️  Local Speech Recognition API is not available, trying to find working URL...');
      const workingUrl = await this.findWorkingApiUrl();
      if (workingUrl) {
        this.setApiUrl(workingUrl);
        DyFM_Log.log(`✅ Updated API URL to: ${workingUrl}`);
      } else {
        throw new Error('Local Speech Recognition API is not available and no working URL found');
      }
    }

    try {
      DyFM_Log.success(
        `🚀 Local Speech Recognition API hívás indítása... (${url.toString()})`
      );
      /* this.voiceOutput_CS.playSound(CVO_CCAPSound.whoosh, 'local-speech-recognition'); */
      
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(), settings.voice.speechRecognizer.local.requestTimeout
      );
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/wav',
          'Filename': 'audio.wav'
        },
        body: audioBuffer,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errText = await response.text();
        DyFM_Log.error('❌ Local Speech Recognition API hiba:', response.status, errText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errText}`);
      }
      
      const result = await response.json();

      if (result.error) {
        DyFM_Error.logSimple('❌ Local Speech Recognition API hiba:', result);

        throw result;
      }

      DyFM_Log.info('✅ Local Speech Recognition API válasz:', result);
      
      return result as CV_LocalSpeechRecognitionResponse;
    } catch (err) {
      DyFM_Log.error('❌ Hiba a Local Speech Recognition API híváskor:', err);
      DyFM_Log.error('❌ API call error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : 'Unknown',
        url: url.toString(),
        audioBufferSize: audioBuffer.length,
        fullError: err
      });
      
      throw err;
    }
  }

  /**
   * Ellenőrzi, hogy a Local Speech Recognition API elérhető-e
   * @returns Promise<boolean> true ha elérhető
   */
  async isApiAvailable(): Promise<boolean> {
    try {
      const url = new URL('/api/health', this.localSpeechRecognitionApiUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
      
      DyFM_Log.log(`🔍 Health check: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      DyFM_Log.log(`🔍 Health check response: ${response.ok}`);
      return response.ok;
    } catch (err) {
      DyFM_Log.warn('⚠️  Local Speech Recognition API health check failed:', err);
      return false;
    }
  }

  /**
   * Test different connection methods to find working URL
   * @returns Promise<string | null> Working URL or null
   */
  async findWorkingApiUrl(): Promise<string | null> {
    const testUrls = [
      'http://127.0.0.1:38321',
      'http://localhost:38321',
      'http://[::1]:38321'
    ];

    for (const testUrl of testUrls) {
      try {
        DyFM_Log.log(`🔍 Testing API URL: ${testUrl}`);
        const url = new URL('/api/health', testUrl);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          DyFM_Log.success(`✅ Working API URL found: ${testUrl}`);
          return testUrl;
        }
      } catch (err) {
        DyFM_Log.warn(`❌ Failed to connect to ${testUrl}:`, err);
      }
    }
    
    DyFM_Log.error('❌ No working API URL found');
    return null;
  }

  /**
   * Update the API URL dynamically
   * @param newUrl - New API URL
   */
  setApiUrl(newUrl: string): void {
    this.localSpeechRecognitionApiUrl = newUrl;
    DyFM_Log.info(`🔧 API URL updated to: ${newUrl}`);
  }
} 