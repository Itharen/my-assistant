import { DyNTS_SingletonService } from '@futdevpro/nts-dynamo';
import { DyFM_Async, DyFM_Error, DyFM_Log, second } from '@futdevpro/fsm-dynamo';
import { CV_Connection_ControlService } from './cv-connection.control-service.js';
import { CV_Recording_ControlService } from './cv-recording.control-service.js';
import { CV_Processing_ControlService } from './cv-processing.control-service.js';
import { CV_AudioClassification_ApiService } from './cv-audio-classification.api-service.js';
import { CV_LocalSpeechRecognition_ApiService } from './cv-local-speech-recognition.api-service.js';
import { CV_UnifiedSpeechRecognition_ControlService } from './cv-unified-speech-recognition.control-service.js';
import { settings } from '../../../_collections/consts/settings.const.js';
import { CV_SpeechRecognizerService } from '../_enums/cv-speech-recognizer-service.enum.js';
import { envKeys } from '../../../_collections/consts/env-keys.const.js';
import { CVO_Echo_ControlService } from '../../voice-output/_services/cvo-echo.control-service.js';
import { Channel, VoiceChannel } from 'discord.js';
import { Operations } from '../../../_collections/utils/operations.js';
import { CV_Whisper_ApiService } from './cv-whisper.api-service.js';
import { CV_ResultReview_ControlService } from './cv-result-review.control-service.js';
import { CCAP_MasterService } from '../../../_services/ccap.master-service.js';
import { CVO_Main_ControlService } from '../../voice-output/_services/cvo-main.control-service.js';

/**
 * CCAP Voice Main Control Service
 * @author AI
 * @description Main voice control service - orchestrates voice channel joining and recording
 */
export class CV_Main_ControlService extends DyNTS_SingletonService {

  static getInstance(): CV_Main_ControlService {
    return CV_Main_ControlService.getSingletonInstance();
  }

  private _ccap_MS: CCAP_MasterService;
  connection_CS: CV_Connection_ControlService;
  echo_CS: CVO_Echo_ControlService;
  recording_CS: CV_Recording_ControlService;
  processing_CS: CV_Processing_ControlService;
  whisper_AS: CV_Whisper_ApiService;
  audioClassification_AS: CV_AudioClassification_ApiService;
  localSpeechRecognition_AS: CV_LocalSpeechRecognition_ApiService;
  unifiedSpeechRecognition_CS: CV_UnifiedSpeechRecognition_ControlService;
  resultReview_CS: CV_ResultReview_ControlService;
  voiceOutput_CS: CVO_Main_ControlService;

  get ccap_MS(): CCAP_MasterService {
    return this._ccap_MS;
  }

  get voiceChannel(): Channel {
    return this.connection_CS.voiceChannel;
  }

  private isRecording = false;

  async setup(issuer: string): Promise<void> {
    try {
      DyFM_Log.info('🔊 Initializing CV_Main_ControlService...');
      
      this._ccap_MS = CCAP_MasterService.getInstance();

      this.connection_CS = CV_Connection_ControlService.getInstance();
      this.echo_CS = CVO_Echo_ControlService.getInstance();
      this.recording_CS = CV_Recording_ControlService.getInstance();
      this.processing_CS = CV_Processing_ControlService.getInstance();
      this.whisper_AS = CV_Whisper_ApiService.getInstance();
      this.audioClassification_AS = CV_AudioClassification_ApiService.getInstance();
      this.localSpeechRecognition_AS = CV_LocalSpeechRecognition_ApiService.getInstance();
      this.unifiedSpeechRecognition_CS = CV_UnifiedSpeechRecognition_ControlService.getInstance();
      this.resultReview_CS = CV_ResultReview_ControlService.getInstance();
      this.voiceOutput_CS = CVO_Main_ControlService.getInstance();

      DyFM_Log.T_success('🔊 CV_Main_ControlService initialized');
    } catch (error) {
      DyFM_Error.logSimple('Voice channel join error:', error);
    }
  }

  async start(issuer: string): Promise<void> {
    try {
      DyFM_Log.info('🔊 Starting CV_Main_ControlService...');

      await this.joinVoiceChannel(
        settings.ccap.useVoiceChannel,
        issuer,
      );

      DyFM_Log.T_success('🔊 CV_Main_ControlService started');
    } catch (error) {
      DyFM_Error.logSimple('Voice channel join error:', error);
    }
  }

