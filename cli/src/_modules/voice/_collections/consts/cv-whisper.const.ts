/**
 * Whisper Configuration
 */
export const CV_whisperConfig = {
  /**
   * Ez a model amit a Whisper-el használunk
   */
  model: 'gpt-4o-transcribe', // 'whisper-large', //'whisper-1',
  /**
   * A nyelv amit a Whisper-el használunk
   */
  language: 'hu',
  /**
   * 
   */
  temperature: 0.25,
  /**
   * A válasz formátuma amit a Whisper-el használunk
   */
  responseFormat: 'json', // 'verbose_json',
  /**
   * A fájl mérete amit a Whisper-el használunk
   */
  maxFileSize: 25 * 1024 * 1024, // 25MB
  /**
   * A fájl mérete amit a Whisper-el használunk
   */
  minFileSize: 1000,             // 1KB
}; 