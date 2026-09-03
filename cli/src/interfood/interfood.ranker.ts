import {
  InterfoodAccountSnapshot,
  InterfoodAddOnKind,
  InterfoodAddOnPlan,
  InterfoodDayPlan,
  InterfoodFoodRegistryEntry,
  InterfoodMenuItem,
  InterfoodPreference,
  InterfoodPreferenceState,
  InterfoodPortionPreferenceRule,
  InterfoodRankedCandidate,
  InterfoodWeekPlan,
} from './interfood.models.js';
import { foodRegistryKey, normalizeFoodName } from './interfood.food-registry.js';

const STANCE_SCORES: Record<InterfoodPreference['stance'], number> = {
  favorite: 80,
  prefer: 40,
  neutral: 0,
  fallback: -60,
  dislike: -35,
  avoid: -100,
  'hard-reject': -10_000,
};

const DAY_MS: number = 24 * 60 * 60 * 1_000;
const DEFAULT_REPETITION_WINDOWS: readonly [number, number, number] = [7, 14, 28];
const VARIETY_WEIGHTS: Readonly<Record<string, number>> = {
  category: 8,
  protein: 15,
  preparation: 10,
  side: 8,
  sauce: 6,
};
const FRUIT_SOUP_TERMS: readonly string[] = [
  'gyümölcs',
  'gyumolcs',
  'meggy',
  'cseresznye',
  'eper',
  'málna',
  'malna',
  'áfonya',
  'afonya',
  'őszibarack',
  'oszibarack',
  'sárgabarack',
  'sargabarack',
  'szilva',
  'körte',
  'korte',
  'alma',
];
const DESSERT_FOOD_NAME_TERMS: readonly string[] = [
  'torta',
  'tiramisu',
  'lúdláb',
  'ludlab',
  'krémes',
  'kremes',
  'ischler',
  'éclair',
  'eclair',
  'tejbegríz',
  'tejbegriz',
  'rizspuding',
  'mákosguba',
  'makosguba',
  'diósmetélt',
  'diosmetelt',
  'mákos tészta',
  'makos teszta',
  'diós tészta',
  'dios teszta',
  'szilvalekváros derelye',
  'szilvalekvaros derelye',
];

