import { TestBed } from '@angular/core/testing';

import {
  LINKEDIN_WORKSPACE_BRIDGE_ATTRIBUTE,
  LINKEDIN_WORKSPACE_REQUEST_EVENT,
  LINKEDIN_WORKSPACE_RESPONSE_EVENT,
  type LinkedInWorkspaceBridgeRequest,
} from '../../../../../../browser-extension/src/linkedin-workspace.protocol';

import { L_LinkedInWorkspaceBridge_Service } from './l-linkedin-workspace-bridge.service';

describe('L_LinkedInWorkspaceBridge_Service', (): void => {
  let service: L_LinkedInWorkspaceBridge_Service;

  beforeEach((): void => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(L_LinkedInWorkspaceBridge_Service);
    document.documentElement.removeAttribute(LINKEDIN_WORKSPACE_BRIDGE_ATTRIBUTE);
  });

  afterEach((): void => {
    document.documentElement.removeAttribute(LINKEDIN_WORKSPACE_BRIDGE_ATTRIBUTE);
  });

  it('uses the synchronous native LinkedIn tab fallback when the extension is absent', async (): Promise<void> => {
    const open = spyOn(window, 'open').and.returnValue({} as Window);

    const result = await service.open();

    expect(open).toHaveBeenCalledWith('https://www.linkedin.com/messaging/', '_blank', 'noopener');
    expect(result.mode).toBe('native-tab-fallback');
  });

  it('uses the extension bridge when the loopback content script reports ready', async (): Promise<void> => {
    document.documentElement.setAttribute(LINKEDIN_WORKSPACE_BRIDGE_ATTRIBUTE, 'ready');
    const listener = (event: Event): void => {
      const request: LinkedInWorkspaceBridgeRequest = (event as CustomEvent<LinkedInWorkspaceBridgeRequest>).detail;
      document.dispatchEvent(new CustomEvent(LINKEDIN_WORKSPACE_RESPONSE_EVENT, {
        detail: { requestId: request.requestId, ok: true, code: 'OPENED', message: 'ok' },
      }));
    };
    document.addEventListener(LINKEDIN_WORKSPACE_REQUEST_EVENT, listener);

    const result = await service.open();

    document.removeEventListener(LINKEDIN_WORKSPACE_REQUEST_EVENT, listener);
    expect(result.mode).toBe('extension-side-panel');
  });
});
