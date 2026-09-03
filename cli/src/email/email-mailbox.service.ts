import { isGmailEmailAccount } from './email-account.config.js';
import { listGmailLabels, type GmailLabel } from './email-gmail-api.client.js';
import { listEmailMailboxes as listImapMailboxes } from './email-imap.client.js';

export interface EmailMailbox {
  path: string;
  specialUse: string | null;
  subscribed: boolean;
}

export async function listEmailMailboxes(account: string): Promise<EmailMailbox[]> {
  if (!isGmailEmailAccount(account)) {
    return listImapMailboxes(account);
  }
  const labels: GmailLabel[] = await listGmailLabels(account);
  return labels
    .map((label: GmailLabel): EmailMailbox => ({
      path: label.name,
      specialUse: gmailSpecialUse(label.id),
      subscribed: true,
    }))
    .sort((left: EmailMailbox, right: EmailMailbox): number => left.path.localeCompare(right.path));
}

function gmailSpecialUse(labelId: string): string | null {
  const mapping: Record<string, string> = {
    INBOX: '\\Inbox',
    SENT: '\\Sent',
    DRAFT: '\\Drafts',
    TRASH: '\\Trash',
    SPAM: '\\Junk',
    STARRED: '\\Flagged',
    ALL: '\\All',
  };
  return mapping[labelId] ?? null;
}
