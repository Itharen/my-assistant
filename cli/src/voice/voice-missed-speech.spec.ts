import {
  MissedSpeechReporter,
  composeMissedSpeechSummary,
  type MissedSpeech,
} from './voice-missed-speech.js';
import type { sendDiscordMessage } from '../discord/discord.sender.js';

/** Hamis küldő: megjegyzi a szöveget ÉS a cél-csatornát. */
function makeSender(options: { sent?: boolean; throws?: boolean } = {}): {
  send: typeof sendDiscordMessage;
  calls: { text: string; channelId: string | undefined }[];
} {
  const calls: { text: string; channelId: string | undefined }[] = [];

  return {
    send: (async (text: string, _kind: string, channelId?: string) => {
      if (options.throws) throw new Error('a csatorna nem elérhető');

      calls.push({ text: text, channelId: channelId });

      return { sent: options.sent ?? true, detail: 'ok' };
    }) as unknown as typeof sendDiscordMessage,
    calls: calls,
  };
}

describe('composeMissedSpeechSummary — ami nem jutott át, az is látszik', () => {
  it('⭐ darabszámot ÉS másodpercet is mond — a másodperc mutatja a valódi veszteséget', () => {
    const text: string = composeMissedSpeechSummary({
      speakerName: 'Itharen',
      missed: [
        { kind: 'discarded-by-recorder', seconds: 3.5 },
        { kind: 'discarded-by-recorder', seconds: 1.6 },
        { kind: 'recognition-failed' },
      ],
    });

    expect(text).toContain('3 megszólalás NEM jutott át');
    expect(text).toContain('5.1 mp beszéd');
    expect(text).toContain('2× 🎚️');
    expect(text).toContain('1× ❌');
  });

  it('a nem szereplő okot NEM sorolja fel', () => {
    const text: string = composeMissedSpeechSummary({
      speakerName: 'Itharen',
      missed: [{ kind: 'not-understood' }],
    });

    expect(text).toContain('❓');
    expect(text).not.toContain('🎚️');
    expect(text).not.toContain('❌');
  });

  it('másodperc nélkül nem ír ki „0 mp"-et', () => {
    const text: string = composeMissedSpeechSummary({
      speakerName: 'Itharen',
      missed: [{ kind: 'not-understood' }],
    });

    expect(text).not.toContain('mp');
  });
});

