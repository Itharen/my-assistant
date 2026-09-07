/**
 * CV Speech Recognizer Service Enum
 * @author AI
 * @description Available speech recognizer services for the CCAP voice module
 */
export enum CV_SpeechRecognizerService {
  /**
   * OpenAI Whisper API
   * High-quality speech recognition with multilingual support
   */
  whisper = 'whisper',
  
  /**
   * ElevenLabs Speech-to-Text API
   * Advanced speech recognition with multiple models and languages
   */
  elevenlabs = 'elevenlabs',
  
  /**
   * Local Speech Recognition API
   * On-premise speech recognition service
   */
  local = 'local'
} 