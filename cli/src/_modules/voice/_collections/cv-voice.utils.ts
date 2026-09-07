import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { CV_ZcrFilterResult } from '../_models/cv-zcr-filter-result.interface.js';
import { CV_audioProcessingConfig } from './consts/cv-audio-processing.const.js';
import { CV_voiceRecordingConfig } from './consts/cv-voice-recording.const.js';

/**
 * CCAP Voice Utilities
 * @author AI
 * @description Common audio processing utilities and helper functions
 */
export class CV_VoiceUtils {
  /**
   * Minták kinyerése a buffer-ből
   * @param buffer - Audio buffer
   * @returns Normalizált minták tömb
   */
  static extractSamples(buffer: Buffer): number[] {
    const samples: number[] = [];
    
    for (let i = 0; i < buffer.length; i += 2) {
      if (i + 1 < buffer.length) {
        const sample = buffer.readInt16LE(i) / 32768; // Normalizálás -1..1-re
        samples.push(sample);
      }
    }
    
    return samples;
  }

  /**
   * RMS (Root Mean Square) számítás
   * @param samples - Minták tömb
   * @returns RMS érték
   */
  static calculateRMS(samples: number[]): number {
    if (samples.length === 0) return 0;
    
    const sum = samples.reduce((acc, sample) => acc + sample * sample, 0);
    return Math.sqrt(sum / samples.length);
  }

