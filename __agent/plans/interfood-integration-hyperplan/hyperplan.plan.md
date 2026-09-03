# HYPERPLAN — Interfood Menu Intelligence and Ordering Assistant

**ID:** HP-IF-001
**Status:** live reads and submitted-order preview calibrated; owner-approved mutation canary pending
**Created:** 2026-09-01
**Owner:** itharen3@gmail.com
**Canonical request:** `current/feature-requests/interfood-scraper.md`

## STATUS

| Masterplan | Weight | Progress | Status |
|---|---:|---:|---|
| MP-IF-01 — Upstream discovery and public menu reader | 3 | 3/3 | ✅ complete |
| MP-IF-02 — Food identity and preference memory | 3 | 3/3 | ✅ fingerprint registry + explicit graph + SoT |
| MP-IF-03 — Authenticated order-history synchronization | 3 | 3/3 | ✅ full live sync + weekly quantity/duplicate calibration |
| MP-IF-04 — Explainable ranking and variety planner | 4 | 4/4 | ✅ deterministic score/evidence/alternatives |
| MP-IF-05 — Cart composition and verified submitted-order modification | 5 | 4/5 | 🟡 state machines green; owner-approved live canary pending |
| MP-IF-06 — Nutrition and health comparison | 2 | 2/2 | ✅ comparison + opt-in balanced scoring |
| MP-IF-07 — Documentation, regression and live rollout | 3 | 2/3 | 🟡 runbook/flow/tests delivered; live rollout pending |
| **Overall** | **23** | **21/23 (91%)** | **read/preview capability live; mutation release gate remains** |

## 1. Outcome

An agent- and model-independent `ma interfood` TypeScript CLI that can read the current, next and following
Interfood menus, normalize food identity/nutrition, synchronize the owner's submitted orders from a persistent
signed-in session, learn explicit food and food-type preferences, and produce explainable, varied weekly order
proposals. Every agent receives the same stable JSON envelope; no provider-specific MCP or AI runtime is required.

The public slice remains browser-free. Authenticated reads and writes are implemented behind a distinct,
persistent dedicated-profile trust boundary. Account reads and a real submitted-order reduction preview are live
calibrated; an owner-approved reversible cart mutation and any separately approved financial apply remain release
gates rather than missing code.

## 2. Verified upstream ground truth — 2026-09-01

- Frontend: `https://rendel.interfood.hu/`; first-party API: `https://ia.interfood.hu`.
- Public endpoints verified live: `GET /api/v1/current-week`, `GET /api/v1/weeks`, `GET /api/v1/days`,
  `POST /api/v1/menu`, `GET /api/v1/filters`.
- Current live week is 2026-W36. W36, W37 and W38 are enabled; W39 is published but disabled.
- Each of W36..W38 returned 482 normalized menu occurrences across six delivery dates.
- Menu rows contain a weekly menu-item ID, food ID/name, category, date, price, order/cancel state, ingredients,
  rating and up to three components.
- Each component can contain weight plus portion and per-100g energy, fat, saturated fat, carbohydrate, sugar,
  protein and salt.
- The shipped frontend's authenticated contracts have been mapped for `api/v3/orders`,
  `api/v3/orders-for-week`, `api/v3/order-details`, cart v2 add/subtract/remove/clear and submitted-order
  preview/apply.
- The persistent dedicated session was verified live after one manual login. Full sync returned 71 unique orders,
  664 unique normalized lines and 723 active units across 2025-03-31..2026-09-04 with zero pagination warnings and
  zero duplicate fingerprints.
- The 2026-W36 live projection contains eight distinct lines and ten units, including two quantity-two lines. The
  normalizer uses canonical `order_items` and does not double-count the shared multi-week `cart.cart_items` data.
- Current-order safety calibration returned cancellable=true and overlap=false. A real 2→1 reduction preview
  succeeded and reported a 2460 Ft instant refund with no pending customer-service approval. No apply call ran.
