import { normalizeSnapshotRows } from './linkedin.normalizer.js';

describe('LinkedIn snapshot normalizer', () => {
  it('normalizes the live uppercase INBOX export schema and resolves direction by profile URL', () => {
    const selfProfileUrl: string = 'https://www.linkedin.com/in/owner';
    const messages = normalizeSnapshotRows([
      {
        ATTACHMENTS: '',
        CONTENT: 'Inbound text',
        'CONVERSATION ID': 'conversation-1',
        'CONVERSATION TITLE': 'Example conversation',
        DATE: '2026-08-20 10:30:00 UTC',
        FOLDER: 'INBOX',
        FROM: 'Other Member',
        'RECIPIENT PROFILE URLS': selfProfileUrl,
        'SENDER PROFILE URL': 'https://www.linkedin.com/in/other',
        SUBJECT: '',
        TO: 'Owner',
      },
      {
        ATTACHMENTS: '',
        CONTENT: 'Outbound text',
        'CONVERSATION ID': 'conversation-1',
        'CONVERSATION TITLE': 'Example conversation',
        DATE: '2026-08-20 11:30:00 UTC',
        FOLDER: 'SENT',
        FROM: 'Owner',
        'RECIPIENT PROFILE URLS': 'https://www.linkedin.com/in/other',
        'SENDER PROFILE URL': selfProfileUrl,
        SUBJECT: '',
        TO: 'Other Member',
      },
    ], new Set<string>([selfProfileUrl, 'Owner']));

    expect(messages.length).toBe(2);
    expect(messages[0]?.threadId).toBe('conversation-1');
    expect(messages[0]?.authorId).toBe('https://www.linkedin.com/in/other');
    expect(messages[0]?.direction).toBe('inbound');
    expect(messages[0]?.content).toBe('Inbound text');
    expect(messages[0]?.createdAt).toBe(Date.parse('2026-08-20 10:30:00 UTC'));
    expect(messages[1]?.direction).toBe('outbound');
  });
});
