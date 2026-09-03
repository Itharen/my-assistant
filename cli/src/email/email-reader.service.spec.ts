import { buildEmailSearchCriteria, parseEmailPositiveInteger } from './email-reader.service.js';

describe('email reader option handling', () => {
  it('uses an explicit ALL query when no filter is provided', () => {
    expect(buildEmailSearchCriteria({})).toEqual({ all: true });
  });

  it('composes date, address, subject and flag variants into one IMAP query', () => {
    const query = buildEmailSearchCriteria({
      since: '2026-08-01',
      before: '2026-09-01',
      from: 'sender.example',
      subject: 'invoice',
      flagged: true,
      unseen: true,
    });
    expect(query.since).toEqual(new Date('2026-08-01T00:00:00.000Z'));
    expect(query.before).toEqual(new Date('2026-09-01T00:00:00.000Z'));
    expect(query.from).toBe('sender.example');
    expect(query.subject).toBe('invoice');
    expect(query.flagged).toBe(true);
    expect(query.seen).toBe(false);
  });

  it('rejects malformed and impossible calendar dates', () => {
    expect(() => buildEmailSearchCriteria({ since: '2026/08/01' })).toThrowError(/YYYY-MM-DD/);
    expect(() => buildEmailSearchCriteria({ since: '2026-02-30' })).toThrowError(/valid calendar date/);
  });

  it('enforces positive bounded integer options', () => {
    expect(parseEmailPositiveInteger(undefined, 10, 100, '--limit')).toBe(10);
    expect(parseEmailPositiveInteger('100', 10, 100, '--limit')).toBe(100);
    expect(() => parseEmailPositiveInteger('0', 10, 100, '--limit')).toThrowError(/between 1 and 100/);
    expect(() => parseEmailPositiveInteger('101', 10, 100, '--limit')).toThrowError(/between 1 and 100/);
    expect(() => parseEmailPositiveInteger('1.5', 10, 100, '--limit')).toThrowError(/between 1 and 100/);
  });
});
