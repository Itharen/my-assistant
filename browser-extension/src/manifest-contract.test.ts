import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

describe('My Assistant Chrome companion manifest boundary', (): void => {
  it('contains no LinkedIn host permission or LinkedIn content script', async (): Promise<void> => {
    const manifest = JSON.parse(await readFile(resolve(process.cwd(), 'manifest.json'), 'utf8')) as {
      permissions?: string[];
      host_permissions?: string[];
      content_scripts?: Array<{ matches?: string[] }>;
      key?: string;
    };
    assert.deepEqual(manifest.permissions, ['sidePanel', 'tabs']);
    assert.equal(typeof manifest.key, 'string');
    assert.ok((manifest.key?.length ?? 0) > 300);
    assert.equal(manifest.host_permissions?.some((value: string) => value.includes('linkedin.com')), false);
    assert.equal(manifest.content_scripts?.flatMap((script) => script.matches ?? [])
      .some((value: string) => value.includes('linkedin.com')), false);
  });
});
