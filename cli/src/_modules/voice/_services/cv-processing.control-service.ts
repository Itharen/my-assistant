import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Error, DyFM_Log } from '@futdevpro/fsm-dynamo';
import { Operations } from '../../../_collections/utils/operations.js';
import { settings } from '../../../_collections/consts/settings.const.js';
import { Channel, Guild, GuildMember, TextChannel, VoiceChannel } from 'discord.js';
import { CV_Whisper_ApiService } from './cv-whisper.api-service.js';
import { CV_AudioClassification_ApiService } from './cv-audio-classification.api-service.js';
import { CV_UnifiedSpeechRecognition_ControlService, CV_UnifiedSpeechRecognitionResponse } from './cv-unified-speech-recognition.control-service.js';
import { CV_UserSpeechState } from '../_models/cv-user-speech-state.interface.js';
import { CV_AudioClassificationResponse, CV_AudioClassificationStatus } from '../_models/cv-audio-classification-response.interface.js';
import { CV_SpeechRecognizerService } from '../_enums/cv-speech-recognizer-service.enum.js';
import { CV_ResultReview_ControlService } from './cv-result-review.control-service.js';
import { CVO_CCAPSound } from '../../voice-output/_enums/cvo-ccap-sound.enum.js';
import { CVO_Main_ControlService } from '../../voice-output/_services/cvo-main.control-service.js';
import { CCAP_MasterService } from '../../../_services/ccap.master-service.js';
import { CV_Main_ControlService } from './cv-main.control-service.js';

/**
 * CCAP Voice Processing Control Service
 * @author AI
 * @description WAV file processing and unified speech recognition integration
 */
export class CV_Processing_ControlService extends DyNTS_SingletonService {

  static getInstance(): CV_Processing_ControlService {
    return CV_Processing_ControlService.getSingletonInstance();
  }

  private ccapVoice_MS: CV_Main_ControlService = CV_Main_ControlService.getInstance();
  /* private readonly ccap_MS: CCAP_MasterService; */ // = CCAP_MasterService.getInstance();
  //private readonly mainDiscordBot_CS: CCAP_DiAs_MasterService = CCAP_DiAs_MasterService.getInstance();
  /* private readonly whisper_AS: CV_Whisper_ApiService = CV_Whisper_ApiService.getInstance();
  private readonly audioClassification_AS: CV_AudioClassification_ApiService = CV_AudioClassification_ApiService.getInstance();
  private readonly unifiedSpeechRecognition_CS: CV_UnifiedSpeechRecognition_ControlService = CV_UnifiedSpeechRecognition_ControlService.getInstance();
  private readonly resultReview_CS: CV_ResultReview_ControlService = CV_ResultReview_ControlService.getInstance(); */
  //private readonly voiceOutput_CS: CVO_Main_ControlService = CVO_Main_ControlService.getInstance();

  private readonly debugLog: boolean = false;

  get discordServer(): Guild {
    /* return this.mainDiscordBot_CS?.discordServer; */
    return this.ccapVoice_MS.ccap_MS.discordServer;
  }

  get audioClassification_AS(): CV_AudioClassification_ApiService {
    return this.ccapVoice_MS.audioClassification_AS;
  }

  get whisper_AS(): CV_Whisper_ApiService {
    return this.ccapVoice_MS.whisper_AS;
  }

  get resultReview_CS(): CV_ResultReview_ControlService {
    return this.ccapVoice_MS.resultReview_CS;
  }

  get unifiedSpeechRecognition_CS(): CV_UnifiedSpeechRecognition_ControlService {
    return this.ccapVoice_MS.unifiedSpeechRecognition_CS;
  }

  get voiceOutput_CS(): CVO_Main_ControlService {
    return this.ccapVoice_MS.voiceOutput_CS;
  }

  get ccap_MS(): CCAP_MasterService {
    return this.ccapVoice_MS.ccap_MS;
  }

