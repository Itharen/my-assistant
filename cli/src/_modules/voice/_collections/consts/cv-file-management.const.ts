import { second } from '@futdevpro/fsm-dynamo';

/**
 * File Management Configuration
 */
export const CV_fileManagementConfig = {
  recordingDir: 'recordings',
  fileRetryAttempts: 3,
  fileRetryDelay: second,
}; 