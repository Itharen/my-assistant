import { buildHeadline, classifyTasks } from './status.classifier.js';
import type { StatusTask } from './status.models.js';

// Helyi idő szerinti dél — így a „ma vége" határ egyértelmű, és nincs nap-átfordulás.
const NOW = new Date(2026, 8, 6, 12, 0, 0);

function task(overrides: Partial<StatusTask> = {}): StatusTask {
  return {
    ref: overrides.ref ?? 'org:task:1',
    title: overrides.title ?? 'Teszt feladat',
    priority: overrides.priority,
    dueDate: overrides.dueDate ?? '',
    notifyAt: overrides.notifyAt ?? '',
    recurrenceType: overrides.recurrenceType ?? 'none',
  };
}

function atLocal(hour: number, minute: number = 0, dayOffset: number = 0): string {
  return new Date(2026, 8, 6 + dayOffset, hour, minute, 0).toISOString();
}

describe('classifyTasks', () => {
  it('puts a past deadline into the overdue bucket', () => {
    const buckets = classifyTasks([task({ dueDate: atLocal(9) })], NOW);

    expect(buckets.overdue.length).toBe(1);
    expect(buckets.today.length).toBe(0);
  });

  it('puts a deadline inside the next hour into the within-hour bucket, not today', () => {
    const buckets = classifyTasks([task({ dueDate: atLocal(12, 30) })], NOW);

    expect(buckets.withinHour.length).toBe(1);
    expect(buckets.today.length).toBe(0);
  });

  it('puts a later deadline on the same day into the today bucket', () => {
    const buckets = classifyTasks([task({ dueDate: atLocal(22) })], NOW);

    expect(buckets.today.length).toBe(1);
    expect(buckets.withinHour.length).toBe(0);
  });

  it('does not count tomorrow morning as today even though it is within 24 hours', () => {
    const buckets = classifyTasks([task({ dueDate: atLocal(9, 0, 1) })], NOW);

    expect(buckets.today.length).toBe(0);
    expect(buckets.overdue.length).toBe(0);
  });

  it('falls back to the reminder time when there is no deadline', () => {
    const buckets = classifyTasks([task({ notifyAt: atLocal(12, 15) })], NOW);

    expect(buckets.withinHour.length).toBe(1);
  });

  it('surfaces undated work only when its priority is high', () => {
    const buckets = classifyTasks(
      [task({ ref: 'a', priority: 118 }), task({ ref: 'b', priority: 12 })],
      NOW,
    );

    expect(buckets.undatedHighPriority.length).toBe(1);
    expect(buckets.undatedHighPriority[0]?.ref).toBe('a');
  });

  it('never places the same task in two buckets', () => {
    const buckets = classifyTasks([task({ dueDate: atLocal(12, 30), priority: 200 })], NOW);
    const total = buckets.overdue.length + buckets.withinHour.length
      + buckets.today.length + buckets.undatedHighPriority.length;

    expect(total).toBe(1);
  });

  it('orders overdue work by how long it has been waiting', () => {
    const buckets = classifyTasks(
      [
        task({ ref: 'later', dueDate: atLocal(11) }),
        task({ ref: 'earlier', dueDate: atLocal(8) }),
      ],
      NOW,
    );

    expect(buckets.overdue[0]?.ref).toBe('earlier');
  });

  it('ignores an unparseable date instead of crashing or mis-bucketing', () => {
    const buckets = classifyTasks([task({ dueDate: 'nem-datum' })], NOW);

    expect(buckets.overdue.length).toBe(0);
    expect(buckets.today.length).toBe(0);
  });
});

describe('buildHeadline', () => {
  const empty = { overdue: [], withinHour: [], today: [], undatedHighPriority: [] };

  it('states plainly when there is nothing scheduled', () => {
    expect(buildHeadline(empty, false)).toContain('Nincs időzített teendő');
  });

  it('warns loudly that a partial digest cannot be trusted as empty', () => {
    const headline = buildHeadline(empty, true);

    expect(headline).toContain('HIÁNYOS');
    expect(headline).toContain('nem teljesek');
  });

  it('summarises each non-empty bucket', () => {
    const headline = buildHeadline({ ...empty, overdue: [task()], today: [task(), task()] }, false);

    expect(headline).toContain('1 lejárt');
    expect(headline).toContain('2 ma');
  });
});
