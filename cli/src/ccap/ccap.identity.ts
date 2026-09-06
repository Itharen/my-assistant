// Session-önazonosítás — „melyik CC session vagyok a CCAP-ban?"
//
// Owner-kérés (2026-09-06): „mindenképpen fel kell jegyezni valami konfigba, hogy te melyik
// session vagy a CCAP-ban. ( nem CCAP Session, hanem CC Session a CCAP-ban!)"
//
// ⭐ A feloldás FUTÁSIDEJŰ, nem beégetett — mert a `ccs-…` azonosító újraindításkor változhat.
// A kapcsolóelem (élő méréssel igazolva, 2026-09-06):
//
//     CLAUDE_CODE_SESSION_ID  (környezeti változó)
//             ↕ egyezés
//     GET /api/cc-session → sessions[].claudeSessionId
//             ↓
//     sessions[].sessionId   =   a saját `ccs-…` azonosítóm
//
// Így a Discord-híd sosem küld elavult azonosítóra — ami a legcsendesebb hibafajta lenne
// (az üzenet eltűnik, és senki nem kap hibajelzést).

import { CcapApiClient } from './ccap.api-client.js';
import { CcapError } from './ccap.error.js';
import type { CcapSelfIdentity } from './ccap.models.js';

/** A környezeti változó, amiből a Claude Code session azonosítója kiolvasható. */
export const CLAUDE_SESSION_ID_ENV: string = 'CLAUDE_CODE_SESSION_ID';

/**
 * Megállapítja, hogy a jelenlegi futás melyik CC sessionhöz tartozik a CCAP-ban.
 *
 * @throws CcapError ha nincs környezeti azonosító, vagy nincs hozzá tartozó CC session.
 */
export async function resolveSelfIdentity(client?: CcapApiClient): Promise<CcapSelfIdentity> {
  const api: CcapApiClient = client ?? new CcapApiClient();
  const claudeSessionId: string = (process.env[CLAUDE_SESSION_ID_ENV] ?? '').trim();

  if (!claudeSessionId) {
    throw new CcapError(
      'MA-CCAP-NO-SESSION-ID-ENV',
      `A ${CLAUDE_SESSION_ID_ENV} környezeti változó üres vagy hiányzik.`,
      'Ez a parancs a CCAP által indított CC sessionön belül futtatandó. '
        + 'Ha kívülről futtatod, add meg kézzel a session-azonosítót.',
    );
  }

  const sessions = await api.listCcSessions();
  const match = sessions.find((session) => session.claudeSessionId === claudeSessionId);

  if (!match) {
    throw new CcapError(
      'MA-CCAP-SELF-NOT-FOUND',
      `Nincs olyan CC session a CCAP-ban, amelynek claudeSessionId-ja "${claudeSessionId}".`,
      'Lehet, hogy ez a futás nem a CCAP-on keresztül indult, vagy a session már archiválva van. '
        + 'Ellenőrzés: `ccap status`, illetve a CC session lista.',
      { claudeSessionId: claudeSessionId, knownSessionCount: sessions.length },
    );
  }

  // A `ccapId` (instance-azonosító) csak az `inspect` válaszban van meg — a Discord-híd
  // naplózásához és a több-instance-es jövőhöz kell, ezért itt fel is oldjuk.
  const runtime = await api.inspectRuntime(match.sessionId);

  return {
    sessionId: match.sessionId,
    label: match.label,
    workspacePath: match.workspacePath,
    ccapId: runtime.ccapId,
    claudeSessionId: claudeSessionId,
  };
}
