import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { CV_VoiceUtils } from '../_collections/cv-voice.utils.js';
import { CV_AudioAnalysisResult } from '../_models/cv-audio-analysis-result.interface.js';
import { CV_speechAnalysisConfig } from '../_collections/consts/cv-speech-analysis.const.js';

/**
 * CCAP Voice Analysis Service
 * @author AI
 * @description Fejlett hang elemzés és beszéd észlelés
 */
export class CV_Analysis_ControlService extends DyNTS_SingletonService {
  static getInstance(): CV_Analysis_ControlService {
    return CV_Analysis_ControlService.getSingletonInstance();
  }

  /**
   * Option to enable compact, in-place updating log for '🎤 Audio Analysis'.
   */
  static compactAudioAnalysisLog = true; // Set to false to disable

  /**
   * Internal state for compact log
   */
  private static _compactLogBuffer: string = '';
  private static _compactLogCount: number = 0;
  private static _lastWasAudioAnalysis: boolean = false;
  private static _compactLogTimeout: NodeJS.Timeout | null = null;

  /**
   * Compact log helper: print or update the same line with ZCR bars
   */
  private static _logCompactAudioAnalysis(zcr: number, zcrGate: number): void {
    // Color logic
    let bar = '';
    if (zcr >= zcrGate) {
      bar = '\x1b[32m|\x1b[0m'; // green
    } else if (zcr > zcrGate * 0.9) {
      bar = '\x1b[33m|\x1b[0m'; // yellow
    } else {
      bar = '\x1b[31m|\x1b[0m'; // red
    }
    // Determine max bars per line (default 80, or terminal width minus label)
    const termWidth = (process.stdout && process.stdout.columns) ? process.stdout.columns : 80;
    const label = '🎤 Audio Analysis: ';
    const maxBars = Math.max(10, termWidth - label.length);
    // If reached max, print newline and reset
    if (this._compactLogCount >= maxBars) {
      process.stdout.write('\n');
      this._compactLogBuffer = '';
      this._compactLogCount = 0;
    }
    this._compactLogBuffer += bar;
    this._compactLogCount++;
    // Print in-place (\r to return to start of line)
    process.stdout.write(`\r${label}${this._compactLogBuffer}`);
    // If no new log in 1s, print newline and reset
    if (this._compactLogTimeout) clearTimeout(this._compactLogTimeout);
    this._compactLogTimeout = setTimeout(() => {
      process.stdout.write('\n');
      this._compactLogBuffer = '';
      this._compactLogCount = 0;
      this._lastWasAudioAnalysis = false;
    }, 1000);
  }

  /**
   * Reset the compact log buffer and print a newline if needed.
   */
  static resetCompactAudioAnalysisLog(): void {
    if (this._lastWasAudioAnalysis && this._compactLogBuffer.length > 0) {
      process.stdout.write('\n');
    }
    this._compactLogBuffer = '';
    this._compactLogCount = 0;
    this._lastWasAudioAnalysis = false;
    if (this._compactLogTimeout) {
      clearTimeout(this._compactLogTimeout);
      this._compactLogTimeout = null;
    }
  }

