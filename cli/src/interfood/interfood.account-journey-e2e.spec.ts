import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { InterfoodAccountService } from './interfood.account-service.js';
import { InterfoodAuthenticatedClient } from './interfood.auth-client.js';
import { computeInterfoodCoverage } from './interfood.coverage.js';
import { buildInterfoodHistoryPatterns } from './interfood.history-patterns.js';
import { InterfoodPaths } from './interfood.paths.js';

type JsonObject = Record<string, unknown>;

describe('Interfood authenticated state-carrying user journeys', () => {
  let directory: string;
  let paths: InterfoodPaths;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ma-interfood-account-journey-'));
    paths = {
      runtimeRoot: directory,
      accountSnapshot: join(directory, 'account.json'),
      foodRegistry: join(directory, 'foods.json'),
      latestPlan: join(directory, 'plan.json'),
      receipts: join(directory, 'receipts'),
      preferences: join(directory, 'preferences.json'),
    };
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('IF-J03 pages history, persists it, resumes from disk and derives quantity-aware coverage', async () => {
    const client: InterfoodAuthenticatedClient = fakeClient((_operation: string, input: JsonObject): unknown => {
      const page: number = Number(input.page);
      const orders: JsonObject[] = page === 1
        ? [submittedOrder(700, 10, 35853, 'A', 109, 1, '2026-09-07')]
        : [submittedOrder(701, 11, 35859, 'AK', 109, 1, '2026-09-07', 35853)];
      return { data: orders, current_page: page, last_page: 2 };
    });

    const synchronized = await new InterfoodAccountService(client, paths).syncOrders(2026, 2026);
    expect(synchronized.pagesRead).toBe(2);
    expect(synchronized.complete).toBeTrue();

    const resumed = await new InterfoodAccountService(client, paths).loadOrders();
    const coverage = computeInterfoodCoverage(resumed.lines, [
      { date: '2026-09-07', expectedUnitCount: 2 },
      { date: '2026-09-08', expectedUnitCount: 1 },
    ]);
    const patterns = buildInterfoodHistoryPatterns(resumed);
    expect(resumed.lines.map((line) => line.portionClass)).toEqual(['full', 'small']);
    expect(coverage).toEqual([
      jasmine.objectContaining({ date: '2026-09-07', status: 'covered', orderedUnitCount: 2 }),
      jasmine.objectContaining({ date: '2026-09-08', status: 'not-covered', orderedUnitCount: 0 }),
    ]);
    expect(patterns.foods).toEqual([
      jasmine.objectContaining({
        foodId: 109,
        totalUnits: 2,
        orderDayCount: 1,
        doubleOrderDayCount: 1,
        portionUnitCounts: { full: 1, small: 1, mixed: 0, unspecified: 0 },
        suggestion: 'confirm-prefer',
      }),
    ]);
  });

  it('IF-J05 carries a complete desired cart through reconcile, readback, diff and cleanup', async () => {
    const quantities: Map<number, number> = new Map();
    const client: InterfoodAuthenticatedClient = mutableCartClient(quantities);
    const service = new InterfoodAccountService(client, paths);
    const desiredPath: string = join(directory, 'desired-cart.json');
    const emptyPath: string = join(directory, 'empty-cart.json');
    await writeFile(desiredPath, JSON.stringify([
      { menuItemId: 35853, quantity: 2 },
      { menuItemId: 35859, quantity: 1 },
    ]), 'utf8');
    await writeFile(emptyPath, '[]', 'utf8');

    const applied = await service.reconcileCart(desiredPath);
    expect(applied.status).toBe('applied-and-read-back');
    expect((applied.finalDiff as { matches: boolean }).matches).toBeTrue();
    expect(quantities).toEqual(new Map([[35853, 2], [35859, 1]]));

    const verified = await service.diffCart(desiredPath);
    expect(verified.diff.matches).toBeTrue();

    const cleaned = await service.reconcileCart(emptyPath);
    expect(cleaned.status).toBe('applied-and-read-back');
    expect((cleaned.finalDiff as { matches: boolean }).matches).toBeTrue();
    expect(quantities.size).toBe(0);
  });

  it('IF-J06 resumes a persisted preview, obtains exact approval, applies once and verifies final state', async () => {
    let quantity: number = 2;
    let applyCalls: number = 0;
    const client: InterfoodAuthenticatedClient = submittedOrderClient(
      (): number => quantity,
      (desiredQuantity: number): void => {
        applyCalls += 1;
        quantity = desiredQuantity;
      },
    );
    const approval = spyOn(client, 'issueApproval').and.resolveTo('one-time-approval');

    const preview = await new InterfoodAccountService(client, paths).createReducedOrderPreview(700, 35853, 1);
    const previewHash: string = String(preview.previewHash);
    expect(previewHash).toMatch(/^[a-f0-9]{64}$/);
    expect((preview.changeDiff as { matches: boolean }).matches).toBeFalse();

    // A fresh service instance proves interruption/resume from the persisted immutable receipt.
    const completed = await new InterfoodAccountService(client, paths).applyOrderChange(previewHash, 'owner');
    expect(approval).toHaveBeenCalledOnceWith(jasmine.any(String), 700, previewHash, 'owner');
    expect(applyCalls).toBe(1);
    expect(quantity).toBe(1);
    expect(completed.status).toBe('applied-and-read-back');
    expect((completed.finalDiff as { matches: boolean }).matches).toBeTrue();
  });

  it('IF-J06 decline variant leaves the submitted order unchanged and performs no apply', async () => {
    let quantity: number = 2;
    let applyCalls: number = 0;
    const client: InterfoodAuthenticatedClient = submittedOrderClient(
      (): number => quantity,
      (desiredQuantity: number): void => {
        applyCalls += 1;
        quantity = desiredQuantity;
      },
    );
    spyOn(client, 'issueApproval').and.rejectWith(new Error('Owner declined the exact preview.'));
    const preview = await new InterfoodAccountService(client, paths).createReducedOrderPreview(700, 35853, 1);

    await expectAsync(new InterfoodAccountService(client, paths).applyOrderChange(String(preview.previewHash), 'owner'))
      .toBeRejectedWithError(/Owner declined/);
    expect(applyCalls).toBe(0);
    expect(quantity).toBe(2);
    const unchanged = await new InterfoodAccountService(client, paths).orderDetails(700);
    expect(currentQuantity(unchanged)).toBe(2);
  });
});

