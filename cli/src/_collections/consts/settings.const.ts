import { DyNTS_global_settings } from '@futdevpro/nts-dynamo';
import { version } from '../../../package.json';
import { FDP_portEnv_settings } from '@futdevpro/fdp-templates';
import { byte, day, DyFM_EnvironmentFlag, kilobyte, megabyte, minute, second, week } from '@futdevpro/fsm-dynamo';
import { CV_AudioClassificationCategory } from '../../_modules/voice/_enums/cv-audio-classification-category.enum.js';
import { CV_SpeechRecognizerService } from '../../_modules/voice/_enums/cv-speech-recognizer-service.enum.js';
import { DiscordRoleName } from '../../_enums/discord-role-name.enum.js';
import { EL_SpeechToTextModels } from '../../_modules/elevenlabs/_enums/el-speech-to-text-models.enum.js';




/**
 * Setup:
 * 1. Bot létrehozása
 *   - Menj ide: https://discord.com/developers/applications
 *   - Katt: "New Application"
 *   - Adj nevet → Create
 * 
 * 2. Bot hozzáadása az apphoz
 *   - Bal oldalon: "Bot" → "Add Bot" → Yes, do it
 * 
 * 3. Token lekérése
 *   - Ugyanott: "Reset Token" → Copy
 *   - Tedd a .env fájlba: DISCORD_BOT_TOKEN=...
 * 
 * 4. Bot ID (Client ID) és Invite link
 *   - Bal oldalon: "OAuth2" > "URL Generator"
 *   - Scopes: pipáld be bot
 *   - Bot Permissions: pl. Send Messages, Read Message History
 *   - Alul generál Invite URL → nyisd meg → add hozzá egy szerverhez
 *   - A Client ID ugyanott van, az "Application ID" néven az "OAuth2 > General" vagy "Application" fülön.
 *   - Csak akkor működik, ha azon a szerveren admin vagy vagy van "Manage Server" jogod.
 * 
 * 5. Jogosultságok
 *   - Bal oldalon: "Bot" fül
 *   - Engedélyezd ezeket:
 *     - MESSAGE CONTENT INTENT
 *     - PRESENCE INTENT (ha használsz ilyet)
 *     - SERVER MEMBERS INTENT (ha kell guild user info)
 *   - Mentés
 * 
 */

