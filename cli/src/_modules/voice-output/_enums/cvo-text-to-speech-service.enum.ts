/**
 * CVO Text-to-Speech Service Enum
 * @author AI
 * @description Available text-to-speech services for the CCAP voice output module
 */
export enum CVO_TextToSpeechService {
  /**
   * OpenAI Text-to-Speech API
   * High-quality text-to-speech with multiple voices and languages
   */
  openai = 'openai',
  
  /**
   * ElevenLabs Text-to-Speech API
   * Advanced text-to-speech with voice cloning and customization
   */
  elevenlabs = 'elevenlabs'
} 