function mutableCartClient(quantities: Map<number, number>): InterfoodAuthenticatedClient {
  return fakeClient((operation: string, input: JsonObject): unknown => {
    const menuItemId: number = Number(input.menuItemId);
    if (operation === 'cart.add') quantities.set(menuItemId, (quantities.get(menuItemId) ?? 0) + 1);
    if (operation === 'cart.subtract') quantities.set(menuItemId, Math.max(0, (quantities.get(menuItemId) ?? 0) - 1));
    if (operation === 'cart.remove') quantities.delete(menuItemId);
    return operation === 'cart.get'
      ? { data: { cart_items: [...quantities].map(([id, quantity], index) => cartRow(index + 1, id, 'A', id, quantity, '2026-09-07')) } }
      : { data: {} };
  });
}

function submittedOrderClient(
  readQuantity: () => number,
  applyQuantity: (quantity: number) => void,
): InterfoodAuthenticatedClient {
  return fakeClient((operation: string, input: JsonObject): unknown => {
    if (operation === 'order.details') {
      const order: JsonObject = submittedOrder(700, 10, 35853, 'A', 109, readQuantity(), '2026-09-07');
      const cart: JsonObject = order.cart as JsonObject;
      return { data: { order, cart_items: { Day: cart.cart_items } } };
    }
    if (operation === 'order.cancellable') return { data: [{ order_id: 700 }] };
    if (operation === 'order.overlap') return { error: false, data: null };
    if (operation === 'order.change-preview') {
      return { data: { refund_value: 1650, parts: [{ type: 'virtual_account', amount: 1650 }] } };
    }
    if (operation === 'order.change-apply') {
      const changed: JsonObject[] = input.cartItems as JsonObject[];
      applyQuantity(Number(changed[0]?.amount));
      return { data: { changed: true } };
    }
    return { data: {} };
  });
}

function fakeClient(handler: (operation: string, input: JsonObject) => unknown): InterfoodAuthenticatedClient {
  return new InterfoodAuthenticatedClient({
    execute: async (_binary: string, args: string[]): Promise<string> => {
      const request = JSON.parse(args[2]!) as { input: JsonObject };
      const operation: string = String(request.input.operation);
      return JSON.stringify({ ok: true, result: { operation, status: 200, data: handler(operation, request.input) } });
    },
  });
}

function submittedOrder(
  orderId: number,
  cartItemId: number,
  menuItemId: number,
  categoryCode: string,
  foodId: number,
  quantity: number,
  date: string,
  relatedFullId?: number,
): JsonObject {
  return {
    id: orderId,
    cart_id: 900,
    order_items: [{
      id: orderId * 10,
      order_id: orderId,
      cart_item_id: cartItemId,
      menu_item_id: menuItemId,
      quantity,
      price: 1650,
      menu_item: { id: menuItemId, date, food_name_one: 'Gombapaprikás' },
    }],
    cart: { cart_items: [cartRow(cartItemId, menuItemId, categoryCode, foodId, quantity, date, relatedFullId)] },
  };
}

function cartRow(
  id: number,
  menuItemId: number,
  categoryCode: string,
  foodId: number,
  quantity: number,
  date: string,
  relatedFullId?: number,
): JsonObject {
  return {
    id,
    quantity,
    menu_item: {
      id: menuItemId,
      date,
      price: 1650,
      food: { id: foodId, name: 'Gombapaprikás' },
      menu_category: {
        code: categoryCode,
        name: categoryCode,
        ...(relatedFullId === undefined ? {} : { full_portion_menu_category_id: relatedFullId }),
      },
    },
  };
}

function currentQuantity(value: unknown): number {
  const queue: unknown[] = [value];
  while (queue.length > 0) {
    const candidate: unknown = queue.shift();
    if (Array.isArray(candidate)) {
      const row: JsonObject | undefined = candidate.find((entry: unknown): boolean => {
        const object: JsonObject | undefined = record(entry);
        return object !== undefined && Number(object.quantity) > 0;
      }) as JsonObject | undefined;
      if (row !== undefined) return Number(row.quantity);
      queue.push(...candidate);
      continue;
    }
    const object: JsonObject | undefined = record(candidate);
    if (object !== undefined) queue.push(...Object.values(object));
  }
  return 0;
}

function record(value: unknown): JsonObject | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : undefined;
}
