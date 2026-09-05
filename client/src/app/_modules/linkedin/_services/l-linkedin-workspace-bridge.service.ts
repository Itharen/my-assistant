import { Injectable } from '@angular/core';

import {
  LINKEDIN_WORKSPACE_BRIDGE_ATTRIBUTE,
  LINKEDIN_WORKSPACE_REQUEST_EVENT,
  LINKEDIN_WORKSPACE_RESPONSE_EVENT,
  type LinkedInWorkspaceBridgeResponse,
} from '../../../../../../browser-extension/src/linkedin-workspace.protocol';

export interface LinkedInWorkspaceLaunchResult {
  mode: 'extension-side-panel' | 'native-tab-fallback';
  message: string;
}

@Injectable({ providedIn: 'root' })
/** Explicit user-gesture bridge to the independently installed companion extension. */
export class L_LinkedInWorkspaceBridge_Service {
  isConnected(): boolean {
    return typeof document !== 'undefined'
      && document.documentElement.getAttribute(LINKEDIN_WORKSPACE_BRIDGE_ATTRIBUTE) === 'ready';
  }

  async open(): Promise<LinkedInWorkspaceLaunchResult> {
    if (!this.isConnected()) {
      window.open('https://www.linkedin.com/messaging/', '_blank', 'noopener');
      return {
        mode: 'native-tab-fallback',
        message: 'A LinkedIn normál lapjának megnyitását kértem. Ha nem jelent meg, engedélyezd az új lapot; az oldalsávhoz töltsd be a Companion bővítményt.',
      };
    }

    const requestId: string = crypto.randomUUID();
    const response: LinkedInWorkspaceBridgeResponse = await new Promise(
      (resolve: (value: LinkedInWorkspaceBridgeResponse) => void): void => {
        const timeout: number = window.setTimeout((): void => {
          document.removeEventListener(LINKEDIN_WORKSPACE_RESPONSE_EVENT, onResponse as EventListener);
          resolve({ requestId, ok: false, code: 'BRIDGE_TIMEOUT', message: 'A bővítmény nem válaszolt 5 másodpercen belül.' });
        }, 5_000);
        const onResponse = (event: Event): void => {
          const detail: LinkedInWorkspaceBridgeResponse = (event as CustomEvent<LinkedInWorkspaceBridgeResponse>).detail;
          if (detail.requestId !== requestId) {
            return;
          }
          window.clearTimeout(timeout);
          document.removeEventListener(LINKEDIN_WORKSPACE_RESPONSE_EVENT, onResponse as EventListener);
          resolve(detail);
        };
        document.addEventListener(LINKEDIN_WORKSPACE_RESPONSE_EVENT, onResponse as EventListener);
        document.dispatchEvent(new CustomEvent(LINKEDIN_WORKSPACE_REQUEST_EVENT, { detail: { requestId } }));
      },
    );
    if (!response.ok) {
      throw new Error(`${response.code}: ${response.message}`);
    }
    return { mode: 'extension-side-panel', message: 'A LinkedIn munkamód megnyílt: natív LinkedIn lap + My Assistant oldalsáv.' };
  }
}
