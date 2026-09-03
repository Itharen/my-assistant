export interface InterfoodWeek {
  year: number;
  week: number;
  disabled: boolean;
  message: string | null;
}

export type InterfoodPortionClass = 'small' | 'full' | 'mixed' | 'unspecified';

export interface InterfoodNutrition {
  energyKcal: number | null;
  fatG: number | null;
  saturatedFatG: number | null;
  carbohydrateG: number | null;
  sugarG: number | null;
  proteinG: number | null;
  saltG: number | null;
}

export interface InterfoodMealComponent {
  position: 1 | 2 | 3;
  name: string;
  weightG: number | null;
  portion: InterfoodNutrition;
  per100g: InterfoodNutrition;
}

export interface InterfoodMenuItem {
  menuItemId: number;
  foodId: number | null;
  foodName: string;
  displayName: string | null;
  date: string;
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  categoryGroupId: number;
  categoryGroupName: string;
  portionClass: InterfoodPortionClass;
  relatedFullPortionCategoryId: number | null;
  priceHuf: number;
  disabled: boolean;
  cancelDeadline: string | null;
  ingredientsHtml: string | null;
  nutritionSummary: string | null;
  rating: number | null;
  components: InterfoodMealComponent[];
}

export interface InterfoodOrderLine {
  orderId: string;
  orderLineId: string | null;
  menuItemId: number;
  foodId: number | null;
  foodName: string;
  deliveryDate: string;
  categoryCode: string;
  categoryName: string;
  portionClass: InterfoodPortionClass;
  quantity: number;
  unitPriceHuf: number | null;
  linePriceHuf: number | null;
  state: 'active' | 'cancelled' | 'removed' | 'unknown';
  sourceFingerprint: string;
}

export interface InterfoodCoverageRequirement {
  date: string;
  expectedUnitCount: number;
}

export interface InterfoodDayCoverage {
  date: string;
  status: 'covered' | 'partial' | 'not-covered';
  orderedUnitCount: number;
  expectedUnitCount: number;
  evidence: InterfoodOrderLine[];
}

export interface InterfoodMenuWeek {
  year: number;
  week: number;
  itemCount: number;
  dates: string[];
  items: InterfoodMenuItem[];
}

export interface InterfoodMenuRange {
  requestedWeeks: number;
  returnedWeeks: number;
  complete: boolean;
  currentWeek: { year: number; week: number };
  weeks: InterfoodMenuWeek[];
  warning: string | null;
}

export type InterfoodPreferenceScope =
  | 'exact-food'
  | 'food-name-pattern'
  | 'food-type'
  | 'category'
  | 'ingredient-pattern';
export type InterfoodPreferenceStance =
  | 'favorite'
  | 'prefer'
  | 'neutral'
  | 'fallback'
  | 'dislike'
  | 'avoid'
  | 'hard-reject';
export type InterfoodPreferenceSource = 'explicit-user' | 'confirmed-order' | 'inferred';
export type InterfoodPreferenceConfidence = 'confirmed' | 'observed' | 'tentative';

export interface InterfoodPreference {
  id: string;
  scope: InterfoodPreferenceScope;
  key: string;
  stance: InterfoodPreferenceStance;
  source: InterfoodPreferenceSource;
  confidence: InterfoodPreferenceConfidence;
  excludedPatterns?: string[];
  reason: string;
  createdAt: string;
  lastConfirmedAt: string;
}

export interface InterfoodPreferenceComparison {
  id: string;
  preferredKey: string;
  overKey: string;
  reason: string;
  createdAt: string;
}

export interface InterfoodPortionPreferenceRule {
  id: string;
  foodNamePattern: string;
  preferredPortionClass: 'small' | 'full';
  excludedFoodNamePatterns: string[];
  source: 'explicit-user';
  confidence: 'confirmed';
  reason: string;
  createdAt: string;
  lastConfirmedAt: string;
}

export interface InterfoodPreferenceState {
  schemaVersion: '1.0.0';
  updatedAt: string;
  entries: InterfoodPreference[];
  comparisons: InterfoodPreferenceComparison[];
  portionRules: InterfoodPortionPreferenceRule[];
}

export interface InterfoodFoodRegistryEntry {
  key: string;
  foodId: number | null;
  normalizedName: string;
  foodFingerprint: string;
  contentFingerprint: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastMenuItemIds: number[];
  status: 'known' | 'new' | 'changed';
}

export interface InterfoodAccountSnapshot {
  schemaVersion: '1.0.0';
  syncedAt: string;
  complete: boolean;
  years: number[];
  pagesRead: number;
  rawOrders: Record<string, unknown>[];
  lines: InterfoodOrderLine[];
  warnings: string[];
}

export type InterfoodPatternConfidence = 'strong' | 'moderate' | 'weak';

export interface InterfoodFoodOrderPattern {
  key: string;
  foodId: number | null;
  foodName: string;
  categoryNames: string[];
  totalUnits: number;
  orderDayCount: number;
  orderCount: number;
  doubleOrderDayCount: number;
  maxUnitsPerDay: number;
  firstOrderedDate: string;
  lastOrderedDate: string;
  portionUnitCounts: Record<InterfoodPortionClass, number>;
  suggestion: 'confirm-favorite' | 'confirm-prefer' | 'observe';
  confidence: InterfoodPatternConfidence;
  evidence: string[];
}

export interface InterfoodCategoryOrderPattern {
  categoryName: string;
  totalUnits: number;
  orderDayCount: number;
  distinctFoodCount: number;
}

export interface InterfoodHistoryPatternReport {
  schemaVersion: '1.0.0';
  generatedAt: string;
  snapshotSyncedAt: string;
  activeLineCount: number;
  activeUnitCount: number;
  firstOrderedDate: string | null;
  lastOrderedDate: string | null;
  foods: InterfoodFoodOrderPattern[];
  categories: InterfoodCategoryOrderPattern[];
}

export interface InterfoodRankedCandidate {
  menuItem: InterfoodMenuItem;
  /** Number of portions selected from this exact menu occurrence; alternatives remain 1. */
  quantity: number;
  score: number;
  scoreBreakdown: Record<string, number>;
  evidence: string[];
  /** Prominent safety alerts that must be shown whenever this candidate is surfaced. */
  dietaryWarnings: string[];
  rejected: boolean;
  rejectionReasons: string[];
}

export type InterfoodAddOnKind = 'dessert' | 'soup';

export interface InterfoodAddOnPlan {
  kind: InterfoodAddOnKind;
  /** Add-ons are optional and never consume either of the two main-meal portions. */
  recommendation: InterfoodRankedCandidate | null;
  /** Strong repeated-history identities awaiting explicit owner favorite confirmation. */
  favoriteCandidates: InterfoodRankedCandidate[];
}

export interface InterfoodDayPlan {
  /** Decision/delivery day. Saturday menu occurrences are delivered on and grouped into Friday. */
  date: string;
  /** Upstream menu dates contributing candidates to this decision day. */
  sourceDates: string[];
  recommendations: InterfoodRankedCandidate[];
  /** General/likely-liked same-day main-meal alternatives, distinct by food identity. */
  alternatives: InterfoodRankedCandidate[];
  /** Nutrition-backed alternatives ranked by protein density, salt density and energy. */
  healthOrientedAlternatives: InterfoodRankedCandidate[];
  addOns: InterfoodAddOnPlan[];
}

export interface InterfoodWeekPlan {
  schemaVersion: '1.0.0';
  generatedAt: string;
  year: number;
  week: number;
  mealsPerDay: number;
  days: InterfoodDayPlan[];
  ambiguities: string[];
}