- The live frontend and endpoint prove that partial submitted-order preview/apply payloads contain changed rows
  only, encoded as `{id: cartItemId, amount: desiredQuantity}`. Adding/increasing submitted lines is unsupported.

This evidence supersedes the older assumption that weekly menu reading requires Playwright. UI automation remains
only a possible authenticated mutation adapter, not the primary read architecture.

## 3. Architecture and trust boundaries

```text
Any AI agent / terminal
        |
        v
ma interfood <command>  -- stable JSON envelope + action log
        |
        +--> PublicInterfoodApiClient
        |       +--> weeks/current-week/menu/filters
        |       `--> normalized IDs, categories, components and nutrition
        |
        +--> FoodRegistry + PreferenceGraph
        |       +--> exact-food decisions
        |       +--> food-type/category decisions
        |       `--> explicit > observed > inferred evidence
        |
        +--> AuthenticatedOrderReader
        |       `--> dedicated persistent UBH profile, background same-origin reads
        |
        +--> ExplainableWeeklyPlanner
        |       `--> hard constraints → preference → variety → nutrition → price
        |
        `--> VerifiedOrderWriter
                `--> proposal → owner approval → mutation → receipt/readback
```

### Browser/session contract

- Public menu reading never opens or focuses a browser.
- Login, when needed, uses one dedicated persistent Interfood profile/namespace shared by all agents.
- Passwords, cookies and session tokens stay in that browser profile; they are not stored in `.env`, source code,
  CLI arguments, logs or model context.
- Default runtime is background content-script/same-origin API access. No OS-level keyboard/mouse fallback.
- Existing personal browser windows and dormant tabs are never scanned or activated.
- Computer Use is outside this capability and is not a fallback.

## 4. Stable CLI contract

Delivered:

```text
ma interfood weeks --pretty
ma interfood menu --pretty
ma interfood menu --year 2026 --week 37 --pretty
ma interfood menu-range --weeks 3 --pretty
```

Implemented authenticated and planning commands:

```text
ma interfood orders sync|list|week|coverage
ma interfood foods identify|list
ma interfood preference set|compare|list
ma interfood plan week
ma interfood nutrition compare
ma interfood cart show|add|set|subtract|remove|clear|diff|reconcile
ma interfood order show|check|change-preview|change-apply
```

Every result uses `{ok, action, requestId, elapsedMs, result|error}`. Pagination/cursors are followed to their
terminal condition. Partial upstream availability is a successful but explicit `complete=false` result with a
warning; silent truncation is forbidden.

## 5. Data model

### 5.1 Weekly occurrence versus food identity

- `menuItemId`: one orderable occurrence on one date/category/week. Used for cart mutation and readback.
- `foodId`: upstream reusable food identity when present. Used as one matching signal, never as the sole identity.
- `foodFingerprint`: normalized name + component names + category family. Survives upstream ID replacement.
- `contentFingerprint`: ingredients, nutrition, portion weights and price. Detects a changed known food.

The system indexes every discovered food occurrence in a replaceable fingerprint registry so an upstream ID or
content change is detectable. Only explicit classifications and pairwise decisions enter the curated preference
graph. Thus the system can discover the whole menu without forcing the owner to classify hundreds of irrelevant
rows.

### 5.2 Order-history and line identity

The authenticated reader must retrieve all pages and preserve five distinct identity levels:

```text
foodId             reusable food identity; never sufficient for an order line
menuItemId         one date + category/portion occurrence in a published menu
orderId            one submitted order/payment container
orderLineId        one upstream order/cart line, when supplied
quantity           multiplicity of that exact line; may be 2+ on the same date
```

An order line includes `deliveryDate`, raw category code/name, normalized `portionClass`, component/weight data,
unit and line price, quantity, order state and source fingerprint. The authoritative portion distinction is the
category/menu-item occurrence, not the shared food name or `foodId`.