  /**
   * Csatlakozás a voice csatornához és rögzítés indítása
   * @param issuer - parancs kiadója
   */
  async joinVoiceChannel(
    voiceChannelName: string,
    issuer: string,
  ): Promise<void> {
    try {
      DyFM_Log.info('🔊 Joining voice channel...');

      // Voice connection létrehozása
      const connection = await this.connection_CS.createVoiceConnection(voiceChannelName);
      
      // Bot jogosultságok ellenőrzése és javítása
      await this.connection_CS.validateAndFixBotPermissions(voiceChannelName);
      DyFM_Log.info('🔊 Bot permissions validated and fixed');
      
      // Recordings könyvtár inicializálása
      await this.recording_CS.initializeRecordingsDirectory();
      DyFM_Log.info('🔊 Recordings directory initialized');
      
      // PCM rögzítés indítása
      this.recording_CS.handlePcmReceiver(connection);
      DyFM_Log.info('🎙️  PCM hangrögzítés elindítva.');

      // Echo player csatlakoztatása
      connection.subscribe(this.echo_CS.getEchoPlayer());
      DyFM_Log.info('🔊 Echo player csatlakoztatva');

      // Echo player események beállítása
      this.echo_CS.setupEchoPlayerEvents();

      // Későbbi bot állapot ellenőrzése
      await this.connection_CS.checkAndFixBotStateLater(voiceChannelName);
      DyFM_Log.info('🔊 Bot state checked and fixed');

      // Check and start Speech Recognition APIs if needed
      await this.checkAndStartSpeechRecognitionApis();
      DyFM_Log.info('🔊 Speech recognition APIs checked and started');

      // Setup processing callback
      this.setupProcessingCallback();
      DyFM_Log.info('🔊 Processing callback setup');

      // Rögzítés indítása
      await this.startRecording();
      DyFM_Log.info('🔊 Recording started');

      // Teszt hang lejátszása
      await DyFM_Async.delay(3 * second);
      await this.echo_CS.playGreetings();
      DyFM_Log.info('🔊 Greetings played');

      DyFM_Log.success('🔊 🎉 CCAP Voice Main Control Service started');
    } catch (error) {
      DyFM_Error.logSimple('❌ Hiba a voice csatornához csatlakozáskor:', error);

      throw error;
    }
  }

  /**
   * Hangrögzítés indítása
   */
  async startRecording(): Promise<void> {
    if (!this.connection_CS.getConnection()) {
      DyFM_Log.error('❌ Nincs aktív voice connection!');
      throw new Error('Nincs aktív voice connection!');
    }
    if (this.isRecording) {
      DyFM_Log.info('ℹ️  A rögzítés már folyamatban van.');
      return;
    }
    this.isRecording = true;
    DyFM_Log.info('🎙️  Hangrögzítés indítva');
  }

  /**
   * Rögzítés leállítása, cleanup
   */
  async stopRecording(): Promise<void> {
    this.isRecording = false;
    DyFM_Log.info('🛑 Hangrögzítés leállítva.');
  }

  /**
   * Voice csatorna elhagyása, cleanup
   */
  async leaveVoiceChannel(): Promise<void> {
    await this.stopRecording();
    await this.recording_CS.stopPcmRecording();
    this.connection_CS.destroyConnection();
    this.echo_CS.clearEchoQueue();
    DyFM_Log.info('👋 A bot elhagyta a voice csatornát.');
  }

  /**
   * Setup recording service callback for WAV file processing
   */
  setupProcessingCallback(): void {
    this.recording_CS.onWavFileReadyForProcessing = async (data) => {
      const { userId, filename, state } = data;
      await this.processing_CS.processWavFileWithState(userId, filename, state);
    };
  }

  /**
   * Test audio classification service
   * @param filename - Audio file path to test
   * @param userId - User ID for testing
   */
  async testAudioClassification(filename: string, userId: string): Promise<void> {
    try {
      DyFM_Log.info(`🧪 [TEST] Audio classification test for user: ${userId}, file: ${filename}`);
      const result = await this.audioClassification_AS.classifyAudioFile(filename, userId);
      DyFM_Log.info(`🧪 [TEST] Classification result:`, result);
    } catch (error) {
      DyFM_Error.logSimple(`❌ [TEST] Audio classification test failed:`, error);
    }
  }

  /**
   * Test unified speech recognition service
   * @param filename - Audio file path to test
   * @param userId - User ID for testing
   */
  async testUnifiedSpeechRecognition(filename: string, userId: string): Promise<void> {
    try {
      DyFM_Log.info(`🧪 [TEST] Unified speech recognition test for user: ${userId}, file: ${filename}`);
      const result = await this.unifiedSpeechRecognition_CS.recognizeAudioFile(filename, userId);
      DyFM_Log.info(`🧪 [TEST] Recognition result:`, result);
    } catch (error) {
      DyFM_Error.logSimple(`❌ [TEST] Unified speech recognition test failed:`, error);
    }
  }

