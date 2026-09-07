import { EndBehaviorType, VoiceConnection } from '@discordjs/voice';
import { DyFM_Error, DyFM_Log } from '@futdevpro/fsm-dynamo';
import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { createWriteStream, existsSync, promises as fs, mkdirSync } from 'fs';
import * as path from 'path';
import prism from 'prism-media';
import { Writer } from 'wav';
import { settings } from '../../../_collections/consts/settings.const.js';
import { CVO_CCAPSound } from '../../voice-output/_enums/cvo-ccap-sound.enum.js';
import { CVO_Main_ControlService } from '../../voice-output/_services/cvo-main.control-service.js';
import { CV_voiceRecordingConfig } from '../_collections/consts/cv-voice-recording.const.js';
import { CV_VoiceUtils } from '../_collections/cv-voice.utils.js';
import { CV_SpeechRecognizerService } from '../_enums/cv-speech-recognizer-service.enum.js';
import { CV_UserSpeechState } from '../_models/cv-user-speech-state.interface.js';
import { CV_Analysis_ControlService } from './cv-analysis.control-service.js';
import { CV_Segment_ControlService } from './cv-segment.control-service.js';

/**
 * CCAP Voice Recording Control Service
 * @author AI
 * @description PCM recording and WAV file management
 */
export class CV_Recording_ControlService extends DyNTS_SingletonService {
  
  static getInstance(): CV_Recording_ControlService {
    return CV_Recording_ControlService.getSingletonInstance();
  }

  private readonly analysis_CS: CV_Analysis_ControlService = CV_Analysis_ControlService.getInstance();
  private readonly segment_CS: CV_Segment_ControlService = CV_Segment_ControlService.getInstance();
  private readonly voiceOutput_CS: CVO_Main_ControlService = CVO_Main_ControlService.getInstance();

  // --- PCM rögzítéshez szükséges mezők ---
  private readonly recordingsDir: string = path.join(process.cwd(), 'recordings');
  private pcmUserStreams: Map<string, ReturnType<typeof createWriteStream>> = new Map();
  private wavUserStreams: Map<
    string, 
    { 
      writer: Writer, 
      stream: ReturnType<typeof createWriteStream> 
    }
  > = new Map();

  // --- ÚJ SPEECH DETECTION MEGOLDÁS ---
  private userSpeechStates: Map<string, CV_UserSpeechState> = new Map();
  
  // === CENTRALIZED FILE DELETION SYSTEM ===
  private pendingFileDeletions: Map<
    string, 
    { 
      filename: string; 
      userId: string; 
      timestamp: number 
    }
  > = new Map();

  // === DUPLICATE DISPATCH PREVENTION SYSTEM ===
  private processedFiles: Set<string> = new Set();
  private processingInProgress: Set<string> = new Set();

  debugLog: boolean = false;

  /**
   * Recordings könyvtár tisztítása indításkor
   */
  async clearRecordingsFolder(): Promise<void> {
    try {
      if (existsSync(this.recordingsDir)) {
        const files = await fs.readdir(this.recordingsDir);
        for (const file of files) {
          const filePath = path.join(this.recordingsDir, file);
          await fs.unlink(filePath);
        }
        DyFM_Log.info(`🧹 Recordings könyvtár tisztítva: ${files.length} fájl törölve`);
      }
    } catch (error) {
      DyFM_Log.error('❌ Hiba a recordings könyvtár tisztítása során:', error);
    }
  }

  /**
   * Recordings könyvtár inicializálása
   */
  async initializeRecordingsDirectory(): Promise<void> {
    await this.clearRecordingsFolder();
    if (!existsSync(this.recordingsDir)) {
      mkdirSync(this.recordingsDir, { recursive: true });
    }
  }

  /**
   * PCM hang streamek kezelése, WAV mentés és Whisper feldolgozás
   * Minden beszélő userhez külön .wav fájl készül (16bit WAV, 48kHz, sztereó)
   */
  handlePcmReceiver(connection: VoiceConnection): void {
    if (!connection) return;
    const receiver = connection.receiver;
    
    receiver.speaking.on('start', (userId: string) => {
      try {
        DyFM_Log.H_info(`🎤 Speaking started for user: ${userId}`);

        if (this.wavUserStreams.has(userId)) return;
        
        // Felhasználó beszéd állapot inicializálása
        this.initializeUserSpeechState(userId);
        this.logStateDebug(userId, 'speaking.start');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.join(this.recordingsDir, `recording-${userId}-${timestamp}.wav`);
        
        const opusStream = receiver.subscribe(userId, {
          end: { behavior: EndBehaviorType.AfterSilence, duration: 1000 },
        });
        
        const decoder = new prism.opus.Decoder({ 
          frameSize: 960, 
          channels: 2, 
          rate: 48000 
        });

        const wavWriter = new Writer({
          channels: 2,
          sampleRate: 48000,
          bitDepth: 16
        });

        const out = createWriteStream(filename);
        
        this.wavUserStreams.set(userId, { writer: wavWriter, stream: out });
        
        // Pipeline létrehozása: opusStream -> decoder -> wavWriter -> out
        opusStream.pipe(decoder).pipe(wavWriter).pipe(out);
        
        // ÚJ SPEECH DETECTION: Volume monitoring és beszéd észlelés
        this.setupSpeechDetection(userId, opusStream, filename);
        
        // Decoder error handling - invalid Opus packets can cause decode errors
        decoder.on('error', (err: Error) => {
          // Invalid packet errors are common and should be handled gracefully
          // Don't crash the entire stream, just log and continue
          if (err.message && err.message.includes('Invalid packet')) {
            DyFM_Log.warn(
              `⚠️  Invalid Opus packet received (${userId}), skipping: ${err.message}`
            );
          } else {
            DyFM_Log.H_error(`❌ Hiba a decoder-ben (${userId}):`, err);
            // For non-packet errors, we might want to clean up
            // but let the stream continue if possible
          }
        });
        
        // WAV writer error handling
        wavWriter.on('error', (err: Error) => {
          DyFM_Log.H_error(`❌ Hiba a WAV writer-ben (${userId}):`, err);
          // Try to end the stream gracefully
          try {
            out.end();
          } catch (endErr) {
            DyFM_Log.error(`❌ Hiba a stream lezárásakor (${userId}):`, endErr);
          }
          this.wavUserStreams.delete(userId);
        });
        
        // Output stream error handling
        out.on('error', (err: Error) => {
          DyFM_Log.H_error(`❌ Hiba az output stream-ben (${userId}):`, err);
          this.wavUserStreams.delete(userId);
        });
        
        opusStream.on('end', async () => {
          out.end();
          this.wavUserStreams.delete(userId);
          DyFM_Log.log(`📁 WAV felvétel vége (${userId}): ${filename}`);
          
          // Stream vége - merge vagy feldolgozás indítása
          if (this.debugLog) {
          DyFM_Log.log(`🔍 DEBUG: handleStreamEnd called for user: ${userId}, file: ${filename}`);
          }
          await this.handleStreamEnd(userId, filename);
        });
        
        opusStream.on('error', (err) => {
          DyFM_Log.H_error(`❌ Hiba az opus stream-ben (${userId}):`, err);
          out.end();
          this.wavUserStreams.delete(userId);
          this.userSpeechStates.delete(userId);
        });
      } catch (error) {
        DyFM_Log.H_error(`❌ Hiba a PCM receiver-ben (${userId}):`, error);
      }
    });
    
    receiver.speaking.on('end', (userId: string) => {
      try {
        // A pipeline automatikusan lezárja a stream-et az opusStream 'end'-re
        // State transitions are now handled by the segment service
        this.logStateDebug(userId, 'speaking.end');
        const userState = this.userSpeechStates.get(userId);
        if (userState) {
          // Calculate average volume and ZCR
          const avgVolume = userState.volumeBuffer.length > 0 
            ? userState.volumeBuffer.reduce((a, b) => a + b, 0) / userState.volumeBuffer.length 
            : 0;
          const avgZCR = userState.zcrBuffer.length > 0 
            ? userState.zcrBuffer.reduce((a, b) => a + b, 0) / userState.zcrBuffer.length 
            : 0;
          
          DyFM_Log.info(
            `🔇 Speaking ended for user: ${userId}, ` +
            `avgVolume: ${avgVolume.toFixed(4)}, ` +
            `avgZCR: ${avgZCR.toFixed(4)}`
          );
          
          // === REMOVED PROCESSING LOGIC ===
          // Processing is now handled exclusively by handleStreamEnd()
          // This prevents multiple processing calls
          if (this.debugLog) {
          DyFM_Log.log(`🔍 DEBUG: Speaking ended for user: ${userId} - waiting for stream end to process`);
          }        
        } else {
          DyFM_Log.info(`🔇 Speaking ended for user: ${userId} (no state found)`);
        }
      } catch (error) {
        DyFM_Error.logSimple(`❌ Hiba a speaking.end esemény kezelése során (${userId}):`, error);
      }
    });
  }

