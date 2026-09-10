import {
  resolveSendTargets,
  resolveTargetChannelId,
  splitForDiscord,
  type DiscordSendTarget,
} from './discord.sender.js';

describe('splitForDiscord', () => {
  it('leaves a short message in one piece', () => {
    expect(splitForDiscord('Szia!').length).toBe(1);
  });

  it('splits a long message so every part fits the Discord limit', () => {
    const lines: string = Array.from({ length: 400 }, (_, index) => `sor ${index}`).join('\n');
    const parts = splitForDiscord(lines);

    expect(parts.length > 1).toBe(true);
    expect(parts.every((part) => part.length <= 2000)).toBe(true);
  });

  it('splits on line boundaries so sentences stay intact', () => {
    const lines: string = Array.from({ length: 400 }, () => 'x'.repeat(50)).join('\n');
    const parts = splitForDiscord(lines);

    // Egyetlen rész sem kezdődhet vagy végződhet fél soron: minden sor teljes hosszú.
    expect(parts.every((part) => part.split('\n').every((line) => line.length === 50))).toBe(true);
  });

  it('force-splits a single over-long line rather than dropping it', () => {
    const parts = splitForDiscord('y'.repeat(5000));

    expect(parts.length).toBe(3);
    expect(parts.join('').length).toBe(5000);
  });

  it('loses no characters when splitting', () => {
    const lines: string = Array.from({ length: 300 }, (_, index) => `tétel ${index}`).join('\n');
    const parts = splitForDiscord(lines);

    expect(parts.join('\n')).toBe(lines);
  });
});

describe('resolveTargetChannelId — 🔴 a MÉRT hiba osztálya (2026-09-07 és 2026-09-09)', () => {

  it('⭐ a KIFEJEZETTEN kért csatorna nyer — ez a hang-csatornai tükör lényege', () => {
    expect(resolveTargetChannelId('voice-123', 'text-999')).toBe('voice-123');
  });

  it('üres kérésnél a fő szöveges csatorna', () => {
    expect(resolveTargetChannelId('', 'text-999')).toBe('text-999');
    expect(resolveTargetChannelId(undefined, 'text-999')).toBe('text-999');
  });

  it('⚠️ CSUPA SZÓKÖZ nem cél — különben némán a rossz helyre küldenénk', () => {
    expect(resolveTargetChannelId('   ', 'text-999')).toBe('text-999');
  });

  it('⛔ ha egyik sincs, ÜRESET ad — a hívó ebből tudja, hogy nincs hova küldeni', () => {
    expect(resolveTargetChannelId('', undefined)).toBe('');
  });
});


describe('resolveSendTargets — 🔊 MINDEN üzenet KÉT helyre, automatikusan', () => {

  it('🔴 alapból a FŐ ÉS a HANG-csatorna is cél — a `--voice` kapcsoló visszavonva', () => {
    // > Owner, 2026-09-10 18:27: „Minden üzeneted… automatikusan kell jöjjön a Voice
    // > csatornára és a privát DM csatornára… Semmiképpen ne kelljen neked kétszer küldeni."
    const targets: DiscordSendTarget[] = resolveSendTargets(undefined, 'text-999', 'voice-123');

    expect(targets).toEqual([
      { channelId: 'text-999', role: 'primary' },
      { channelId: 'voice-123', role: 'voice' },
    ]);
  });

  it('⛔ a KIFEJEZETT cél NEM duplázódik — erre épül a hang-tükör és a késve feloldott átirat', () => {
    // ⚠️ Ha itt is duplázna, a hangüzenet-tükör a fő csatornába IS kimenne — pontosan az a
    // hiba, amit 2026-09-07-én már elkövettünk (az owner „semmilyen reakciót nem látott").
    expect(resolveSendTargets('reply-777', 'text-999', 'voice-123'))
      .toEqual([ { channelId: 'reply-777', role: 'primary' } ]);
  });

  it('a hang-csatorna nélkül a viselkedés a RÉGI — csak a fő csatorna', () => {
    expect(resolveSendTargets(undefined, 'text-999', undefined))
      .toEqual([ { channelId: 'text-999', role: 'primary' } ]);
    expect(resolveSendTargets(undefined, 'text-999', '   '))
      .toEqual([ { channelId: 'text-999', role: 'primary' } ]);
  });

  it('⚠️ AZONOS azonosítónál egyszer küldünk — különben ugyanazt látná kétszer, ugyanott', () => {
    expect(resolveSendTargets(undefined, 'same-1', 'same-1'))
      .toEqual([ { channelId: 'same-1', role: 'primary' } ]);
  });

  it('⛔ ha SEMMI nincs beállítva, ÜRES a lista — a hívó ebből tudja, hogy nincs hova küldeni', () => {
    expect(resolveSendTargets(undefined, undefined, undefined)).toEqual([]);
  });

  it('csak hang-csatorna esetén is van cél — a fő csatorna hiánya nem némít el', () => {
    expect(resolveSendTargets(undefined, '', 'voice-123'))
      .toEqual([ { channelId: 'voice-123', role: 'voice' } ]);
  });
});
