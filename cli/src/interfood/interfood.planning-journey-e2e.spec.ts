import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { normalizeInterfoodMenu } from './interfood.normalizer.js';
import {
  InterfoodAccountSnapshot,
  InterfoodFoodRegistryEntry,
  InterfoodMenuItem,
  InterfoodOrderLine,
  InterfoodPreferenceState,
} from './interfood.models.js';
import { InterfoodPreferenceStore } from './interfood.preference-store.js';
import { InterfoodFoodRegistry } from './interfood.food-registry.js';
import { buildInterfoodWeekPlan } from './interfood.ranker.js';
import { menuFixture } from './interfood.test-fixtures.js';

describe('Interfood preference-to-week-plan user journey', () => {
  it('IF-J02 carries a discovered identity through commit, reload, reuse and content-change detection', async () => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-interfood-food-registry-'));
    const registryPath: string = join(directory, 'foods.json');
    try {
      const item: InterfoodMenuItem = normalizeInterfoodMenu(
        menuFixture(35036, '2026-09-07', 'Azonosított étel'),
        2026,
        36,
      ).items[0]!;
      const registry = new InterfoodFoodRegistry(registryPath);

      const preview = await registry.identify([item], false);
      expect(preview).toEqual(jasmine.objectContaining({ newCount: 1, committed: false }));
      expect(await registry.list()).toEqual([]);

      const committed = await registry.identify([item], true);
      expect(committed).toEqual(jasmine.objectContaining({ newCount: 1, committed: true }));
      const resumed = new InterfoodFoodRegistry(registryPath);
      const known = await resumed.identify([item], true);
      expect(known).toEqual(jasmine.objectContaining({ knownCount: 1, changedCount: 0 }));
      expect((await resumed.list())[0]).toEqual(jasmine.objectContaining({ key: 'food:901', status: 'known' }));

      const changed: InterfoodMenuItem = { ...item, priceHuf: item.priceHuf + 100 };
      const changedResult = await resumed.identify([changed], false);
      expect(changedResult).toEqual(jasmine.objectContaining({ changedCount: 1, knownCount: 0 }));

      const unknownIdentity: InterfoodMenuItem = { ...item, menuItemId: 35037, foodId: null };
      const unknownResult = await resumed.identify([unknownIdentity], false);
      expect(unknownResult.entries[0]!.key).toMatch(/^fingerprint:[a-f0-9]{64}$/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('carries normalized menu state through explicit preference and explainable selection', async () => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-interfood-plan-'));
    try {
      const menu = normalizeInterfoodMenu(menuFixture(35036, '2026-09-07', 'Kedvenc étel'), 2026, 36);
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.set({ scope: 'exact-food', key: 'food:901', stance: 'favorite', reason: 'A user kedvence' });
      const plan = buildInterfoodWeekPlan({
        year: 2026,
        week: 36,
        items: menu.items,
        preferences: await store.load(),
        mealsPerDay: 1,
        healthMode: 'balanced',
      });
      expect(plan.days[0]?.recommendations[0]?.menuItem.menuItemId).toBe(35036);
      expect(plan.days[0]?.recommendations[0]?.scoreBreakdown).toEqual(jasmine.objectContaining({ price: -4 }));
      expect(plan.days[0]?.recommendations[0]?.evidence.join(' ')).toContain('favorite');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('IF-J04 carries two daily servings as quantity two for one explicit favorite', async () => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-interfood-favorite-quantity-'));
    try {
      const favorite: InterfoodMenuItem = normalizeInterfoodMenu(
        menuFixture(35036, '2026-09-07', 'Rántott camembert'),
        2026,
        36,
      ).items[0]!;
      const alternative: InterfoodMenuItem = {
        ...favorite,
        menuItemId: 35037,
        foodId: 902,
        foodName: 'Másik elfogadható étel',
        components: favorite.components.map((component) => ({ ...component, name: 'Másik elfogadható étel' })),
      };
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.set({
        scope: 'food-name-pattern',
        key: 'camembert',
        stance: 'favorite',
        reason: 'Erős jelöltből lehet ugyanazon a napon két adag.',
      });

      const unknownPlan = buildInterfoodWeekPlan({
        year: 2026,
        week: 36,
        items: [favorite, alternative],
        preferences: await store.load(),
        mealsPerDay: 2,
        healthMode: 'off',
      });

      expect(unknownPlan.days[0]!.recommendations.map((candidate) => candidate.quantity)).toEqual([1, 1]);

      const experiencedPlan = buildInterfoodWeekPlan({
        year: 2026,
        week: 36,
        items: [favorite, alternative],
        preferences: await store.load(),
        account: {
          schemaVersion: '1.0.0',
          syncedAt: '2026-09-01T00:00:00.000Z',
          complete: true,
          years: [2026],
          pagesRead: 1,
          rawOrders: [],
          lines: [{
            ...historyLine('2026-08-01', 1),
            foodId: favorite.foodId,
            foodName: favorite.foodName,
          }],
          warnings: [],
        },
        mealsPerDay: 2,
        healthMode: 'off',
      });

      expect(experiencedPlan.days[0]!.recommendations.length).toBe(1);
      expect(experiencedPlan.days[0]!.recommendations[0]).toEqual(jasmine.objectContaining({ quantity: 2 }));
      expect(experiencedPlan.days[0]!.recommendations[0]!.menuItem.menuItemId).toBe(35036);
      expect(experiencedPlan.days[0]!.alternatives[0]!.menuItem.menuItemId).toBe(35037);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('IF-J04 fills two servings with distinct foods and never selects small plus full as separate meals', () => {
    const full: InterfoodMenuItem = normalizeInterfoodMenu(
      menuFixture(35036, '2026-09-07', 'Csirkemell burgonyapürével'),
      2026,
      36,
    ).items[0]!;
    const small: InterfoodMenuItem = {
      ...full,
      menuItemId: 35037,
      portionClass: 'small',
      priceHuf: full.priceHuf - 300,
    };
    const secondFood: InterfoodMenuItem = {
      ...full,
      menuItemId: 35038,
      foodId: 902,
      foodName: 'Gombapaprikás',
      components: full.components.map((component) => ({ ...component, name: 'Gombapaprikás' })),
    };

    const plan = buildInterfoodWeekPlan({
      year: 2026,
      week: 36,
      items: [full, small, secondFood],
      preferences: emptyPreferenceState(),
      mealsPerDay: 2,
      healthMode: 'off',
    });

    expect(plan.days[0]!.recommendations.map((candidate) => candidate.quantity)).toEqual([1, 1]);
    expect(new Set(plan.days[0]!.recommendations.map((candidate) => candidate.menuItem.foodId)).size).toBe(2);
    expect(plan.days[0]!.recommendations.reduce((sum, candidate) => sum + candidate.quantity, 0)).toBe(2);
  });

  it('IF-J04 prefers a different primary meal family for the second daily serving', () => {
    const western: InterfoodMenuItem = {
      ...normalizeInterfoodMenu(
        menuFixture(35036, '2026-09-07', 'Western csirkemell steak, vegyes köret'),
        2026,
        36,
      ).items[0]!,
      priceHuf: 1_000,
    };
    const westernVariant: InterfoodMenuItem = {
      ...western,
      menuItemId: 35037,
      foodId: 902,
      foodName: 'Western csirkemell steak (fokhagyma, mustár), vegyes köret',
      priceHuf: 1_100,
      components: western.components.map((component) => ({
        ...component,
        name: 'Western csirkemell steak (fokhagyma, mustár), vegyes köret',
      })),
    };
    const differentMeal: InterfoodMenuItem = {
      ...western,
      menuItemId: 35038,
      foodId: 903,
      foodName: 'Cukkinis lecsó quinoával',
      priceHuf: 1_200,
      components: western.components.map((component) => ({ ...component, name: 'Cukkinis lecsó quinoával' })),
    };

    const plan = buildInterfoodWeekPlan({
      year: 2026,
      week: 36,
      items: [western, westernVariant, differentMeal],
      preferences: emptyPreferenceState(),
      mealsPerDay: 2,
      healthMode: 'off',
    });

    expect(plan.days[0]!.recommendations.map((candidate) => candidate.menuItem.menuItemId)).toEqual([35036, 35038]);
    expect(plan.days[0]!.alternatives.map((candidate) => candidate.menuItem.menuItemId)).toContain(35037);
  });

  it('IF-J04 exposes distinct likely-liked and nutrition-backed main-meal alternatives', async () => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-interfood-main-alternatives-'));
    try {
      const favorite: InterfoodMenuItem = normalizeInterfoodMenu(
        menuFixture(35036, '2026-09-07', 'Rántott camembert'),
        2026,
        36,
      ).items[0]!;
      const proteinDense: InterfoodMenuItem = withNutrition({
        ...favorite,
        menuItemId: 35037,
        foodId: 902,
        foodName: 'Csirkemell zöldségekkel',
      }, 500, 40, 1);
      const proteinDenseSmall: InterfoodMenuItem = {
        ...proteinDense,
        menuItemId: 35038,
        portionClass: 'small',
        priceHuf: proteinDense.priceHuf - 200,
      };
      const secondHealthy: InterfoodMenuItem = withNutrition({
        ...favorite,
        menuItemId: 35039,
        foodId: 903,
        foodName: 'Tofus zöldségtál',
      }, 450, 20, 1);
      const incomplete: InterfoodMenuItem = withNutrition({
        ...favorite,
        menuItemId: 35040,
        foodId: 904,
        foodName: 'Hiányos tápértékű alternatíva',
      }, null, null, null);
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.set({
        scope: 'food-name-pattern',
        key: 'camembert',
        stance: 'favorite',
        reason: 'A kiválasztott főétel.',
      });
      await store.set({
        scope: 'food-name-pattern',
        key: 'csirkemell',
        stance: 'prefer',
        reason: 'Valószínűleg kedvelt alternatíva.',
      });

      const plan = buildInterfoodWeekPlan({
        year: 2026,
        week: 36,
        items: [favorite, proteinDense, proteinDenseSmall, secondHealthy, incomplete],
        preferences: await store.load(),
        mealsPerDay: 1,
        healthMode: 'off',
      });

      expect(plan.days[0]!.alternatives[0]!.menuItem.foodId).toBe(902);
      expect(plan.days[0]!.alternatives.filter((candidate) => candidate.menuItem.foodId === 902)).toHaveSize(1);
      expect(plan.days[0]!.healthOrientedAlternatives[0]!.menuItem.foodId).toBe(902);
      expect(plan.days[0]!.healthOrientedAlternatives.map((candidate) => candidate.menuItem.foodId))
        .not.toContain(904);
      expect(plan.days[0]!.healthOrientedAlternatives[0]!.evidence.join(' ')).toContain('health-oriented:');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('IF-J04 adds history-proven dessert and soup without consuming the two main-meal portions', () => {
    const firstMain: InterfoodMenuItem = normalizeInterfoodMenu(
      menuFixture(35036, '2026-09-07', 'Első főétel'),
      2026,
      36,
    ).items[0]!;
    const secondMain: InterfoodMenuItem = {
      ...firstMain,
      menuItemId: 35037,
      foodId: 902,
      foodName: 'Második főétel',
      components: firstMain.components.map((component) => ({ ...component, name: 'Második főétel' })),
    };
    const dessert: InterfoodMenuItem = {
      ...firstMain,
      menuItemId: 35038,
      foodId: 648,
      foodName: 'Tiramisu',
      categoryName: 'Desszert',
      categoryGroupName: 'Desszert',
    };
    const weakDessert: InterfoodMenuItem = {
      ...dessert,
      menuItemId: 35039,
      foodId: 649,
      foodName: 'Egyszer próbált sütemény',
    };
    const duplicateWeakDessert: InterfoodMenuItem = {
      ...weakDessert,
      menuItemId: 35041,
      categoryName: 'Kis desszert',
      priceHuf: weakDessert.priceHuf - 100,
    };
    const secondWeakDessert: InterfoodMenuItem = {
      ...dessert,
      menuItemId: 35042,
      foodId: 650,
      foodName: 'Második változatos sütemény',
    };
    const thirdWeakDessert: InterfoodMenuItem = {
      ...dessert,
      menuItemId: 35043,
      foodId: 651,
      foodName: 'Harmadik változatos sütemény',
    };
    const mislabeledVeganCake: InterfoodMenuItem = {
      ...firstMain,
      menuItemId: 35045,
      foodId: 652,
      foodName: 'Vegán kávétorta',
      categoryName: 'Vegán',
      categoryGroupName: 'Vegán',
    };
    const bundledUnknownDessert: InterfoodMenuItem = {
      ...firstMain,
      menuItemId: 35046,
      foodId: 653,
      foodName: 'Csirkemell rizzsel, ismeretlen süteménnyel',
      categoryName: 'Varia menü 1 fél adag főétel + 1 sütemény',
      categoryGroupName: 'Varia menü',
    };
    const mislabeledSweetMain: InterfoodMenuItem = {
      ...firstMain,
      menuItemId: 35047,
      foodId: 654,
      foodName: 'Kókusztejbegríz kakaóval',
      categoryName: 'Főétel',
      categoryGroupName: 'Főétel',
    };
    const mislabeledPoppySeedMain: InterfoodMenuItem = {
      ...firstMain,
      menuItemId: 35048,
      foodId: 655,
      foodName: 'Vegán mákosguba',
      categoryName: 'Vegán',
      categoryGroupName: 'Vegán',
    };
    const mislabeledNoodleDessert: InterfoodMenuItem = {
      ...firstMain,
      menuItemId: 35049,
      foodId: 656,
      foodName: 'Vegán diósmetélt',
      categoryName: 'Vegán',
      categoryGroupName: 'Vegán',
    };
    const mislabeledVeganSoup: InterfoodMenuItem = {
      ...firstMain,
      menuItemId: 35050,
      foodId: 657,
      foodName: 'Vegán karfiol krémleves, pirított zsemlekockákkal',
      categoryName: 'Vegán',
      categoryGroupName: 'Vegán',
    };
    const soup: InterfoodMenuItem = {
      ...firstMain,
      menuItemId: 35040,
      foodId: 11,
      foodName: 'Frankfurti leves',
      categoryName: 'Leves',
      categoryGroupName: 'Leves',
    };
    const fruitSoup: InterfoodMenuItem = {
      ...soup,
      menuItemId: 35044,
      foodId: 777,
      foodName: 'Hideg meggyleves',
    };
    const historyLines: InterfoodOrderLine[] = [];
    for (let index: number = 0; index < 5; index += 1) {
      const date: string = `2026-08-${String(10 + index).padStart(2, '0')}`;
      historyLines.push({
        ...historyLine(date, 1),
        orderLineId: `dessert-${index}`,
        foodId: 648,
        foodName: 'Tiramisu',
        categoryName: 'Desszert',
      });
      historyLines.push({
        ...historyLine(date, 1),
        orderLineId: `soup-${index}`,
        foodId: 11,
        foodName: 'Frankfurti leves',
        categoryName: 'Leves',
      });
      historyLines.push({
        ...historyLine(date, 1),
        orderLineId: `fruit-soup-${index}`,
        foodId: 777,
        foodName: 'Hideg meggyleves',
        categoryName: 'Leves',
      });
    }
    historyLines.push({
      ...historyLine('2026-08-20', 1),
      orderLineId: 'weak-dessert',
      foodId: 649,
      foodName: 'Egyszer próbált sütemény',
      categoryName: 'Desszert',
    });
    const account: InterfoodAccountSnapshot = {
      schemaVersion: '1.0.0',
      syncedAt: '2026-09-01T00:00:00.000Z',
      complete: true,
      years: [2026],
      pagesRead: 1,
      rawOrders: [],
      lines: historyLines,
      warnings: [],
    };

    const basePreferences: InterfoodPreferenceState = {
      ...emptyPreferenceState(),
      entries: [{
        id: 'fruit-soup-reject',
        scope: 'food-type',
        key: 'meal:gyumolcsleves',
        stance: 'hard-reject',
        source: 'explicit-user',
        confidence: 'confirmed',
        reason: 'A user nem szereti a gyümölcsleveseket.',
        createdAt: '2026-09-02T00:00:00.000Z',
        lastConfirmedAt: '2026-09-02T00:00:00.000Z',
        excludedPatterns: [],
      }],
    };
    const unconfirmedPlan = buildInterfoodWeekPlan({
      year: 2026,
      week: 36,
      items: [
        firstMain,
        secondMain,
        dessert,
        weakDessert,
        duplicateWeakDessert,
        secondWeakDessert,
        thirdWeakDessert,
        mislabeledVeganCake,
        bundledUnknownDessert,
        mislabeledSweetMain,
        mislabeledPoppySeedMain,
        mislabeledNoodleDessert,
        mislabeledVeganSoup,
        soup,
        fruitSoup,
      ],
      preferences: basePreferences,
      account,
      mealsPerDay: 2,
      healthMode: 'off',
    });

    expect(unconfirmedPlan.days[0]!.recommendations.reduce((sum, candidate) => sum + candidate.quantity, 0)).toBe(2);
    const unconfirmedDessert = unconfirmedPlan.days[0]!.addOns.find((addOn) => addOn.kind === 'dessert')!;
    const unconfirmedSoup = unconfirmedPlan.days[0]!.addOns.find((addOn) => addOn.kind === 'soup')!;
    expect(unconfirmedDessert.recommendation).toBeNull();
    expect(unconfirmedSoup.recommendation).toBeNull();
    expect(unconfirmedDessert.favoriteCandidates.map((candidate) => candidate.menuItem.menuItemId)).toEqual([35038]);
    for (const candidateId of [35045, 35046, 35047, 35048, 35049, 35050]) {
      expect(unconfirmedPlan.days[0]!.recommendations.map((candidate) => candidate.menuItem.menuItemId))
        .not.toContain(candidateId);
      expect(unconfirmedPlan.days[0]!.alternatives.map((candidate) => candidate.menuItem.menuItemId))
        .not.toContain(candidateId);
      expect(unconfirmedPlan.days[0]!.healthOrientedAlternatives.map((candidate) => candidate.menuItem.menuItemId))
        .not.toContain(candidateId);
    }
    expect(unconfirmedSoup.favoriteCandidates.map((candidate) => candidate.menuItem.menuItemId)).toEqual([35040]);
    expect(unconfirmedSoup.favoriteCandidates.map((candidate) => candidate.menuItem.menuItemId)).not.toContain(35044);
    expect(unconfirmedPlan.ambiguities)
      .toContain('2026-09-07: +dessert kedvencjelölt megerősítendő – Tiramisu (menuItemId 35038)');
    expect(unconfirmedPlan.ambiguities)
      .toContain('2026-09-07: +soup kedvencjelölt megerősítendő – Frankfurti leves (menuItemId 35040)');

    const confirmedPlan = buildInterfoodWeekPlan({
      year: 2026,
      week: 36,
      items: [firstMain, secondMain, dessert, soup, fruitSoup],
      preferences: {
        ...basePreferences,
        entries: [...basePreferences.entries, ...[dessert, soup].map((item, index) => ({
          id: `confirmed-add-on-${index}`,
          scope: 'exact-food' as const,
          key: `food:${item.foodId}`,
          stance: 'favorite' as const,
          source: 'explicit-user' as const,
          confidence: 'confirmed' as const,
          reason: 'Explicit owner favorite.',
          createdAt: '2026-09-02T00:00:00.000Z',
          lastConfirmedAt: '2026-09-02T00:00:00.000Z',
          excludedPatterns: [],
        }))],
      },
      account,
      mealsPerDay: 2,
      healthMode: 'off',
    });
    expect(confirmedPlan.days[0]!.addOns.find((addOn) => addOn.kind === 'dessert')!
      .recommendation!.menuItem.menuItemId).toBe(35038);
    expect(confirmedPlan.days[0]!.addOns.find((addOn) => addOn.kind === 'soup')!
      .recommendation!.menuItem.menuItemId).toBe(35040);
  });

  it('IF-J07 compares complete nutrition without inventing zeroes for an incomplete alternative', () => {
    const complete: InterfoodMenuItem = normalizeInterfoodMenu(
      menuFixture(35036, '2026-09-07', 'Teljes tápértékű étel'),
      2026,
      36,
    ).items[0]!;
    const incomplete: InterfoodMenuItem = {
      ...complete,
      menuItemId: 35037,
      foodId: 902,
      foodName: 'Hiányos tápértékű étel',
      components: complete.components.map((component) => ({
        ...component,
        portion: {
          ...component.portion,
          energyKcal: null,
          proteinG: null,
          saltG: null,
        },
      })),
    };
    const emptyPreferences: InterfoodPreferenceState = {
      schemaVersion: '1.0.0',
      updatedAt: '2026-09-01T00:00:00.000Z',
      entries: [],
      comparisons: [],
      portionRules: [],
    };

    const plan = buildInterfoodWeekPlan({
      year: 2026,
      week: 36,
      items: [incomplete, complete],
      preferences: emptyPreferences,
      mealsPerDay: 1,
      healthMode: 'balanced',
    });
    const candidates = [...plan.days[0]!.recommendations, ...plan.days[0]!.alternatives];
    const completeCandidate = candidates.find((candidate) => candidate.menuItem.menuItemId === 35036)!;
    const incompleteCandidate = candidates.find((candidate) => candidate.menuItem.menuItemId === 35037)!;

    expect(completeCandidate.scoreBreakdown).toEqual(jasmine.objectContaining({
      mealCompleteness: jasmine.any(Number),
      healthProtein: jasmine.any(Number),
      healthSalt: jasmine.any(Number),
    }));
    expect(incompleteCandidate.scoreBreakdown.mealCompleteness).toBeUndefined();
    expect(incompleteCandidate.scoreBreakdown.healthProtein).toBeUndefined();
    expect(incompleteCandidate.scoreBreakdown.healthSalt).toBeUndefined();
    expect(plan.days[0]!.recommendations[0]!.menuItem.menuItemId).toBe(35036);
  });

  it('IF-J04 carries a persisted pairwise decision into the selected recommendation', async () => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-interfood-pairwise-'));
    try {
      const preferred: InterfoodMenuItem = normalizeInterfoodMenu(
        menuFixture(35036, '2026-09-07', 'Preferált étel'),
        2026,
        36,
      ).items[0]!;
      const over: InterfoodMenuItem = {
        ...preferred,
        menuItemId: 35037,
        foodId: 902,
        foodName: 'Hátrébb sorolt étel',
        priceHuf: 500,
      };
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.compare('food:901', 'food:902', 'Ezt választom, ha mindkettő elérhető.');

      const plan = buildInterfoodWeekPlan({
        year: 2026,
        week: 36,
        items: [over, preferred],
        preferences: await store.load(),
        mealsPerDay: 1,
        healthMode: 'off',
      });

      expect(plan.days[0]!.recommendations[0]!.menuItem.menuItemId).toBe(35036);
      expect(plan.days[0]!.recommendations[0]!.evidence.join(' ')).toContain('food:901>food:902');
      const pairwisePenalty: number | undefined = Object.entries(plan.days[0]!.alternatives[0]!.scoreBreakdown)
        .find(([key]: [string, number]): boolean => key.startsWith('pairwise:'))?.[1];
      expect(pairwisePenalty).toBe(-60);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('IF-J04 carries food-type preference and ingredient hard-reject into the weekly decision', async () => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-interfood-type-preference-'));
    try {
      const chicken: InterfoodMenuItem = normalizeInterfoodMenu(
        menuFixture(35036, '2026-09-07', 'Rántott csirkemell'),
        2026,
        36,
      ).items[0]!;
      const unsafeChicken: InterfoodMenuItem = { ...chicken, ingredientsHtml: '<p>csirke, mogyoró</p>' };
      const mushroom: InterfoodMenuItem = {
        ...chicken,
        menuItemId: 35037,
        foodId: 902,
        foodName: 'Gombapaprikás',
        ingredientsHtml: '<p>gomba, paprika</p>',
        components: chicken.components.map((component) => ({ ...component, name: 'Gombapaprikás' })),
      };
      const mincedBeef: InterfoodMenuItem = {
        ...chicken,
        menuItemId: 35038,
        foodId: 903,
        foodName: 'Darált marhahús rizzsel',
        ingredientsHtml: '<p>darált marhahús, rizs</p>',
        components: chicken.components.map((component) => ({ ...component, name: 'Darált marhahús rizzsel' })),
      };
      const mixedChickenPork: InterfoodMenuItem = {
        ...chicken,
        menuItemId: 35039,
        foodId: 904,
        foodName: 'Csirkemell baconos burgonyával',
        ingredientsHtml: '<p>csirkemell, bacon, burgonya</p>',
        components: chicken.components.map((component) => ({
          ...component,
          name: 'Csirkemell baconos burgonyával',
        })),
      };
      const wildBoar: InterfoodMenuItem = {
        ...chicken,
        menuItemId: 35040,
        foodId: 905,
        foodName: 'Vaddisznó brassói',
        ingredientsHtml: '<p>vaddisznó, burgonya</p>',
        components: chicken.components.map((component) => ({
          ...component,
          name: 'Vaddisznó brassói',
        })),
      };
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.set({
        scope: 'food-type',
        key: 'protein:gomba',
        stance: 'prefer',
        reason: 'A gombás főételeket preferálom.',
      });
      await store.set({
        scope: 'ingredient-pattern',
        key: 'mogyoró',
        stance: 'hard-reject',
        reason: 'Ezt az összetevőt most kizárjuk.',
      });
      await store.set({
        scope: 'food-type',
        key: 'protein:marha',
        stance: 'dislike',
        excludedPatterns: ['darált'],
        reason: 'A darált hús kivétel.',
      });
      await store.set({
        scope: 'food-type',
        key: 'protein:csirke',
        stance: 'prefer',
        reason: 'A csirkemell preferált.',
      });
      await store.set({
        scope: 'food-type',
        key: 'protein:sertes',
        stance: 'dislike',
        reason: 'A sertés nehezebben tolerálható.',
      });

      const plan = buildInterfoodWeekPlan({
        year: 2026,
        week: 36,
        items: [unsafeChicken, mushroom, mincedBeef, mixedChickenPork],
        preferences: await store.load(),
        mealsPerDay: 1,
        healthMode: 'off',
      });

      expect(plan.days[0]!.recommendations[0]!.menuItem.menuItemId).toBe(35037);
      expect(plan.days[0]!.recommendations[0]!.evidence.join(' ')).toContain('food-type:protein:gomba=prefer');
      expect(plan.days[0]!.recommendations.map((candidate) => candidate.menuItem.menuItemId)).not.toContain(35036);
      expect(plan.days[0]!.alternatives.map((candidate) => candidate.menuItem.menuItemId)).not.toContain(35036);
      expect(plan.days[0]!.healthOrientedAlternatives.map((candidate) => candidate.menuItem.menuItemId))
        .not.toContain(35036);
      const allowedException = plan.days[0]!.alternatives.find(
        (candidate) => candidate.menuItem.menuItemId === 35038,
      )!;
      expect(allowedException.evidence.join(' ')).not.toContain('protein:marha=dislike');
      const mixedAlternative = plan.days[0]!.alternatives.find(
        (candidate) => candidate.menuItem.menuItemId === 35039,
      )!;
      expect(mixedAlternative.evidence.join(' ')).toContain('food-type:protein:csirke=prefer');
      expect(mixedAlternative.evidence.join(' ')).toContain('food-type:protein:sertes=dislike');

      const wildBoarPlan = buildInterfoodWeekPlan({
        year: 2026,
        week: 36,
        items: [wildBoar],
        preferences: await store.load(),
        mealsPerDay: 1,
        healthMode: 'off',
      });
      expect(wildBoarPlan.days[0]!.recommendations[0]!.evidence.join(' '))
        .toContain('food-type:protein:sertes=dislike');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('IF-J04 avoids and prominently warns for milk/cream while exempting cheese-only ingredients', () => {
    const cheeseOnly: InterfoodMenuItem = {
      ...normalizeInterfoodMenu(menuFixture(35036, '2026-09-07', 'Camembert sajttal'), 2026, 36).items[0]!,
      ingredientsHtml: '<b>camembert sajt (tehén tej)</b>, fűszerek. Nyomokban tejet tartalmazhat.',
    };
    const creamMeal: InterfoodMenuItem = {
      ...cheeseOnly,
      menuItemId: 35037,
      foodId: 902,
      foodName: 'Tejszínes csirkemell',
      ingredientsHtml: '<b>tejszín</b>, csirkemell, rizs',
      components: cheeseOnly.components.map((component) => ({ ...component, name: 'Tejszínes csirkemell' })),
    };
    const preferences: InterfoodPreferenceState = {
      ...emptyPreferenceState(),
      entries: [{
        id: 'milk-cream-allergy',
        scope: 'food-type',
        key: 'allergen:milk-cream',
        stance: 'avoid',
        source: 'explicit-user',
        confidence: 'confirmed',
        reason: 'Food allergy; cheese alone is exempt.',
        createdAt: '2026-09-02T00:00:00.000Z',
        lastConfirmedAt: '2026-09-02T00:00:00.000Z',
        excludedPatterns: [],
      }],
    };

    const plan = buildInterfoodWeekPlan({
      year: 2026,
      week: 36,
      items: [creamMeal, cheeseOnly],
      preferences,
      mealsPerDay: 1,
      healthMode: 'off',
    });

    expect(plan.days[0]!.recommendations[0]!.menuItem.menuItemId).toBe(35036);
    expect(plan.days[0]!.recommendations[0]!.dietaryWarnings).toEqual([]);
    const warned = plan.days[0]!.alternatives.find((candidate) => candidate.menuItem.menuItemId === 35037)!;
    expect(warned.dietaryWarnings[0]).toContain('ÉTELALLERGIA');
    expect(warned.scoreBreakdown.dietarySafety).toBe(-500);
    expect(warned.evidence.join(' ')).toContain('allergen:milk-cream=avoid');
    expect(plan.days[0]!.healthOrientedAlternatives.map((candidate) => candidate.menuItem.menuItemId))
      .not.toContain(35037);

    const warnedOnlyPlan = buildInterfoodWeekPlan({
      year: 2026,
      week: 36,
      items: [creamMeal],
      preferences,
      mealsPerDay: 1,
      healthMode: 'off',
    });
    expect(warnedOnlyPlan.days[0]!.recommendations[0]!.dietaryWarnings[0]).toContain('ÉTELALLERGIA');
    expect(warnedOnlyPlan.ambiguities[0]).toContain('ÉTELALLERGIA');
  });

  it('IF-J04 carries food-name rejection and an explicit small-portion rule into selection', async () => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-interfood-name-portion-preference-'));
    try {
      const normalizedLasagne: InterfoodMenuItem = normalizeInterfoodMenu(
        menuFixture(35036, '2026-09-07', 'Húsos lasagne'),
        2026,
        36,
      ).items[0]!;
      const fullLasagne: InterfoodMenuItem = { ...normalizedLasagne, portionClass: 'full' };
      const smallLasagne: InterfoodMenuItem = {
        ...fullLasagne,
        menuItemId: 35037,
        categoryCode: 'AK',
        categoryName: 'Kis adag',
        portionClass: 'small',
        priceHuf: fullLasagne.priceHuf - 300,
      };
      const bolognai: InterfoodMenuItem = {
        ...fullLasagne,
        menuItemId: 35038,
        foodId: 903,
        foodName: 'Bolognai spagetti',
        components: fullLasagne.components.map((component) => ({ ...component, name: 'Bolognai spagetti' })),
      };
      const fullPureeMeal: InterfoodMenuItem = {
        ...fullLasagne,
        menuItemId: 35039,
        foodId: 904,
        foodName: 'Rántott csirkemell burgonyapürével',
        date: '2026-09-08',
        components: fullLasagne.components.map(
          (component) => ({ ...component, name: 'Rántott csirkemell burgonyapürével' }),
        ),
      };
      const smallPureeMeal: InterfoodMenuItem = {
        ...fullPureeMeal,
        menuItemId: 35040,
        categoryCode: 'AK',
        categoryName: 'Kis adag',
        portionClass: 'small',
        priceHuf: fullPureeMeal.priceHuf - 300,
      };
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.set({
        scope: 'food-name-pattern',
        key: 'bolognai',
        stance: 'hard-reject',
        reason: 'Túl édes, gyakran kidobásra kerül.',
      });
      await store.setPortionRule({
        foodNamePattern: 'lasagne',
        preferredPortionClass: 'small',
        excludedFoodNamePatterns: ['burgonyapüré'],
        reason: 'Nagy volumenű ételből kisebb adag kell; a burgonyapürés fogás kivétel.',
      });
      await store.setPortionRule({
        foodNamePattern: 'burgonyapüré',
        preferredPortionClass: 'full',
        reason: 'A burgonyapürés fogásoknál nem kérünk kis adagot.',
      });

      const plan = buildInterfoodWeekPlan({
        year: 2026,
        week: 36,
        items: [fullLasagne, smallLasagne, bolognai, fullPureeMeal, smallPureeMeal],
        preferences: await store.load(),
        mealsPerDay: 1,
        healthMode: 'off',
      });

      expect(plan.days[0]!.recommendations[0]!.menuItem.menuItemId).toBe(35037);
      expect(plan.days[0]!.recommendations[0]!.evidence.join(' ')).toContain('portion:lasagne=>small');
      expect(Object.entries(plan.days[0]!.recommendations[0]!.scoreBreakdown)
        .find(([key]: [string, number]): boolean => key.startsWith('portion:'))?.[1]).toBe(0);
      expect(plan.days[0]!.alternatives.map((candidate) => candidate.menuItem.menuItemId)).not.toContain(35036);
      expect(plan.days[0]!.recommendations.map((candidate) => candidate.menuItem.menuItemId)).not.toContain(35038);
      expect(plan.days[0]!.alternatives.map((candidate) => candidate.menuItem.menuItemId)).not.toContain(35038);
      expect(plan.days[1]!.recommendations[0]!.menuItem.menuItemId).toBe(35039);
      expect(plan.days[1]!.recommendations[0]!.evidence.join(' ')).toContain('portion:burgonyapüré=>full');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('IF-J04 varies protein facets across days even when the repeated food identity differs', () => {
    const firstChicken: InterfoodMenuItem = normalizeInterfoodMenu(
      menuFixture(35036, '2026-09-07', 'Csirkepaprikás'),
      2026,
      36,
    ).items[0]!;
    const secondChicken: InterfoodMenuItem = {
      ...firstChicken,
      menuItemId: 35037,
      foodId: 902,
      foodName: 'Csirkemell rizzsel',
      date: '2026-09-08',
      components: firstChicken.components.map((component) => ({ ...component, name: 'Csirkemell rizzsel' })),
    };
    const mushroom: InterfoodMenuItem = {
      ...secondChicken,
      menuItemId: 35038,
      foodId: 903,
      foodName: 'Gombapaprikás',
      components: secondChicken.components.map((component) => ({ ...component, name: 'Gombapaprikás' })),
    };

    const plan = buildInterfoodWeekPlan({
      year: 2026,
      week: 36,
      items: [firstChicken, secondChicken, mushroom],
      preferences: emptyPreferenceState(),
      mealsPerDay: 1,
      healthMode: 'off',
    });

    expect(plan.days[0]!.recommendations[0]!.menuItem.menuItemId).toBe(35036);
    expect(plan.days[1]!.recommendations[0]!.menuItem.menuItemId).toBe(35038);
    const repeatedProtein = plan.days[1]!.alternatives.find((candidate) => candidate.menuItem.menuItemId === 35037)!;
    expect(repeatedProtein.scoreBreakdown['variety:protein:csirke']).toBe(-15);
  });

  it('IF-J04 counts a duplicated favorite protein once per day and caps its later variety penalty', async () => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-interfood-daily-variety-cap-'));
    try {
      const first: InterfoodMenuItem = normalizeInterfoodMenu(
        menuFixture(35036, '2026-09-07', 'Kedvenc csirkemell'),
        2026,
        36,
      ).items[0]!;
      const items: InterfoodMenuItem[] = [first, ...[1, 2, 3].map((offset: number): InterfoodMenuItem => ({
        ...first,
        menuItemId: first.menuItemId + offset,
        foodId: (first.foodId ?? 901) + offset,
        foodName: `Másik csirkemell ${offset}`,
        date: `2026-09-${String(7 + offset).padStart(2, '0')}`,
        components: first.components.map((component) => ({ ...component, name: `Másik csirkemell ${offset}` })),
      }))];
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.set({
        scope: 'exact-food',
        key: 'food:901',
        stance: 'favorite',
        reason: 'Az első napi ételből két adag kell.',
      });

      const plan = buildInterfoodWeekPlan({
        year: 2026,
        week: 36,
        items,
        preferences: await store.load(),
        account: {
          schemaVersion: '1.0.0',
          syncedAt: '2026-09-01T00:00:00.000Z',
          complete: true,
          years: [2026],
          pagesRead: 1,
          rawOrders: [],
          lines: [historyLine('2026-08-01', 1)],
          warnings: [],
        },
        mealsPerDay: 2,
        healthMode: 'off',
      });

      expect(plan.days[0]!.recommendations[0]!.quantity).toBe(2);
      expect(plan.days[1]!.recommendations[0]!.scoreBreakdown['variety:protein:csirke']).toBe(-15);
      expect(plan.days[2]!.recommendations[0]!.scoreBreakdown['variety:protein:csirke']).toBe(-30);
      expect(plan.days[3]!.recommendations[0]!.scoreBreakdown['variety:protein:csirke']).toBe(-30);
      expect(plan.ambiguities.some((message: string): boolean => message.includes('csak 1/2'))).toBeTrue();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('IF-J04 treats fallback food as a last-resort candidate without rejecting it', async () => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-interfood-fallback-preference-'));
    try {
      const fallback: InterfoodMenuItem = normalizeInterfoodMenu(
        menuFixture(35036, '2026-09-07', 'Halrudacskák burgonyapürével'),
        2026,
        36,
      ).items[0]!;
      const ordinary: InterfoodMenuItem = {
        ...fallback,
        menuItemId: 35037,
        foodId: 902,
        foodName: 'Rakott zöldbab',
        components: fallback.components.map((component) => ({ ...component, name: 'Rakott zöldbab' })),
      };
      const nextDayFallback: InterfoodMenuItem = {
        ...fallback,
        menuItemId: 35038,
        date: '2026-09-08',
      };
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.set({
        scope: 'food-name-pattern',
        key: 'halrud',
        stance: 'fallback',
        reason: 'Csak akkor válasszuk, ha nincs jobb jelölt.',
      });

      const plan = buildInterfoodWeekPlan({
        year: 2026,
        week: 36,
        items: [fallback, ordinary, nextDayFallback],
        preferences: await store.load(),
        mealsPerDay: 1,
        healthMode: 'off',
      });

      expect(plan.days[0]!.recommendations[0]!.menuItem.menuItemId).toBe(35037);
      const demoted = plan.days[0]!.alternatives.find((candidate) => candidate.menuItem.menuItemId === 35036)!;
      expect(demoted.rejected).toBeFalse();
      expect(demoted.evidence.join(' ')).toContain('halrud=fallback');
      expect(plan.days[1]!.recommendations[0]!.menuItem.menuItemId).toBe(35038);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('IF-J04 groups Saturday menu choices into Friday and keeps the better cross-date candidate', async () => {
    const directory: string = await mkdtemp(join(tmpdir(), 'ma-interfood-friday-saturday-menu-'));
    try {
      const friday: InterfoodMenuItem = normalizeInterfoodMenu(
        menuFixture(35036, '2026-09-11', 'Pénteki semleges étel'),
        2026,
        37,
      ).items[0]!;
      const saturday: InterfoodMenuItem = {
        ...friday,
        menuItemId: 35037,
        foodId: 902,
        foodName: 'Szombati rakott burgonya',
        date: '2026-09-12',
        components: friday.components.map((component) => ({ ...component, name: 'Szombati rakott burgonya' })),
      };
      const store = new InterfoodPreferenceStore(join(directory, 'preferences.json'));
      await store.set({
        scope: 'food-name-pattern',
        key: 'rakott burgonya',
        stance: 'favorite',
        reason: 'A tulajdonos nagyon szereti.',
      });

      const plan = buildInterfoodWeekPlan({
        year: 2026,
        week: 37,
        items: [friday, saturday],
        preferences: await store.load(),
        mealsPerDay: 1,
        healthMode: 'off',
      });

      expect(plan.days.length).toBe(1);
      expect(plan.days[0]!.date).toBe('2026-09-11');
      expect(plan.days[0]!.sourceDates).toEqual(['2026-09-11', '2026-09-12']);
      expect(plan.days[0]!.recommendations[0]!.menuItem.menuItemId).toBe(35037);
      expect(plan.days[0]!.recommendations[0]!.menuItem.date).toBe('2026-09-12');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('IF-J04 carries order dates and quantities into the 7/14/28-day repetition windows', () => {
    const candidate: InterfoodMenuItem = normalizeInterfoodMenu(
      menuFixture(35036, '2026-09-29', 'Csirkepaprikás'),
      2026,
      40,
    ).items[0]!;
    const lines: InterfoodOrderLine[] = [
      historyLine('2026-09-26', 1),
      historyLine('2026-09-18', 1),
      historyLine('2026-09-05', 1),
      historyLine('2026-08-01', 9),
    ];
    const account: InterfoodAccountSnapshot = {
      schemaVersion: '1.0.0',
      syncedAt: '2026-09-29T00:00:00.000Z',
      complete: true,
      years: [2026],
      pagesRead: 1,
      rawOrders: [],
      lines,
      warnings: [],
    };

    const plan = buildInterfoodWeekPlan({
      year: 2026,
      week: 40,
      items: [candidate],
      preferences: emptyPreferenceState(),
      account,
      mealsPerDay: 1,
      healthMode: 'off',
    });

    expect(plan.days[0]!.recommendations[0]!.scoreBreakdown.recentHistory).toBe(-26);
    expect(plan.days[0]!.recommendations[0]!.scoreBreakdown.historicalAffinity).toBe(13);
    expect(plan.days[0]!.recommendations[0]!.evidence.join(' ')).toContain('history-affinity:12 units/4 days/1 double-days');
  });

  it('IF-J04 honors configured repetition windows instead of silently using fixed dates', () => {
    const candidate: InterfoodMenuItem = normalizeInterfoodMenu(
      menuFixture(35036, '2026-09-29', 'Csirkepaprikás'),
      2026,
      40,
    ).items[0]!;
    const account: InterfoodAccountSnapshot = {
      schemaVersion: '1.0.0',
      syncedAt: '2026-09-29T00:00:00.000Z',
      complete: true,
      years: [2026],
      pagesRead: 1,
      rawOrders: [],
      lines: [historyLine('2026-09-26', 1), historyLine('2026-09-18', 1)],
      warnings: [],
    };

    const plan = buildInterfoodWeekPlan({
      year: 2026,
      week: 40,
      items: [candidate],
      preferences: emptyPreferenceState(),
      account,
      mealsPerDay: 1,
      healthMode: 'off',
      repetitionWindowsDays: [2, 4, 12],
    });

    expect(plan.days[0]!.recommendations[0]!.scoreBreakdown.recentHistory).toBe(-11);
  });

  it('IF-J02 carries changed identity into ranking and the owner review batch', () => {
    const changed: InterfoodMenuItem = normalizeInterfoodMenu(
      menuFixture(35036, '2026-09-07', 'Megváltozott étel'),
      2026,
      36,
    ).items[0]!;
    const known: InterfoodMenuItem = {
      ...changed,
      menuItemId: 35037,
      foodId: 902,
      foodName: 'Ismert étel',
    };
    const registry: InterfoodFoodRegistryEntry[] = [
      registryEntry(changed, 'changed'),
      registryEntry(known, 'known'),
    ];

    const plan = buildInterfoodWeekPlan({
      year: 2026,
      week: 36,
      items: [changed, known],
      preferences: emptyPreferenceState(),
      mealsPerDay: 1,
      healthMode: 'off',
      foodRegistry: registry,
    });

    expect(plan.days[0]!.recommendations[0]!.menuItem.menuItemId).toBe(35037);
    const changedCandidate = plan.days[0]!.alternatives.find((candidate) => candidate.menuItem.menuItemId === 35036)!;
    expect(changedCandidate.scoreBreakdown.identity).toBe(-50);

    const changedOnlyPlan = buildInterfoodWeekPlan({
      year: 2026,
      week: 36,
      items: [changed],
      preferences: emptyPreferenceState(),
      mealsPerDay: 1,
      healthMode: 'off',
      foodRegistry: registry,
    });
    expect(changedOnlyPlan.ambiguities[0]).toContain('megváltozott ételazonosság');
  });
});

function emptyPreferenceState(): InterfoodPreferenceState {
  return {
    schemaVersion: '1.0.0',
    updatedAt: '2026-09-01T00:00:00.000Z',
    entries: [],
    comparisons: [],
    portionRules: [],
  };
}

function withNutrition(
  item: InterfoodMenuItem,
  energyKcal: number | null,
  proteinG: number | null,
  saltG: number | null,
): InterfoodMenuItem {
  return {
    ...item,
    components: item.components.map((component) => ({
      ...component,
      name: item.foodName,
      portion: { ...component.portion, energyKcal, proteinG, saltG },
    })),
  };
}

function historyLine(deliveryDate: string, quantity: number): InterfoodOrderLine {
  return {
    orderId: `order-${deliveryDate}`,
    orderLineId: `line-${deliveryDate}`,
    menuItemId: 1,
    foodId: 901,
    foodName: 'Csirkepaprikás',
    deliveryDate,
    categoryCode: 'A',
    categoryName: 'Főétel',
    portionClass: 'full',
    quantity,
    unitPriceHuf: 1650,
    linePriceHuf: 1650 * quantity,
    state: 'active',
    sourceFingerprint: `fingerprint-${deliveryDate}`,
  };
}

function registryEntry(
  item: InterfoodMenuItem,
  status: InterfoodFoodRegistryEntry['status'],
): InterfoodFoodRegistryEntry {
  return {
    key: `food:${item.foodId}`,
    foodId: item.foodId,
    normalizedName: item.foodName.toLocaleLowerCase('hu-HU'),
    foodFingerprint: `food-fingerprint-${item.foodId}`,
    contentFingerprint: `content-fingerprint-${item.foodId}`,
    firstSeenAt: '2026-09-01T00:00:00.000Z',
    lastSeenAt: '2026-09-01T00:00:00.000Z',
    lastMenuItemIds: [item.menuItemId],
    status,
  };
}