  /**
   * FEJLETT SPEECH DETECTION: Beszéd észlelés és állapot kezelés
   * @param userId - Felhasználó ID
   * @param opusStream - Opus audio stream
   * @param filename - WAV fájl útvonala
   */
  private setupSpeechDetection(userId: string, opusStream: any, filename: string): void {
    const userState = this.userSpeechStates.get(userId);
    if (!userState) {
      DyFM_Log.error(
        `❌ No user state found in setupSpeechDetection for user: ${userId}` +  
        `\nThis should not happen - state should be initialized before this method is called`
      );
      return;
    }

    opusStream.on('data', (chunk: Buffer) => {
      // Double-check state still exists
      const currentState = this.userSpeechStates.get(userId);
      if (!currentState) {
        DyFM_Log.error(
          `❌ User state disappeared during data processing for user: ${userId}`
        );
        return;
      }

      // Fejlett hang elemzés
      const analysis = this.analysis_CS.analyzeAudio(chunk);
      
      // Debug logging
      this.analysis_CS.logAnalysisDebug(analysis, userId);
      
      // Beszéd állapot frissítése az elemzés alapján - use the control service method
      this.updateSpeechState(userId, analysis.isSpeech, analysis.volume, analysis.zcrNormalized);
      
      // Get updated state for further processing
      const updatedState = this.userSpeechStates.get(userId);
      if (!updatedState) {
        DyFM_Log.warn(
          `🔍 DEBUG: User state disappeared after updateSpeechState for user: ${userId}`
        );
        return;
      }
      
      // Pending WAV fájl beállítása, ha még nincs
      if (!updatedState.pendingWavFile) {
        updatedState.pendingWavFile = filename;
        if (this.debugLog) {
        DyFM_Log.log(`🔍 DEBUG: Set pending WAV file for user ${userId}: ${filename}`);
        }
      }
      
      // Input merging kezelés - csak ha valódi beszéd
      if (
        CV_voiceRecordingConfig.enableInputMerging && 
        analysis.isSpeech && 
        !analysis.isWhiteNoise
      ) {
        this.segment_CS.handleInputMerging(
          updatedState, 
          analysis.isSpeech, 
          analysis.volume, 
          filename, 
          userId
        );
      }

      // Optional Agent-3 Porcupine wake word detection
      // DISABLED: Agent-3 Discord integration removed - will use local microphone instead
      // Only process if audio analysis detected speech and not white noise
      // if (analysis.isSpeech && !analysis.isWhiteNoise) {
      //   this.processWithPorcupine(chunk, userId, 'cv-recording').catch((error: unknown) => {
      //     // Don't break voice processing if Porcupine fails
      //     // This is expected if Porcupine is not initialized or Agent-3 is disabled
      //   });
      // }
    });
  }

  /**
   * Process audio chunk with Porcupine wake word detection (optional).
   * Uses dynamic import to avoid breaking if Agent-3 is not available.
   */
  private async processWithPorcupine(
    audioChunk: Buffer,
    userId: string,
    issuer: string
  ): Promise<void> {
    try {
      // Dynamic import to avoid breaking if Agent-3 is not initialized
      const porcupineModule = await import('../../agent-3/_services/porcupine/agt3-porcupine.control-service');
      const resamplerModule = await import('../../agent-3/_services/porcupine/agt3-audio-resampler.util-service');
      
      const porcupineService = porcupineModule.CCAP_Agt3_Porcupine_ControlService.getInstance();
      const resampler = resamplerModule.CCAP_Agt3_AudioResampler_UtilService;

      // Check if Porcupine is ready
      if (!porcupineService.isReady()) {
        return;
      }

      // Resample audio from 48kHz stereo to 16kHz mono
      const resampledAudio: Buffer = resampler.resampleToPorcupineFormat(audioChunk);

      // Process with Porcupine
      await porcupineService.processAudioFrame({
        audioFrame: resampledAudio,
        userId: userId,
        issuer: issuer,
      });
    } catch (error) {
      // Don't break voice processing if Porcupine fails or is not available
      // This is expected if Agent-3 is not initialized
    }
  }