  /**
   * Fejlett beszéd észlelés és validáció
   * @param buffer - Audio buffer (16-bit PCM)
   * @returns AudioAnalysisResult objektum
   */
  public analyzeAudio(buffer: Buffer): CV_AudioAnalysisResult {
    if (!buffer || buffer.length === 0) {
      return this.createEmptyResult();
    }

    try {
      // Alapvető hang elemzés
      const samples = CV_VoiceUtils.extractSamples(buffer);
      const volume = CV_VoiceUtils.calculateRMS(samples);
      const frequency = CV_VoiceUtils.estimateFrequency(samples);
      const zeroCrossings = CV_VoiceUtils.calculateZeroCrossings(samples);
      const variance = CV_VoiceUtils.calculateVariance(samples);
      const peakCount = CV_VoiceUtils.countPeaks(samples);
      const energyVariance = CV_VoiceUtils.calculateEnergyVariance(samples);

      // White noise detektálás
      const isWhiteNoise = this.detectWhiteNoise(samples, energyVariance);

      // Csend detektálás
      const isSilence = this.detectSilence(volume, variance, zeroCrossings);

      // Beszéd minőség számítás
      const voiceActivityScore = this.calculateVoiceActivityScore({
        volume,
        frequency,
        zeroCrossings,
        variance,
        peakCount,
        energyVariance
      });

      // Beszéd észlelés
      const isSpeech = this.detectSpeech({
        volume,
        frequency,
        zeroCrossings,
        variance,
        peakCount,
        voiceActivityScore,
        isWhiteNoise,
        isSilence
      });

      // Minőség és bizalom számítás
      const quality = this.calculateQuality({
        volume,
        variance,
        peakCount,
        voiceActivityScore
      });

      const confidence = this.calculateConfidence({
        isSpeech,
        isWhiteNoise,
        isSilence,
        quality,
        voiceActivityScore
      });

      return {
        isSpeech,
        isWhiteNoise,
        isSilence,
        quality,
        confidence,
        volume,
        frequency,
        zeroCrossings,
        zcrNormalized: zeroCrossings / 100, // Normalizált ZCR (0-1)
        variance,
        peakCount,
        energyVariance,
        voiceActivityScore
      };

    } catch (error) {
      DyFM_Log.error('❌ Hiba a hang elemzés során:', error);
      return this.createEmptyResult();
    }
  }

  /**
   * White noise detektálás
   * @param samples - Minták tömb
   * @param energyVariance - Energia variancia
   * @returns true ha white noise
   */
  private detectWhiteNoise(samples: number[], energyVariance: number): boolean {
    // White noise jellemzői:
    // 1. Alacsony energia variancia
    // 2. Magas zero crossing rate
    // 3. Egyenletes spektrum
    
    const zeroCrossings = CV_VoiceUtils.calculateZeroCrossings(samples);
    const zeroCrossingRate = zeroCrossings / samples.length;
    
    // White noise korreláció számítás - SOKKAL SZIGORÚBB
    const isVeryLowEnergyVariance = energyVariance < CV_speechAnalysisConfig.minEnergyVariance * 0.1; // 10x alacsonyabb
    const isVeryHighZeroCrossing = zeroCrossingRate > 0.6; // Magasabb ZCR küszöb
    const isExtremelyLowVariance = CV_VoiceUtils.calculateVariance(samples) < 10; // Extrém alacsony variancia
    
    // Csak akkor white noise, ha MINDEN kritérium teljesül
    return isVeryLowEnergyVariance && isVeryHighZeroCrossing && isExtremelyLowVariance;
  }

  /**
   * Csend detektálás
   * @param volume - RMS volume
   * @param variance - Variancia
   * @param zeroCrossings - Zero crossing száma
   * @returns true ha csend
   */
  private detectSilence(volume: number, variance: number, zeroCrossings: number): boolean {
    const isLowVolume = volume < CV_speechAnalysisConfig.silecndeTreshold;
    const isLowVariance = variance < CV_speechAnalysisConfig.minVariance;
    const isLowZeroCrossings = zeroCrossings < CV_speechAnalysisConfig.minZeroCrossings;
    
    return isLowVolume && isLowVariance && isLowZeroCrossings;
  }