The live public menu proves that the same `foodId` occurs twice on the same date with different menu IDs and
categories: for example 2026-09-07 Gombapaprikás is `A` (full occurrence, item 35853) and `AK` (small occurrence,
item 35859). The public normalizer now exposes `portionClass` plus the linked full-portion category ID while retaining
the raw category fields. Mixed menu categories remain `mixed`; unknown semantics remain `unspecified`, never guessed.

Deduplication uses an upstream line/event ID. If it is absent, the fallback fingerprint includes order, date,
menu-item, portion/category and raw row identity. It must never collapse rows by `foodId`, food name or date alone.

### 5.3 Coverage result

Order-history reads produce exact lines and a per-day result:

```text
covered | partial | not-covered
orderedUnitCount
expectedUnitCount
evidence: [{ orderId, orderLineId, menuItemId, portionClass, quantity, state }]
```

`quantity=2` contributes two ordered units. Cancelled/removed lines do not contribute. The expected daily unit count
is an owner preference and must not be hard-coded from the current habit.

### 5.4 Preference evidence

```text
scope: exact-food | food-name-pattern | food-type | category | ingredient-pattern
stance: favorite | prefer | neutral | dislike | avoid | hard-reject
source: explicit-user | confirmed-order | inferred
confidence: confirmed | observed | tentative
context: optional day/season/health-mode/budget
reason + createdAt + lastConfirmedAt
```

Precedence is strict: explicit user decision > confirmed repeated order > inference. Inference may recommend a
question but can never silently overwrite an explicit preference. Pairwise rules (`A preferred over B`) form a
directed graph; cycles are detected and returned for clarification.

Portion decisions are stored alongside preferences as explicit rules: normalized food-name pattern, preferred
`small|full` occurrence, zero or more name-pattern exclusions, reason and confirmation timestamps. Ranking applies
them only to recognized portion occurrences; it never treats `unspecified` as small. Subjective high-volume classes
remain owner-review candidates until a deterministic classifier is calibrated.

Preference entries may carry normalized exclusion patterns evaluated against name, category, components and
ingredients. An exclusion suppresses that one rule; it is not a positive score. Long-term order affinity is a
capped evidence score (maximum 35) derived from distinct dates, units and same-day multiples before the candidate
date. It is separate from the configurable recent-repetition penalty and always subordinate to explicit decisions.

The complete history also produces a non-mutating pattern report: total units, distinct delivery dates/orders,
portion split, same-day double-order count, maximum daily units and first/last occurrence. These are review signals,
not preference-store writes. Quantity two is deliberately highlighted, while owner confirmation remains mandatory.
The category-aware `--add-ons-only` view isolates soups and desserts. The weekly plan treats them as optional
quantity-one extras outside the two-main-meal invariant: only an explicit owner-confirmed exact-food favorite may be
recommended. Exact identity on at least five historical delivery days remains only a batched `favoriteCandidates`
confirmation candidate; weak, novel and merely similar identities are suppressed. Soup and dessert share this same
sparse rule, and fruit soup is a typed hard reject. Variety belongs to the main meals:
each day exposes distinct-food likely-liked alternatives plus a complete-nutrition health-oriented lane ranked by
measured protein/salt density and energy. No alternative becomes an implicit extra cart line.

### 5.5 Continuous documentation

Every new Interfood request, decision, behavior, failure and live calibration must update every affected durable
artifact in the same change-set. The canonical writeback matrix and close gate are
`current/principles/interfood-continuous-documentation.md`; chat-only knowledge is invalid.

## 6. Explainable ranking and variety

Ranking is deterministic and evidence-bearing, not an opaque LLM score:

1. Remove hard rejects, allergens, unavailable rows and violated owner constraints.
2. Apply exact-food preference.
3. Apply food-type/category and pairwise preference.
4. Penalize recent repetition across configurable 7/14/28-day windows.
5. Reward variety in main protein, preparation style, side dish, sauce and category.
6. Optionally add nutrition/health and price terms.
7. Penalize uncertain identity or materially changed known food.
8. Return a component score, evidence and alternatives for every recommendation.