  /**
   * Check and start Speech Recognition APIs if needed
   */
  async checkAndStartSpeechRecognitionApis(): Promise<void> {
    try {
      const selectedProvider = settings.voice.speechRecognizer.selectedService;
      DyFM_Log.log(`🔍 Speech Recognition API ellenőrzése... (Selected provider: ${selectedProvider})`);
      
      // Check if selected provider is available
      const isAvailable = await this.unifiedSpeechRecognition_CS.isSelectedProviderAvailable();
      if (isAvailable) {
        DyFM_Log.success(`✅ Selected provider (${selectedProvider}) is available`);
        return;
      }
      
      DyFM_Log.warn(`⚠️  Selected provider (${selectedProvider}) is not available, checking individual services...`);
      
      // Check individual services based on selected provider
      switch (selectedProvider) {
        case CV_SpeechRecognizerService.local:
          await this.checkAndStartLocalSpeechRecognitionApi();
          break;

        case CV_SpeechRecognizerService.elevenlabs:
          await this.checkElevenLabsAvailability();
          break;

        case CV_SpeechRecognizerService.whisper:
          await this.checkWhisperAvailability();
          break;

        default:
          DyFM_Log.warn(`⚠️  Unknown provider: ${selectedProvider}`);
      }
      
      // Final check
      const finalCheck = await this.unifiedSpeechRecognition_CS.isSelectedProviderAvailable();
      if (finalCheck) {
        DyFM_Log.success(`✅ Provider (${selectedProvider}) is now available`);
      } else {
        DyFM_Log.warn(`⚠️  Provider (${selectedProvider}) is still not available, will use fallback if needed`);
      }
      
    } catch (error) {
      DyFM_Error.logSimple('❌ Hiba a Speech Recognition API ellenőrzésekor:', error);
    }
  }

  /**
   * Check and start Local Speech Recognition API if needed
   */
  async checkAndStartLocalSpeechRecognitionApi(): Promise<void> {
    try {
      DyFM_Log.log('🔍 Local Speech Recognition API elérhetőség ellenőrzése...');
      
      const isAvailable = await this.localSpeechRecognition_AS.isApiAvailable();
      if (isAvailable) {
        DyFM_Log.success('✅ Local Speech Recognition API elérhető');
        return;
      }
      
      // Try to find a working URL
      DyFM_Log.log('🔍 Próbálkozás más URL-ekkel...');
      const workingUrl = await this.localSpeechRecognition_AS.findWorkingApiUrl();
      
      if (workingUrl) {
        DyFM_Log.success(`✅ Working API URL found: ${workingUrl}`);
        this.localSpeechRecognition_AS.setApiUrl(workingUrl);
        return;
      }
    } catch (error) {
      DyFM_Error.logSimple('❌ Hiba a Local Speech Recognition API ellenőrzésekor:', error);
    }
  }

  /**
   * Check ElevenLabs availability
   */
  async checkElevenLabsAvailability(): Promise<void> {
    try {
      DyFM_Log.log('🔍 ElevenLabs API elérhetőség ellenőrzése...');

      const isAvailable = await this.unifiedSpeechRecognition_CS.isProviderAvailable(CV_SpeechRecognizerService.elevenlabs);
      
      if (isAvailable) {
        DyFM_Log.success('✅ ElevenLabs API elérhető');
      } else {
        DyFM_Log.warn('⚠️  ElevenLabs API nem elérhető, ellenőrizze az API kulcsot');
      }
    } catch (error) {
      DyFM_Error.logSimple('❌ Hiba az ElevenLabs API ellenőrzésekor:', error);
    }
  }

  /**
   * Check Whisper availability
   */
  async checkWhisperAvailability(): Promise<void> {
    try {
      DyFM_Log.log('🔍 Whisper API elérhetőség ellenőrzése...');
      
      const apiKey = envKeys.openAi.apiKey;

      if (apiKey) {
        DyFM_Log.success('✅ Whisper API kulcs konfigurálva');
      } else {
        DyFM_Log.warn('⚠️  Whisper API kulcs nincs konfigurálva');
      }
    } catch (error) {
      DyFM_Error.logSimple('❌ Hiba a Whisper API ellenőrzésekor:', error);
    }
  }
}