  /**
   * WAV fájl feldolgozása egységesített beszéd felismeréssel
   * @param filename - WAV fájl útvonala
   * @param userId - Discord felhasználó ID
   */
  async processWavFileWithUnifiedRecognition(filename: string, userId: string): Promise<void> {
    DyFM_Log.info(
      `🚀 [START] processWavFileWithUnifiedRecognition called for user: ${userId}, file: ${filename}`
    );
    
    try {
      if (this.debugLog) {
        DyFM_Log.log(
          `🔍 DEBUG: processWavFileWithUnifiedRecognition called for file: ${filename}, user: ${userId}`
        );
      }
      
      // **Audio Classification Step** - Check if audio contains speech before processing
      DyFM_Log.info(`🎵 [CLASSIFICATION] Audio osztályozás indítása (${userId}): ${filename}`);
      const classification: CV_AudioClassificationResponse = await this.audioClassification_AS.classifyAudioFile(filename, userId);
      
      // Check if classification was successful
      if (!this.audioClassification_AS.isClassificationSuccessful(classification)) {
        DyFM_Log.error(`❌ Audio osztályozás sikertelen (${userId}): ${classification.error || 'Unknown error'}`);
        return;
      }
      
      // Check if audio contains speech
      if (!this.audioClassification_AS.isSpeechAudio(classification)) {
        DyFM_Log.warn(`🔇 Audio nem tartalmaz beszédet (${userId}): ${classification.category} (bizonyosság: ${classification.confidence.toFixed(3)})`);
        this.voiceOutput_CS.playSound(CVO_CCAPSound.earlySkip, 'audio-classification');
        return;
      }
      
      DyFM_Log.success(`🎤 Audio beszédet tartalmaz (${userId}): ${classification.category} (bizonyosság: ${classification.confidence.toFixed(3)})`);
      
      // **Unified Speech Recognition Step** - Only proceed if audio contains speech
      const selectedProvider = settings.voice.speechRecognizer.selectedService;
      DyFM_Log.log(`🎤 [UNIFIED RECOGNITION] Beszéd felismerés indítása (${userId}): ${filename} - Provider: ${selectedProvider}`);
      
      (this.ccap_MS.voiceChannel as TextChannel).sendTyping();
      const recognitionResponse = await this.unifiedSpeechRecognition_CS.recognizeAudioFile(filename, userId);
      
      // **Combined Logging** - Log both classification and recognition results together
      DyFM_Log.T_log(
        `📊 [COMBINED RESULTS] Audio feldolgozás eredményei (${userId}):` +
        `\n  📁 Fájl: ${filename}` +
        `\n  👤 Felhasználó: ${userId}`
      );
      
      // Classification Results
      DyFM_Log.T_info(`🎵 [CLASSIFICATION RESULTS]:`, classification);
      
      // Recognition Results
      DyFM_Log.info(`  🎤 [UNIFIED RECOGNITION RESULTS]:`);
      if (recognitionResponse) {
        DyFM_Log.info(
          `    - Provider: ${recognitionResponse.provider}`,
          `\n    - Átirat: ${recognitionResponse.text}`,
          `\n    - Sikeres: ${recognitionResponse.success}`
        );
        if (recognitionResponse.confidence) {
          DyFM_Log.info(`    - Bizonyosság: ${recognitionResponse.confidence.toFixed(3)}`);
        }
        if (recognitionResponse.language) {
          DyFM_Log.info(`    - Nyelv: ${recognitionResponse.language}`);
        }
        if (recognitionResponse.detectedLanguage) {
          DyFM_Log.info(`    - Észlelt nyelv: ${recognitionResponse.detectedLanguage}`);
        }
        if (recognitionResponse.duration) {
          DyFM_Log.info(`    - Időtartam: ${recognitionResponse.duration.toFixed(2)}s`);
        }
        if (recognitionResponse.processingTime) {
          DyFM_Log.info(`    - Feldolgozási idő: ${recognitionResponse.processingTime}ms`);
        }
        DyFM_Log.success(`    ✅ Átirat sikeres: "${recognitionResponse.text}"`);
      } else {
        /* DyFM_Log.warn(`    ⚠️  Nincs átirat`); */
        DyFM_Log.error(`❌ Nincs átirat`);
      }
      
      if (recognitionResponse) {
        DyFM_Log.success(`🎯 [FINAL RESULT]: Átirat sikeres (${userId})`);
      } else {
        DyFM_Log.error(`🎯 [FINAL RESULT]: Nincs átirat (${userId})`);
      }
      
      // Send transcription to Discord channel if available
      if (recognitionResponse && recognitionResponse.success && recognitionResponse.text && recognitionResponse.text.trim()) {
        // Felhasználó nevének lekérése
        const member = this.discordServer.members.cache.get(userId);
        const userName = member ? member.displayName : `User ${userId}`;
        
        // Üzenet küldése a voice csatornához
        await this.sendTranscriptionToChannel({
          member: member,
          userId: userId, 
          userName: userName, 
          transcription: recognitionResponse.text, 
        });

        // Optional Agent-3 integration
        // DISABLED: Agent-3 Discord integration removed - will use local microphone instead
        // try {
        //   // Use dynamic import to avoid breaking if Agent-3 is not available
        //   const agt3HookModule = await import('../../agent-3/_services/agt3-voice-hook.control-service');
        //   const agt3Hook = agt3HookModule.CCAP_Agt3_VoiceHook_ControlService.getInstance();
        //   if (agt3Hook.isAgent3AvailableForProcessing()) {
        //     await agt3Hook.processAudioForAgent3({
        //       audioFile: filename,
        //       userId: userId,
        //       transcription: recognitionResponse.text,
        //       issuer: 'cv-processing',
        //     });
        //   }
        // } catch (error) {
        //   // Don't break voice processing if Agent-3 fails or is not available
        //   // This is expected if Agent-3 is not initialized
        // }
      }

    } catch (error) {
      DyFM_Error.logSimple('❌ Hiba a WAV fájl feldolgozásakor:', error);
    }
  }

