import {
  LINKEDIN_WORKSPACE_BRIDGE_ATTRIBUTE,
  LINKEDIN_WORKSPACE_MESSAGE_TYPE,
  LINKEDIN_WORKSPACE_REQUEST_EVENT,
  LINKEDIN_WORKSPACE_RESPONSE_EVENT,
  type LinkedInWorkspaceBridgeRequest,
  type LinkedInWorkspaceBridgeResponse,
  type LinkedInWorkspaceRuntimeRequest,
} from './linkedin-workspace.protocol.js';

document.documentElement.setAttribute(LINKEDIN_WORKSPACE_BRIDGE_ATTRIBUTE, 'ready');

document.addEventListener(LINKEDIN_WORKSPACE_REQUEST_EVENT, (event: Event): void => {
  const request: LinkedInWorkspaceBridgeRequest | undefined = (event as CustomEvent<LinkedInWorkspaceBridgeRequest>).detail;
  if (!request || typeof request.requestId !== 'string' || request.requestId.length === 0) {
    return;
  }
  const runtimeRequest: LinkedInWorkspaceRuntimeRequest = {
    type: LINKEDIN_WORKSPACE_MESSAGE_TYPE,
    requestId: request.requestId,
  };
  void chrome.runtime.sendMessage<LinkedInWorkspaceBridgeResponse>(runtimeRequest)
    .then((response: LinkedInWorkspaceBridgeResponse): void => dispatchResponse(response))
    .catch((error: unknown): void => dispatchResponse({
      requestId: request.requestId,
      ok: false,
      code: 'OPEN_FAILED',
      message: error instanceof Error ? error.message : String(error),
    }));
});

function dispatchResponse(response: LinkedInWorkspaceBridgeResponse): void {
  document.dispatchEvent(new CustomEvent(LINKEDIN_WORKSPACE_RESPONSE_EVENT, { detail: response }));
}
