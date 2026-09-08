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

/**
 * A KÖRNYEZETI VÁLTOZÓS felülbírálás mezőnevei.
 *
 * 🔴 OWNER-KÉRÉS (2026-09-08 15:32): *„Az hogy melyik sessiont használjuk ehhez az egy beégetett
 * illetve legalább egy Environment file-ból tartozó érték kéne legyen."*
 *
 * ⭐ MIÉRT KELL A JSON MELLÉ: a repóba commitolt rögzítés **auditálható**, de a session-azonosító
 * **gép- és futásfüggő** — egy másik gépen vagy egy asszisztens-újraindulás után más. Az `.env`
 * a hely, ahol az ilyen érték lakik (`pi-env-gitignored`), és **nem kerül a repóba**.
 *
 * ⚠️ **A KÖRNYEZET NYER a fájl felett** — ha be van állítva, az a mérvadó.
 */
export const OWNER_TARGET_ENV_SESSION_ID: string = 'MA_OWNER_TARGET_SESSION_ID';
export const OWNER_TARGET_ENV_CLAUDE_SESSION_ID: string = 'MA_OWNER_TARGET_CLAUDE_SESSION_ID';
export const OWNER_TARGET_ENV_LABEL: string = 'MA_OWNER_TARGET_LABEL';

/**
 * A fájlból olvasott rögzítés + a környezet ÖSSZEFÉSÜLÉSE. **Tiszta függvény.**
 *
 * ⛔ **A FÉL-BEÁLLÍTÁS HIBA, NEM RÉSZLEGES FELÜLBÍRÁLÁS.** Ha csak az egyik azonosító van
 * megadva, a **kettős egyezés** — ami az egész védelem lényege — elveszne: a `sessionId`
 * a környezetből, a `claudeSessionId` a fájlból származna, és a kettő **egymástól függetlenül**
 * mutatna két különböző sessionre. Ilyenkor hangosan bukunk.
 */
export function mergeOwnerTargetWithEnv(
  fromFile: OwnerMessageTargetConfig,
  env: Record<string, string | undefined>,
): OwnerMessageTargetConfig {
  const sessionId: string = (env[OWNER_TARGET_ENV_SESSION_ID] ?? '').trim();
  const claudeSessionId: string = (env[OWNER_TARGET_ENV_CLAUDE_SESSION_ID] ?? '').trim();

  if (!sessionId && !claudeSessionId) return fromFile;

  if (!sessionId || !claudeSessionId) {
    throw new CcapError(
      'MA-CCAP-OWNER-TARGET-ENV-PARTIAL',
      `A cél-session környezeti felülbírálása HIÁNYOS: `
        + `${OWNER_TARGET_ENV_SESSION_ID}=${sessionId || '(nincs)'} · `
        + `${OWNER_TARGET_ENV_CLAUDE_SESSION_ID}=${claudeSessionId || '(nincs)'}.`,
      `Add meg MINDKETTŐT az \`.env\`-ben, vagy egyiket se. A kettős egyezés a védelem: `
        + 'fél beállítással két KÜLÖNBÖZŐ sessionre mutatna a két azonosító.',
      { [OWNER_TARGET_ENV_SESSION_ID]: sessionId, [OWNER_TARGET_ENV_CLAUDE_SESSION_ID]: claudeSessionId },
    );
  }

  return {
    ...fromFile,
    sessionId: sessionId,
    claudeSessionId: claudeSessionId,
    label: (env[OWNER_TARGET_ENV_LABEL] ?? '').trim() || fromFile.label,
    reason: `${fromFile.reason ?? ''} ⚠️ A sessionId/claudeSessionId KÖRNYEZETI VÁLTOZÓBÓL jön `
      + `(${OWNER_TARGET_ENV_SESSION_ID}), ami felülírja a fájlban rögzítettet.`.trim(),
  };
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
  // ⭐ A KÖRNYEZET NYER: a fájl az auditálható alap, az `.env` a gép-/futásfüggő felülbírálás.
  const config: OwnerMessageTargetConfig = mergeOwnerTargetWithEnv(
    await readOwnerTargetConfig(repoRoot),
    process.env,
  );
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
