// Spec for error-extract.util — error-shape normalizer all-branches.
// Cycle 107 (safe-orthogonal spec-coverage).
//
// Pattern: wave-sinusoid-fit.util.spec.ts (cycle 106) — Jasmine describe/it/expect.

import { HttpErrorResponse } from '@angular/common/http';

import { DyFM_Error } from '@futdevpro/fsm-dynamo';

import { A_ErrorExtract_Util, type A_ErrorDetails_Interface } from './error-extract.util';

describe('error-extract.util — A_ErrorExtract_Util.extract', () => {

  describe('plain Error', () => {

    it('extracts message + name as errorCode + stack', () => {
      const err: Error = new Error('boom');
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(err, 'spec');

      expect(out.message).toBe('boom');
      expect(out.errorCode).toBe('Error');
      expect(out.source).toBe('spec');
      expect(out.stack).toBeTruthy();
      expect(out.raw).toBe(err);
    });

    it('falls back to name when message is empty', () => {
      const err: Error = new TypeError('');
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(err);

      expect(out.message).toBe('TypeError');
      expect(out.errorCode).toBe('TypeError');
    });
  });

  describe('string error', () => {

    it('uses the string as message with STRING-ERROR code', () => {
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract('crash', 'spec');

      expect(out.message).toBe('crash');
      expect(out.errorCode).toBe('STRING-ERROR');
      expect(out.source).toBe('spec');
      expect(out.raw).toBe('crash');
    });
  });

  describe('HttpErrorResponse', () => {

    it('handles object body with `_message` + `_errorCode` (DyFM style)', () => {
      const httpErr: HttpErrorResponse = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
        url: '/api/x',
        error: { _message: 'db down', _errorCode: 'DB-DOWN', stack: 'fake-stack' },
      });
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(httpErr, 'http-spec');

      expect(out.errorCode).toBe('DB-DOWN');
      expect(out.message).toContain('500');
      expect(out.message).toContain('db down');
      expect(out.stack).toBe('fake-stack');
      expect(out.httpStatus).toBe(500);
      expect(out.source).toBe('http-spec');
    });

    it('handles object body with `message` + `errorCode` (non-prefixed)', () => {
      const httpErr: HttpErrorResponse = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request',
        error: { message: 'invalid input', errorCode: 'INVALID-INPUT' },
      });
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(httpErr);

      expect(out.errorCode).toBe('INVALID-INPUT');
      expect(out.message).toContain('invalid input');
      expect(out.httpStatus).toBe(400);
    });

    it('falls back to HTTP-status errorCode when body object lacks identifiers', () => {
      const httpErr: HttpErrorResponse = new HttpErrorResponse({
        status: 502,
        statusText: 'Bad Gateway',
        error: { someOther: 'field' },
      });
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(httpErr);

      expect(out.errorCode).toBe('HTTP-502');
      expect(out.httpStatus).toBe(502);
    });

    it('handles string body (raw text)', () => {
      const httpErr: HttpErrorResponse = new HttpErrorResponse({
        status: 503,
        statusText: 'Service Unavailable',
        error: 'maintenance',
      });
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(httpErr);

      expect(out.message).toContain('503');
      expect(out.message).toContain('maintenance');
      expect(out.errorCode).toBe('HTTP-503');
      expect(out.httpStatus).toBe(503);
    });

    it('handles null body (just status + statusText)', () => {
      const httpErr: HttpErrorResponse = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: null,
      });
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(httpErr);

      expect(out.message).toContain('404');
      expect(out.errorCode).toBe('HTTP-404');
      expect(out.httpStatus).toBe(404);
    });
  });

  describe('DyFM_Error', () => {

    it('extracts message + errorCode via static getters', () => {
      const err: DyFM_Error = new DyFM_Error({ message: 'dy-msg', errorCode: 'DY-CODE' });
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(err, 'dyfm-spec');

      expect(out.message).toContain('dy-msg');
      expect(out.errorCode).toBe('DY-CODE');
      expect(out.source).toBe('dyfm-spec');
      expect(out.raw).toBe(err);
    });

    it('passes through DyFM_Error default errorCode when none is set', () => {
      // DyFM_Error.getErrorCode() returns a truthy default ('NO-ERROR-CODE')
      // when no errorCode is provided, so our `|| 'NO-CODE'` fallback never fires.
      // The test documents the actual contract — a non-empty string is always emitted.
      const err: DyFM_Error = new DyFM_Error({ message: 'no-code-msg' });
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(err);

      expect(out.errorCode).toBeTruthy();
      expect(typeof out.errorCode).toBe('string');
    });

    it('passes through DyFM_Error default message when none is set', () => {
      // Hasonlóan a fenti errorCode-hoz: getErrorMessage() truthy default-ot
      // ad vissza, így a `|| 'DyFM_Error without message'` fallback dead code.
      const err: DyFM_Error = new DyFM_Error({ errorCode: 'CODE-ONLY' });
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(err);

      expect(out.message).toBeTruthy();
      expect(typeof out.message).toBe('string');
    });
  });

  describe('unknown object fallback', () => {

    it('stringifies a plain object with UNKNOWN-ERROR code', () => {
      const obj: { foo: string; bar: number } = { foo: 'x', bar: 42 };
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(obj);

      expect(out.errorCode).toBe('UNKNOWN-ERROR');
      expect(out.message).toContain('foo');
      expect(out.message).toContain('42');
      expect(out.raw).toBe(obj);
    });

    it('handles circular references with [Circular] markers (no throw)', () => {
      const cyc: { self?: unknown; name: string } = { name: 'looped' };

      cyc.self = cyc;
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(cyc);

      expect(out.errorCode).toBe('UNKNOWN-ERROR');
      expect(out.message).toContain('looped');
      expect(out.message).toContain('Circular');
    });

    it('extracts null gracefully (Unknown error fallback)', () => {
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(null);

      expect(out.errorCode).toBe('UNKNOWN-ERROR');
      expect(out.message).toBeTruthy();
    });
  });

  describe('source param', () => {

    it("defaults source to 'client' when omitted", () => {
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(new Error('x'));

      expect(out.source).toBe('client');
    });

    it('preserves an explicit source string', () => {
      const out: A_ErrorDetails_Interface = A_ErrorExtract_Util.extract(new Error('x'), 'my-component.method');

      expect(out.source).toBe('my-component.method');
    });
  });
});


