import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Log } from '@futdevpro/fsm-dynamo';
import { CV_voiceRecordingConfig } from '../_collections/consts/cv-voice-recording.const.js';
import { CV_UserSpeechState } from '../_models/cv-user-speech-state.interface.js';
import { CV_SpeechSegment } from '../_models/cv-speech-segment.interface.js';
import { CV_UserSpeechStateEnum } from '../_enums/cv-user-speech-state.enum.js';


/**
 * CCAP Voice Segment Service
 * @author AI
 * @description Beszéd szegmens kezelés és input merging
 */
export class CV_Segment_ControlService extends DyNTS_SingletonService {

  static getInstance(): CV_Segment_ControlService {
    return CV_Segment_ControlService.getSingletonInstance();
  }

  debugLog: boolean = false;

  /**
   * Felhasználó beszéd állapot inicializálása
   * @param userId - Felhasználó ID
   * @returns Inicializált UserSpeechState
   */
  public initializeUserSpeechState(userId: string): CV_UserSpeechState {
    const state: CV_UserSpeechState = {
      // Alapvető állapot
      currentState: CV_UserSpeechStateEnum.silence,
      stateStartTime: Date.now(),
      
      // Frame counting
      speechFrames: 0,
      silenceFrames: 0,
      
      // Volume tracking
      volumeBuffer: [],
      lastVolume: 0,
      
      // ZCR tracking
      zcrBuffer: [],
      lastZCR: 0,
      
      // Timing
      lastActivityTime: Date.now(),
      recordingStartTime: Date.now(),
      
      // === INPUT MERGING MEGOLDÁS ===
      // Merge management
      isMerging: false,
      mergeStartTime: 0,
      mergeTimeout: null,
      speechSegments: [],
      currentSegmentStartTime: 0,
      currentSegmentWavFile: null,
      
      // File management
      pendingWavFile: null,
      isProcessing: false,
      
      // Statistics
      totalSpeechTime: 0,
      totalSilenceTime: 0,
      frameCount: 0,
      mergeCount: 0
    };

    DyFM_Log.info(`🎤 Beszéd állapot inicializálva: ${userId}`);
    return state;
  }

