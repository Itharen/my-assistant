import { createHash, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  resolveEmailAccountIdentity,
  resolveEmailGoogleOAuthConfig,
  type EmailGoogleOAuthConfig,
} from './email-account.config.js';
import { describeEmailError, EmailToolError } from './email-error.js';

export const GMAIL_OAUTH_SCOPES: readonly string[] = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

interface GoogleOAuthTokenFile {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  scope: string;
  token_type: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export interface EmailGoogleAuthResult {
  account: string;
  provider: 'gmail';
  address: string;
  scopes: string[];
  tokenPath: string;
}

export interface EmailGoogleAuthStatus {
  account: string;
  provider: 'gmail';
  address: string;
  clientConfigured: boolean;
  authenticated: boolean;
  scopes: string[];
  accessTokenExpiresAt: string | null;
  tokenPath: string;
}

/** Desktop-app PKCE + loopback OAuth flow, böngészős Google consenttel. */
export async function authorizeEmailGoogleAccount(account: string): Promise<EmailGoogleAuthResult> {
  const identity = resolveEmailAccountIdentity(account);
  if (identity.provider !== 'gmail') {
    throw new EmailToolError('MA-EMAIL-OAUTH-PROVIDER', 'OAuth auth is only available for Gmail accounts.');
  }
  const oauth: EmailGoogleOAuthConfig = resolveEmailGoogleOAuthConfig();
  const verifier: string = randomBytes(48).toString('base64url');
  const challenge: string = createHash('sha256').update(verifier).digest('base64url');
  const state: string = randomBytes(24).toString('base64url');
  const listener: OAuthCallbackListener = await createOAuthCallbackListener(state);

  const authorizationUrl: URL = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizationUrl.searchParams.set('client_id', oauth.clientId);
  authorizationUrl.searchParams.set('redirect_uri', listener.redirectUri);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', GMAIL_OAUTH_SCOPES.join(' '));
  authorizationUrl.searchParams.set('access_type', 'offline');
  authorizationUrl.searchParams.set('prompt', 'consent');
  authorizationUrl.searchParams.set('include_granted_scopes', 'true');
  authorizationUrl.searchParams.set('login_hint', identity.address);
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('code_challenge', challenge);
  authorizationUrl.searchParams.set('code_challenge_method', 'S256');

  process.stdout.write(`\nGoogle Gmail engedélyezés:\n${authorizationUrl.toString()}\n\n`);
  openSystemBrowser(authorizationUrl.toString());

  let code: string;
  try {
    code = await listener.code;
  } finally {
    listener.close();
  }

  const response: GoogleTokenResponse = await exchangeAuthorizationCode(
    oauth,
    code,
    verifier,
    listener.redirectUri,
  );
  if (!response.access_token || !response.refresh_token || !response.expires_in) {
    throw new EmailToolError(
      'MA-EMAIL-OAUTH-TOKEN',
      'Google did not return a complete access + refresh token set.',
      { reason: response.error ?? 'incomplete_response' },
    );
  }
  const scopes: string[] = (response.scope ?? '').split(/\s+/).filter(Boolean);
  const missingScopes: string[] = GMAIL_OAUTH_SCOPES.filter((scope: string): boolean => !scopes.includes(scope));
  if (missingScopes.length > 0) {
    throw new EmailToolError('MA-EMAIL-OAUTH-SCOPE', 'Not all required Gmail permissions were granted.', {
      missingScopes: missingScopes,
    });
  }

  const token: GoogleOAuthTokenFile = {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    expiry_date: Date.now() + response.expires_in * 1000,
    scope: scopes.join(' '),
    token_type: response.token_type ?? 'Bearer',
  };
  const tokenPath: string = emailGoogleTokenPath(account);
  await saveTokenFile(tokenPath, token);
  return { account: account, provider: 'gmail', address: identity.address, scopes: scopes, tokenPath: tokenPath };
}

/** Érvényes access token; lejáratkor a lokális refresh tokenből automatikusan frissít. */
export async function getEmailGoogleAccessToken(account: string): Promise<string> {
  const tokenPath: string = emailGoogleTokenPath(account);
  const token: GoogleOAuthTokenFile = await loadTokenFile(tokenPath);
  if (token.expiry_date > Date.now() + 60_000) {
    return token.access_token;
  }
  const oauth: EmailGoogleOAuthConfig = resolveEmailGoogleOAuthConfig();
  const body: URLSearchParams = new URLSearchParams({
    client_id: oauth.clientId,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  });
  if (oauth.clientSecret) {
    body.set('client_secret', oauth.clientSecret);
  }
  const response: GoogleTokenResponse = await tokenRequest(body, 'MA-EMAIL-OAUTH-REFRESH');
  if (!response.access_token || !response.expires_in) {
    throw new EmailToolError('MA-EMAIL-OAUTH-REFRESH', 'Google did not return a refreshed access token.');
  }
  const updated: GoogleOAuthTokenFile = {
    ...token,
    access_token: response.access_token,
    expiry_date: Date.now() + response.expires_in * 1000,
    scope: response.scope ?? token.scope,
    token_type: response.token_type ?? token.token_type,
  };
  await saveTokenFile(tokenPath, updated);
  return updated.access_token;
}

export async function getEmailGoogleAuthStatus(account: string): Promise<EmailGoogleAuthStatus> {
  const identity = resolveEmailAccountIdentity(account);
  if (identity.provider !== 'gmail') {
    throw new EmailToolError('MA-EMAIL-OAUTH-PROVIDER', 'OAuth status is only available for Gmail accounts.');
  }
  let clientConfigured: boolean = true;
  try {
    resolveEmailGoogleOAuthConfig();
  } catch {
    clientConfigured = false;
  }
  const tokenPath: string = emailGoogleTokenPath(account);
  try {
    const token: GoogleOAuthTokenFile = await loadTokenFile(tokenPath);
    return {
      account: account,
      provider: 'gmail',
      address: identity.address,
      clientConfigured: clientConfigured,
      authenticated: true,
      scopes: token.scope.split(/\s+/).filter(Boolean),
      accessTokenExpiresAt: new Date(token.expiry_date).toISOString(),
      tokenPath: tokenPath,
    };
  } catch (error: unknown) {
    if (!(error instanceof EmailToolError) || error.code !== 'MA-EMAIL-OAUTH-AUTH-REQUIRED') {
      throw error;
    }
    return {
      account: account,
      provider: 'gmail',
      address: identity.address,
      clientConfigured: clientConfigured,
      authenticated: false,
      scopes: [],
      accessTokenExpiresAt: null,
      tokenPath: tokenPath,
    };
  }
}

export function emailGoogleTokenPath(account: string): string {
  const safeAccount: string = account.replace(/[^a-z0-9_]/g, '_');
  return resolve(emailCliRoot(), 'config', 'email-oauth', `${safeAccount}.json`);
}

/**
 * A token nem kerülhet a build-output (`dist`) alá, mert azt egy új build
 * törölheti. Source és compiled futtatásból is a valódi `cli/` rootot keressük.
 */
function emailCliRoot(): string {
  let directory: string = dirname(fileURLToPath(import.meta.url));
  for (let depth: number = 0; depth < 8; depth += 1) {
    if (existsSync(resolve(directory, 'package.json')) && existsSync(resolve(directory, 'bin', 'ma.js'))) {
      return directory;
    }
    const parent: string = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new EmailToolError('MA-EMAIL-OAUTH-TOKEN-DIR', 'Stable CLI token directory could not be resolved.');
}

async function exchangeAuthorizationCode(
  oauth: EmailGoogleOAuthConfig,
  code: string,
  verifier: string,
  redirectUri: string,
): Promise<GoogleTokenResponse> {
  const body: URLSearchParams = new URLSearchParams({
    client_id: oauth.clientId,
    code: code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  if (oauth.clientSecret) {
    body.set('client_secret', oauth.clientSecret);
  }
  return tokenRequest(body, 'MA-EMAIL-OAUTH-TOKEN');
}

async function tokenRequest(body: URLSearchParams, errorCode: string): Promise<GoogleTokenResponse> {
  let response: Response;
  try {
    response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body,
    });
  } catch (error: unknown) {
    throw new EmailToolError(errorCode, 'Google OAuth token endpoint could not be reached.', {
      cause: describeEmailError(error),
    });
  }
  const payload: GoogleTokenResponse = await response.json() as GoogleTokenResponse;
  if (!response.ok) {
    throw new EmailToolError(errorCode, 'Google OAuth token request failed.', {
      status: response.status,
      reason: payload.error ?? 'unknown',
    });
  }
  return payload;
}

async function loadTokenFile(path: string): Promise<GoogleOAuthTokenFile> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));
    if (!isGoogleOAuthTokenFile(parsed)) {
      throw new Error('invalid token schema');
    }
    return parsed;
  } catch (error: unknown) {
    const errno: NodeJS.ErrnoException = error as NodeJS.ErrnoException;
    if (errno.code === 'ENOENT') {
      throw new EmailToolError('MA-EMAIL-OAUTH-AUTH-REQUIRED', 'Gmail OAuth authorization is required. Run `ma email auth`.');
    }
    throw new EmailToolError('MA-EMAIL-OAUTH-TOKEN-FILE', 'Gmail OAuth token file could not be read.', {
      cause: describeEmailError(error),
    });
  }
}

