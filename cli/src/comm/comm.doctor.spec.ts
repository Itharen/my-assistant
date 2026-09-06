import { formatAge } from './comm.doctor.js';
import { summarizeChecks, type CommCheck, type CommCheckStatus } from './comm.models.js';

function check(status: CommCheckStatus, label: string, remedy?: string): CommCheck {
  return { id: label, area: 'ccap', label, status, detail: 'teszt', remedy };
}

const NOW = '2026-09-06T14:00:00+02:00';

describe('summarizeChecks', () => {
  it('reports ok only when every check is ok', () => {
    const report = summarizeChecks([check('ok', 'A'), check('ok', 'B')], NOW);

    expect(report.overall).toBe('ok');
    expect(report.counts.ok).toBe(2);
  });

  it('lets the worst status decide the overall verdict', () => {
    const report = summarizeChecks(
      [check('ok', 'A'), check('missing', 'B'), check('broken', 'C', 'Javítsd C-t')],
      NOW,
    );

    expect(report.overall).toBe('broken');
  });

  it('never lets an unmeasurable check pass as ok', () => {
    const report = summarizeChecks([check('ok', 'A'), check('unknown', 'B', 'Mérd meg')], NOW);

    expect(report.overall).toBe('unknown');
  });

  it('ranks a degraded channel above a merely missing one', () => {
    const report = summarizeChecks(
      [check('missing', 'A', 'Állítsd be'), check('degraded', 'B', 'Kösd át')],
      NOW,
    );

    expect(report.overall).toBe('degraded');
  });

  it('names the most urgent item and its remedy in the headline', () => {
    const report = summarizeChecks(
      [check('ok', 'A'), check('broken', 'Jelenlét-figyelő', 'Indítsd újra')],
      NOW,
    );

    expect(report.headline).toContain('Jelenlét-figyelő');
    expect(report.headline).toContain('Indítsd újra');
  });

  it('does not claim success when there is nothing to report on', () => {
    const report = summarizeChecks([], NOW);

    expect(report.overall).toBe('unknown');
  });
});

describe('formatAge', () => {
  it('uses minutes below an hour', () => {
    expect(formatAge(42)).toBe('42 perce');
  });

  it('uses hours below a day', () => {
    expect(formatAge(200)).toBe('3 órája');
  });

  it('uses days for long gaps instead of an unreadable minute count', () => {
    expect(formatAge(162_023)).toBe('112 napja');
  });
});