  /**
   * Beszéd állapot frissítése és állapot kezelés
   * @param state - Felhasználó beszéd állapot
   * @param hasSpeech - Van-e beszéd
   * @param volume - Volume érték
   * @param userId - Felhasználó ID (debug célokra)
   * @returns Frissített állapot és események
   */
  public updateSpeechState(
    state: CV_UserSpeechState, 
    hasSpeech: boolean, 
    volume: number, 
    zcr: number,
    userId: string
  ): { 
    state: CV_UserSpeechState; 
    events: { 
      speechStarted?: boolean; 
      speechEnded?: boolean; 
      duration?: number 
    } 
  } {
    const events: { speechStarted?: boolean; speechEnded?: boolean; duration?: number } = {};
    
    state.frameCount++;
    state.lastVolume = volume;
    state.lastZCR = zcr;
    state.lastActivityTime = Date.now();
    
    // Volume buffer frissítése
    state.volumeBuffer.push(volume);
    if (state.volumeBuffer.length > CV_voiceRecordingConfig.volumeBufferSize) {
      state.volumeBuffer.shift();
    }
    
    // ZCR buffer frissítése
    state.zcrBuffer.push(zcr);
    if (state.zcrBuffer.length > CV_voiceRecordingConfig.volumeBufferSize) {
      state.zcrBuffer.shift();
    }
    
    // Frame counting - csak ha van valódi hang aktivitás
    if (hasSpeech && volume > CV_voiceRecordingConfig.speechThreshold) {
      state.speechFrames++;
      state.silenceFrames = 0;
    } else {
      state.silenceFrames++;
      state.speechFrames = 0;
    }
    
    // State transition logic
    const currentTime = Date.now();
    const stateDuration = currentTime - state.stateStartTime;
    
    switch (state.currentState) {
      case CV_UserSpeechStateEnum.silence:
        // Csend → Beszéd transition - csak ha van valódi beszéd
        if (
          state.speechFrames >= CV_voiceRecordingConfig.speechConfirmationFrames && 
          volume > CV_voiceRecordingConfig.speechThreshold
        ) {
          this.transitionToSpeech(state, currentTime, userId);
          events.speechStarted = true;
        }
        break;
        
      case CV_UserSpeechStateEnum.speech:
        // Beszéd → Csend transition
        if (state.silenceFrames >= CV_voiceRecordingConfig.silenceConfirmationFrames) {
          this.transitionToSilence(state, currentTime, userId);
          events.speechEnded = true;
          events.duration = stateDuration;
        }
        // Maximum beszéd idő ellenőrzése
        else if (stateDuration >= CV_voiceRecordingConfig.maxSpeechDuration) {
          this.handleMaxRecordingTimeReached(state, userId);
          events.speechEnded = true;
          events.duration = stateDuration;
        }
        break;
        
      case CV_UserSpeechStateEnum.transitioning:
        // Transition állapot kezelése
        if (
          state.speechFrames >= CV_voiceRecordingConfig.speechConfirmationFrames && 
          volume > CV_voiceRecordingConfig.speechThreshold
        ) {
          this.transitionToSpeech(state, currentTime, userId);
          events.speechStarted = true;
        } else if (state.silenceFrames >= CV_voiceRecordingConfig.silenceConfirmationFrames) {
          this.transitionToSilence(state, currentTime, userId);
          events.speechEnded = true;
          events.duration = stateDuration;
        }
        break;
    }
    
    // Debug logging - csak ha van jelentős hang aktivitás
    if (
      CV_voiceRecordingConfig.debug_volumeLogging && 
      state.frameCount % 50 === 0 && 
      volume > 0.01
    ) {
      DyFM_Log.info(
        `📊 Volume debug (${userId}): ` +
        `state=${state.currentState}, ` +
        `volume=${volume.toFixed(4)}, ` +
        `speechFrames=${state.speechFrames}, ` +
        `silenceFrames=${state.silenceFrames}`
      );
    }
    
    // Additional debug logging for state transitions
    if (this.debugLog && (events.speechStarted || events.speechEnded)) {
      DyFM_Log.log(
        `🔍 DEBUG: State transition (${userId}): ` +
        `speechStarted=${events.speechStarted}, ` +
        `speechEnded=${events.speechEnded}, ` +
        `duration=${events.duration}ms`
      );
      DyFM_Log.log(
        `🔍 DEBUG: Current state: ${state.currentState}, ` +
        `speechFrames: ${state.speechFrames}, ` +
        `silenceFrames: ${state.silenceFrames}`
      );
    }

    return { state, events };
  }

  /**
   * Beszéd állapotra váltás
   * @param state - Felhasználó beszéd állapot
   * @param timestamp - Váltás időpontja
   * @param userId - Felhasználó ID
   */
  private transitionToSpeech(state: CV_UserSpeechState, timestamp: number, userId: string): void {
    const previousState = state.currentState;
    const stateDuration = timestamp - state.stateStartTime;
    
    // Előző állapot statisztikáinak frissítése
    if (previousState === CV_UserSpeechStateEnum.silence) {
      state.totalSilenceTime += stateDuration;
    }
    
    // Új állapot beállítása
    state.currentState = CV_UserSpeechStateEnum.speech;
    state.stateStartTime = timestamp;
    state.speechFrames = 0;
    state.silenceFrames = 0;
    
    // Input merging kezelés - új szegmens indítása
    if (CV_voiceRecordingConfig.enableInputMerging) {
      this.startNewSpeechSegment(state, timestamp, userId);
    }
    
    // Debug logging
    if (CV_voiceRecordingConfig.debug_stateChanges) {
      DyFM_Log.info(
        `🔊 SPEECH START (${userId}): Previous state was ${previousState} for ${stateDuration}ms`
      );
    }
  }

