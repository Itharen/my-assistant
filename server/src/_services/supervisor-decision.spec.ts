// A felügyelő döntésének tesztjei.
//
// 🔴 MIÉRT LÉTEZIK: 2026-09-08 11:30-kor a Discord-figyelő meghalt, és a felügyelő **9+ percig**
// nem indította újra — egyetlen napló-bejegyzés nélkül. A figyelő nélkül az owner Discord-üzenetei
// **nem érkeznek meg**. Az ilyen csend a legdrágább hiba-fajta: nem látszik, amíg valaki rá nem
// kérdez.

import {
  BLOCKED_RECHECK_MS,
  CHILD_WATCH_MS,
  decideSupervisorAction,
  FOREIGN_RECHECK_MS,
  type SupervisorInput,
} from './supervisor-decision.js';

function input(overrides: Partial<SupervisorInput> = {}): SupervisorInput {
  return {
    stopping: false,
    childPid: null,
    childAlive: false,
    prerequisitesOk: true,
    runningElsewhere: false,
    ...overrides,
  };
}

describe('decideSupervisorAction — a felügyelő nem hagyhatja abba a felügyeletet', () => {

  it('🔴 A LEGFONTOSABB: a szándékos leálláson KÍVÜL minden ág újraütemez', () => {
    // ⚠️ Ez a garancia bukott meg élesben: az őrfeltétel újraütemezés NÉLKÜL lépett ki,
    // és a felügyelő véglegesen abbahagyta a figyelést — némán.
    const cases: SupervisorInput[] = [
      input({ childPid: 111, childAlive: true }),
      input({ childPid: 111, childAlive: false }),
      input({ prerequisitesOk: false }),
      input({ runningElsewhere: true }),
    ];

    for (const state of cases) {
      const decision = decideSupervisorAction(state);

      expect(decision.rescheduleMs)
        .withContext(`a(z) "${decision.action}" ág NEM ütemez újra`)
        .not.toBeNull();
    }
  });

  it('csak a szándékos leállás NEM ütemez újra', () => {
    const decision = decideSupervisorAction(input({ stopping: true }));

    expect(decision.action).toBe('skip-stopping');
    expect(decision.rescheduleMs).toBeNull();
  });

  describe('🔴 ÖNJAVÍTÁS: a nyilvántartott gyermek halott', () => {

    it('elengedi és AZONNAL újraindít', () => {
      // 🔴 Enélkül a felügyelő örökre azt hiszi, hogy fut a gyermek — mert csak a
      // `child !== null`-t nézi. Egy mező LÉTEZÉSE nem a jelentése.
      const decision = decideSupervisorAction(input({ childPid: 190948, childAlive: false }));

      expect(decision.action).toBe('reclaim-dead-child');
      expect(decision.rescheduleMs).toBe(0);
    });

    it('MEGNEVEZI a pid-et — enélkül nem lehet visszakeresni', () => {
      const decision = decideSupervisorAction(input({ childPid: 190948, childAlive: false }));

      expect(decision.detail).toContain('190948');
    });

    it('KIMONDJA, hogy a kilépés-esemény elmaradt — ez a diagnózis lényege', () => {
      expect(decideSupervisorAction(input({ childPid: 1, childAlive: false })).detail)
        .toContain('elmaradt');
    });
  });

  describe('élő gyermek', () => {

    it('nem indít másodikat, de visszanéz', () => {
      const decision = decideSupervisorAction(input({ childPid: 42, childAlive: true }));

      expect(decision.action).toBe('watch-child');
      expect(decision.rescheduleMs).toBe(CHILD_WATCH_MS);
    });

    it('⛔ élő gyermek mellett SOHA nem ad `start`-ot', () => {
      // Két párhuzamos figyelő két Discord-kapcsolatot jelentene ugyanarra a botra.
      expect(decideSupervisorAction(input({
        childPid: 42,
        childAlive: true,
        runningElsewhere: false,
        prerequisitesOk: true,
      })).action).not.toBe('start');
    });
  });

  describe('a többi ág', () => {

    it('hiányzó előfeltételnél RITKÁBBAN próbálkozik', () => {
      const decision = decideSupervisorAction(input({ prerequisitesOk: false }));

      expect(decision.action).toBe('blocked-prerequisites');
      expect(decision.rescheduleMs).toBe(BLOCKED_RECHECK_MS);
    });

    it('máshol futó példánynál csak visszanéz', () => {
      const decision = decideSupervisorAction(input({ runningElsewhere: true }));

      expect(decision.action).toBe('defer-foreign');
      expect(decision.rescheduleMs).toBe(FOREIGN_RECHECK_MS);
    });

    it('üres pályán INDÍT', () => {
      expect(decideSupervisorAction(input()).action).toBe('start');
    });

    it('⚠️ a hiányzó előfeltétel ELŐBBRE való, mint a „máshol fut"', () => {
      // Ha nincs mit futtatni, azt akkor is tudni kell, ha épp más példány él —
      // különben a hiány csak a másik halálakor derülne ki.
      expect(decideSupervisorAction(input({
        prerequisitesOk: false,
        runningElsewhere: true,
      })).action).toBe('blocked-prerequisites');
    });
  });

  it('minden ág ad indoklást — ⛔ a döntés soha nem néma', () => {
    const cases: SupervisorInput[] = [
      input({ stopping: true }),
      input({ childPid: 1, childAlive: true }),
      input({ childPid: 1, childAlive: false }),
      input({ prerequisitesOk: false }),
      input({ runningElsewhere: true }),
      input(),
    ];

    for (const state of cases) {
      expect(decideSupervisorAction(state).detail.length).toBeGreaterThan(10);
    }
  });
});
