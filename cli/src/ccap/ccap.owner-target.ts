// Hova menjenek az OWNER üzenetei — a kézbesítési cél KIFEJEZETT rögzítése.
//
// 🔴 MIÉRT LÉTEZIK — MÉRT INCIDENS, 2026-09-08 14:00:
//
// Az owner üzenetei **a DEV sessionbe** érkeztek, nem az asszisztenshez. Az ő szavaival:
// „Most látom, hogy nem jó sessionbe mennek ráadásul most az üzeneteim. A devnek vannak
// elküldve az üzeneteim, nem pedig ide neked. TOTAL CHAOS!!"
//
// **A bizonyíték:** a 13:19-es owner-üzenetre („Az ne zavarja össze a fókuszt…") a DEV
// válaszolt — `ff9113a` commit, `current/principles/focus-support.md`. Az asszisztens
// ugyanazt a kérést sosem kapta meg.
//
// **AZ OK:** a híd korábban a `resolveSelfIdentity()`-t hívta, ami a `CLAUDE_CODE_SESSION_ID`
// **környezeti változóból** dolgozik. ⚠️ A Discord-figyelő viszont **az LDP alatt fut**, nem az
// asszisztens sessionjében — tehát annak a sessionnek a környezetét örökli, **amelyik az LDP-t
// elindította**. Ha azt a DEV indította, az owner MINDEN üzenete a DEV-hez megy.
//
// ⭐ A `ccap.identity.ts` fejléce a **elavult** azonosító ellen véd („az azonosító
// újraindításkor változhat") — de a **MÁSIK session azonosítójának ÖRÖKLÉSE** ellen nem.
// Ez a csendes hibafajta: minden „sikeresen elküldve", csak nem oda.
//
// ⇒ A kézbesítési cél mostantól **kifejezett, verziókezelt rögzítés**, nem a folyamat
// környezete. ⛔ Csendes visszaesés (fallback) NINCS: ha a rögzítés nem érvényes, a hívás
// **hangosan elbukik** — mert a rossz sessionbe kézbesítés rosszabb, mint a nem-kézbesítés.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { CcapApiClient } from './ccap.api-client.js';
import { CcapError } from './ccap.error.js';
import type { CcapCcSession, CcapSelfIdentity } from './ccap.models.js';

/** A rögzítés helye a repóban — verziókezelt, ezért auditálható. */
export const OWNER_TARGET_CONFIG_RELATIVE: string = '__agent/config/owner-message-target.json';

/** A rögzítés alakja. ⛔ Mindhárom mező kötelező — a kettős egyezés a védelem. */
export interface OwnerMessageTargetConfig {
  /** A CCAP-beli CC session azonosító (`ccs-…`). */
  sessionId: string;
  /** A Claude Code session azonosító — a MÁSODIK, független ellenőrzés. */
  claudeSessionId: string;
  /** Emberi címke, csak a hibaüzenethez és az audithoz. */
  label: string;
  /** Mikor és ki rögzítette — hogy utólag látszódjon, honnan jött. */
  pinnedAt?: string;
  pinnedBy?: string;
  /** Miért — hogy egy későbbi olvasó ne „takarítsa el" értetlenül. */
  reason?: string;
}

/** A rögzítés beolvasása. @throws CcapError ha hiányzik vagy hiányos. */
export async function readOwnerTargetConfig(repoRoot: string): Promise<OwnerMessageTargetConfig> {
  const path: string = join(repoRoot, OWNER_TARGET_CONFIG_RELATIVE);
  let raw: string;

  try {
    raw = await readFile(path, 'utf-8');
  } catch {
    throw new CcapError(
      'MA-CCAP-NO-OWNER-TARGET',
      `Nincs kézbesítési cél rögzítve (${OWNER_TARGET_CONFIG_RELATIVE}).`,
      'Rögzítsd az asszisztens-session azonosítóit ebbe a fájlba. '
        + '⛔ Környezeti változóra NEM esünk vissza: az LDP alatt futó figyelő '
        + 'annak a sessionnek a környezetét örökli, amelyik az LDP-t indította.',
      { path: path },
    );
  }

  const parsed = JSON.parse(raw) as Partial<OwnerMessageTargetConfig>;
  const missing: string[] = (['sessionId', 'claudeSessionId', 'label'] as const)
    .filter((key) => !(parsed[key] ?? '').toString().trim());

  if (missing.length) {
    throw new CcapError(
      'MA-CCAP-OWNER-TARGET-INCOMPLETE',
      `A kézbesítési cél rögzítése hiányos — hiányzó mezők: ${missing.join(', ')}.`,
      'Mindhárom mező kötelező: a `claudeSessionId` a `sessionId` FÜGGETLEN ellenőrzése.',
      { path: path, missing: missing },
    );
  }

  return parsed as OwnerMessageTargetConfig;
}

/**
 * A rögzített cél feloldása ÉS ellenőrzése az élő CCAP-listával szemben.
 *
 * ⭐ **KETTŐS EGYEZÉS:** a `sessionId`-nak léteznie kell, ÉS a hozzá tartozó
 * `claudeSessionId`-nak egyeznie kell a rögzítettel. Egyetlen egyezés nem elég: a `ccs-…`
 * azonosító újrafelhasználódhat, a Claude-oldali azonosító viszont a session sajátja.
 *
 * @throws CcapError ha a cél nem található, vagy a két azonosító nem ugyanarra mutat.
 */
export async function resolveOwnerMessageTarget(
  repoRoot: string,
  client?: CcapApiClient,
): Promise<CcapSelfIdentity> {
  const api: CcapApiClient = client ?? new CcapApiClient();
  const config: OwnerMessageTargetConfig = await readOwnerTargetConfig(repoRoot);
  const sessions: CcapCcSession[] = await api.listCcSessions();
  const match: CcapCcSession | undefined = sessions.find((s) => s.sessionId === config.sessionId);

  if (!match) {
    throw new CcapError(
      'MA-CCAP-OWNER-TARGET-GONE',
      `A rögzített cél-session ("${config.label}", ${config.sessionId}) NEM létezik a CCAP-ban.`,
      'Az asszisztens-session valószínűleg újraindult. Frissítsd a rögzítést az ÚJ azonosítókkal. '
        + '⛔ Addig nem kézbesítünk: a rossz sessionbe küldés rosszabb, mint a várakozás.',
      { sessionId: config.sessionId, knownSessionCount: sessions.length },
    );
  }

  if (match.claudeSessionId !== config.claudeSessionId) {
    throw new CcapError(
      'MA-CCAP-OWNER-TARGET-MISMATCH',
      `A cél-session azonosítói NEM egyeznek: ${config.sessionId} mögött most `
        + `"${match.label}" áll (claudeSessionId ${match.claudeSessionId || '—'}), `
        + `a rögzítés szerint viszont "${config.label}" (${config.claudeSessionId}).`,
      'Ez pontosan az a helyzet, ami miatt ez az ellenőrzés létezik. Nézd meg, melyik session '
        + 'az owner asszisztense MOST, és rögzítsd újra.',
      { expected: config.claudeSessionId, actual: match.claudeSessionId },
    );
  }

  const runtime = await api.inspectRuntime(match.sessionId);

  return {
    sessionId: match.sessionId,
    label: match.label,
    workspacePath: match.workspacePath,
    ccapId: runtime.ccapId,
    claudeSessionId: match.claudeSessionId,
  };
}
