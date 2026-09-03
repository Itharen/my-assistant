import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runLinkedInCommand } from './linkedin.command.js';
import { LinkedInApiClient } from '../linkedin/linkedin.api-client.js';
import { saveLinkedInConfig, type LinkedInPaths } from '../linkedin/linkedin.config.js';
import { LINKEDIN_CONFIG_SCHEMA_VERSION, type LinkedInConfig } from '../linkedin/linkedin.models.js';
import { type LinkedInSecretProvider } from '../linkedin/linkedin.secret-provider.js';

describe('linkedin command', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ma-linkedin-command-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('reports an absent cache as not initialized after a successful live doctor probe', async () => {
    const paths: LinkedInPaths = {
      root: directory,
      config: join(directory, 'config.json'),
      cache: join(directory, 'cache.json'),
    };
    const config: LinkedInConfig = {
      schemaVersion: LINKEDIN_CONFIG_SCHEMA_VERSION,
      credentialSource: 'environment',
      accessTokenKey: 'LINKEDIN_MEMBER_ACCESS_TOKEN',
      fdpProject: null,
      fdpBranch: null,
      fdpEnvironment: null,
      selfIdentifiers: [],
    };
    await saveLinkedInConfig(paths.config, config);
    const api = new LinkedInApiClient({
      fetch: async (): Promise<Response> => new Response(JSON.stringify({
        elements: [{
          memberComplianceAuthorizationKey: {
            developerApplication: 'urn:li:developerApplication:app',
            member: 'urn:li:person:self',
          },
          memberComplianceScopes: ['DMA'],
          regulatedAt: 100,
        }],
      }), { status: 200, headers: { 'content-type': 'application/json' } }),
      sleep: async (): Promise<void> => undefined,
    });
    const secrets: LinkedInSecretProvider = {
      getAccessToken: async (): Promise<string> => 'not-logged-token',
    };
    let stdout: string = '';
    spyOn(process.stdout, 'write').and.callFake((chunk: string | Uint8Array): boolean => {
      stdout += String(chunk);
      return true;
    });

    await runLinkedInCommand('doctor', [], { paths: paths, api: api, secrets: secrets });

    const result: Record<string, unknown> = JSON.parse(stdout).result;
    expect(result.cachePresent).toBeFalse();
    expect(result.cacheSchema).toBeNull();
    expect(result.cacheUpdatedAt).toBeNull();
    expect(result.unreadSemantics).toBe('not-initialized');
    expect(stdout).not.toContain('not-logged-token');
    expect(stdout).not.toContain('urn:li:person:self');
  });
});
