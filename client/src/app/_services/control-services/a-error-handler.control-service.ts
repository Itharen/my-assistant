// Global Angular ErrorHandler — registered as `{ provide: ErrorHandler, ... }`
// in `App_Module`. Catches every UNCAUGHT exception in the Angular app
// (template binding errors, lifecycle hook throws, unhandled promise
// rejections that surface as Zone errors) and routes them through the
// global `A_Error_ControlService.showError()` pipeline so:
//   - the user sees a debug-level descriptive toast (not `[object Object]`)
//   - the error is persisted to the server errors collection
//   - the dev console still gets the original stack
//
// Pattern source: master-prompter `a-error-handler.control.service.ts`.

import { ErrorHandler, inject, Injectable } from '@angular/core';

import { A_Error_ControlService } from './a-error.control-service';

@Injectable({ providedIn: 'root' })
/** Global Angular ErrorHandler — minden uncaught exception-t az `A_Error_ControlService`-en át route-ol. */
export class A_ErrorHandler_ControlService implements ErrorHandler {

  private readonly error_CS: A_Error_ControlService = inject(A_Error_ControlService);

  /** Az Angular által átadott uncaught error-t a központi error pipeline-ba route-olja. */
  handleError(error: unknown): void {
    // Never throw from here — Angular treats a thrown ErrorHandler as fatal.
    try {
      this.error_CS.showError(error, 'uncaught');
    } catch (showErr) {
      // Final fallback — direct console so the user-facing system never
      // silently swallows the original error.
      console.error('[A_ErrorHandler] failed to surface error', showErr, error);
    }
  }
}
