import { CV_SpeechSegment } from './cv-speech-segment.interface.js';
import { CV_UserSpeechStateEnum } from '../_enums/cv-user-speech-state.enum.js';

/**
 * User Speech State Interface
 */
export interface CV_UserSpeechState {
  // Alapvető állapot
  currentState: CV_UserSpeechStateEnum;
  stateStartTime: number;
  
  // Frame counting
  speechFrames: number;
  silenceFrames: number;
  
  // Volume tracking
  volumeBuffer: number[];
  lastVolume: number;
  
  // ZCR tracking
  zcrBuffer: number[];
  lastZCR: number;
  
  // Timing
  lastActivityTime: number;
  recordingStartTime: number;
  
  // === INPUT MERGING MEGOLDÁS ===
  // Merge management
  isMerging: boolean;
  mergeStartTime: number;
  mergeTimeout: NodeJS.Timeout | null;
  speechSegments: CV_SpeechSegment[];
  currentSegmentStartTime: number;
  currentSegmentWavFile: string | null;
  
  // File management
  pendingWavFile: string | null;
  isProcessing: boolean;
  
  // Statistics
  totalSpeechTime: number;
  totalSilenceTime: number;
  frameCount: number;
  mergeCount: number;
} 