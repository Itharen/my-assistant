import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  InterfoodAccountResponse,
  InterfoodAuthenticatedClient,
  hashInterfoodPreview,
} from './interfood.auth-client.js';
import { InterfoodToolError } from './interfood.error.js';
import { InterfoodAccountSnapshot, InterfoodOrderLine, InterfoodPortionClass } from './interfood.models.js';
import { InterfoodPaths, readJsonIfExists, writeJsonAtomically } from './interfood.paths.js';

type JsonObject = Record<string, unknown>;

export interface InterfoodDesiredCartLine {
  menuItemId: number;
  quantity: number;
}

export interface InterfoodCartDiffLine extends InterfoodDesiredCartLine {
  currentQuantity: number;
  delta: number;
  operation: 'add' | 'subtract' | 'remove' | 'unchanged';
}

export interface InterfoodCartDiff {
  current: InterfoodDesiredCartLine[];
  desired: InterfoodDesiredCartLine[];
  changes: InterfoodCartDiffLine[];
  effectCount: number;
  matches: boolean;
}

export interface InterfoodWeekOrdersSnapshot {
  raw: unknown;
  rawOrderCount: number;
  lines: InterfoodOrderLine[];
}

export interface InterfoodCartSummary {
  cartId: number | null;
  itemCount: number;
  unitCount: number;
  items: InterfoodDesiredCartLine[];
}

export class InterfoodAccountService {
  public constructor(
    private readonly client: InterfoodAuthenticatedClient,
    private readonly paths: InterfoodPaths,
  ) {}

  public async syncOrders(fromYear: number = 2022, throughYear: number = new Date().getFullYear() + 1): Promise<InterfoodAccountSnapshot> {
    const rawOrders: JsonObject[] = [];
    const warnings: string[] = [];
    let pagesRead: number = 0;
    let complete: boolean = true;
    for (let year: number = fromYear; year <= throughYear; year += 1) {
      const seenPages: Set<string> = new Set();
      for (let page: number = 1; page <= 500; page += 1) {
        const response: InterfoodAccountResponse = await this.client.request('orders.list', { year, page });
        pagesRead += 1;
        const payload: JsonObject[] = extractOrderPage(response.data);
        const pageFingerprint: string = sha(payload);
        if (seenPages.has(pageFingerprint) && payload.length > 0) {
          complete = false;
          warnings.push(`Duplicate pagination cycle detected for ${year}, page ${page}.`);
          break;
        }
        seenPages.add(pageFingerprint);
        rawOrders.push(...payload);
        const pagination: { current: number; last: number } | undefined = paginationBounds(response.data);
        if (payload.length === 0 || (pagination !== undefined && pagination.current >= pagination.last)) break;
        if (pagination === undefined && payload.length < 10) break;
        if (page === 500) {
          complete = false;
          warnings.push(`Page budget reached for ${year}.`);
        }
      }
    }
    const lines: InterfoodOrderLine[] = normalizeOrderLines(rawOrders);
    const snapshot: InterfoodAccountSnapshot = {
      schemaVersion: '1.0.0',
      syncedAt: new Date().toISOString(),
      complete,
      years: Array.from({ length: throughYear - fromYear + 1 }, (_, index) => fromYear + index),
      pagesRead,
      rawOrders,
      lines,
      warnings,
    };
    await writeJsonAtomically(this.paths.accountSnapshot, snapshot);
    return snapshot;
  }

