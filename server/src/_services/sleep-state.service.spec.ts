// Spec for sleep-state.service.ts — FR #5 Phase 1 time-of-day heuristic.
// Cycle 126 (safe-orthogonal spec-coverage).
//
// `getSnapshot(now)` accepts an injected Date so we can test deterministically
// across hours. Singleton reset between tests for env-override coverage.

import { SleepState_Service } from './sleep-state.service.js';

interface SleepStateClass_Internal {
  instance: SleepState_Service | null;
}

function resetSingleton(): void {
  (SleepState_Service as unknown as SleepStateClass_Internal).instance = null;
}

function at(hour: number, minute: number = 0): Date {
  // Construct a local Date with the given hour (Europe/Budapest assumed).
  const d: Date = new Date();
  d.setHours(hour, minute, 0, 0);

  return d;
}

describe('| SleepState_Service', () => {

  let origStart: string | undefined;
  let origEnd: string | undefined;

  beforeEach(() => {
    origStart = process.env.MA_SLEEP_START_HOUR;
    origEnd = process.env.MA_SLEEP_END_HOUR;
    delete process.env.MA_SLEEP_START_HOUR;
    delete process.env.MA_SLEEP_END_HOUR;
    resetSingleton();
  });

  afterEach(() => {
    if (origStart === undefined) delete process.env.MA_SLEEP_START_HOUR;
    else process.env.MA_SLEEP_START_HOUR = origStart;
    if (origEnd === undefined) delete process.env.MA_SLEEP_END_HOUR;
    else process.env.MA_SLEEP_END_HOUR = origEnd;
    resetSingleton();
  });

  it('| singleton getInstance returns the same instance across calls', () => {
    const a: SleepState_Service = SleepState_Service.getInstance();
    const b: SleepState_Service = SleepState_Service.getInstance();
    expect(a).toBe(b);
  });

  it('| default window 02:00-10:00 — 03:00 is inside, 14:00 outside', () => {
    const svc: SleepState_Service = SleepState_Service.getInstance();

    expect(svc.isInSleepWindow(at(3))).toBe(true);
    expect(svc.isInSleepWindow(at(14))).toBe(false);
  });

  it('| half-open interval: start hour 02 is in, end hour 10 is out', () => {
    const svc: SleepState_Service = SleepState_Service.getInstance();

    expect(svc.isInSleepWindow(at(2))).toBe(true);    // start inclusive
    expect(svc.isInSleepWindow(at(10))).toBe(false);  // end exclusive
    expect(svc.isInSleepWindow(at(9, 59))).toBe(true);
  });

  it('| snapshot shape — source, hour, window fields populated', () => {
    const svc: SleepState_Service = SleepState_Service.getInstance();
    const snap = svc.getSnapshot(at(5));

    expect(snap.source).toBe('time-of-day-heuristic');
    expect(snap.hour).toBe(5);
    expect(snap.window).toEqual({ startHour: 2, endHour: 10 });
    expect(snap.isInSleepWindow).toBe(true);
    expect(typeof snap.ts).toBe('string');
  });

  it('| env override MA_SLEEP_START_HOUR / MA_SLEEP_END_HOUR honored', () => {
    process.env.MA_SLEEP_START_HOUR = '23';
    process.env.MA_SLEEP_END_HOUR = '6';
    resetSingleton();

    const svc: SleepState_Service = SleepState_Service.getInstance();
    const snap = svc.getSnapshot(at(0));

    expect(snap.window).toEqual({ startHour: 23, endHour: 6 });
  });

  it('| wrap-around window (start > end): 22..6 includes 23 and 03, excludes 12', () => {
    process.env.MA_SLEEP_START_HOUR = '22';
    process.env.MA_SLEEP_END_HOUR = '6';
    resetSingleton();

    const svc: SleepState_Service = SleepState_Service.getInstance();

    expect(svc.isInSleepWindow(at(23))).toBe(true);
    expect(svc.isInSleepWindow(at(3))).toBe(true);
    expect(svc.isInSleepWindow(at(22))).toBe(true);   // start inclusive
    expect(svc.isInSleepWindow(at(6))).toBe(false);   // end exclusive
    expect(svc.isInSleepWindow(at(12))).toBe(false);
  });

  it('| invalid env value (non-numeric, out-of-range) falls back to defaults', () => {
    process.env.MA_SLEEP_START_HOUR = 'not-a-number';
    process.env.MA_SLEEP_END_HOUR = '99';
    resetSingleton();

    const svc: SleepState_Service = SleepState_Service.getInstance();
    const snap = svc.getSnapshot(at(3));

    expect(snap.window).toEqual({ startHour: 2, endHour: 10 });
  });

  it('| isInSleepWindow convenience equals getSnapshot().isInSleepWindow', () => {
    const svc: SleepState_Service = SleepState_Service.getInstance();
    const now: Date = at(4);

    expect(svc.isInSleepWindow(now)).toBe(svc.getSnapshot(now).isInSleepWindow);
  });
});
