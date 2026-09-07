/**
 * CVO Voice Model Enum
 * @author AI
 * @description Available voice models for text-to-speech services
 */
export enum CVO_VoiceModel {
  // OpenAI TTS Models
  tts1 = 'tts-1',
  tts1HD = 'tts-1-hd',
  
  // ElevenLabs Voice Models
  elevenMultilingualV1 = 'eleven_multilingual_v1',
  elevenEnglishV1 = 'eleven_english_v1',
  elevenEnglishV2 = 'eleven_english_v2',
  
  // Default models
  default = 'default'
} 