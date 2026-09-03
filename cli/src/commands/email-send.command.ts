import { parseArgs } from 'node:util';

import { logAction } from '../action-log/action-log.client.js';
import { EmailToolError } from '../email/email-error.js';
import { redactEmailSensitiveText } from '../email/email-redaction.js';
import { parseEmailPositiveInteger } from '../email/email-reader.service.js';
import { sendEmail, type EmailSendResult, type SendEmailOptions } from '../email/email-sender.service.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';
import { parseList } from '../utils/parse-args.helpers.js';

/** `ma email send` — ad-hoc SMTP send, dry-run és Sent append támogatással. */
export async function runEmailSendCommand(args: string[]): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const parsed = parseArgs({
    args: args,
    options: {
      account: { type: 'string', default: 'default' },
      'from-name': { type: 'string' },
      to: { type: 'string' },
      cc: { type: 'string' },
      bcc: { type: 'string' },
      subject: { type: 'string' },
      body: { type: 'string' },
      'body-file': { type: 'string' },
      attachments: { type: 'string' },
      'max-attachment-mb': { type: 'string', default: '50' },
      'dry-run': { type: 'boolean' },
      'no-save-to-sent': { type: 'boolean' },
      pretty: { type: 'boolean' },
    },
    strict: true,
    allowPositionals: false,
  });
  if (!parsed.values.subject) {
    throw new EmailToolError('MA-EMAIL-SUBJECT-MISSING', '--subject is required.');
  }
  const options: SendEmailOptions = {
    account: parsed.values.account,
    senderName: parsed.values['from-name'],
    to: parseList(parsed.values.to) ?? [],
    cc: parseList(parsed.values.cc) ?? [],
    bcc: parseList(parsed.values.bcc) ?? [],
    subject: parsed.values.subject,
    body: parsed.values.body,
    bodyFile: parsed.values['body-file'],
    attachments: parseList(parsed.values.attachments) ?? [],
    dryRun: Boolean(parsed.values['dry-run']),
    saveToSent: !parsed.values['no-save-to-sent'],
    maxAttachmentMb: parseEmailPositiveInteger(
      parsed.values['max-attachment-mb'],
      50,
      1000,
      '--max-attachment-mb',
    ),
  };
  const result: EmailSendResult = await sendEmail(options);
  if (result.sentCopy.status === 'failed') {
    await logAction({
      kind: 'error',
      summary: 'ma email send: Sent-copy append failed after SMTP success',
      extra: {
        code: 'MA-EMAIL-SENT-COPY-PARTIAL',
        reason: redactEmailSensitiveText(result.sentCopy.reason ?? 'unknown'),
      },
    });
  }
  writeEnvelope(ok('email.send', requestId, startedAt, result), Boolean(parsed.values.pretty));
}
