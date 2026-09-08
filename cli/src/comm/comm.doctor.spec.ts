// A HANG-JELENLÉT diagnózisának tesztjei.
//
// 🔴 MIÉRT LÉTEZIK EZ A FÁJL: a hang-lánc **némán** tud meghalni. Ha a bot nincs bent a
// csatornában, az owner beszél, és **semmi** nem történik — se hiba, se visszajelzés.
// A `ma comm doctor` pontosan ezt hivatott elkapni, tehát a döntésének MINDEN ága számít:
// egy tévedő diagnózis rosszabb, mint a diagnózis hiánya, mert megnyugtat.

import {
  decideVoicePresenceCheck,
  VOICE_PRESENCE_CHECK_ID,
  VOICE_PRESENCE_LABEL,
} from './comm.doctor.js';
import type { DiscordHeartbeat, HeartbeatStatus } from '../discord/discord.heartbeat.js';

/** Élő életjel, tetszőleges hang-szegmenssel. */
function alive(voice?: DiscordHeartbeat['voice']): HeartbeatStatus {
  return {
    state: 'alive',
    ageMs: 20_000,
    heartbeat: {
      updatedAt: '2026-09-08T08:30:00+02:00',
      botTag: 'Honnie#6234',
      processedCount: 7,
      ...(voice ? { voice: voice } : {}),
    },
  };
}

/** A tölcsér-számlálók, amik minden hang-szegmensben kötelezőek. */
const emptyFunnel = {
  speechStarts: 0,
  filesOpened: 0,
  filesDelivered: 0,
  filesDropped: 0,
  lostAudioSeconds: 0,
};

describe('decideVoicePresenceCheck — bent ül-e a bot a hang-csatornában', () => {

  it('minden ág ugyanazt az azonosítót és címkét viseli', () => {
    // ⭐ Enélkül a doctor kimenete ágtól függően más néven mutatná ugyanazt a bajt.
    const states: HeartbeatStatus[] = [
      { state: 'absent' },
      alive(),
      alive({ ...emptyFunnel, joined: true }),
      alive({ ...emptyFunnel, joined: false }),
    ];

    for (const status of states) {
      const check = decideVoicePresenceCheck(status);

      expect(check.id).toBe(VOICE_PRESENCE_CHECK_ID);
      expect(check.label).toBe(VOICE_PRESENCE_LABEL);
      expect(check.area).toBe('discord');
    }
  });

  describe('🔴 a legfontosabb ág: BE VAN ÁLLÍTVA, DE NINCS BENT', () => {

    it('`broken` — mert az odabeszélt hang sehova nem jut el', () => {
      const check = decideVoicePresenceCheck(alive({ ...emptyFunnel, joined: false }));

      expect(check.status).toBe('broken');
    });

    it('a leírás KIMONDJA a következményt, nem csak az állapotot', () => {
      const check = decideVoicePresenceCheck(alive({ ...emptyFunnel, joined: false }));

      // ⚠️ A „joined: false" önmagában semmit nem mond az ownernek. A KÖVETKEZMÉNY mond.
      expect(check.detail).toContain('NINCS BENT');
      expect(check.detail).toContain('sehova nem jut el');
    });

    it('AD teendőt — konkrét naplókóddal, nem „nézd meg a logokat"-tal', () => {
      const check = decideVoicePresenceCheck(alive({ ...emptyFunnel, joined: false }));

      expect(check.remedy).toContain('MA-VOICE-JOIN-FAILED');
    });
  });

  describe('⚠️ a RÉGI formátumú életjel — a legkönnyebben elrontható ág', () => {

    it('`unknown`, NEM `broken` — a hiányzó mező nem bizonyíték', () => {
      // 🔴 Ez a mai nap egy MÉRT hibája volt: a `readHeartbeat` ELDOBTA a `voice` mezőt,
      // és emiatt egy tökéletesen működő bot is „nincs bent"-nek látszott volna.
      const check = decideVoicePresenceCheck(alive({ ...emptyFunnel }));

      expect(check.status).toBe('unknown');
    });

    it('SOHA nem állítja, hogy nincs bent', () => {
      const check = decideVoicePresenceCheck(alive({ ...emptyFunnel }));

      expect(check.detail).not.toContain('NINCS BENT');
      expect(check.status).not.toBe('broken');
    });

    it('megmondja, mitől fog látszani', () => {
      const check = decideVoicePresenceCheck(alive({ ...emptyFunnel }));

      expect(check.remedy).toContain('újraindul');
    });
  });

  describe('nincs hang-szegmens ⇒ nincs beállítva', () => {

    it('`missing` — ez HIÁNY, nem HIBA', () => {
      const check = decideVoicePresenceCheck(alive());

      expect(check.status).toBe('missing');
    });

    it('a teendő megnevezi a két környezeti változót', () => {
      const check = decideVoicePresenceCheck(alive());

      expect(check.remedy).toContain('MA_DISCORD_GUILD_ID');
      expect(check.remedy).toContain('MA_DISCORD_VOICE_CHANNEL_ID');
    });
  });

  describe('nem él a figyelő ⇒ a hang-jelenlétről sem tudunk semmit', () => {

    it('`stale` életjelnél `unknown`', () => {
      expect(decideVoicePresenceCheck({ state: 'stale', ageMs: 900_000 }).status).toBe('unknown');
    });

    it('`absent` életjelnél `unknown`', () => {
      expect(decideVoicePresenceCheck({ state: 'absent' }).status).toBe('unknown');
    });

    it('a figyelő halálát NEM keresztelli át hang-hibává', () => {
      // ⚠️ Két külön baj: a figyelő halott VAGY a bot nincs bent. Az összemosás rossz
      // irányba küldi a javítást.
      const check = decideVoicePresenceCheck({ state: 'stale', ageMs: 900_000 });

      expect(check.status).not.toBe('broken');
      expect(check.remedy).toContain('Discord-figyelőt');
    });

    it('⛔ NEM néz bele a hang-adatba, ha a figyelő nem él — a régi adat félrevezetne', () => {
      // Az életjel-fájl megmarad a figyelő halála után is: a benne álló `joined: true`
      // ilyenkor egy HALOTT folyamat állítása.
      const check = decideVoicePresenceCheck({
        state: 'stale',
        ageMs: 900_000,
        heartbeat: {
          updatedAt: '2026-09-08T06:00:00+02:00',
          botTag: 'Honnie#6234',
          processedCount: 1,
          voice: { ...emptyFunnel, joined: true },
        },
      });

      expect(check.status).toBe('unknown');
      expect(check.status).not.toBe('ok');
    });
  });

  describe('✅ bent van', () => {

    it('`ok`', () => {
      expect(decideVoicePresenceCheck(alive({ ...emptyFunnel, joined: true })).status).toBe('ok');
    });

    it('kiírja a csatorna nevét, ha ismert — MELYIK csatornába beszéljen', () => {
      const check = decideVoicePresenceCheck(alive({
        ...emptyFunnel,
        joined: true,
        channelName: 'honnie-place',
      }));

      expect(check.detail).toContain('honnie-place');
    });

    it('név nélkül sem törik el', () => {
      const check = decideVoicePresenceCheck(alive({ ...emptyFunnel, joined: true }));

      expect(check.status).toBe('ok');
      expect(check.detail).toContain('Bent ül');
    });

    it('NEM ad teendőt, ha nincs baj', () => {
      const check = decideVoicePresenceCheck(alive({ ...emptyFunnel, joined: true }));

      expect(check.remedy).toBeUndefined();
    });
  });
});
