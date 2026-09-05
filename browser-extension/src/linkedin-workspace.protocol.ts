export const LINKEDIN_WORKSPACE_BRIDGE_ATTRIBUTE = 'data-ma-linkedin-bridge';
export const LINKEDIN_WORKSPACE_REQUEST_EVENT = 'my-assistant:linkedin-workspace-request';
export const LINKEDIN_WORKSPACE_RESPONSE_EVENT = 'my-assistant:linkedin-workspace-response';
export const LINKEDIN_WORKSPACE_MESSAGE_TYPE = 'MA_OPEN_LINKEDIN_WORKSPACE';
export const LINKEDIN_MESSAGING_URL = 'https://www.linkedin.com/messaging/';
export const MY_ASSISTANT_URL = 'http://127.0.0.1:39245/linkedin?surface=sidepanel';
export const MY_ASSISTANT_HEALTH_URL = 'http://127.0.0.1:39245/api/healthz';

export interface LinkedInWorkspaceBridgeRequest {
  requestId: string;
}

export interface LinkedInWorkspaceRuntimeRequest extends LinkedInWorkspaceBridgeRequest {
  type: typeof LINKEDIN_WORKSPACE_MESSAGE_TYPE;
}

export interface LinkedInWorkspaceBridgeResponse {
  requestId: string;
  ok: boolean;
  code: 'OPENED' | 'UNTRUSTED_ORIGIN' | 'INVALID_REQUEST' | 'OPEN_FAILED' | 'BRIDGE_TIMEOUT';
  message: string;
}
