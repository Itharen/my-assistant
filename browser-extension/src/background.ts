import {
  LINKEDIN_MESSAGING_URL,
  LINKEDIN_WORKSPACE_MESSAGE_TYPE,
  type LinkedInWorkspaceBridgeResponse,
  type LinkedInWorkspaceRuntimeRequest,
} from './linkedin-workspace.protocol.js';

export interface LinkedInWorkspaceChromeApi {
  openSidePanel(windowId: number): Promise<void>;
  createTab(url: string, windowId?: number): Promise<void>;
}

export function isTrustedMyAssistantUrl(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  try {
    const url: URL = new URL(value);
    return url.protocol === 'http:'
      && url.port === '39245'
      && (url.hostname === '127.0.0.1' || url.hostname === 'localhost');
  } catch {
    return false;
  }
}

export function isWorkspaceRequest(value: unknown): value is LinkedInWorkspaceRuntimeRequest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record: Record<string, unknown> = value as Record<string, unknown>;
  return record['type'] === LINKEDIN_WORKSPACE_MESSAGE_TYPE
    && typeof record['requestId'] === 'string'
    && record['requestId'].length > 0;
}

export async function openLinkedInWorkspace(
  api: LinkedInWorkspaceChromeApi,
  windowId: number,
  requestId: string,
): Promise<LinkedInWorkspaceBridgeResponse> {
  try {
    await api.openSidePanel(windowId);
    await api.createTab(LINKEDIN_MESSAGING_URL, windowId);
    return { requestId, ok: true, code: 'OPENED', message: 'LinkedIn workspace opened.' };
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : String(error);
    return { requestId, ok: false, code: 'OPEN_FAILED', message };
  }
}

const browserApi: LinkedInWorkspaceChromeApi | null = typeof chrome === 'undefined' ? null : {
  openSidePanel: async (windowId: number): Promise<void> => chrome.sidePanel.open({ windowId }),
  createTab: async (url: string, windowId?: number): Promise<void> => {
    await chrome.tabs.create({ url, active: true, ...(windowId === undefined ? {} : { windowId }) });
  },
};

if (browserApi) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse): boolean => {
    if (!isWorkspaceRequest(message)) {
      sendResponse({ requestId: '', ok: false, code: 'INVALID_REQUEST', message: 'Invalid workspace request.' });
      return false;
    }
    if (!isTrustedMyAssistantUrl(sender.url) || sender.tab?.windowId === undefined) {
      sendResponse({ requestId: message.requestId, ok: false, code: 'UNTRUSTED_ORIGIN', message: 'Request origin rejected.' });
      return false;
    }
    void openLinkedInWorkspace(browserApi, sender.tab.windowId, message.requestId).then(sendResponse);
    return true;
  });

  chrome.action.onClicked.addListener((tab): void => {
    if (tab.windowId !== undefined) {
      void openLinkedInWorkspace(browserApi, tab.windowId, crypto.randomUUID());
    }
  });
}
