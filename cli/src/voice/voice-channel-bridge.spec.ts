import {
  VOICE_CHANNEL_MARKER,
  VoiceChannelBridge,
  composeVoiceChannelEntry,
  composeVoiceMirror,
} from './voice-channel-bridge.js';
import type { DiscordInboundMessage } from '../discord/discord.models.js';

/** Hamis köteg-tár: megjegyzi, mit tettek bele, és tud duplikátumot jelezni. */
function makeStore(options: { rejectAll?: boolean } = {}): {
  store: unknown;
  appended: DiscordInboundMessage[];
} {
  const appended: DiscordInboundMessage[] = [];

  return {
    store: {
      append: async (message: DiscordInboundMessage): Promise<boolean> => {
        if (options.rejectAll) return false;

        appended.push(message);

        return true;
      },
    },
    appended: appended,
  };
}

/** Hamis küldő: rögzíti a kimenő szöveget. */
function makeSender(options: { fails?: boolean } = {}): {
  send: unknown;
  sent: string[];
} {
  const sent: string[] = [];

  return {
    send: async (text: string): Promise<unknown> => {
      if (options.fails) return { sent: false, partCount: 0, detail: 'nem ment' };

      sent.push(text);

      return { sent: true, partCount: 1, detail: 'Elküldve.' };
    },
    sent: sent,
  };
}

const OWNER = {
  messageId: 'seg-1',
  channelId: 'voice-1',
  speakerId: 'owner-1',
  speakerName: 'Itharen',
  transcript: 'Szia, hallasz engem?',
};

describe('voice-channel-bridge', () => {

  describe('composeVoiceChannelEntry', () => {
    it('MEGKÜLÖNBÖZTETHETŐEN jelöli — nem keverhető a hangüzenettel', () => {
      const entry = composeVoiceChannelEntry({ transcript: 'teszt.', speakerName: 'Itharen' });

      expect(entry).toContain(VOICE_CHANNEL_MARKER);
      expect(entry).toContain('élő beszéde');
      expect(entry).toContain('teszt.');
    });

    it('a gépi-átirat flag rajta van — ez nem gépelt szöveg', () => {
      expect(composeVoiceChannelEntry({ transcript: 'teszt.', speakerName: 'x' }))
        .toContain('gépi átirat');
    });
  });

  describe('composeVoiceMirror', () => {
    it('az owner beszédénél azt írja, hogy HALLOTTAM', () => {
      const text = composeVoiceMirror({ speaker: 'owner', speakerName: 'Itharen', text: 'szia' });

      expect(text).toContain('hallottam');
      expect(text).toContain('szia');
    });

    it('⭐ a SAJÁT beszédemnél azt, hogy MONDTAM — ez buktatja le a rossz kiejtést', () => {
      const text = composeVoiceMirror({ speaker: 'assistant', speakerName: 'Honnie', text: 'rendben' });

      expect(text).toContain('mondtam');
      expect(text).toContain('rendben');
    });
  });

  describe('handleOwnerSpeech', () => {
    it('kötegbe teszi ÉS tükröz', async () => {
      const { store, appended } = makeStore();
      const { send, sent } = makeSender();
      const bridge = new VoiceChannelBridge(store as never, send as never);

      const result = await bridge.handleOwnerSpeech(OWNER);

      expect(result.queued).toBe(true);
      expect(result.mirrored).toBe(true);
      expect(appended.length).toBe(1);
      expect(appended[0]!.content).toContain(VOICE_CHANNEL_MARKER);
      expect(sent.length).toBe(1);
    });

    it('🔴 DUPLIKÁTUMNÁL NEM tükröz — az owner azt hinné, kétszer mondta', async () => {
      const { store } = makeStore({ rejectAll: true });
      const { send, sent } = makeSender();
      const bridge = new VoiceChannelBridge(store as never, send as never);

      const result = await bridge.handleOwnerSpeech(OWNER);

      expect(result.queued).toBe(false);
      expect(sent).toEqual([]);
    });

    it('üres átiratra nem csinál semmit', async () => {
      const { store, appended } = makeStore();
      const { send, sent } = makeSender();
      const bridge = new VoiceChannelBridge(store as never, send as never);

      const result = await bridge.handleOwnerSpeech({ ...OWNER, transcript: '   ' });

      expect(result.queued).toBe(false);
      expect(appended).toEqual([]);
      expect(sent).toEqual([]);
    });

    it('⚠️ ha a tükör bukik, a KÖTEGBE TÉTEL akkor is megtörtént — és ezt kimondja', async () => {
      const { store, appended } = makeStore();
      const { send } = makeSender({ fails: true });
      const bridge = new VoiceChannelBridge(store as never, send as never);

      const result = await bridge.handleOwnerSpeech(OWNER);

      // A tartalom eljut hozzám — ez a fontosabb. A tükör hiánya külön látszik.
      expect(result.queued).toBe(true);
      expect(result.mirrored).toBe(false);
      expect(appended.length).toBe(1);
      expect(result.detail).toContain('NEM ment ki');
    });
  });

  describe('mirrorOwnSpeech', () => {
    it('🔴 a SAJÁT beszédem NEM kerül a kötegbe — különben owner-üzenetként jönne vissza', async () => {
      const { store, appended } = makeStore();
      const { send, sent } = makeSender();
      const bridge = new VoiceChannelBridge(store as never, send as never);

      const result = await bridge.mirrorOwnSpeech({ text: 'Rendben, megnézem.', assistantName: 'Honnie' });

      expect(result.mirrored).toBe(true);
      expect(result.queued).toBe(false);
      expect(appended).toEqual([]);
      expect(sent[0]).toContain('mondtam');
    });
  });
});
