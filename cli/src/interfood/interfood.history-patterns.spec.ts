import {
  InterfoodAccountSnapshot,
  InterfoodOrderLine,
  InterfoodPortionClass,
} from './interfood.models.js';
import { buildInterfoodHistoryPatterns } from './interfood.history-patterns.js';

describe('Interfood history patterns', () => {
  it('preserves quantity, portion and distinct-day evidence while excluding inactive lines', () => {
    const snapshot: InterfoodAccountSnapshot = {
      schemaVersion: '1.0.0',
      syncedAt: '2026-09-01T00:00:00.000Z',
      complete: true,
      years: [2026],
      pagesRead: 1,
      rawOrders: [],
      lines: [
        line('o1', '2026-08-01', 109, 'Gombapaprikás', 2, 'full', 'Főétel'),
        line('o2', '2026-08-08', 109, 'Gombapaprikás', 1, 'small', 'Kis adag'),
        line('o3', '2026-08-15', 205, 'Másik étel', 1, 'full', 'Főétel'),
        { ...line('o4', '2026-08-22', 109, 'Gombapaprikás', 9, 'full', 'Főétel'), state: 'cancelled' },
      ],
      warnings: [],
    };

    const report = buildInterfoodHistoryPatterns(snapshot);
    expect(report).toEqual(jasmine.objectContaining({
      activeLineCount: 3,
      activeUnitCount: 4,
      firstOrderedDate: '2026-08-01',
      lastOrderedDate: '2026-08-15',
    }));
    expect(report.foods[0]).toEqual(jasmine.objectContaining({
      key: 'food:109',
      totalUnits: 3,
      orderDayCount: 2,
      orderCount: 2,
      doubleOrderDayCount: 1,
      maxUnitsPerDay: 2,
      confidence: 'moderate',
      suggestion: 'confirm-prefer',
      categoryNames: ['Főétel', 'Kis adag'],
      portionUnitCounts: { full: 2, small: 1, mixed: 0, unspecified: 0 },
    }));
    expect(report.categories[0]).toEqual(jasmine.objectContaining({
      categoryName: 'Főétel',
      totalUnits: 3,
      orderDayCount: 2,
      distinctFoodCount: 2,
    }));
  });
});

function line(
  orderId: string,
  deliveryDate: string,
  foodId: number,
  foodName: string,
  quantity: number,
  portionClass: InterfoodPortionClass,
  categoryName: string,
): InterfoodOrderLine {
  return {
    orderId,
    orderLineId: `${orderId}-${foodId}`,
    menuItemId: foodId * 100,
    foodId,
    foodName,
    deliveryDate,
    categoryCode: 'A',
    categoryName,
    portionClass,
    quantity,
    unitPriceHuf: 1000,
    linePriceHuf: 1000 * quantity,
    state: 'active',
    sourceFingerprint: `${orderId}-${foodId}-${deliveryDate}`,
  };
}
