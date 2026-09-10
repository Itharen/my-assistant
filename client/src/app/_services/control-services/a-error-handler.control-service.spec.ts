// Spec for A_ErrorHandler_ControlService — global Angular ErrorHandler bridge.
// Cycle 115 (safe-orthogonal spec-coverage).
//
// Pattern: a-error.control-service.spec.ts (cycle 114) — TestBed + stub provider
// for A_Error_ControlService.

import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { A_Error_ControlService } from './a-error.control-service';
import { A_ErrorHandler_ControlService } from './a-error-handler.control-service';

describe('A_ErrorHandler_ControlService', () => {

  let svc: A_ErrorHandler_ControlService;
  let showErrorSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    showErrorSpy = jasmine.createSpy('showError');
    consoleErrorSpy = spyOn(console, 'error');

    TestBed.configureTestingModule({
      providers: [
        { provide: A_Error_ControlService, useValue: { showError: showErrorSpy } },
      ],
    });
    svc = TestBed.inject(A_ErrorHandler_ControlService);
  });

  it('implements the Angular ErrorHandler contract', () => {
    expect(svc.handleError).toEqual(jasmine.any(Function));
    // Structural-typing check: the service satisfies the ErrorHandler interface.
    const handler: ErrorHandler = svc;
    expect(handler.handleError).toBeDefined();
  });

  it('routes uncaught errors via A_Error_ControlService.showError with source="uncaught"', () => {
    const err: Error = new Error('boom');

    svc.handleError(err);

    expect(showErrorSpy).toHaveBeenCalledTimes(1);
    expect(showErrorSpy).toHaveBeenCalledWith(err, 'uncaught');
  });

  it('handles non-Error inputs (string, plain object, null) without throwing', () => {
    expect(() => svc.handleError('crash')).not.toThrow();
    expect(() => svc.handleError({ foo: 'bar' })).not.toThrow();
    expect(() => svc.handleError(null)).not.toThrow();

    expect(showErrorSpy).toHaveBeenCalledTimes(3);
  });

  it('🔴 végső fallback: ha a showError MAGA dob, MINDKÉT hiba látszik a naplóban', () => {
    // ⚠️ EZ A SPEC 2026-09-10-én ELBUKOTT, és jogosan: a sink `console.error`-ról
    // `DyFM_Log.error`-ra váltott (a `no-console-log` szabály szerint), és a három külön
    // argumentum EGY interpolált üzenetté vált.
    //
    // ⭐ A SZERZŐDÉS VÁLTOZATLAN, csak az alakja más: (a) a `handleError` nem dob,
    // (b) a naplóban ott van a felszínre-hozás hibája ÉS az EREDETI hiba is. Ha bármelyik
    // kimaradna, a fejlesztő pont azt nem tudná meg, ami miatt a lánc elhasalt.
    const showErr: Error = new Error('pipeline-down');
    showErrorSpy.and.throwError(showErr);
    const original: Error = new Error('original-error');

    expect(() => svc.handleError(original)).not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();
    const logged: string = String((consoleErrorSpy.calls.mostRecent().args as unknown[])[0]);

    expect(logged).toContain('[A_ErrorHandler] failed to surface error');
    expect(logged).toContain('pipeline-down');
    // ⭐ A LEGFONTOSABB: az EREDETI hiba sem veszhet el a fallback mögött.
    expect(logged).toContain('original-error');
  });
});
