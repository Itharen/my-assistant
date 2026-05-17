import { fail, makeRequestId, ok, writeEnvelope, type Envelope } from './envelope.js';

describe('envelope', () => {
  describe('ok', () => {
    it('returns an EnvelopeOk with elapsedMs computed from startedAt', () => {
      const start = Date.now() - 50;
      const env = ok('test-action', 'req-1', start, { foo: 'bar' });
      expect(env.ok).toBe(true);
      expect(env.action).toBe('test-action');
      expect(env.requestId).toBe('req-1');
      expect(env.elapsedMs).toBeGreaterThanOrEqual(50);
      expect(env.result).toEqual({ foo: 'bar' });
    });
  });

  describe('fail', () => {
    it('returns an EnvelopeFail with error code and message', () => {
      const start = Date.now() - 10;
      const env = fail('test-action', 'req-2', start, 'E_BAD', 'something broke');
      expect(env.ok).toBe(false);
      expect(env.action).toBe('test-action');
      expect(env.requestId).toBe('req-2');
      expect(env.elapsedMs).toBeGreaterThanOrEqual(10);
      expect(env.error.code).toBe('E_BAD');
      expect(env.error.message).toBe('something broke');
    });

    it('preserves details when provided', () => {
      const env = fail('a', 'r', Date.now(), 'E_X', 'm', { hint: 'check this' });
      expect(env.error.details).toEqual({ hint: 'check this' });
    });
  });

  describe('makeRequestId', () => {
    it('produces a UUID-like string', () => {
      const id = makeRequestId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(20);
      // basic UUID v4 shape: 8-4-4-4-12 hex
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('produces distinct ids on each call', () => {
      const ids = new Set();
      for (let i = 0; i < 50; i++) ids.add(makeRequestId());
      expect(ids.size).toBe(50);
    });
  });

  // Cycle 118: writeEnvelope coverage — stdout-write contract.
  describe('writeEnvelope', () => {
    let writeSpy: jasmine.Spy<typeof process.stdout.write>;

    beforeEach(() => {
      writeSpy = spyOn(process.stdout, 'write').and.returnValue(true);
    });

    it('writes minified JSON + newline for pretty=false', () => {
      const env: Envelope = ok('a', 'r-1', Date.now(), { x: 1 });
      writeEnvelope(env, false);

      expect(writeSpy).toHaveBeenCalledTimes(1);
      const out = String(writeSpy.calls.mostRecent().args[0]);
      // Minified: no newlines inside the JSON body.
      expect(out.endsWith('\n')).toBe(true);
      const body = out.slice(0, -1);
      expect(body.includes('\n')).toBe(false);
      const parsed = JSON.parse(body) as { ok: boolean };
      expect(parsed.ok).toBe(true);
    });

    it('writes indented JSON (2-space) + newline for pretty=true', () => {
      const env: Envelope = ok('a', 'r-2', Date.now(), { x: 1 });
      writeEnvelope(env, true);

      const out = String(writeSpy.calls.mostRecent().args[0]);
      expect(out.endsWith('\n')).toBe(true);
      // Indented: at least one inner newline.
      expect(out.split('\n').length).toBeGreaterThan(2);
      expect(out).toContain('  "ok"');
    });

    it('round-trips a fail envelope through JSON parse', () => {
      const env: Envelope = fail('a', 'r-3', Date.now(), 'E_X', 'msg', { hint: 'y' });
      writeEnvelope(env, false);

      const out = String(writeSpy.calls.mostRecent().args[0]).trim();
      const parsed = JSON.parse(out) as Envelope;
      expect(parsed.ok).toBe(false);
      if (parsed.ok === false) {
        expect(parsed.error.code).toBe('E_X');
        expect(parsed.error.message).toBe('msg');
      }
    });
  });
});
