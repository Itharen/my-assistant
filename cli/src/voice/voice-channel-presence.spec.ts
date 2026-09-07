import {
  VoiceChannelPresence,
  describeChannelReadiness,
  readVoicePresenceConfig,
} from './voice-channel-presence.js';
import type { VoiceBasedChannel } from 'discord.js';

/** Csak a `describeChannelReadiness` által OLVASOTT mezők — a teljes discord.js típus nem kell. */
function makeChannel(overrides: { name?: string; joinable?: boolean } = {}): VoiceBasedChannel {
  return {
    id: 'c1',
    name: overrides.name ?? 'honnie-place',
    joinable: overrides.joinable ?? true,
  } as unknown as VoiceBasedChannel;
}

describe('voice-channel-presence', () => {

  describe('readVoicePresenceConfig', () => {
    const saved: Record<string, string | undefined> = {};

    beforeEach(() => {
      saved['guild'] = process.env['MA_DISCORD_GUILD_ID'];
      saved['channel'] = process.env['MA_DISCORD_VOICE_CHANNEL_ID'];
    });

    afterEach(() => {
      if (saved['guild'] === undefined) delete process.env['MA_DISCORD_GUILD_ID'];
      else process.env['MA_DISCORD_GUILD_ID'] = saved['guild'];

      if (saved['channel'] === undefined) delete process.env['MA_DISCORD_VOICE_CHANNEL_ID'];
      else process.env['MA_DISCORD_VOICE_CHANNEL_ID'] = saved['channel'];
    });

    it('mindkét azonosítót beolvassa', () => {
      process.env['MA_DISCORD_GUILD_ID'] = 'g1';
      process.env['MA_DISCORD_VOICE_CHANNEL_ID'] = 'c1';

      expect(readVoicePresenceConfig()).toEqual({ guildId: 'g1', channelId: 'c1' });
    });

    it('🔴 FÉL konfigurációnál `null` — nem próbálkozik üres azonosítóval', () => {
      process.env['MA_DISCORD_GUILD_ID'] = 'g1';
      delete process.env['MA_DISCORD_VOICE_CHANNEL_ID'];

      expect(readVoicePresenceConfig()).toBeNull();
    });
  });

  describe('describeChannelReadiness', () => {
    it('a hiányzó csatornát MEGKÜLÖNBÖZTETI a jog-hiánytól — más a teendő', () => {
      const missing = describeChannelReadiness(null);
      const noRight = describeChannelReadiness(makeChannel({ joinable: false }));

      expect(missing.ready).toBe(false);
      expect(missing.remedy).toContain('MA_DISCORD_VOICE_CHANNEL_ID');

      expect(noRight.ready).toBe(false);
      expect(noRight.remedy).toContain('Connect');
    });

    it('⚠️ a jog-hiány üzenete MEGNEVEZI a csatornát — enélkül nem tudni, melyikről van szó', () => {
      expect(describeChannelReadiness(makeChannel({ joinable: false, name: 'honnie-place' })).detail)
        .toContain('honnie-place');
    });

    it('nyitott csatornánál kész', () => {
      const verdict = describeChannelReadiness(makeChannel());

      expect(verdict.ready).toBe(true);
      expect(verdict.remedy).toBeUndefined();
    });
  });

  describe('join', () => {
    /** Hamis kliens: a megadott guild/csatorna-válaszokat adja. */
    function makeClient(options: {
      channel?: unknown;
      guildName?: string;
      throwOn?: 'guild' | 'channel';
    }): { guilds: { fetch: (id: string) => Promise<unknown> } } {
      return {
        guilds: {
          fetch: async (): Promise<unknown> => {
            if (options.throwOn === 'guild') throw new Error('nincs ilyen szerver');

            return {
              id: 'g1',
              name: options.guildName ?? 'FDP-Johnnies',
              voiceAdapterCreator: (): unknown => ({}),
              channels: {
                fetch: async (): Promise<unknown> => {
                  if (options.throwOn === 'channel') throw new Error('nincs ilyen csatorna');

                  return options.channel ?? null;
                },
              },
            };
          },
        },
      };
    }

    it('🔴 NEM DOB, ha a csatorna nincs meg — leíró eredményt ad TEENDŐVEL', async () => {
      const presence = new VoiceChannelPresence();

      const result = await presence.join(
        makeClient({ channel: null }) as never,
        { guildId: 'g1', channelId: 'c1' },
      );

      expect(result.joined).toBe(false);
      expect(result.guildName).toBe('FDP-Johnnies');
      expect(result.remedy).toBeTruthy();
      expect(presence.isConnected).toBe(false);
    });

    it('🔴 a NEM-HANG csatornát elutasítja — nem próbál belépni szöveges csatornába', async () => {
      const presence = new VoiceChannelPresence();
      const textChannel = { name: 'general', id: 'c1', isVoiceBased: (): boolean => false };

      const result = await presence.join(
        makeClient({ channel: textChannel }) as never,
        { guildId: 'g1', channelId: 'c1' },
      );

      expect(result.joined).toBe(false);
      expect(result.detail).toContain('nem található');
    });

    it('⚠️ a jog-hiányt NÉVVEL jelenti, nem időtúllépéssel', async () => {
      const presence = new VoiceChannelPresence();
      const channel = {
        name: 'honnie-place', id: 'c1', joinable: false, isVoiceBased: (): boolean => true,
      };

      const result = await presence.join(
        makeClient({ channel: channel }) as never,
        { guildId: 'g1', channelId: 'c1' },
      );

      expect(result.joined).toBe(false);
      expect(result.detail).toContain('honnie-place');
      expect(result.remedy).toContain('Connect');
    });

    it('🔴 hálózati hibát SEM dob tovább — a hang-jelenlét nem döntheti meg a szervert', async () => {
      const presence = new VoiceChannelPresence();

      const result = await presence.join(
        makeClient({ throwOn: 'guild' }) as never,
        { guildId: 'g1', channelId: 'c1' },
      );

      expect(result.joined).toBe(false);
      expect(result.detail).toContain('nincs ilyen szerver');
      expect(result.remedy).toBeTruthy();
    });
  });

  describe('leave', () => {
    it('kapcsolat nélkül is biztonságos — nem dob', () => {
      const presence = new VoiceChannelPresence();

      expect((): void => presence.leave()).not.toThrow();
      expect(presence.isConnected).toBe(false);
    });
  });
});