  /**
   * Stream vége kezelése - új speech detection alapú
   * @param userId - Felhasználó ID
   * @param filename - WAV fájl útvonala
   */
  private async handleStreamEnd(userId: string, filename: string): Promise<void> {
    DyFM_Log.info(`🚀 [START] handleStreamEnd called for user: ${userId}, file: ${filename}`);
    this.logStateDebug(userId, 'handleStreamEnd');
    
    const userState = this.userSpeechStates.get(userId);
    if (!userState) {
      DyFM_Log.error(
        `❌ No user state found in handleStreamEnd for user: ${userId}` +
        `\nThis indicates the state was deleted prematurely or never initialized` +
        `\nAvailable user states: ${Array.from(this.userSpeechStates.keys()).join(', ')}`
      );
      return;
    }
    
    // Prevent duplicate processing
    if (userState.isProcessing) {
      DyFM_Log.warn(
        `⚠️  User already processing in handleStreamEnd for user: ${userId}` +
        `\n  Skipping duplicate processing, but preserving state for final cleanup`
      );
      return;
    }

    // Ellenőrizzük, hogy volt-e valódi beszéd aktivitás
    const hasSpeechActivity = userState.totalSpeechTime > 0 && 
      userState.totalSpeechTime >= CV_voiceRecordingConfig.minSpeechDuration;

    if (!hasSpeechActivity) {
      DyFM_Log.info(`🔇 Nincs beszéd aktivitás (${userId}), fájl törlése: ${filename}`);
      if (this.debugLog) {
        DyFM_Log.log(
          `🔍 DEBUG: Total speech time: ${userState.totalSpeechTime}ms` +
          `\n  - Minimum required: ${CV_voiceRecordingConfig.minSpeechDuration}ms`
        );
      }
      
      // Fájl törlése, mert nincs benne beszéd
      this.scheduleFileDeletion(filename, userId, 'no-speech-activity');
      
      // === FINAL STATE CLEANUP ===
      if (this.debugLog) {
      DyFM_Log.log(`🔍 DEBUG: Final state cleanup for user: ${userId} (no speech activity)`);
      }
      await this.cleanupAllScheduledFiles(userId);
      this.cleanupProcessedFilesTracking(userId);
      this.userSpeechStates.delete(userId);
      if (this.debugLog) {
      DyFM_Log.log(`🔍 DEBUG: User state deleted for user: ${userId} (no speech activity)`);
      }
      return;
    }

    DyFM_Log.info(`🎤 Van beszéd aktivitás (${userId}), feldolgozás indítása: ${filename}`);
    if (this.debugLog) {
      DyFM_Log.log(
        `🔍 DEBUG: Total speech time: ${userState.totalSpeechTime}ms` +
        `\n  - Frame count: ${userState.frameCount}`
    );
    }

    // Feldolgozás indítása
    await this.processWavFile(userId);
    
    // === FINAL STATE CLEANUP ===
    if (this.debugLog) {
    DyFM_Log.log(`🔍 DEBUG: Final state cleanup for user: ${userId} (after processing)`);
    }
    
    // Execute all scheduled file deletions for this user
    await this.cleanupAllScheduledFiles(userId);
    
    // Clean up processed files tracking for this user
    this.cleanupProcessedFilesTracking(userId);
    
    // This is the ONLY place where we delete the user state after processing
    this.userSpeechStates.delete(userId);
    if (this.debugLog) {
    DyFM_Log.log(`🔍 DEBUG: User state deleted for user: ${userId} (after processing)`);
    }
  }

  /**
   * Felhasználó beszéd állapot inicializálása
   * @param userId - Felhasználó ID
   */
  private initializeUserSpeechState(userId: string): void {
    // Check if state already exists
    const existingState = this.userSpeechStates.get(userId);
    if (existingState) {
      DyFM_Log.warn(`🔍 DEBUG: User state already exists for user: ${userId}, skipping re-initialization`);
      return;
    }

    const state = this.segment_CS.initializeUserSpeechState(userId);
    this.userSpeechStates.set(userId, state);
    if (this.debugLog) {
    DyFM_Log.log(
      `🔍 DEBUG: User speech state initialized for user: ${userId}` +
        `\n  - Total user states now: ${this.userSpeechStates.size}`
    );
    }
  }

  /**
   * Beszéd állapot frissítése és state transition kezelése
   * @param userId - Felhasználó ID
   * @param hasSpeech - Van-e beszéd az aktuális frame-ben
   * @param volume - Aktuális volume érték
   * @param zcr - Aktuális ZCR érték
   */
  private updateSpeechState(userId: string, hasSpeech: boolean, volume: number, zcr: number): void {
    const state = this.userSpeechStates.get(userId);
    if (!state) return;
    
    // Use the segment service for state management
    const { state: updatedState, events } = this.segment_CS.updateSpeechState(
      state, 
      hasSpeech, 
      volume, 
      zcr, 
      userId
    );
    
    // Update the state in our map
    this.userSpeechStates.set(userId, updatedState);
    
    // Debug events - REMOVED PROCESSING TRIGGERS
    if (this.debugLog) {
    if (events.speechStarted) {
      DyFM_Log.log(`🔍 DEBUG: Speech started event for user: ${userId}`);
    }
    if (events.speechEnded) {
      DyFM_Log.log(
          `🔍 DEBUG: Speech ended event for user: ${userId}, duration: ${events.duration}ms` +
          `\n  - waiting for stream end to process`
      );
      }
      // REMOVED: Processing triggers - let handleStreamEnd handle all processing
    }
  }

  /**
   * Rövid beszéd cleanup
   * @param userId - Felhasználó ID
   */
  private cleanupShortSpeech(userId: string): void {
    const state = this.userSpeechStates.get(userId);
    if (!state || !state.pendingWavFile) return;
    
    DyFM_Log.info(`🗑️ Rövid beszéd törlése (${userId}): ${state.pendingWavFile}`);
    this.scheduleFileDeletion(state.pendingWavFile, userId, 'short-speech');
    state.pendingWavFile = null;
  }

  /**
   * Maximum felvétel idő elérése kezelése
   * @param userId - Felhasználó ID
   */
  private handleMaxRecordingTimeReached(userId: string): void {
    const state = this.userSpeechStates.get(userId);
    if (!state) return;
    
    DyFM_Log.info(`⏰ Maximum felvétel idő elérve (${userId}), feldolgozás indítása`);
    this.scheduleWavProcessing(userId);
  }

  /**
   * WAV fájl feldolgozása (legacy method for compatibility)
   * @param userId - Felhasználó ID
   */
  private async processWavFile(userId: string): Promise<void> {
    DyFM_Log.info(`🚀 [LEGACY] processWavFile called for user: ${userId}`);
    if (this.debugLog) {
    DyFM_Log.log(`🔍 DEBUG: processWavFile - checking state for user: ${userId}`);
    }
    const state = this.userSpeechStates.get(userId);
    if (state) {
      if (this.debugLog) {
      DyFM_Log.log(
        `🔍 DEBUG: processWavFile - state found, ` +
        `pendingWavFile: ${state.pendingWavFile ? 'YES' : 'NO'}, ` +
        `isProcessing: ${state.isProcessing}`
      );
      }
    } else {
      DyFM_Log.error(`❌ processWavFile - no state found for user: ${userId}`);
    }
    // Redirect to the new immediate processing method
    await this.processWavFileImmediately(userId);
  }