async function saveTokenFile(path: string, token: GoogleOAuthTokenFile): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(token, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

function isGoogleOAuthTokenFile(value: unknown): value is GoogleOAuthTokenFile {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<GoogleOAuthTokenFile>;
  return typeof item.access_token === 'string'
    && typeof item.refresh_token === 'string'
    && typeof item.expiry_date === 'number'
    && typeof item.scope === 'string'
    && typeof item.token_type === 'string';
}

interface OAuthCallbackListener {
  redirectUri: string;
  code: Promise<string>;
  close: () => void;
}

async function createOAuthCallbackListener(expectedState: string): Promise<OAuthCallbackListener> {
  let resolveCode: (code: string) => void;
  let rejectCode: (error: Error) => void;
  const code: Promise<string> = new Promise<string>((resolvePromise, rejectPromise) => {
    resolveCode = resolvePromise;
    rejectCode = rejectPromise;
  });
  const server: Server = createServer((request, response): void => {
    const url: URL = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (url.pathname !== '/oauth2/callback') {
      response.writeHead(404).end('Not found');
      return;
    }
    const error: string | null = url.searchParams.get('error');
    const state: string | null = url.searchParams.get('state');
    const authorizationCode: string | null = url.searchParams.get('code');
    if (error || state !== expectedState || !authorizationCode) {
      response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Authorization failed.');
      rejectCode(new EmailToolError('MA-EMAIL-OAUTH-CALLBACK', 'Google OAuth callback validation failed.', {
        reason: error ?? (state !== expectedState ? 'state_mismatch' : 'missing_code'),
      }));
      return;
    }
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      .end('<!doctype html><meta charset="utf-8"><title>My Assistant Gmail</title><h2>Gmail összekapcsolva.</h2><p>Visszatérhetsz a terminálhoz.</p>');
    resolveCode(authorizationCode);
  });
  await new Promise<void>((resolvePromise, rejectPromise): void => {
    server.once('error', rejectPromise);
    server.listen(0, '127.0.0.1', (): void => resolvePromise());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new EmailToolError('MA-EMAIL-OAUTH-LISTENER', 'OAuth callback listener did not receive a TCP port.');
  }
  const timeout = setTimeout((): void => {
    rejectCode(new EmailToolError('MA-EMAIL-OAUTH-TIMEOUT', 'Google OAuth authorization timed out after 5 minutes.'));
    server.close();
  }, 5 * 60_000);
  return {
    redirectUri: `http://127.0.0.1:${address.port}/oauth2/callback`,
    code: code.finally((): void => clearTimeout(timeout)),
    close: (): void => { server.close(); },
  };
}

function openSystemBrowser(url: string): void {
  try {
    const child = process.platform === 'win32'
      ? spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], { detached: true, stdio: 'ignore' })
      : process.platform === 'darwin'
        ? spawn('open', [url], { detached: true, stdio: 'ignore' })
        : spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
    child.unref();
  } catch {
    // A teljes URL mindig ki van írva; a kézi megnyitás működő fallback.
  }
}
