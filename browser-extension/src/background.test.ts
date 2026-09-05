import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isTrustedMyAssistantUrl, isWorkspaceRequest, openLinkedInWorkspace } from './background.js';
import { LINKEDIN_MESSAGING_URL, LINKEDIN_WORKSPACE_MESSAGE_TYPE } from './linkedin-workspace.protocol.js';

describe('My Assistant Chrome companion background', (): void => {
  it('accepts only the exact loopback app origin', (): void => {
    assert.equal(isTrustedMyAssistantUrl('http://127.0.0.1:39245/linkedin'), true);
    assert.equal(isTrustedMyAssistantUrl('http://localhost:39245/dashboard'), true);
    assert.equal(isTrustedMyAssistantUrl('https://127.0.0.1:39245/linkedin'), false);
    assert.equal(isTrustedMyAssistantUrl('http://127.0.0.1.evil.test:39245/linkedin'), false);
    assert.equal(isTrustedMyAssistantUrl('https://www.linkedin.com/messaging/'), false);
  });

  it('rejects malformed runtime messages', (): void => {
    assert.equal(isWorkspaceRequest({ type: LINKEDIN_WORKSPACE_MESSAGE_TYPE, requestId: 'r1' }), true);
    assert.equal(isWorkspaceRequest({ type: LINKEDIN_WORKSPACE_MESSAGE_TYPE, requestId: '' }), false);
    assert.equal(isWorkspaceRequest({ type: 'OTHER', requestId: 'r1' }), false);
  });

  it('opens the panel before the top-level LinkedIn tab', async (): Promise<void> => {
    const calls: string[] = [];
    const response = await openLinkedInWorkspace({
      openSidePanel: async (windowId: number): Promise<void> => { calls.push(`panel:${windowId}`); },
      createTab: async (url: string, windowId?: number): Promise<void> => { calls.push(`tab:${windowId}:${url}`); },
    }, 7, 'request-1');
    assert.deepEqual(calls, [`panel:7`, `tab:7:${LINKEDIN_MESSAGING_URL}`]);
    assert.equal(response.ok, true);
    assert.equal(response.code, 'OPENED');
  });

  it('returns a truthful failure instead of claiming the workspace opened', async (): Promise<void> => {
    const response = await openLinkedInWorkspace({
      openSidePanel: async (): Promise<void> => { throw new Error('sidePanel unavailable'); },
      createTab: async (): Promise<void> => { throw new Error('must not run'); },
    }, 7, 'request-2');
    assert.equal(response.ok, false);
    assert.equal(response.code, 'OPEN_FAILED');
    assert.match(response.message, /sidePanel unavailable/u);
  });
});
