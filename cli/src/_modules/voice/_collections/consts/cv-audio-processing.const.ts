import { second } from '@futdevpro/fsm-dynamo';

/**
 * Audio Processing Configuration
 */
export const CV_audioProcessingConfig = {
  sampleRate: 48000,
  channels: 2,
  bitDepth: 16,
  frameSize: 960,
  endBehaviourDuration: second,    // ms
}; 