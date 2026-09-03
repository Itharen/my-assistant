import { getEmailGoogleAccessToken } from './email-google-oauth.service.js';
import { EmailToolError } from './email-error.js';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface GmailLabel {
  id: string;
  name: string;
  type?: string;
  messagesTotal?: number;
  messagesUnread?: number;
}

export interface GmailMessagePartBody {
  attachmentId?: string;
  size?: number;
  data?: string;
}

export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: Array<{ name?: string; value?: string }>;
  body?: GmailMessagePartBody;
  parts?: GmailMessagePart[];
}

export interface GmailMessage {
  id: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
  sizeEstimate?: number;
  raw?: string;
}

export async function gmailApiRequest<T>(
  account: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken: string = await getEmailGoogleAccessToken(account);
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${GMAIL_API_BASE}${path}`, { ...init, headers: headers });
  } catch {
    throw new EmailToolError('MA-EMAIL-GMAIL-NETWORK', 'Gmail API could not be reached.');
  }
  if (!response.ok) {
    let reason = 'unknown';
    try {
      const payload = await response.json() as { error?: { status?: string; message?: string } };
      reason = payload.error?.status ?? 'api_error';
    } catch {
      reason = 'invalid_error_response';
    }
    throw new EmailToolError('MA-EMAIL-GMAIL-API', 'Gmail API request failed.', {
      status: response.status,
      reason: reason,
    });
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export async function listGmailLabels(account: string): Promise<GmailLabel[]> {
  const result = await gmailApiRequest<{ labels?: GmailLabel[] }>(account, '/labels');
  return result.labels ?? [];
}

export async function resolveGmailLabel(account: string, mailbox: string): Promise<GmailLabel> {
  const labels: GmailLabel[] = await listGmailLabels(account);
  const normalized: string = mailbox.toLocaleLowerCase();
  const label: GmailLabel | undefined = labels.find((item: GmailLabel): boolean =>
    item.id.toLocaleLowerCase() === normalized || item.name.toLocaleLowerCase() === normalized,
  );
  if (!label) {
    throw new EmailToolError('MA-EMAIL-GMAIL-LABEL', `Gmail label/mailbox was not found: ${mailbox}`);
  }
  return label;
}

export function decodeGmailBase64Url(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

export function encodeGmailBase64Url(value: Buffer): string {
  return value.toString('base64url');
}

export function gmailHeader(part: GmailMessagePart | undefined, name: string): string | null {
  const header = part?.headers?.find((item): boolean => item.name?.toLocaleLowerCase() === name.toLocaleLowerCase());
  return header?.value ?? null;
}

export function collectGmailMessageParts(part: GmailMessagePart | undefined): GmailMessagePart[] {
  if (!part) return [];
  return [part, ...(part.parts ?? []).flatMap(collectGmailMessageParts)];
}
