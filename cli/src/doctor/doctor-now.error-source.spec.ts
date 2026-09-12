// 🔍 A HIBA-BEJEGYZÉSEK SZÉTVÁLASZTÁSÁNAK TESZTJEI (22. tétel).
//
// > **Owner, 2026-09-12 17:30:** *„Most az ÉN saját retrospektív jegyzetem jelenik meg »utolsó
// > hibaként«… Nem rendszer-hiba, hanem **krónika**. A megkülönböztető jel MÁR OTT VAN: az
// > `actor` mező… A `doctor now` NE vegye figyelembe az `actor: "claude"` bejegyzéseket."*
//
// 🔴 A LEGFONTOSABB ÁLLÍTÁS ITT a **fordított** szűrő tilalma: a „minden, ami nem `cli`/`server`"
// szabály **29 VALÓDI gépi hibát** dobott volna el *(mérve 52 napon)* — l. a modul fejlécét.

import { DoctorNowErrorSource_Util } from './doctor-now.error-source.js';

describe('DoctorNowErrorSource_Util — üzemállapot vs. krónika vs. teszt', () => {

  it('📖 KRÓNIKA: az `actor: "claude"` bejegyzés ⛔ nem rendszer-hiba', () => {
    const verdict = DoctorNowErrorSource_Util.classify({
      actor: 'claude',
      ref: '__agent/DEV-HANDOFF.md',
    });

    expect(verdict.isChronicle).toBeTrue();
    expect(verdict.isTestOrigin).toBeFalse();
  });

  it('📖 A `codex` is krónika — mérve UGYANAZ az osztály (46 prózai bejegyzés)', () => {
    expect(DoctorNowErrorSource_Util.classify({ actor: 'codex' }).isChronicle).toBeTrue();
  });

  it('⚙️ FUTÁSIDEJŰ: a `cli` és a `server` hibája VALÓDI üzemállapot', () => {
    for (const actor of ['cli', 'server']) {
      const verdict = DoctorNowErrorSource_Util.classify({ actor: actor });

      expect(verdict.isChronicle).withContext(actor).toBeFalse();
      expect(verdict.isTestOrigin).withContext(actor).toBeFalse();
    }
  });

  it('🔴 POZITÍV KONTROLL: az agent-NEVŰ, de GÉPI actorok BENNE MARADNAK', () => {
    // 🔬 MÉRVE 52 napon: `agent` (23) = „[notify-discord] POST failed … fetch failed",
    // `agent-dispatcher` (6) = „dispatch: JSON parse error", `assistant-agent-cron` (1) =
    // „fo tasks.list AUTH-fail", `development-agent` (3) = VEGYES.
    // ⇒ Egy „minden, ami nem cli/server" szűrő ezt a 33 bejegyzést eltüntette volna.
    for (const actor of ['agent', 'agent-dispatcher', 'assistant-agent-cron', 'development-agent']) {
      expect(DoctorNowErrorSource_Util.classify({ actor: actor }).isChronicle)
        .withContext(actor).toBeFalse();
    }
  });

  it('🧪 A TESZT-EREDET továbbra is külön jelzés — a kettő ⛔ nem mosódik össze', () => {
    const verdict = DoctorNowErrorSource_Util.classify({
      actor: 'cli',
      ref: 'C:\\Users\\User\\AppData\\Local\\Temp\\ma-groups-spec-KSBgEB\\broken.json',
    });

    expect(verdict.isTestOrigin).toBeTrue();
    expect(verdict.isChronicle).toBeFalse();
  });

  it('⛔ HIÁNYZÓ vagy ISMERETLEN actor ⇒ VALÓDI hibaként kezeljük (óvatos irány)', () => {
    // ⚠️ A „nem tudom" ⛔ nem lehet „nem érdekes": inkább mutassunk meg egy bizonytalan
    // bejegyzést, mint hogy megtanuljuk figyelmen kívül hagyni a mezőt.
    expect(DoctorNowErrorSource_Util.classify({}).isChronicle).toBeFalse();
    expect(DoctorNowErrorSource_Util.classify({ actor: 42 }).isChronicle).toBeFalse();
    expect(DoctorNowErrorSource_Util.classify({ actor: 'valami-uj-folyamat' }).isChronicle).toBeFalse();
  });
});
