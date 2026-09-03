import { readFile, stat } from 'node:fs/promises';
import type { Stats } from 'node:fs';
import { basename, isAbsolute } from 'node:path';
import nodemailer from 'nodemailer';

import { isGmailEmailAccount, resolveEmailSmtpConfig, type EmailSmtpConfig } from './email-account.config.js';
import { sendGmailEmail } from './email-gmail-sender.service.js';
import { appendEmailToSent, type SentAppendResult } from './email-imap.client.js';
import { describeEmailError, EmailToolError } from './email-error.js';

export interface SendEmailOptions {
  account: string;
  senderName?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body?: string;
  bodyFile?: string;
  attachments: string[];
  dryRun: boolean;
  saveToSent: boolean;
  maxAttachmentMb?: number;
}

export interface EmailSendPreview {
  mode: 'dry-run' | 'send';
  account: string;
  smtp: { host: string; port: number; secure: boolean };
  envelope: {
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
  };
  bodyChars: number;
  attachments: Array<{ filename: string; path: string; sizeBytes: number }>;
  saveToSent: boolean;
}

export interface EmailSendResult {
  preview: EmailSendPreview;
  sent: boolean;
  messageId: string | null;
  accepted: string[];
  rejected: string[];
  sentCopy: SentAppendResult | { status: 'disabled' | 'failed'; reason?: string };
}

/** Ad-hoc levél validálása, preview-ja, SMTP send-je és opcionális Sent-appendje. */
export async function sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
  validateHeaderValue(options.subject, '--subject');
  if (options.to.length === 0) {
    throw new EmailToolError('MA-EMAIL-RECIPIENT-MISSING', '--to requires at least one recipient.');
  }
  for (const recipient of [...options.to, ...options.cc, ...options.bcc]) {
    validateHeaderValue(recipient, 'recipient');
  }

  if (isGmailEmailAccount(options.account)) {
    return sendGmailEmail(options);
  }

  const smtp: EmailSmtpConfig = resolveEmailSmtpConfig(options.account, options.senderName);
  validateHeaderValue(smtp.user, 'sender address');
  if (smtp.senderName) {
    validateHeaderValue(smtp.senderName, 'sender name');
  }
  const body: string = await resolveEmailBody(options.body, options.bodyFile);
  const attachments: Array<{ filename: string; path: string; sizeBytes: number }> = [];
  const maxAttachmentMb: number = options.maxAttachmentMb ?? 50;
  if (!Number.isInteger(maxAttachmentMb) || maxAttachmentMb < 1 || maxAttachmentMb > 1000) {
    throw new EmailToolError(
      'MA-EMAIL-ATTACHMENT-LIMIT',
      'maxAttachmentMb must be an integer between 1 and 1000.',
    );
  }
  const maxAttachmentBytes: number = maxAttachmentMb * 1024 * 1024;
  for (const path of options.attachments) {
    if (!isAbsolute(path)) {
      throw new EmailToolError('MA-EMAIL-ATTACHMENT-PATH', `Attachment path must be absolute: ${path}`);
    }
    let details: Stats;
    try {
      details = await stat(path);
    } catch (error: unknown) {
      throw new EmailToolError('MA-EMAIL-ATTACHMENT-STAT', `Attachment could not be inspected: ${path}`, {
        cause: describeEmailError(error),
      });
    }
    if (!details.isFile()) {
      throw new EmailToolError('MA-EMAIL-ATTACHMENT-NOT-FILE', `Attachment is not a file: ${path}`);
    }
    if (details.size > maxAttachmentBytes) {
      throw new EmailToolError(
        'MA-EMAIL-ATTACHMENT-TOO-LARGE',
        `Attachment exceeds the ${maxAttachmentMb} MB send limit: ${path}`,
      );
    }
    attachments.push({ filename: basename(path), path: path, sizeBytes: details.size });
  }

  const from: string = smtp.senderName ? `${smtp.senderName} <${smtp.user}>` : smtp.user;
  const preview: EmailSendPreview = {
    mode: options.dryRun ? 'dry-run' : 'send',
    account: options.account,
    smtp: { host: smtp.host, port: smtp.port, secure: smtp.secure },
    envelope: {
      from: from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
    },
    bodyChars: body.length,
    attachments: attachments,
    saveToSent: options.saveToSent,
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

  const mail: nodemailer.SendMailOptions = {
    from: from,
    to: options.to,
    cc: options.cc.length > 0 ? options.cc : undefined,
    bcc: options.bcc.length > 0 ? options.bcc : undefined,
    subject: options.subject,
    text: body,
    attachments: attachments.map((attachment: { filename: string; path: string }) => ({
      filename: attachment.filename,
      path: attachment.path,
    })),
  };
  const transporter: nodemailer.Transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.password },
  });
  let info: nodemailer.SentMessageInfo;
  try {
    info = await transporter.sendMail(mail);
  } catch (error: unknown) {
    throw new EmailToolError('MA-EMAIL-SMTP-SEND', 'SMTP send failed.', {
      account: options.account,
      host: smtp.host,
      port: smtp.port,
      cause: describeEmailError(error),
    });
  }

  let sentCopy: EmailSendResult['sentCopy'] = { status: 'disabled' };
  if (options.saveToSent) {
    try {
      const mimeTransporter: nodemailer.Transporter = nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
      });
      const mimeInfo: nodemailer.SentMessageInfo = await mimeTransporter.sendMail(mail);
      if (!Buffer.isBuffer(mimeInfo.message)) {
        throw new EmailToolError('MA-EMAIL-MIME-BUFFER', 'NodeMailer did not produce a MIME buffer for Sent append.');
      }
      sentCopy = await appendEmailToSent(options.account, mimeInfo.message);
    } catch (error: unknown) {
      const reason: string = error instanceof Error ? error.message : 'Unknown Sent append failure';
      sentCopy = { status: 'failed', reason: reason };
    }
  }

  return {
    preview: preview,
    sent: true,
    messageId: typeof info.messageId === 'string' ? info.messageId : null,
    accepted: normalizeAddressResult(info.accepted),
    rejected: normalizeAddressResult(info.rejected),
    sentCopy: sentCopy,
  };
}

export async function resolveEmailBody(body: string | undefined, bodyFile: string | undefined): Promise<string> {
  if (body !== undefined && bodyFile !== undefined) {
    throw new EmailToolError('MA-EMAIL-BODY-CONFLICT', 'Use either --body or --body-file, not both.');
  }
  if (bodyFile !== undefined) {
    if (!isAbsolute(bodyFile)) {
      throw new EmailToolError('MA-EMAIL-BODY-PATH', '--body-file must be an absolute path.');
    }
    try {
      return await readFile(bodyFile, 'utf8');
    } catch {
      throw new EmailToolError('MA-EMAIL-BODY-READ', `Body file could not be read: ${bodyFile}`);
    }
  }
  if (body !== undefined) {
    return body;
  }
  throw new EmailToolError('MA-EMAIL-BODY-MISSING', 'Use --body or --body-file.');
}

function validateHeaderValue(value: string, label: string): void {
  if (!value.trim()) {
    throw new EmailToolError('MA-EMAIL-HEADER-EMPTY', `${label} must not be empty.`);
  }
  if (/[\r\n]/.test(value)) {
    throw new EmailToolError('MA-EMAIL-HEADER-INJECTION', `${label} must not contain line breaks.`);
  }
}

function normalizeAddressResult(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item: unknown): string => String(item));
}