  /**
   * WAV fájl feldolgozás ütemezése
   * @param userId - Felhasználó ID
   */
  private scheduleWavProcessing(userId: string): void {
    if (this.debugLog) {
    DyFM_Log.log(`🔍 DEBUG: scheduleWavProcessing called for user: ${userId}`);
    }
    
    const state = this.userSpeechStates.get(userId);
    if (!state) {
      DyFM_Log.error(`❌ No state found in scheduleWavProcessing for user: ${userId}`);
      return;
    }
    if (state.isProcessing) {
      DyFM_Log.warn(`⚠️  Already processing in scheduleWavProcessing for user: ${userId}`);
      return;
    }
    
    // === AZONNALI MINŐSÉG ÉRTÉKELÉS ÉS DÖNTÉS ===
    if (this.debugLog) {
    DyFM_Log.log(`🔍 DEBUG: Evaluating audio quality for immediate decision (${userId})`);
    }
    
    // Alapvető ellenőrzések
    if (!state.pendingWavFile) {
      DyFM_Log.warn(`⚠️  No pending WAV file for user: ${userId}`);
      // Try to find the WAV file for this user
      try {
        const files = require('fs').readdirSync(this.recordingsDir);
        const userFile = files.find(
          (file: string) => file.includes(`-${userId}-`) && file.endsWith('.wav')
        );
        if (userFile) {
          const filePath = path.join(this.recordingsDir, userFile);
          state.pendingWavFile = filePath;
          if (this.debugLog) {
          DyFM_Log.log(`🔍 DEBUG: Found WAV file for user ${userId}: ${filePath}`);
          }
        } else {
          DyFM_Log.warn(`⚠️  No WAV file found for user: ${userId}`);
          // Even if no file found, continue with evaluation if we have speech data
          if (state.totalSpeechTime > 0 || state.frameCount > 0) {
            if (this.debugLog) {
            DyFM_Log.log(`🔍 DEBUG: Continuing evaluation without WAV file for user: ${userId}`);
            }
          } else {
            return;
          }
        }
      } catch (err) {
        DyFM_Log.error(`❌ Error finding WAV file for user ${userId}: ${err}`);
        // Continue with evaluation if we have speech data
        if (state.totalSpeechTime > 0 || state.frameCount > 0) {
          if (this.debugLog) {
          DyFM_Log.log(`🔍 DEBUG: Continuing evaluation despite file error for user: ${userId}`);
          }
        } else {
          return;
        }
      }
    }
    
    if (state.totalSpeechTime < CV_voiceRecordingConfig.minSpeechDuration) {
      DyFM_Log.log(
        `🔍 DEBUG: Speech duration too short ` +
        `(${state.totalSpeechTime}ms < ${CV_voiceRecordingConfig.minSpeechDuration}ms), ` +
        `deleting file`
      );
      this.cleanupShortSpeech(userId);
      return;
    }
    
    // Volume és ZCR statisztikák számítása
    const avgVolume = state.volumeBuffer.length > 0 
      ? state.volumeBuffer.reduce((a, b) => a + b, 0) / state.volumeBuffer.length 
      : 0;
    const avgZCR = state.zcrBuffer.length > 0 
      ? state.zcrBuffer.reduce((a, b) => a + b, 0) / state.zcrBuffer.length 
      : 0;
    
    if (this.debugLog) {
    DyFM_Log.log(
      `🔍 DEBUG: Audio stats (${userId}): ` +
      `avgVolume=${avgVolume.toFixed(4)}, ` +
      `avgZCR=${avgZCR.toFixed(4)}, ` +
      `speechTime=${state.totalSpeechTime}ms`
    );
    }
    
    // === ZCR SZŰRÉS ÉS VALIDÁCIÓ ===
    const beforeLen = state.zcrBuffer.length;
    const { filteredZcr, filteredVolume, removedCount } = CV_VoiceUtils.filterLongNonGreenSequences(
      state.zcrBuffer, 
      state.volumeBuffer, 
      settings.voice.thresholds.zcrValidationThreshold
    );
    
    if (removedCount > 0) {
      if (this.debugLog) {
      DyFM_Log.log(
        `🔍 DEBUG: ZCR filtering removed ${removedCount} frames ` +
        `(${beforeLen} → ${filteredZcr.length})`
      );
      }
    }
    
    // Frissített statisztikák a szűrés után
    const totalChunks = filteredZcr.length;
    const goodZCRChunks = filteredZcr.filter(
      zcr => zcr >= settings.voice.thresholds.zcrValidationThreshold
    ).length;
    const goodZCRRatio = totalChunks > 0 ? goodZCRChunks / totalChunks : 0;
    
    if (this.debugLog) {
    DyFM_Log.log(
      `🔍 DEBUG: ZCR validation (${userId}): ` +
      `${goodZCRChunks}/${totalChunks} good frames ` +
      `(${(goodZCRRatio * 100).toFixed(1)}%)`
    );
    }
    
    // === DÖNTÉSI LOGIKA ===
    let shouldProcess = true;
    let reason = '';
    
    // 1. ZCR majority-green validáció
    if (goodZCRRatio <= 0.5) {
      shouldProcess = false;
      reason = `Insufficient ZCR quality: ` +
               `${(goodZCRRatio * 100).toFixed(1)}% good frames (threshold: 50%)`;
    }
    // 2. Volume ellenőrzés
    else if (avgVolume < CV_voiceRecordingConfig.speechThreshold * 0.5) {
      shouldProcess = false;
      reason = `Volume too low: ${avgVolume.toFixed(4)} ` +
      `(threshold: ${(CV_voiceRecordingConfig.speechThreshold * 0.5).toFixed(4)})`;
    }
    // 3. Minimum frame szám
    else if (totalChunks < 10) {
      shouldProcess = false;
      reason = `Too few frames after filtering: ${totalChunks} (minimum: 10)`;
    }
    
    // === DÖNTÉS VÉGREHAJTÁSA ===
    if (shouldProcess) {
      DyFM_Log.info(
        `✅ DECISION: Processing WAV file (${userId}) - Good quality audio detected` +
        `\n  - ZCR ratio: ${(goodZCRRatio * 100).toFixed(1)}%` +
        `\n  - Avg volume: ${avgVolume.toFixed(4)}` +
        `\n  - Speech time: ${state.totalSpeechTime}ms` +
        `\n  - Valid frames: ${totalChunks}`
      );
      
      // Azonnali feldolgozás
      this.processWavFileImmediately(userId);
    } else {
      DyFM_Log.warn(
        `❌ DECISION: Deleting WAV file (${userId}) - ${reason}` +
        `\n  - ZCR ratio: ${(goodZCRRatio * 100).toFixed(1)}%` +
        `\n  - Avg volume: ${avgVolume.toFixed(4)}` +
        `\n  - Speech time: ${state.totalSpeechTime}ms` +
        `\n  - Valid frames: ${totalChunks}`
      );
      
      // ZCR vizuális sáv megjelenítése törlés előtt
      if (CV_voiceRecordingConfig.analysisBarLog) {
        DyFM_Log.log(`📊 [ZCR vizuális sáv] - Felhasználó: ${userId}`);
        CV_VoiceUtils.logZcrAnalysisBar(
          state.zcrBuffer, 
          settings.voice.thresholds.zcrValidationThreshold
        );
      }
      
      // Fájl törlése - csak ha van pending file
      if (state.pendingWavFile) {
        this.scheduleFileDeletion(state.pendingWavFile, userId, 'quality-check-failed');
      }
      state.pendingWavFile = null;
      state.zcrBuffer = [];
      state.volumeBuffer = [];
      state.frameCount = 0;
      // DON'T delete state here - let handleStreamEnd handle it after WAV recording ends
      DyFM_Log.warn(
        `⚠️  Quality check failed, but preserving state for WAV recording end (${userId})`
      );
    }
  }

