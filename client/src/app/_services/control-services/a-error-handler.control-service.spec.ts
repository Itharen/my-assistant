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

  it('falls back to console.error when showError itself throws (final-fallback contract)', () => {
    const showErr: Error = new Error('pipeline-down');
    showErrorSpy.and.throwError(showErr);
    const original: Error = new Error('original-error');

    expect(() => svc.handleError(original)).not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalled();
    const args: unknown[] = consoleErrorSpy.calls.mostRecent().args as unknown[];
    expect(args[0]).toBe('[A_ErrorHandler] failed to surface error');
    expect(args[1]).toBe(showErr);
    expect(args[2]).toBe(original);
  });
});
