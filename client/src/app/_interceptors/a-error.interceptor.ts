// HTTP error interceptor — active layer (FR #3b Phase 4, cycle 45).
//
// Routes every HttpErrorResponse through the central `A_Error_ControlService.showError()`
// pipeline so the user sees a toast + the error is persisted to the server,
// THEN rethrows so consumer-side `.catch()` / `firstValueFrom` continue normally.
//
// Recursion guard: skips showError() for requests to `/errors/error/log`
// itself (otherwise a failing persist would trigger another persist attempt).
// The persistToServer in A_Error_ControlService has its own swallow try/catch
// as a second-line defense.

import { inject, Injectable } from '@angular/core';
import {
  type HttpEvent,
  type HttpHandler,
  type HttpInterceptor,
  type HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

import { A_Error_ControlService } from '../_services/control-services/a-error.control-service';

@Injectable()
/** Aktív HTTP error interceptor — minden HttpErrorResponse-on a central showError pipeline-t futtatja, majd rethrow. */
export class A_Error_Interceptor implements HttpInterceptor {

  private readonly error_CS: A_Error_ControlService = inject(A_Error_ControlService);

  /** A request-et továbbengedi, hiba esetén route-olja a central pipeline-on (toast + persist) és rethrow. */
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse): Observable<never> => {
        // Recursion guard: a `/errors/error/log` endpoint hibáit NEM routoljuk
        // a showError pipeline-on, mert az pont ugyanide POST-olna (loop).
        // A persistToServer-ben lévő swallow try/catch second-line védelem.
        const isErrorEndpoint: boolean = req.url.includes('/errors/error/log');

        if (!isErrorEndpoint) {
          this.error_CS.showError(err, 'http');
        } else {
          // Csak konzolra — a központi pipeline-t kihagyjuk recursion ellen.
          console.error('[a-error.interceptor] /errors/error/log failed', req.method, req.url, err.status, err.message);
        }

        return throwError((): HttpErrorResponse => err);
      }),
    );
  }
}
