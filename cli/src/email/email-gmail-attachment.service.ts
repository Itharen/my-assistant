import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

import type {
  EmailAttachmentFetchOptions,
  EmailAttachmentFetchResult,
  EmailAttachmentMessageResult,
  EmailAttachmentResult,
} from './email-attachment.service.js';
import {
  collectGmailMessageParts,
  decodeGmailBase64Url,
  gmailApiRequest,
  gmailHeader,
  resolveGmailLabel,
  type GmailMessage,
  type GmailMessagePart,
} from './email-gmail-api.client.js';
import { buildGmailSearchQuery } from './email-gmail-reader.service.js';
import { describeEmailError, EmailToolError } from './email-error.js';
import { sanitizeEmailAttachmentFilename } from './email-attachment.service.js';

interface GmailMessageListResponse {
  messages?: Array<{ id: string }>;
}

/** Gmail API attachment discovery + opcionális, no-overwrite mentés. */
export async function fetchGmailAttachments(
  options: EmailAttachmentFetchOptions,
): Promise<EmailAttachmentFetchResult> {
  const filenameRegex: RegExp = compileFilenameRegex(options.filenamePattern);
  const saveRoot: string | undefined = options.saveTo ? validateSaveRoot(options.saveTo) : undefined;
  const maxBytes: number = options.maxAttachmentMb * 1024 * 1024;
  if (saveRoot) {
    try {
      await mkdir(saveRoot, { recursive: true });
    } catch (error: unknown) {
      throw new EmailToolError('MA-EMAIL-ATTACHMENT-DIRECTORY', 'Attachment target directory could not be created.', {
        cause: describeEmailError(error),
      });
    }
  }

  const label = await resolveGmailLabel(options.account, options.mailbox);
  const params: URLSearchParams = new URLSearchParams({ labelIds: label.id, maxResults: String(options.limit) });
  const query: string = buildGmailSearchQuery(options);
  if (query) params.set('q', query);
  const listed: GmailMessageListResponse = await gmailApiRequest<GmailMessageListResponse>(
    options.account,
    `/messages?${params.toString()}`,
  );
  const messages: EmailAttachmentMessageResult[] = [];

  for (const item of listed.messages ?? []) {
    const message: GmailMessage = await gmailApiRequest<GmailMessage>(
      options.account,
      `/messages/${encodeURIComponent(item.id)}?format=full`,
    );
    const parts: GmailMessagePart[] = collectGmailMessageParts(message.payload)
      .filter((part: GmailMessagePart): boolean => Boolean(part.filename) && filenameRegex.test(part.filename ?? ''));
    if (parts.length === 0) continue;

    const attachments: EmailAttachmentResult[] = [];
    for (const part of parts) {
      const filename: string = part.filename ?? 'attachment.bin';
      const sizeBytes: number = part.body?.size ?? 0;
      const base = {
        part: part.partId ?? '0',
        filename: filename,
        contentType: part.mimeType ?? 'application/octet-stream',
        sizeBytes: sizeBytes,
      };
      if (sizeBytes > maxBytes) {
        attachments.push({ ...base, savedAs: null, skippedReason: `attachment exceeds ${options.maxAttachmentMb} MB safety limit` });
        continue;
      }
      if (!saveRoot) {
        attachments.push({ ...base, savedAs: null, skippedReason: null });
        continue;
      }
      const body: Buffer = await downloadAttachment(options.account, item.id, part);
      if (body.length > maxBytes) {
        attachments.push({ ...base, savedAs: null, skippedReason: `attachment exceeds ${options.maxAttachmentMb} MB safety limit` });
        continue;
      }
      const safeId: string = item.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safePart: string = (part.partId ?? '0').replace(/[^0-9.]/g, '_');
      const target: string = resolve(saveRoot, `${safeId}-${safePart}-${sanitizeEmailAttachmentFilename(filename)}`);
      try {
        await writeFile(target, body, { flag: 'wx' });
        attachments.push({ ...base, savedAs: target, skippedReason: null });
      } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
          attachments.push({ ...base, savedAs: null, skippedReason: `target already exists: ${target}` });
          continue;
        }
        throw new EmailToolError('MA-EMAIL-ATTACHMENT-WRITE', 'Attachment write failed.', {
          cause: describeEmailError(error),
        });
      }
    }
    messages.push({
      uid: item.id,
      date: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : gmailHeader(message.payload, 'Date'),
      from: gmailHeader(message.payload, 'From'),
      subject: gmailHeader(message.payload, 'Subject'),
      attachments: attachments,
    });
  }

  return {
    account: options.account,
    mailbox: options.mailbox,
    candidateMessages: listed.messages?.length ?? 0,
    matchedMessages: messages.length,
    messages: messages,
  };
}

async function downloadAttachment(account: string, messageId: string, part: GmailMessagePart): Promise<Buffer> {
  if (part.body?.data) return decodeGmailBase64Url(part.body.data);
  if (!part.body?.attachmentId) {
    throw new EmailToolError('MA-EMAIL-GMAIL-ATTACHMENT-ID', 'Gmail attachment has no downloadable body ID.');
  }
  const result = await gmailApiRequest<{ data?: string }>(
    account,
    `/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(part.body.attachmentId)}`,
  );
  if (!result.data) {
    throw new EmailToolError('MA-EMAIL-GMAIL-ATTACHMENT-DATA', 'Gmail attachment response has no data.');
  }
  return decodeGmailBase64Url(result.data);
}

function compileFilenameRegex(pattern: string): RegExp {
  if (pattern.length > 200) {
    throw new EmailToolError('MA-EMAIL-FILENAME-PATTERN-LENGTH', '--filename-pattern is limited to 200 characters.');
  }
  try {
    return new RegExp(pattern, 'i');
  } catch (error: unknown) {
    throw new EmailToolError('MA-EMAIL-FILENAME-PATTERN', 'Invalid --filename-pattern regular expression.', {
      cause: describeEmailError(error),
    });
  }
}

function validateSaveRoot(path: string): string {
  if (!isAbsolute(path)) {
    throw new EmailToolError('MA-EMAIL-ATTACHMENT-PATH', '--save-to must be an absolute path.');
  }
  return resolve(path);
}
