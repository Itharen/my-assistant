import { computeInterfoodCoverage } from './interfood.coverage.js';
import { InterfoodDayCoverage, InterfoodOrderLine } from './interfood.models.js';

describe('computeInterfoodCoverage', () => {
  it('counts quantity two as two ordered units without collapsing the order line', () => {
    const lines: InterfoodOrderLine[] = [line({ quantity: 2 })];

    const coverage: InterfoodDayCoverage[] = computeInterfoodCoverage(
      lines,
      [{ date: '2026-09-07', expectedUnitCount: 2 }],
    );

    expect(coverage[0]?.status).toBe('covered');
    expect(coverage[0]?.orderedUnitCount).toBe(2);
    expect(coverage[0]?.evidence[0]?.quantity).toBe(2);
  });

  it('keeps small and full occurrences as separate evidence on the same date', () => {
    const lines: InterfoodOrderLine[] = [
      line({ orderLineId: 'full', menuItemId: 35853, portionClass: 'full' }),
      line({ orderLineId: 'small', menuItemId: 35859, portionClass: 'small' }),
    ];

    const coverage: InterfoodDayCoverage[] = computeInterfoodCoverage(
      lines,
      [{ date: '2026-09-07', expectedUnitCount: 2 }],
    );

    expect(coverage[0]?.status).toBe('covered');
    expect(coverage[0]?.evidence.map((item) => item.menuItemId)).toEqual([35853, 35859]);
    expect(coverage[0]?.evidence.map((item) => item.portionClass)).toEqual(['full', 'small']);
  });

  it('does not count cancelled lines and reports partial/not-covered dates explicitly', () => {
    const lines: InterfoodOrderLine[] = [
      line({ deliveryDate: '2026-09-07', state: 'active' }),
      line({ deliveryDate: '2026-09-07', orderLineId: 'cancelled', state: 'cancelled', quantity: 5 }),
    ];

    const coverage: InterfoodDayCoverage[] = computeInterfoodCoverage(lines, [
      { date: '2026-09-07', expectedUnitCount: 2 },
      { date: '2026-09-08', expectedUnitCount: 2 },
    ]);

    expect(coverage.map((day) => day.status)).toEqual(['partial', 'not-covered']);
    expect(coverage[0]?.orderedUnitCount).toBe(1);
    expect(coverage[0]?.evidence.length).toBe(2);
  });
});

function line(overrides: Partial<InterfoodOrderLine>): InterfoodOrderLine {
  return {
    orderId: 'order-1',
    orderLineId: 'line-1',
    menuItemId: 35853,
    foodId: 109,
    foodName: 'Gombapaprikás',
    deliveryDate: '2026-09-07',
    categoryCode: 'A',
    categoryName: 'Főétel',
    portionClass: 'full',
    quantity: 1,
    unitPriceHuf: 1650,
    linePriceHuf: 1650,
    state: 'active',
    sourceFingerprint: 'fixture',
    ...overrides,
  };
}