  /**
   * WAV fájl feldolgozása Whisper API-val (legacy method for compatibility)
   * @param filename - WAV fájl útvonala
   * @param userId - Discord felhasználó ID
   */
  async processWavFileWithWhisper(filename: string, userId: string): Promise<void> {
    DyFM_Log.info(
      `🚀 [LEGACY] processWavFileWithWhisper called for user: ${userId}, file: ${filename}`
    );
    try {
      if (this.debugLog) {
        DyFM_Log.info(
          `🔍 DEBUG: processWavFileWithWhisper called for file: ${filename}, user: ${userId}`
        );
      }
            
      // **Audio Classification Step** - Check if audio contains speech before processing
      DyFM_Log.info(`🎵 [CLASSIFICATION] Audio osztályozás indítása (${userId}): ${filename}`);
      const classification: CV_AudioClassificationResponse = await this.audioClassification_AS.classifyAudioFile(filename, userId);
      
      // Check if classification was successful
      if (!this.audioClassification_AS.isClassificationSuccessful(classification)) {
        DyFM_Log.error(`❌ Audio osztályozás sikertelen (${userId}): ${classification.error || 'Unknown error'}`);
        return;
      }
      
      // Check if audio contains speech
      if (!this.audioClassification_AS.isSpeechAudio(classification)) {
        DyFM_Log.warn(`🔇 Audio nem tartalmaz beszédet (${userId}): ${classification.category} (bizonyosság: ${classification.confidence.toFixed(3)})`);
        this.voiceOutput_CS.playSound(CVO_CCAPSound.skip, 'audio-classification');
        return;
      }
      
      DyFM_Log.success(`🎤 Audio beszédet tartalmaz (${userId}): ${classification.category} (bizonyosság: ${classification.confidence.toFixed(3)})`);
      
      (this.ccap_MS.voiceChannel as TextChannel).sendTyping();
      // **Whisper Processing Step** - Only proceed if audio contains speech
      DyFM_Log.info(`🎤 [WHISPER] Whisper feldolgozás indítása (${userId}): ${filename}`);
      const whisperResponse = await this.whisper_AS.processWavFileWithWhisper(filename, userId);
      
      // **Combined Logging** - Log both classification and Whisper results together
      DyFM_Log.T_info(
        `📊 [COMBINED RESULTS] Audio feldolgozás eredményei (${userId}):` +
        `\n  📁 Fájl: ${filename}` +
        `\n  👤 Felhasználó: ${userId}`
      );
      
      // Classification Results
      DyFM_Log.T_info(`🎵 [CLASSIFICATION RESULTS]:`, classification);
      
      // Whisper Results
      DyFM_Log.info(`  🎤 [WHISPER RESULTS]:`);
      if (whisperResponse) {
        DyFM_Log.info(`    - Átirat: ${whisperResponse.text}`);
        if (whisperResponse.duration) {
          DyFM_Log.info(`    - Időtartam: ${whisperResponse.duration.toFixed(2)}s`);
        }
        if (whisperResponse.language) {
          DyFM_Log.info(`    - Nyelv: ${whisperResponse.language}`);
        }
        if (whisperResponse.detected_language) {
          DyFM_Log.info(`    - Észlelt nyelv: ${whisperResponse.detected_language}`);
        }
        if (whisperResponse.segments && whisperResponse.segments.length > 0) {
          DyFM_Log.info(`    - Szegmensek: ${whisperResponse.segments.length}`);
        }
        DyFM_Log.success(`    ✅ Átirat sikeres: "${whisperResponse.text}"`);
      } else {
        /* DyFM_Log.warn(`    ⚠️  Nincs átirat`); */
        DyFM_Log.error(`    ❌ Nincs átirat`);
      }
      
      if (whisperResponse) {
        DyFM_Log.success(`🎯 [FINAL RESULT]: Átirat sikeres`);
      } else {
        DyFM_Log.error(`🎯 [FINAL RESULT]: Nincs átirat`);
      }
      
      // Send transcription to Discord channel if available
      if (whisperResponse && whisperResponse.text && whisperResponse.text.trim()) {
        // Felhasználó nevének lekérése
        const member = this.discordServer.members.cache.get(userId);
        const userName = member ? member.displayName : `User ${userId}`;
        
        // Üzenet küldése a voice csatornához
        await this.sendTranscriptionToChannel({
          member: member,
          userId: userId, 
          userName: userName, 
          transcription: whisperResponse.text, 
        });
      }

    } catch (error) {
      DyFM_Error.logSimple('❌ Hiba a WAV fájl feldolgozásakor:', error);
    }
  }

