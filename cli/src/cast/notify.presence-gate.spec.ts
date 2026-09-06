import { evaluatePresenceGate } from './notify.presence-gate.js';
import type { PresenceSnapshot } from '../presence/presence.reader.js';

const NOW = new Date('2026-09-06T15:00:00+02:00');

function presence(isHome: PresenceSnapshot['isHome'], reason: string = 'teszt'): PresenceSnapshot {
  return { isHome, reason };
}

/** Adott percekkel a NOW előtti időpont. */
function minutesAgo(minutes: number): Date {
  return new Date(NOW.getTime() - minutes * 60_000);
}

describe('evaluatePresenceGate', () => {
  it('allows the speaker when the owner is at the computer', () => {
    const decision = evaluatePresenceGate({ presence: presence('yes'), now: NOW });

    expect(decision.allowed).toBe(true);
    expect(decision.signals.awakeSource).toBe('presence');
  });

  it('blocks when presence is unknown — "unknown" is never treated as "probably yes"', () => {
    const decision = evaluatePresenceGate({ presence: presence('unknown'), now: NOW });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('nem tudjuk');
  });

  it('blocks when the owner is measurably idle at the machine', () => {
    const decision = evaluatePresenceGate({ presence: presence('no'), now: NOW });

    expect(decision.allowed).toBe(false);
  });

  it('still blocks the speaker after a recent Discord reply — awake is not the same as home', () => {
    const decision = evaluatePresenceGate({
      presence: presence('unknown'),
      lastDiscordReplyAt: minutesAgo(5),
      now: NOW,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.signals.isAwake).toBe('yes');
    expect(decision.signals.awakeSource).toBe('discord-reply');
    expect(decision.reason).toContain('Discordon szólj');
  });

  it('treats a Discord reply older than an hour as no longer proving wakefulness', () => {
    const decision = evaluatePresenceGate({
      presence: presence('unknown'),
      lastDiscordReplyAt: minutesAgo(61),
      now: NOW,
    });

    expect(decision.signals.isAwake).toBe('unknown');
    expect(decision.signals.awakeSource).toBe('none');
  });

  it('keeps a Discord reply exactly at the one-hour boundary valid', () => {
    const decision = evaluatePresenceGate({
      presence: presence('unknown'),
      lastDiscordReplyAt: minutesAgo(60),
      now: NOW,
    });

    expect(decision.signals.isAwake).toBe('yes');
  });

  it('ignores a Discord timestamp from the future instead of trusting it', () => {
    const decision = evaluatePresenceGate({
      presence: presence('unknown'),
      lastDiscordReplyAt: new Date(NOW.getTime() + 60_000),
      now: NOW,
    });

    expect(decision.signals.isAwake).toBe('unknown');
  });

  it('prefers the presence signal even when a Discord reply also exists', () => {
    const decision = evaluatePresenceGate({
      presence: presence('yes'),
      lastDiscordReplyAt: minutesAgo(5),
      now: NOW,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.signals.awakeSource).toBe('presence');
  });
});