Health scoring is initially advisory and opt-in. Missing nutrition stays `null`; the tool never invents zeroes or
computes a total unless the upstream component/portion contract supports it.

## 7. Order composition and modification contract

Order mutation is implemented as a separate trust boundary and remains live-canary gated.

### 7.1 Editable cart / new order composition

The tools must support `show`, `add`, exact `set`, `subtract`, `remove`, `clear`, `diff` and `reconcile`. `set` is
implemented as a convergent operation: read current quantity, calculate the delta, perform bounded add/subtract,
then read back the exact requested quantity. Every line uses canonical `menuItemId`, date and price evidence.

The cart is a reversible draft. When the owner asks to assemble it, confirmed lines are actually applied in the
same task; a dry run is preparation, not completion, and the same execution intent is not requested twice. Only
ambiguous foods are batched for one clarification round. Checkout and payment are never implied by cart assembly.

### 7.2 Already submitted order modification

The Interfood frontend proves this first-party sequence:

```text
GET api/v3/order-details?order_id=...
  → editable cart_id + cart_items
POST api/v2/carts/{add|subtract|remove} with menu_item_id + anonymous_id
POST api/v2/cancel-payment/preview with order_id + cart_id + changed cart_items only
POST api/v2/cancel-payment with the exact previewed changed cart_items
GET api/v3/order-details?order_id=...  → authoritative readback
```

Despite the upstream endpoint name, the shipped frontend calls the final operation `changeOrder` and presents
refund/virtual-account effects. The adapter therefore names it `order change`, not `cancel`, while preserving the
upstream endpoint in diagnostics.

The authenticated session has proved the actual read and preview request/response schema. A real account change is
still not claimed: it requires a reversible owner-approved mutation canary, while a submitted-order financial apply
requires separate approval bound to the exact immutable preview hash.

### 7.3 Mandatory state machine

Every write follows:

```text
read original → build immutable desired state → diff → preview financial effect
→ explicit approval of exact hash (submitted-order change only)
→ apply bounded effects → read authoritative final state → reconcile → receipt
```

The implementation must:

1. synchronize existing orders and coverage first;
2. produce a complete date/item/quantity/price proposal;
3. group all ambiguous foods into one owner review batch with recommendations and links/context;
4. for an already-submitted order change, require explicit approval for that exact immutable preview hash;
5. apply only canonical `menuItemId` occurrences in the dedicated session;
6. verify every effect plus the final weekly order/cart state;
7. stop on any unverified row, price/availability change, overlap or session mismatch;
8. never confirm payment or final checkout without a fresh action-time owner approval;
9. preserve original and desired fingerprints plus a mutation receipt for safe resume;
10. after any timeout/partial response, reload and diff before deciding whether another effect is necessary;
11. distinguish cart-draft mutation from already-submitted order modification in both commands and approvals;
12. return price delta, refund destination/status and any pending customer-service approval in the receipt.

The implementation enforces these static invariants: `order check` combines details/cancellability/overlap;
unknown safety shapes fail closed; preview receipts bind normalized item diff and financial-effect fields into the
hash; final readback mismatch is persisted and raised without retrying the financial effect. The live preview
response is normalized into total refund, instant refund, pending refund and customer-service approval state. The
first real apply remains approval-gated. Apply also re-reads safety and authoritative order state and refreshes the
financial preview before issuing an approval token; any drift invalidates the stored preview before mutation.

## 8. Critical user journeys

