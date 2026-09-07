import { CV_SpeechSegment } from './cv-speech-segment.interface.js';

/**
 * Merge Result Interface
 */
export interface CV_MergeResult {
  shouldProcess: boolean;
  segments: CV_SpeechSegment[];
  totalDuration: number;
} 