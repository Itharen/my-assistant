import { normalizeInterfoodMenu } from '../interfood/interfood.normalizer.js';
import { buildInterfoodWeekPlan } from '../interfood/interfood.ranker.js';
import { menuFixture } from '../interfood/interfood.test-fixtures.js';
import { isAddOnPattern, parseRepetitionWindows, summarizeWeekPlan } from './interfood.command.js';

describe('Interfood command options', () => {
  it('parses comma-delimited repetition windows', () => {
    expect(parseRepetitionWindows('7,14,28')).toEqual([7, 14, 28]);
  });

  it('accepts the whitespace-delimited form forwarded by PowerShell native invocation', () => {
    expect(parseRepetitionWindows('7 14 28')).toEqual([7, 14, 28]);
  });

  it('rejects non-increasing windows', () => {
    expect(() => parseRepetitionWindows('7,7,28')).toThrowError(/strictly increasing/);
  });

  it('rejects values outside the supported range', () => {
    expect(() => parseRepetitionWindows('0,14,400')).toThrowError(/between 1 and 365/);
  });

  it('classifies soup and dessert history patterns as optional add-ons', () => {
    const pattern = {
      key: 'food:648',
      foodId: 648,
      foodName: 'Tiramisu',
      categoryNames: ['Desszert'],
      totalUnits: 8,
      orderDayCount: 8,
      orderCount: 8,
      doubleOrderDayCount: 0,
      maxUnitsPerDay: 1,
      firstOrderedDate: '2026-01-01',
      lastOrderedDate: '2026-08-01',
      portionUnitCounts: { small: 0, full: 0, mixed: 0, unspecified: 8 },
      suggestion: 'confirm-favorite' as const,
      confidence: 'strong' as const,
      evidence: [],
    };
    expect(isAddOnPattern(pattern)).toBeTrue();
    expect(isAddOnPattern({ ...pattern, categoryNames: ['Főétel'] })).toBeFalse();
    expect(isAddOnPattern({ ...pattern, categoryNames: ['Kis menü (kis leves + kis főétel)'] })).toBeFalse();
    expect(isAddOnPattern({ ...pattern, categoryNames: ['Kis Leves'] })).toBeTrue();
  });

  it('preserves a Saturday occurrence date in the compact Friday plan output', () => {
    const saturdayItem = normalizeInterfoodMenu(
      menuFixture(35036, '2026-09-12', 'Szombati menüétel'),
      2026,
      37,
    ).items[0]!;
    const plan = buildInterfoodWeekPlan({
      year: 2026,
      week: 37,
      items: [saturdayItem],
      preferences: {
        schemaVersion: '1.0.0',
        updatedAt: '2026-09-01T00:00:00.000Z',
        entries: [],
        comparisons: [],
        portionRules: [],
      },
      mealsPerDay: 1,
      healthMode: 'off',
    });

    const summary = summarizeWeekPlan(plan) as {
      days: Array<{
        date: string;
        sourceDates: string[];
        recommendations: Array<{ menuDate: string; quantity: number }>;
        healthOrientedAlternatives: Array<{ menuDate: string; quantity: number }>;
        addOns: Array<{ kind: string; recommendation: unknown; favoriteCandidates: unknown[] }>;
      }>;
    };
    expect(summary.days[0]).toEqual(jasmine.objectContaining({
      date: '2026-09-11',
      sourceDates: ['2026-09-12'],
    }));
    expect(summary.days[0]!.recommendations[0]!.menuDate).toBe('2026-09-12');
    expect(summary.days[0]!.recommendations[0]!.quantity).toBe(1);
    expect(summary.days[0]!.healthOrientedAlternatives).toEqual([]);
    expect(summary.days[0]!.addOns.map((addOn) => addOn.kind)).toEqual(['dessert', 'soup']);
    expect(summary.days[0]!.addOns.every((addOn) => addOn.favoriteCandidates.length === 0)).toBeTrue();
  });
});