/** Stupod descriptions in this file */
export const settings = {
  /* test: !process.env.OGS_ENV || process.env.OGS_ENV === 'test', */
  /* port: +process.env.OGS_PORT || 3300, */
  port: FDP_portEnv_settings.ccapExecutioner_http,
  env: DyNTS_global_settings.env_settings.environment,
  version: version,

  ccap: {
    digitalAssistant: {
      tooLongNoteContentLength: 10000,
    },

    useVoiceChannel: 'ccap-voice-dev',

    channelNames: {
      test: 'bot-test',
      report: 'bot-reports',
      ccap: 'ccap',
      ccapVoiceDev: 'ccap-voice-dev',
      ccapVoiceTest: 'ccap-voice-test',
      docs: 'bot-test',
      //gdd: 'bot-test', // 'gdd',
      //policies: 'bot-test', // 'policies',
    },

    CLEAR: {
      custom: '',
      ccapVoice: false,
      ccap: false,
    },

    autorReadDocs: {
      local: false,
      clickup: false,
      codes: false,
    },

    mainUser: {
      discordId: '1234567890',
    },

    /* volume: 0.5, */
    greetingsVolume: 0.5,
    soundsVolume: 0.3,
    /* earlySkipVolume: 0.25, */
    listenOnlyMode: false,
    ronnieMode: false,
    ronnieBotName: 'Ronnie the Jhonny',
    /** Ha megadva, ezt a Discord user ID-t használjuk mention-ként (név alapú keresés helyett). */
    ronnieBotId: undefined as string | undefined,
  },
  
  ccap_allowedChannels: [
    'bot-test',
    'ccap',
    'ccap-voice-dev',
    'ccap-voice-test',
    /* 'admin-chat',
    'leads',
    'dühöngő',
    'bot-gdd', */
  ],
  ccap_defaultChannels: [
    /* 'bot-help',
    'bot-gdd', */
    'ccap',
    'ccap-voice-dev',
    'ccap-voice-test',
    /* 'bot-test', */
  ],

  allowedUserNames: [
    'zed zara',
    'Itharen',
    'FutDevPro',
    'Levente20',
    /* 'Mask',
    'Drucila',
    'Im_Daro', */
  ],
  admins: [
    'Itharen',
    'FutDevPro',
    /* 'Levente20', */
  ],

  ccap_clienInfo: {
    id: 'MISSING',
    displayName: 'MISSING',
  },

  /**
   * 0: No debug
   * 1: Basic debug
   * 2: Detailed debug
   */
  ccap_debugLevel: 3,
  
  teamLeadChannelName: 'leads',
  
  // Time limit for message fetching (3 weeks in milliseconds)
  messageFetchTimeLimit: 3 * week,
  messageFetchCountLimit: 1000,
  messageSendDelay: minute / 3,

  overseerOffice: 'bot-test',

  localDocsName: 'FDP Documentations',
  localDocsPath: '../../../documentations',
  localCodesPath: '../../..',

  documentReportsRolePings: {
    gdd: {
      [DiscordRoleName.gameDevTeam]: [
        'Overview',
        'Game Mechanics',
        'Enemies',
        'Neutral NPCs & Creatures',
        'Items & PointOfInterests',
        'Easter Eggs',
      ],
      [DiscordRoleName.gameDesign]: [
        'Maps',
        'Voice Lines',
        'Quests & Intels',
        'Balance Sheets',
        'Lights',
        'ToProcess (NotIn GDD yet)'
      ],
      [DiscordRoleName.ui]: [
        'UIs',
      ],
      [DiscordRoleName.sound]: [
        'Sound'
      ],
      [DiscordRoleName.code]: [
        'Scripts',
        'Test & Dev Tools',
      ],
      [DiscordRoleName._3D]: [
        '3D Elements',
      ],
      [DiscordRoleName.test]: [
        'Test & Dev Tools',
      ],
      [DiscordRoleName.pr]: [
      ],
    },

    policies: {
      [DiscordRoleName.gameDevTeam]: [
        'Policies',
      ],
      [DiscordRoleName.gameDesign]: [
        'Game Design Team Policies',
      ],
      [DiscordRoleName.ui]: [
        'UI Team Policies',
      ],
      [DiscordRoleName.sound]: [
        'Sound Team Policies',
      ],
      [DiscordRoleName.code]: [
        'Code Team Policies',
      ],
      [DiscordRoleName._3D]: [
        '3D Team Policies',
      ],
      [DiscordRoleName.test]: [
        'Test Team Policies',
      ],
      [DiscordRoleName.pr]: [
        'PR Team Policies',
      ],
    }
  },

  skipFlags: {
    /**
     * Ezek a flag-ek nem fognak belekerülni a a conversation-be (az LLM-nek amit küldünk)
     */
    skipFromConversation: [
      '[VOICE|USER|NOISE]',
      '[VOICE|USER|OUTOFCONTEXT]',
      '[DEBUG|'
    ],

    /**
     * Ezekre a flag-ekre nem fog válaszolni a bot
     */
    skipAnswering: [
      '[VOICE|USER',
      /* '[VOICE|USER|NOISE]',
      '[VOICE|USER|OUTOFCONTEXT]', */
      '[VOICE|CCAP]',
      '[SYSTEM',
      /* '[DEBUG|' */
    ],

    removeFromMessages: [
      '[VOICE|USER|ADJUSTED]',
      '[VOICE|USER]',
      '[VOICE|CCAP] 🔊',
      '🔊',
      '[VOICE|CCAP]',
      '[VOICE|CCAP|CLARIFY]',
      '🎤 **FutDevPro**:',
      '🔊 **CCAP**:',
      '**CCAP**:',
    ]
  },

  lengthLimits: {
    simplifyContextTargetFromDB: 10_000,
    contextWarning: 30_000,
    maxContextLength: 50_000,
    maxMessagesLength: 75_000,
    maxNewUserMessageLength: 25_000,

    maxContextLengthForSimplification: 100_000,
  },

  docChunking: {
    maxChunkSize: 1000,
    maxChunkCount: 30,
  },

  voice: {
    defaultConfidenceThreshold: 0.55,
    acceptedSpeechCategories: [
      CV_AudioClassificationCategory.speech, 
      CV_AudioClassificationCategory.conversation, 
      CV_AudioClassificationCategory.singing,
    ],
    /**
     * Voice Output Configuration
     */
    output: {
      /**
       * Directory for storing voice output audio files
       * Relative to process.cwd() or absolute path
       */
      audioOutputDir: '_assets/voice-outputs',
      
      /**
       * Default audio format for voice output
       */
      defaultFormat: 'mp3',
      
      /**
       * Default volume level (0.0 to 1.0)
       */
      defaultVolume: 1.0,
      
      /**
       * Default playback speed (0.25 to 4.0)
       */
      defaultSpeed: 1.0,
      
      /**
       * Maximum file age for cleanup (milliseconds)
       * Default: 24 hours
       */
      maxFileAge: day,
      
      /**
       * Startup cleanup configuration
       */
      startupCleanup: {
        /**
         * Whether to perform startup cleanup
         */
        enabled: true,
        
        /**
         * Whether to clean up all files on startup
         */
        cleanupAllFiles: true,
        
        /**
         * Maximum age for files to preserve during startup cleanup (milliseconds)
         */
        maxAge: day,
        
        /**
         * Whether to preserve recent files during startup cleanup
         */
        preserveRecent: false,
      },
    },
    thresholds: {
      /**
       * Minimum confidence threshold for AudioSet label acceptance (0.0 - 1.0)
       */
      audiosetLabelConfidenceThreshold: 0.3,
      
      /**
       * Minimum confidence threshold for overall speech detection (0.0 - 1.0)
       */
      audiosetOverallConfidenceThreshold: 0.4,

      /**
       * Minimum confidence threshold for ZCR validation (0.0 - 1.0)
       */
      zcrValidationThreshold: 0.3,

      /**
       * Minimum green block length for ZCR validation (frames)
       */
      zcrMinGreenBlockLength: 10,

      /**
       * Maximum red gap length for ZCR validation (frames)
       */
      zcrMaxRedGapLength: 2,

      /**
       * Minimum green ratio (majority) for a block to be accepted (0.0 - 1.0)
       */
      majorityGreenThreshold: 0.5,
    },
    /**
     * Speech Recognizer Configuration
     */
    speechRecognizer: {
      /**
       * Selected speech recognizer service
       * Options: 'whisper', 'elevenlabs', 'local'
       */
      selectedService: CV_SpeechRecognizerService.elevenlabs,

      /**
       * Audio Classification API Configuration
       */
      audioClassification: {
        /**
         * Audio Classification API URL
         */
        apiUrl: process.env.AUDIO_CLASSIFICATION_API_URL ?? 'http://127.0.0.1:38321',
  
        /**
         * Minimum file size for classification (bytes)
         */
        minFileSize: 512 * byte,
        
        /**
         * Maximum file size for classification (bytes)
         */
        maxFileSize: 100 * megabyte,
        
        /**
         * Request timeout in milliseconds
         */
        requestTimeout: 30 * second,
      },
      
      /**
       * Local Speech Recognition API Configuration
       */
      local: {
        /**
         * Local Speech Recognition API URL
         */
        apiUrl: process.env.LOCAL_SPEECH_RECOGNITION_API_URL ?? 'http://127.0.0.1:38321',
        
        /**
         * Request timeout in milliseconds
         */
        requestTimeout: 30 * second,
        
        /**
         * Maximum file size for recognition (bytes)
         */
        maxFileSize: 100 * megabyte,
        
        /**
         * Minimum file size for recognition (bytes)
         */
        minFileSize: 512 * byte,
        
        /**
         * Confidence threshold for local recognition (0.0 - 1.0)
         */
        confidenceThreshold: 0.55,
      },
      
      /**
       * ElevenLabs Configuration
       */
      elevenlabs: {        
        /**
         * ElevenLabs API URL
         */
        apiUrl: 'https://api.elevenlabs.io',
        
        /**
         * Request timeout in milliseconds
         */
        requestTimeout: 30 * second,
        
        /**
         * Maximum file size for recognition (bytes)
         */
        maxFileSize: 25 * megabyte,
        
        /**
         * Minimum file size for recognition (bytes)
         */
        minFileSize: kilobyte,
        
        /**
         * Default speech-to-text model to use
         * @default EL_SpeechToTextModels.scribe (scribe_v1)
         */
        defaultModel: EL_SpeechToTextModels.scribe,
        
        /**
         * Enable speaker diarization by default
         * Identifies different speakers in the audio
         * @default false
         */
        enableDiarization: false,
        
        /**
         * Enable audio event tagging by default
         * Tags non-speech events (laughter, applause, background noise, etc.)
         * @default false
         */
        enableAudioEventTagging: false,
        
        /**
         * Enable entity detection by default (Scribe v2 feature)
         * Detects names, locations, dates, etc. in the transcription
         * @default false
         */
        enableEntityDetection: false,
        
        /**
         * Default number of expected speakers (used when diarization is enabled)
         * @default undefined (auto-detect)
         */
        defaultNumSpeakers: undefined as number | undefined,
      },
      
      /**
       * Whisper Configuration
       */
      whisper: {        
        /**
         * Request timeout in milliseconds
         */
        requestTimeout: 30 * second,
        
        /**
         * Maximum file size for recognition (bytes)
         */
        maxFileSize: 25 * megabyte,
        
        /**
         * Minimum file size for recognition (bytes)
         */
        minFileSize: kilobyte,
      }
    }
  },

  /**
   * ClickUp Configuration
   */
  clickup: {    
    /**
     * ClickUp API Base URL
     */
    baseUrl: 'https://api.clickup.com/api',
    
    /**
     * Request timeout in milliseconds
     */
    timeout: 30 * second,
    
    /**
     * Number of retries for failed requests
     */
    retries: 3,
    
    /**
     * Debug mode
     */
    debug: false,
    
    /**
     * Default page size for API requests
     */
    defaultPageSize: 100,
    
    /**
     * Maximum page size for API requests
     */
    maxPageSize: 1000,

    docNames: [
      'GDD',
      'Policies',
      'FDP Documentations',
    ],
  },

  codeDocs: {
    reviewRulesLocation: '../../../fdp-documentations/guidelines/ai-agent/code-review-rules/file-review',
  },

  agent2: {
    /** Encryption key for user context confidential data. */
    userContextEncryptionKey: 'CCAP_Agt2_UserContext_EncryptionKey_2025_01_15_KpL9mN2qR5vW8xY3zA6bC4dE7fG1hI0jK2lM5nO8pQ1rS4tU7vW0xY3zA6bC',
  },

}

