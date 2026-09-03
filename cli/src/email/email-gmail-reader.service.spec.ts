import { buildGmailSearchQuery } from './email-gmail-reader.service.js';

describe('Gmail API email reader query', () => {
  it('maps the provider-neutral filters to one Gmail search query', () => {
    expect(buildGmailSearchQuery({
      since: '2026-08-01',
      before: '2026-08-12',
      from: 'person@example.com',
      subject: 'monthly report',
      flagged: true,
      unseen: true,
    })).toBe('after:2026/08/01 before:2026/08/12 from:"person@example.com" subject:"monthly report" is:starred is:unread');
  });

  it('rejects malformed and impossible dates before the API call', () => {
    expect(() => buildGmailSearchQuery({ since: '2026/08/01' })).toThrowError(/YYYY-MM-DD/);
    expect(() => buildGmailSearchQuery({ since: '2026-02-30' })).toThrowError(/valid calendar/);
  });

  it('sanitizes quotes in Gmail query values', () => {
    expect(buildGmailSearchQuery({ subject: 'a "quoted" value' })).toBe('subject:"a  quoted  value"');
  });
});
