import { filterIncomingMessage, type IncomingDiscordMessage } from './discord.message-filter.js';
import type { DiscordAttachment } from './discord.voice-message.js';

const CONFIG = { allowedChannelId: 'chan-1', allowedAuthorId: 'owner-1' };

function message(overrides: Partial<IncomingDiscordMessage> = {}): IncomingDiscordMessage {
  return {
    messageId: overrides.messageId ?? 'm1',
    channelId: overrides.channelId ?? 'chan-1',
    authorId: overrides.authorId ?? 'owner-1',
    authorName: overrides.authorName ?? 'Owner',
    isFromBot: overrides.isFromBot ?? false,
    content: overrides.content ?? 'Szia, mi a helyzet?',
    ...(overrides.attachments ? { attachments: overrides.attachments } : {}),
  };
}

function voiceAttachment(): DiscordAttachment {
  return {
    id: 'a1',
    url: 'https://cdn.discordapp.com/attachments/1/2/voice-message.ogg',
    name: 'voice-message.ogg',
    contentType: 'audio/ogg',
    size: 9_000,
  };
}

describe('filterIncomingMessage', () => {
  it('accepts an owner message from the dedicated channel', () => {
    expect(filterIncomingMessage(message(), CONFIG).accepted).toBe(true);
  });

  it('rejects everything while the configuration is incomplete', () => {
    const verdict = filterIncomingMessage(message(), { allowedChannelId: '', allowedAuthorId: '' });

    expect(verdict.accepted).toBe(false);
    expect(verdict.reason).toContain('Hiányos konfiguráció');
  });

  it('rejects our own bot messages so a reply cannot loop back as new input', () => {
    const verdict = filterIncomingMessage(message({ isFromBot: true }), CONFIG);

    expect(verdict.accepted).toBe(false);
    expect(verdict.reason).toContain('visszhang-hurok');
  });

  it('rejects a message from another channel', () => {
    expect(filterIncomingMessage(message({ channelId: 'other' }), CONFIG).accepted).toBe(false);
  });

  it('rejects a message from anyone other than the owner', () => {
    const verdict = filterIncomingMessage(message({ authorId: 'stranger', authorName: 'Idegen' }), CONFIG);

    expect(verdict.accepted).toBe(false);
    expect(verdict.reason).toContain('Idegen');
  });

  it('rejects a whitespace-only message instead of forwarding an empty prompt', () => {
    expect(filterIncomingMessage(message({ content: '   \n  ' }), CONFIG).accepted).toBe(false);
  });

  it('checks the bot flag before the channel, so an echo is never mislabelled', () => {
    const verdict = filterIncomingMessage(message({ isFromBot: true, channelId: 'other' }), CONFIG);

    expect(verdict.reason).toContain('visszhang-hurok');
  });

  it('reports missing configuration even when the message itself looks valid', () => {
    const verdict = filterIncomingMessage(message(), { allowedChannelId: 'chan-1', allowedAuthorId: '' });

    expect(verdict.accepted).toBe(false);
    expect(verdict.reason).toContain('Hiányos konfiguráció');
  });
});

describe('filterIncomingMessage — HANGUZENET (regresszio)', () => {

  it('elfogadja a hanguzenetet, pedig URES a szovege', () => {
    // 🔴 EZ VOLT A HIBA (merve 2026-09-07): a Discord-hanguzenet ures `content`-tel
    // erkezik, es a szuro "ures uzenet"-kent NEMAN ELDOBTA. Emiatt a hanguzenetek
    // sosem jutottak el hozzam.
    const verdict = filterIncomingMessage(
      message({ content: '', attachments: [voiceAttachment()] }),
      CONFIG,
    );

    expect(verdict.accepted).toBe(true);
    expect(verdict.hasAudio).toBe(true);
  });

  it('kiseroszoveges hanguzenetet is elfogad, es jelzi a hangot', () => {
    const verdict = filterIncomingMessage(
      message({ content: 'ezt hallgasd meg', attachments: [voiceAttachment()] }),
      CONFIG,
    );

    expect(verdict.accepted).toBe(true);
    expect(verdict.hasAudio).toBe(true);
  });

  it('a hang NEM keruli meg a biztonsagi hatart — idegen kuldo elutasitva', () => {
    const verdict = filterIncomingMessage(
      message({ content: '', authorId: 'valaki-mas', attachments: [voiceAttachment()] }),
      CONFIG,
    );

    expect(verdict.accepted).toBe(false);
  });

  it('a hang NEM keruli meg a csatorna-hatart sem', () => {
    const verdict = filterIncomingMessage(
      message({ content: '', channelId: 'mas-csatorna', attachments: [voiceAttachment()] }),
      CONFIG,
    );

    expect(verdict.accepted).toBe(false);
  });

  it('a bot sajat hanguzenete sem jon at (visszhang-hurok)', () => {
    const verdict = filterIncomingMessage(
      message({ content: '', isFromBot: true, attachments: [voiceAttachment()] }),
      CONFIG,
    );

    expect(verdict.accepted).toBe(false);
  });

  it('a csak-kep uzenetet tovabbra is elutasitja, de MASKENT indokolja', () => {
    const verdict = filterIncomingMessage(
      message({ content: '', attachments: [{
        id: 'i1', url: 'https://x/y.png', name: 'kep.png', contentType: 'image/png', size: 10,
      }] }),
      CONFIG,
    );

    expect(verdict.accepted).toBe(false);
    expect(verdict.reason).toContain('nem-hang');
  });

  it('a valoban ures uzenet indoka nem emliti a csatolmanyt', () => {
    const verdict = filterIncomingMessage(message({ content: '   ' }), CONFIG);

    expect(verdict.accepted).toBe(false);
    expect(verdict.reason).toContain('Üres üzenet');
  });

  it('a sima szoveges uzenetnel a hasAudio nem igaz', () => {
    expect(filterIncomingMessage(message(), CONFIG).hasAudio).toBeFalsy();
  });
});