export function buildInterfoodWeekPlan(input: {
  year: number;
  week: number;
  items: InterfoodMenuItem[];
  preferences: InterfoodPreferenceState;
  account?: InterfoodAccountSnapshot;
  mealsPerDay: number;
  healthMode: 'off' | 'balanced';
  repetitionWindowsDays?: readonly [number, number, number];
  foodRegistry?: InterfoodFoodRegistryEntry[];
}): InterfoodWeekPlan {
  const dates: string[] = [...new Set(
    input.items.map((item: InterfoodMenuItem): string => planningDateForMenuDate(item.date)),
  )].sort();
  const selectedKeys: Set<string> = new Set();
  const selectedFacets: Map<string, number> = new Map();
  const repetitionWindows: readonly [number, number, number] = input.repetitionWindowsDays ?? DEFAULT_REPETITION_WINDOWS;
  const days: InterfoodDayPlan[] = dates.map((date: string): InterfoodDayPlan => {
    const allDayItems: InterfoodMenuItem[] = input.items
      .filter((item: InterfoodMenuItem): boolean => planningDateForMenuDate(item.date) === date);
    const dayItems: InterfoodMenuItem[] = allDayItems.filter(isStandaloneMealCandidate);
    const sourceDates: string[] = [...new Set(allDayItems.map((item: InterfoodMenuItem): string => item.date))].sort();
    const availableKeys: Set<string> = new Set(dayItems.flatMap(candidatePreferenceKeys));
    const ranked: InterfoodRankedCandidate[] = dayItems
      .map((item: InterfoodMenuItem): InterfoodRankedCandidate => rankCandidate(
        item,
        input.preferences,
        input.account,
        selectedKeys,
        selectedFacets,
        availableKeys,
        repetitionWindows,
        input.healthMode,
        input.foodRegistry,
      ))
      .sort((left, right) => comparePreferenceCandidates(left, right, input.preferences));
    const recommendations: InterfoodRankedCandidate[] = allocateDailyServings(
      ranked,
      input.preferences,
      input.mealsPerDay,
      input.account,
    );
    const dailyFacets: Set<string> = new Set();
    for (const candidate of recommendations) {
      selectedKeys.add(foodRegistryKey(candidate.menuItem));
      for (const facet of varietyFacets(candidate.menuItem)) dailyFacets.add(facet);
    }
    for (const facet of dailyFacets) {
      // Variety is day-aware: two portions or two meals sharing a protein on one day count once.
      selectedFacets.set(facet, (selectedFacets.get(facet) ?? 0) + 1);
    }
    const selectedFoodKeys: Set<string> = new Set(
      recommendations.map((candidate: InterfoodRankedCandidate): string => foodRegistryKey(candidate.menuItem)),
    );
    const alternatives: InterfoodRankedCandidate[] = distinctFoodCandidates(
      ranked.filter((candidate: InterfoodRankedCandidate): boolean => (
        !candidate.rejected && !selectedFoodKeys.has(foodRegistryKey(candidate.menuItem))
      )),
    ).slice(0, 3);
    const healthOrientedAlternatives: InterfoodRankedCandidate[] = buildHealthOrientedAlternatives(
      ranked,
      selectedFoodKeys,
      input.preferences,
    );
    const addOns: InterfoodAddOnPlan[] = (['dessert', 'soup'] as const).map(
      (kind: InterfoodAddOnKind): InterfoodAddOnPlan => buildAddOnPlan(
        kind,
        allDayItems,
        input.preferences,
        input.account,
        repetitionWindows,
        input.healthMode,
        input.foodRegistry,
      ),
    );
    return {
      date,
      sourceDates,
      recommendations,
      alternatives,
      healthOrientedAlternatives,
      addOns,
    };
  });
  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    year: input.year,
    week: input.week,
    mealsPerDay: input.mealsPerDay,
    days,
    ambiguities: days.flatMap((day: InterfoodDayPlan): string[] => {
      const candidateAmbiguities: string[] = day.recommendations
        .filter(needsOwnerReview)
        .map((candidate: InterfoodRankedCandidate): string => ambiguityMessage(day.date, candidate));
      const selectedQuantity: number = day.recommendations.reduce(
        (total: number, candidate: InterfoodRankedCandidate): number => total + candidate.quantity,
        0,
      );
      if (selectedQuantity < input.mealsPerDay) {
        candidateAmbiguities.push(
          `${day.date}: csak ${selectedQuantity}/${input.mealsPerDay} elfogadható adag azonosítható; mennyiségi döntés szükséges`,
        );
      }
      for (const addOn of day.addOns) {
        if (addOn.recommendation !== null && needsOwnerReview(addOn.recommendation)) {
          candidateAmbiguities.push(
            `${day.date}: +${addOn.kind} megerősítendő – ${addOn.recommendation.menuItem.foodName} `
            + `(menuItemId ${addOn.recommendation.menuItem.menuItemId})`,
          );
        }
        for (const candidate of addOn.favoriteCandidates) {
          candidateAmbiguities.push(
            `${day.date}: +${addOn.kind} kedvencjelölt megerősítendő – ${candidate.menuItem.foodName} `
            + `(menuItemId ${candidate.menuItem.menuItemId})`,
          );
        }
      }
      return candidateAmbiguities;
    }),
  };
}

function buildAddOnPlan(
  kind: InterfoodAddOnKind,
  items: InterfoodMenuItem[],
  preferences: InterfoodPreferenceState,
  account: InterfoodAccountSnapshot | undefined,
  repetitionWindows: readonly [number, number, number],
  healthMode: 'off' | 'balanced',
  foodRegistry: InterfoodFoodRegistryEntry[] | undefined,
): InterfoodAddOnPlan {
  const candidates: InterfoodMenuItem[] = items.filter(
    (item: InterfoodMenuItem): boolean => addOnKind(item) === kind,
  );
  const availableKeys: Set<string> = new Set(candidates.flatMap(candidatePreferenceKeys));
  const ranked: InterfoodRankedCandidate[] = candidates
    .map((item: InterfoodMenuItem): InterfoodRankedCandidate => rankCandidate(
      item,
      preferences,
      account,
      new Set<string>(),
      new Map<string, number>(),
      availableKeys,
      repetitionWindows,
      healthMode,
      foodRegistry,
    ))
    .sort((left, right) => Number(left.rejected) - Number(right.rejected)
      || right.score - left.score
      || left.menuItem.priceHuf - right.menuItem.priceHuf
      || left.menuItem.menuItemId - right.menuItem.menuItemId);
  const selected: InterfoodRankedCandidate | undefined = ranked.find(
    (candidate: InterfoodRankedCandidate): boolean => (
      !candidate.rejected && hasExplicitFavorite(candidate.menuItem, preferences)
    ),
  );
  return {
    kind,
    recommendation: selected === undefined ? null : { ...selected, quantity: 1 },
    favoriteCandidates: distinctFoodCandidates(
      ranked.filter((candidate: InterfoodRankedCandidate): boolean => (
        !candidate.rejected
        && hasRepeatedAddOnEvidence(candidate.menuItem, account)
        && !hasExplicitFavorite(candidate.menuItem, preferences)
        && (selected === undefined || foodRegistryKey(candidate.menuItem) !== foodRegistryKey(selected.menuItem))
      )),
    ).slice(0, 3),
  };
}