  /**
   * Átirat küldése a Discord csatornához
   * @param userName - Felhasználó neve
   * @param transcription - Átirat
   * @param provider - Szolgáltató neve
   */
  private async sendTranscriptionToChannel(
    params: {
      userId: string,
      member: GuildMember,
      userName: string, 
      transcription: string, 
      /* provider: CV_SpeechRecognizerService = CV_SpeechRecognizerService.whisper, */
    },
  ): Promise<void> {
    try {
      // Voice csatorna megtalálása
      const channel: Channel = Operations.findChannelByName(
        this.discordServer.channels,
        settings.ccap.useVoiceChannel,
      );
      
      // Üzenet küldése a voice csatornához
      if (channel.isTextBased()) {
        await this.resultReview_CS.reviewResult(
          {
            userId: params.userId, 
            member: params.member,
            userDisplayName: params.userName, 
            channel: channel, 
            transcription: params.transcription, 
            currentLanguage: 'magyar',
          },
          'ccap-voice-control',
        );
        /* await voiceChannel.send(message);
        DyFM_Log.testSuccess(`📤 Átirat elküldve a csatornához (${provider}): ${transcription}`); */
      } else {
        DyFM_Log.error('❌ A voice csatorna nem szöveges csatorna!');
      }
      
    } catch (err) {
      DyFM_Error.logSimple('❌ Hiba az átirat küldésekor:', err);
    }
  }

  /**
   * WAV fájl feldolgozása felhasználói állapot alapján
   * @param userId - Felhasználó ID
   * @param filename - WAV fájl útvonala
   * @param state - Felhasználói beszéd állapot
   */
  async processWavFileWithState(
    userId: string, 
    filename: string, 
    state: CV_UserSpeechState
  ): Promise<void> {
    DyFM_Log.info(
      `🚀 [START] processWavFileWithState called for user: ${userId}, file: ${filename}`
    );
    
    try {
      // Volume és ZCR statisztikák
      const avgVolume = state.volumeBuffer.length > 0 
        ? state.volumeBuffer.reduce((a, b) => a + b, 0) / state.volumeBuffer.length 
        : 0;
      const maxVolume = state.volumeBuffer.length > 0 ? Math.max(...state.volumeBuffer) : 0;
      const avgZCR = state.zcrBuffer.length > 0 
        ? state.zcrBuffer.reduce((a, b) => a + b, 0) / state.zcrBuffer.length 
        : 0;
      
      if (this.debugLog) {
        DyFM_Log.log(
          `🔍 DEBUG: [PROCESSING] WAV feldolgozás indítva (${userId}):` +
          `\n  - Fájl: ${filename}` +
          `\n  - Beszéd idő: ${state.totalSpeechTime}ms` +
          `\n  - Átlagos volume: ${avgVolume.toFixed(4)}` +
          `\n  - Maximum volume: ${maxVolume.toFixed(4)}` +
          `\n  - Átlagos ZCR: ${avgZCR.toFixed(4)}` +
          `\n  - Frame count: ${state.frameCount}`
        );
      }
      
      // Audio classification and unified speech recognition feldolgozás
      await this.processWavFileWithUnifiedRecognition(filename, userId);
      DyFM_Log.log(`✅ Audio feldolgozás befejezve (${userId}): ${filename}`);

    } catch (error) {
      DyFM_Error.logSimple('❌ Hiba a WAV fájl feldolgozásakor:', error);
    }
  }
} 