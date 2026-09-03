import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { LinkedInApiClient } from '../linkedin/linkedin.api-client.js';
import {
  createDraft,
  deleteDraft,
  getDraft,
  getThread,
  summarizeInbox,
  type LinkedInInboxFilter,
} from '../linkedin/linkedin.analyzer.js';
import {
  loadLinkedInConfig,
  pathExists,
  resolveLinkedInPaths,
  saveLinkedInConfig,
  type LinkedInPaths,
} from '../linkedin/linkedin.config.js';
import { LinkedInToolError } from '../linkedin/linkedin.error.js';
import {
  LINKEDIN_CONFIG_SCHEMA_VERSION,
  type LinkedInConfig,
  type LinkedInDraft,
} from '../linkedin/linkedin.models.js';
import {
  EnvironmentVariableSecretProvider,
  FdpKeystoreSecretProvider,
  type LinkedInSecretProvider,
} from '../linkedin/linkedin.secret-provider.js';
import { LinkedInStore } from '../linkedin/linkedin.store.js';
import { LinkedInSyncService } from '../linkedin/linkedin.sync-service.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

export interface LinkedInCommandDependencies {
  paths?: LinkedInPaths;
  api?: LinkedInApiClient;
  secrets?: LinkedInSecretProvider;
  stdin?: NodeJS.ReadableStream;
}

export async function runLinkedInCommand(
  command: string,
  args: string[],
  dependencies: LinkedInCommandDependencies = {},
): Promise<void> {
  if (command === 'configure') {
    await runConfigure(args, dependencies);
    return;
  }
  if (command === 'auth') {
    await runAuth(args, dependencies);
    return;
  }
  if (command === 'doctor') {
    await runDoctor(args, dependencies);
    return;
  }
  if (command === 'inbox') {
    await runInbox(args, dependencies);
    return;
  }
  if (command === 'thread') {
    await runThread(args, dependencies);
    return;
  }
  if (command === 'reply') {
    await runReply(args, dependencies);
    return;
  }
  if (command === 'cache') {
    await runCache(args, dependencies);
    return;
  }
  throw new LinkedInToolError('MA-LINKEDIN-COMMAND', `Unknown LinkedIn command: ${command}.`);
}