  /**
   * Csend állapotra váltás
   * @param state - Felhasználó beszéd állapot
   * @param timestamp - Váltás időpontja
   * @param userId - Felhasználó ID
   */
  private transitionToSilence(state: CV_UserSpeechState, timestamp: number, userId: string): void {
    const previousState = state.currentState;
    const stateDuration = timestamp - state.stateStartTime;
    
    // Előző állapot statisztikáinak frissítése
    if (previousState === CV_UserSpeechStateEnum.speech) {
      state.totalSpeechTime += stateDuration;
      
      // Input merging kezelés - beszéd szegmens befejezése
      if (CV_voiceRecordingConfig.enableInputMerging) {
        this.endSpeechSegment(state, timestamp, userId);
      }
    }
    
    // Új állapot beállítása
    state.currentState = CV_UserSpeechStateEnum.silence;
    state.stateStartTime = timestamp;
    state.speechFrames = 0;
    state.silenceFrames = 0;
    
    // Debug logging
    if (CV_voiceRecordingConfig.debug_stateChanges) {
      // Átlagos ZCR és volume számítása
      const avgVolume = state.volumeBuffer.length > 0 
        ? state.volumeBuffer.reduce((a, b) => a + b, 0) / state.volumeBuffer.length 
        : 0;
      const avgZCR = state.zcrBuffer.length > 0 
        ? state.zcrBuffer.reduce((a, b) => a + b, 0) / state.zcrBuffer.length 
        : 0;
      
      DyFM_Log.info(
        `🔇 SILENCE START (${userId}): ` +
        `Previous speech was ${stateDuration}ms, ` +
        `avgVolume: ${avgVolume.toFixed(4)}, ` +
        `avgZCR: ${avgZCR.toFixed(4)}`
      );
      
      // Additional debug info
      if (this.debugLog) {
        DyFM_Log.log(
          `🔍 DEBUG: Volume buffer size: ${state.volumeBuffer.length}, ` +
          `ZCR buffer size: ${state.zcrBuffer.length}`
        );
        if (state.volumeBuffer.length > 0) {
          DyFM_Log.log(
            `🔍 DEBUG: Volume range: ${Math.min(...state.volumeBuffer).toFixed(4)} - ` +
            `${Math.max(...state.volumeBuffer).toFixed(4)}`
          );
        }
        if (state.zcrBuffer.length > 0) {
          DyFM_Log.log(
            `🔍 DEBUG: ZCR range: ${Math.min(...state.zcrBuffer).toFixed(4)} - ` +
            `${Math.max(...state.zcrBuffer).toFixed(4)}`
          );
        }
      }   
    }
  }

  /**
   * Maximum felvétel idő elérése kezelése
   * @param state - Felhasználó beszéd állapot
   * @param userId - Felhasználó ID
   */
  private handleMaxRecordingTimeReached(state: CV_UserSpeechState, userId: string): void {
    DyFM_Log.info(`⏰ Maximum felvétel idő elérve (${userId}), feldolgozás indítása`);
  }

