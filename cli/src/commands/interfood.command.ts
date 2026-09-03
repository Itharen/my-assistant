import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import {
  InterfoodAccountService,
  InterfoodCartDiff,
  InterfoodCartSummary,
  summarizeCart,
  summarizeOrderDetails,
} from '../interfood/interfood.account-service.js';
import { InterfoodApiClient } from '../interfood/interfood.api-client.js';
import { InterfoodAuthenticatedClient } from '../interfood/interfood.auth-client.js';
import { computeInterfoodCoverage } from '../interfood/interfood.coverage.js';
import { InterfoodToolError } from '../interfood/interfood.error.js';
import { InterfoodFoodRegistry, normalizeFoodName } from '../interfood/interfood.food-registry.js';
import { buildInterfoodHistoryPatterns } from '../interfood/interfood.history-patterns.js';
import {
  InterfoodAccountSnapshot,
  InterfoodCoverageRequirement,
  InterfoodFoodOrderPattern,
  InterfoodHistoryPatternReport,
  InterfoodMenuItem,
  InterfoodWeekPlan,
} from '../interfood/interfood.models.js';
import { resolveInterfoodPaths, writeJsonAtomically } from '../interfood/interfood.paths.js';
import {
  InterfoodPreferenceStore,
  requirePreferenceScope,
  requirePreferenceStance,
} from '../interfood/interfood.preference-store.js';
import { buildInterfoodWeekPlan, planningDateForMenuDate } from '../interfood/interfood.ranker.js';
import { makeRequestId, ok, writeEnvelope } from '../output/envelope.js';

export interface InterfoodCommandDependencies {
  api?: InterfoodApiClient;
  authenticated?: InterfoodAuthenticatedClient;
  projectStartDirectory?: string;
  userHome?: string;
}

