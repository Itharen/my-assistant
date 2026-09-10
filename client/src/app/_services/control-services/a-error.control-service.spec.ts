// Spec for A_Error_ControlService — central showError pipeline.
// Cycle 114 (safe-orthogonal spec-coverage).
//
// Pattern: a-error.interceptor.spec.ts (cycle 113) — TestBed + stub providers.

import { TestBed } from '@angular/core/testing';

import { DyNX_ApiService, DyNX_Message_ControlService } from '@futdevpro/ngx-dynamo';

import { A_Error_ControlService } from './a-error.control-service';

describe('A_Error_ControlService', () => {

  let svc: A_Error_ControlService;
  let apiCallSpy: jasmine.Spy;
  let messageSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;
  let consoleWarnSpy: jasmine.Spy;

  beforeEach(() => {
    apiCallSpy = jasmine.createSpy('call').and.returnValue(Promise.resolve({}));
    messageSpy = jasmine.createSpy('newErrorMessage');
    consoleErrorSpy = spyOn(console, 'error');
    consoleWarnSpy = spyOn(console, 'warn');

    TestBed.configureTestingModule({
      providers: [
        { provide: DyNX_ApiService, useValue: { call: apiCallSpy } },
        { provide: DyNX_Message_ControlService, useValue: { newErrorMessage: messageSpy } },
      ],
    });
    svc = TestBed.inject(A_Error_ControlService);
  });

  it('returns the extracted A_ErrorDetails with default source "client"', () => {
    const out = svc.showError(new Error('boom'));

    expect(out.message).toBe('boom');
    expect(out.errorCode).toBe('Error');
    expect(out.source).toBe('client');
  });

  it('preserves an explicit source label', () => {
    const out = svc.showError(new Error('x'), 'my.component.method');

    expect(out.source).toBe('my.component.method');
  });

  it('naplózza az [A_Error] előtagot, a hibakódot ÉS az üzenetet — egy sorban', () => {
    // ⚠️ EZ A SPEC 2026-09-10-én ELBUKOTT, és jogosan: a sink `console.error`-ról
    // `DyFM_Log.error`-ra váltott (a `no-console-log` szabály szerint), és a két külön
    // argumentum EGY interpolált üzenetté vált.
    //
    // ⭐ A SZERZŐDÉS VÁLTOZATLAN: az előtag azonosítja a forrást, a kód a grep-elhetőséget
    // adja, az üzenet pedig azt, hogy MI történt. Mind a három kell — kód nélkül nem
    // kereshető, üzenet nélkül nem érthető.
    svc.showError(new Error('boom'), 'spec');

    expect(consoleErrorSpy).toHaveBeenCalled();
    const logged: string = String((consoleErrorSpy.calls.mostRecent().args as unknown[])[0]);

    expect(logged).toContain('[A_Error]');
    expect(logged).toContain('boom');
  });

  it('emits a toast via DyNX_Message_ControlService.newErrorMessage with verticalPosition=bottom + 10s', () => {
    svc.showError(new Error('boom'), 'spec');

    expect(messageSpy).toHaveBeenCalledTimes(1);
    const args: unknown[] = messageSpy.calls.mostRecent().args as unknown[];
    expect(args[0]).toBe('[Error] boom');
    expect(args[1]).toBe(10_000);
    expect(args[3]).toEqual({ verticalPosition: 'bottom' });
  });

  it('fires-and-forgets POST /errors/error/log with details payload', async () => {
    svc.showError(new Error('persist-test'), 'persist-spec');

    // Wait a microtask for the fire-and-forget Promise to schedule.
    await Promise.resolve();

    expect(apiCallSpy).toHaveBeenCalledTimes(1);
    const callArgs: { endpoint?: string }[] = apiCallSpy.calls.mostRecent().args as { endpoint?: string }[];
    expect(callArgs[0].endpoint).toBe('/errors/error/log');
    const opts: { body?: { errorCode?: string; message?: string; source?: string } } =
      callArgs[1] as { body?: { errorCode?: string; message?: string; source?: string } };
    expect(opts.body?.errorCode).toBe('Error');
    expect(opts.body?.message).toBe('persist-test');
    expect(opts.body?.source).toBe('persist-spec');
  });

  it('does not throw when persistToServer rejects — logs console.warn instead', async () => {
    apiCallSpy.and.returnValue(Promise.reject(new Error('persist-down')));

    expect(() => svc.showError(new Error('x'))).not.toThrow();

    // Let the rejection propagate through the swallow catch.
    await new Promise<void>((resolve): void => { setTimeout(resolve, 0); });

    expect(consoleWarnSpy).toHaveBeenCalled();
    const args: unknown[] = consoleWarnSpy.calls.mostRecent().args as unknown[];
    expect(args[0]).toContain('[A_Error]');
    expect(args[0]).toContain('failed to persist');
  });

  it('handles non-Error inputs without throwing (string, plain object, null)', () => {
    expect(() => svc.showError('crash')).not.toThrow();
    expect(() => svc.showError({ foo: 'bar' })).not.toThrow();
    expect(() => svc.showError(null)).not.toThrow();

    expect(messageSpy).toHaveBeenCalledTimes(3);
  });
});