  /**
   * Input merging kezelése
   * @param state - Felhasználó beszéd állapot
   * @param hasSpeech - Van-e beszéd
   * @param volume - Aktuális volume
   * @param filename - WAV fájl útvonala
   * @param userId - Felhasználó ID
   */
  public handleInputMerging(
    state: CV_UserSpeechState, 
    hasSpeech: boolean, 
    volume: number, 
    filename: string, 
    userId: string
  ): void {
    const currentTime = Date.now();

    if (hasSpeech) {
      // Beszéd van - merge timeout törlése
      if (state.mergeTimeout) {
        clearTimeout(state.mergeTimeout);
        state.mergeTimeout = null;
      }

      // Ha még nincs merge folyamatban, indítsuk el
      if (!state.isMerging) {
        this.startMerging(state, currentTime, userId);
      }

      // Aktuális szegmens frissítése
      if (state.currentSegmentWavFile) {
        state.currentSegmentWavFile = filename;
      }
    } else {
      // Csend van - merge timeout beállítása
      if (!state.mergeTimeout && state.isMerging) {
        state.mergeTimeout = setTimeout(() => {
          this.finalizeMerging(state, userId);
        }, CV_voiceRecordingConfig.mergeWaitTime);

        if (CV_voiceRecordingConfig.debug_merging) {
          DyFM_Log.info(
            `⏰ Merge timeout beállítva (${userId}): ${CV_voiceRecordingConfig.mergeWaitTime}ms`
          );
        }
      }
    }
  }

  /**
   * Új beszéd szegmens indítása
   * @param state - Felhasználó beszéd állapot
   * @param timestamp - Időpont
   * @param userId - Felhasználó ID
   */
  private startNewSpeechSegment(state: CV_UserSpeechState, timestamp: number, userId: string): void {
    state.currentSegmentStartTime = timestamp;
    state.currentSegmentWavFile = state.pendingWavFile;

    if (CV_voiceRecordingConfig.debug_merging) {
      DyFM_Log.info(`🎤 Új beszéd szegmens indítva (${userId}): ${state.currentSegmentWavFile}`);
    }
  }

  /**
   * Beszéd szegmens befejezése
   * @param state - Felhasználó beszéd állapot
   * @param timestamp - Időpont
   * @param userId - Felhasználó ID
   */
  private endSpeechSegment(state: CV_UserSpeechState, timestamp: number, userId: string): void {
    if (!state.currentSegmentWavFile) return;

    const segmentDuration = timestamp - state.currentSegmentStartTime;
    
    // Volume statisztikák számítása
    const avgVolume = state.volumeBuffer.length > 0 
      ? state.volumeBuffer.reduce((a, b) => a + b, 0) / state.volumeBuffer.length 
      : 0;
    const maxVolume = state.volumeBuffer.length > 0 ? Math.max(...state.volumeBuffer) : 0;
    const minVolume = state.volumeBuffer.length > 0 ? Math.min(...state.volumeBuffer) : 0;

    // Szegmens hozzáadása a listához
    const segment: CV_SpeechSegment = {
      startTime: state.currentSegmentStartTime,
      endTime: timestamp,
      duration: segmentDuration,
      wavFile: state.currentSegmentWavFile,
      volumeStats: {
        avgVolume,
        maxVolume,
        minVolume
      }
    };

    state.speechSegments.push(segment);

    if (CV_voiceRecordingConfig.debug_merging) {
      DyFM_Log.info(
        `✅ Beszéd szegmens befejezve (${userId}): ` +
        `${segmentDuration}ms, ${state.speechSegments.length} szegmens`
      );
    }

    // Reset aktuális szegmens
    state.currentSegmentStartTime = 0;
    state.currentSegmentWavFile = null;
  }

  /**
   * Merge folyamat indítása
   * @param state - Felhasználó beszéd állapot
   * @param timestamp - Időpont
   * @param userId - Felhasználó ID
   */
  private startMerging(state: CV_UserSpeechState, timestamp: number, userId: string): void {
    state.isMerging = true;
    state.mergeStartTime = timestamp;
    state.mergeCount++;

    if (CV_voiceRecordingConfig.debug_merging) {
      DyFM_Log.info(`🎤 Merge folyamat indítva (${userId}): Merge #${state.mergeCount}`);
    }
  }