  /**
   * Azonnali WAV fájl feldolgozás (timeout nélkül)
   * @param userId - Felhasználó ID
   */
  private async processWavFileImmediately(userId: string): Promise<void> {
    DyFM_Log.info(`🚀 [IMMEDIATE] processWavFileImmediately called for user: ${userId}`);
    
    const state = this.userSpeechStates.get(userId);
    if (!state || !state.pendingWavFile) {
      DyFM_Log.warn(`⚠️  No state or pending file for immediate processing (${userId})`);
      return;
    }
    
    const filename = state.pendingWavFile;
    
    // === DUPLICATE DISPATCH PREVENTION ===
    if (this.isFileAlreadyProcessed(userId, filename)) {
      DyFM_Log.warn(
        `⚠️  File already processed or being processed (${userId}): ${filename}` +
        `\n  Skipping duplicate processing to prevent multiple dispatches`
      );
      return;
    }
    
    // Mark file as being processed
    this.markFileAsProcessing(userId, filename);
    state.isProcessing = true;
    
    try {
      // Volume és ZCR statisztikák
      const avgVolume = state.volumeBuffer.length > 0 
        ? state.volumeBuffer.reduce((a, b) => a + b, 0) / state.volumeBuffer.length 
        : 0;
      const maxVolume = state.volumeBuffer.length > 0 ? Math.max(...state.volumeBuffer) : 0;
      const avgZCR = state.zcrBuffer.length > 0 
        ? state.zcrBuffer.reduce((a, b) => a + b, 0) / state.zcrBuffer.length 
        : 0;
      
      DyFM_Log.log(
        `🎤 [IMMEDIATE] WAV feldolgozás indítva (${userId}):` +
        `\n  - Fájl: ${filename}` +
        `\n  - Beszéd idő: ${state.totalSpeechTime}ms` +
        `\n  - Átlagos volume: ${avgVolume.toFixed(4)}` +
        `\n  - Maximum volume: ${maxVolume.toFixed(4)}` +
        `\n  - Átlagos ZCR: ${avgZCR.toFixed(4)}` +
        `\n  - Frame count: ${state.frameCount}`
      );
      
      // Előfeldolgozás: vágjuk le a buffer elejéről és végéről a piros frame-eket
      let trimmed = CV_VoiceUtils.trimLeadingRedFrames(
        state.zcrBuffer, 
        state.volumeBuffer, 
        settings.voice.thresholds.zcrValidationThreshold
      );
        DyFM_Log.log(
        `[DEBUG] Leading red frames trimmed: ${state.zcrBuffer.length} → ${trimmed.zcr.length}`
        );
      trimmed = CV_VoiceUtils.trimTrailingRedFrames(
        trimmed.zcr,
        trimmed.volume,
        settings.voice.thresholds.zcrValidationThreshold
      );
      DyFM_Log.log(
        `[DEBUG] Trailing red frames trimmed: ${state.zcrBuffer.length} → ${trimmed.zcr.length}`
      );
      // Log the ZCR buffer as a visual bar for direct comparison with Audio Analysis (last N frames)
      const N = CV_voiceRecordingConfig.volumeBufferSize;
      const zcrBarWindow = trimmed.zcr.slice(-N);
      DyFM_Log.log(
        `[DEBUG] ZCR buffer for segmentation (last ${N} frames):` +
        CV_VoiceUtils.visualizeZCR(zcrBarWindow, settings.voice.thresholds.zcrValidationThreshold)
      );
      // --- NEW: Use all green regions for block evaluation and processing (matches bar, no filtering) ---
      const allGreenRegions = CV_VoiceUtils.findAllGreenRegions(
        zcrBarWindow,
        trimmed.volume.slice(-N),
        settings.voice.thresholds.zcrValidationThreshold
      );
      DyFM_Log.log('[DEBUG] Audio Analysis green regions (all, regardless of length):');
      allGreenRegions.forEach((block, idx) => {
        DyFM_Log.log(
          `  [${idx+1}] start=${block.start} end=${block.end} length=${block.zcr.length} | ` +
          CV_VoiceUtils.visualizeZCR(block.zcr, settings.voice.thresholds.zcrValidationThreshold)
        );
      });
      // --- END NEW ---
      // --- NEW: Evaluate the last N frames as a single block (bar window logic) ---
      const barWindowValidation = CV_VoiceUtils.validateMajorityGreenZCR(zcrBarWindow, settings.voice.thresholds.zcrValidationThreshold);
      DyFM_Log.log(
        `[DEBUG] Bar window validation: ${barWindowValidation.goodCount}/${barWindowValidation.totalCount} green ` +
        `(${(barWindowValidation.goodRatio * 100).toFixed(1)}%), ` +
        `threshold: ${(settings.voice.thresholds.majorityGreenThreshold * 100).toFixed(0)}%`
      );
      if (
        barWindowValidation.totalCount >= settings.voice.thresholds.zcrMinGreenBlockLength &&
        barWindowValidation.goodRatio >= settings.voice.thresholds.majorityGreenThreshold
      ) {
        DyFM_Log.success(`✅ [BAR WINDOW] Last ${N} frames passed majority-green validation, processing as a single block.`);
        // Use the last N frames as the block for processing
        const processingState = { ...state }; // Create a copy to avoid state mutation
        processingState.zcrBuffer = zcrBarWindow;
        processingState.volumeBuffer = trimmed.volume.slice(-N);
        const avgZCR = zcrBarWindow.reduce((a, b) => a + b, 0) / zcrBarWindow.length;
        const avgVolume = processingState.volumeBuffer.reduce((a, b) => a + b, 0) / processingState.volumeBuffer.length;
        const selectedService = settings.voice.speechRecognizer.selectedService;
        const serviceEmoji = this.getServiceEmoji(selectedService);
        DyFM_Log.info(
          `============================================ SENDING TO SPEECH RECOGNITION (BAR WINDOW, ${serviceEmoji}) ==============================================🚀` +
          `\n🚀 SENDING TO SPEECH RECOGNITION (${serviceEmoji} ${selectedService}): userId=${userId}, file=${filename}, ` +
          `avgVolume=${avgVolume.toFixed(4)}, avgZCR=${avgZCR.toFixed(4)}, ` +
          `frames=${zcrBarWindow.length}` +
          '\n============================================ SENDING TO SPEECH RECOGNITION ==============================================🚀'
        );
        /* this.voiceOutput_CS.playSound(CVO_CCAPSound.whoosh, 'bar-window-validation-passed'); */
        
        // === SINGLE DISPATCH FOR BAR WINDOW ===
        if (this.onWavFileReadyForProcessing) {
          this.onWavFileReadyForProcessing({ userId, filename, state: processingState });
        }
        
        // Mark file as processed after successful dispatch
        this.markFileAsProcessed(userId, filename);
        DyFM_Log.success(`✅ WAV fájl feldolgozásra kész (${userId}): ${filename}`);
        return;
      } else {
        DyFM_Log.warn(`❌ [BAR WINDOW] Last ${N} frames did not pass majority-green validation.`);
        this.voiceOutput_CS.playSound(CVO_CCAPSound.earlySkip, 'bar-window-validation-failed');
      }
      // --- END NEW LOGIC ---
      // --- Merge green regions before processing ---
      const mergedGreenBlocks = CV_VoiceUtils.mergeNearbyGreenBlocks(
        allGreenRegions,
        settings.voice.thresholds.zcrMaxRedGapLength
      );
      DyFM_Log.log('[DEBUG] Merged green blocks to be processed:');
      mergedGreenBlocks.forEach((block, idx) => {
        DyFM_Log.log(
          `  [${idx+1}] start=${block.start} end=${block.end} length=${block.zcr.length} | ` +
          CV_VoiceUtils.visualizeZCR(block.zcr, settings.voice.thresholds.zcrValidationThreshold)
        );
      });
      
      // === OPTIMIZED: SINGLE DISPATCH WITH BEST BLOCK ===
      let bestBlock: { zcr: number[]; volume: number[]; start: number; end: number } | null = null;
      let bestScore = 0;
      
      for (let idx = 0; idx < mergedGreenBlocks.length; idx++) {
        const block = mergedGreenBlocks[idx];
        const zcrValidation = CV_VoiceUtils.validateMajorityGreenZCR(block.zcr, settings.voice.thresholds.zcrValidationThreshold);
        const totalChunks = zcrValidation.totalCount;
        const goodZCRChunks = zcrValidation.goodCount;
        const goodZCRRatio = zcrValidation.goodRatio;
        const avgZCR = block.zcr.reduce((a, b) => a + b, 0) / totalChunks;
        const avgVolume = block.volume.reduce((a, b) => a + b, 0) / totalChunks;
        
        // Calculate quality score for block selection
        const qualityScore = (goodZCRRatio * 0.6) + (avgVolume * 100 * 0.4); // ZCR ratio 60%, volume 40%
        
        DyFM_Log.log(
          `🔍 [MERGED BLOKK #${idx+1}] ZCR info:` +
          `\n  - Frame-ek: ${totalChunks}` +
          `\n  - Jó ZCR arány: ${goodZCRChunks}/${totalChunks} (${(goodZCRRatio * 100).toFixed(1)}%)` +
          `\n  - Átlagos ZCR: ${avgZCR.toFixed(4)}` +
          `\n  - Átlagos volume: ${avgVolume.toFixed(4)}` +
          `\n  - Quality score: ${qualityScore.toFixed(4)}` +
          `\n  - ZCR bar: ` + CV_VoiceUtils.visualizeZCR(block.zcr, settings.voice.thresholds.zcrValidationThreshold)
        );
        
        // Select the best block based on quality score
        if (qualityScore > bestScore) {
          bestScore = qualityScore;
          bestBlock = block;
        }
      }
      
      if (bestBlock) {
        DyFM_Log.success(`✅ [BEST BLOCK SELECTED] Quality score: ${bestScore.toFixed(4)} - Feldolgozásra küldve.`);
        this.voiceOutput_CS.playSound(CVO_CCAPSound.typing, 'best-block-selected');
        
        const processingState = { ...state }; // Create a copy to avoid state mutation
        processingState.zcrBuffer = bestBlock.zcr;
        processingState.volumeBuffer = bestBlock.volume;
        const avgZCR = bestBlock.zcr.reduce((a, b) => a + b, 0) / bestBlock.zcr.length;
        const avgVolume = bestBlock.volume.reduce((a, b) => a + b, 0) / bestBlock.volume.length;
        const selectedService = settings.voice.speechRecognizer.selectedService;
        const serviceEmoji = this.getServiceEmoji(selectedService);
        DyFM_Log.info(
          `============================================ SENDING TO SPEECH RECOGNITION (${serviceEmoji}) ==============================================🚀` +
          `\n🚀 SENDING TO SPEECH RECOGNITION (${serviceEmoji} ${selectedService}): userId=${userId}, file=${filename}, ` +
          `avgVolume=${avgVolume.toFixed(4)}, avgZCR=${avgZCR.toFixed(4)}, ` +
          `frames=${bestBlock.zcr.length}` +
          '\n============================================ SENDING TO SPEECH RECOGNITION ==============================================🚀'
        );
        /* this.voiceOutput_CS.playSound(CVO_CCAPSound.whoosh, 'bar-window-validation-passed'); */
        
        // === SINGLE DISPATCH FOR BEST BLOCK ===
        if (this.onWavFileReadyForProcessing) {
          this.onWavFileReadyForProcessing({ userId, filename, state: processingState });
        }
        
        // Mark file as processed after successful dispatch
        this.markFileAsProcessed(userId, filename);
        DyFM_Log.success(`✅ WAV fájl feldolgozásra kész (${userId}): ${filename}`);
      } else {
        DyFM_Log.warn('❌ Egyetlen zöld blokk sem volt a barban, hang figyelmen kívül hagyva!');
        this.voiceOutput_CS.playSound(CVO_CCAPSound.earlySkip, 'no-green-block');
        this.scheduleFileDeletion(filename, userId, 'no-green-block');
        // Mark file as processed even if no blocks found
        this.markFileAsProcessed(userId, filename);
        return;
      }

    } catch (error) {
      DyFM_Log.error(`❌ Hiba a WAV fájl feldolgozásakor (${userId}):`, error);
      // Mark file as processed even on error to prevent infinite retries
      this.markFileAsProcessed(userId, filename);
    } finally {
      // Cleanup - DO NOT DELETE STATE HERE (let handleStreamEnd handle it)
      state.isProcessing = false;
      state.pendingWavFile = null;
      state.mergeTimeout = null;
      if (this.debugLog) {
      DyFM_Log.log(`🔍 DEBUG: processWavFileImmediately cleanup completed for user: ${userId} (state preserved)`);
      }
    }
  }

