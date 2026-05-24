import { numericOption, onLogFor, parseList, stringOption } from './parse-args.helpers.js';

describe('parse-args.helpers', () => {
  describe('numericOption', () => {
    it('parses a numeric string', () => {
      expect(numericOption('42', 0)).toBe(42);
      expect(numericOption('3.14', 0)).toBeCloseTo(3.14);
    });

    it('returns fallback for non-string', () => {
      expect(numericOption(undefined, 100)).toBe(100);
      expect(numericOption(null, 100)).toBe(100);
      expect(numericOption(true, 100)).toBe(100);
    });

    it('returns fallback for non-finite values', () => {
      expect(numericOption('not-a-number', 50)).toBe(50);
      expect(numericOption('Infinity', 50)).toBe(50);
    });
  });

  describe('stringOption', () => {
    it('returns the string when non-empty', () => {
      expect(stringOption('hello')).toBe('hello');
    });

    it('returns undefined for empty / non-string', () => {
      expect(stringOption('')).toBeUndefined();
      expect(stringOption(undefined)).toBeUndefined();
      expect(stringOption(42)).toBeUndefined();
    });
  });

  describe('parseList', () => {
    it('returns undefined for nullish / empty input', () => {
      expect(parseList(undefined)).toBeUndefined();
      expect(parseList(null)).toBeUndefined();
      expect(parseList('')).toBeUndefined();
      expect(parseList([])).toBeUndefined();
    });

    it('splits a comma-separated string', () => {
      expect(parseList('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('trims whitespace', () => {
      expect(parseList(' a , b ,c')).toEqual(['a', 'b', 'c']);
    });

    it('flattens an array of comma-separated strings', () => {
      expect(parseList(['a,b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('drops empty entries', () => {
      expect(parseList('a,,b,')).toEqual(['a', 'b']);
    });
  });

  // Cycle 125: onLogFor coverage — verbose-gated stderr writer.
  describe('onLogFor', () => {
    it('returns undefined when verbose=false (silent mode)', () => {
      expect(onLogFor('any', false)).toBeUndefined();
    });

    it('returns a function when verbose=true', () => {
      const fn = onLogFor('cast', true);
      expect(typeof fn).toBe('function');
    });

    it('writes "[prefix] msg\\n" to stderr when the returned fn is called', () => {
      const writeSpy = spyOn(process.stderr, 'write').and.returnValue(true);
      const fn = onLogFor('cast', true)!;

      fn('hello world');

      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(String(writeSpy.calls.mostRecent().args[0])).toBe('[cast] hello world\n');
    });

    it('uses a distinct prefix per call (no shared closure)', () => {
      const writeSpy = spyOn(process.stderr, 'write').and.returnValue(true);
      const a = onLogFor('A', true)!;
      const b = onLogFor('B', true)!;

      a('x');
      b('y');

      const calls = writeSpy.calls.allArgs().map((args) => String(args[0]));
      expect(calls).toContain('[A] x\n');
      expect(calls).toContain('[B] y\n');
    });
  });
});
