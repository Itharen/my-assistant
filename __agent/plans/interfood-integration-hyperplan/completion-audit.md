# HP-IF-001 completion audit — 2026-09-01

## Outcome

The implementation is code-complete for public menu reading, persistent authenticated account reads, complete
history synchronization, food identity, explicit preference memory, deterministic weekly ranking, nutrition
comparison, reversible cart composition and preview-gated submitted-order reduction/removal. The only remaining
capability release gate is one exact owner-approved live cart add/readback/remove/readback canary. No checkout,
payment or submitted-order apply is included in that canary.

## Requirement-to-evidence matrix

Later owner-review calibration (2026-09-02): the raw dietary diagnostics described below remain unchanged.
The owner-facing review applies the explicit no-milk-warning exception for cheese/camembert, uses fixed
⭐ / 🥗 / ⚠️ markers, and repeats the full recommendation after every correction. This is a documented
presentation exception, not an allergen-free claim or new engine-test result. Evidence:
`current/interfood/proposals/2026-W37-W38-review-3.md` and
`__documentations/developments/2026-09-02-interfood-full-review-markers.md`.

| Requirement | Authoritative implementation/evidence | Result |
|---|---|---|
| Current, next and following menu | `InterfoodApiClient.getMenuRange`; IF-J01; live W36..W38 read | Green |
| Stable occurrence/food identity and change detection | `InterfoodFoodRegistry`; IF-J02 commit → reload → known/changed/unknown-ID | Green |
| Persistent login usable by every terminal agent | UBH namespace `my-assistant-interfood-dedicated-v1`; `auth status/start` | Green |
| Complete previous-order retrieval | terminal pagination + persisted account snapshot; IF-J03; live 71 orders/664 lines/723 units | Green |
| Same food across portions/dates and quantity 2+ | canonical line model + coverage; IF-J03; live W36 multiplicity calibration | Green |
| Historical favorite candidates without false promotion | `orders patterns`; quantity/date/order/portion evidence; IF-J03 | Green |
| Favorites, name/type patterns, portion rules and pairwise priorities | atomic preference store + cycle guard + ranker name/portion/pairwise score; IF-J04 | Green |
| Fallback-only foods and Friday-delivered Saturday menu | `fallback` stance + Friday/Saturday planning pool preserving occurrence identity/source dates; IF-J04 variants | Green |
| Two daily portions and strong-candidate duplication | default plan/coverage=2; explicit recommendation `quantity`; favorite duplication requires prior exact usage; unseen trial never 2×; small/full identity dedupe; primary-family variety; day-aware capped variety; IF-J04 variants | Green |
| Optional soup/dessert beyond main coverage | independent `addOns`; five-day exact history creates only `favoriteCandidates`; only explicit exact-food favorite recommends; add-on novelty suppressed; fruit-soup typed hard reject; IF-J04 variants; live W37/W38 read | Green |
| Main-meal alternative lanes | distinct-food likely-liked alternatives + complete-nutrition protein/salt/energy health-oriented ranking; negative preference/incomplete-data exclusion; IF-J04 | Green |
| Milk/cream allergy boundary | visible `dietaryWarnings`; health-lane exclusion; owner clarification tolerates sour cream/yoghurt/curd/butter/cheese including parenthetical milk; separately added milk/cream warns; trace parsing is not safety clearance; live W37/W38 review | Green |
| Explainable history and variety | capped long-term affinity + recent repetition + food/protein/preparation/side/sauce/category evidence | Green |
| Recent repetition | quantity-aware default 7/14/28 windows; CLI-configurable; IF-J04 default/custom variants | Green |
| Nutrition comparison without invented data | component portion/per-100g normalization; complete-only aggregates; IF-J07 | Green |
| Cart show/add/set/subtract/remove/clear/diff/reconcile | convergent bounded effects + authoritative readback + receipts; IF-J05 | Code green; live canary pending |
| Submitted-order inspection/modification | safety check → immutable preview → exact approval → bounded apply → final readback; IF-J06 | Code green; live preview green; financial apply separately gated |
| Agent/model independence | TypeScript `ma interfood` JSON CLI; no AI SDK/MCP requirement | Green |
| Privacy and secrets | session remains in dedicated profile; summary default; `--full` diagnostics only | Green |
| Regression protection | focused specs + IF-J01..IF-J07 state-carrying journeys; 238-spec suite adds persisted owner correction variants, exact dairy scope, exact-dislike precedence, pasta/fruit inflections and rice portions; seeds and review findings in the 2026-09-02 specific-preferences development note | Green |
| Continuous operating documentation | canonical writeback contract + runbook/skills/flow/agent-file enforcement | Green |

