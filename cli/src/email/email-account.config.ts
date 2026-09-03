import { EmailToolError } from './email-error.js';

export interface EmailImapConfig {
  account: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

export interface EmailSmtpConfig {
  account: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  senderName: string;
}

export type EmailProvider = 'imap-smtp' | 'gmail';

export interface EmailAccountIdentity {
  account: string;
  provider: EmailProvider;
  address: string;
  senderName: string;
}

export interface EmailGoogleOAuthConfig {
  clientId: string;
  clientSecret: string | undefined;
}

interface EmailAccountEnvKeys {
  provider: string;
  address: string;
  password: string;
  senderName: string;
}

const ACCOUNT_NAME_PATTERN: RegExp = /^[a-z][a-z0-9_]*$/;

/**
 * Account-név → env-kulcs mapping. Nincs beégetett fióklista és nincs fallback
 * másik postafiókra: minden név a saját, explicit env-kulcsait kapja.
 */
export function getEmailAccountEnvKeys(account: string): EmailAccountEnvKeys {
  if (!ACCOUNT_NAME_PATTERN.test(account)) {
    throw new EmailToolError(
      'MA-EMAIL-ACCOUNT-NAME',
      `Invalid email account name "${account}". Use lowercase letters, digits and underscores; start with a letter.`,
      { account: account },
    );
  }
  const suffix: string = account.toUpperCase();
  const prefix: string = `MY_ASSISTANT_EMAIL_ACCOUNT_${suffix}`;
  return {
    provider: `${prefix}_PROVIDER`,
    address: `${prefix}_ADDRESS`,
    password: `${prefix}_PASSWORD`,
    senderName: `${prefix}_SENDER_NAME`,
  };
}

/** Account identity + provider; Gmailnél nem kér jelszót. */
export function resolveEmailAccountIdentity(
  account: string = 'default',
  senderNameOverride?: string,
): EmailAccountIdentity {
  const keys: EmailAccountEnvKeys = getEmailAccountEnvKeys(account);
  const providerRaw: string = process.env[keys.provider] ?? 'imap-smtp';
  if (providerRaw !== 'imap-smtp' && providerRaw !== 'gmail') {
    throw new EmailToolError(
      'MA-EMAIL-PROVIDER',
      `${keys.provider} must be either "imap-smtp" or "gmail".`,
      { key: keys.provider },
    );
  }
  return {
    account: account,
    provider: providerRaw,
    address: requireEnv(keys.address),
    senderName: senderNameOverride ?? process.env[keys.senderName] ?? '',
  };
}

/** A My Assistant Gmail Desktop OAuth kliens konfigurációja. */
export function resolveEmailGoogleOAuthConfig(): EmailGoogleOAuthConfig {
  return {
    clientId: requireEnv('MY_ASSISTANT_EMAIL_GOOGLE_CLIENT_ID'),
    clientSecret: process.env.MY_ASSISTANT_EMAIL_GOOGLE_CLIENT_SECRET || undefined,
  };
}

export function isGmailEmailAccount(account: string = 'default'): boolean {
  return resolveEmailAccountIdentity(account).provider === 'gmail';
}

/** IMAP-konfiguráció feloldása kizárólag a My Assistant env-ből. */
export function resolveEmailImapConfig(account: string = 'default'): EmailImapConfig {
  const keys: EmailAccountEnvKeys = getEmailAccountEnvKeys(account);
  const identity: EmailAccountIdentity = resolveEmailAccountIdentity(account);
  if (identity.provider !== 'imap-smtp') {
    throw new EmailToolError('MA-EMAIL-PROVIDER-MISMATCH', 'IMAP password auth is disabled for Gmail accounts.');
  }
  const host: string = requireEnv('MY_ASSISTANT_EMAIL_IMAP_HOST');
  const port: number = parsePort(requireEnv('MY_ASSISTANT_EMAIL_IMAP_PORT'), 'MY_ASSISTANT_EMAIL_IMAP_PORT');
  return {
    account: account,
    host: host,
    port: port,
    secure: port === 993,
    user: identity.address,
    password: requireEnv(keys.password),
  };
}

/** SMTP-konfiguráció feloldása kizárólag a My Assistant env-ből. */
export function resolveEmailSmtpConfig(account: string = 'default', senderNameOverride?: string): EmailSmtpConfig {
  const keys: EmailAccountEnvKeys = getEmailAccountEnvKeys(account);
  const identity: EmailAccountIdentity = resolveEmailAccountIdentity(account, senderNameOverride);
  if (identity.provider !== 'imap-smtp') {
    throw new EmailToolError('MA-EMAIL-PROVIDER-MISMATCH', 'SMTP password auth is disabled for Gmail accounts.');
  }
  const host: string = requireEnv('MY_ASSISTANT_EMAIL_SMTP_HOST');
  const port: number = parsePort(requireEnv('MY_ASSISTANT_EMAIL_SMTP_PORT'), 'MY_ASSISTANT_EMAIL_SMTP_PORT');
  return {
    account: account,
    host: host,
    port: port,
    secure: port === 465,
    user: identity.address,
    password: requireEnv(keys.password),
    senderName: identity.senderName,
  };
}

function requireEnv(key: string): string {
  const value: string | undefined = process.env[key];
  if (!value) {
    throw new EmailToolError('MA-EMAIL-CONFIG-MISSING', `Missing required email configuration: ${key}`, { key: key });
  }
  return value;
}

function parsePort(raw: string, key: string): number {
  const port: number = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new EmailToolError('MA-EMAIL-CONFIG-PORT', `${key} must be an integer between 1 and 65535.`, {
      key: key,
    });
  }
  return port;
}
