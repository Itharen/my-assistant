import { decideTick } from './tick.decider.js';
import type { PresenceGateDecision } from '../cast/notify.presence-gate.js';
import type { StatusDigest, StatusTask } from '../status/status.models.js';

const NOW = new Date('2026-09-06T15:00:00+02:00');

function task(ref: string, title: string = 'Teendő'): StatusTask {
  return { ref, title, dueDate: '', notifyAt: '', recurrenceType: 'none' };
}

function digest(overrides: {
  overdue?: StatusTask[];
  withinHour?: StatusTask[];
  isPartial?: boolean;
} = {}): StatusDigest {
  return {
    generatedAt: NOW.toISOString(),
    headline: 'teszt',
    buckets: {
      overdue: overrides.overdue ?? [],
      withinHour: overrides.withinHour ?? [],
      today: [],
      undatedHighPriority: [],
    },
    sources: [],
    isPartial: overrides.isPartial ?? false,
  };
}

function gate(allowed: boolean, isAwake: 'yes' | 'unknown'): PresenceGateDecision {
  return {
    allowed,
    reason: 'teszt',
    signals: { isHome: allowed ? 'yes' : 'unknown', isAwake, awakeSource: 'presence' },
  };
}

describe('decideTick', () => {
  it('stays silent when there is nothing overdue or imminent', () => {
    const decision = decideTick({ digest: digest(), gate: gate(true, 'yes'), now: NOW });

    expect(decision.action).toBe('silent');
    expect(decision.channel).toBe(null);
  });

  it('warns that silence is unreliable when the digest was incomplete', () => {
    const decision = decideTick({
      digest: digest({ isPartial: true }),
      gate: gate(true, 'yes'),
      now: NOW,
    });

    expect(decision.action).toBe('silent');
    expect(decision.reason).toContain('HIÁNYOS');
  });

  it('picks the night branch from wakefulness, not from the clock', () => {
    const decision = decideTick({
      digest: digest({ overdue: [task('a')] }),
      gate: gate(false, 'unknown'),
      now: NOW,
    });

    expect(decision.mode).toBe('nighttime');
    expect(decision.action).toBe('hold');
    expect(decision.channel).toBe(null);
  });

  it('never reaches for the speaker at night', () => {
    const decision = decideTick({
      digest: digest({ withinHour: [task('a')] }),
      gate: gate(true, 'unknown'),
      now: NOW,
    });

    expect(decision.mode).toBe('nighttime');
    expect(decision.channel).not.toBe('speaker');
  });

  it('uses the speaker only when the gate is open and a deadline is within the hour', () => {
    const decision = decideTick({
      digest: digest({ withinHour: [task('a')] }),
      gate: gate(true, 'yes'),
      now: NOW,
    });

    expect(decision.channel).toBe('speaker');
  });

  it('falls back to Discord when the day is active but nothing is imminent', () => {
    const decision = decideTick({
      digest: digest({ overdue: [task('a')] }),
      gate: gate(true, 'yes'),
      now: NOW,
    });

    expect(decision.channel).toBe('discord');
  });

  it('falls back to Discord when awake but not at the machine', () => {
    const decision = decideTick({
      digest: digest({ withinHour: [task('a')] }),
      gate: {
        allowed: false,
        reason: 'nincs a gépénél',
        signals: { isHome: 'unknown', isAwake: 'yes', awakeSource: 'discord-reply' },
      },
      now: NOW,
    });

    expect(decision.mode).toBe('daytime');
    expect(decision.channel).toBe('discord');
  });

  it('does not repeat an item it already raised recently', () => {
    const decision = decideTick({
      digest: digest({ overdue: [task('a')] }),
      gate: gate(true, 'yes'),
      now: NOW,
      notified: { a: new Date(NOW.getTime() - 60 * 60_000).toISOString() },
    });

    expect(decision.action).toBe('silent');
    expect(decision.reason).toContain('szóltunk már');
  });

  it('raises an item again once the suppression window has passed', () => {
    const decision = decideTick({
      digest: digest({ overdue: [task('a')] }),
      gate: gate(true, 'yes'),
      now: NOW,
      notified: { a: new Date(NOW.getTime() - 7 * 60 * 60_000).toISOString() },
    });

    expect(decision.action).toBe('notify');
  });

  it('prefers speaking up over swallowing an item with an unreadable notification timestamp', () => {
    const decision = decideTick({
      digest: digest({ overdue: [task('a')] }),
      gate: gate(true, 'yes'),
      now: NOW,
      notified: { a: 'nem-datum' },
    });

    expect(decision.action).toBe('notify');
  });
});
