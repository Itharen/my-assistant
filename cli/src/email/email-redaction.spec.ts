import { redactEmailCommandArgs, redactEmailSensitiveText } from './email-redaction.js';

describe('email action-log redaction', () => {
  it('retains only option names and drops every option value', () => {
    const result = redactEmailCommandArgs([
      '--account', 'private_account',
      '--to=recipient@example.test',
      '--subject', 'Sensitive subject',
      '--body', 'Sensitive body',
      '--pretty',
    ]);
    expect(result).toEqual({
      redacted: true,
      flags: ['--account', '--body', '--pretty', '--subject', '--to'],
    });
    expect(JSON.stringify(result)).not.toContain('recipient@example.test');
    expect(JSON.stringify(result)).not.toContain('Sensitive');
    expect(JSON.stringify(result)).not.toContain('private_account');
  });

  it('redacts addresses and secret-like assignments from persisted error text', () => {
    const redacted: string = redactEmailSensitiveText(
      'auth for recipient@example.test failed; password=do-not-store token:abc123',
    );
    expect(redacted).toBe(
      'auth for <redacted-email> failed; password=<redacted-secret> token=<redacted-secret>',
    );
  });
});