## Audit defects found and fixed

1. The journey catalogue had treated lower-level authenticated specs as substitutes for IF-J03/05/06. Dedicated
   state-carrying journeys now prove persistence/resume, cart cleanup and exact approval/no-approval behavior.
2. Missing nutrition had been coalesced to zero during meal scoring. Aggregates are now omitted unless every
   component supplies the required field.
3. Pairwise preference decisions were persisted and cycle-checked but not consumed by the ranker. They now affect
   both alternatives when both are present, with score and evidence.
4. Repetition originally covered all history equally and variety covered exact food only. Ranking now uses dated,
   quantity-aware windows and independently tracks food facets.
5. PowerShell forwards an unquoted comma-delimited native argument as a whitespace-delimited value. The CLI accepts
   both `7,14,28` and `7 14 28`, while validating the same three strictly increasing day counts.
6. The preference store could accept a lower-authority write over an explicit owner decision. The storage boundary
   now rejects inferred or confirmed-order overwrite attempts when the existing source has higher authority.
7. Food-type and ingredient-pattern entries were persistable but did not participate in ranking. Category/facet
   type matching and normalized ingredient-pattern matching now feed the same explainable score and hard-reject path.
8. New, missing or changed registry identity did not influence ranking. The planner now consumes the persisted
   registry, applies explicit identity penalties and keeps changed/unidentified recommendations in owner review.
9. The complete order sample was usable but had no compact, deterministic preference-evidence report. `orders
   patterns` now preserves quantity/date/order/portion evidence, surfaces same-day doubles and never auto-promotes.
10. Interfood usage knowledge could remain trapped in chat. The continuous documentation contract now makes
    same-change writeback an explicit close gate across the runbook, skills, flow, plans, tests and memory pointer.
11. Exact-food preferences could not express owner-wide name rules, and portion choices were prose-only. The store,
    CLI and planner now support normalized food-name patterns plus explicit small/full rules with exclusions.
12. Negative protein rules needed contextual exceptions and history was repetition-only. Preference exclusions now
    model fish-stick/minced-meat exceptions without fake bonuses, while capped long-term affinity makes the owner's
    mostly-valid order history positive evidence alongside the independent recent-repetition penalty.
13. Soup and dessert could either consume a main-meal slot or remain invisible to the planner. They now use
    independent optional add-on slots; the reusable category-aware history report identifies candidates, exact
    five-day evidence remains only a `favoriteCandidates` confirmation item, and only an explicit owner-confirmed
    exact-food favorite can recommend quantity one. Weak, similar and novel identities are suppressed.
14. A broad favorite name pattern could duplicate a never-eaten occurrence. Quantity two now additionally requires
    prior exact-food usage; novel trials remain one. A daily family key also keeps near-identical provider variants
    from defeating the variety requirement when another acceptable family exists.
15. Provider misclassification let mákosguba, diósmetélt and generic-category soups enter the main lanes. Typed
    name fallbacks now route them to sparse add-ons. Actual milk/cream ingredients produce a visible allergy warning,
    a safety demotion and health-lane exclusion. Later owner correction tolerates sour cream, yoghurt, curd, butter
    and cheese; trace-only parsing is not confirmation of trace tolerance.
## Remaining exact live gate

Fresh persistence/read calibration at `2026-09-01T05:59:54.507Z` traversed 17 pages for years 2022..2027 and
again returned `complete=true`, 71 orders, 664 normalized lines and zero warnings. W37 coverage is authoritatively
`not-covered` on all six published delivery dates at one expected meal/day. This was a read plus local-cache refresh;
it did not mutate the account.

Candidate: Interfood 2026-W37, 2026-09-07, `Gombapaprikás, orsó tészta`, `menuItemId=35853`, quantity `1`,
observed price `1650 HUF`.

Final read-only preflight at `2026-09-01T08:01:20+02:00` found exactly one matching occurrence: `foodId=109`,
category `A` / `Főétel`, `portionClass=full`, `disabled=false`, price `1650 HUF`; the authenticated cart remained
exactly zero items and zero units. The canary target has therefore not drifted, but this preflight is not mutation
authorization.

Sequence after fresh owner approval: assert empty cart → add exactly one → authoritative quantity-one readback →
remove exactly that occurrence → authoritative empty-cart readback → persist redacted receipt. Stop on any identity,
price, availability, session or readback drift. Checkout/payment is never invoked. A submitted-order change is not
part of this sequence.
