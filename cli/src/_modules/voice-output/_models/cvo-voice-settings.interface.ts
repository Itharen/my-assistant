/**
 * CVO Voice Settings Interface
 * @author AI
 * @description Voice configuration settings for text-to-speech
 */
export interface CVO_VoiceSettings {
  /**
   * Speech rate (0.25 to 4.0)
   * @default 1.0
   */
  speed?: number;
  
  /**
   * Voice pitch (-20.0 to 20.0)
   * @default 0.0
   */
  pitch?: number;
  
  /**
   * Voice stability (0.0 to 1.0)
   * @default 0.5
   */
  stability?: number;
  
  /**
   * Voice similarity boost (0.0 to 1.0)
   * @default 0.75
   */
  similarityBoost?: number;
  
  /**
   * Voice style (0.0 to 1.0)
   * @default 0.0
   */
  style?: number;
  
  /**
   * Use speaker boost
   * @default false
   */
  useSpeakerBoost?: boolean;
} 