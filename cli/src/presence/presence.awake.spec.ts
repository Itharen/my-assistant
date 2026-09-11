// Az ébrenlét-döntés tesztjei.
//
// 🔴 A HÁROM ÁG, amiért ez a fájl létezik — és a harmadik a lényeg:
//   (a) **ÉBREN** — friss, aktív jelenlét-mérés VAGY friss Discord-válasz;
//   (b) **ALSZIK** — friss mérés, de régóta tétlen;
//   (c) 🔴 **NINCS ADAT** — ⛔ és ez NEM „valószínűleg ébren". A bizonytalanság az „alszik"
//       ágra esik: *a téves csend olcsó, a téves HANGOS megszólalás nem az.*
//
// ⚠️ A MÉRT CÁFOLAT, amit ezek a tesztek őriznek *(2026-09-11/12)*: a fix órarend **kétszer**
// mondott hamisat — 09:00-kor „ébren" *(idle 6,1 óra ⇒ aludt)*, 00:06-kor „alszik"
// *(idle 0 mp ⇒ ébren volt)*. ⇒ Innentől a **mérés** dönt.

import { PresenceAwake_Util } from './presence.awake.js';
import type { PresenceSnapshot } from './presence.reader.js';

const NOW: Date = new Date('2026-09-12T00:06:43+02:00');

/** Egy jelenlét-kép a teszthez. */
function presence(overrides: Partial<PresenceSnapshot> = {}): PresenceSnapshot {
  return {
    isHome: overrides.isHome ?? 'unknown',
    reason: overrides.reason ?? 'teszt-indoklás',
    ...(overrides.ageMinutes === undefined ? {} : { ageMinutes: overrides.ageMinutes }),
    ...(overrides.latest === undefined ? {} : { latest: overrides.latest }),
  };
}

describe('| PresenceAwake_Util.decide — ⭐ ÉBREN', () => {

  it('friss, AKTÍV mérésnél ébren — a legerősebb jel', () => {
    const decision = PresenceAwake_Util.decide({
      presence: presence({
        isHome: 'yes',
        reason: 'Friss mérés (0 perce), aktív bevitel — a gépét használja.',
        ageMinutes: 0,
      }),
      now: NOW,
    });

    expect(decision.state).toBe('awake');
    expect(decision.isAwake).toBe(true);
    expect(decision.signal).toBe('presence-active');
    // ⭐ AZ INDOKLÁS ÁTMEGY — ⛔ nem puszta logikai érték.
    expect(decision.reason).toContain('a gépét használja');
    expect(decision.ageMinutes).toBe(0);
  });

  it('Discord-válasz a türelmi ablakon BELÜL ⇒ ébren, akkor is, ha nincs a gépnél', () => {
    const decision = PresenceAwake_Util.decide({
      presence: presence({ isHome: 'no', reason: 'Friss mérés, de tétlen.' }),
      lastDiscordReplyAt: new Date(NOW.getTime() - 30 * 60_000),
      now: NOW,
    });

    expect(decision.state).toBe('awake');
    expect(decision.signal).toBe('discord-reply');
    expect(decision.ageMinutes).toBe(30);
    expect(decision.reason).toContain('Discordon');
  });

  it('az AKTÍV jelenlét ELŐZI a Discord-jelet — a gépnél lenni erősebb', () => {
    const decision = PresenceAwake_Util.decide({
      presence: presence({ isHome: 'yes', reason: 'aktív bevitel' }),
      lastDiscordReplyAt: new Date(NOW.getTime() - 55 * 60_000),
      now: NOW,
    });

    expect(decision.signal).toBe('presence-active');
  });

  it('pontosan a türelmi ablak HATÁRÁN még ébren', () => {
    const decision = PresenceAwake_Util.decide({
      presence: presence({ isHome: 'no', reason: 'tétlen' }),
      lastDiscordReplyAt: new Date(NOW.getTime() - PresenceAwake_Util.DISCORD_AWAKE_WINDOW_MS),
      now: NOW,
    });

    expect(decision.state).toBe('awake');
  });
});

