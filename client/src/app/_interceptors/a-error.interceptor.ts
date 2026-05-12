// HTTP error interceptor — passive layer. Only logs to console and rethrows
// the error so downstream `.catch()` / `firstValueFrom` callers handle it.
// Display + persistence happen in EXACTLY ONE place per error path:
//   - Expected errors: consumer's catch → `A_Error_ControlService.showError()`
//   - Unexpected errors: Angular `ErrorHandler` (`A_ErrorHandler_ControlService`)
// This keeps the user-visible toast and the server-side `errors` row 1:1
// with each failure, no double-reporting.

import { Injectable } from '@angular/core';
import {
  type HttpEvent,
  type HttpHandler,
  type HttpInterceptor,
  type HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
/** Passive HTTP error interceptor — logol konzolra és rethrow-ol; a display/persist downstream történik. */
export class A_Error_Interceptor implements HttpInterceptor {
  /** A request-et továbbengedi, hiba esetén logol és változatlanul rethrow-ol. */
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse): Observable<never> => {
        console.error('[a-error.interceptor]', req.method, req.url, err.status, err.message);

        return throwError((): HttpErrorResponse => err);
      }),
    );
  }
}