  /**
   * Frekvencia becslés
   * @param samples - Minták tömb
   * @returns Becsült frekvencia (Hz)
   */
  static estimateFrequency(samples: number[]): number {
    if (samples.length < 2) return 0;
    
    let zeroCrossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i - 1] < 0 && samples[i] >= 0) || 
          (samples[i - 1] > 0 && samples[i] <= 0)) {
        zeroCrossings++;
      }
    }
    
    // Frekvencia becslés zero crossing rate alapján
    const frequency = (zeroCrossings * CV_audioProcessingConfig.sampleRate) / (2 * samples.length);
    
    return frequency;
  }

  /**
   * Zero crossing számolás
   * @param samples - Minták tömb
   * @returns Zero crossing száma
   */
  static calculateZeroCrossings(samples: number[]): number {
    if (samples.length < 2) return 0;
    
    let zeroCrossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i - 1] < 0 && samples[i] >= 0) || 
          (samples[i - 1] > 0 && samples[i] <= 0)) {
        zeroCrossings++;
      }
    }
    
    return zeroCrossings;
  }

  /**
   * Variancia számítás
   * @param samples - Minták tömb
   * @returns Variancia érték
   */
  static calculateVariance(samples: number[]): number {
    if (samples.length === 0) return 0;
    
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((acc, sample) => {
      return acc + Math.pow(sample - mean, 2);
    }, 0) / samples.length;
    
    return variance;
  }

  /**
   * Csúcsok számolása
   * @param samples - Minták tömb
   * @returns Csúcsok száma
   */
  static countPeaks(samples: number[]): number {
    if (samples.length < 3) return 0;
    
    let peaks = 0;
    const threshold = 0.1; // Csúcs küszöbérték
    
    for (let i = 1; i < samples.length - 1; i++) {
      if (Math.abs(samples[i]) > threshold && 
          samples[i] > samples[i - 1] && 
          samples[i] > samples[i + 1]) {
        peaks++;
      }
    }
    
    return peaks;
  }

  /**
   * Energia variancia számítás
   * @param samples - Minták tömb
   * @returns Energia variancia
   */
  static calculateEnergyVariance(samples: number[]): number {
    if (samples.length < 10) return 0;
    
    const energies: number[] = [];
    const windowSize = Math.min(10, Math.floor(samples.length / 10));
    
    for (let i = 0; i < samples.length - windowSize; i += windowSize) {
      const window = samples.slice(i, i + windowSize);
      const energy = window.reduce((acc, sample) => acc + sample * sample, 0) / window.length;
      energies.push(energy);
    }
    
    if (energies.length === 0) return 0;
    
    const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
    const variance = energies.reduce((acc, energy) => {
      return acc + Math.pow(energy - mean, 2);
    }, 0) / energies.length;
    
    return variance;
  }

  /**
   * Configurable+ FOLYAMATOS NEM-ZÖLD FRAME SZŰRÉSE
   * Eltávolítja a configurable vagy több egymást követő nem-zöld (ZCR küszöb alatti) frame-et
   * ÉS MINDENT AMI UTÁNA JÖN, amíg nem-zöld marad
   * @param zcrBuffer ZCR értékek tömbje
   * @param volumeBuffer Volume értékek tömbje
   * @param zcrGate ZCR küszöb
   * @returns Szűrt bufferok és eltávolított elemek száma
   */
  static filterLongNonGreenSequences(
    zcrBuffer: number[], 
    volumeBuffer: number[], 
    zcrGate: number
  ): CV_ZcrFilterResult {
    const filteredZcr: number[] = [];
    const filteredVolume: number[] = [];
    let i = 0;
    let removedCount = 0;
    
    while (i < zcrBuffer.length) {
      if (zcrBuffer[i] < zcrGate) {
        // Kezdjük el számolni a nem-zöld szekvenciát
        let start = i;
        while (i < zcrBuffer.length && zcrBuffer[i] < zcrGate) i++;
        const len = i - start;
        
        if (len >= CV_voiceRecordingConfig.zcrFilteringCount) {
          // Configurable+ hosszú nem-zöld szekvencia: MINDENT ELTÁVOLÍTUNK INNENTŐL KEZDVE
          const totalRemoved = zcrBuffer.length - start;
          removedCount += totalRemoved;
          DyFM_Log.info(`🔪 [ZCR szűrés] ${CV_voiceRecordingConfig.zcrFilteringCount}+ nem-zöld frame találva (${len} db), minden eltávolítva innentől (${totalRemoved} db összesen)`);
          break; // Kilépünk a ciklusból, nem dolgozunk fel többet
        } else {
          // Configurable-nál rövidebb: megtartjuk
          for (let j = start; j < i; j++) {
            filteredZcr.push(zcrBuffer[j]);
            filteredVolume.push(volumeBuffer[j]);
          }
        }
      } else {
        // Zöld frame: megtartjuk
        filteredZcr.push(zcrBuffer[i]);
        filteredVolume.push(volumeBuffer[i]);
        i++;
      }
    }
    
    return { filteredZcr, filteredVolume, removedCount };
  }

  /**
   * ZCR vizuális sáv logolása
   * @param zcrBuffer ZCR értékek tömbje
   * @param zcrGate ZCR küszöb
   */
  static logZcrAnalysisBar(zcrBuffer: number[], zcrGate: number): void {
    let bar = '';
    for (const zcr of zcrBuffer) {
      if (zcr >= zcrGate) {
        bar += '\x1b[32m||\x1b[0m'; // zöld
      } else if (zcr > zcrGate * 0.9) {
        bar += '\x1b[33m||\x1b[0m'; // sárga (ambiguous)
      } else {
        bar += '\x1b[31m||\x1b[0m'; // piros
      }
    }
    DyFM_Log.log(`📊 [ZCR vizuális sáv] (${zcrBuffer.length}) ${bar}`);
  }

  /**
   * Volume statisztikák számítása
   * @param volumeBuffer Volume értékek tömbje
   * @returns Volume statisztikák
   */
  static calculateVolumeStats(
    volumeBuffer: number[]
  ): { avgVolume: number; maxVolume: number; minVolume: number } {
    if (volumeBuffer.length === 0) {
      return { avgVolume: 0, maxVolume: 0, minVolume: 0 };
    }
    
    const avgVolume = volumeBuffer.reduce((a, b) => a + b, 0) / volumeBuffer.length;
    const maxVolume = Math.max(...volumeBuffer);
    const minVolume = Math.min(...volumeBuffer);
    
    return { avgVolume, maxVolume, minVolume };
  }

  /**
   * ZCR statisztikák számítása
   * @param zcrBuffer ZCR értékek tömbje
   * @returns ZCR statisztikák
   */
  static calculateZcrStats(
    zcrBuffer: number[]
  ): { avgZCR: number; maxZCR: number; minZCR: number } {
    if (zcrBuffer.length === 0) {
      return { avgZCR: 0, maxZCR: 0, minZCR: 0 };
    }
    
    const avgZCR = zcrBuffer.reduce((a, b) => a + b, 0) / zcrBuffer.length;
    const maxZCR = Math.max(...zcrBuffer);
    const minZCR = Math.min(...zcrBuffer);
    
    return { avgZCR, maxZCR, minZCR };
  }

  /**
   * Majority-green ZCR validáció
   * @param zcrBuffer ZCR értékek tömbje
   * @param zcrGate ZCR küszöb
   * @returns Validáció eredménye
   */
  static validateMajorityGreenZCR(zcrBuffer: number[], zcrGate: number): { 
    isValid: boolean; 
    goodRatio: number; 
    goodCount: number; 
    totalCount: number 
  } {
    const totalCount = zcrBuffer.length;
    if (totalCount === 0) {
      return { isValid: false, goodRatio: 0, goodCount: 0, totalCount: 0 };
    }
    
    const goodCount = zcrBuffer.filter(zcr => zcr >= zcrGate).length;
    const goodRatio = goodCount / totalCount;
    const isValid = goodRatio > 0.5; // 50% küszöb
    
    return { isValid, goodRatio, goodCount, totalCount };
  }

  /**
   * Debug információk formázása
   * @param result Elemzési eredmény
   * @param userId Felhasználó ID
   * @returns Formázott debug string
   */
  static formatDebugInfo(result: any, userId: string): string {
    const zcr = result.zeroCrossings / 100; // Normalizált ZCR
    const zcrStatus = zcr >= 0.05 && zcr <= 0.8 ? "GOOD" : 
                     zcr >= 0.03 && zcr <= 0.9 ? "OK" :
                     zcr < 0.02 ? "LOW" : "HIGH";
    
    // Gate értékek
    const ZCR_GATE = 0.3;
    const VOLUME_GATE = 0.008;
    
    // Kiemelés logika
    const isZCRAboveGate = zcr >= ZCR_GATE;
    const isVolumeAboveGate = result.volume >= VOLUME_GATE;
    
    // ANSI szín kódok
    const RESET = '\x1b[0m';
    const GREEN = '\x1b[32m';
    const BLUE = '\x1b[34m';
    const YELLOW = '\x1b[33m';
    
    // ZCR kiemelés
    let zcrHighlight = '';
    if (isZCRAboveGate) {
      zcrHighlight = `${BLUE}ZCR=${zcr.toFixed(3)}(${zcrStatus})${RESET}`;
    } else {
      zcrHighlight = `ZCR=${zcr.toFixed(3)}(${zcrStatus})`;
    }
    
    // Volume kiemelés
    let volumeHighlight = '';
    if (isVolumeAboveGate) {
      volumeHighlight = `${YELLOW}Volume=${result.volume.toFixed(4)}${RESET}`;
    } else {
      volumeHighlight = `Volume=${result.volume.toFixed(4)}`;
    }
    
    // Mindkettő kiemelése ha mindkettő felette van
    if (isZCRAboveGate && isVolumeAboveGate) {
      zcrHighlight = `${GREEN}ZCR=${zcr.toFixed(3)}(${zcrStatus})${RESET}`;
      volumeHighlight = `${GREEN}Volume=${result.volume.toFixed(4)}${RESET}`;
    }
    
    return `🎤 Audio Analysis (${userId}): ` +
    `Speech=${result.isSpeech}, ` +`${zcrHighlight}, ` +`${volumeHighlight}, ` +
    `Freq=${result.frequency.toFixed(0)}Hz, ` +
    `Quality=${result.quality.toFixed(2)}, ` +
    `Var=${result.variance.toFixed(0)}`;
  }

  /**
   * Speech detection failure reason meghatározása
   * @param result Elemzési eredmény
   * @returns Failure reason string
   */
  static getSpeechDetectionFailureReason(result: any): string {
    if (!result.isSpeech && result.volume > 0.01) {
      const zcr = result.zeroCrossings / 100;
      const isHumanZCR = zcr >= 0.05 && zcr <= 0.8;
      const hasAdequateVolume = result.volume >= 0.008;
      const hasHumanFrequency = result.frequency >= 80 && result.frequency <= 300;
      const hasGoodVariance = result.variance >= 100;
      
      if (result.isWhiteNoise) return "🔇 WHITE_NOISE";
      else if (result.isSilence) return "🔇 SILENCE";
      else if (!isHumanZCR) return "❌ BAD_ZCR";
      else if (!hasAdequateVolume) return "🔉 LOW_VOLUME";
      else if (!hasHumanFrequency) return "🎵 BAD_FREQ";
      else if (!hasGoodVariance) return "📊 LOW_VAR";
      else return "❓ UNKNOWN";
    }
    return "";
  }

  /**
   * ZCR/volume szegmensek szétválasztása: zöld blokkok összevonása, ha a köztük lévő piros blokk rövid
   * @param zcrBuffer ZCR értékek tömbje
   * @param volumeBuffer Volume értékek tömbje
   * @param zcrGate ZCR küszöb
   * @param minGreenBlockLength Minimum zöld blokk hossz (frame)
   * @param maxRedGapLength Két zöld blokk közötti maximális piros szünet hossza (frame), ami még összevonható
   * @returns Minden zöld blokk külön tömbben: { zcr: number[], volume: number[], start: number, end: number }[]
   *
   * A metódus végigmegy a bufferokon, minden olyan blokkot külön tömbbe tesz,
   * ahol a frame-ek többsége zöld (zcr >= zcrGate, legalább minGreenBlockLength hosszú).
   * Ha két zöld blokk között csak rövid piros szünet van (maxRedGapLength alatt),
   * akkor azokat összevonja egy blokkba.
   * A visszaadott blokkok tartalmazzák a start és end indexet is.
   */
  static extractAllGreenBlocks(
    zcrBuffer: number[],
    volumeBuffer: number[],
    zcrGate: number,
    minGreenBlockLength: number = 10,
    maxRedGapLength: number = 2
  ): Array<{ zcr: number[]; volume: number[]; start: number; end: number }> {
    const greenBlocks: Array<{ zcr: number[]; volume: number[]; start: number; end: number }> = [];
    let i = 0;
    let currentBlockStart: number | null = null;
    let lastGreenEnd: number | null = null;
    while (i < zcrBuffer.length) {
      if (zcrBuffer[i] >= zcrGate) {
        if (currentBlockStart === null) {
          currentBlockStart = i;
        }
        lastGreenEnd = i;
        i++;
      } else {
        // Piros blokk kezdete
        let redStart = i;
        while (i < zcrBuffer.length && zcrBuffer[i] < zcrGate) i++;
        let redEnd = i - 1;
        let redLength = redEnd - redStart + 1;
        // Ha volt zöld blokk előtte
        if (currentBlockStart !== null && lastGreenEnd !== null) {
          // Nézzük, hogy a piros blokk rövid-e
          if (redLength <= maxRedGapLength && i < zcrBuffer.length && zcrBuffer[i] >= zcrGate) {
            // Rövid piros szünet, folytatjuk a blokkot
            continue;
          } else {
            // Zöld blokk vége, elég hosszú-e?
            if ((lastGreenEnd - currentBlockStart + 1) >= minGreenBlockLength) {
              greenBlocks.push({
                zcr: zcrBuffer.slice(currentBlockStart, lastGreenEnd + 1),
                volume: volumeBuffer.slice(currentBlockStart, lastGreenEnd + 1),
                start: currentBlockStart,
                end: lastGreenEnd
              });
            }
            currentBlockStart = null;
            lastGreenEnd = null;
          }
        }
      }
    }
    // Ha a végén zöld blokkban vagyunk
    if (currentBlockStart !== null && lastGreenEnd !== null && (lastGreenEnd - currentBlockStart + 1) >= minGreenBlockLength) {
      greenBlocks.push({
        zcr: zcrBuffer.slice(currentBlockStart, lastGreenEnd + 1),
        volume: volumeBuffer.slice(currentBlockStart, lastGreenEnd + 1),
        start: currentBlockStart,
        end: lastGreenEnd
      });
    }
    return greenBlocks;
  }

  /**
   * Minden zöld régió (kontiguitás) megtalálása a ZCR bufferben
   * @param zcrBuffer ZCR értékek tömbje
   * @param volumeBuffer Volume értékek tömbje
   * @param zcrGate ZCR küszöb
   * @returns Minden zöld régió: { zcr: number[], volume: number[], start: number, end: number }[]
   *
   * A metódus végigmegy a bufferokon, minden egymást követő zöld frame-ből (zcr >= zcrGate) blokkot képez.
   * A piros frame-ek (zcr < zcrGate) mindig megszakítják a blokkot.
   */
  static findAllGreenRegions(
    zcrBuffer: number[],
    volumeBuffer: number[],
    zcrGate: number
  ): Array<{ zcr: number[]; volume: number[]; start: number; end: number }> {
    const greenRegions: Array<{ zcr: number[]; volume: number[]; start: number; end: number }> = [];
    let i = 0;
    while (i < zcrBuffer.length) {
      if (zcrBuffer[i] >= zcrGate) {
        let blockStart = i;
        while (i < zcrBuffer.length && zcrBuffer[i] >= zcrGate) i++;
        let blockEnd = i - 1;
        greenRegions.push({
          zcr: zcrBuffer.slice(blockStart, blockEnd + 1),
          volume: volumeBuffer.slice(blockStart, blockEnd + 1),
          start: blockStart,
          end: blockEnd
        });
      } else {
        i++;
      }
    }
    return greenRegions;
  }

  /**
   * ZCR buffer végéről minden piros frame eltávolítása (zcr < zcrGate)
   * @param zcrBuffer ZCR értékek tömbje
   * @param volumeBuffer Volume értékek tömbje
   * @param zcrGate ZCR küszöb
   * @returns { zcr: number[], volume: number[] }
   *
   * A metódus a buffer végétől visszafelé haladva levágja az összes piros frame-et.
   */
  static trimTrailingRedFrames(
    zcrBuffer: number[],
    volumeBuffer: number[],
    zcrGate: number
  ): { zcr: number[]; volume: number[] } {
    let end = zcrBuffer.length - 1;
    while (end >= 0 && zcrBuffer[end] < zcrGate) {
      end--;
    }
    return {
      zcr: zcrBuffer.slice(0, end + 1),
      volume: volumeBuffer.slice(0, end + 1)
    };
  }

  /**
   * ZCR buffer elejéről minden piros frame eltávolítása (zcr < zcrGate)
   * @param zcrBuffer ZCR értékek tömbje
   * @param volumeBuffer Volume értékek tömbje
   * @param zcrGate ZCR küszöb
   * @returns { zcr: number[], volume: number[] }
   *
   * A metódus a buffer elejétől előrefelé haladva levágja az összes piros frame-et.
   */
  static trimLeadingRedFrames(
    zcrBuffer: number[],
    volumeBuffer: number[],
    zcrGate: number
  ): { zcr: number[]; volume: number[] } {
    let start = 0;
    while (start < zcrBuffer.length && zcrBuffer[start] < zcrGate) {
      start++;
    }
    return {
      zcr: zcrBuffer.slice(start),
      volume: volumeBuffer.slice(start)
    };
  }

  /**
   * ZCR buffer vizualizációja színes sávval (zöld/piros/sárga)
   * @param zcrBuffer ZCR értékek tömbje
   * @param zcrGate ZCR küszöb
   *
   * A metódus színes sávot ír ki a konzolra, ahol a zöld a zcr >= zcrGate,
   * a piros a zcr < zcrGate * 0.9, a sárga a kettő között van.
   */
  static visualizeZCR(zcrBuffer: number[], zcrGate: number): string {
    let bar = '';
    for (const zcr of zcrBuffer) {
      if (zcr >= zcrGate) {
        bar += '\x1b[32m|\x1b[0m'; // zöld
      } else if (zcr > zcrGate * 0.9) {
        bar += '\x1b[33m|\x1b[0m'; // sárga
      } else {
        bar += '\x1b[31m|\x1b[0m'; // piros
      }
    }
    return bar;
  }

  /**
   * Robusztus zöld blokk keresés: zöld blokkot kezdünk, ha zöld frame-et találunk,
   * és csak akkor zárjuk le, ha egymás után maxRedGapLength-nél több piros frame jön.
   * @param zcrBuffer ZCR értékek tömbje
   * @param volumeBuffer Volume értékek tömbje
   * @param zcrGate ZCR küszöb
   * @param maxRedGapLength Engedélyezett piros frame-ek száma blokkban
   * @param minGreenBlockLength Minimum zöld blokk hossz (frame)
   * @returns { zcr: number[], volume: number[], start: number, end: number }[]
   */
  static extractRobustGreenBlocks(
    zcrBuffer: number[],
    volumeBuffer: number[],
    zcrGate: number,
    maxRedGapLength: number = 2,
    minGreenBlockLength: number = 10
  ): Array<{ zcr: number[]; volume: number[]; start: number; end: number }> {
    const blocks: Array<{ zcr: number[]; volume: number[]; start: number; end: number }> = [];
    let i = 0;
    let blockStart: number | null = null;
    let blockEnd: number | null = null;
    let redCount = 0;
    while (i < zcrBuffer.length) {
      if (zcrBuffer[i] >= zcrGate) {
        if (blockStart === null) {
          blockStart = i;
        }
        blockEnd = i;
        redCount = 0;
      } else if (blockStart !== null) {
        redCount++;
        if (redCount > maxRedGapLength) {
          // Close current block if long enough
          if (blockEnd !== null && (blockEnd - blockStart + 1) >= minGreenBlockLength) {
            blocks.push({
              zcr: zcrBuffer.slice(blockStart, blockEnd + 1),
              volume: volumeBuffer.slice(blockStart, blockEnd + 1),
              start: blockStart,
              end: blockEnd
            });
          }
          blockStart = null;
          blockEnd = null;
          redCount = 0;
        }
      }
      i++;
    }
    // At end, push any open block if long enough
    if (blockStart !== null && blockEnd !== null && (blockEnd - blockStart + 1) >= minGreenBlockLength) {
      blocks.push({
        zcr: zcrBuffer.slice(blockStart, blockEnd + 1),
        volume: volumeBuffer.slice(blockStart, blockEnd + 1),
        start: blockStart,
        end: blockEnd
      });
    }
    return blocks;
  }

  /**
   * Szomszédos zöld blokkok összevonása, ha a köztük lévő piros szünet rövid
   * @param blocks Zöld blokkok tömbje (start, end, zcr, volume)
   * @param maxRedGapLength Maximális piros szünet hossza (frame), ami még összevonható
   * @returns Összevont zöld blokkok
   */
  static mergeNearbyGreenBlocks(
    blocks: Array<{ zcr: number[]; volume: number[]; start: number; end: number }>,
    maxRedGapLength: number
  ): Array<{ zcr: number[]; volume: number[]; start: number; end: number }> {
    if (blocks.length === 0) return [];
    const merged: Array<{ zcr: number[]; volume: number[]; start: number; end: number }> = [];
    let current = { ...blocks[0] };
    for (let i = 1; i < blocks.length; i++) {
      const prevEnd = current.end;
      const nextStart = blocks[i].start;
      const gap = nextStart - prevEnd - 1;
      if (gap <= maxRedGapLength) {
        // Összevonjuk a blokkokat
        current.zcr = current.zcr.concat(blocks[i].zcr);
        current.volume = current.volume.concat(blocks[i].volume);
        current.end = blocks[i].end;
      } else {
        merged.push(current);
        current = { ...blocks[i] };
      }
    }
    merged.push(current);
    return merged;
  }
} 