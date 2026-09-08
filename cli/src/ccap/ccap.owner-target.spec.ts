import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resolveOwnerMessageTarget, OWNER_TARGET_CONFIG_RELATIVE } from './ccap.owner-target.js';
import { CcapError } from './ccap.error.js';
import type { CcapApiClient } from './ccap.api-client.js';
import type { CcapCcSession } from './ccap.models.js';

const ASSISTANT: CcapCcSession = {
  sessionId: 'ccs-assistant',
  label: 'My Assistant',
  workspacePath: 'E:/my-assistant',
  status: 'waiting-input',
  claudeSessionId: 'claude-assistant',
} as CcapCcSession;

const DEV: CcapCcSession = {
  sessionId: 'ccs-dev',
  label: 'ALL Projects - My Assistant DEV',
  workspacePath: 'E:/my-assistant',
  status: 'waiting-input',
  claudeSessionId: 'claude-dev',
} as CcapCcSession;

/** Hamis CCAP — csak azt adja vissza, amit a teszt beállít. */
function makeApi(sessions: CcapCcSession[]): CcapApiClient {
  return {
    listCcSessions: async (): Promise<CcapCcSession[]> => sessions,
    inspectRuntime: async (): Promise<{ ccapId: string }> => ({ ccapId: 'instance-1' }),
  } as unknown as CcapApiClient;
}

async function makeRepo(config: unknown | null): Promise<string> {
  const root: string = await mkdtemp(join(tmpdir(), 'owner-target-'));

  if (config !== null) {
    await mkdir(join(root, '__agent', 'config'), { recursive: true });
    await writeFile(join(root, OWNER_TARGET_CONFIG_RELATIVE), JSON.stringify(config), 'utf-8');
  }

  return root;
}

describe('resolveOwnerMessageTarget', () => {

  it('a RÖGZÍTETT sessionre old fel — nem a process-környezetre', async () => {
    const root = await makeRepo({
      sessionId: 'ccs-assistant',
      claudeSessionId: 'claude-assistant',
      label: 'My Assistant',
    });

    const target = await resolveOwnerMessageTarget(root, makeApi([DEV, ASSISTANT]));

    expect(target.sessionId).toBe('ccs-assistant');
    expect(target.label).toBe('My Assistant');
  });

  it('🔴 A MÉRT INCIDENS: a DEV jelenléte NEM tereli el a kézbesítést', async () => {
    // 2026-09-08: az owner üzenetei a DEV-hez mentek, mert a figyelő az LDP alól a DEV
    // `CLAUDE_CODE_SESSION_ID`-ját örökölte. A rögzítés ezt teszi lehetetlenné.
    const root = await makeRepo({
      sessionId: 'ccs-assistant',
      claudeSessionId: 'claude-assistant',
      label: 'My Assistant',
    });

    // A DEV áll a lista ELEJÉN — a régi, env-alapú feloldás épp őt találta meg.
    const target = await resolveOwnerMessageTarget(root, makeApi([DEV, ASSISTANT]));

    expect(target.sessionId).not.toBe('ccs-dev');
  });

  it('⛔ HIÁNYZÓ rögzítésnél HANGOSAN bukik — nem esik vissza csendben', async () => {
    const root = await makeRepo(null);

    await expectAsync(resolveOwnerMessageTarget(root, makeApi([ASSISTANT])))
      .toBeRejectedWithError(CcapError, /Nincs kézbesítési cél rögzítve/);
  });

  it('⛔ HIÁNYOS rögzítés (nincs claudeSessionId) is bukik', async () => {
    const root = await makeRepo({ sessionId: 'ccs-assistant', label: 'My Assistant' });

    await expectAsync(resolveOwnerMessageTarget(root, makeApi([ASSISTANT])))
      .toBeRejectedWithError(CcapError, /hiányos/);
  });

  it('⛔ ELTŰNT cél-session: nem kézbesítünk máshova', async () => {
    const root = await makeRepo({
      sessionId: 'ccs-assistant',
      claudeSessionId: 'claude-assistant',
      label: 'My Assistant',
    });

    await expectAsync(resolveOwnerMessageTarget(root, makeApi([DEV])))
      .toBeRejectedWithError(CcapError, /NEM létezik a CCAP-ban/);
  });

  it('🔴 A KETTŐS EGYEZÉS: azonos ccs-azonosító MÁS Claude-sessionnel = elutasítás', async () => {
    // ⭐ Ez a védelem lényege: a `ccs-…` azonosító újrafelhasználódhat, a Claude-oldali nem.
    const root = await makeRepo({
      sessionId: 'ccs-assistant',
      claudeSessionId: 'claude-assistant',
      label: 'My Assistant',
    });

    const recycled: CcapCcSession = { ...ASSISTANT, claudeSessionId: 'claude-valaki-mas' };

    await expectAsync(resolveOwnerMessageTarget(root, makeApi([recycled])))
      .toBeRejectedWithError(CcapError, /NEM egyeznek/);
  });
});
