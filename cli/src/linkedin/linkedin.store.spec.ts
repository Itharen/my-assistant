import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createEmptyLinkedInCache } from './linkedin.models.js';
import {
  EnvironmentVariableSecretProvider,
  type FdpCommandRunner,
  FdpKeystoreSecretProvider,
} from './linkedin.secret-provider.js';
import { LinkedInStore } from './linkedin.store.js';

describe('LinkedIn local state and credential providers', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ma-linkedin-store-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('atomically persists and reloads a validated cache', async () => {
    const path: string = join(directory, 'cache.json');
    const store = new LinkedInStore(path);
    const cache = createEmptyLinkedInCache(new Date('2026-08-26T08:00:00.000Z'));
    cache.selfUrn = 'urn:li:person:self';

    await store.save(cache);
    const reloaded = await store.load();

    expect(reloaded.selfUrn).toBe('urn:li:person:self');
    expect(JSON.parse(await readFile(path, 'utf8')).schemaVersion).toBe('1.0.0');
  });

  it('fails closed when a cache-dependent read runs before bootstrap', async () => {
    const store = new LinkedInStore(join(directory, 'missing-cache.json'));

    await expectAsync(store.loadRequired()).toBeRejectedWithError(
      /LinkedIn inbox cache is not initialized/,
    );
  });

  it('purges only the cache file and reports whether it existed', async () => {
    const store = new LinkedInStore(join(directory, 'cache.json'));
    await store.save(createEmptyLinkedInCache());

    expect(await store.purge()).toBeTrue();
    expect(await store.purge()).toBeFalse();
  });

  it('extracts only the explicitly configured access-token key from FDP output', async () => {
    const runner: FdpCommandRunner = {
      run: async (): Promise<string> => 'UNRELATED=ignored\nLI_TOKEN="expected-token"\n',
    };
    const provider = new FdpKeystoreSecretProvider(runner);

    const token: string = await provider.getAccessToken({
      schemaVersion: '1.1.0',
      credentialSource: 'fdp-keystore',
      fdpProject: 'project',
      fdpBranch: 'master',
      fdpEnvironment: 'test',
      accessTokenKey: 'LI_TOKEN',
      selfIdentifiers: [],
    });

    expect(token).toBe('expected-token');
  });

  it('reads only the configured LinkedIn token from the injected environment', async () => {
    const provider = new EnvironmentVariableSecretProvider({
      LINKEDIN_MEMBER_ACCESS_TOKEN: 'expected-token',
      UNRELATED: 'ignored',
    });

    const token: string = await provider.getAccessToken({
      schemaVersion: '1.1.0',
      credentialSource: 'environment',
      accessTokenKey: 'LINKEDIN_MEMBER_ACCESS_TOKEN',
      fdpProject: null,
      fdpBranch: null,
      fdpEnvironment: null,
      selfIdentifiers: [],
    });

    expect(token).toBe('expected-token');
  });

  it('fails closed when the configured environment token is absent', async () => {
    const provider = new EnvironmentVariableSecretProvider({ UNRELATED: 'ignored' });

    await expectAsync(provider.getAccessToken({
      schemaVersion: '1.1.0',
      credentialSource: 'environment',
      accessTokenKey: 'LINKEDIN_MEMBER_ACCESS_TOKEN',
      fdpProject: null,
      fdpBranch: null,
      fdpEnvironment: null,
      selfIdentifiers: [],
    })).toBeRejected();
  });

  it('fails closed on corrupt cache instead of silently replacing it', async () => {
    const path: string = join(directory, 'cache.json');
    await writeFile(path, '{broken', 'utf8');
    const store = new LinkedInStore(path);

    await expectAsync(store.load()).toBeRejected();
    expect(await readFile(path, 'utf8')).toBe('{broken');
  });

  it('fails when the approved key is absent without exposing unrelated values', async () => {
    const provider = new FdpKeystoreSecretProvider({
      run: async (): Promise<string> => 'UNRELATED=do-not-expose\n',
    });

    await expectAsync(provider.getAccessToken({
      schemaVersion: '1.1.0',
      credentialSource: 'fdp-keystore',
      fdpProject: 'project',
      fdpBranch: 'master',
      fdpEnvironment: 'test',
      accessTokenKey: 'LI_TOKEN',
      selfIdentifiers: [],
    })).toBeRejected();
  });
});
