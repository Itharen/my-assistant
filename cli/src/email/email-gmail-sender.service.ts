import { readFile, stat } from 'node:fs/promises';
import type { Stats } from 'node:fs';
import { basename, isAbsolute } from 'node:path';
import nodemailer from 'nodemailer';

import { resolveEmailAccountIdentity } from './email-account.config.js';
import { encodeGmailBase64Url, gmailApiRequest } from './email-gmail-api.client.js';
import { describeEmailError, EmailToolError } from './email-error.js';
import type { EmailSendResult, EmailSendPreview, SendEmailOptions } from './email-sender.service.js';

interface GmailSendResponse {
  id?: string;
  threadId?: string;
  labelIds?: string[];
}

/** Gmail API raw MIME send; a Gmail automatikusan a SENT label alá menti. */
export async function sendGmailEmail(options: SendEmailOptions): Promise<EmailSendResult> {
  const identity = resolveEmailAccountIdentity(options.account, options.senderName);
  validateHeader(identity.address, 'sender address');
  if (identity.senderName) validateHeader(identity.senderName, 'sender name');
  const body: string = await resolveBody(options.body, options.bodyFile);
  const maxMb: number = options.maxAttachmentMb ?? 50;
  if (!Number.isInteger(maxMb) || maxMb < 1 || maxMb > 1000) {
    throw new EmailToolError('MA-EMAIL-ATTACHMENT-LIMIT', 'maxAttachmentMb must be an integer between 1 and 1000.');
  }
  const attachments: Array<{ filename: string; path: string; sizeBytes: number }> = [];
  for (const path of options.attachments) {
    if (!isAbsolute(path)) {
      throw new EmailToolError('MA-EMAIL-ATTACHMENT-PATH', `Attachment path must be absolute: ${path}`);
    }
    let details: Stats;
    try {
      details = await stat(path);
    } catch (error: unknown) {
      throw new EmailToolError('MA-EMAIL-ATTACHMENT-STAT', 'Attachment could not be inspected.', {
        cause: describeEmailError(error),
      });
    }
    if (!details.isFile()) throw new EmailToolError('MA-EMAIL-ATTACHMENT-NOT-FILE', 'Attachment is not a file.');
    if (details.size > maxMb * 1024 * 1024) {
      throw new EmailToolError('MA-EMAIL-ATTACHMENT-TOO-LARGE', `Attachment exceeds the ${maxMb} MB send limit.`);
    }
    attachments.push({ filename: basename(path), path: path, sizeBytes: details.size });
  }

  const from: string = identity.senderName ? `${identity.senderName} <${identity.address}>` : identity.address;
  const preview: EmailSendPreview = {
    mode: options.dryRun ? 'dry-run' : 'send',
    account: options.account,
    smtp: { host: 'gmail.googleapis.com', port: 443, secure: true },
    envelope: {
      from: from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
    },
    bodyChars: body.length,
    attachments: attachments,
    saveToSent: true,
  };
  if (options.dryRun) {
    return {
      preview: preview,
      sent: false,
      messageId: null,
      accepted: [],
      rejected: [],
      sentCopy: { status: 'disabled' },
    };
  }
  if (!options.saveToSent) {
    throw new EmailToolError(
      'MA-EMAIL-GMAIL-SENT-MANDATORY',
      'Gmail API always stores sent messages; --no-save-to-sent is not supported for Gmail.',
    );
  }

  const mail: nodemailer.SendMailOptions = {
    from: from,
    to: options.to,
    cc: options.cc.length > 0 ? options.cc : undefined,
    bcc: options.bcc.length > 0 ? options.bcc : undefined,
    subject: options.subject,
    text: body,
    attachments: attachments.map((attachment) => ({ filename: attachment.filename, path: attachment.path })),
  };
  const mimeTransporter: nodemailer.Transporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
  });
  const mimeInfo: nodemailer.SentMessageInfo = await mimeTransporter.sendMail(mail);
  if (!Buffer.isBuffer(mimeInfo.message)) {
    throw new EmailToolError('MA-EMAIL-MIME-BUFFER', 'NodeMailer did not produce a MIME buffer for Gmail send.');
  }
  const sent: GmailSendResponse = await gmailApiRequest<GmailSendResponse>(options.account, '/messages/send', {
    method: 'POST',
    body: JSON.stringify({ raw: encodeGmailBase64Url(mimeInfo.message) }),
  });
  return {
    preview: preview,
    sent: true,
    messageId: sent.id ?? null,
    accepted: [...options.to, ...options.cc, ...options.bcc],
    rejected: [],
    sentCopy: { status: 'appended', mailbox: 'SENT', uid: null },
  };
}

async function resolveBody(body: string | undefined, bodyFile: string | undefined): Promise<string> {
  if (body !== undefined && bodyFile !== undefined) {
    throw new EmailToolError('MA-EMAIL-BODY-CONFLICT', 'Use either --body or --body-file, not both.');
  }
  if (bodyFile !== undefined) {
    if (!isAbsolute(bodyFile)) throw new EmailToolError('MA-EMAIL-BODY-PATH', '--body-file must be an absolute path.');
    try {
      return await readFile(bodyFile, 'utf8');
    } catch {
      throw new EmailToolError('MA-EMAIL-BODY-READ', 'Body file could not be read.');
    }
  }
  if (body !== undefined) return body;
  throw new EmailToolError('MA-EMAIL-BODY-MISSING', 'Use --body or --body-file.');
}

function validateHeader(value: string, label: string): void {
  if (!value.trim()) throw new EmailToolError('MA-EMAIL-HEADER-EMPTY', `${label} must not be empty.`);
  if (/[\r\n]/.test(value)) {
    throw new EmailToolError('MA-EMAIL-HEADER-INJECTION', `${label} must not contain line breaks.`);
  }
}
