// Spec for presence-monitor.service.ts — a „fut-e már máshol egy figyelő?" döntés.
//
// Ez a döntés dönti el, hogy a szerver elindítja-e a jelenlét-figyelőt. Ha tévesen
// „fut már"-t mondana, a figyelő SOHA nem indulna el — és pontosan ez a csendes hiba
// tartotta 112 napig halva a jelenlét-mérést.

import { isFreshSample, SAMPLE_FRESH_MS } from './presence-monitor.service.js';

describe('isFreshSample', () => {
  const now: number = Date.parse('2026-09-06T22:00:00.000Z');

  it('treats a just-written sample as fresh', () => {
    expect(isFreshSample(now - 1_000, now)).toBe(true);
  });

  it('treats a sample older than the window as stale', () => {
    expect(isFreshSample(now - (SAMPLE_FRESH_MS + 1), now)).toBe(false);
  });

  it('still counts a sample exactly at the window edge as fresh', () => {
    expect(isFreshSample(now - SAMPLE_FRESH_MS, now)).toBe(true);
  });

  it('reports "not running" when there is no sample at all', () => {
    // 🔴 Kritikus eset: üres adatkönyvtárnál a 0 SOSEM jelenthet „fut már valaki"-t,
    // különben a figyelő soha nem indulna el az első alkalommal.
    expect(isFreshSample(0, now)).toBe(false);
  });

  it('reports "not running" for the 112-day-old measurement we actually had', () => {
    expect(isFreshSample(now - 112 * 24 * 60 * 60_000, now)).toBe(false);
  });

  it('tolerates a clock skew that puts the sample slightly in the future', () => {
    expect(isFreshSample(now + 5_000, now)).toBe(true);
  });
});
