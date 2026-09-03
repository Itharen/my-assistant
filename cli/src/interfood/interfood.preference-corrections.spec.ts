import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { InterfoodMenuItem } from './interfood.models.js';
import { normalizeInterfoodMenu } from './interfood.normalizer.js';
import { InterfoodPreferenceStore } from './interfood.preference-store.js';
import { buildInterfoodWeekPlan } from './interfood.ranker.js';
import { menuFixture } from './interfood.test-fixtures.js';

function meal(id: number, name: string, date: string = '2026-09-07'): InterfoodMenuItem {
  return {
    ...normalizeInterfoodMenu(menuFixture(id, date, name), 2026, 37).items[0]!,
    foodId: id,
    ingredientsHtml: '',
    portionClass: 'full',
  };
}

describe('IF-J04 persisted owner correction journey', () => {
  it('warns only for milk/cream, not the explicitly tolerated sour cream, yoghurt, curd, butter or cheese', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ma-if-dairy-scope-'));
    try {
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.set({ scope: 'food-type', key: 'allergen:milk-cream', stance: 'avoid', reason: 'Only milk and cream.' });
      const tolerated = { ...meal(1, 'Tejfölös túrós csirkemell'),
        ingredientsHtml: 'tejföl (tej, tejszín), joghurt (tej), túró (tej), vaj (tejszín), sajt (tehén tej)' };
      const milk = { ...meal(2, 'Camembert', '2026-09-08'), ingredientsHtml: 'camembert sajt (tehén tej), tej' };
      const cream = { ...meal(3, 'Csirkemell', '2026-09-09'), ingredientsHtml: 'csirkemell, tejszín' };
      const plan = buildInterfoodWeekPlan({ year: 2026, week: 37, mealsPerDay: 1, healthMode: 'off',
        preferences: await store.load(), items: [tolerated, milk, cream] });
      expect(plan.days[0]!.recommendations[0]!.dietaryWarnings).toEqual([]);
      expect(plan.days[1]!.recommendations[0]!.dietaryWarnings[0]).toContain('(tej)');
      expect(plan.days[2]!.recommendations[0]!.dietaryWarnings[0]).toContain('(tejszín)');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  it('keeps an exact disliked tortilla behind other meals despite a positive tortilla-family rule', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ma-if-correction-'));
    try {
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.set({ scope: 'food-name-pattern', key: 'tortilla', stance: 'favorite', reason: 'Broad family.' });
      await store.set({ scope: 'exact-food', key: 'food:1', stance: 'dislike', reason: 'Tried and not liked.' });
      const reloaded = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      const plan = buildInterfoodWeekPlan({
        year: 2026, week: 37, mealsPerDay: 2, healthMode: 'off', preferences: await reloaded.load(),
        items: [meal(1, 'Tépett csirkés barbecue tortilla'), meal(2, 'Western csirkemell'), meal(3, 'Burgonyás zöldségtál')],
      });
      expect(plan.days[0]!.recommendations.map((candidate) => candidate.menuItem.foodId)).not.toContain(1);
      expect(plan.days[0]!.recommendations.reduce((sum, candidate) => sum + candidate.quantity, 0)).toBe(2);
      expect(plan.days[0]!.alternatives.find((candidate) => candidate.menuItem.foodId === 1)!.evidence.join(' '))
        .toContain('exact-food:food:1=dislike');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  it('recognizes pasta and fruit with meat without penalizing berry sauce with cheese', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ma-if-meal-types-'));
    try {
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.set({ scope: 'food-type', key: 'meal:pasta', stance: 'fallback', reason: 'Less pasta.' });
      await store.set({ scope: 'food-type', key: 'meal:fruit-meat', stance: 'dislike', reason: 'No fruit with meat.' });
      const plan = buildInterfoodWeekPlan({
        year: 2026, week: 37, mealsPerDay: 2, healthMode: 'off', preferences: await store.load(),
        items: [meal(1, 'Sült csirkemell durum tésztával'), meal(2, 'Őszibarackos csirkemell'),
          meal(3, 'Camembert áfonyaöntettel'), meal(4, 'Burgonyás zöldségtál'),
          meal(5, 'Wokban sült csirkemell ananásszal'), meal(6, 'Szilvalekváros derelye fahéjas tejfölmártással')],
      });
      expect(plan.days[0]!.recommendations.map((candidate) => candidate.menuItem.foodId)).toEqual([3, 4]);
      expect(plan.days[0]!.alternatives.map((candidate) => candidate.menuItem.foodId)).not.toContain(6);
      expect(plan.days[0]!.alternatives.find((candidate) => candidate.menuItem.foodId === 1)!.evidence.join(' '))
        .toContain('meal:pasta=fallback');
      expect(plan.days[0]!.alternatives.find((candidate) => candidate.menuItem.foodId === 2)!.evidence.join(' '))
        .toContain('meal:fruit-meat=dislike');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  it('chooses a real small rice occurrence while retaining the full camembert exception', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ma-if-rice-portions-'));
    try {
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.setPortionRule({ foodNamePattern: 'rizs', preferredPortionClass: 'small',
        excludedFoodNamePatterns: ['camembert'], reason: 'Trial small rice meals.' });
      await store.setPortionRule({ foodNamePattern: 'camembert', preferredPortionClass: 'full', reason: 'Keep full.' });
      const rice = meal(1, 'Bácskai csirkemell rizzsel');
      const cheese = meal(2, 'Camembert rizzsel', '2026-09-08');
      const plan = buildInterfoodWeekPlan({
        year: 2026, week: 37, mealsPerDay: 1, healthMode: 'off', preferences: await store.load(),
        items: [rice, { ...rice, menuItemId: 101, portionClass: 'small' },
          cheese, { ...cheese, menuItemId: 102, portionClass: 'small', priceHuf: 1 }],
      });
      expect(plan.days[0]!.recommendations[0]!.menuItem.menuItemId).toBe(101);
      expect(plan.days[1]!.recommendations[0]!.menuItem.menuItemId).toBe(2);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