  /**
   * CENTRALIZED: WAV fájl törlés ütemezése (nem azonnali törlés)
   * @param filename - Törlendő fájl útvonala
   * @param userId - Felhasználó ID
   * @param reason - Törlés oka (debug célokra)
   */
  private scheduleFileDeletion(filename: string, userId: string, reason: string): void {
    const fileKey = `${userId}-${filename}`;
    
    // Ha már ütemezve van, ne ütemezzük újra
    if (this.pendingFileDeletions.has(fileKey)) {
      DyFM_Log.warn(
        `⚠️  File deletion already scheduled (${userId}): ${filename} (reason: ${reason})`
      );
      return;
    }
    
    this.pendingFileDeletions.set(fileKey, {
      filename,
      userId,
      timestamp: Date.now()
    });
    
    DyFM_Log.log(`📅 File deletion scheduled (${userId}): ${filename} (reason: ${reason})`);
  }

  /**
   * CENTRALIZED: WAV fájl azonnali törlése (csak végső esetben)
   * @param filename - Törlendő fájl útvonala
   * @param userId - Felhasználó ID
   * @param reason - Törlés oka (debug célokra)
   */
  private async cleanupWavFileImmediately(
    filename: string, 
    userId: string, 
    reason: string,
  ): Promise<void> {
    try {
      // Ellenőrizzük, hogy a fájl létezik-e
      await fs.access(filename);
      
      // Fájl törlése
      await fs.unlink(filename);
      DyFM_Log.info(`🗑️  WAV fájl azonnali törlés (${userId}): ${filename} (reason: ${reason})`);
      
      // Töröljük a pending listából is
      const fileKey = `${userId}-${filename}`;
      this.pendingFileDeletions.delete(fileKey);
      
    } catch (err) {
      DyFM_Error.logSimple(`❌ Hiba a WAV fájl törlése során (${userId}):`, err);

      if ((err as any).code === 'ENOENT') {
        // Fájl nem létezik - ez rendben van
        DyFM_Log.warn(`📁 WAV fájl már nem létezik (${userId}): ${filename} (reason: ${reason})`);
        
        // Töröljük a pending listából is
        const fileKey = `${userId}-${filename}`;
        this.pendingFileDeletions.delete(fileKey);
      } else {
        // Egyéb hiba - próbáljuk meg újra
        DyFM_Log.warn(
          `⚠️  Nem sikerült törölni a WAV fájlt (${userId}): ${filename} (reason: ${reason})`, 
          err
        );
        
        // Retry mechanism - 3 próbálkozás
        await this.retryFileDeletion(filename, userId, 3, reason);
      }
    }
  }

