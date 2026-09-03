import { decodeGmailBase64Url, encodeGmailBase64Url } from './email-gmail-api.client.js';

describe('Gmail API base64url MIME helpers', () => {
  it('round-trips arbitrary MIME bytes without standard base64 padding', () => {
    const original: Buffer = Buffer.from('Subject: árvíztűrő\r\n\r\nbody', 'utf8');
    const encoded: string = encodeGmailBase64Url(original);

    expect(encoded).not.toContain('=');
    expect(decodeGmailBase64Url(encoded)).toEqual(original);
  });
});