  /**
   * Hang aktivitás pontszám számítás - ZCR prioritással
   * (ZCR: Zero Crossing Rate)
   * @param params - Elemzési paraméterek
   * @returns Hang aktivitás pontszám (0-1)
   */
  private calculateVoiceActivityScore(params: {
    volume: number;
    frequency: number;
    zeroCrossings: number;
    variance: number;
    peakCount: number;
    energyVariance: number;
  }): number {
    const { volume, frequency, zeroCrossings, variance, peakCount, energyVariance } = params;
    
    let score = 0;
    
    // ZCR súlyozás (50%) - FŐ KRITÉRIUM
    const zcr = zeroCrossings / 100; // Normalizált ZCR (0-1 skála)
    let zcrScore = 0;
    
    if (
      zcr >= CV_speechAnalysisConfig.zcrGoodRangeMin && 
      zcr <= CV_speechAnalysisConfig.zcrGoodRangeMax
    ) {
      // Emberi beszéd ZCR tartomány - tökéletes pontszám
      zcrScore = 1.0;
    } else if (
      zcr >= CV_speechAnalysisConfig.zcrAcceptableMin && 
      zcr <= CV_speechAnalysisConfig.zcrAcceptableMax
    ) {
      // Szélesebb tartomány - részleges pontszám
      zcrScore = 0.5;
    } else if (zcr < 0.02) {
      // Túl alacsony ZCR (valószínűleg csend vagy konstans hang)
      zcrScore = 0.1;
    } else if (zcr > 0.9) {
      // Túl magas ZCR (valószínűleg white noise vagy magas frekvenciájú zaj)
      zcrScore = 0.1;
    }
    
    score += zcrScore * 0.5;
    
    // Volume súlyozás (25%) - MÁSODLAGOS
    const volumeScore = Math.min(volume / CV_speechAnalysisConfig.speechTreshold, 1);
    score += volumeScore * 0.25;
    
    // Frekvencia súlyozás (15%)
    const isHumanFrequency = frequency >= CV_speechAnalysisConfig.minFrequencyRange && 
                             frequency <= CV_speechAnalysisConfig.maxFrequencyRange;
    const frequencyScore = isHumanFrequency ? 1 : 0;
    score += frequencyScore * 0.15;
    
    // Variancia súlyozás (10%)
    const varianceScore = variance > CV_speechAnalysisConfig.minVariance ? 1 : 0;
    score += varianceScore * 0.1;
    
    return Math.min(score, 1);
  }

  /**
   * Beszéd detektálás - ZCR alapú
   * @param params - Elemzési paraméterek
   * @returns true ha beszéd
   */
  private detectSpeech(params: {
    volume: number;
    frequency: number;
    zeroCrossings: number;
    variance: number;
    peakCount: number;
    voiceActivityScore: number;
    isWhiteNoise: boolean;
    isSilence: boolean;
  }): boolean {
    const { 
      volume, 
      frequency, 
      zeroCrossings, 
      variance, 
      peakCount, 
      voiceActivityScore, 
      isWhiteNoise, 
      isSilence 
    } = params;
    
    // Ha white noise vagy csend, akkor nem beszéd
    if (isWhiteNoise || isSilence) {
      return false;
    }
    
    // ZCR alapú beszéd detektálás - FŐ KRITÉRIUM
    const zcr = zeroCrossings / 100; // Normalizált ZCR (0-1 skála)
    const isHumanZCR = zcr >= CV_speechAnalysisConfig.zcrGoodRangeMin && 
                       zcr <= CV_speechAnalysisConfig.zcrGoodRangeMax; // Emberi beszéd ZCR tartomány
    
    // Alapvető kritériumok - ZCR prioritással
    const hasAdequateVolume = volume >= CV_speechAnalysisConfig.speechTreshold;
    const hasHumanFrequency = frequency >= CV_speechAnalysisConfig.minFrequencyRange && 
                              frequency <= CV_speechAnalysisConfig.maxFrequencyRange;
    const hasGoodVariance = variance >= CV_speechAnalysisConfig.minVariance;
    const hasPeaks = peakCount >= CV_speechAnalysisConfig.minPeakCount;
    
    // ZCR alapú beszéd detektálás logika
    if (isHumanZCR) {
      // Ha ZCR jó, akkor csak minimális további kritériumok kellenek
      const hasMinimalCriteria = hasAdequateVolume && (hasHumanFrequency || hasGoodVariance);
      
      // Fallback: ha ZCR jó és volume elég, akkor beszéd (frekvencia ellenőrzés nélkül)
      if (!hasMinimalCriteria && hasAdequateVolume && zcr >= 0.1) {
        return true; // ZCR alapú fallback
      }
      
      return hasMinimalCriteria;
    } else {
      // Ha ZCR nem jó, akkor erős további kritériumok kellenek
      const hasStrongCriteria = hasAdequateVolume && 
                                hasHumanFrequency && 
                                hasGoodVariance && 
                                hasPeaks;
      return hasStrongCriteria;
    }
  }