export async function runInterfoodCommand(
  command: string,
  args: string[],
  dependencies: InterfoodCommandDependencies = {},
): Promise<void> {
  const startedAt: number = Date.now();
  const requestId: string = makeRequestId();
  const api: InterfoodApiClient = dependencies.api ?? new InterfoodApiClient();

  if (command === 'weeks') {
    const parsed = parseArgs({ args, options: prettyOption(), strict: true });
    const [currentWeek, weeks] = await Promise.all([api.getCurrentWeek(), api.getWeeks()]);
    output('interfood.weeks', { currentWeek, weeks }, parsed.values.pretty, requestId, startedAt);
    return;
  }
  if (command === 'menu') {
    const parsed = parseArgs({ args, options: { year: { type: 'string' }, week: { type: 'string' }, ...prettyOption() }, strict: true });
    const target = await targetWeek(api, parsed.values.year, parsed.values.week);
    output('interfood.menu', await api.getMenu(target.year, target.week), parsed.values.pretty, requestId, startedAt);
    return;
  }
  if (command === 'menu-range') {
    const parsed = parseArgs({ args, options: { weeks: { type: 'string', default: '3' }, ...prettyOption() }, strict: true });
    output('interfood.menu-range', await api.getMenuRange(parseInteger(parsed.values.weeks, '--weeks', 1, 8)), parsed.values.pretty, requestId, startedAt);
    return;
  }
  if (command === 'auth') {
    const authenticated = dependencies.authenticated ?? new InterfoodAuthenticatedClient();
    const action: string = requiredAction(args, 'auth');
    const parsed = parseArgs({ args: args.slice(1), options: prettyOption(), strict: true });
    const result: unknown = action === 'status' ? await authenticated.sessionStatus()
      : action === 'start' ? await authenticated.startSession()
        : unknownAction('auth', action);
    output(`interfood.auth.${action}`, result, parsed.values.pretty, requestId, startedAt);
    return;
  }
  const paths = resolveInterfoodPaths(
    dependencies.projectStartDirectory ?? dirname(fileURLToPath(import.meta.url)),
    dependencies.userHome,
  );
  const authenticated = dependencies.authenticated ?? new InterfoodAuthenticatedClient();
  const account = new InterfoodAccountService(authenticated, paths);
  const preferences = new InterfoodPreferenceStore(paths.preferences);
  const registry = new InterfoodFoodRegistry(paths.foodRegistry);
  if (command === 'orders') {
    const action: string = requiredAction(args, 'orders');
    const parsed = parseArgs({
      args: args.slice(1),
      options: {
        'from-year': { type: 'string', default: '2022' },
        'through-year': { type: 'string', default: String(new Date().getFullYear() + 1) },
        'expected-per-day': { type: 'string', default: '2' },
        limit: { type: 'string', default: '20' },
        'minimum-units': { type: 'string', default: '2' },
        'double-orders-only': { type: 'boolean', default: false },
        'add-ons-only': { type: 'boolean', default: false },
        summary: { type: 'boolean', default: false },
        full: { type: 'boolean', default: false },
        year: { type: 'string' },
        week: { type: 'string' },
        ...prettyOption(),
      },
      strict: true,
    });
    if (action === 'sync') {
      const snapshot = await account.syncOrders(
        parseInteger(parsed.values['from-year'], '--from-year', 2022, 2200),
        parseInteger(parsed.values['through-year'], '--through-year', 2022, 2200),
      );
      output('interfood.orders.sync', parsed.values.full === true && parsed.values.summary !== true ? snapshot : summarizeAccountSnapshot(snapshot), parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'week') {
      const target = await targetWeek(api, parsed.values.year, parsed.values.week);
      const orders = await account.ordersForWeek(target.year, target.week);
      const payload: unknown = parsed.values.full !== true || parsed.values.summary === true
        ? {
          ...target,
          rawOrderCount: orders.rawOrderCount,
          lineCount: orders.lines.length,
          activeUnitCount: orders.lines.filter((line) => line.state === 'active').reduce((total, line) => total + line.quantity, 0),
          dates: [...new Set(orders.lines.map((line) => line.deliveryDate).filter(Boolean))].sort(),
        }
        : { ...target, orders };
      output('interfood.orders.week', payload, parsed.values.pretty, requestId, startedAt);
      return;
    }
    const snapshot: InterfoodAccountSnapshot = await account.loadOrders();
    if (action === 'list') {
      output('interfood.orders.list', parsed.values.full === true && parsed.values.summary !== true ? snapshot : summarizeAccountSnapshot(snapshot), parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'coverage') {
      const expected: number = parseInteger(parsed.values['expected-per-day'], '--expected-per-day', 1, 20);
      const target = await targetWeek(api, parsed.values.year, parsed.values.week);
      const menu = await api.getMenu(target.year, target.week);
      const dates: string[] = [...new Set(
        menu.items.map((item: InterfoodMenuItem) => planningDateForMenuDate(item.date)).filter(Boolean),
      )].sort();
      const requirements: InterfoodCoverageRequirement[] = dates.map((date: string) => ({ date, expectedUnitCount: expected }));
      output('interfood.orders.coverage', { year: target.year, week: target.week, syncedAt: snapshot.syncedAt, coverage: computeInterfoodCoverage(snapshot.lines, requirements) }, parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'patterns') {
      const report: InterfoodHistoryPatternReport = buildInterfoodHistoryPatterns(snapshot);
      const minimumUnits: number = parseInteger(parsed.values['minimum-units'], '--minimum-units', 1, 10_000);
      const limit: number = parseInteger(parsed.values.limit, '--limit', 1, 500);
      const foods: InterfoodFoodOrderPattern[] = report.foods
        .filter((pattern: InterfoodFoodOrderPattern): boolean => (
          pattern.totalUnits >= minimumUnits
          && (parsed.values['double-orders-only'] !== true || pattern.doubleOrderDayCount > 0)
          && (parsed.values['add-ons-only'] !== true || isAddOnPattern(pattern))
        ))
        .slice(0, limit);
      output('interfood.orders.patterns', {
        ...report,
        foods,
        returnedFoodCount: foods.length,
        totalFoodCount: report.foods.length,
        filters: {
          minimumUnits,
          doubleOrdersOnly: parsed.values['double-orders-only'] === true,
          addOnsOnly: parsed.values['add-ons-only'] === true,
          limit,
        },
        interpretation: 'Observed evidence only. Confirm with the owner before writing an explicit preference.',
      }, parsed.values.pretty, requestId, startedAt);
      return;
    }
    unknownAction('orders', action);
  }
  if (command === 'foods') {
    const action: string = requiredAction(args, 'foods');
    const parsed = parseArgs({ args: args.slice(1), options: { weeks: { type: 'string', default: '3' }, commit: { type: 'boolean', default: false }, summary: { type: 'boolean', default: false }, ...prettyOption() }, strict: true });
    if (action === 'identify') {
      const range = await api.getMenuRange(parseInteger(parsed.values.weeks, '--weeks', 1, 8));
      const result = await registry.identify(range.weeks.flatMap((week) => week.items), parsed.values.commit === true);
      const payload: unknown = parsed.values.summary === true
        ? { newCount: result.newCount, changedCount: result.changedCount, knownCount: result.knownCount, committed: result.committed, completeMenuRange: range.complete }
        : { ...result, completeMenuRange: range.complete };
      output('interfood.foods.identify', payload, parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'list') {
      output('interfood.foods.list', { entries: await registry.list() }, parsed.values.pretty, requestId, startedAt);
      return;
    }
    unknownAction('foods', action);
  }
  if (command === 'preference') {
    const action: string = requiredAction(args, 'preference');
    const parsed = parseArgs({
      args: args.slice(1),
      options: {
        scope: { type: 'string' },
        key: { type: 'string' },
        stance: { type: 'string' },
        reason: { type: 'string' },
        prefer: { type: 'string' },
        over: { type: 'string' },
        pattern: { type: 'string' },
        'except-pattern': { type: 'string', multiple: true },
        ...prettyOption(),
      },
      strict: true,
    });
    if (action === 'list') {
      output('interfood.preference.list', await preferences.load(), parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'set') {
      const result = await preferences.set({
        scope: requirePreferenceScope(parsed.values.scope),
        key: requiredString(parsed.values.key, '--key'),
        stance: requirePreferenceStance(parsed.values.stance),
        reason: requiredString(parsed.values.reason, '--reason'),
        excludedPatterns: parsed.values['except-pattern'] ?? [],
      });
      output('interfood.preference.set', result, parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'compare') {
      const result = await preferences.compare(requiredString(parsed.values.prefer, '--prefer'), requiredString(parsed.values.over, '--over'), requiredString(parsed.values.reason, '--reason'));
      output('interfood.preference.compare', result, parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'portion') {
      const preferredPortionClass: string = requiredString(parsed.values.prefer, '--prefer');
      if (preferredPortionClass !== 'small' && preferredPortionClass !== 'full') {
        throw new InterfoodToolError(
          'MA-INTERFOOD-PREFERENCE',
          `Invalid preferred portion: ${preferredPortionClass}.`,
          { allowed: ['small', 'full'] },
        );
      }
      const result = await preferences.setPortionRule({
        foodNamePattern: requiredString(parsed.values.pattern, '--pattern'),
        preferredPortionClass,
        excludedFoodNamePatterns: parsed.values['except-pattern'] ?? [],
        reason: requiredString(parsed.values.reason, '--reason'),
      });
      output('interfood.preference.portion', result, parsed.values.pretty, requestId, startedAt);
      return;
    }
    unknownAction('preference', action);
  }
  if (command === 'plan') {
    const action: string = requiredAction(args, 'plan');
    if (action !== 'week') unknownAction('plan', action);
    const parsed = parseArgs({
      args: args.slice(1),
      options: {
        year: { type: 'string' },
        week: { type: 'string' },
        'meals-per-day': { type: 'string', default: '2' },
        'health-mode': { type: 'string', default: 'off' },
        'repetition-windows': { type: 'string', default: '7,14,28' },
        summary: { type: 'boolean', default: false },
        ...prettyOption(),
      },
      strict: true,
    });
    const target = await targetWeek(api, parsed.values.year, parsed.values.week);
    const menu = await api.getMenu(target.year, target.week);
    const accountSnapshot: InterfoodAccountSnapshot | undefined = await account.loadOrders().catch((error: unknown) => {
      if (error instanceof InterfoodToolError && error.code === 'MA-INTERFOOD-ORDERS-NOT-SYNCED') return undefined;
      throw error;
    });
    const healthMode: 'off' | 'balanced' = parsed.values['health-mode'] === 'balanced' ? 'balanced' : 'off';
    const result = buildInterfoodWeekPlan({
      year: target.year,
      week: target.week,
      items: menu.items,
      preferences: await preferences.load(),
      account: accountSnapshot,
      mealsPerDay: parseInteger(parsed.values['meals-per-day'], '--meals-per-day', 1, 10),
      healthMode,
      repetitionWindowsDays: parseRepetitionWindows(parsed.values['repetition-windows']),
      foodRegistry: await registry.list(),
    });
    await writeJsonAtomically(paths.latestPlan, result);
    output('interfood.plan.week', parsed.values.summary === true ? summarizeWeekPlan(result) : result, parsed.values.pretty, requestId, startedAt);
    return;
  }
  if (command === 'nutrition') {
    const action: string = requiredAction(args, 'nutrition');
    if (action !== 'compare') unknownAction('nutrition', action);
    const parsed = parseArgs({ args: args.slice(1), options: { year: { type: 'string' }, week: { type: 'string' }, ids: { type: 'string' }, ...prettyOption() }, strict: true });
    const target = await targetWeek(api, parsed.values.year, parsed.values.week);
    const menu = await api.getMenu(target.year, target.week);
    const ids: Set<number> = new Set(requiredString(parsed.values.ids, '--ids').split(',').map((value: string) => parseInteger(value.trim(), '--ids', 1, Number.MAX_SAFE_INTEGER)));
    const items: InterfoodMenuItem[] = menu.items.filter((item: InterfoodMenuItem): boolean => ids.has(item.menuItemId));
    output('interfood.nutrition.compare', { requestedIds: [...ids], items }, parsed.values.pretty, requestId, startedAt);
    return;
  }
  if (command === 'cart') {
    const action: string = requiredAction(args, 'cart');
    const parsed = parseArgs({ args: args.slice(1), options: { 'menu-item-id': { type: 'string' }, quantity: { type: 'string' }, 'items-file': { type: 'string' }, full: { type: 'boolean', default: false }, ...prettyOption() }, strict: true });
    if (action === 'show') {
      const cart: unknown = await account.cart();
      output('interfood.cart.show', parsed.values.full === true ? cart : summarizeCart(cart), parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'set') {
      const result = await account.setCartQuantity(parseInteger(parsed.values['menu-item-id'], '--menu-item-id', 1, Number.MAX_SAFE_INTEGER), parseInteger(parsed.values.quantity, '--quantity', 0, 50));
      output('interfood.cart.set', result, parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'diff') {
      const result = await account.diffCart(requiredString(parsed.values['items-file'], '--items-file'));
      output('interfood.cart.diff', parsed.values.full === true ? result : { cart: summarizeCart(result.authoritativeCart), diff: result.diff }, parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'reconcile') {
      const result = await account.reconcileCart(requiredString(parsed.values['items-file'], '--items-file'));
      output('interfood.cart.reconcile', parsed.values.full === true ? result : summarizeCartReceipt(result), parsed.values.pretty, requestId, startedAt);
      return;
    }
    const operation = action === 'add' ? 'cart.add' : action === 'subtract' ? 'cart.subtract' : action === 'remove' ? 'cart.remove' : action === 'clear' ? 'cart.clear' : undefined;
    if (operation === undefined) unknownAction('cart', action);
    const menuItemId: number | undefined = action === 'clear' ? undefined : parseInteger(parsed.values['menu-item-id'], '--menu-item-id', 1, Number.MAX_SAFE_INTEGER);
    output(`interfood.cart.${action}`, await account.mutateCart(operation!, menuItemId), parsed.values.pretty, requestId, startedAt);
    return;
  }
  if (command === 'order') {
    const action: string = requiredAction(args, 'order');
    const parsed = parseArgs({
      args: args.slice(1),
      options: { 'order-id': { type: 'string' }, 'cart-items-file': { type: 'string' }, 'menu-item-id': { type: 'string' }, quantity: { type: 'string' }, 'preview-hash': { type: 'string' }, 'confirmed-by': { type: 'string' }, full: { type: 'boolean', default: false }, ...prettyOption() },
      strict: true,
    });
    if (action === 'show') {
      const details: unknown = await account.orderDetails(parseInteger(parsed.values['order-id'], '--order-id', 1, Number.MAX_SAFE_INTEGER));
      output('interfood.order.show', parsed.values.full === true ? details : summarizeOrderDetails(details), parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'check') {
      const result = await account.orderSafetyCheck(parseInteger(parsed.values['order-id'], '--order-id', 1, Number.MAX_SAFE_INTEGER));
      output('interfood.order.check', parsed.values.full === true ? result : summarizeOrderSafety(result), parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'change-preview') {
      const orderId: number = parseInteger(parsed.values['order-id'], '--order-id', 1, Number.MAX_SAFE_INTEGER);
      const directLine: boolean = parsed.values['menu-item-id'] !== undefined || parsed.values.quantity !== undefined;
      const modes: number = Number(parsed.values['cart-items-file'] !== undefined) + Number(directLine);
      if (modes !== 1) {
        throw new InterfoodToolError('MA-INTERFOOD-OPTION', 'Choose exactly one preview source: --cart-items-file, or --menu-item-id with --quantity.');
      }
      const result = directLine
        ? await account.createReducedOrderPreview(
          orderId,
          parseInteger(parsed.values['menu-item-id'], '--menu-item-id', 1, Number.MAX_SAFE_INTEGER),
          parseInteger(parsed.values.quantity, '--quantity', 0, 50),
        )
        : await account.createOrderChangePreview(orderId, requiredString(parsed.values['cart-items-file'], '--cart-items-file'));
      output('interfood.order.change-preview', parsed.values.full === true ? result : summarizeOrderChangeReceipt(result), parsed.values.pretty, requestId, startedAt);
      return;
    }
    if (action === 'change-apply') {
      const result = await account.applyOrderChange(requiredString(parsed.values['preview-hash'], '--preview-hash'), requiredString(parsed.values['confirmed-by'], '--confirmed-by'));
      output('interfood.order.change-apply', parsed.values.full === true ? result : summarizeOrderChangeReceipt(result), parsed.values.pretty, requestId, startedAt);
      return;
    }
    unknownAction('order', action);
  }
  throw new InterfoodToolError('MA-INTERFOOD-COMMAND', `Unknown Interfood command: ${command}`);
}

async function targetWeek(api: InterfoodApiClient, year: unknown, week: unknown): Promise<{ year: number; week: number }> {
  const hasYear: boolean = typeof year === 'string';
  const hasWeek: boolean = typeof week === 'string';
  if (hasYear !== hasWeek) throw new InterfoodToolError('MA-INTERFOOD-OPTION', '--year and --week must be provided together.');
  return hasYear && hasWeek ? { year: parseInteger(year, '--year', 2020, 2200), week: parseInteger(week, '--week', 1, 53) } : api.getCurrentWeek();
}

function prettyOption(): { pretty: { type: 'boolean'; default: false } } {
  return { pretty: { type: 'boolean', default: false } };
}

function output(action: string, result: unknown, pretty: unknown, requestId: string, startedAt: number): void {
  writeEnvelope(ok(action, requestId, startedAt, result), pretty === true);
}

function requiredAction(args: string[], command: string): string {
  const action: string | undefined = args[0];
  if (action === undefined || action.startsWith('-')) throw new InterfoodToolError('MA-INTERFOOD-COMMAND', `ma interfood ${command} requires an action.`);
  return action;
}

function requiredString(value: unknown, flag: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new InterfoodToolError('MA-INTERFOOD-OPTION', `${flag} is required.`);
  return value.trim();
}

function parseInteger(raw: unknown, flag: string, minimum: number, maximum: number): number {
  const parsed: number = typeof raw === 'string' ? Number(raw) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) throw new InterfoodToolError('MA-INTERFOOD-OPTION', `${flag} must be an integer between ${minimum} and ${maximum}.`, { flag, value: raw });
  return parsed;
}

export function parseRepetitionWindows(raw: unknown): readonly [number, number, number] {
  const values: number[] = typeof raw === 'string'
    ? raw.trim().split(/[\s,]+/).map((value: string): number => Number(value))
    : [];
  const valid: boolean = values.length === 3
    && values.every((value: number): boolean => Number.isInteger(value) && value >= 1 && value <= 365)
    && values[0]! < values[1]!
    && values[1]! < values[2]!;
  if (!valid) {
    throw new InterfoodToolError(
      'MA-INTERFOOD-OPTION',
      '--repetition-windows must contain three strictly increasing day counts between 1 and 365 (for example 7,14,28).',
      { flag: '--repetition-windows', value: raw },
    );
  }
  return [values[0]!, values[1]!, values[2]!];
}

export function isAddOnPattern(pattern: InterfoodFoodOrderPattern): boolean {
  return pattern.categoryNames.some((categoryName: string): boolean => {
    const normalized: string = normalizeFoodName(categoryName);
    return normalized.includes('desszert') || normalized === 'leves' || normalized === 'kis leves';
  });
}

function unknownAction(group: string, action: string): never {
  throw new InterfoodToolError('MA-INTERFOOD-COMMAND', `Unknown Interfood action: ${group} ${action}`);
}

function summarizeAccountSnapshot(snapshot: InterfoodAccountSnapshot): Omit<InterfoodAccountSnapshot, 'rawOrders' | 'lines'> & { orderCount: number; lineCount: number } {
  const { rawOrders, lines, ...metadata } = snapshot;
  return { ...metadata, orderCount: rawOrders.length, lineCount: lines.length };
}

export function summarizeWeekPlan(plan: InterfoodWeekPlan): unknown {
  const compactCandidate = (candidate: InterfoodWeekPlan['days'][number]['recommendations'][number]): unknown => ({
    menuItemId: candidate.menuItem.menuItemId,
    menuDate: candidate.menuItem.date,
    quantity: candidate.quantity,
    foodId: candidate.menuItem.foodId,
    foodName: candidate.menuItem.foodName,
    category: candidate.menuItem.categoryName,
    portionClass: candidate.menuItem.portionClass,
    priceHuf: candidate.menuItem.priceHuf,
    score: candidate.score,
    evidence: candidate.evidence,
    dietaryWarnings: candidate.dietaryWarnings,
  });
  return {
    schemaVersion: plan.schemaVersion,
    generatedAt: plan.generatedAt,
    year: plan.year,
    week: plan.week,
    mealsPerDay: plan.mealsPerDay,
    days: plan.days.map((day) => ({
      date: day.date,
      sourceDates: day.sourceDates,
      recommendations: day.recommendations.map(compactCandidate),
      alternatives: day.alternatives.map(compactCandidate),
      healthOrientedAlternatives: day.healthOrientedAlternatives.map(compactCandidate),
      addOns: day.addOns.map((addOn) => ({
        kind: addOn.kind,
        recommendation: addOn.recommendation === null ? null : compactCandidate(addOn.recommendation),
        favoriteCandidates: addOn.favoriteCandidates.map(compactCandidate),
      })),
    })),
    ambiguities: plan.ambiguities,
  };
}

function summarizeCartReceipt(receipt: Record<string, unknown>): unknown {
  const appliedDiff: InterfoodCartDiff | undefined = receipt.appliedDiff as InterfoodCartDiff | undefined;
  const finalDiff: InterfoodCartDiff | undefined = receipt.finalDiff as InterfoodCartDiff | undefined;
  const before: InterfoodCartSummary | null = receipt.before === undefined ? null : summarizeCart(receipt.before);
  const after: InterfoodCartSummary | null = receipt.authoritativeCart === undefined ? null : summarizeCart(receipt.authoritativeCart);
  return {
    schemaVersion: receipt.schemaVersion,
    receiptId: receipt.receiptId,
    createdAt: receipt.createdAt,
    status: receipt.status,
    before,
    desired: receipt.desired,
    appliedDiff,
    after,
    finalDiff,
  };
}

function summarizeOrderSafety(result: Record<string, unknown>): unknown {
  return {
    orderId: result.orderId,
    cancellableDecision: result.cancellableDecision,
    overlapDecision: result.overlapDecision,
    details: summarizeOrderDetails(result.details),
  };
}

function summarizeOrderChangeReceipt(receipt: Record<string, unknown>): unknown {
  const safety: Record<string, unknown> = asObject(receipt.safety);
  return {
    schemaVersion: receipt.schemaVersion,
    status: receipt.status,
    createdAt: receipt.createdAt,
    appliedAt: receipt.appliedAt,
    previewHash: receipt.previewHash,
    orderId: receipt.orderId,
    cartId: receipt.cartId,
    desiredCart: receipt.desiredCart,
    changeDiff: receipt.changeDiff,
    financialEffect: receipt.financialEffect,
    safety: {
      cancellableDecision: safety.cancellableDecision,
      overlapDecision: safety.overlapDecision,
    },
    finalDiff: receipt.finalDiff,
  };
}

function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
