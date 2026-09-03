import { mkdir, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, resolve } from 'node:path';
import type { DownloadObject, FetchMessageObject, ImapFlow, MessageStructureObject } from 'imapflow';

import { describeEmailError, EmailToolError } from './email-error.js';
import { isGmailEmailAccount } from './email-account.config.js';
import { fetchGmailAttachments } from './email-gmail-attachment.service.js';
import { withEmailImapClient } from './email-imap.client.js';
import {
  selectEmailUids,
  type EmailListOptions,
  type EmailSearchOptions,
} from './email-reader.service.js';

export interface EmailAttachmentFetchOptions extends EmailSearchOptions {
  account: string;
  mailbox: string;
  limit: number;
  filenamePattern: string;
  saveTo?: string;
  maxAttachmentMb: number;
}

export interface EmailAttachmentPart {
  part: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface EmailAttachmentResult extends EmailAttachmentPart {
  savedAs: string | null;
  skippedReason: string | null;
}

export interface EmailAttachmentMessageResult {
  uid: number | string;
  date: string | null;
  from: string | null;
  subject: string | null;
  attachments: EmailAttachmentResult[];
}

export interface EmailAttachmentFetchResult {
  account: string;
  mailbox: string;
  candidateMessages: number;
  matchedMessages: number;
  messages: EmailAttachmentMessageResult[];
}

/** BODYSTRUCTURE tree-ből a valódi, névvel rendelkező attachmentek kigyűjtése. */
export function collectEmailAttachmentParts(structure: MessageStructureObject | undefined): EmailAttachmentPart[] {
  if (!structure) {
    return [];
  }
  const parts: EmailAttachmentPart[] = [];
  const visit = (node: MessageStructureObject): void => {
    const filename: string | undefined = node.dispositionParameters?.filename ?? node.parameters?.name;
    const isAttachment: boolean = node.disposition?.toLowerCase() === 'attachment' || Boolean(filename);
    if (isAttachment && filename && node.part) {
      parts.push({
        part: node.part,
        filename: filename,
        contentType: node.type,
        sizeBytes: node.size ?? 0,
      });
    }
    for (const child of node.childNodes ?? []) {
      visit(child);
    }
  };
  visit(structure);
  return parts;
}

/** Fájlnévből minden path-szegmens és Windows-invalid karakter eltávolítása. */
export function sanitizeEmailAttachmentFilename(filename: string): string {
  const leaf: string = basename(filename).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
  return leaf.length > 0 ? leaf : 'attachment.bin';
}

/** Attachment discovery + opcionális, felülírásmentes mentés. */
export async function fetchEmailAttachments(options: EmailAttachmentFetchOptions): Promise<EmailAttachmentFetchResult> {
  if (isGmailEmailAccount(options.account)) {
    return fetchGmailAttachments(options);
  }
  const filenameRegex: RegExp = compileFilenameRegex(options.filenamePattern);
  const saveRoot: string | undefined = options.saveTo ? resolveAndValidateSaveRoot(options.saveTo) : undefined;
  const maxBytes: number = options.maxAttachmentMb * 1024 * 1024;
  if (saveRoot) {
    try {
      await mkdir(saveRoot, { recursive: true });
    } catch (error: unknown) {
      throw new EmailToolError('MA-EMAIL-ATTACHMENT-DIRECTORY', 'Attachment target directory could not be created.', {
        target: saveRoot,
        cause: describeEmailError(error),
      });
    }
  }

  return withEmailImapClient(options.account, async (client: ImapFlow) => {
    const lock = await client.getMailboxLock(options.mailbox, { readOnly: true });
    try {
      const listOptions: EmailListOptions = {
        account: options.account,
        mailbox: options.mailbox,
        limit: options.limit,
        since: options.since,
        before: options.before,
        from: options.from,
        subject: options.subject,
        flagged: options.flagged,
        unseen: options.unseen,
      };
      const uids: number[] = await selectEmailUids(client, listOptions, options.limit);
      const messages: EmailAttachmentMessageResult[] = [];

      for (const uid of uids) {
        const message: FetchMessageObject | false = await client.fetchOne(
          String(uid),
          { uid: true, envelope: true, internalDate: true, bodyStructure: true },
          { uid: true },
        );
        if (!message) {
          throw new EmailToolError('MA-EMAIL-ATTACHMENT-MESSAGE-MISSING', `Email UID ${uid} was not found.`, {
            mailbox: options.mailbox,
            uid: uid,
          });
        }
        const parts: EmailAttachmentPart[] = collectEmailAttachmentParts(message.bodyStructure)
          .filter((part: EmailAttachmentPart): boolean => filenameRegex.test(part.filename));
        if (parts.length === 0) {
          continue;
        }

        const attachments: EmailAttachmentResult[] = [];
        for (const part of parts) {
          attachments.push(await processAttachment(client, uid, part, saveRoot, maxBytes, options.maxAttachmentMb));
        }
        const from = message.envelope?.from?.[0];
        messages.push({
          uid: uid,
          date: message.internalDate ? new Date(message.internalDate).toISOString() : null,
          from: from?.address ? (from.name ? `${from.name} <${from.address}>` : from.address) : null,
          subject: message.envelope?.subject ?? null,
          attachments: attachments,
        });
      }

      return {
        account: options.account,
        mailbox: options.mailbox,
        candidateMessages: uids.length,
        matchedMessages: messages.length,
        messages: messages,
      };
    } finally {
      lock.release();
    }
  });
}

async function processAttachment(
  client: ImapFlow,
  uid: number,
  part: EmailAttachmentPart,
  saveRoot: string | undefined,
  maxBytes: number,
  maxMb: number,
): Promise<EmailAttachmentResult> {
  if (part.sizeBytes > maxBytes) {
    return { ...part, savedAs: null, skippedReason: `attachment exceeds ${maxMb} MB safety limit` };
  }
  if (!saveRoot) {
    return { ...part, savedAs: null, skippedReason: null };
  }

  const safeFilename: string = sanitizeEmailAttachmentFilename(part.filename);
  const safePart: string = part.part.replace(/[^0-9.]/g, '_');
  const target: string = resolve(saveRoot, `${uid}-${safePart}-${safeFilename}`);
  const download: DownloadObject = await client.download(String(uid), part.part, { uid: true, maxBytes: maxBytes + 1 });
  const chunks: Buffer[] = [];
  const content: AsyncIterable<Buffer | string> = download.content;
  for await (const chunk of content) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body: Buffer = Buffer.concat(chunks);
  if (body.length > maxBytes) {
    return { ...part, savedAs: null, skippedReason: `attachment exceeds ${maxMb} MB safety limit` };
  }

  try {
    await writeFile(target, body, { flag: 'wx' });
  } catch (error: unknown) {
    if (isFileAlreadyExistsError(error)) {
      return { ...part, savedAs: null, skippedReason: `target already exists: ${target}` };
    }
    throw new EmailToolError('MA-EMAIL-ATTACHMENT-WRITE', 'Attachment write failed.', {
      target: target,
      uid: uid,
      cause: describeEmailError(error),
    });
  }
  return { ...part, savedAs: target, skippedReason: null };
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

function resolveAndValidateSaveRoot(raw: string): string {
  if (!isAbsolute(raw)) {
    throw new EmailToolError('MA-EMAIL-ATTACHMENT-PATH', '--save-to must be an absolute path.');
  }
  return resolve(raw);
}

function isFileAlreadyExistsError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'EEXIST';
}
