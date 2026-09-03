import type { MessageStructureObject } from 'imapflow';

import {
  collectEmailAttachmentParts,
  sanitizeEmailAttachmentFilename,
} from './email-attachment.service.js';

describe('email attachment safety', () => {
  it('collects nested named attachments and ignores body-only nodes', () => {
    const structure: MessageStructureObject = {
      type: 'multipart/mixed',
      childNodes: [
        { part: '1', type: 'text/plain', size: 20 },
        {
          part: '2',
          type: 'application/pdf',
          size: 100,
          disposition: 'attachment',
          dispositionParameters: { filename: 'document.pdf' },
        },
        {
          part: '3',
          type: 'image/png',
          size: 200,
          parameters: { name: 'inline-name.png' },
        },
      ],
    };

    expect(collectEmailAttachmentParts(structure)).toEqual([
      { part: '2', filename: 'document.pdf', contentType: 'application/pdf', sizeBytes: 100 },
      { part: '3', filename: 'inline-name.png', contentType: 'image/png', sizeBytes: 200 },
    ]);
  });

  it('removes traversal and platform-invalid filename characters', () => {
    expect(sanitizeEmailAttachmentFilename('../../unsafe:name?.pdf')).toBe('unsafe_name_.pdf');
    expect(sanitizeEmailAttachmentFilename('')).toBe('attachment.bin');
  });
});
