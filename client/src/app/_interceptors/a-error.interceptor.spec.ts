// Spec for A_Error_Interceptor — HTTP error central pipeline route + recursion guard.
// Cycle 113 (safe-orthogonal spec-coverage).
//
// Pattern: a-auth.interceptor.spec.ts — TestBed + provideHttpClientTesting +
// HTTP_INTERCEPTORS multi-provider.

import { HttpClient, provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { A_Error_Interceptor } from './a-error.interceptor';
import { A_Error_ControlService } from '../_services/control-services/a-error.control-service';

describe('A_Error_Interceptor', () => {

  let http: HttpClient;
  let httpMock: HttpTestingController;
  let showErrorSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    const stubControlService: { showError: jasmine.Spy } = { showError: jasmine.createSpy('showError') };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: A_Error_Interceptor, multi: true },
        { provide: A_Error_ControlService, useValue: stubControlService },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    showErrorSpy = stubControlService.showError;
    consoleErrorSpy = spyOn(console, 'error');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('does not route successful responses to showError', (done) => {
    http.get('/x').subscribe({
      next: (): void => { done(); },
      error: (): void => fail('should not error'),
    });
    httpMock.expectOne('/x').flush({ ok: true });
    expect(showErrorSpy).not.toHaveBeenCalled();
  });

  it('routes HttpErrorResponse via A_Error_ControlService.showError with "http" source', (done) => {
    http.get('/api/x').subscribe({
      next: (): void => fail('should error'),
      error: (): void => {
        expect(showErrorSpy).toHaveBeenCalledTimes(1);
        expect(showErrorSpy.calls.mostRecent().args[1]).toBe('http');
        done();
      },
    });
    httpMock.expectOne('/api/x').flush('boom', { status: 500, statusText: 'Server Error' });
  });

  it('skips showError for /errors/error/log endpoint (recursion guard) — logs to console instead', (done) => {
    http.post('/errors/error/log', { foo: 1 }).subscribe({
      next: (): void => fail('should error'),
      error: (): void => {
        expect(showErrorSpy).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalled();
        const args: unknown[] = consoleErrorSpy.calls.mostRecent().args as unknown[];
        expect(args[0]).toContain('[a-error.interceptor]');
        done();
      },
    });
    httpMock.expectOne('/errors/error/log').flush('boom', { status: 503, statusText: 'Service Unavailable' });
  });

  it('re-throws the HttpErrorResponse so consumer .error subscribers still fire', (done) => {
    http.get('/will-fail').subscribe({
      next: (): void => fail('should error'),
      error: (err: { status: number }): void => {
        expect(err.status).toBe(404);
        done();
      },
    });
    httpMock.expectOne('/will-fail').flush('not found', { status: 404, statusText: 'Not Found' });
  });

  it('also routes errors for arbitrary URLs that merely contain "errors" but not the log endpoint', (done) => {
    http.get('/api/errors/list').subscribe({
      next: (): void => fail('should error'),
      error: (): void => {
        expect(showErrorSpy).toHaveBeenCalledTimes(1);
        done();
      },
    });
    httpMock.expectOne('/api/errors/list').flush('boom', { status: 500, statusText: 'Server Error' });
  });
});
