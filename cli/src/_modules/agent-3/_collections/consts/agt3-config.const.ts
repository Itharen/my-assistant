/**
 * Agent 3 configuration constants.
 */
export const agt3Config = {
  /** Wake word for triggering the assistant. */
  wakeWord: 'komputer',
  
  /** Wake word variations and patterns. */
  wakeWordVariations: [
    'komputer csináld ezt',
    'komputer csináld azt',
    'komputer mondd meg',
    'komputer',
  ],
  
  /** Session timeout in minutes (30 minutes = fél óra). */
  sessionTimeoutMinutes: 30,
  
  /** Maximum iterations for recursive operations. */
  maxIterations: 10,
  
  /** Minimum confidence threshold for wake word detection. */
  wakeWordConfidenceThreshold: 0.7,
  
  /** Session cleanup interval in minutes. */
  cleanupIntervalMinutes: 5,
  
  /** Retry attempts for LLM and TTS calls. */
  retryAttempts: 1,
  
  /** Retry delay in milliseconds. */
  retryDelayMs: 1000,
  
  /** TTS voice ID (OpenAI voice names). */
  ttsVoice: 'alloy',
  
  /** TTS model. */
  ttsModel: 'tts-1',
  
  /** Enable/disable Agent 3. */
  enableAgent3: false,
  
  /** Audio recording settings. */
  audio: {
    /** Sample rate for audio processing. */
    sampleRate: 48000,
    /** Channels (stereo). */
    channels: 2,
    /** Bit depth. */
    bitDepth: 16,
  },

  /** Porcupine wake word detection settings. */
  porcupine: {
    /** Access key from environment variable. */
    accessKey: process.env.PICOVOICE_ACCESS_KEY || '',
    /** Built-in wake word to use. */
    wakeWord: 'computer',
    /** Sensitivity threshold (0.0 - 1.0). Higher = more sensitive. */
    sensitivity: 0.5,
    /** Enable audio analysis pre-filtering before Porcupine processing. */
    enableAudioPreFilter: true,
    /** Frame length in milliseconds. */
    frameLengthMs: 20,
    /** Porcupine sample rate requirement. */
    sampleRate: 16000,
    /** Porcupine channels requirement (mono). */
    channels: 1,
    /** Bit depth. */
    bitDepth: 16,
  },
};