  /**
   * Minőség számítás
   * @param params - Minőség paraméterek
   * @returns Minőség pontszám (0-1)
   */
  private calculateQuality(params: {
    volume: number;
    variance: number;
    peakCount: number;
    voiceActivityScore: number;
  }): number {
    const { volume, variance, peakCount, voiceActivityScore } = params;
    
    let quality = 0;
    
    // Volume minőség (30%)
    const volumeQuality = Math.min(volume / 0.1, 1); // 0.1 = jó volume
    quality += volumeQuality * 0.3;
    
    // Variancia minőség (25%)
    const varianceQuality = Math.min(variance / 10000, 1); // 10000 = jó variancia
    quality += varianceQuality * 0.25;
    
    // Csúcsok minőség (20%)
    const peakQuality = Math.min(peakCount / 10, 1); // 10 csúcs = jó
    quality += peakQuality * 0.2;
    
    // Hang aktivitás minőség (25%)
    quality += voiceActivityScore * 0.25;
    
    return Math.min(quality, 1);
  }

  /**
   * Bizalom számítás
   * @param params - Bizalom paraméterek
   * @returns Bizalom pontszám (0-1)
   */
  private calculateConfidence(params: {
    isSpeech: boolean;
    isWhiteNoise: boolean;
    isSilence: boolean;
    quality: number;
    voiceActivityScore: number;
  }): number {
    const { isSpeech, isWhiteNoise, isSilence, quality, voiceActivityScore } = params;
    
    if (isWhiteNoise) return 0.1; // Alacsony bizalom white noise-re
    if (isSilence) return 0.2;    // Alacsony bizalom csendre
    
    if (isSpeech) {
      // Beszéd bizalom a minőség alapján
      return Math.min(quality * 0.7 + voiceActivityScore * 0.3, 1);
    }
    
    return 0.5; // Közepes bizalom egyéb esetekben
  }

  /**
   * Üres eredmény létrehozása
   * @returns Üres AudioAnalysisResult
   */
  private createEmptyResult(): CV_AudioAnalysisResult {
    return {
      isSpeech: false,
      isWhiteNoise: false,
      isSilence: true,
      quality: 0,
      confidence: 0,
      volume: 0,
      frequency: 0,
      zeroCrossings: 0,
      zcrNormalized: 0,
      variance: 0,
      peakCount: 0,
      energyVariance: 0,
      voiceActivityScore: 0
    };
  }

  /**
   * Debug információk logolása - ZCR és Volume kiemeléssel
   * @param result - Elemzési eredmény
   * @param userId - Felhasználó ID
   */
  public logAnalysisDebug(result: CV_AudioAnalysisResult, userId: string): void {
    // Csak jelentős aktivitás esetén logolás
    if (result.volume > 0.005 || result.isSpeech) {
      const debugInfo = CV_VoiceUtils.formatDebugInfo(result, userId);
      const failureReason = CV_VoiceUtils.getSpeechDetectionFailureReason(result);
      // Compact log option
      if (
        CV_Analysis_ControlService.compactAudioAnalysisLog && 
        debugInfo.startsWith('🎤 Audio Analysis')
      ) {
        const zcr = result.zeroCrossings / 100;
        const ZCR_GATE = 0.3;
        CV_Analysis_ControlService._logCompactAudioAnalysis(zcr, ZCR_GATE);
        CV_Analysis_ControlService._lastWasAudioAnalysis = true;
        return;
      } else {
        // If previous was compact, print newline and reset
        if (CV_Analysis_ControlService._lastWasAudioAnalysis) {
          process.stdout.write('\n');
          CV_Analysis_ControlService._compactLogBuffer = '';
          CV_Analysis_ControlService._compactLogCount = 0;
          CV_Analysis_ControlService._lastWasAudioAnalysis = false;
        }
        
        DyFM_Log.info(`${debugInfo}${failureReason ? `, Fail=${failureReason}` : ''}`);
      }
    }
  }
} 