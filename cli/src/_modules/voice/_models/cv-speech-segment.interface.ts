/**
 * Speech Segment Interface
 */
export interface CV_SpeechSegment {
  startTime: number;
  endTime: number;
  duration: number;
  wavFile: string;
  volumeStats: {
    avgVolume: number;
    maxVolume: number;
    minVolume: number;
  };
} 