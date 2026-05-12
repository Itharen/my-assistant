import { type HttpEvent, type HttpHandler, type HttpInterceptor, type HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { type Observable } from 'rxjs';

import { A_StorageKey } from '../_enums/a-storage-key.enum';

@Injectable()
/** Auth interceptor — minden HTTP request-re bevágja a `Bearer <token>` headert ha van localStorage token. */
export class A_Auth_Interceptor implements HttpInterceptor {
  /** Hozzáadja a localStorage-ből kiolvasott Bearer token-t az Authorization headerhez, ha van. */
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token: string | null = typeof window !== 'undefined' ? localStorage.getItem(A_StorageKey.authToken) : null;

    if (!token) {
      return next.handle(req);
    }
    const cloned: HttpRequest<unknown> = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });

    return next.handle(cloned);
  }
}
