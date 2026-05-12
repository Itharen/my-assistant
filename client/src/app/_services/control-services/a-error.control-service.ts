// Global error display + persistence service. Every error path in the client
// (HTTP interceptor, Angular ErrorHandler, manual showError() from components)
// routes through here. Behaviour:
//   1. Normalise via `A_ErrorExtract_Util.extract()` (handles DyFM_Error,
//      HttpErrorResponse, Error, string, unknown — never `[object Object]`).
//   2. Display a debug-level descriptive toast via `DyNX_Message_ControlService`
//      so the user always sees what happened.
//   3. Persist to the server `errors` collection via POST `/api/errors/error/log`
//      so the failure is recorded long-term (errors page + audit).
//
// Pattern source: master-prompter `a-error-handler.control-service.ts`
// + CCAP Unified Error Handling Full Pipeline spec.

import { inject, Injectable, NgZone } from '@angular/core';

import { DyFM_HttpCallType } from '@futdevpro/fsm-dynamo';
import { DyNX_ApiCall_Settings, DyNX_ApiService, DyNX_Message_ControlService } from '@futdevpro/ngx-dynamo';

import {
  A_ErrorDetails_Interface,
  A_ErrorExtract_Util
} from '../../_collections/error-extract.util';
import { API_CONFIG } from '../../_collections/api-config.const';
import { A_StorageKey } from '../../_enums/a-storage-key.enum';

@Injectable({ providedIn: 'root' })
/** Központi error pipeline — normalizál + toast + szerverre perzisztál minden kliens-oldali hibát. */
export class A_Error_ControlService {

  private readonly Đ_AS: DyNX_ApiService = inject(DyNX_ApiService);
  private readonly Đ_message_CS: DyNX_Message_ControlService = inject(DyNX_Message_ControlService);
  private readonly ngZone: NgZone = inject(NgZone);

  /**
   * Single entry point for any error surfacing in the client.
   * Source is a free-form label ("http", "uncaught", "d-capture.submit", …)
   * that helps locate where the error originated in the persisted record.
   */
  showError(err: unknown, source: string = 'client'): A_ErrorDetails_Interface {
    const details = A_ErrorExtract_Util.extract(err, source);

    // Always log to console first — devtools is the developer's source of truth.
    console.error(`[A_Error] ${details.errorCode}`, details.message, details);

    // Display through the snackbar service inside Angular zone so change
    // detection picks it up even when the error surfaced from an async
    // boundary (Promise rejection, microtask).
    this.ngZone.run((): void => {
      const visibleMessage = this.buildVisibleMessage(details);

      this.Đ_message_CS.newErrorMessage(visibleMessage, 10_000);
    });

    // Fire-and-forget persistence. Never block the caller; never throw.
    // If this POST itself fails (e.g. /errors endpoint down), swallow —
    // the user already saw the original toast; cascading is worse than silence.
    void this.persistToServer(details);

    return details;
  }

  private buildVisibleMessage(details: A_ErrorDetails_Interface): string {
    return `[${details.errorCode}] ${details.message}`;
  }

  private async persistToServer(details: A_ErrorDetails_Interface): Promise<void> {
    try {
      await this.Đ_AS.call(
        new DyNX_ApiCall_Settings({
          name: 'logError',
          type: DyFM_HttpCallType.post,
          baseUrl: this.baseUrl(),
          endpoint: '/errors/error/log',
        }),
        {
          body: {
            message: details.message,
            errorCode: details.errorCode,
            stack: details.stack,
            source: details.source,
            additionalContent: details.additionalContent,
            httpStatus: details.httpStatus,
          },
        },
      );
    } catch (persistErr) {
      // Don't recurse — log only.
      console.warn('[A_Error] failed to persist error to server', persistErr);
    }
  }

  private baseUrl(): string {
    const fromStorage: string | null =
      typeof window !== 'undefined' ? localStorage.getItem(A_StorageKey.serverBaseUrl) : null;

    return fromStorage ?? API_CONFIG.defaultBaseUrl;
  }
}
