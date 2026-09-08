// A kézbesítési cél KÖRNYEZETI felülbírálásának tesztjei.
//
// 🔴 OWNER-KÉRÉS (2026-09-08 15:32): *„Az hogy melyik sessiont használjuk ehhez az egy beégetett
// illetve legalább egy Environment file-ból tartozó érték kéne legyen."*
//
// ⚠️ MIÉRT VESZÉLYES EZ A KÓD: a rossz sessionbe kézbesítés **csendes** hiba — minden „sikeresen
// elküldve", csak nem oda. Pontosan ez történt ma: az owner üzenetei a DEV sessionbe csattantak.
// A védelem a **kettős egyezés** (`sessionId` + `claudeSessionId`), és a fél-beállítás pont ezt
// tudná szétverni.

import { CcapError } from './ccap.error.js';
import {
  mergeOwnerTargetWithEnv,
  OWNER_TARGET_ENV_CLAUDE_SESSION_ID,
  OWNER_TARGET_ENV_LABEL,
  OWNER_TARGET_ENV_SESSION_ID,
  type OwnerMessageTargetConfig,
} from './ccap.owner-target.js';

const fromFile: OwnerMessageTargetConfig = {
  sessionId: 'ccs-file',
  claudeSessionId: 'claude-file',
  label: 'My Assistant (fájlból)',
  reason: 'a fájlban rögzített ok',
};

describe('mergeOwnerTargetWithEnv — a környezet felülbírálja a fájlt', () => {

  it('üres környezetnél a FÁJL marad érvényben', () => {
    expect(mergeOwnerTargetWithEnv(fromFile, {})).toEqual(fromFile);
  });

  it('mindkét azonosító megadva ⇒ a KÖRNYEZET nyer', () => {
    const merged = mergeOwnerTargetWithEnv(fromFile, {
      [OWNER_TARGET_ENV_SESSION_ID]: 'ccs-env',
      [OWNER_TARGET_ENV_CLAUDE_SESSION_ID]: 'claude-env',
    });

    expect(merged.sessionId).toBe('ccs-env');
    expect(merged.claudeSessionId).toBe('claude-env');
  });

  it('a címke is felülbírálható — de nem kötelező', () => {
    const withLabel = mergeOwnerTargetWithEnv(fromFile, {
      [OWNER_TARGET_ENV_SESSION_ID]: 'ccs-env',
      [OWNER_TARGET_ENV_CLAUDE_SESSION_ID]: 'claude-env',
      [OWNER_TARGET_ENV_LABEL]: 'My Assistant (env)',
    });
    const withoutLabel = mergeOwnerTargetWithEnv(fromFile, {
      [OWNER_TARGET_ENV_SESSION_ID]: 'ccs-env',
      [OWNER_TARGET_ENV_CLAUDE_SESSION_ID]: 'claude-env',
    });

    expect(withLabel.label).toBe('My Assistant (env)');
    expect(withoutLabel.label).toBe(fromFile.label);
  });

  it('⭐ a felülbírálás NYOMOT HAGY az indoklásban — hogy egy későbbi olvasó lássa, honnan jött', () => {
    const merged = mergeOwnerTargetWithEnv(fromFile, {
      [OWNER_TARGET_ENV_SESSION_ID]: 'ccs-env',
      [OWNER_TARGET_ENV_CLAUDE_SESSION_ID]: 'claude-env',
    });

    expect(merged.reason).toContain(OWNER_TARGET_ENV_SESSION_ID);
  });

  describe('🔴 A FÉL-BEÁLLÍTÁS HIBA — itt bukna el a kettős egyezés', () => {

    it('csak a sessionId megadva ⇒ DOB', () => {
      // ⚠️ Enélkül a `sessionId` a környezetből, a `claudeSessionId` a fájlból jönne —
      // két KÜLÖNBÖZŐ sessionre mutatva. Pont az a védelem esne ki, amiért ez létezik.
      expect((): OwnerMessageTargetConfig => mergeOwnerTargetWithEnv(fromFile, {
        [OWNER_TARGET_ENV_SESSION_ID]: 'ccs-env',
      })).toThrowError(CcapError);
    });

    it('csak a claudeSessionId megadva ⇒ DOB', () => {
      expect((): OwnerMessageTargetConfig => mergeOwnerTargetWithEnv(fromFile, {
        [OWNER_TARGET_ENV_CLAUDE_SESSION_ID]: 'claude-env',
      })).toThrowError(CcapError);
    });

    it('a hiba MEGMONDJA, melyik hiányzik — ne kelljen kitalálni', () => {
      try {
        mergeOwnerTargetWithEnv(fromFile, { [OWNER_TARGET_ENV_SESSION_ID]: 'ccs-env' });
        fail('dobnia kellett volna');
      } catch (error: unknown) {
        expect((error as CcapError).message).toContain('(nincs)');
        expect((error as CcapError).message).toContain(OWNER_TARGET_ENV_CLAUDE_SESSION_ID);
      }
    });

    it('⛔ SOHA nem esik vissza csendben a fájlra', () => {
      // A csendes fallback pont az a hibafajta, ami ma az owner üzeneteit a DEV-be vitte.
      expect((): OwnerMessageTargetConfig => mergeOwnerTargetWithEnv(fromFile, {
        [OWNER_TARGET_ENV_SESSION_ID]: 'ccs-env',
      })).toThrow();
    });
  });

  describe('⚠️ whitespace — a „beállítottam, csak üres" csapda', () => {

    it('a csupa-szóköz érték NEM számít beállítottnak', () => {
      expect(mergeOwnerTargetWithEnv(fromFile, {
        [OWNER_TARGET_ENV_SESSION_ID]: '   ',
        [OWNER_TARGET_ENV_CLAUDE_SESSION_ID]: '  ',
      })).toEqual(fromFile);
    });

    it('a körülvágás megtörténik — a másolt-beillesztett szóköz ne törjön el mindent', () => {
      const merged = mergeOwnerTargetWithEnv(fromFile, {
        [OWNER_TARGET_ENV_SESSION_ID]: '  ccs-env  ',
        [OWNER_TARGET_ENV_CLAUDE_SESSION_ID]: ' claude-env ',
      });

      expect(merged.sessionId).toBe('ccs-env');
      expect(merged.claudeSessionId).toBe('claude-env');
    });
  });
});
