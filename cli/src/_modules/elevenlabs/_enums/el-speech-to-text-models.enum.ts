/**
 * ElevenLabs Speech-to-Text Models Enum
 * @author AI
 * @description Available speech-to-text models for ElevenLabs API
 */
export enum EL_SpeechToTextModels {
  // Multilingual models
  /* multilingualV1 = 'multilingual-v1', */
  /**
   * Scribe v1 - Original multilingual speech-to-text model
   * Supports 99 languages with word-level timestamps and speaker diarization
   */
  scribe = 'scribe_v1',
  
  /**
   * Scribe v1 Experimental - Experimental version of Scribe v1
   */
  scribeExperimental = 'scribe_experimental_v1',
  
  /**
   * Scribe v2 - Enhanced multilingual speech-to-text model
   * Features: keyterm prompting, entity detection, smart language detection
   * Supports 90+ languages with improved accuracy
   */
  scribeV2 = 'scribe_v2',
  
  /**
   * Scribe v2 Realtime - Low-latency realtime speech-to-text model
   * ~150ms latency, ideal for live applications (meetings, voice agents)
   * Supports 90+ languages via WebSocket connection
   */
  scribeV2Realtime = 'scribe_v2_realtime',

  
  // English-specific models
  /* englishV1 = 'english-v1',
  englishV2 = 'english-v2', */
  
  // Specialized models
  /* englishV2Accurate = 'english-v2-accurate',
  englishV2Fast = 'english-v2-fast', */
  
  // Latest models
  /* multilingualV3 = 'multilingual-v3',
  englishV3 = 'english-v3' */
} 