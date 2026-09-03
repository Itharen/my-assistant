import {
  getEmailAccountEnvKeys,
  resolveEmailImapConfig,
  resolveEmailAccountIdentity,
  resolveEmailGoogleOAuthConfig,
  resolveEmailSmtpConfig,
} from './email-account.config.js';
import { EmailToolError } from './email-error.js';

describe('email account configuration', () => {
  const keys: string[] = [
    'MY_ASSISTANT_EMAIL_IMAP_HOST',
    'MY_ASSISTANT_EMAIL_IMAP_PORT',
    'MY_ASSISTANT_EMAIL_SMTP_HOST',
    'MY_ASSISTANT_EMAIL_SMTP_PORT',
    'MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_ADDRESS',
    'MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_PROVIDER',
    'MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_PASSWORD',
    'MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_SENDER_NAME',
    'MY_ASSISTANT_EMAIL_ACCOUNT_SECONDARY_ADDRESS',
    'MY_ASSISTANT_EMAIL_ACCOUNT_SECONDARY_PROVIDER',
    'MY_ASSISTANT_EMAIL_ACCOUNT_SECONDARY_PASSWORD',
    'MY_ASSISTANT_EMAIL_GOOGLE_CLIENT_ID',
    'MY_ASSISTANT_EMAIL_GOOGLE_CLIENT_SECRET',
  ];
  let previous: Record<string, string | undefined>;

  beforeEach(() => {
    previous = Object.fromEntries(keys.map((key: string): [string, string | undefined] => [key, process.env[key]]));
    for (const key of keys) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of keys) {
      const value: string | undefined = previous[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('maps each account to isolated env keys without a hard-coded registry', () => {
    expect(getEmailAccountEnvKeys('secondary')).toEqual({
      provider: 'MY_ASSISTANT_EMAIL_ACCOUNT_SECONDARY_PROVIDER',
      address: 'MY_ASSISTANT_EMAIL_ACCOUNT_SECONDARY_ADDRESS',
      password: 'MY_ASSISTANT_EMAIL_ACCOUNT_SECONDARY_PASSWORD',
      senderName: 'MY_ASSISTANT_EMAIL_ACCOUNT_SECONDARY_SENDER_NAME',
    });
  });

  it('rejects account names that could create ambiguous env keys', () => {
    expect(() => getEmailAccountEnvKeys('../other')).toThrowError(EmailToolError);
    expect(() => getEmailAccountEnvKeys('UPPER')).toThrowError(EmailToolError);
  });

  it('resolves IMAP and SMTP config for the requested account only', () => {
    process.env.MY_ASSISTANT_EMAIL_IMAP_HOST = 'imap.example.test';
    process.env.MY_ASSISTANT_EMAIL_IMAP_PORT = '993';
    process.env.MY_ASSISTANT_EMAIL_SMTP_HOST = 'smtp.example.test';
    process.env.MY_ASSISTANT_EMAIL_SMTP_PORT = '465';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_SECONDARY_ADDRESS = 'secondary@example.test';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_SECONDARY_PASSWORD = 'test-password';

    expect(resolveEmailImapConfig('secondary')).toEqual(jasmine.objectContaining({
      account: 'secondary',
      host: 'imap.example.test',
      port: 993,
      secure: true,
      user: 'secondary@example.test',
    }));
    expect(resolveEmailSmtpConfig('secondary', 'Test Sender')).toEqual(jasmine.objectContaining({
      account: 'secondary',
      host: 'smtp.example.test',
      port: 465,
      secure: true,
      senderName: 'Test Sender',
    }));
  });

  it('never falls back to the default account when a named account is missing', () => {
    process.env.MY_ASSISTANT_EMAIL_IMAP_HOST = 'imap.example.test';
    process.env.MY_ASSISTANT_EMAIL_IMAP_PORT = '993';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_ADDRESS = 'default@example.test';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_PASSWORD = 'default-password';

    expect(() => resolveEmailImapConfig('secondary')).toThrowError(/SECONDARY_ADDRESS/);
  });

  it('rejects invalid ports before any network action', () => {
    process.env.MY_ASSISTANT_EMAIL_IMAP_HOST = 'imap.example.test';
    process.env.MY_ASSISTANT_EMAIL_IMAP_PORT = '70000';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_ADDRESS = 'default@example.test';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_PASSWORD = 'default-password';

    expect(() => resolveEmailImapConfig()).toThrowError(/between 1 and 65535/);
  });

  it('resolves Gmail identity without requiring any mailbox password', () => {
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_PROVIDER = 'gmail';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_ADDRESS = 'assistant@gmail.test';
    process.env.MY_ASSISTANT_EMAIL_ACCOUNT_DEFAULT_SENDER_NAME = 'My Assistant';

    expect(resolveEmailAccountIdentity()).toEqual({
      account: 'default',
      provider: 'gmail',
      address: 'assistant@gmail.test',
      senderName: 'My Assistant',
    });
    expect(() => resolveEmailImapConfig()).toThrowError(/disabled for Gmail/);
  });

  it('requires an OAuth client ID and treats desktop client secret as optional', () => {
    process.env.MY_ASSISTANT_EMAIL_GOOGLE_CLIENT_ID = 'desktop-client-id';

    expect(resolveEmailGoogleOAuthConfig()).toEqual({
      clientId: 'desktop-client-id',
      clientSecret: undefined,
    });
  });
});