function distinctFoodCandidates(candidates: InterfoodRankedCandidate[]): InterfoodRankedCandidate[] {
  const seen: Set<string> = new Set();
  return candidates.filter((candidate: InterfoodRankedCandidate): boolean => {
    const key: string = foodRegistryKey(candidate.menuItem);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

interface HealthAlternativeMetrics {
  energyKcal: number;
  proteinG: number;
  saltG: number;
  proteinPer100Kcal: number;
  saltPer100Kcal: number;
  proteinSaltBalance: number;
}

function buildHealthOrientedAlternatives(
  ranked: InterfoodRankedCandidate[],
  selectedFoodKeys: Set<string>,
  preferences: InterfoodPreferenceState,
): InterfoodRankedCandidate[] {
  return distinctFoodCandidates(ranked.filter((candidate: InterfoodRankedCandidate): boolean => (
    !candidate.rejected
    && candidate.dietaryWarnings.length === 0
    && !selectedFoodKeys.has(foodRegistryKey(candidate.menuItem))
    && !hasNegativePreference(candidate.menuItem, preferences)
    && healthAlternativeMetrics(candidate.menuItem) !== null
  )))
    .sort(compareHealthAlternatives)
    .slice(0, 3)
    .map(withHealthAlternativeEvidence);
}

function hasNegativePreference(item: InterfoodMenuItem, preferences: InterfoodPreferenceState): boolean {
  return preferences.entries.some((entry: InterfoodPreference): boolean => (
    ['fallback', 'dislike', 'avoid', 'hard-reject'].includes(entry.stance) && preferenceMatches(item, entry)
  ));
}

function comparePreferenceCandidates(
  left: InterfoodRankedCandidate,
  right: InterfoodRankedCandidate,
  preferences: InterfoodPreferenceState,
): number {
  // A broad positive family match must not cancel an explicit dislike of the actual meal.
  // Preference tiers precede numeric variety/health/price scores; avoid is still not a hard reject.
  return Number(left.rejected) - Number(right.rejected)
    || Number(left.dietaryWarnings.length > 0) - Number(right.dietaryWarnings.length > 0)
    || Number(hasNegativePreference(left.menuItem, preferences))
      - Number(hasNegativePreference(right.menuItem, preferences))
    || right.score - left.score
    || left.menuItem.priceHuf - right.menuItem.priceHuf
    || left.menuItem.menuItemId - right.menuItem.menuItemId;
}

function compareHealthAlternatives(
  left: InterfoodRankedCandidate,
  right: InterfoodRankedCandidate,
): number {
  const leftMetrics: HealthAlternativeMetrics = healthAlternativeMetrics(left.menuItem)!;
  const rightMetrics: HealthAlternativeMetrics = healthAlternativeMetrics(right.menuItem)!;
  return rightMetrics.proteinSaltBalance - leftMetrics.proteinSaltBalance
    || rightMetrics.proteinPer100Kcal - leftMetrics.proteinPer100Kcal
    || leftMetrics.saltPer100Kcal - rightMetrics.saltPer100Kcal
    || leftMetrics.energyKcal - rightMetrics.energyKcal
    || right.score - left.score
    || left.menuItem.priceHuf - right.menuItem.priceHuf
    || left.menuItem.menuItemId - right.menuItem.menuItemId;
}

function withHealthAlternativeEvidence(candidate: InterfoodRankedCandidate): InterfoodRankedCandidate {
  const metrics: HealthAlternativeMetrics = healthAlternativeMetrics(candidate.menuItem)!;
  return {
    ...candidate,
    evidence: [
      ...candidate.evidence,
      `health-oriented:${formatMetric(metrics.proteinPer100Kcal)}g protein/100kcal; `
      + `${formatMetric(metrics.saltPer100Kcal)}g salt/100kcal; ${formatMetric(metrics.energyKcal)}kcal`,
    ],
  };
}

function healthAlternativeMetrics(item: InterfoodMenuItem): HealthAlternativeMetrics | null {
  const energyKcal: number | null = completePortionTotal(item, 'energyKcal');
  const proteinG: number | null = completePortionTotal(item, 'proteinG');
  const saltG: number | null = completePortionTotal(item, 'saltG');
  if (energyKcal === null || proteinG === null || saltG === null || energyKcal <= 0) return null;
  return {
    energyKcal,
    proteinG,
    saltG,
    proteinPer100Kcal: proteinG / energyKcal * 100,
    saltPer100Kcal: saltG / energyKcal * 100,
    proteinSaltBalance: (proteinG / energyKcal * 100) / (1 + saltG / energyKcal * 100),
  };
}

function formatMetric(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function hasRepeatedAddOnEvidence(
  item: InterfoodMenuItem,
  account: InterfoodAccountSnapshot | undefined,
): boolean {
  return historicalUsage(item, account).dayCount >= 5;
}

function allocateDailyServings(
  ranked: InterfoodRankedCandidate[],
  preferences: InterfoodPreferenceState,
  servingsPerDay: number,
  account: InterfoodAccountSnapshot | undefined,
): InterfoodRankedCandidate[] {
  const distinctFoods: InterfoodRankedCandidate[] = [];
  const seenFoodKeys: Set<string> = new Set();
  for (const candidate of ranked) {
    if (candidate.rejected) continue;
    const key: string = foodRegistryKey(candidate.menuItem);
    if (seenFoodKeys.has(key)) continue;
    seenFoodKeys.add(key);
    distinctFoods.push(candidate);
  }
  if (distinctFoods.length === 0 || servingsPerDay <= 0) return [];
  const nonNegativeFoods: InterfoodRankedCandidate[] = distinctFoods.filter((candidate) => (
    candidate.dietaryWarnings.length === 0 && !hasNegativePreference(candidate.menuItem, preferences)
  ));
  const allocationFoods: InterfoodRankedCandidate[] = nonNegativeFoods.length >= servingsPerDay
    ? nonNegativeFoods : distinctFoods;
  const first: InterfoodRankedCandidate = allocationFoods[0]!;
  const firstQuantity: number = hasExplicitFavorite(first.menuItem, preferences)
    && historicalUsage(first.menuItem, account).dayCount > 0
    ? Math.min(2, servingsPerDay)
    : 1;
  const selected: InterfoodRankedCandidate[] = [{ ...first, quantity: firstQuantity }];
  let remaining: number = servingsPerDay - firstQuantity;
  const unselected: InterfoodRankedCandidate[] = allocationFoods.slice(1);
  const selectedFamilyKeys: Set<string> = new Set([primaryMealFamilyKey(first.menuItem)]);
  for (const candidate of unselected) {
    if (remaining <= 0) break;
    const familyKey: string = primaryMealFamilyKey(candidate.menuItem);
    if (selectedFamilyKeys.has(familyKey)) continue;
    selected.push({ ...candidate, quantity: 1 });
    selectedFamilyKeys.add(familyKey);
    remaining -= 1;
  }
  // A complete daily quantity is still more important than semantic variety when the provider
  // publishes no different meal family that passes the safety and preference filters.
  const selectedMenuItemIds: Set<number> = new Set(
    selected.map((candidate: InterfoodRankedCandidate): number => candidate.menuItem.menuItemId),
  );
  for (const candidate of unselected) {
    if (remaining <= 0) break;
    if (selectedMenuItemIds.has(candidate.menuItem.menuItemId)) continue;
    selected.push({ ...candidate, quantity: 1 });
    selectedMenuItemIds.add(candidate.menuItem.menuItemId);
    remaining -= 1;
  }
  return selected;
}

function primaryMealFamilyKey(item: InterfoodMenuItem): string {
  const primaryName: string = item.components[0]?.name ?? item.foodName;
  return normalizeFoodName(primaryName)
    .replace(/\([^)]*\)/gu, ' ')
    .split(',')[0]!
    .replace(/\s+/gu, ' ')
    .trim();
}

function hasExplicitFavorite(item: InterfoodMenuItem, preferences: InterfoodPreferenceState): boolean {
  return preferences.entries.some((entry: InterfoodPreference): boolean => (
    entry.stance === 'favorite' && preferenceMatches(item, entry)
  ));
}

/**
 * Interfood's Saturday menu is delivered on Friday. It is an extension of Friday's choice set,
 * not a separate meal-ordering day.
 */
export function planningDateForMenuDate(menuDate: string): string {
  const parsed: Date = new Date(`${menuDate}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.getUTCDay() !== 6) return menuDate;
  return new Date(parsed.getTime() - DAY_MS).toISOString().slice(0, 10);
}

function rankCandidate(
  item: InterfoodMenuItem,
  preferences: InterfoodPreferenceState,
  account: InterfoodAccountSnapshot | undefined,
  selectedKeys: Set<string>,
  selectedFacets: Map<string, number>,
  availableKeys: Set<string>,
  repetitionWindows: readonly [number, number, number],
  healthMode: 'off' | 'balanced',
  foodRegistry: InterfoodFoodRegistryEntry[] | undefined,
): InterfoodRankedCandidate {
  const scoreBreakdown: Record<string, number> = {};
  const evidence: string[] = [];
  const rejectionReasons: string[] = [];
  const dietaryWarnings: string[] = milkCreamAllergyWarnings(item);
  if (dietaryWarnings.length > 0) scoreBreakdown.dietarySafety = -500;
  if (item.disabled) rejectionReasons.push('upstream-disabled');
  const matched: InterfoodPreference[] = preferences.entries
    .filter((entry: InterfoodPreference): boolean => preferenceMatches(item, entry))
    .sort((left, right) => sourcePriority(right) - sourcePriority(left));
  for (const entry of matched) {
    const weight: number = STANCE_SCORES[entry.stance];
    scoreBreakdown[`preference:${entry.id}`] = weight;
    evidence.push(`${entry.scope}:${entry.key}=${entry.stance} (${entry.source})`);
    if (entry.stance === 'hard-reject') rejectionReasons.push(`hard-reject:${entry.key}`);
  }
  for (const rule of preferences.portionRules ?? []) {
    applyPortionRule(item, rule, scoreBreakdown, evidence);
  }
  const itemKeys: Set<string> = new Set(candidatePreferenceKeys(item));
  for (const comparison of preferences.comparisons) {
    if (!availableKeys.has(comparison.preferredKey) || !availableKeys.has(comparison.overKey)) continue;
    if (itemKeys.has(comparison.preferredKey)) {
      scoreBreakdown[`pairwise:${comparison.id}`] = 60;
      evidence.push(`pairwise:${comparison.preferredKey}>${comparison.overKey} (${comparison.reason})`);
    } else if (itemKeys.has(comparison.overKey)) {
      scoreBreakdown[`pairwise:${comparison.id}`] = -60;
      evidence.push(`pairwise:${comparison.preferredKey}>${comparison.overKey} (${comparison.reason})`);
    }
  }
  const key: string = foodRegistryKey(item);
  const portionEnergyKcal: number | null = completePortionTotal(item, 'energyKcal');
  const portionProteinG: number | null = completePortionTotal(item, 'proteinG');
  if (portionEnergyKcal !== null && portionProteinG !== null) {
    scoreBreakdown.mealCompleteness = Math.round(
      Math.min(20, portionEnergyKcal / 30) + Math.min(15, portionProteinG / 2),
    );
  }
  if (selectedKeys.has(key)) scoreBreakdown.variety = -50;
  for (const facet of varietyFacets(item)) {
    const separator: number = facet.indexOf(':');
    const kind: string = separator < 0 ? facet : facet.slice(0, separator);
    const count: number = selectedFacets.get(facet) ?? 0;
    if (count > 0) {
      // Cap the facet penalty after two prior days. Otherwise restricted but explicitly preferred
      // proteins (notably chicken breast) eventually lose to weak, unrelated candidates.
      scoreBreakdown[`variety:${facet}`] = -(VARIETY_WEIGHTS[kind] ?? 5) * Math.min(count, 2);
    }
  }
  scoreBreakdown.recentHistory = repetitionScore(item, account, repetitionWindows);
  const historicalAffinity = historicalAffinityEvidence(item, account);
  if (historicalAffinity.score > 0) {
    scoreBreakdown.historicalAffinity = historicalAffinity.score;
    evidence.push(historicalAffinity.evidence);
  }
  if (foodRegistry !== undefined) {
    const identity: InterfoodFoodRegistryEntry | undefined = foodRegistry.find(
      (entry: InterfoodFoodRegistryEntry): boolean => entry.key === foodRegistryKey(item),
    );
    if (identity === undefined) scoreBreakdown.identity = -15;
    else if (identity.status === 'new') scoreBreakdown.identity = -10;
    else if (identity.status === 'changed') scoreBreakdown.identity = -50;
  }
  if (healthMode === 'balanced') {
    const proteinG: number | null = completePortionTotal(item, 'proteinG');
    const saltG: number | null = completePortionTotal(item, 'saltG');
    if (proteinG !== null) scoreBreakdown.healthProtein = Math.min(20, proteinG);
    if (saltG !== null) scoreBreakdown.healthSalt = -Math.min(20, saltG * 3);
  }
  scoreBreakdown.price = -Math.round(item.priceHuf / 500);
  return {
    menuItem: item,
    quantity: 1,
    score: Object.values(scoreBreakdown).reduce((total: number, value: number): number => total + value, 0),
    scoreBreakdown,
    evidence,
    dietaryWarnings,
    rejected: rejectionReasons.length > 0,
    rejectionReasons,
  };
}

function needsOwnerReview(candidate: InterfoodRankedCandidate): boolean {
  const scoreKeys: string[] = Object.keys(candidate.scoreBreakdown);
  const hasPreferenceEvidence: boolean = scoreKeys.some((key: string): boolean => (
    key.startsWith('preference:') || key.startsWith('pairwise:')
  ));
  return candidate.dietaryWarnings.length > 0
    || !hasPreferenceEvidence
    || (candidate.scoreBreakdown.identity ?? 0) < 0;
}

function ambiguityMessage(date: string, candidate: InterfoodRankedCandidate): string {
  const identityScore: number = candidate.scoreBreakdown.identity ?? 0;
  const reason: string = candidate.dietaryWarnings.length > 0
    ? candidate.dietaryWarnings.join('; ')
    : identityScore <= -50
    ? 'megváltozott ételazonosság'
    : identityScore < 0
      ? 'új vagy még nem azonosított étel'
      : 'nincs rögzített preferencia';
  const sourceDate: string = candidate.menuItem.date === date ? '' : `; menüforrás ${candidate.menuItem.date}`;
  return `${date}: ${reason} – ${candidate.menuItem.foodName} (menuItemId ${candidate.menuItem.menuItemId}${sourceDate})`;
}

function candidatePreferenceKeys(item: InterfoodMenuItem): string[] {
  return [...new Set([
    foodRegistryKey(item),
    normalizeFoodName(item.foodName),
    normalizeFoodName(item.categoryCode),
    normalizeFoodName(item.categoryName),
    normalizeFoodName(item.categoryGroupName),
    ...varietyFacets(item),
  ])];
}

function preferenceMatches(item: InterfoodMenuItem, entry: InterfoodPreference): boolean {
  const searchableItem: string = normalizeFoodName([
    item.foodName,
    item.categoryName,
    item.categoryGroupName,
    ...item.components.map((component) => component.name),
    stripHtml(item.ingredientsHtml ?? ''),
  ].join(' '));
  if ((entry.excludedPatterns ?? []).some((pattern: string): boolean => searchableItem.includes(pattern))) {
    return false;
  }
  if (entry.scope === 'exact-food') {
    return entry.key === foodRegistryKey(item) || entry.key === normalizeFoodName(item.foodName);
  }
  if (entry.scope === 'food-name-pattern') {
    return normalizeFoodName(item.foodName).includes(entry.key);
  }
  if (entry.scope === 'food-type') {
    return entry.key === normalizeFoodName(item.categoryGroupName) || varietyFacets(item).includes(entry.key);
  }
  if (entry.scope === 'category') {
    return [item.categoryCode, item.categoryName, item.categoryGroupName]
      .map(normalizeFoodName)
      .includes(entry.key);
  }
  const searchableIngredients: string = normalizeFoodName(stripHtml(item.ingredientsHtml ?? ''));
  return searchableIngredients.includes(entry.key);
}

function applyPortionRule(
  item: InterfoodMenuItem,
  rule: InterfoodPortionPreferenceRule,
  scoreBreakdown: Record<string, number>,
  evidence: string[],
): void {
  const normalizedName: string = normalizeFoodName(item.foodName);
  const matchesRiceInflection: boolean = rule.foodNamePattern === 'rizs' && /rizzs/u.test(normalizedName);
  if (!normalizedName.includes(rule.foodNamePattern) && !matchesRiceInflection) return;
  if (rule.excludedFoodNamePatterns.some((pattern: string): boolean => normalizedName.includes(pattern))) return;
  if (item.portionClass !== 'small' && item.portionClass !== 'full') return;
  // A portion rule chooses between occurrences of an otherwise suitable food;
  // it must never make that food more desirable than unrelated alternatives.
  const score: number = item.portionClass === rule.preferredPortionClass ? 0 : -90;
  scoreBreakdown[`portion:${rule.id}`] = score;
  evidence.push(
    `portion:${rule.foodNamePattern}=>${rule.preferredPortionClass} (${rule.source}; ${rule.reason})`,
  );
}

function repetitionScore(
  item: InterfoodMenuItem,
  account: InterfoodAccountSnapshot | undefined,
  windows: readonly [number, number, number],
): number {
  if (account === undefined) return 0;
  const candidateDate: number = Date.parse(`${item.date}T00:00:00Z`);
  if (!Number.isFinite(candidateDate)) return 0;
  return account.lines
    .filter((line): boolean => line.state === 'active'
      && (line.foodId === item.foodId || normalizeFoodName(line.foodName) === normalizeFoodName(item.foodName)))
    .reduce((score: number, line): number => {
      const historyDate: number = Date.parse(`${line.deliveryDate}T00:00:00Z`);
      const ageDays: number = Math.floor((candidateDate - historyDate) / DAY_MS);
      if (!Number.isFinite(historyDate) || ageDays < 0 || ageDays > windows[2]) return score;
      const perUnitPenalty: number = ageDays <= windows[0] ? 15 : ageDays <= windows[1] ? 8 : 3;
      return score - perUnitPenalty * Math.max(1, line.quantity);
    }, 0);
}

function historicalAffinityEvidence(
  item: InterfoodMenuItem,
  account: InterfoodAccountSnapshot | undefined,
): { score: number; evidence: string } {
  const usage = historicalUsage(item, account);
  if (usage.dayCount === 0) return { score: 0, evidence: '' };
  const { totalUnits, doubleDays } = usage;
  const dayCount: number = usage.dayCount;
  // Explicit owner preferences remain stronger. One experimental order has only a tiny effect;
  // repeated dates and deliberate same-day multiples build a capped long-term affinity signal.
  const score: number = Math.min(
    35,
    Math.min(20, dayCount * 2) + Math.min(10, doubleDays * 2) + Math.min(5, Math.floor(totalUnits / 4)),
  );
  return {
    score,
    evidence: `history-affinity:${totalUnits} units/${dayCount} days/${doubleDays} double-days`,
  };
}

function historicalUsage(
  item: InterfoodMenuItem,
  account: InterfoodAccountSnapshot | undefined,
): { totalUnits: number; dayCount: number; doubleDays: number } {
  if (account === undefined) return { totalUnits: 0, dayCount: 0, doubleDays: 0 };
  const candidateDate: number = Date.parse(`${item.date}T00:00:00Z`);
  if (!Number.isFinite(candidateDate)) return { totalUnits: 0, dayCount: 0, doubleDays: 0 };
  const dayUnits: Map<string, number> = new Map();
  for (const line of account.lines) {
    if (line.state !== 'active') continue;
    const historyDate: number = Date.parse(`${line.deliveryDate}T00:00:00Z`);
    if (!Number.isFinite(historyDate) || historyDate >= candidateDate) continue;
    const sameFood: boolean = item.foodId !== null && line.foodId !== null
      ? item.foodId === line.foodId
      : normalizeFoodName(item.foodName) === normalizeFoodName(line.foodName);
    if (!sameFood) continue;
    dayUnits.set(line.deliveryDate, (dayUnits.get(line.deliveryDate) ?? 0) + Math.max(1, line.quantity));
  }
  const units: number[] = [...dayUnits.values()];
  const totalUnits: number = units.reduce((total: number, quantity: number): number => total + quantity, 0);
  const doubleDays: number = units.filter((quantity: number): boolean => quantity >= 2).length;
  return { totalUnits, dayCount: dayUnits.size, doubleDays };
}

function varietyFacets(item: InterfoodMenuItem): string[] {
  const text: string = normalizeFoodName([
    item.foodName,
    ...item.components.map((component) => component.name),
    stripHtml(item.ingredientsHtml ?? ''),
  ].join(' '));
  const facets: string[] = [`category:${normalizeFoodName(item.categoryGroupName)}`];
  const proteins: string[] = classifyAll(text, {
    csirke: ['csirke'],
    pulyka: ['pulyka'],
    sertes: ['sertés', 'sertes', 'sonka', 'kolbász', 'kolbasz', 'bacon', 'vaddisznó', 'vaddiszno'],
    marha: ['marha', 'borjú', 'borju', 'rostélyos', 'rostelyos'],
    hal: ['hal', 'lazac', 'tonhal', 'hekk'],
    tojas: ['tojás', 'tojas'],
    sajt: ['sajt', 'camembert', 'feta'],
    gomba: ['gomba'],
    huvelyes: ['lencse', 'bab', 'borsó', 'borso', 'csicseriborsó', 'csicseriborso'],
  });
  const preparation: string | undefined = classify(text, {
    rantott: ['rántott', 'rantott', 'bundában', 'bundaban'],
    sult: ['sült', 'sult', 'grillezett'],
    rakott: ['rakott'],
    porkolt: ['pörkölt', 'porkolt', 'paprikás', 'paprikas'],
    fozelek: ['főzelék', 'fozelek'],
    leves: ['leves'],
    teszta: ['tészta', 'teszta', 'spagetti', 'makaróni', 'makaroni'],
  });
  const sauce: string | undefined = classify(text, {
    paradicsomos: ['paradicsom', 'bolognai'],
    tejszines: ['tejszín', 'tejszin', 'tejföl', 'tejfol'],
    pestos: ['pesto'],
    sajtos: ['sajtos', 'sajtmártás', 'sajtmartas'],
    csipos: ['chili', 'csípős', 'csipos'],
  });
  const sideName: string | undefined = item.components.slice(1)
    .map((component) => normalizeFoodName(component.name))
    .find((name) => name.length > 0);
  facets.push(...proteins.map((protein: string): string => `protein:${protein}`));
  if (preparation !== undefined) facets.push(`preparation:${preparation}`);
  if (sideName !== undefined) facets.push(`side:${sideName}`);
  if (sauce !== undefined) facets.push(`sauce:${sauce}`);
  const mealName: string = normalizeFoodName([item.foodName, ...item.components.map((component) => component.name)].join(' '));
  if (/tészt[aá]|teszt[aá]|spagetti|makaróni|makaroni|lasagne|lasagna|penne|ravioli|galuska/u.test(mealName)
    && !/tortilla|burrito|wrap/u.test(mealName)) facets.push('meal:pasta');
  const meatPresent: boolean = /csirke|jérce|jerce|pulyka|sertés|sertes|marha|kacsa|szarvas|vaddisznó|hús|hus/u.test(text);
  const fruitInMealName: boolean = /barack|anan[áa]s|mandarin|narancs|szilv|almás|almas|almával|almaval|körte|korte|meggy|áfony|afony/u.test(mealName);
  if (meatPresent && fruitInMealName) facets.push('meal:fruit-meat');
  if (isFruitSoup(item)) facets.push('meal:gyumolcsleves');
  if (milkCreamAllergyWarnings(item).length > 0) facets.push('allergen:milk-cream');
  return [...new Set(facets)];
}

function milkCreamAllergyWarnings(item: InterfoodMenuItem): string[] {
  const labelText: string = normalizeFoodName([
    item.foodName,
    ...item.components.map((component) => component.name),
  ].join(' '));
  let ingredientText: string = normalizeFoodName(stripHtml(item.ingredientsHtml ?? ''));
  ingredientText = ingredientText
    .replace(/(?:ami\s+)?nyomokban[\s\S]*?tartalmazhat(?:\.|$)/gu, ' ')
    .replace(/\b(?:sajt|tejföl|tejfol|joghurt|túró|turo|vaj)\s*\([^)]*tej[^)]*\)/gu, ' tolerated-dairy ');
  const text: string = `${labelText} ${ingredientText}`;
  const matched: string[] = [];
  const checks: Array<{ label: string; pattern: RegExp }> = [
    { label: 'tejszín', pattern: /tejszín|tejszin/u },
    { label: 'tej', pattern: /\btej\b|tejpor|tejfehérje|tejfeherje|tejsavó|tejsavo|tejbegríz|tejbegriz/u },
  ];
  for (const check of checks) {
    if (check.pattern.test(text)) matched.push(check.label);
  }
  if (matched.length === 0) return [];
  return [`ÉTELALLERGIA – tej/tejszín kerülendő (${[...new Set(matched)].join(', ')}); sajt önmagában kivétel`];
}

function isFruitSoup(item: InterfoodMenuItem): boolean {
  const category: string = normalizeFoodName(`${item.categoryName} ${item.categoryGroupName}`);
  if (!category.includes('leves')) return false;
  const name: string = normalizeFoodName(item.foodName);
  return FRUIT_SOUP_TERMS.some((term: string): boolean => name.includes(normalizeFoodName(term)));
}

function classify(text: string, groups: Readonly<Record<string, readonly string[]>>): string | undefined {
  return Object.entries(groups).find(([, terms]) => terms.some((term) => text.includes(term)))?.[0];
}

function classifyAll(text: string, groups: Readonly<Record<string, readonly string[]>>): string[] {
  return Object.entries(groups)
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([group]) => group);
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ');
}

function completePortionTotal(
  item: InterfoodMenuItem,
  field: 'energyKcal' | 'proteinG' | 'saltG',
): number | null {
  if (item.components.length === 0) return null;
  let total: number = 0;
  for (const component of item.components) {
    const value: number | null = component.portion[field];
    if (value === null) return null;
    total += value;
  }
  return total;
}

function sourcePriority(entry: InterfoodPreference): number {
  return entry.source === 'explicit-user' ? 3 : entry.source === 'confirmed-order' ? 2 : 1;
}

function isStandaloneMealCandidate(item: InterfoodMenuItem): boolean {
  if (addOnKind(item) !== undefined) return false;
  if (hasBundledDessert(item)) return false;
  const excludedGroups: ReadonlySet<string> = new Set(['desszert', 'pékáru', 'jókenyér', 'savanyúság']);
  return !excludedGroups.has(normalizeFoodName(item.categoryGroupName));
}

function hasBundledDessert(item: InterfoodMenuItem): boolean {
  const categoryText: string = normalizeFoodName(`${item.categoryName} ${item.categoryGroupName}`);
  return categoryText.includes('sütemény') || categoryText.includes('sutemeny');
}

function addOnKind(item: InterfoodMenuItem): InterfoodAddOnKind | undefined {
  const category: string = normalizeFoodName(item.categoryName);
  const categoryGroup: string = normalizeFoodName(item.categoryGroupName);
  const foodName: string = normalizeFoodName(item.foodName);
  if (
    category.includes('desszert')
    || categoryGroup.includes('desszert')
    || DESSERT_FOOD_NAME_TERMS.some((term: string): boolean => foodName.includes(normalizeFoodName(term)))
  ) return 'dessert';
  // Menu feeds do not consistently use the soup category. Treat every food explicitly named
  // as a soup as an add-on, including soup+main bundles: an unconfirmed soup must never silently
  // consume one of the two daily main-meal slots.
  if (
    categoryGroup === 'leves'
    || category === 'leves'
    || category === 'kis leves'
    || foodName.includes('leves')
  ) return 'soup';
  return undefined;
}