  /**
   * Merge folyamat befejezése
   * @param state - Felhasználó beszéd állapot
   * @param userId - Felhasználó ID
   * @returns Merge eredmény
   */
  public finalizeMerging(
    state: CV_UserSpeechState, 
    userId: string
  ): { 
    shouldProcess: boolean; 
    segments: CV_SpeechSegment[]; 
    totalDuration: number 
  } {
    // Aktuális szegmens befejezése, ha van
    if (state.currentSegmentWavFile) {
      this.endSpeechSegment(state, Date.now(), userId);
    }

    const totalDuration = Date.now() - state.mergeStartTime;
    const totalSpeechTime = state.speechSegments.reduce((sum, seg) => sum + seg.duration, 0);

    // Ellenőrizzük a minimum és maximum merge időt
    if (totalSpeechTime < CV_voiceRecordingConfig.minMergeDuration) {
      // Túl rövid merge - szegmensek törlése
      DyFM_Log.info(
        `🗑️ Túl rövid merge figyelmen kívül hagyva (${userId}): ` +
        `${totalSpeechTime}ms < ${CV_voiceRecordingConfig.minMergeDuration}ms`
      );
      return { shouldProcess: false, segments: [], totalDuration: 0 };
    }

    if (totalDuration > CV_voiceRecordingConfig.maxMergeDuration) {
      // Túl hosszú merge - feldolgozás indítása
      DyFM_Log.info(
        `⏰ Túl hosszú merge feldolgozásra kerül (${userId}): ` +
        `${totalDuration}ms > ${CV_voiceRecordingConfig.maxMergeDuration}ms`
      );
      return { shouldProcess: true, segments: state.speechSegments, totalDuration };
    }

    // Normál merge befejezése
    DyFM_Log.info(
      `✅ Merge befejezve (${userId}): ` +
      `${state.speechSegments.length} szegmens, ` +
      `${totalSpeechTime}ms beszéd, ` +
      `${totalDuration}ms összesen`
    );
    
    return { shouldProcess: true, segments: state.speechSegments, totalDuration };
  }

  /**
   * Felhasználó állapot cleanup
   * @param state - Felhasználó beszéd állapot
   * @param userId - Felhasználó ID
   */
  public cleanupUserState(state: CV_UserSpeechState, userId: string): void {
    // Timeout törlése
    if (state.mergeTimeout) {
      clearTimeout(state.mergeTimeout);
      state.mergeTimeout = null;
    }

    // Merge timeout törlése
    if (state.mergeTimeout) {
      clearTimeout(state.mergeTimeout);
      state.mergeTimeout = null;
    }

    DyFM_Log.info(
      `🧹 Felhasználó állapot cleanup (${userId}): ` +
      `${state.speechSegments.length} szegmens, ` +
      `${state.totalSpeechTime}ms beszéd`
    );
  }

  /**
   * Volume statisztikák számítása
   * @param state - Felhasználó beszéd állapot
   * @returns Volume statisztikák
   */
  public calculateVolumeStats(
    state: CV_UserSpeechState
  ): { 
    avgVolume: number; 
    maxVolume: number; 
    minVolume: number 
  } {
    const avgVolume = state.volumeBuffer.length > 0 
      ? state.volumeBuffer.reduce((a, b) => a + b, 0) / state.volumeBuffer.length 
      : 0;
    const maxVolume = state.volumeBuffer.length > 0 ? Math.max(...state.volumeBuffer) : 0;
    const minVolume = state.volumeBuffer.length > 0 ? Math.min(...state.volumeBuffer) : 0;

    return { avgVolume, maxVolume, minVolume };
  }

  /**
   * Minőség validáció
   * @param state - Felhasználó beszéd állapot
   * @returns true ha átment a validáción
   */
  public validateQuality(state: CV_UserSpeechState): boolean {
    const { avgVolume, maxVolume } = this.calculateVolumeStats(state);
    
    return avgVolume >= CV_voiceRecordingConfig.speechThreshold && 
           maxVolume >= CV_voiceRecordingConfig.speechThreshold * 1.5 &&
           state.totalSpeechTime >= CV_voiceRecordingConfig.minSpeechDuration;
  }
} 