import { createHash } from 'node:crypto';

import { InterfoodFoodRegistryEntry, InterfoodMenuItem } from './interfood.models.js';
import { readJsonIfExists, writeJsonAtomically } from './interfood.paths.js';

interface RegistryState {
  schemaVersion: '1.0.0';
  updatedAt: string;
  entries: InterfoodFoodRegistryEntry[];
}

export class InterfoodFoodRegistry {
  public constructor(private readonly path: string) {}

  public async identify(items: InterfoodMenuItem[], commit: boolean): Promise<{
    entries: InterfoodFoodRegistryEntry[];
    newCount: number;
    changedCount: number;
    knownCount: number;
    committed: boolean;
  }> {
    const state: RegistryState = await this.load();
    const byKey: Map<string, InterfoodFoodRegistryEntry> = new Map(
      state.entries.map((entry: InterfoodFoodRegistryEntry): [string, InterfoodFoodRegistryEntry] => [entry.key, entry]),
    );
    const now: string = new Date().toISOString();
    const occurrences: Map<string, InterfoodMenuItem[]> = new Map();
    for (const item of items) {
      const key: string = foodRegistryKey(item);
      occurrences.set(key, [...(occurrences.get(key) ?? []), item]);
    }
    const entries: InterfoodFoodRegistryEntry[] = [];
    for (const [key, grouped] of occurrences) {
      const exemplar: InterfoodMenuItem = grouped[0]!;
      const previous: InterfoodFoodRegistryEntry | undefined = byKey.get(key);
      const contentFingerprint: string = contentHash(exemplar);
      entries.push({
        key,
        foodId: exemplar.foodId,
        normalizedName: normalizeFoodName(exemplar.foodName),
        foodFingerprint: foodHash(exemplar),
        contentFingerprint,
        firstSeenAt: previous?.firstSeenAt ?? now,
        lastSeenAt: now,
        lastMenuItemIds: [...new Set(grouped.map((item: InterfoodMenuItem): number => item.menuItemId))].sort((a, b) => a - b),
        status: previous === undefined ? 'new' : previous.contentFingerprint === contentFingerprint ? 'known' : 'changed',
      });
    }
    const merged: InterfoodFoodRegistryEntry[] = [
      ...state.entries.filter((entry: InterfoodFoodRegistryEntry): boolean => !occurrences.has(entry.key)),
      ...entries,
    ].sort((left, right) => left.normalizedName.localeCompare(right.normalizedName, 'hu-HU'));
    if (commit) await writeJsonAtomically(this.path, { schemaVersion: '1.0.0', updatedAt: now, entries: merged });
    return {
      entries,
      newCount: entries.filter((entry) => entry.status === 'new').length,
      changedCount: entries.filter((entry) => entry.status === 'changed').length,
      knownCount: entries.filter((entry) => entry.status === 'known').length,
      committed: commit,
    };
  }

  public async list(): Promise<InterfoodFoodRegistryEntry[]> {
    return (await this.load()).entries;
  }

  private async load(): Promise<RegistryState> {
    const value: unknown | undefined = await readJsonIfExists(this.path);
    if (value === undefined) return { schemaVersion: '1.0.0', updatedAt: new Date(0).toISOString(), entries: [] };
    const state: RegistryState = value as RegistryState;
    return state.schemaVersion === '1.0.0' && Array.isArray(state.entries)
      ? state
      : { schemaVersion: '1.0.0', updatedAt: new Date(0).toISOString(), entries: [] };
  }
}

export function foodRegistryKey(item: InterfoodMenuItem): string {
  return item.foodId === null ? `fingerprint:${foodHash(item)}` : `food:${item.foodId}`;
}

export function normalizeFoodName(name: string): string {
  return name.trim().toLocaleLowerCase('hu-HU').normalize('NFKC').replace(/\s+/g, ' ');
}

function foodHash(item: InterfoodMenuItem): string {
  return sha({
    name: normalizeFoodName(item.foodName),
    components: item.components.map((component) => normalizeFoodName(component.name)),
    categoryGroup: normalizeFoodName(item.categoryGroupName),
  });
}

function contentHash(item: InterfoodMenuItem): string {
  return sha({
    food: foodHash(item),
    ingredients: item.ingredientsHtml,
    components: item.components,
    priceHuf: item.priceHuf,
    portionClass: item.portionClass,
  });
}

function sha(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