async function runConfigure(args: string[], dependencies: LinkedInCommandDependencies): Promise<void> {
  const invocation = startInvocation('linkedin.configure');
  const parsed = parseArgs({
    args: args,
    options: {
      'credential-source': { type: 'string', default: 'environment' },
      'fdp-project': { type: 'string' },
      'fdp-branch': { type: 'string', default: 'master' },
      'fdp-environment': { type: 'string' },
      'access-token-key': { type: 'string', default: 'LINKEDIN_MEMBER_ACCESS_TOKEN' },
      'self-id': { type: 'string', multiple: true, default: [] },
      pretty: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  const credentialSource: 'environment' | 'fdp-keystore' = requireCredentialSource(
    parsed.values['credential-source'],
  );
  const config: LinkedInConfig = {
    schemaVersion: LINKEDIN_CONFIG_SCHEMA_VERSION,
    credentialSource: credentialSource,
    accessTokenKey: requireOption(parsed.values['access-token-key'], '--access-token-key'),
    fdpProject: credentialSource === 'fdp-keystore'
      ? requireOption(parsed.values['fdp-project'], '--fdp-project')
      : null,
    fdpBranch: credentialSource === 'fdp-keystore'
      ? requireOption(parsed.values['fdp-branch'], '--fdp-branch')
      : null,
    fdpEnvironment: credentialSource === 'fdp-keystore'
      ? requireFdpEnvironment(parsed.values['fdp-environment'])
      : null,
    selfIdentifiers: normalizeStringList(parsed.values['self-id']),
  };
  const paths: LinkedInPaths = dependencies.paths ?? resolveLinkedInPaths();
  await saveLinkedInConfig(paths.config, config);
  writeEnvelope(ok(invocation.action, invocation.requestId, invocation.startedAt, {
    configured: true,
    configPath: paths.config,
    credentialSource: config.credentialSource,
    secretStorage: describeSecretStorage(config),
    accessTokenKey: config.accessTokenKey,
    selfIdentifiers: config.selfIdentifiers,
  }), parsed.values.pretty === true);
}

async function runAuth(args: string[], dependencies: LinkedInCommandDependencies): Promise<void> {
  const action: string | undefined = args[0];
  if (action !== 'status') {
    throw new LinkedInToolError('MA-LINKEDIN-COMMAND', 'Usage: ma linkedin auth status [--pretty].');
  }
  const invocation = startInvocation('linkedin.auth.status');
  const parsed = parseArgs({
    args: args.slice(1),
    options: { pretty: { type: 'boolean', default: false } },
    strict: true,
    allowPositionals: false,
  });
  const paths: LinkedInPaths = dependencies.paths ?? resolveLinkedInPaths();
  const configPresent: boolean = await pathExists(paths.config);
  const cachePresent: boolean = await pathExists(paths.cache);
  const config: LinkedInConfig | null = configPresent ? await loadLinkedInConfig(paths.config) : null;
  writeEnvelope(ok(invocation.action, invocation.requestId, invocation.startedAt, {
    configured: configPresent,
    cachePresent: cachePresent,
    configPath: paths.config,
    cachePath: paths.cache,
    credentialSource: config?.credentialSource ?? null,
    accessTokenKey: config?.accessTokenKey ?? null,
    tokenStorage: config === null ? null : describeSecretStorage(config),
    tokenRead: false,
  }), parsed.values.pretty === true);
}

async function runDoctor(args: string[], dependencies: LinkedInCommandDependencies): Promise<void> {
  const invocation = startInvocation('linkedin.doctor');
  const parsed = parseArgs({
    args: args,
    options: { pretty: { type: 'boolean', default: false } },
    strict: true,
    allowPositionals: false,
  });
  const context = await createContext(dependencies);
  const token: string = await context.secrets.getAccessToken(context.config);
  const authorization = await context.api.getAuthorization(token);
  const cachePresent: boolean = await pathExists(context.paths.cache);
  const cache = cachePresent ? await context.store.loadRequired() : null;
  writeEnvelope(ok(invocation.action, invocation.requestId, invocation.startedAt, {
    config: 'ok',
    credential: 'ok',
    linkedInAuthorization: 'ok',
    memberIdentityAvailable: authorization.memberUrn.length > 0,
    consentAtMs: authorization.consentAtMs,
    cachePresent: cachePresent,
    cacheSchema: cache?.schemaVersion ?? null,
    cacheUpdatedAt: cache?.updatedAt ?? null,
    unreadSemantics: cache === null
      ? 'not-initialized'
      : cache.calibration.unreadReliable ? 'authoritative' : 'candidate',
  }), parsed.values.pretty === true);
}

async function runInbox(args: string[], dependencies: LinkedInCommandDependencies): Promise<void> {
  const action: string | undefined = args[0];
  if (action === 'bootstrap' || action === 'sync') {
    const invocation = startInvocation(`linkedin.inbox.${action}`);
    const parsed = parseArgs({
      args: args.slice(1),
      options: {
        'dry-run': { type: 'boolean', default: false },
        pretty: { type: 'boolean', default: false },
      },
      strict: true,
      allowPositionals: false,
    });
    const context = await createContext(dependencies);
    const service = new LinkedInSyncService(context.api, context.secrets, context.store, context.config);
    const write: boolean = parsed.values['dry-run'] !== true;
    const result = action === 'bootstrap' ? await service.bootstrap(write) : await service.sync(write);
    writeEnvelope(ok(invocation.action, invocation.requestId, invocation.startedAt, result), parsed.values.pretty === true);
    return;
  }
  if (action === 'list' || action === 'unread' || action === 'needs-reply') {
    await runInboxList(action, args.slice(1), dependencies);
    return;
  }
  throw new LinkedInToolError(
    'MA-LINKEDIN-COMMAND',
    'Usage: ma linkedin inbox {bootstrap|sync|list|unread|needs-reply}.',
  );
}

async function runInboxList(
  action: 'list' | 'unread' | 'needs-reply',
  args: string[],
  dependencies: LinkedInCommandDependencies,
): Promise<void> {
  const invocation = startInvocation(`linkedin.inbox.${action}`);
  const parsed = parseArgs({
    args: args,
    options: {
      offset: { type: 'string', default: '0' },
      limit: { type: 'string', default: '20' },
      pretty: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  const store: LinkedInStore = createLocalStore(dependencies);
  const cache = await store.loadRequired();
  const filter: LinkedInInboxFilter = action === 'list' ? 'all' : action;
  const result = summarizeInbox(
    cache,
    filter,
    parseInteger(parsed.values.offset, '--offset'),
    parseInteger(parsed.values.limit, '--limit'),
  );
  writeEnvelope(ok(invocation.action, invocation.requestId, invocation.startedAt, result), parsed.values.pretty === true);
}

async function runThread(args: string[], dependencies: LinkedInCommandDependencies): Promise<void> {
  const action: string | undefined = args[0];
  if (action !== 'show') {
    throw new LinkedInToolError('MA-LINKEDIN-COMMAND', 'Usage: ma linkedin thread show --id <thread-id>.');
  }
  const invocation = startInvocation('linkedin.thread.show');
  const parsed = parseArgs({
    args: args.slice(1),
    options: {
      id: { type: 'string' },
      pretty: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  const threadId: string = requireOption(parsed.values.id, '--id');
  const store: LinkedInStore = createLocalStore(dependencies);
  const messages = getThread(await store.loadRequired(), threadId);
  writeEnvelope(ok(invocation.action, invocation.requestId, invocation.startedAt, {
    threadId: threadId,
    messages: messages,
  }), parsed.values.pretty === true);
}

async function runReply(args: string[], dependencies: LinkedInCommandDependencies): Promise<void> {
  const action: string | undefined = args[0];
  if (action === 'draft') {
    await runReplyDraft(args.slice(1), dependencies);
    return;
  }
  if (action === 'list') {
    await runReplyList(args.slice(1), dependencies);
    return;
  }
  if (action === 'show') {
    await runReplyShow(args.slice(1), dependencies);
    return;
  }
  if (action === 'delete') {
    await runReplyDelete(args.slice(1), dependencies);
    return;
  }
  throw new LinkedInToolError('MA-LINKEDIN-COMMAND', 'Usage: ma linkedin reply {draft|list|show|delete}.');
}

async function runReplyDraft(args: string[], dependencies: LinkedInCommandDependencies): Promise<void> {
  const invocation = startInvocation('linkedin.reply.draft');
  const parsed = parseArgs({
    args: args,
    options: {
      thread: { type: 'string' },
      'body-file': { type: 'string' },
      stdin: { type: 'boolean', default: false },
      pretty: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  const bodyFile: string | undefined = parsed.values['body-file'];
  const readStdin: boolean = parsed.values.stdin === true;
  if ((bodyFile === undefined) === !readStdin) {
    throw new LinkedInToolError(
      'MA-LINKEDIN-DRAFT-INPUT',
      'Choose exactly one draft input: --body-file <absolute-path> or --stdin.',
    );
  }
  const body: string = readStdin
    ? await readAll(dependencies.stdin ?? process.stdin)
    : await readDraftFile(requireOption(bodyFile, '--body-file'));
  const store: LinkedInStore = createLocalStore(dependencies);
  const cache = await store.loadRequired();
  const nextCache = createDraft(cache, requireOption(parsed.values.thread, '--thread'), body);
  await store.save(nextCache);
  const draft: LinkedInDraft | undefined = nextCache.drafts[nextCache.drafts.length - 1];
  if (!draft) {
    throw new LinkedInToolError('MA-LINKEDIN-DRAFT-INTERNAL', 'Draft creation produced no persisted draft.');
  }
  writeEnvelope(ok(invocation.action, invocation.requestId, invocation.startedAt, {
    draftId: draft.id,
    threadId: draft.threadId,
    createdAt: draft.createdAt,
    bodyLength: draft.body.length,
    sendCapability: 'not-available-read-only-api',
  }), parsed.values.pretty === true);
}

async function runReplyList(args: string[], dependencies: LinkedInCommandDependencies): Promise<void> {
  const invocation = startInvocation('linkedin.reply.list');
  const parsed = parseArgs({
    args: args,
    options: {
      thread: { type: 'string' },
      pretty: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  const store: LinkedInStore = createLocalStore(dependencies);
  const cache = await store.loadRequired();
  const drafts: LinkedInDraft[] = parsed.values.thread
    ? cache.drafts.filter((draft: LinkedInDraft) => draft.threadId === parsed.values.thread)
    : cache.drafts;
  writeEnvelope(ok(invocation.action, invocation.requestId, invocation.startedAt, {
    drafts: drafts.map((draft: LinkedInDraft) => ({
      id: draft.id,
      threadId: draft.threadId,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      status: draft.status,
      bodyLength: draft.body.length,
    })),
    total: drafts.length,
  }), parsed.values.pretty === true);
}

async function runReplyShow(args: string[], dependencies: LinkedInCommandDependencies): Promise<void> {
  const invocation = startInvocation('linkedin.reply.show');
  const parsed = parseArgs({
    args: args,
    options: {
      id: { type: 'string' },
      pretty: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  const store: LinkedInStore = createLocalStore(dependencies);
  const draft: LinkedInDraft = getDraft(await store.loadRequired(), requireOption(parsed.values.id, '--id'));
  writeEnvelope(ok(invocation.action, invocation.requestId, invocation.startedAt, draft), parsed.values.pretty === true);
}

async function runReplyDelete(args: string[], dependencies: LinkedInCommandDependencies): Promise<void> {
  const invocation = startInvocation('linkedin.reply.delete');
  const parsed = parseArgs({
    args: args,
    options: {
      id: { type: 'string' },
      confirm: { type: 'boolean', default: false },
      pretty: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  if (parsed.values.confirm !== true) {
    throw new LinkedInToolError(
      'MA-LINKEDIN-DRAFT-DELETE-CONFIRM',
      'Draft deletion is destructive. Repeat with --confirm.',
    );
  }
  const draftId: string = requireOption(parsed.values.id, '--id');
  const store: LinkedInStore = createLocalStore(dependencies);
  const nextCache = deleteDraft(await store.loadRequired(), draftId);
  await store.save(nextCache);
  writeEnvelope(ok(invocation.action, invocation.requestId, invocation.startedAt, {
    deleted: true,
    draftId: draftId,
  }), parsed.values.pretty === true);
}

async function runCache(args: string[], dependencies: LinkedInCommandDependencies): Promise<void> {
  const action: string | undefined = args[0];
  if (action !== 'purge') {
    throw new LinkedInToolError('MA-LINKEDIN-COMMAND', 'Usage: ma linkedin cache purge --confirm.');
  }
  const invocation = startInvocation('linkedin.cache.purge');
  const parsed = parseArgs({
    args: args.slice(1),
    options: {
      confirm: { type: 'boolean', default: false },
      pretty: { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  if (parsed.values.confirm !== true) {
    throw new LinkedInToolError(
      'MA-LINKEDIN-PURGE-CONFIRM',
      'Cache purge is destructive. Repeat with --confirm to delete cached messages and drafts.',
    );
  }
  const paths: LinkedInPaths = dependencies.paths ?? resolveLinkedInPaths();
  const removed: boolean = await new LinkedInStore(paths.cache).purge();
  writeEnvelope(ok(invocation.action, invocation.requestId, invocation.startedAt, {
    removed: removed,
    cachePath: paths.cache,
    configPreserved: true,
  }), parsed.values.pretty === true);
}

async function createContext(dependencies: LinkedInCommandDependencies): Promise<{
  paths: LinkedInPaths;
  config: LinkedInConfig;
  store: LinkedInStore;
  api: LinkedInApiClient;
  secrets: LinkedInSecretProvider;
}> {
  const paths: LinkedInPaths = dependencies.paths ?? resolveLinkedInPaths();
  const config: LinkedInConfig = await loadLinkedInConfig(paths.config);
  return {
    paths: paths,
    config: config,
    store: new LinkedInStore(paths.cache),
    api: dependencies.api ?? new LinkedInApiClient(),
    secrets: dependencies.secrets ?? createSecretProvider(config),
  };
}

function createSecretProvider(config: LinkedInConfig): LinkedInSecretProvider {
  return config.credentialSource === 'environment'
    ? new EnvironmentVariableSecretProvider()
    : new FdpKeystoreSecretProvider();
}

function describeSecretStorage(config: LinkedInConfig): string {
  return config.credentialSource === 'environment'
    ? 'gitignored project-root .env'
    : 'FDP Keystore';
}

function createLocalStore(dependencies: LinkedInCommandDependencies): LinkedInStore {
  const paths: LinkedInPaths = dependencies.paths ?? resolveLinkedInPaths();
  return new LinkedInStore(paths.cache);
}

async function readDraftFile(path: string): Promise<string> {
  if (!isAbsolute(path)) {
    throw new LinkedInToolError('MA-LINKEDIN-DRAFT-PATH', '--body-file must be an absolute path.', {
      resolvedPath: resolve(path),
    });
  }
  try {
    return await readFile(path, 'utf8');
  } catch (error: unknown) {
    const normalized: Error = error instanceof Error ? error : new Error(String(error));
    throw new LinkedInToolError('MA-LINKEDIN-DRAFT-READ', `Cannot read LinkedIn draft file: ${normalized.message}`, {
      path: path,
    });
  }
}

async function readAll(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item: string) => item.trim());
}

function requireCredentialSource(value: unknown): 'environment' | 'fdp-keystore' {
  if (value !== 'environment' && value !== 'fdp-keystore') {
    throw new LinkedInToolError(
      'MA-LINKEDIN-CREDENTIAL-SOURCE',
      '--credential-source must be environment or fdp-keystore.',
      { credentialSource: value },
    );
  }
  return value;
}

function requireOption(value: unknown, flag: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new LinkedInToolError('MA-LINKEDIN-OPTION', `${flag} is required.`, { flag: flag });
  }
  return value.trim();
}

function parseInteger(value: unknown, flag: string): number {
  const parsed: number = typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed)) {
    throw new LinkedInToolError('MA-LINKEDIN-OPTION', `${flag} must be an integer.`, { flag: flag, value: value });
  }
  return parsed;
}

function requireFdpEnvironment(value: unknown): 'test' | 'prod' {
  const normalized: string = requireOption(value, '--fdp-environment');
  if (normalized !== 'test' && normalized !== 'prod') {
    throw new LinkedInToolError(
      'MA-LINKEDIN-OPTION',
      '--fdp-environment must be test or prod.',
      { flag: '--fdp-environment', value: normalized },
    );
  }
  return normalized;
}

function startInvocation(action: string): { action: string; requestId: string; startedAt: number } {
  return { action: action, requestId: makeRequestId(), startedAt: Date.now() };
}