| ID | Journey | Required variants |
|---|---|---|
| IF-J01 | Discover current week → enabled weeks → fetch three menus → normalize nutrition | full range; fewer published weeks; malformed schema |
| IF-J02 | Snapshot menu → identify new/changed interesting foods → owner classification → registry reuse | new; unchanged; changed fingerprint; unknown identity |
| IF-J03 | Login once → resume persistent session → page all past orders → preserve portion/date/quantity → compute daily coverage | success; small+full same food/date; same food across dates; quantity=2; expired session; interrupted resume; empty history |
| IF-J04 | Orders + preferences → rank main alternatives + independent soup/dessert extras → varied week proposal | favorite conflict; repetition penalty; hard reject; missing nutrition; add-on outside main coverage; exact five-day history remains candidate; explicit favorite promotion; add-on novelty suppression |
| IF-J05 | Menu proposal → cart add/set/remove/replace → cart reconcile | success; price change; unavailable item; partial mutation; resume |
| IF-J06 | Existing order → details → change diff → refund preview → approval → apply → final readback | success; declined approval; stale preview; pending refund; partial mutation |
| IF-J07 | Ordered history → nutrition comparison → optional healthy alternative | complete; partial nutrition; no comparable candidate |

IF-J01..IF-J07 now have serial, state-carrying automated journeys. IF-J03 proves authenticated pagination,
persistence and fresh-process resume; IF-J05 proves desired-cart convergence and cleanup; IF-J06 proves persisted
preview resume, exact approval, one apply and final readback plus an owner-decline/no-apply branch. IF-J04 proves
persisted pairwise decisions, food-type and ingredient hard-reject decisions, protected source precedence,
changed-identity review, quantity-aware two-serving allocation, favorite duplication, small/full dedupe, fallback
selection, Friday/Saturday delivery grouping, capped day-aware protein-facet variety and
quantity-aware configurable repetition windows, plus independent soup/dessert add-ons where exact history creates
only confirmation candidates and explicit exact-food favorites create recommendations without consuming the
two-main-meal target. IF-J07 proves
that incomplete component nutrition does not create zero-valued completeness/health scores.

Live calibration separately proves IF-J01/03 reads and IF-J06 through the non-mutating refund preview. The actual
mutation legs remain gated: IF-J05 awaits the exact reversible owner-approved cart canary, while any IF-J06
submitted-order apply always requires a separate fresh preview-hash approval.

## 9. Delivery sequence and gates

Latest owner-facing calibration (2026-09-02): fixed ⭐ favorite / 🥗 health-oriented / ⚠️ warning markers;
repeat the entire available-weeks recommendation after every correction. No milk warning on cheeses, including
camembert, per explicit owner display exception; retain ingredient data and warnings for other affected foods.
This presentation rule does not claim that the raw CLI dietary-warning detector changed. Canonical contract:
`current/principles/interfood-food-preferences.md`; current review `current/interfood/proposals/2026-W37-W38-review-3.md`.

Owner calibration on 2026-09-02 refines IF-J04: only milk/cream are avoid items; sour cream/yoghurt/curd/butter/cheese
are tolerated. Negative exact preferences outrank broad positives, rice small portions recognize inflections,
fruit-meat/pasta facets retain owner exclusions, and the owner review uses one row/day with stacked mains/extras,
same-table alternatives and no technical IDs. Correction journey and full evidence:
`__documentations/developments/2026-09-02-interfood-specific-preferences-and-day-table.md`.

1. **Phase 1 — public read foundation (done):** API client, normalizer, CLI, live three-week smoke, journey test.
2. **Phase 2 — identity/preferences (done):** local SoT, atomic store, fingerprints, cycle-safe preference CLI.
3. **Phase 3 — order reads (done):** canonical namespace, terminal pagination, cache, coverage and live account calibration.
4. **Phase 4 — planning (done):** deterministic rank/variety engine with score evidence and batch uncertainties.
5. **Phase 5 — writing (implemented):** convergent cart + submitted-order preview/approval/receipt/readback; live canary pending.
6. **Phase 6 — health (implemented baseline):** nutrition comparison and opt-in balanced scoring; owner calibration remains tuning.

Gates: two consecutive clean reviews; typecheck + feature tests + journeys; no secret/log leakage; installed-CLI
smoke; user-facing naive-user QA; explicit owner approval for live mutation. Read and preview gates are green. A
green preview does not imply that a submitted order was changed.