describe('| PresenceAwake_Util.decide — 😴 ALSZIK', () => {

  it('friss, de TÉTLEN mérésnél alszik — és az indoklás KIMONDJA a kétértelműséget', () => {
    const decision = PresenceAwake_Util.decide({
      presence: presence({
        isHome: 'no',
        reason: 'Friss mérés (1 perce), de tétlen (27744 mp bevitel nélkül).',
        ageMinutes: 1,
      }),
      now: NOW,
    });

    expect(decision.state).toBe('asleep');
    expect(decision.isAwake).toBe(false);
    expect(decision.signal).toBe('presence-idle');
    // ⚠️ A „tétlen" ⛔ nem bizonyítja az alvást — lehet, hogy csak nincs a gépnél. Az
    // indoklásnak ezt ki kell mondania, mert a KÖVETKEZMÉNY ugyanaz, az OK viszont nem.
    expect(decision.reason).toContain('vagy nincs a gépnél');
  });

  it('a türelmi ablakon TÚLI Discord-válasz már nem tart ébren', () => {
    const decision = PresenceAwake_Util.decide({
      presence: presence({ isHome: 'no', reason: 'tétlen' }),
      lastDiscordReplyAt: new Date(NOW.getTime() - 61 * 60_000),
      now: NOW,
    });

    expect(decision.state).toBe('asleep');
    expect(decision.signal).toBe('presence-idle');
  });

  it('🔴 a JÖVŐBELI Discord-időbélyeg ⛔ NEM tart ébren', () => {
    // ⚠️ Egy elcsúszott óra vagy hibás adat különben ÖRÖK ébrenlétet adna — és a hangszóró
    // bármikor megszólalhatna.
    const decision = PresenceAwake_Util.decide({
      presence: presence({ isHome: 'no', reason: 'tétlen' }),
      lastDiscordReplyAt: new Date(NOW.getTime() + 10 * 60_000),
      now: NOW,
    });

    expect(decision.state).toBe('asleep');
  });
});

describe('| PresenceAwake_Util.decide — 🔴 NINCS ADAT (a harmadik ág)', () => {

  it('🔴 mérés nélkül `unknown`, és az `isAwake` HAMIS — ⛔ nem „valószínűleg ébren"', () => {
    const decision = PresenceAwake_Util.decide({
      presence: presence({
        isHome: 'unknown',
        reason: 'A legutóbbi mérés 240 perces — a figyelő nem fut.',
      }),
      now: NOW,
    });

    expect(decision.state).toBe('unknown');
    // 🔴 EZ A SOR A VÉDELEM: a hívó ⛔ nem tudja véletlenül „ébren"-ként olvasni.
    expect(decision.isAwake).toBe(false);
    expect(decision.signal).toBe('none');
  });

  it('⭐ az indoklás KIMONDJA, hogy a bizonytalanság a csend felé dönt', () => {
    const decision = PresenceAwake_Util.decide({
      presence: presence({ isHome: 'unknown', reason: 'nincs adatkönyvtár' }),
      now: NOW,
    });

    expect(decision.reason).toContain('NEM TUDJUK');
    expect(decision.reason).toContain('téves csend olcsó');
  });

  it('a jelenlét-olvasó indoklása ÁTMEGY — a hibakeresés ebből indul', () => {
    const decision = PresenceAwake_Util.decide({
      presence: presence({ isHome: 'unknown', reason: 'TÁVOLI munkamenet állt fenn (RustDesk)' }),
      now: NOW,
    });

    expect(decision.reason).toContain('RustDesk');
  });

  it('ismeretlen jelenlét + FRISS Discord-válasz ⇒ mégis ébren', () => {
    // ⭐ A Discord-jel önmagában is elég az ÉBRENLÉTHEZ (a hangszóróhoz nem — az a kapu dolga).
    const decision = PresenceAwake_Util.decide({
      presence: presence({ isHome: 'unknown', reason: 'a figyelő nem fut' }),
      lastDiscordReplyAt: new Date(NOW.getTime() - 5 * 60_000),
      now: NOW,
    });

    expect(decision.state).toBe('awake');
    expect(decision.signal).toBe('discord-reply');
  });
});

describe('| PresenceAwake_Util — a MÉRT állandó', () => {

  it('a türelmi ablak PONTOSAN egy óra — az owner szó szerinti kérése', () => {
    // > „hogyha discordon válaszolok, akkor is ébren vagyok, legalább egy órát még."
    expect(PresenceAwake_Util.DISCORD_AWAKE_WINDOW_MS).toBe(60 * 60_000);
  });
});
