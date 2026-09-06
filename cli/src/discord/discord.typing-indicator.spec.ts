import { decideTyping, TypingIndicator, TYPING_MAX_MS } from './discord.typing-indicator.js';

describe('decideTyping', () => {
  const now: number = Date.parse('2026-09-06T20:00:00.000Z');

  it('stays silent when there is nothing pending and nothing owed', () => {
    const decision = decideTyping({ pendingCount: 0, owesReply: false, now });

    expect(decision.shouldType).toBe(false);
  });

  it('signals while messages are still waiting to be handed over', () => {
    const decision = decideTyping({ pendingCount: 2, owesReply: false, now });

    expect(decision.shouldType).toBe(true);
    expect(decision.reason).toContain('2');
  });

  it('signals while a reply is owed, even with an empty batch', () => {
    const decision = decideTyping({ pendingCount: 0, owesReply: true, now });

    expect(decision.shouldType).toBe(true);
  });

  it('gives up after the safety cap so the indicator never runs forever', () => {
    const decision = decideTyping({
      pendingCount: 5,
      owesReply: true,
      typingStartedAt: now - TYPING_MAX_MS,
      now,
    });

    expect(decision.shouldType).toBe(false);
    expect(decision.reason).toContain('Biztonsági szelep');
  });

  it('keeps signalling just below the safety cap', () => {
    const decision = decideTyping({
      pendingCount: 1,
      owesReply: false,
      typingStartedAt: now - (TYPING_MAX_MS - 1_000),
      now,
    });

    expect(decision.shouldType).toBe(true);
  });
});

describe('TypingIndicator', () => {
  it('sends a typing signal when work is outstanding', async () => {
    let sent: number = 0;
    const indicator = new TypingIndicator(
      async (): Promise<void> => { sent += 1; },
      async () => ({ pendingCount: 1, owesReply: false }),
    );

    await indicator.tick();

    expect(sent).toBe(1);
  });

  it('sends nothing when there is no outstanding work', async () => {
    let sent: number = 0;
    const indicator = new TypingIndicator(
      async (): Promise<void> => { sent += 1; },
      async () => ({ pendingCount: 0, owesReply: false }),
    );

    await indicator.tick();

    expect(sent).toBe(0);
  });

  it('never throws when the signal fails — it reports instead', async () => {
    const problems: string[] = [];
    const indicator = new TypingIndicator(
      async (): Promise<void> => { throw new Error('csatorna nem elérhető'); },
      async () => ({ pendingCount: 1, owesReply: false }),
      (message: string): void => { problems.push(message); },
    );

    const decision = await indicator.tick();

    expect(decision.shouldType).toBe(false);
    expect(problems.length).toBe(1);
    expect(problems[0]).toContain('csatorna nem elérhető');
  });

  it('stops signalling once the safety cap is reached', async () => {
    let sent: number = 0;
    const indicator = new TypingIndicator(
      async (): Promise<void> => { sent += 1; },
      async () => ({ pendingCount: 1, owesReply: false }),
    );

    const start: number = Date.parse('2026-09-06T20:00:00.000Z');

    await indicator.tick(start);
    await indicator.tick(start + TYPING_MAX_MS);

    expect(sent).toBe(1);
  });

  it('restarts the clock after a quiet period, so a later message signals again', async () => {
    let sent: number = 0;
    let pendingCount: number = 1;
    const indicator = new TypingIndicator(
      async (): Promise<void> => { sent += 1; },
      async () => ({ pendingCount, owesReply: false }),
    );

    const start: number = Date.parse('2026-09-06T20:00:00.000Z');

    await indicator.tick(start);

    // Elcsendesedik — a számláló nullázódik.
    pendingCount = 0;
    await indicator.tick(start + 1_000);

    // Új üzenet jóval a régi korlát után: mégis jeleznünk kell.
    pendingCount = 1;
    await indicator.tick(start + TYPING_MAX_MS + 5_000);

    expect(sent).toBe(2);
  });
});
