import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { promises as fsPromises } from 'fs';
import { CV_AudioClassificationResponse, CV_AudioClassificationStatus } from '../_models/cv-audio-classification-response.interface.js';
import { settings } from '../../../_collections/consts/settings.const.js';
import { CV_AudioClassificationCategory } from '../_enums/cv-audio-classification-category.enum.js';
import { CVO_Main_ControlService } from '../../voice-output/_services/cvo-main.control-service.js';
import { CVO_CCAPSound } from '../../voice-output/_enums/cvo-ccap-sound.enum.js';

/**
 * CCAP Audio Classification Service
 * @author AI
 * @description Audio classification using the speech recognition API
 */
export class CV_AudioClassification_ApiService extends DyNTS_SingletonService {

  static getInstance(): CV_AudioClassification_ApiService {
    return CV_AudioClassification_ApiService.getSingletonInstance();
  }

  private voiceOutput_CS: CVO_Main_ControlService = CVO_Main_ControlService.getInstance();

  private speechRecognitionApiUrl = settings.voice.speechRecognizer.audioClassification.apiUrl;

  private debugLog: boolean = false;

  /**
   * Audio fájl beszéd osztályozása
   * @param filename - Audio fájl útvonala
   * @param userId - Discord felhasználó ID
   * @returns Osztályozási eredmény
   */
  async classifyAudioFile(
    filename: string, 
    userId: string,
    confidenceThreshold?: number
  ): Promise<CV_AudioClassificationResponse> {
    try {
      // Fájl létezésének ellenőrzése
      const stats = await fsPromises.stat(filename);
      if (stats.size === 0) {
        DyFM_Log.warn(`⚠️   Az audio fájl üres (${userId}): ${filename}`);
        return {
          status: CV_AudioClassificationStatus.failed,
          error: 'Audio file is empty',
          is_speech: false,
          category: 'unknown',
          confidence: 0.0
        };
      }
      
      if (stats.size < settings.voice.speechRecognizer.audioClassification.minFileSize) {
        DyFM_Log.warn(
          `⚠️   Az audio fájl nagyon kicsi ` +
          `(${stats.size} byte < ${settings.voice.speechRecognizer.audioClassification.minFileSize}) (${userId}): ` +
          `\n  ${filename}`
        );
        
        return {
          status: CV_AudioClassificationStatus.failed,
          error: 'Audio file too small',
          is_speech: false,
          category: 'unknown',
          confidence: 0.0
        };
      }
      
      DyFM_Log.info(
        `🎵 Audio fájl osztályozása (${userId}): ${filename} (${stats.size} byte)`
      );
      
      // Audio fájl beolvasása
      const audioBuffer = await fsPromises.readFile(filename);
      
      // Speech Recognition API hívás az osztályozáshoz
      const classification = await this.callClassificationApi(audioBuffer, confidenceThreshold);
      
      // Evaluate AudioSet results for better speech detection
      const audiosetEvaluation = this.evaluateAudiosetResults(classification);
      
      if (this.debugLog) {
        DyFM_Log.log(
          `🔍 Osztályozási eredmény (${userId}):` +
          `\n  - Kategória: ${classification.category}` +
          `\n  - Bizonyosság: ${classification.confidence.toFixed(3)}` +
          `\n  - Alapvető beszéd: ${classification.is_speech ? 'Igen' : 'Nem'}` +
          `\n  - AudioSet beszéd: ${audiosetEvaluation.isSpeech ? 'Igen' : 'Nem'}` +
          `\n  - AudioSet indok: ${audiosetEvaluation.reason}`
        );
      }

      if (audiosetEvaluation.topMatch) {
        DyFM_Log.log(
          `  - Legjobb AudioSet egyezés: "${audiosetEvaluation.topMatch.label}" ` +
          `(${audiosetEvaluation.topMatch.score.toFixed(3)})`
        );
      }
      
      if (audiosetEvaluation.acceptedMatches.length > 0) {
        DyFM_Log.log(
          `  - Elfogadott AudioSet egyezések: ${audiosetEvaluation.acceptedMatches.length}`
        );
        audiosetEvaluation.acceptedMatches.forEach((match, index) => {
          DyFM_Log.log(`    ${index + 1}. "${match.label}": ${match.score.toFixed(3)}`);
        });
      }
      
      // Use AudioSet evaluation result as the final decision
      const finalClassification = {
        ...classification,
        is_speech: audiosetEvaluation.isSpeech,
        audioset_evaluation: audiosetEvaluation
      };
      
      return finalClassification;
      
    } catch (err) {
      DyFM_Log.error(`❌ Hiba az audio osztályozásakor (${userId}):`, err);
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
          `⚠️  Speech Recognition API nem elérhető (${userId}), folytatás osztályozás nélkül`
        );
        return {
          status: CV_AudioClassificationStatus.apiUnavailable,
          error: 'Speech Recognition API server not available',
          is_speech: true, // Default to true to allow processing
          category: 'unknown',
          confidence: 0.0
        };
      }
      
