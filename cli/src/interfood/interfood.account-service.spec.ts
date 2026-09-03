import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildCartDiff,
  InterfoodAccountService,
  interpretCancellable,
  interpretOverlap,
  normalizeOrderLines,
} from './interfood.account-service.js';
import { InterfoodAuthenticatedClient } from './interfood.auth-client.js';
import { InterfoodPaths } from './interfood.paths.js';

describe('Interfood account and cart state', () => {
  let directory: string;
  let paths: InterfoodPaths;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ma-interfood-account-'));
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

  it('preserves small/full occurrences and quantity two instead of deduplicating by food id', () => {
    const lines = normalizeOrderLines([{ id: 700, cart: { cart_items: [
      row(1, 35853, 'A', 109, 1),
      row(2, 35859, 'AK', 109, 2, 35853),
    ] } }]);
    expect(lines.length).toBe(2);
    expect(lines.map((line) => line.portionClass)).toEqual(['full', 'small']);
    expect(lines.map((line) => line.quantity)).toEqual([1, 2]);
    expect(lines.every((line) => line.foodId === 109)).toBeTrue();
  });

  it('uses order_items as the canonical weekly slice and enriches them from a shared multi-week cart', () => {
    const currentWeekCartRow = { ...row(100, 35853, 'A', 109, 1), menu_item: { ...(row(100, 35853, 'A', 109, 1).menu_item as object), date: '2026-09-07' } };
    const otherWeekCartRow = { ...row(200, 40000, 'AK', 200, 1), menu_item: { ...(row(200, 40000, 'AK', 200, 1).menu_item as object), date: '2026-08-24' } };
    const lines = normalizeOrderLines([{
      id: 700,
      year: 2026,
      week: 37,
      cart: { cart_items: [currentWeekCartRow, otherWeekCartRow] },
      order_items: [{
        id: 900,
        order_id: 700,
        cart_item_id: 100,
        menu_item_id: 35853,
        quantity: 2,
        price: 1650,
        menu_item: { id: 35853, date: '2026-09-07', food_name_one: 'Gombapaprikás' },
      }],
    }]);
    expect(lines.length).toBe(1);
    expect(lines[0]).toEqual(jasmine.objectContaining({
      orderId: '700',
      orderLineId: '900',
      menuItemId: 35853,
      foodId: 109,
      categoryCode: 'A',
      quantity: 2,
    }));
  });

  it('unwraps the orders-for-week envelope and does not count its Day cart projection twice', () => {
    const cartRow = row(100, 35853, 'A', 109, 2);
    const lines = normalizeOrderLines([{
      order: {
        id: 700,
        year: 2026,
        week: 37,
        order_items: [{
          id: 900,
          order_id: 700,
          cart_item_id: 100,
          menu_item_id: 35853,
          quantity: 2,
          price: 1650,
          menu_item: { id: 35853, date: '2026-09-07', food_name_one: 'Gombapaprikás' },
        }],
      },
      cart_items: { Day: [cartRow] },
    }]);
    expect(lines.length).toBe(1);
    expect(lines[0]).toEqual(jasmine.objectContaining({ orderId: '700', orderLineId: '900', foodId: 109, quantity: 2 }));
  });

  it('converges a cart quantity by bounded mutations and authoritative readback', async () => {
    let quantity: number = 1;
    const client = fakeClient((operation: string): unknown => {
      if (operation === 'cart.add') quantity += 1;
      if (operation === 'cart.subtract') quantity -= 1;
      return operation === 'cart.get' ? { data: { cart_items: [row(1, 35853, 'A', 109, quantity)] } } : { data: {} };
    });
    const service = new InterfoodAccountService(client, paths);
    const result = await service.setCartQuantity(35853, 3);
    expect(result).toEqual(jasmine.objectContaining({ beforeQuantity: 1, afterQuantity: 3, effects: 2 }));
  });

  it('follows every order-history page to the terminal last_page', async () => {
    const client = fakeClient((_operation: string, input: Record<string, unknown>): unknown => {
      const page: number = Number(input.page);
      return { data: { data: page === 1 ? [{ id: 1, cart: { cart_items: [row(1, 11, 'A', 1, 1)] } }] : [], current_page: page, last_page: 2 } };
    });
    const snapshot = await new InterfoodAccountService(client, paths).syncOrders(2026, 2026);
    expect(snapshot.pagesRead).toBe(2);
    expect(snapshot.lines.length).toBe(1);
    expect(snapshot.complete).toBeTrue();
  });

  it('diffs a complete desired cart without collapsing menu occurrences', () => {
    const diff = buildCartDiff({ cart_items: [
      row(1, 35853, 'A', 109, 1),
      row(2, 35859, 'AK', 109, 2, 35853),
      row(3, 40000, 'A', 200, 1),
    ] }, [
      { menuItemId: 35853, quantity: 2 },
      { menuItemId: 35859, quantity: 2 },
    ]);
    expect(diff.matches).toBeFalse();
    expect(diff.effectCount).toBe(2);
    expect(diff.changes).toEqual([
      jasmine.objectContaining({ menuItemId: 35853, delta: 1, operation: 'add' }),
      jasmine.objectContaining({ menuItemId: 35859, delta: 0, operation: 'unchanged' }),
      jasmine.objectContaining({ menuItemId: 40000, delta: -1, operation: 'remove' }),
    ]);
  });

  it('reconciles the complete desired cart and persists authoritative readback', async () => {
    const quantities: Map<number, number> = new Map([[35853, 1], [40000, 1]]);
    const client = fakeClient((operation: string, input: Record<string, unknown>): unknown => {
      const menuItemId: number = Number(input.menuItemId);
      if (operation === 'cart.add') quantities.set(menuItemId, (quantities.get(menuItemId) ?? 0) + 1);
      if (operation === 'cart.subtract') quantities.set(menuItemId, Math.max(0, (quantities.get(menuItemId) ?? 0) - 1));
      if (operation === 'cart.remove') quantities.delete(menuItemId);
      return operation === 'cart.get'
        ? { data: { cart_items: [...quantities].map(([id, quantity], index) => row(index + 1, id, 'A', id, quantity)) } }
        : { data: {} };
    });
    const desiredPath: string = join(directory, 'desired.json');
    await writeFile(desiredPath, JSON.stringify([{ menuItemId: 35853, quantity: 3 }]), 'utf8');
    const result = await new InterfoodAccountService(client, paths).reconcileCart(desiredPath);
    expect(result.status).toBe('applied-and-read-back');
    expect((result.finalDiff as { matches: boolean }).matches).toBeTrue();
    expect(quantities).toEqual(new Map([[35853, 3]]));
  });

  it('fails closed while interpreting submitted-order safety responses', () => {
    expect(interpretCancellable({ data: [{ order_id: 700 }] }, 700)).toBeTrue();
    expect(interpretCancellable({ data: [{ order_id: 701 }] }, 700)).toBeFalse();
    expect(interpretCancellable({ unexpected: 'shape' }, 700)).toBeNull();
    expect(interpretOverlap({ data: { has_overlap: false } })).toBeFalse();
    expect(interpretOverlap({ error: false, data: null })).toBeFalse();
    expect(interpretOverlap({ error: false, data: [{ order_id: 701 }] })).toBeTrue();
    expect(interpretOverlap([{ order_id: 701 }])).toBeTrue();
    expect(interpretOverlap({ unexpected: 'shape' })).toBeNull();
  });

  it('serializes order safety reads through the single dedicated-profile lease', async () => {
    let active: number = 0;
    let maximumActive: number = 0;
    const operations: string[] = [];
    const client = new InterfoodAuthenticatedClient({
      execute: async (_binary: string, args: string[]): Promise<string> => {
        const request = JSON.parse(args[2]!) as { input: Record<string, unknown> };
        const operation: string = String(request.input.operation);
        operations.push(operation);
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await new Promise<void>((resolve) => setTimeout(resolve, 5));
        active -= 1;
        const data: unknown = operation === 'order.details'
          ? { id: 700 }
          : operation === 'order.cancellable'
            ? [{ order_id: 700 }]
            : { has_overlap: false };
        return JSON.stringify({ ok: true, result: { operation, status: 200, data } });
      },
    });
    const result = await new InterfoodAccountService(client, paths).orderSafetyCheck(700);
    expect(operations).toEqual(['order.details', 'order.cancellable', 'order.overlap']);
    expect(maximumActive).toBe(1);
    expect(result).toEqual(jasmine.objectContaining({ cancellableDecision: true, overlapDecision: false }));
  });

  it('binds submitted-order preview, safety, financial effect and final readback to one hash', async () => {
    let applied: boolean = false;
    const client = fakeClient((operation: string): unknown => {
      if (operation === 'order.details') return { data: { id: 700, cart_id: 900, cart_items: [row(1, 35853, 'A', 109, applied ? 1 : 2)] } };
      if (operation === 'order.cancellable') return { data: [{ order_id: 700 }] };
      if (operation === 'order.overlap') return { data: { has_overlap: false } };
      if (operation === 'order.change-preview') return { data: { price_difference: 125, refund_amount: 0, needs_approval: true } };
      if (operation === 'order.change-apply') {
        applied = true;
        return { data: { changed: true } };
      }
      return { data: {} };
    });
    spyOn(client, 'issueApproval').and.resolveTo('one-time-token');
    const desiredPath: string = join(directory, 'submitted-desired.json');
    await writeFile(desiredPath, JSON.stringify([{ menu_item_id: 35853, quantity: 1 }]), 'utf8');
    const service = new InterfoodAccountService(client, paths);
    const preview = await service.createOrderChangePreview(700, desiredPath);
    expect(preview.previewHash).toMatch(/^[a-f0-9]{64}$/);
    expect(preview.cartItems).toEqual([{ id: 1, amount: 1 }]);
    expect(preview.financialEffect).toEqual(jasmine.objectContaining({ priceDeltaHuf: 125, pendingCustomerServiceApproval: true }));
    expect((preview.changeDiff as { matches: boolean }).matches).toBeFalse();
    const completed = await service.applyOrderChange(String(preview.previewHash), 'owner');
    expect(completed.status).toBe('applied-and-read-back');
    expect((completed.finalDiff as { matches: boolean }).matches).toBeTrue();
  });

  it('rejects apply before approval when the submitted order changed after preview', async () => {
    let changedExternally: boolean = false;
    let applyCalls: number = 0;
    const client = fakeClient((operation: string): unknown => {
      if (operation === 'order.details') return {
        data: { id: 700, cart_id: 900, cart_items: [row(1, 35853, 'A', 109, changedExternally ? 3 : 2)] },
      };
      if (operation === 'order.cancellable') return { data: [{ order_id: 700 }] };
      if (operation === 'order.overlap') return { data: { has_overlap: false } };
      if (operation === 'order.change-preview') return { data: { refund_value: 825, parts: [] } };
      if (operation === 'order.change-apply') {
        applyCalls += 1;
        return { data: { changed: true } };
      }
      return { data: {} };
    });
    const approval = spyOn(client, 'issueApproval').and.resolveTo('one-time-token');
    const desiredPath: string = join(directory, 'stale-submitted-desired.json');
    await writeFile(desiredPath, JSON.stringify([{ menu_item_id: 35853, quantity: 1 }]), 'utf8');
    const service = new InterfoodAccountService(client, paths);
    const preview = await service.createOrderChangePreview(700, desiredPath);
    changedExternally = true;

    await expectAsync(service.applyOrderChange(String(preview.previewHash), 'owner'))
      .toBeRejectedWithError(/changed after preview/);
    expect(approval).not.toHaveBeenCalled();
    expect(applyCalls).toBe(0);
  });

  it('rejects apply before approval when the refreshed financial effect differs', async () => {
    let previewCalls: number = 0;
    let applyCalls: number = 0;
    const client = fakeClient((operation: string): unknown => {
      if (operation === 'order.details') return { data: { id: 700, cart_id: 900, cart_items: [row(1, 35853, 'A', 109, 2)] } };
      if (operation === 'order.cancellable') return { data: [{ order_id: 700 }] };
      if (operation === 'order.overlap') return { data: { has_overlap: false } };
      if (operation === 'order.change-preview') {
        previewCalls += 1;
        return { data: { refund_value: previewCalls === 1 ? 825 : 700, parts: [] } };
      }
      if (operation === 'order.change-apply') {
        applyCalls += 1;
        return { data: { changed: true } };
      }
      return { data: {} };
    });
    const approval = spyOn(client, 'issueApproval').and.resolveTo('one-time-token');
    const desiredPath: string = join(directory, 'financially-stale-desired.json');
    await writeFile(desiredPath, JSON.stringify([{ menu_item_id: 35853, quantity: 1 }]), 'utf8');
    const service = new InterfoodAccountService(client, paths);
    const preview = await service.createOrderChangePreview(700, desiredPath);

    await expectAsync(service.applyOrderChange(String(preview.previewHash), 'owner'))
      .toBeRejectedWithError(/financial effect changed/);
    expect(approval).not.toHaveBeenCalled();
    expect(applyCalls).toBe(0);
  });

  it('does not preview a submitted-order change when overlap cannot be verified', async () => {
    const client = fakeClient((operation: string): unknown => {
      if (operation === 'order.details') return { data: { id: 700, cart_id: 900, cart_items: [] } };
      if (operation === 'order.cancellable') return { data: [{ order_id: 700 }] };
      if (operation === 'order.overlap') return { data: { unexpected: 'shape' } };
      return { data: {} };
    });
    const desiredPath: string = join(directory, 'unsafe-desired.json');
    await writeFile(desiredPath, JSON.stringify([{ menu_item_id: 35853, quantity: 1 }]), 'utf8');
    await expectAsync(new InterfoodAccountService(client, paths).createOrderChangePreview(700, desiredPath))
      .toBeRejectedWithError(/overlap response could not be verified/);
  });

  it('builds a reduced read-only preview from the authoritative grouped cart projection', async () => {
    const projected = {
      ...row(100, 35853, 'A', 109, 2),
      order_item: { order_id: 700 },
    };
    const unchangedProjected = {
      ...row(101, 35854, 'B', 110, 1),
      order_item: { order_id: 700 },
    };
    const client = fakeClient((operation: string): unknown => {
      if (operation === 'order.details') return {
        error: false,
        data: {
          order: {
            id: 700,
            cart_id: 900,
            order_items: [{
              id: 901,
              order_id: 700,
              cart_item_id: 100,
              menu_item_id: 35853,
              quantity: 2,
              price: 1650,
              menu_item: { id: 35853, date: '2026-09-07', food_name_one: 'Gombapaprikás' },
            }, {
              id: 902,
              order_id: 700,
              cart_item_id: 101,
              menu_item_id: 35854,
              quantity: 1,
              price: 1790,
              menu_item: { id: 35854, date: '2026-09-08', food_name_one: 'Rakott karfiol' },
            }],
          },
          cart_items: { Day: [projected, unchangedProjected] },
        },
      };
      if (operation === 'order.cancellable') return { error: false, data: [{ order_id: 700 }] };
      if (operation === 'order.overlap') return { error: false, data: null };
      if (operation === 'order.change-preview') return {
        error: false,
        data: { refund_value: 825, parts: [{ type: 'virtual_account', amount: 500 }, { type: 'refund_pending', amount: 325 }] },
      };
      return {};
    });
    const preview = await new InterfoodAccountService(client, paths).createReducedOrderPreview(700, 35853, 1);
    expect(preview.desiredCart).toEqual([{ menuItemId: 35853, quantity: 1 }, { menuItemId: 35854, quantity: 1 }]);
    // The first-party frontend sends only rows whose quantity changed. Sending unchanged rows makes
    // the real preview endpoint reject an otherwise valid partial reduction with HTTP 422.
    expect(preview.cartItems).toEqual([{ id: 100, amount: 1 }]);
    expect((preview.changeDiff as { matches: boolean }).matches).toBeFalse();
    expect(preview.financialEffect).toEqual(jasmine.objectContaining({
      priceDeltaHuf: -825,
      refundAmountHuf: 825,
      instantRefundHuf: 500,
      pendingRefundHuf: 325,
      pendingCustomerServiceApproval: true,
    }));
  });
});

function fakeClient(handler: (operation: string, input: Record<string, unknown>) => unknown): InterfoodAuthenticatedClient {
  return new InterfoodAuthenticatedClient({
    execute: async (_binary: string, args: string[]): Promise<string> => {
      const request = JSON.parse(args[2]!) as { input: Record<string, unknown> };
      const operation: string = String(request.input.operation);
      return JSON.stringify({ ok: true, result: { operation, status: 200, data: handler(operation, request.input) } });
    },
  });
}

function row(id: number, menuItemId: number, code: string, foodId: number, quantity: number, fullId?: number): Record<string, unknown> {
  return {
    id,
    quantity,
    menu_item: {
      id: menuItemId,
      date: '2026-09-07',
      price: 1650,
      food: { id: foodId, name: 'Gombapaprikás' },
      menu_category: { code, name: code, ...(fullId === undefined ? {} : { full_portion_menu_category_id: fullId }) },
    },
  };
}
