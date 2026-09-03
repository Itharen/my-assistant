import {
  InterfoodAccountSnapshot,
  InterfoodCategoryOrderPattern,
  InterfoodFoodOrderPattern,
  InterfoodHistoryPatternReport,
  InterfoodOrderLine,
  InterfoodPatternConfidence,
  InterfoodPortionClass,
} from './interfood.models.js';
import { normalizeFoodName } from './interfood.food-registry.js';

interface MutableFoodPattern {
  key: string;
  foodId: number | null;
  foodName: string;
  categoryNames: Set<string>;
  orderIds: Set<string>;
  dayUnits: Map<string, number>;
  portionUnitCounts: Record<InterfoodPortionClass, number>;
}

interface MutableCategoryPattern {
  categoryName: string;
  foodKeys: Set<string>;
  dates: Set<string>;
  totalUnits: number;
}

export function buildInterfoodHistoryPatterns(snapshot: InterfoodAccountSnapshot): InterfoodHistoryPatternReport {
  const activeLines: InterfoodOrderLine[] = snapshot.lines.filter(
    (line: InterfoodOrderLine): boolean => line.state === 'active',
  );
  const foods: Map<string, MutableFoodPattern> = new Map();
  const categories: Map<string, MutableCategoryPattern> = new Map();

  for (const line of activeLines) {
    const foodKey: string = line.foodId === null
      ? `name:${normalizeFoodName(line.foodName)}`
      : `food:${line.foodId}`;
    const food: MutableFoodPattern = foods.get(foodKey) ?? {
      key: foodKey,
      foodId: line.foodId,
      foodName: line.foodName,
      categoryNames: new Set<string>(),
      orderIds: new Set<string>(),
      dayUnits: new Map<string, number>(),
      portionUnitCounts: emptyPortionCounts(),
    };
    food.foodName = latestFoodName(food, line);
    food.categoryNames.add(line.categoryName);
    food.orderIds.add(line.orderId);
    food.dayUnits.set(line.deliveryDate, (food.dayUnits.get(line.deliveryDate) ?? 0) + line.quantity);
    food.portionUnitCounts[line.portionClass] += line.quantity;
    foods.set(foodKey, food);

    const categoryKey: string = normalizeFoodName(line.categoryName);
    const category: MutableCategoryPattern = categories.get(categoryKey) ?? {
      categoryName: line.categoryName,
      foodKeys: new Set<string>(),
      dates: new Set<string>(),
      totalUnits: 0,
    };
    category.foodKeys.add(foodKey);
    category.dates.add(line.deliveryDate);
    category.totalUnits += line.quantity;
    categories.set(categoryKey, category);
  }

  const foodPatterns: InterfoodFoodOrderPattern[] = [...foods.values()]
    .map(toFoodPattern)
    .sort(compareFoodPatterns);
  const categoryPatterns: InterfoodCategoryOrderPattern[] = [...categories.values()]
    .map((category: MutableCategoryPattern): InterfoodCategoryOrderPattern => ({
      categoryName: category.categoryName,
      totalUnits: category.totalUnits,
      orderDayCount: category.dates.size,
      distinctFoodCount: category.foodKeys.size,
    }))
    .sort((left: InterfoodCategoryOrderPattern, right: InterfoodCategoryOrderPattern): number => (
      right.totalUnits - left.totalUnits
      || right.orderDayCount - left.orderDayCount
      || left.categoryName.localeCompare(right.categoryName, 'hu-HU')
    ));
  const dates: string[] = activeLines.map((line: InterfoodOrderLine): string => line.deliveryDate).sort();

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    snapshotSyncedAt: snapshot.syncedAt,
    activeLineCount: activeLines.length,
    activeUnitCount: activeLines.reduce((total: number, line: InterfoodOrderLine): number => total + line.quantity, 0),
    firstOrderedDate: dates[0] ?? null,
    lastOrderedDate: dates.at(-1) ?? null,
    foods: foodPatterns,
    categories: categoryPatterns,
  };
}

function toFoodPattern(food: MutableFoodPattern): InterfoodFoodOrderPattern {
  const dates: string[] = [...food.dayUnits.keys()].sort();
  const units: number[] = [...food.dayUnits.values()];
  const totalUnits: number = units.reduce((total: number, quantity: number): number => total + quantity, 0);
  const doubleOrderDayCount: number = units.filter((quantity: number): boolean => quantity >= 2).length;
  const confidence: InterfoodPatternConfidence = doubleOrderDayCount >= 2 || dates.length >= 5 || totalUnits >= 6
    ? 'strong'
    : doubleOrderDayCount >= 1 || dates.length >= 3 || totalUnits >= 3
      ? 'moderate'
      : 'weak';
  const suggestion: InterfoodFoodOrderPattern['suggestion'] = confidence === 'strong'
    ? 'confirm-favorite'
    : confidence === 'moderate'
      ? 'confirm-prefer'
      : 'observe';
  const maxUnitsPerDay: number = units.length === 0 ? 0 : Math.max(...units);
  return {
    key: food.key,
    foodId: food.foodId,
    foodName: food.foodName,
    categoryNames: [...food.categoryNames].sort((left, right) => left.localeCompare(right, 'hu-HU')),
    totalUnits,
    orderDayCount: dates.length,
    orderCount: food.orderIds.size,
    doubleOrderDayCount,
    maxUnitsPerDay,
    firstOrderedDate: dates[0]!,
    lastOrderedDate: dates.at(-1)!,
    portionUnitCounts: food.portionUnitCounts,
    suggestion,
    confidence,
    evidence: [
      `${totalUnits} ordered units across ${dates.length} delivery days and ${food.orderIds.size} orders`,
      `${doubleOrderDayCount} delivery days with quantity >= 2; maximum ${maxUnitsPerDay} units on one day`,
      `observed ${dates[0]}..${dates.at(-1)}`,
    ],
  };
}

function compareFoodPatterns(left: InterfoodFoodOrderPattern, right: InterfoodFoodOrderPattern): number {
  return right.doubleOrderDayCount - left.doubleOrderDayCount
    || right.orderDayCount - left.orderDayCount
    || right.totalUnits - left.totalUnits
    || right.lastOrderedDate.localeCompare(left.lastOrderedDate)
    || left.foodName.localeCompare(right.foodName, 'hu-HU');
}

function emptyPortionCounts(): Record<InterfoodPortionClass, number> {
  return { small: 0, full: 0, mixed: 0, unspecified: 0 };
}

function latestFoodName(food: MutableFoodPattern, line: InterfoodOrderLine): string {
  const latestDate: string | undefined = [...food.dayUnits.keys()].sort().at(-1);
  return latestDate === undefined || line.deliveryDate >= latestDate ? line.foodName : food.foodName;
}