  public async loadOrders(): Promise<InterfoodAccountSnapshot> {
    const value: unknown | undefined = await readJsonIfExists(this.paths.accountSnapshot);
    if (value === undefined) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDERS-NOT-SYNCED', 'Order history is not synchronized yet.');
    }
    return value as InterfoodAccountSnapshot;
  }

  public async cart(): Promise<unknown> {
    return (await this.client.request('cart.get')).data;
  }

  public async mutateCart(
    operation: 'cart.add' | 'cart.subtract' | 'cart.remove' | 'cart.clear',
    menuItemId?: number,
  ): Promise<{ response: unknown; authoritativeCart: unknown }> {
    const input: Record<string, unknown> = menuItemId === undefined ? {} : { menuItemId };
    const response: unknown = (await this.client.request(operation, input, 'reversible-mutation')).data;
    const authoritativeCart: unknown = await this.cart();
    return { response, authoritativeCart };
  }

  public async setCartQuantity(menuItemId: number, desiredQuantity: number): Promise<{
    beforeQuantity: number;
    desiredQuantity: number;
    afterQuantity: number;
    effects: number;
    authoritativeCart: unknown;
  }> {
    if (!Number.isInteger(desiredQuantity) || desiredQuantity < 0 || desiredQuantity > 50) {
      throw new InterfoodToolError('MA-INTERFOOD-CART-QUANTITY', 'Desired quantity must be an integer from 0 to 50.');
    }
    const before: unknown = await this.cart();
    const beforeQuantity: number = cartQuantity(before, menuItemId);
    const delta: number = desiredQuantity - beforeQuantity;
    for (let index: number = 0; index < Math.abs(delta); index += 1) {
      await this.client.request(delta > 0 ? 'cart.add' : 'cart.subtract', { menuItemId }, 'reversible-mutation');
    }
    const authoritativeCart: unknown = await this.cart();
    const afterQuantity: number = cartQuantity(authoritativeCart, menuItemId);
    if (afterQuantity !== desiredQuantity) {
      throw new InterfoodToolError('MA-INTERFOOD-CART-VERIFY', 'Cart quantity readback does not match desired state.', {
        menuItemId,
        beforeQuantity,
        desiredQuantity,
        afterQuantity,
      });
    }
    return { beforeQuantity, desiredQuantity, afterQuantity, effects: Math.abs(delta), authoritativeCart };
  }

  public async diffCart(cartItemsFile: string): Promise<{ authoritativeCart: unknown; diff: InterfoodCartDiff }> {
    const desired: InterfoodDesiredCartLine[] = await readDesiredCart(cartItemsFile);
    const authoritativeCart: unknown = await this.cart();
    return { authoritativeCart, diff: buildCartDiff(authoritativeCart, desired) };
  }

  public async reconcileCart(cartItemsFile: string): Promise<JsonObject> {
    const desired: InterfoodDesiredCartLine[] = await readDesiredCart(cartItemsFile);
    const before: unknown = await this.cart();
    const diff: InterfoodCartDiff = buildCartDiff(before, desired);
    if (diff.effectCount > 200) {
      throw new InterfoodToolError('MA-INTERFOOD-CART-EFFECT-BUDGET', 'Cart reconciliation exceeds the 200-effect safety budget.', {
        effectCount: diff.effectCount,
      });
    }
    for (const change of diff.changes) {
      if (change.operation === 'unchanged') continue;
      if (change.operation === 'remove') {
        await this.client.request('cart.remove', { menuItemId: change.menuItemId }, 'reversible-mutation');
        continue;
      }
      const operation: 'cart.add' | 'cart.subtract' = change.delta > 0 ? 'cart.add' : 'cart.subtract';
      for (let index: number = 0; index < Math.abs(change.delta); index += 1) {
        await this.client.request(operation, { menuItemId: change.menuItemId }, 'reversible-mutation');
      }
    }
    const authoritativeCart: unknown = await this.cart();
    const finalDiff: InterfoodCartDiff = buildCartDiff(authoritativeCart, desired);
    if (!finalDiff.matches) {
      throw new InterfoodToolError('MA-INTERFOOD-CART-VERIFY', 'Cart reconciliation readback does not match the complete desired state.', {
        desired,
        finalDiff,
      });
    }
    const receipt: JsonObject = {
      schemaVersion: '1.0.0',
      receiptId: randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'applied-and-read-back',
      before,
      desired,
      appliedDiff: diff,
      authoritativeCart,
      finalDiff,
    };
    await writeJsonAtomically(join(this.paths.receipts, `cart-${String(receipt.receiptId)}.json`), receipt);
    return receipt;
  }

  public async orderDetails(orderId: number): Promise<unknown> {
    return (await this.client.request('order.details', { orderId })).data;
  }

  public async ordersForWeek(year: number, week: number): Promise<InterfoodWeekOrdersSnapshot> {
    const raw: unknown = (await this.client.request('orders.week', { year, week })).data;
    const rawOrders: JsonObject[] = extractOrderPage(raw);
    return { raw, rawOrderCount: rawOrders.length, lines: normalizeOrderLines(rawOrders) };
  }

  public async orderSafetyCheck(orderId: number): Promise<JsonObject> {
    // UBH deliberately grants one exclusive lease per dedicated browser profile. Keep these reads sequential:
    // parallel requests would race each other for the same profile even though all three are read-only.
    const details: unknown = await this.orderDetails(orderId);
    const cancellable: unknown = (await this.client.request('order.cancellable', { orderId })).data;
    const overlap: unknown = (await this.client.request('order.overlap', { orderId })).data;
    return {
      orderId,
      details,
      cancellable,
      overlap,
      cancellableDecision: interpretCancellable(cancellable, orderId),
      overlapDecision: interpretOverlap(overlap),
    };
  }

  public async createOrderChangePreview(orderId: number, cartItemsFile: string): Promise<JsonObject> {
    const raw: string = await readFile(cartItemsFile, 'utf8');
    const cartItems: unknown = JSON.parse(raw) as unknown;
    if (!Array.isArray(cartItems)) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-CHANGE', 'The cart items file must contain a JSON array.');
    }
    const desiredCart: InterfoodDesiredCartLine[] = normalizeDesiredOrderCart(cartItems);
    const safety: JsonObject = await this.orderSafetyCheck(orderId);
    return this.createOrderChangePreviewWithSafety(orderId, desiredCart, safety);
  }

  public async createReducedOrderPreview(orderId: number, menuItemId: number, desiredQuantity: number): Promise<JsonObject> {
    if (!Number.isInteger(desiredQuantity) || desiredQuantity < 0 || desiredQuantity > 50) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-CHANGE', 'Desired submitted-order quantity must be an integer from 0 to 50.');
    }
    const safety: JsonObject = await this.orderSafetyCheck(orderId);
    const current: InterfoodDesiredCartLine[] = normalizeDesiredOrderCart(currentOrderCartItems(safety.details, orderId));
    if (!current.some((line: InterfoodDesiredCartLine): boolean => line.menuItemId === menuItemId)) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-ADD-UNSUPPORTED', 'The requested menu item is not present in the submitted order.', {
        orderId,
        menuItemId,
      });
    }
    const desired: InterfoodDesiredCartLine[] = current
      .map((line: InterfoodDesiredCartLine): InterfoodDesiredCartLine => line.menuItemId === menuItemId
        ? { ...line, quantity: desiredQuantity }
        : line)
      .filter((line: InterfoodDesiredCartLine): boolean => line.quantity > 0);
    return this.createOrderChangePreviewWithSafety(orderId, desired, safety);
  }

  private async createOrderChangePreviewWithSafety(orderId: number, desiredCart: InterfoodDesiredCartLine[], safety: JsonObject): Promise<JsonObject> {
    if (safety.cancellableDecision !== true) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-NOT-CANCELLABLE', 'Submitted order is not verified as cancellable.', {
        orderId,
        cancellableDecision: safety.cancellableDecision,
        cancellable: safety.cancellable,
      });
    }
    if (safety.overlapDecision !== false) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-OVERLAP', 'Submitted order has an overlap or the overlap response could not be verified.', {
        orderId,
        overlapDecision: safety.overlapDecision,
        overlap: safety.overlap,
      });
    }
    const details: unknown = safety.details;
    const cartId: number = findNumericField(details, ['cart_id', 'cartId']);
    const cartItems: JsonObject[] = buildSubmittedOrderProviderPayload(details, orderId, desiredCart);
    const upstreamPreview: unknown = (await this.client.request('order.change-preview', {
      orderId,
      cartId,
      cartItems,
    })).data;
    const changeDiff: InterfoodCartDiff = buildOrderChangeDiff(details, desiredCart);
    const financialEffect: JsonObject = extractFinancialEffect(upstreamPreview);
    const immutablePreview: JsonObject = {
      schemaVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      orderId,
      cartId,
      cartItems,
      desiredCart,
      originalDetails: details,
      safety,
      changeDiff,
      financialEffect,
      upstreamPreview,
    };
    const previewHash: string = hashInterfoodPreview(immutablePreview);
    const receipt: JsonObject = { ...immutablePreview, previewHash, status: 'previewed' };
    await writeJsonAtomically(join(this.paths.receipts, `${previewHash}.json`), receipt);
    return receipt;
  }

  public async applyOrderChange(previewHash: string, confirmedBy: string): Promise<JsonObject> {
    if (!/^[a-f0-9]{64}$/i.test(previewHash)) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-CHANGE', 'previewHash must be a SHA-256 hash.');
    }
    const receiptPath: string = join(this.paths.receipts, `${previewHash}.json`);
    const value: unknown | undefined = await readJsonIfExists(receiptPath);
    if (value === undefined) throw new InterfoodToolError('MA-INTERFOOD-ORDER-CHANGE', 'Preview receipt not found.', { previewHash });
    const receipt: JsonObject = value as JsonObject;
    const immutablePreview: JsonObject = {
      schemaVersion: receipt.schemaVersion,
      createdAt: receipt.createdAt,
      orderId: receipt.orderId,
      cartId: receipt.cartId,
      cartItems: receipt.cartItems,
      desiredCart: receipt.desiredCart,
      originalDetails: receipt.originalDetails,
      safety: receipt.safety,
      changeDiff: receipt.changeDiff,
      financialEffect: receipt.financialEffect,
      upstreamPreview: receipt.upstreamPreview,
    };
    if (hashInterfoodPreview(immutablePreview) !== previewHash) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-CHANGE-STALE', 'Stored order preview no longer matches its hash.');
    }
    const orderId: number = Number(receipt.orderId);
    const latestSafety: JsonObject = await this.orderSafetyCheck(orderId);
    const storedChangeDiff: JsonObject | undefined = asRecord(receipt.changeDiff);
    const storedCurrentRows: unknown[] = Array.isArray(storedChangeDiff?.current) ? storedChangeDiff.current : [];
    if (storedCurrentRows.length === 0) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-CHANGE-STALE', 'Stored preview has no verifiable original order state.', { orderId, previewHash });
    }
    const originalCart: InterfoodDesiredCartLine[] = normalizeDesiredOrderCart(storedCurrentRows);
    const latestOriginalDiff: InterfoodCartDiff = buildOrderChangeDiff(latestSafety.details, originalCart);
    if (latestSafety.cancellableDecision !== true || latestSafety.overlapDecision !== false || !latestOriginalDiff.matches) {
      await writeJsonAtomically(receiptPath, {
        ...receipt,
        status: 'apply-rejected-stale-or-unsafe',
        applyRejectedAt: new Date().toISOString(),
        latestSafety: {
          cancellableDecision: latestSafety.cancellableDecision,
          overlapDecision: latestSafety.overlapDecision,
        },
        latestOriginalDiff,
      });
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-CHANGE-STALE', 'Submitted order or its safety state changed after preview; create and approve a fresh preview.', {
        orderId,
        previewHash,
        cancellableDecision: latestSafety.cancellableDecision,
        overlapDecision: latestSafety.overlapDecision,
        originalStateMatches: latestOriginalDiff.matches,
      });
    }
    const refreshedUpstreamPreview: unknown = (await this.client.request('order.change-preview', {
      orderId,
      cartId: Number(receipt.cartId),
      cartItems: receipt.cartItems,
    })).data;
    const refreshedFinancialEffect: JsonObject = extractFinancialEffect(refreshedUpstreamPreview);
    if (sha(refreshedFinancialEffect) !== sha(receipt.financialEffect)) {
      await writeJsonAtomically(receiptPath, {
        ...receipt,
        status: 'apply-rejected-financial-effect-changed',
        applyRejectedAt: new Date().toISOString(),
        refreshedFinancialEffect,
      });
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-CHANGE-STALE', 'Submitted-order financial effect changed after preview; create and approve a fresh preview.', {
        orderId,
        previewHash,
        previousFinancialEffect: receipt.financialEffect,
        refreshedFinancialEffect,
      });
    }
    const runId: string = randomUUID();
    const approvalToken: string = await this.client.issueApproval(runId, orderId, previewHash, confirmedBy);
    const applied: unknown = (await this.client.request('order.change-apply', {
      orderId,
      cartId: Number(receipt.cartId),
      cartItems: receipt.cartItems,
      previewHash,
    }, 'irreversible-financial', { approvalToken, runId })).data;
    const finalDetails: unknown = await this.orderDetails(orderId);
    const finalDiff: InterfoodCartDiff = buildOrderChangeDiff(finalDetails, receipt.desiredCart as InterfoodDesiredCartLine[]);
    const completed: JsonObject = {
      ...receipt,
      status: finalDiff.matches ? 'applied-and-read-back' : 'applied-readback-mismatch',
      appliedAt: new Date().toISOString(),
      applied,
      finalDetails,
      finalDiff,
    };
    await writeJsonAtomically(receiptPath, completed);
    if (!finalDiff.matches) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-VERIFY', 'Submitted-order change was applied but authoritative readback does not match the approved desired state.', {
        orderId,
        previewHash,
        receiptPath,
        finalDiff,
      });
    }
    return completed;
  }
}