      return {
        status: CV_AudioClassificationStatus.failed,
        error: err instanceof Error ? err.message : 'Unknown error',
        is_speech: true, // Default to true to allow processing
        category: 'unknown',
        confidence: 0.0
      };
    }
  }

  /**
   * Speech Recognition API osztályozási endpoint hívása
   * @param audioBuffer - Audio buffer
   * @param confidenceThreshold - Bizonyossági küszöb
   * @returns Osztályozási eredmény
   */
  private async callClassificationApi(
    audioBuffer: Buffer, 
    confidenceThreshold?: number
  ): Promise<CV_AudioClassificationResponse> {
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('❌ Üres audio buffer az osztályozáshoz!');
    }

    // Ellenőrizzük a minimális méretet
    if (audioBuffer.length < settings.voice.speechRecognizer.audioClassification.minFileSize) {
      throw new Error('❌ Túl kicsi audio buffer!');
    }

    // Ellenőrizzük a maximális méretet
    if (audioBuffer.length > settings.voice.speechRecognizer.audioClassification.maxFileSize) {
      throw new Error(
        `❌ Túl nagy audio buffer! ` +
        `(max ${settings.voice.speechRecognizer.audioClassification.maxFileSize / (1024*1024)}MB)`
      );
    }

    const url = new URL('/api/classify', this.speechRecognitionApiUrl);
    const threshold = confidenceThreshold ?? settings.voice.defaultConfidenceThreshold;
    url.searchParams.append('confidence_threshold', threshold.toString());
    
    // Add support for new API parameters
    //url.searchParams.append('full_response', '1'); // Always get full response for detailed logging
    url.searchParams.append('top_audioset', '7'); // Get top 7 results
    
    // Debug: Log the URL parameters
    DyFM_Log.log(`🔧 API URL parameters: ${url.searchParams.toString()}`);

    // Check if API is available before making the call
    const isAvailable = await this.isApiAvailable();
    if (!isAvailable) {
      DyFM_Log.warn('⚠️  Speech Recognition API is not available, trying to find working URL...');
      const workingUrl = await this.findWorkingApiUrl();
      if (workingUrl) {
        this.setApiUrl(workingUrl);
        DyFM_Log.log(`✅ Updated API URL to: ${workingUrl}`);
      } else {
        throw new Error('Speech Recognition API is not available and no working URL found');
      }
    }

    try {
      DyFM_Log.log(
        `🚀 Speech Recognition API osztályozási hívás indítása... (${url.toString()})`
      );
      
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(), settings.voice.speechRecognizer.audioClassification.requestTimeout
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
        DyFM_Log.error('❌ Speech Recognition API hiba:', response.status, errText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errText}`);
      }
      
      const result = await response.json();
      DyFM_Log.H_success('✅ Speech Recognition API osztályozási válasz:', result);
      
      // Log top N AudioSet results if available
      if (result.topN_audioset && Array.isArray(result.topN_audioset)) {
        if (this.debugLog) {
          DyFM_Log.log(
            `🔍 Top ${result.topN_audioset.length} AudioSet eredmények: \n` +
            result.topN_audioset.map(
              (entry: any) => `${entry.label}: ${entry.score.toFixed(3)}`
            ).join(', \n')
          );
        }
      }
      
      return result as CV_AudioClassificationResponse;
    } catch (err) {
      DyFM_Log.error('❌ Hiba a Speech Recognition API híváskor:', err);
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
   * Ellenőrzi, hogy az audio beszédet tartalmaz-e
   * @param classification - Osztályozási eredmény
   * @returns true ha beszédet tartalmaz
   */
  isSpeechAudio(classification: CV_AudioClassificationResponse): boolean {
    return classification.is_speech === true;
  }

  /**
   * Ellenőrzi, hogy az osztályozás sikeres volt-e
   * @param classification - Osztályozási eredmény
   * @returns true ha sikeres
   */
  isClassificationSuccessful(classification: CV_AudioClassificationResponse): boolean {
    return classification.status === CV_AudioClassificationStatus.classified || 
      classification.status === CV_AudioClassificationStatus.classifiedAudioset ||
      classification.status === CV_AudioClassificationStatus.classifiedFallback;
  }

  /**
   * Evaluates AudioSet results to determine if audio contains speech
   * @param classification - Classification result with topN_audioset
   * @returns Evaluation result with details
   */
  evaluateAudiosetResults(classification: CV_AudioClassificationResponse): {
    isSpeech: boolean;
    reason: string;
    topMatch?: { label: string; score: number };
    acceptedMatches: Array<{ label: string; score: number }>;
  } {
    const { topN_audioset, confidence, category } = classification;
    
    // If no AudioSet results, fall back to the basic classification
    if (!topN_audioset || !Array.isArray(topN_audioset) || topN_audioset.length === 0) {
      DyFM_Log.warn('⚠️  No AudioSet results available, using basic classification');
      return {
        isSpeech: classification.is_speech || false,
        reason: 'No AudioSet results, using basic classification',
        acceptedMatches: []
      };
    }

    // Check overall confidence first
    if (confidence < settings.voice.thresholds.audiosetOverallConfidenceThreshold) {
      DyFM_Log.warn(
        `⚠️  Overall confidence too low: ` +
        `${confidence.toFixed(3)} < ${settings.voice.thresholds.audiosetOverallConfidenceThreshold}`
      );
      return {
        isSpeech: false,
        reason: `Overall confidence too low: ${confidence.toFixed(3)}`,
        acceptedMatches: []
      };
    }

    // Find accepted labels in the top results
    const acceptedMatches: Array<{ label: string; score: number }> = [];
    let topMatch: { label: string; score: number } | undefined;

    for (const entry of topN_audioset) {
      const { label, score } = entry;
      
      // Check if this label is in our accepted list
      if (settings.voice.acceptedSpeechCategories.includes(label as CV_AudioClassificationCategory)) {
        // Check if confidence is above threshold
        if (score >= settings.voice.thresholds.audiosetLabelConfidenceThreshold) {
          acceptedMatches.push({ label, score });
          
          // Track the highest scoring accepted match
          if (!topMatch || score > topMatch.score) {
            topMatch = { label, score };
          }
        } else {
          DyFM_Log.log(
            `ℹ️  Accepted label "${label}" found but confidence too low: ` +
            `${score.toFixed(3)} < ${settings.voice.thresholds.audiosetLabelConfidenceThreshold}`
          );
        }
      }
    }

    // Determine if speech based on accepted matches
    if (acceptedMatches.length > 0) {
      const bestMatch = acceptedMatches[0];
      DyFM_Log.info(
        `✅ AudioSet evaluation: Speech detected via "${bestMatch.label}" ` +
        `(confidence: ${bestMatch.score.toFixed(3)})`
      );
      return {
        isSpeech: true,
        reason: `Accepted AudioSet label: ${bestMatch.label} (${bestMatch.score.toFixed(3)})`,
        topMatch: bestMatch,
        acceptedMatches
      };
    } else {
      DyFM_Log.warn(`❌ AudioSet evaluation: No accepted labels found above threshold`);
      this.voiceOutput_CS.playSound(CVO_CCAPSound.earlySkip, 'audio-classification');
      DyFM_Log.info(
        `ℹ️  Top results: ` +
        `${topN_audioset.slice(0, 3).map(e => `${e.label}:${e.score.toFixed(3)}`).join(', ')}`
      );
      return {
        isSpeech: false,
        reason: 'No accepted AudioSet labels found above threshold',
        acceptedMatches: []
      };
    }
  }

  /**
   * Ellenőrzi, hogy a Speech Recognition API elérhető-e
   * @returns Promise<boolean> true ha elérhető
   */
  async isApiAvailable(): Promise<boolean> {
    try {
      const url = new URL('/api/health', this.speechRecognitionApiUrl);
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
      DyFM_Log.warn('⚠️  Speech Recognition API health check failed:', err);
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
    this.speechRecognitionApiUrl = newUrl;
    DyFM_Log.info(`🔧 API URL updated to: ${newUrl}`);
  }

  /**
   * Speech Recognition API elindítása (ha szükséges)
   * @returns Promise<boolean> true ha sikeresen elindult vagy már fut
   */
  async startSpeechRecognitionApi(): Promise<boolean> {
    try {
      // First check if it's already running
      if (await this.isApiAvailable()) {
        DyFM_Log.info('✅ Speech Recognition API már fut');
        return true;
      }

      DyFM_Log.info('🚀 Speech Recognition API elindítása...');
      
      // Try to start the API using subprocess (if available)
      const { spawn } = require('child_process');
      const path = require('path');
      
      // Assuming the speech recognition API is in the speech-recognition directory
      const apiPath = path.join(process.cwd(), '..', 'speech-recognition');
      const apiScript = path.join(apiPath, 'main.py');
      
      const child = spawn('python', [apiScript], {
        cwd: apiPath,
        detached: true,
        stdio: 'ignore'
      });
      
      // Wait a bit for the API to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if it's now available
      const isAvailable = await this.isApiAvailable();
      if (isAvailable) {
        DyFM_Log.success('✅ Speech Recognition API sikeresen elindult');
      } else {
        DyFM_Log.warn('⚠️  Speech Recognition API elindítása sikertelen vagy még nem elérhető');
      }
      
      return isAvailable;
    } catch (err) {
      DyFM_Log.error('❌ Hiba a Speech Recognition API elindításakor:', err);
      return false;
    }
  }
} 