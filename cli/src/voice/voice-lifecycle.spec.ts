// A hang-jelenlét életciklus-döntésének tesztjei.
//
// 🔴 MIÉRT LÉTEZIK: 2026-09-10-én az owner **hamis jelenlétet** látott — a bot bent ült a
// hang-csatornában, miközben a szerver nem futott. Az ő szavaival: *„azt hiszem, hogy itt
// vagy, és figyelsz, miközben nem is."*
//
// ⭐ A LEGFONTOSABB ÁLLÍTÁS ITT: a **`service-unreachable` NEM állítja le a folyamatot**. A
// kilépés és a leállás két külön dolog — ha összemosnánk, egy újrainduló szerver mellett a
// figyelő is meghalna, és utána **senki nem lépne vissza** a csatornába.

import {
  decideVoiceJoinPermission,
  decideVoiceLifecycleAction,
  VOICE_LEAVE_GRACE_MS,
  type VoiceLifecycleEvent,
} from './voice-lifecycle.js';

describe('decideVoiceLifecycleAction — mikor lépünk ki', () => {

  it('MINDEN eseménynél kilépünk — a bent-ülés ígéret, amit nem hagyunk fedezetlenül', () => {
    const events: VoiceLifecycleEvent[] = [
      'signal', 'parent-gone', 'service-unreachable', 'explicit-stop',
    ];

    for (const event of events) {
      expect(decideVoiceLifecycleAction(event).leave).withContext(event).toBeTrue();
    }
  });

  it('MINDEN döntés visz OKOT — ⛔ az ok nélküli kilépés majdnem használhatatlan', () => {
    // Az owner ma reggel 24 belépést és NULLA kilépést látott a naplóban. Az ok mondja meg,
    // hogy rendes leállás volt-e, vagy elveszett a szerver.
    const events: VoiceLifecycleEvent[] = [
      'signal', 'parent-gone', 'service-unreachable', 'explicit-stop',
    ];

    for (const event of events) {
      expect(decideVoiceLifecycleAction(event).reason.length).withContext(event).toBeGreaterThan(10);
    }
  });

  describe('🔴 a kilépés és a LEÁLLÁS két külön dolog', () => {

    it('jelre: kilépés ÉS leállás — ez a rendes leállítás', () => {
      expect(decideVoiceLifecycleAction('signal')).toEqual({
        leave: true,
        exitProcess: true,
        reason: 'rendes leállítás (jel) — kilépés a hang-csatornából',
      });
    });

    it('⭐ a felügyelő eltűnésekor is LEÁLLUNK — az árva figyelő ült ma bent hamisan', () => {
      const action = decideVoiceLifecycleAction('parent-gone');

      expect(action.leave).toBeTrue();
      expect(action.exitProcess).toBeTrue();
      expect(action.reason).toContain('hamis jelenlétet');
    });

    it('⛔ elérhetetlen SZOLGÁLTATÁSNÁL kilépünk, de NEM állunk le', () => {
      // ⚠️ Ez a legfontosabb különbség: a szerver lehet, hogy csak ÚJRAINDUL. Ha itt is
      // leállnánk, utána senki nem lépne vissza a csatornába, amikor visszajön.
      const action = decideVoiceLifecycleAction('service-unreachable');

      expect(action.leave).toBeTrue();
      expect(action.exitProcess).toBeFalse();
    });

    it('kifejezett leállításnál a folyamatról a HÍVÓ dönt, nem mi', () => {
      expect(decideVoiceLifecycleAction('explicit-stop').exitProcess).toBeFalse();
    });
  });

  it('⚠️ ISMERETLEN eseménynél is kilépünk — az óvatos irány', () => {
    // Bent maradni azt jelentené, hogy egy általunk nem értett állapotban is jelenlétet ígérünk.
    const action = decideVoiceLifecycleAction('valami-uj' as VoiceLifecycleEvent);

    expect(action.leave).toBeTrue();
    expect(action.exitProcess).toBeFalse();
    expect(action.reason).toContain('ismeretlen');
  });

  it('a türelmi idő NEM nulla — a kilépés HÁLÓZATI üzenet, ki kell mennie', () => {
    // 🔴 Ha a folyamat azonnal meghal, a `destroy()` üzenete nem ér ki, és a Discord szerint
    // a bot BENT MARAD — pontosan a hamis jelenlét, amit meg akarunk szüntetni.
    expect(VOICE_LEAVE_GRACE_MS).toBeGreaterThan(0);
    // ⚠️ De rövid: a szülő vár ránk, és a szerver újraindítását nem késleltethetjük.
    expect(VOICE_LEAVE_GRACE_MS).toBeLessThan(2000);
  });
});

describe('decideVoiceJoinPermission — belépés CSAK ha a lánc kiszolgál', () => {

  it('⭐ FELÜGYELT figyelő (a stdin CSŐ) beléphet — ez a szolgáltatás', () => {
    // A szerver `stdio: ['pipe', …]`-pal indít, tehát a stdin NEM tty.
    const permission = decideVoiceJoinPermission(false, false);

    expect(permission.allowed).toBeTrue();
    expect(permission.reason).toContain('felügyeli');
  });

  it('🔴 KÉZI indítás (a stdin TTY) NEM lép be — ez okozta a hamis jelenlétet', () => {
    // 2026-09-10: egy kézzel indított figyelő ült a hang-csatornában, miközben a szerver
    // nem futott. Az owner ebből azt olvasta, hogy jelen vagyok és figyelek.
    const permission = decideVoiceJoinPermission(true, false);

    expect(permission.allowed).toBeFalse();
    expect(permission.reason).toContain('hamis jelenlétet');
    // ⭐ A tiltás MEGMONDJA, hogyan lehet felülbírálni — enélkül az élő próba lehetetlen lenne.
    expect(permission.reason).toContain('MA_VOICE_ALLOW_UNSUPERVISED');
  });

  it('a KIFEJEZETT felülbírálás beengedi — az élő igazoláshoz kell', () => {
    expect(decideVoiceJoinPermission(true, true).allowed).toBeTrue();
  });

  it('⚠️ a felülbírálás a FELÜGYELT esetet NEM változtatja meg', () => {
    // Egy env-változó ne tudja „még jobban" beengedni azt, ami már be van engedve — a
    // két ág indoklása KÜLÖNBÖZŐ, és a naplóból ki kell derüljön, melyik érvényesült.
    expect(decideVoiceJoinPermission(false, true).reason).toContain('felügyeli');
  });
});
