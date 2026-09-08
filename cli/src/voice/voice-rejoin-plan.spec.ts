// Az újra-belépés tesztjei.
//
// 🔴 MÉRT HIÁNY (2026-09-08 10:57:54, éles): a bot kiesett a hang-csatornából, a napló el is
// kapta — de **soha nem lépett vissza**. Utolsó belépés 10:49:18, kiesés 10:57:54, és a
// csatorna azóta üres. ⇒ *Tudtuk, hogy kiestünk, és nem csináltunk vele semmit.*

import { planVoiceRejoin, REJOIN_DELAYS_MS } from './voice-rejoin-plan.js';

// A szunetek indexelt olvasasa `number | undefined` (szigoru index-ellenorzes) —
// a teszt viszont TENYKENT hasznalja, ezert egyszer, nevesitve oldjuk fel.
const FIRST_DELAY: number = REJOIN_DELAYS_MS[0] as number;
const SECOND_DELAY: number = REJOIN_DELAYS_MS[1] as number;

describe('planVoiceRejoin — kiesés után VISSZA is kell lépni', () => {

  it('az első kiesés után AZONNAL újrapróbál', () => {
    const plan = planVoiceRejoin(0);

    expect(plan.shouldRetry).toBeTrue();
    expect(plan.delayMs).toBe(FIRST_DELAY);
  });

  it('a szünetek NŐNEK — nem verjük a Discordot azonos ütemben', () => {
    for (let i: number = 1; i < REJOIN_DELAYS_MS.length; i += 1) {
      expect(planVoiceRejoin(i).delayMs).toBeGreaterThan(planVoiceRejoin(i - 1).delayMs);
    }
  });

  it('minden próbálkozás megmondja, HÁNYADIK — ne kelljen számolni', () => {
    expect(planVoiceRejoin(0).detail).toContain(`1. próbálkozás a ${REJOIN_DELAYS_MS.length}-ból`);
    expect(planVoiceRejoin(2).detail).toContain(`3. próbálkozás a ${REJOIN_DELAYS_MS.length}-ból`);
  });

  describe('⛔ NEM végtelen — a feladás is döntés', () => {

    it('a sorozat után NEM próbál tovább', () => {
      // 🔴 Ha a jogosultság veszett el vagy a csatornát törölték, a végtelen próbálkozás
      // NEM gyógyít — csak zajt termel és rate-limitet hív.
      expect(planVoiceRejoin(REJOIN_DELAYS_MS.length).shouldRetry).toBeFalse();
    });

    it('a feladás KIMONDJA a következményt: a csatorna ÜRES marad', () => {
      // ⚠️ „Feladtam" önmagában technikai tény. A következmény teszi cselekvésre késztetővé.
      const plan = planVoiceRejoin(REJOIN_DELAYS_MS.length);

      expect(plan.detail).toContain('ÜRES');
      expect(plan.detail).toContain('emberi beavatkozás');
    });

    it('a feladásnál nincs késleltetés — ⛔ nem ütemezünk „nulla múlva" próbát', () => {
      expect(planVoiceRejoin(REJOIN_DELAYS_MS.length).delayMs).toBe(0);
    });

    it('a sorozaton TÚL is stabilan feladást ad', () => {
      expect(planVoiceRejoin(REJOIN_DELAYS_MS.length + 50).shouldRetry).toBeFalse();
    });
  });

  describe('⛔ hibás bemenet sem billenti végtelenbe', () => {

    it('a negatív számláló az ELSŐ próbálkozásnak számít', () => {
      // Egy előjel-hiba ne adjon „ismeretlen ág ⇒ ne próbáljunk" viselkedést.
      expect(planVoiceRejoin(-3).delayMs).toBe(FIRST_DELAY);
    });

    it('a tört számlálót lefelé kerekíti — nem ad undefined késleltetést', () => {
      expect(planVoiceRejoin(1.9).delayMs).toBe(SECOND_DELAY);
    });

    it('⛔ SOHA nem ad NaN vagy undefined késleltetést', () => {
      for (const attempt of [-1, 0, 1, 2, 3, 4, 10, 1.5]) {
        const plan = planVoiceRejoin(attempt);

        expect(Number.isFinite(plan.delayMs)).toBeTrue();
        expect(plan.delayMs).toBeGreaterThanOrEqual(0);
      }
    });
  });

  it('minden ág ad indoklást — ⛔ a döntés soha nem néma', () => {
    for (const attempt of [0, 1, 2, 3, 4, 99]) {
      expect(planVoiceRejoin(attempt).detail.length).toBeGreaterThan(10);
    }
  });
});
