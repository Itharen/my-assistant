import { fail, makeRequestId, ok } from './envelope.js';

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
});