  /**
   * CENTRALIZED: Összes ütemezett fájl törlése (végső cleanup)
   * @param userId - Opcionális felhasználó ID szűréshez
   */
  private async cleanupAllScheduledFiles(userId?: string): Promise<void> {
    const filesToDelete = Array.from(this.pendingFileDeletions.entries());
    
    for (const [fileKey, fileInfo] of filesToDelete) {
      if (userId && fileInfo.userId !== userId) continue;
      
      DyFM_Log.log(
        `🗑️  Executing scheduled file deletion (${fileInfo.userId}): ${fileInfo.filename}`
      );
      await this.cleanupWavFileImmediately(fileInfo.filename, fileInfo.userId, 'scheduled-cleanup');
    }
  }

  /**
   * Fájl törlés újrapróbálkozás mechanizmusa
   * @param filename - Törlendő fájl útvonala
   * @param userId - Felhasználó ID
   * @param maxRetries - Maximális újrapróbálkozások száma
   * @param reason - Törlés oka (debug célokra)
   */
  private async retryFileDeletion(
    filename: string, 
    userId: string, 
    maxRetries: number, 
    reason?: string
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Progresszív várakozás
        await fs.unlink(filename);
        DyFM_Log.info(
          `🗑️ WAV fájl törölve újrapróbálkozás után ` +
          `(${userId}, attempt ${attempt}): ${filename}${reason ? ` (reason: ${reason})` : ''}`
        );
        return;
      } catch (err) {
        DyFM_Error.logSimple(`❌ Hiba a WAV fájl törlése során (${userId}):`, err);

        if ((err as any).code === 'ENOENT') {
          DyFM_Log.info(
            `📁 WAV fájl már törölve lett ` +
            `(${userId}, attempt ${attempt}): ${filename}${reason ? ` (reason: ${reason})` : ''}`
          );
          return;
        }
        
        if (attempt === maxRetries) {
          DyFM_Log.error(
            `❌ WAV fájl törlése sikertelen ${maxRetries} próbálkozás után (${userId}): ` +
            `${filename}${reason ? ` (reason: ${reason})` : ''}`, 
            err
          );
        } else {
          DyFM_Log.warn(
            `⚠️  WAV fájl törlési hiba (${userId}, attempt ${attempt}/${maxRetries}): ` +
            `${filename}${reason ? ` (reason: ${reason})` : ''}`, 
            err
          );
        }
      }
    }
  }

  /**
   * Összes WAV fájl törlése a recordings könyvtárból
   * @param userId - Opcionális felhasználó ID szűréshez
   */
  async cleanupAllWavFiles(userId?: string): Promise<void> {
    try {
      if (!existsSync(this.recordingsDir)) {
        return; // Könyvtár nem létezik
      }

      const files = await fs.readdir(this.recordingsDir);
      const wavFiles = files.filter(file => file.endsWith('.wav'));
      
      if (userId) {
        // Csak a megadott felhasználó fájljait töröljük
        const userWavFiles = wavFiles.filter(file => file.includes(`-${userId}-`));
        for (const file of userWavFiles) {
          const filepath = path.join(this.recordingsDir, file);
          this.scheduleFileDeletion(filepath, userId, 'cleanup');
        }
      } else {
        // Összes WAV fájl törlése
        for (const file of wavFiles) {
          const filepath = path.join(this.recordingsDir, file);
          this.scheduleFileDeletion(filepath, 'cleanup', 'cleanup');
        }
      }
      
      DyFM_Log.info(`🧹 WAV fájlok cleanup befejezve${userId ? ` (${userId})` : ''}`);
      
    } catch (err) {
      DyFM_Error.logSimple('❌ Hiba a WAV fájlok cleanup során:', err);
    }
  }

  /**
   * PCM rögzítés leállítása és cleanup
   */
  async stopPcmRecording(): Promise<void> {
    // WAV stream-ek lezárása
    for (const [userId, { stream }] of this.wavUserStreams) {
      stream.end();
    }
    this.wavUserStreams.clear();
    
    // User stream states cleanup
    for (const [userId, userState] of this.userSpeechStates) {
      if (userState.mergeTimeout) {
        clearTimeout(userState.mergeTimeout);
      }
      if (userState.pendingWavFile) {
        // Feldolgozás befejezése
        this.processWavFile(userId).catch(err => {
          DyFM_Log.error(`❌ Hiba a cleanup során (${userId}):`, err);
        });
      }
    }
    this.userSpeechStates.clear();
    
    // Összes WAV fájl törlése
    await this.cleanupAllWavFiles();
    
    // Összes ütemezett fájl törlése
    await this.cleanupAllScheduledFiles();
    
    // Clean up processed files tracking
    this.cleanupProcessedFilesTracking();
    
    DyFM_Log.info('🛑 Voice PCM rögzítés leállítva.');
  }

  /**
   * Debug method to log current state information
   * @param userId - Felhasználó ID
   * @param context - Context where this is called from
   */
  private logStateDebug(userId: string, context: string): void {
    const state = this.userSpeechStates.get(userId);
    if (state) {
      if (this.debugLog) {
      DyFM_Log.log(
        `🔍 DEBUG: [${context}] User state for ${userId}:` +
        `\n  - isProcessing: ${state.isProcessing}` +
        `\n  - pendingWavFile: ${state.pendingWavFile ? 'YES' : 'NO'}` +
        `\n  - totalSpeechTime: ${state.totalSpeechTime}ms` +
        `\n  - frameCount: ${state.frameCount}` +
        `\n  - volumeBuffer: ${state.volumeBuffer.length}` +
        `\n  - zcrBuffer: ${state.zcrBuffer.length}`
      );
      }
    } else {
      DyFM_Log.warn(
        `⚠️  [${context}] No user state found for ${userId}` +
        `\n  - Available user states: ${Array.from(this.userSpeechStates.keys()).join(', ')}`
      );
    }
  }

  /**
   * Callback for WAV file processing
   */
  onWavFileReadyForProcessing?: (
    data: { 
      userId: string; 
      filename: string; 
      state: CV_UserSpeechState 
    }
  ) => void;

  /**
   * Get emoji for speech recognition service
   * @param service - Speech recognition service
   * @returns Emoji string
   */
  private getServiceEmoji(service: CV_SpeechRecognizerService): string {
    switch (service) {
      case CV_SpeechRecognizerService.whisper:
        return '🎤';
      case CV_SpeechRecognizerService.elevenlabs:
        return '🔊';
      case CV_SpeechRecognizerService.local:
        return '🏠';
      default:
        return '❓';
    }
  }

  /**
   * Generate unique file key for deduplication tracking
   * @param userId - Felhasználó ID
   * @param filename - Fájl útvonala
   * @returns Unique file key
   */
  private generateFileKey(userId: string, filename: string): string {
    return `${userId}-${filename}`;
  }

  /**
   * Check if file is already processed or being processed
   * @param userId - Felhasználó ID
   * @param filename - Fájl útvonala
   * @returns true if file is already processed or being processed
   */
  private isFileAlreadyProcessed(userId: string, filename: string): boolean {
    const fileKey = this.generateFileKey(userId, filename);
    return this.processedFiles.has(fileKey) || this.processingInProgress.has(fileKey);
  }

  /**
   * Mark file as being processed
   * @param userId - Felhasználó ID
   * @param filename - Fájl útvonala
   */
  private markFileAsProcessing(userId: string, filename: string): void {
    const fileKey = this.generateFileKey(userId, filename);
    this.processingInProgress.add(fileKey);
    if (this.debugLog) {
      DyFM_Log.log(`🔍 DEBUG: File marked as processing: ${fileKey}`);
    }
  }

  /**
   * Mark file as processed
   * @param userId - Felhasználó ID
   * @param filename - Fájl útvonala
   */
  private markFileAsProcessed(userId: string, filename: string): void {
    const fileKey = this.generateFileKey(userId, filename);
    this.processingInProgress.delete(fileKey);
    this.processedFiles.add(fileKey);
    if (this.debugLog) {
      DyFM_Log.log(`🔍 DEBUG: File marked as processed: ${fileKey}`);
    }
  }

  /**
   * Clean up processed files tracking (called during cleanup)
   * @param userId - Opcionális felhasználó ID szűréshez
   */
  private cleanupProcessedFilesTracking(userId?: string): void {
    if (userId) {
      // Remove specific user's files
      for (const fileKey of this.processedFiles) {
        if (fileKey.startsWith(`${userId}-`)) {
          this.processedFiles.delete(fileKey);
        }
      }
      for (const fileKey of this.processingInProgress) {
        if (fileKey.startsWith(`${userId}-`)) {
          this.processingInProgress.delete(fileKey);
        }
      }
    } else {
      // Clear all tracking
      this.processedFiles.clear();
      this.processingInProgress.clear();
    }
    if (this.debugLog) {
      DyFM_Log.log(`🔍 DEBUG: Processed files tracking cleaned up${userId ? ` for user: ${userId}` : ''}`);
    }
  }

  /**
   * Reset deduplication tracking (for testing and debugging)
   * @param userId - Opcionális felhasználó ID szűréshez
   */
  public resetDeduplicationTracking(userId?: string): void {
    this.cleanupProcessedFilesTracking(userId);
    DyFM_Log.info(`🔄 Deduplication tracking reset${userId ? ` for user: ${userId}` : ' for all users'}`);
  }

  /**
   * Get deduplication tracking statistics (for debugging)
   * @returns Tracking statistics
   */
  public getDeduplicationStats(): { 
    processedFiles: number; 
    processingInProgress: number; 
    totalTracked: number 
  } {
    return {
      processedFiles: this.processedFiles.size,
      processingInProgress: this.processingInProgress.size,
      totalTracked: this.processedFiles.size + this.processingInProgress.size
    };
  }
}