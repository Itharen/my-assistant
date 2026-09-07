/**
 * EL Text-to-Speech Models Enum
 * @author AI
 * @description Available text-to-speech models for ElevenLabs
 */
export enum EL_TextToSpeechModels {
  // Multilingual models
  multilingualV1 = 'eleven_multilingual_v1',
  multilingualV2 = 'eleven_multilingual_v2',

  /** Eleven v3 – legkifejezőbb TTS modell, 70+ nyelv (hivatalos model_id). */
  elevenV3 = 'eleven_v3',

  // English-specific models
  englishV1 = 'eleven_english_v1',
  englishV2 = 'eleven_english_v2',

  // Specialized models
  englishV2Accurate = 'eleven_english_v2_accurate',
  englishV2Fast = 'eleven_english_v2_fast',

  // Legacy / alternate naming
  multilingualV3 = 'eleven_multilingual_v3',
  englishV3 = 'eleven_english_v3'
}