describe('MissedSpeechReporter — összevonás, hogy ne spammeljük szét a csatornát', () => {
  it('🔴 a HANG-csatornába küld, nem a fő chatbe', async () => {
    const sender = makeSender();
    const reporter = new MissedSpeechReporter({
      channelId: 'hang-csatorna-1',
      speakerName: 'Itharen',
      send: sender.send,
    });

    reporter.note({ kind: 'recognition-failed' });
    await reporter.flush();

    expect(sender.calls.length).toBe(1);
    expect(sender.calls[0]?.channelId).toBe('hang-csatorna-1');
  });

  it('⭐ több kiesést EGY üzenetbe von össze', async () => {
    const sender = makeSender();
    const reporter = new MissedSpeechReporter({
      channelId: 'c1',
      speakerName: 'Itharen',
      send: sender.send,
    });

    reporter.note({ kind: 'discarded-by-recorder', seconds: 2 });
    reporter.note({ kind: 'discarded-by-recorder', seconds: 3 });
    reporter.note({ kind: 'not-understood' });
    await reporter.flush();

    expect(sender.calls.length).toBe(1);
    expect(sender.calls[0]?.text).toContain('3 megszólalás');
  });

  it('a `maxPending` elérésekor AZONNAL küld, nem vár a csendre', async () => {
    const sender = makeSender();
    const reporter = new MissedSpeechReporter({
      channelId: 'c1',
      speakerName: 'Itharen',
      send: sender.send,
      maxPending: 2,
      quietMs: 60_000,
    });

    reporter.note({ kind: 'recognition-failed' });
    reporter.note({ kind: 'recognition-failed' });

    await Promise.resolve();
    await Promise.resolve();

    expect(sender.calls.length).toBe(1);
  });

  it('⚠️ a küldés közben érkező kiesés a KÖVETKEZŐ összefoglalóba kerül — nem vész el', async () => {
    const sender = makeSender();
    const reporter = new MissedSpeechReporter({
      channelId: 'c1',
      speakerName: 'Itharen',
      send: sender.send,
      quietMs: 60_000,
    });

    reporter.note({ kind: 'recognition-failed' });

    const flushing: Promise<void> = reporter.flush();

    reporter.note({ kind: 'not-understood' });
    await flushing;

    expect(reporter.pendingCount).toBe(1);

    await reporter.flush();

    expect(sender.calls.length).toBe(2);
    expect(sender.calls[1]?.text).toContain('❓');
  });

  it('üres sorral nem küld semmit', async () => {
    const sender = makeSender();
    const reporter = new MissedSpeechReporter({ channelId: 'c1', speakerName: 'I', send: sender.send });

    await reporter.flush();

    expect(sender.calls.length).toBe(0);
  });

  it('⚠️ a küldés BUKÁSA nem dob — csak jelenti', async () => {
    const errors: string[] = [];
    const sender = makeSender({ throws: true });
    const reporter = new MissedSpeechReporter({
      channelId: 'c1',
      speakerName: 'I',
      send: sender.send,
      onError: (d: string): void => void errors.push(d),
    });

    reporter.note({ kind: 'recognition-failed' });

    await expectAsync(reporter.flush()).toBeResolved();
    expect(errors[0]).toContain('nem elérhető');
  });

  it('⚠️ a `sent: false` (kiment, de nem érkezett meg) is JELENTVE van', async () => {
    const errors: string[] = [];
    const sender = makeSender({ sent: false });
    const reporter = new MissedSpeechReporter({
      channelId: 'c1',
      speakerName: 'I',
      send: sender.send,
      onError: (d: string): void => void errors.push(d),
    });

    reporter.note({ kind: 'not-understood' });
    await reporter.flush();

    expect(errors.length).toBe(1);
  });

  it('a `stop()` KIKÜLDI a függőben lévőt — nem dobja el', async () => {
    const sender = makeSender();
    const reporter = new MissedSpeechReporter({
      channelId: 'c1',
      speakerName: 'I',
      send: sender.send,
      quietMs: 60_000,
    });

    reporter.note({ kind: 'recognition-failed' });
    await reporter.stop();

    expect(sender.calls.length).toBe(1);
  });

  it('🔴 a `stop()` MEGVARHATO — a hivo nem lephet tovabb a kuldes elott', async () => {
    const sender = makeSender();
    const reporter = new MissedSpeechReporter({
      channelId: 'c1',
      speakerName: 'I',
      send: sender.send,
      quietMs: 60_000,
    });

    reporter.note({ kind: 'discarded-by-recorder', seconds: 4 });

    const stopping: Promise<void> = reporter.stop();

    expect(stopping instanceof Promise).toBe(true);
    await stopping;
    expect(sender.calls[0]?.text).toContain('4 mp');
  });

  it('a csend-időzítő után magától küld', async () => {
    const sender = makeSender();
    const reporter = new MissedSpeechReporter({
      channelId: 'c1',
      speakerName: 'I',
      send: sender.send,
      quietMs: 5,
    });

    reporter.note({ kind: 'not-understood' });

    await new Promise<void>((resolve): void => void setTimeout(resolve, 40));

    expect(sender.calls.length).toBe(1);
  });

  it('a `pendingCount` a valós várakozó darabszámot adja', () => {
    const reporter = new MissedSpeechReporter({
      channelId: 'c1',
      speakerName: 'I',
      send: makeSender().send,
      quietMs: 60_000,
    });

    const missed: MissedSpeech = { kind: 'discarded-by-recorder', seconds: 1 };

    reporter.note(missed);
    reporter.note(missed);

    expect(reporter.pendingCount).toBe(2);
  });
});