export function normalizeOrderLines(orders: JsonObject[]): InterfoodOrderLine[] {
  const result: InterfoodOrderLine[] = [];
  const seen: Set<string> = new Set();
  for (const sourceOrder of orders) {
    const order: JsonObject = canonicalOrderContainer(sourceOrder);
    const orderId: string = String(order.id ?? order.order_id ?? order.orderId ?? 'unknown');
    for (const row of canonicalOrderRows(order)) {
      const menuItem: JsonObject = asRecord(row.menu_item ?? row.menuItem) ?? {};
      const food: JsonObject = asRecord(menuItem.food) ?? {};
      const category: JsonObject = asRecord(menuItem.menu_category ?? menuItem.menuCategory) ?? {};
      const menuItemId: number = Number(menuItem.id ?? row.menu_item_id ?? row.menuItemId);
      if (!Number.isInteger(menuItemId)) continue;
      const quantity: number = Number(row.quantity ?? row.amount ?? 1);
      const lineId: string | null = row.id === undefined ? null : String(row.id);
      const date: string = String(menuItem.date ?? row.delivery_date ?? row.date ?? '');
      const categoryCode: string = String(category.code ?? row.category_code ?? '');
      const key: string = lineId === null
        ? sha({ orderId, date, menuItemId, categoryCode, row })
        : `${orderId}:${lineId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const unitPriceHuf: number | null = finiteNumber(menuItem.price ?? row.unit_price);
      result.push({
        orderId,
        orderLineId: lineId,
        menuItemId,
        foodId: integerOrNull(food.id ?? row.food_id),
        foodName: String(food.display_name ?? food.name ?? menuItem.food_name_one ?? row.food_name ?? `menu-item-${menuItemId}`),
        deliveryDate: date,
        categoryCode,
        categoryName: String(category.name ?? row.category_name ?? ''),
        portionClass: portionClass(categoryCode, category),
        quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
        unitPriceHuf,
        linePriceHuf: unitPriceHuf === null ? null : unitPriceHuf * (Number.isInteger(quantity) ? quantity : 1),
        state: row.cancelled === true || row.deleted === true || Number(row.quantity) === 0 ? 'cancelled' : 'active',
        sourceFingerprint: key,
      });
    }
  }
  return result;
}

function canonicalOrderContainer(source: JsonObject): JsonObject {
  const nestedOrder: JsonObject | undefined = asRecord(source.order);
  if (nestedOrder === undefined) return source;
  const nestedCart: JsonObject = asRecord(nestedOrder.cart) ?? {};
  return {
    ...nestedOrder,
    cart: {
      ...nestedCart,
      cart_items: flattenCartCollection(source.cart_items),
    },
  };
}

function currentOrderCartItems(value: unknown, orderId: number): JsonObject[] {
  const queue: unknown[] = [value];
  while (queue.length > 0) {
    const candidate: unknown = queue.shift();
    if (Array.isArray(candidate)) {
      queue.push(...candidate);
      continue;
    }
    const object: JsonObject | undefined = asRecord(candidate);
    if (object === undefined) continue;
    if (object.cart_items !== undefined) {
      const rows: JsonObject[] = flattenCartCollection(object.cart_items);
      const matching: JsonObject[] = rows.filter((row: JsonObject): boolean => {
        const rowOrderId: number = Number(asRecord(row.order_item ?? row.orderItem)?.order_id);
        return !Number.isInteger(rowOrderId) || rowOrderId === orderId;
      });
      if (matching.length > 0) return matching;
    }
    for (const key of ['data', 'result']) if (object[key] !== undefined) queue.push(object[key]);
  }
  return [];
}

function buildSubmittedOrderProviderPayload(
  details: unknown,
  orderId: number,
  desired: InterfoodDesiredCartLine[],
): JsonObject[] {
  const projected: JsonObject[] = currentOrderCartItems(details, orderId);
  if (projected.length === 0) {
    throw new InterfoodToolError('MA-INTERFOOD-ORDER-SCHEMA', 'Cannot map submitted-order lines to provider cart item IDs.', { orderId });
  }
  const byMenuItemId: Map<number, { cartItemId: number; currentQuantity: number }> = new Map();
  for (const row of projected) {
    const menuItem: JsonObject = asRecord(row.menu_item ?? row.menuItem) ?? {};
    const menuItemId: number = Number(menuItem.id ?? row.menu_item_id ?? row.menuItemId);
    const cartItemId: number = Number(row.id ?? row.cart_item_id ?? row.cartItemId);
    const currentQuantity: number = Number(row.quantity ?? row.amount ?? 0);
    if (!Number.isInteger(menuItemId) || menuItemId < 1 || !Number.isInteger(cartItemId) || cartItemId < 1
      || !Number.isInteger(currentQuantity) || currentQuantity < 0) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-SCHEMA', 'Submitted-order cart projection contains an invalid identity or quantity.', { orderId });
    }
    if (byMenuItemId.has(menuItemId)) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-AMBIGUOUS', 'Multiple provider cart rows map to the same menuItemId.', { orderId, menuItemId });
    }
    byMenuItemId.set(menuItemId, { cartItemId, currentQuantity });
  }
  const desiredById: Map<number, number> = new Map(desired.map((line): [number, number] => [line.menuItemId, line.quantity]));
  for (const line of desired) {
    const current = byMenuItemId.get(line.menuItemId);
    if (current === undefined) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-ADD-UNSUPPORTED', 'Interfood submitted-order changes cannot add a new menu item.', {
        orderId,
        menuItemId: line.menuItemId,
      });
    }
    if (line.quantity > current.currentQuantity) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-INCREASE-UNSUPPORTED', 'Interfood submitted-order changes cannot increase an existing quantity.', {
        orderId,
        menuItemId: line.menuItemId,
        currentQuantity: current.currentQuantity,
        desiredQuantity: line.quantity,
      });
    }
  }
  const providerChanges: JsonObject[] = [...byMenuItemId.entries()]
    .sort(([left], [right]) => left - right)
    .filter(([menuItemId, current]): boolean => (desiredById.get(menuItemId) ?? 0) !== current.currentQuantity)
    .map(([menuItemId, current]): JsonObject => ({
      id: current.cartItemId,
      amount: desiredById.get(menuItemId) ?? 0,
    }));
  if (providerChanges.length === 0) {
    throw new InterfoodToolError('MA-INTERFOOD-ORDER-NO-CHANGE', 'Submitted-order preview requires at least one quantity decrease or removal.', { orderId });
  }
  return providerChanges;
}

function flattenCartCollection(value: unknown): JsonObject[] {
  if (Array.isArray(value)) {
    return value.map(asRecord).filter((row: JsonObject | undefined): row is JsonObject => row !== undefined);
  }
  const object: JsonObject | undefined = asRecord(value);
  if (object === undefined) return [];
  return Object.values(object).flatMap((nested: unknown): JsonObject[] => flattenCartCollection(nested));
}

function canonicalOrderRows(order: JsonObject): JsonObject[] {
  if (Array.isArray(order.order_items)) {
    const cart: JsonObject = asRecord(order.cart) ?? {};
    const cartItems: JsonObject[] = Array.isArray(cart.cart_items)
      ? cart.cart_items.map(asRecord).filter((row: JsonObject | undefined): row is JsonObject => row !== undefined)
      : [];
    const cartById: Map<number, JsonObject> = new Map(
      cartItems.map((row: JsonObject): [number, JsonObject] => [Number(row.id), row]),
    );
    return order.order_items
      .map(asRecord)
      .filter((row: JsonObject | undefined): row is JsonObject => row !== undefined)
      .map((orderItem: JsonObject): JsonObject => {
        const cartItem: JsonObject = cartById.get(Number(orderItem.cart_item_id)) ?? {};
        return {
          ...cartItem,
          ...orderItem,
          menu_item: {
            ...(asRecord(cartItem.menu_item ?? cartItem.menuItem) ?? {}),
            ...(asRecord(orderItem.menu_item ?? orderItem.menuItem) ?? {}),
          },
        };
      });
  }
  return findCartItemRows(order);
}

function extractOrderPage(value: unknown): JsonObject[] {
  const candidates: unknown[] = [value];
  while (candidates.length > 0) {
    const current: unknown = candidates.shift();
    if (Array.isArray(current)) {
      if (current.every((item: unknown): boolean => asRecord(item) !== undefined)) return current as JsonObject[];
      candidates.push(...current);
    } else {
      const object: JsonObject | undefined = asRecord(current);
      if (object !== undefined) {
        for (const key of ['data', 'orders', 'items', 'results']) if (object[key] !== undefined) candidates.push(object[key]);
      }
    }
  }
  return [];
}

function paginationBounds(value: unknown): { current: number; last: number } | undefined {
  const queue: unknown[] = [value];
  while (queue.length > 0) {
    const object: JsonObject | undefined = asRecord(queue.shift());
    if (object === undefined) continue;
    const current: number = Number(object.current_page ?? object.currentPage);
    const last: number = Number(object.last_page ?? object.lastPage);
    if (Number.isInteger(current) && Number.isInteger(last)) return { current, last };
    for (const key of ['data', 'meta', 'pagination']) if (object[key] !== undefined) queue.push(object[key]);
  }
  return undefined;
}

function findCartItemRows(value: unknown): JsonObject[] {
  const result: JsonObject[] = [];
  const walk = (candidate: unknown): void => {
    if (Array.isArray(candidate)) {
      for (const item of candidate) walk(item);
      return;
    }
    const object: JsonObject | undefined = asRecord(candidate);
    if (object === undefined) return;
    if ((object.menu_item !== undefined || object.menuItem !== undefined) && (object.quantity !== undefined || object.amount !== undefined)) {
      result.push(object);
      return;
    }
    for (const nested of Object.values(object)) walk(nested);
  };
  walk(value);
  return result;
}

function cartQuantity(value: unknown, menuItemId: number): number {
  return findCartItemRows(value)
    .filter((row: JsonObject): boolean => Number((asRecord(row.menu_item ?? row.menuItem) ?? {}).id ?? row.menu_item_id) === menuItemId)
    .reduce((total: number, row: JsonObject): number => total + Number(row.quantity ?? row.amount ?? 0), 0);
}

export function buildCartDiff(value: unknown, desired: InterfoodDesiredCartLine[]): InterfoodCartDiff {
  const currentMap: Map<number, number> = new Map();
  for (const row of findCartItemRows(value)) {
    const menuItemId: number = Number((asRecord(row.menu_item ?? row.menuItem) ?? {}).id ?? row.menu_item_id ?? row.menuItemId);
    const quantity: number = Number(row.quantity ?? row.amount ?? 0);
    if (!Number.isInteger(menuItemId) || menuItemId < 1 || !Number.isInteger(quantity) || quantity < 0) continue;
    currentMap.set(menuItemId, (currentMap.get(menuItemId) ?? 0) + quantity);
  }
  const desiredMap: Map<number, number> = new Map(desired.map((line): [number, number] => [line.menuItemId, line.quantity]));
  const ids: number[] = [...new Set([...currentMap.keys(), ...desiredMap.keys()])].sort((left, right) => left - right);
  const current: InterfoodDesiredCartLine[] = [...currentMap].map(([menuItemId, quantity]) => ({ menuItemId, quantity })).sort((left, right) => left.menuItemId - right.menuItemId);
  const changes: InterfoodCartDiffLine[] = ids.map((menuItemId: number): InterfoodCartDiffLine => {
    const currentQuantity: number = currentMap.get(menuItemId) ?? 0;
    const quantity: number = desiredMap.get(menuItemId) ?? 0;
    const delta: number = quantity - currentQuantity;
    return {
      menuItemId,
      currentQuantity,
      quantity,
      delta,
      operation: delta === 0 ? 'unchanged' : quantity === 0 ? 'remove' : delta > 0 ? 'add' : 'subtract',
    };
  });
  return {
    current,
    desired,
    changes,
    effectCount: changes.reduce((total: number, line: InterfoodCartDiffLine): number => total + (line.operation === 'remove' ? 1 : Math.abs(line.delta)), 0),
    matches: changes.every((line: InterfoodCartDiffLine): boolean => line.delta === 0),
  };
}

function buildOrderChangeDiff(value: unknown, desired: InterfoodDesiredCartLine[]): InterfoodCartDiff {
  const order: JsonObject | undefined = findOrderObject(value);
  if (order === undefined) {
    throw new InterfoodToolError('MA-INTERFOOD-ORDER-SCHEMA', 'Could not locate canonical order lines for change diff.');
  }
  const rows: JsonObject[] = normalizeOrderLines([order]).map((line: InterfoodOrderLine): JsonObject => ({
    menu_item: { id: line.menuItemId },
    quantity: line.quantity,
  }));
  return buildCartDiff({ cart_items: rows }, desired);
}

async function readDesiredCart(cartItemsFile: string): Promise<InterfoodDesiredCartLine[]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(cartItemsFile, 'utf8')) as unknown;
  } catch (error: unknown) {
    throw new InterfoodToolError('MA-INTERFOOD-CART-FILE', 'Could not read the desired cart JSON file.', {
      cartItemsFile,
      cause: error instanceof Error ? error.message : String(error),
    });
  }
  if (!Array.isArray(parsed)) {
    throw new InterfoodToolError('MA-INTERFOOD-CART-FILE', 'Desired cart JSON must be an array.');
  }
  const seen: Set<number> = new Set();
  return parsed.map((value: unknown, index: number): InterfoodDesiredCartLine => {
    const record: JsonObject | undefined = asRecord(value);
    const menuItemId: number = Number(record?.menuItemId);
    const quantity: number = Number(record?.quantity);
    if (!Number.isInteger(menuItemId) || menuItemId < 1 || !Number.isInteger(quantity) || quantity < 0 || quantity > 50) {
      throw new InterfoodToolError('MA-INTERFOOD-CART-FILE', 'Every desired cart line requires a positive menuItemId and quantity from 0 to 50.', {
        index,
        value,
      });
    }
    if (seen.has(menuItemId)) {
      throw new InterfoodToolError('MA-INTERFOOD-CART-FILE', 'Desired cart contains duplicate menuItemId values.', { menuItemId });
    }
    seen.add(menuItemId);
    return { menuItemId, quantity };
  }).filter((line: InterfoodDesiredCartLine): boolean => line.quantity > 0);
}

function normalizeDesiredOrderCart(cartItems: unknown[]): InterfoodDesiredCartLine[] {
  const quantities: Map<number, number> = new Map();
  for (const [index, value] of cartItems.entries()) {
    const row: JsonObject | undefined = asRecord(value);
    const menuItem: JsonObject = asRecord(row?.menu_item ?? row?.menuItem) ?? {};
    const menuItemId: number = Number(row?.menuItemId ?? row?.menu_item_id ?? menuItem.id);
    const quantity: number = Number(row?.quantity ?? row?.amount ?? 1);
    if (!Number.isInteger(menuItemId) || menuItemId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      throw new InterfoodToolError('MA-INTERFOOD-ORDER-CHANGE', 'Every submitted-order cart item needs a menu item ID and quantity from 1 to 50.', {
        index,
        value,
      });
    }
    quantities.set(menuItemId, (quantities.get(menuItemId) ?? 0) + quantity);
  }
  return [...quantities].map(([menuItemId, quantity]) => ({ menuItemId, quantity })).sort((left, right) => left.menuItemId - right.menuItemId);
}

function extractFinancialEffect(value: unknown): JsonObject {
  const explicitDelta: number | null = numericField(value, ['price_difference', 'priceDifference', 'price_delta', 'priceDelta', 'difference']);
  const refundAmount: number | null = numericField(value, ['refund_value', 'refundValue', 'refund_amount', 'refundAmount', 'amount_to_refund', 'amountToRefund']);
  const parts: JsonObject[] = findArrayField(value, ['parts']).map(asRecord).filter((part: JsonObject | undefined): part is JsonObject => part !== undefined);
  const instantRefundHuf: number = parts
    .filter((part: JsonObject): boolean => part.type !== 'refund_pending')
    .reduce((total: number, part: JsonObject): number => total + (finiteNumber(part.amount) ?? 0), 0);
  const pendingRefundHuf: number = parts
    .filter((part: JsonObject): boolean => part.type === 'refund_pending')
    .reduce((total: number, part: JsonObject): number => total + (finiteNumber(part.amount) ?? 0), 0);
  return {
    priceDeltaHuf: explicitDelta ?? (refundAmount === null ? null : -refundAmount),
    refundAmountHuf: refundAmount,
    instantRefundHuf: parts.length === 0 ? null : instantRefundHuf,
    pendingRefundHuf: parts.length === 0 ? null : pendingRefundHuf,
    refundDestination: stringField(value, ['refund_destination', 'refundDestination', 'refund_to', 'refundTo']),
    refundStatus: stringField(value, ['refund_status', 'refundStatus', 'status']),
    pendingCustomerServiceApproval: parts.length > 0
      ? pendingRefundHuf > 0
      : booleanField(value, ['pending_customer_service_approval', 'pendingCustomerServiceApproval', 'needs_approval', 'needsApproval']),
  };
}

function findArrayField(value: unknown, keys: string[]): unknown[] {
  const found: unknown = findField(value, keys);
  return Array.isArray(found) ? found : [];
}

function numericField(value: unknown, keys: string[]): number | null {
  const found: unknown = findField(value, keys);
  return found === undefined ? null : finiteNumber(found);
}

function stringField(value: unknown, keys: string[]): string | null {
  const found: unknown = findField(value, keys);
  return typeof found === 'string' && found.trim().length > 0 ? found.trim() : null;
}

function booleanField(value: unknown, keys: string[]): boolean | null {
  const found: unknown = findField(value, keys);
  return found === undefined ? null : interpretBooleanSignal(found, []);
}

function findField(value: unknown, keys: string[]): unknown {
  const queue: unknown[] = [value];
  while (queue.length > 0) {
    const candidate: unknown = queue.shift();
    if (Array.isArray(candidate)) {
      queue.push(...candidate);
      continue;
    }
    const object: JsonObject | undefined = asRecord(candidate);
    if (object === undefined) continue;
    for (const key of keys) if (object[key] !== undefined) return object[key];
    queue.push(...Object.values(object));
  }
  return undefined;
}

function findNumericField(value: unknown, keys: string[]): number {
  const queue: unknown[] = [value];
  while (queue.length > 0) {
    const current: unknown = queue.shift();
    if (Array.isArray(current)) queue.push(...current);
    const object: JsonObject | undefined = asRecord(current);
    if (object === undefined) continue;
    for (const key of keys) {
      const parsed: number = Number(object[key]);
      if (Number.isInteger(parsed) && parsed > 0) return parsed;
    }
    queue.push(...Object.values(object));
  }
  throw new InterfoodToolError('MA-INTERFOOD-ORDER-SCHEMA', `Could not find ${keys.join('/')} in order details.`);
}

export function summarizeCart(value: unknown): InterfoodCartSummary {
  const items: InterfoodDesiredCartLine[] = buildCartDiff(value, []).current;
  return {
    cartId: findNumericFieldOrNull(value, ['cart_id', 'cartId', 'id']),
    itemCount: items.length,
    unitCount: items.reduce((total: number, line: InterfoodDesiredCartLine): number => total + line.quantity, 0),
    items,
  };
}

export function summarizeOrderDetails(value: unknown): JsonObject {
  const order: JsonObject | undefined = findOrderObject(value);
  if (order === undefined) {
    throw new InterfoodToolError('MA-INTERFOOD-ORDER-SCHEMA', 'Could not locate an order object in order details.');
  }
  return {
    orderId: String(order.id ?? order.order_id ?? order.orderId ?? ''),
    cartId: integerOrNull(order.cart_id ?? order.cartId ?? asRecord(order.cart)?.id),
    year: integerOrNull(order.year),
    week: integerOrNull(order.week),
    paymentStatus: typeof order.payment_status === 'string' ? order.payment_status : null,
    totalHuf: finiteNumber(order.real_total ?? order.total),
    originalTotalHuf: finiteNumber(order.original_total),
    lines: normalizeOrderLines([order]),
  };
}

function findOrderObject(value: unknown): JsonObject | undefined {
  const queue: unknown[] = [value];
  while (queue.length > 0) {
    const candidate: unknown = queue.shift();
    if (Array.isArray(candidate)) {
      queue.push(...candidate);
      continue;
    }
    const object: JsonObject | undefined = asRecord(candidate);
    if (object === undefined) continue;
    if ((Array.isArray(object.order_items) || Array.isArray(object.cart_items))
      && (object.id !== undefined || object.order_id !== undefined)) return object;
    for (const key of ['data', 'order', 'result']) if (object[key] !== undefined) queue.push(object[key]);
  }
  return undefined;
}

function findNumericFieldOrNull(value: unknown, keys: string[]): number | null {
  try {
    return findNumericField(value, keys);
  } catch (error: unknown) {
    if (error instanceof InterfoodToolError && error.code === 'MA-INTERFOOD-ORDER-SCHEMA') return null;
    throw error;
  }
}

function portionClass(code: string, category: JsonObject): InterfoodPortionClass {
  if (category.full_portion_menu_category_id !== undefined || /K$/i.test(code)) return 'small';
  return code ? 'full' : 'unspecified';
}

function asRecord(value: unknown): JsonObject | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : undefined;
}

function integerOrNull(value: unknown): number | null {
  const parsed: number = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function finiteNumber(value: unknown): number | null {
  const parsed: number = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function interpretOverlap(value: unknown): boolean | null {
  if (Array.isArray(value)) return value.length > 0;
  const envelope: JsonObject | undefined = asRecord(value);
  if (envelope?.error === false && Object.prototype.hasOwnProperty.call(envelope, 'data')) {
    if (envelope.data === null) return false;
    return interpretOverlap(envelope.data);
  }
  return interpretBooleanSignal(value, ['overlap', 'has_overlap', 'hasOverlap', 'exists']);
}

export function interpretCancellable(value: unknown, orderId: number): boolean | null {
  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    const ids: number[] = value.flatMap((item: unknown): number[] => {
      const object: JsonObject | undefined = asRecord(item);
      const id: number = Number(object?.id ?? object?.order_id ?? object?.orderId ?? item);
      return Number.isInteger(id) ? [id] : [];
    });
    return ids.length > 0 ? ids.includes(orderId) : null;
  }
  const direct: boolean | null = interpretBooleanSignal(value, ['cancellable', 'cancelable', 'can_cancel', 'canCancel', 'allowed']);
  if (direct !== null) return direct;
  const object: JsonObject | undefined = asRecord(value);
  if (object !== undefined) {
    for (const key of ['orders', 'items', 'results', 'data']) {
      if (Array.isArray(object[key])) return interpretCancellable(object[key], orderId);
    }
  }
  return null;
}

function interpretBooleanSignal(value: unknown, keys: string[]): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && (value === 0 || value === 1)) return value === 1;
  if (typeof value === 'string' && ['true', '1'].includes(value.toLocaleLowerCase())) return true;
  if (typeof value === 'string' && ['false', '0'].includes(value.toLocaleLowerCase())) return false;
  const object: JsonObject | undefined = asRecord(value);
  if (object === undefined) return null;
  for (const key of keys) {
    if (object[key] !== undefined) return interpretBooleanSignal(object[key], keys);
  }
  for (const key of ['data', 'result']) {
    if (object[key] !== undefined) {
      const nested: boolean | null = interpretBooleanSignal(object[key], keys);
      if (nested !== null) return nested;
    }
  }
  return null;
}

function sha(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
