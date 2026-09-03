import { InterfoodToolError } from './interfood.error.js';
import {
  InterfoodMealComponent,
  InterfoodMenuItem,
  InterfoodMenuWeek,
  InterfoodNutrition,
} from './interfood.models.js';

type JsonObject = Record<string, unknown>;

export function normalizeInterfoodMenu(raw: unknown, year: number, week: number): InterfoodMenuWeek {
  const root: JsonObject = asObject(raw, 'menu response');
  const data: JsonObject = asObject(root.data, 'menu response.data');
  const byId: Map<number, InterfoodMenuItem> = new Map<number, InterfoodMenuItem>();

  const fullPortionCategoryIds: Set<number> = collectFullPortionCategoryIds(data);
  for (const groupValue of Object.values(data)) {
    const group: JsonObject = asObject(groupValue, 'menu category group');
    const groupId: number = requiredNumber(group.id, 'category group id');
    const groupName: string = requiredString(group.name, 'category group name');
    for (const categoryValue of asArray(group.categories)) {
      const category: JsonObject = asObject(categoryValue, 'menu category');
      for (const itemValue of asArray(category.items)) {
        const item: JsonObject = asObject(itemValue, 'menu item');
        const normalized: InterfoodMenuItem = normalizeItem(
          item,
          category,
          groupId,
          groupName,
          fullPortionCategoryIds,
        );
        byId.set(normalized.menuItemId, normalized);
      }
    }
  }

  const items: InterfoodMenuItem[] = [...byId.values()].sort((left, right) => (
    left.date.localeCompare(right.date)
      || left.categoryCode.localeCompare(right.categoryCode)
      || left.menuItemId - right.menuItemId
  ));

  return {
    year,
    week,
    itemCount: items.length,
    dates: [...new Set(items.map((item: InterfoodMenuItem) => item.date))],
    items,
  };
}

function normalizeItem(
  item: JsonObject,
  category: JsonObject,
  groupId: number,
  groupName: string,
  fullPortionCategoryIds: Set<number>,
): InterfoodMenuItem {
  const food: JsonObject | null = optionalObject(item.food);
  const components: InterfoodMealComponent[] = ([1, 2, 3] as const)
    .map((position: 1 | 2 | 3): InterfoodMealComponent | null => normalizeComponent(item, position))
    .filter((component: InterfoodMealComponent | null): component is InterfoodMealComponent => component !== null);
  const componentName: string | undefined = components[0]?.name;
  const foodName: string = optionalString(food?.display_name)
    ?? optionalString(food?.name)
    ?? componentName
    ?? requiredString(item.food_name_one, 'menu item food name');

  const categoryId: number = requiredNumber(category.id ?? item.menu_category_id, 'menu category id');
  const categoryName: string = requiredString(category.name, 'menu category name');
  const relatedFullPortionCategoryId: number | null = optionalNumber(category.big_portion_category_id);
  return {
    menuItemId: requiredNumber(item.id, 'menu item id'),
    foodId: optionalNumber(food?.id),
    foodName,
    displayName: optionalString(food?.display_name),
    date: requiredString(item.date, 'menu item date'),
    categoryId,
    categoryCode: requiredString(category.code, 'menu category code'),
    categoryName,
    categoryGroupId: groupId,
    categoryGroupName: groupName,
    portionClass: classifyPortion(categoryName, categoryId, relatedFullPortionCategoryId, fullPortionCategoryIds),
    relatedFullPortionCategoryId,
    priceHuf: requiredNumber(item.price, 'menu item price'),
    disabled: item.disabled === true,
    cancelDeadline: optionalString(item.cancel_deadline),
    ingredientsHtml: optionalString(item.description),
    nutritionSummary: optionalString(item.comment),
    rating: optionalNumber(food?.food_rating_cache),
    components,
  };
}

function collectFullPortionCategoryIds(data: JsonObject): Set<number> {
  const ids: Set<number> = new Set<number>();
  for (const groupValue of Object.values(data)) {
    const group: JsonObject = asObject(groupValue, 'menu category group');
    for (const categoryValue of asArray(group.categories)) {
      const category: JsonObject = asObject(categoryValue, 'menu category');
      const relatedId: number | null = optionalNumber(category.big_portion_category_id);
      if (relatedId !== null) ids.add(relatedId);
    }
  }
  return ids;
}

function classifyPortion(
  categoryName: string,
  categoryId: number,
  relatedFullPortionCategoryId: number | null,
  fullPortionCategoryIds: Set<number>,
): InterfoodMenuItem['portionClass'] {
  const normalizedName: string = categoryName.toLocaleLowerCase('hu-HU');
  if (normalizedName.includes('kis') && normalizedName.includes('nagy')) return 'mixed';
  if (relatedFullPortionCategoryId !== null || normalizedName.includes('kis')) return 'small';
  if (fullPortionCategoryIds.has(categoryId) || normalizedName.includes('nagy')) return 'full';
  return 'unspecified';
}

function normalizeComponent(item: JsonObject, position: 1 | 2 | 3): InterfoodMealComponent | null {
  const suffix: string = position === 1 ? 'one' : position === 2 ? 'two' : 'three';
  const name: string | null = optionalString(item[`food_name_${suffix}`]);
  if (name === null) {
    return null;
  }
  return {
    position,
    name,
    weightG: optionalNumber(item[`weight_food_${suffix}`]),
    portion: nutrition(item, 'portion', suffix),
    per100g: nutrition(item, 'hundred', suffix),
  };
}

function nutrition(item: JsonObject, basis: 'portion' | 'hundred', suffix: string): InterfoodNutrition {
  return {
    energyKcal: optionalNumber(item[`energy_${basis}_food_${suffix}`]),
    fatG: optionalNumber(item[`fat_${basis}_food_${suffix}`]),
    saturatedFatG: optionalNumber(item[`saturated_fat_${basis}_food_${suffix}`]),
    carbohydrateG: optionalNumber(item[`carb_${basis}_food_${suffix}`]),
    sugarG: optionalNumber(item[`sugar_${basis}_food_${suffix}`]),
    proteinG: optionalNumber(item[`protein_${basis}_food_${suffix}`]),
    saltG: optionalNumber(item[`salt_${basis}_food_${suffix}`]),
  };
}

function asObject(value: unknown, label: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InterfoodToolError('MA-INTERFOOD-SCHEMA', `${label} is not an object.`, { value });
  }
  return value as JsonObject;
}

function optionalObject(value: unknown): JsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as JsonObject
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function requiredString(value: unknown, label: string): string {
  const parsed: string | null = optionalString(value);
  if (parsed === null) {
    throw new InterfoodToolError('MA-INTERFOOD-SCHEMA', `${label} is missing or empty.`, { value });
  }
  return parsed;
}

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed: string = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredNumber(value: unknown, label: string): number {
  const parsed: number | null = optionalNumber(value);
  if (parsed === null) {
    throw new InterfoodToolError('MA-INTERFOOD-SCHEMA', `${label} is missing or invalid.`, { value });
  }
  return parsed;
}

function optionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed: number = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
