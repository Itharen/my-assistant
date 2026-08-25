# MP-03 — Pagination & Traversal Engine

**Status:** verified · **Progress:** 3/3 · **Depends on:** MP-01, MP-02 contract

## Cél

Oldal-, load-more-, infinite-scroll-, cursor- és virtualized-list traversal egységes, budgetelt,
deduplikált és folytatható engine-ben.

## Subplanek

- [SP-03.1](../subplans/sp-03-1-pagination-models.plan.md) — pagination modellek/adapters
- [SP-03.2](../subplans/sp-03-2-cycle-dedup-budgets.plan.md) — cycle/dedup/budgets
- [SP-03.3](../subplans/sp-03-3-virtualized-cart-traversal.plan.md) — virtualized/cart traversal

## Acceptance

- [x] Minden támogatott modell ugyanazt a `TraversalResult` contractot adja.
- [x] Duplicate-cycle/no-progress garantáltan terminál és nem loopol végtelenül.
- [x] Partial eredmény resume tokennel és explicit stop-reasonnel tér vissza.

**Evidence:** `server/src/traversal/`, `test/pagination.spec.ts` (10 tests; six models, virtual-500, resume).
