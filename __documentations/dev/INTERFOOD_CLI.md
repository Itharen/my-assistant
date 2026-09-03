# Interfood CLI — menu reader and integration contract

**Status:** public reader + authenticated account/cart/order-change implementation complete; live reads and submitted-order preview calibrated, live mutation canary pending
**Plan:** `__agent/plans/interfood-integration-hyperplan/hyperplan.plan.md`

## Command map

The `ma interfood` CLI reads Interfood's first-party public API directly. It does not depend on a page layout,
browser extension, MCP server or a particular AI model.

```powershell
ma interfood weeks --pretty
ma interfood menu --pretty
ma interfood menu --year 2026 --week 37 --pretty
ma interfood menu-range --weeks 3 --pretty
ma interfood auth status --pretty
ma interfood auth start --pretty
ma interfood orders sync --from-year 2022 --summary --pretty
ma interfood orders list --summary --pretty
ma interfood orders week --year 2026 --week 37 --summary --pretty
ma interfood orders coverage --year 2026 --week 37 --expected-per-day 2 --pretty
ma interfood orders patterns --minimum-units 2 --limit 30 --pretty
ma interfood orders patterns --double-orders-only --pretty
ma interfood orders patterns --add-ons-only --minimum-units 1 --limit 30 --pretty
ma interfood foods identify --weeks 3 --commit --summary --pretty
ma interfood foods list --pretty
ma interfood preference set --scope exact-food --key food:109 --stance favorite --reason "..." --pretty
ma interfood preference set --scope food-name-pattern --key bolognai --stance hard-reject --reason "..." --pretty
ma interfood preference set --scope food-name-pattern --key halrud --stance fallback --reason "..." --pretty
ma interfood preference set --scope food-type --key protein:hal --stance dislike --except-pattern halrud --reason "..." --pretty
ma interfood preference compare --prefer food:109 --over food:205 --reason "..." --pretty
ma interfood preference portion --pattern lasagne --prefer small --except-pattern burgonyapüré --reason "..." --pretty
ma interfood preference list --pretty
ma interfood plan week --year 2026 --week 37 --meals-per-day 2 --health-mode balanced --repetition-windows 7,14,28 --summary --pretty
ma interfood nutrition compare --year 2026 --week 37 --ids 35853,35859 --pretty
ma interfood cart show --pretty
ma interfood cart set --menu-item-id 35853 --quantity 2 --pretty
ma interfood cart add|subtract|remove --menu-item-id 35853 --pretty
ma interfood cart clear --pretty
ma interfood cart diff --items-file C:\absolute\desired-cart.json --pretty
ma interfood cart reconcile --items-file C:\absolute\desired-cart.json --pretty
ma interfood order show --order-id 123 --pretty
ma interfood order check --order-id 123 --pretty
ma interfood order change-preview --order-id 123 --cart-items-file C:\absolute\items.json --pretty
ma interfood order change-preview --order-id 123 --menu-item-id 35853 --quantity 1 --pretty
ma interfood order change-apply --preview-hash SHA256 --confirmed-by owner --pretty
```

- `weeks` returns the current week and every published week, including disabled/future state.
- `menu` returns the normalized current week unless both `--year` and `--week` are supplied.
- `menu-range` starts at the API-reported current week and reads enabled weeks in order. Default is three; allowed
  range is 1..8. If fewer weeks are enabled, it returns all available weeks with `complete=false` and a warning.
- An owner request for “recommendations” with no explicit range means every provider-enabled current/future week.
  Run `weeks`, then `orders coverage` and `plan week` for each enabled week; suppress already fully covered days from
  the new-order proposal while reporting that they were skipped. Disabled weeks are not available.

## Output contract

Every command returns the common JSON envelope. Weekly menus contain:

- stable weekly `menuItemId` and reusable `foodId` when supplied;
- food, category and category-group names/codes;
- normalized `portionClass` (`small | full | mixed | unspecified`) while preserving the raw category;
- delivery date, price, availability and cancellation deadline;
- ingredients and Interfood's nutrition summary;
- up to three meal components with weight;
- portion and per-100g energy, fat, saturated fat, carbohydrate, sugar, protein and salt.

Missing upstream data stays `null`. Consumers must not interpret missing as zero. `menuItemId` is the future
mutation identifier; `foodId` alone must not be used to order a date-specific occurrence.

Order-history normalization must likewise preserve `orderId`, `orderLineId`, `deliveryDate`, `menuItemId`, raw
category, `portionClass` and `quantity`. Never deduplicate by food name or `foodId`: the same food can have small and
full occurrences on one day, reappear on multiple days, and be ordered twice on the same date.

`orders patterns` turns the complete persisted history into review candidates without changing preferences. It
uses active lines only and reports exact total units, distinct delivery dates, distinct orders, full/small/unknown
portion units, category names, days whose aggregate quantity reached at least two, maximum units on one day and
first/last dates.
`--double-orders-only` isolates the especially informative quantity-two-or-more signal; `--minimum-units` and
`--limit` keep the review batch manageable. `--add-ons-only` restricts foods to dessert- or soup-category history,
which is the normal discovery command for optional extras. Confidence is deterministic (`strong`, `moderate`,
`weak`) but remains an observation: even a strong candidate requires owner confirmation before `preference set`.

`preference set --scope food-name-pattern` matches a normalized substring of the displayed food name. Use it for
owner statements that intentionally cover current and future identities such as every bolognai or every couscous
dish; use `exact-food` when the decision only concerns one identity. A hard reject wins over a separate positive
pattern match.

Repeat `--except-pattern` on any `preference set` to suppress that rule when the normalized food name, category,
components or ingredients contain the exception. This expresses “fish is disliked except fish sticks” and
“beef/pork is harder to tolerate except minced form” without adding an artificial positive bonus to the exception.

`preference portion` stores an explicit small/full occurrence rule. `--pattern` is a normalized food-name substring;
repeat `--except-pattern` for named exclusions. The planner rewards the preferred occurrence and penalizes the other
when both have recognized `small|full` semantics. It does not invent an occurrence when Interfood publishes only an
`unspecified` portion, and it does not silently classify subjective descriptions such as “filling” without evidence.
The rice pattern `rizs` also recognizes the Hungarian `rizzsel` inflection. Owner rice/rice-risotto small-portion
trials retain the earlier camembert, mashed-potato and chicken-paprikash full-portion exceptions.
Other name patterns remain literal substrings: for example `thai csirke` misses `Thai csípős ... csirkemell`.
Review compound names against the full owner rules before selecting; record any proposal override in the internal
selection mapping instead of silently treating raw scores as approval.
Review the full ingredient list, not only the displayed name or absence of ranker warnings: live W37 evidence
showed apple hidden in a chicken/mozzarella salad and chicken thigh inside generically named poultry loaf.
Record review substitutions without converting them into new explicit owner preferences. If authenticated sync
is unavailable but public menus work, recommendations may continue against the cached account state only with
its exact freshness limitation disclosed; no fresh-account or ordering-readiness claim is permitted.

The `fallback` stance is a strong `-60` demotion without rejection. It represents “acceptable only when there is no
better candidate”; unlike `avoid` or `hard-reject`, it remains selectable as the last available reasonable meal.

`plan week` and `orders coverage` both default to two portions per planning/delivery day. Each compact recommendation
contains an explicit integer `quantity`; validate the daily sum instead of counting rows. The allocator normally
selects two distinct food identities and will not count small+full occurrences of the same food separately. If the
top candidate matches an explicit `favorite`, it may emit one exact `menuItemId` with `quantity=2`. This makes the
cart payload lossless and avoids duplicated display rows. If the allocator cannot reach the daily target from
acceptable distinct foods and an eligible favorite, it emits an explicit quantity-shortfall ambiguity instead of
silently presenting an incomplete day as complete.
An explicit favorite may receive quantity two only after at least one earlier exact-food order; an unseen food is
always a quantity-one trial. For two distinct rows the allocator first seeks a different normalized primary meal
family, so two provider identities for the same named main do not defeat the variety rule. It falls back to a same-
family second row only when no different acceptable family can complete the daily quantity.
The preferred occurrence receives no positive food score; only the non-preferred occurrence is demoted. Portion
choice therefore cannot accidentally turn an unknown lasagne into a favorite.

Every planned day also contains independent `addOns` entries for `dessert` and `soup`. These are optional extras
outside the daily two-main-meal requirement: they never consume main-meal quantity and never make an uncovered day
look covered. A quantity-one `recommendation` requires a matching explicit owner-confirmed exact-food `favorite`
and uses the date-specific `menuItemId`. The same exact `foodId` on at least five distinct historical delivery days
may appear only under `favoriteCandidates`; history alone never recommends or authorizes a cart line. Similar names
with different identities inherit neither history nor preference.
No dessert or soup novelty/variety alternatives are generated. Both kinds use the same sparse explicit-favorite-only
rule. Unknown sweets and soups are suppressed, and `food-type:meal:gyumolcsleves` is a hard reject. A narrow
food-name fallback also catches unmistakable desserts that the provider publishes under a generic category (for
example `Vegán kávétorta`, `Vegán mákosguba`, `Vegán diósmetélt` or `Tejbegríz` as `Főétel`), preventing them from leaking into main-meal or
health-oriented alternatives. Combined
menus explicitly bundling an unconfirmed sweet (`fél adag főétel + 1 sütemény`) are excluded from those lanes too.
Food names containing `leves` are routed to the soup lane even under a generic/vegan category; this is deliberately
conservative for unconfirmed soup+main bundles.

Main-meal variety is exposed separately. Each day keeps up to three distinct-food `alternatives` under the normal
likely-liked rank and up to three `healthOrientedAlternatives`. The health-oriented lane requires complete portion
energy, protein and salt; rejects any negatively preferred food; and ranks relatively by protein density adjusted
for salt density, then protein density, salt density and energy. Its evidence prints the underlying measurements.
This is an explainable comparison heuristic, not a medical health claim. Both lanes exclude selected foods and
deduplicate small/full occurrences.

Protein facets are multi-valued. A mixed meal may simultaneously carry `protein:csirke` and `protein:sertes` or
`protein:marha`; every matching preference is applied. `bacon` is pork evidence and `rostélyos` is beef evidence,
so a preferred chicken component cannot mask a harder-to-tolerate meat in the same menu. Wild boar is mapped to the
pork-tolerance rule. Mushroom is a fallback facet; tortilla/burrito/wrap are preferred name patterns.
The `meal:pasta` facet recognizes pasta names/components (including `tésztával`) but excludes tortilla/burrito/wrap;
`meal:fruit-meat` matches meat with a fruit-bearing meal name (including `ananásszal`), not cheese with berry sauce.
The specifically disliked pulled-chicken BBQ tortilla is recorded as an exact-food decision. Main ranking tiers
are rejection, actual milk/cream warning, negative explicit preference, then numeric score/price/stable ID. A broad
positive pattern cannot cancel a specific dislike. With enough non-negative options, family variety also stays
within that pool. Szilvalekváros derelye is routed to the sparse dessert lane even under a generic main category.

Each compact candidate exposes `dietaryWarnings`. The milk/cream allergy detector adds a prominent warning and a
large safety demotion for actual milk/cream ingredients; health-oriented alternatives exclude every warned
candidate. Owner clarification (2026-09-02): sour cream, yoghurt, curd, butter and cheese are tolerated. Their
parenthetical milk declarations do not mean standalone added milk; separately listed milk/cream still warns.
Trace-only `may contain` text is not treated as an actual ingredient; this is not confirmation of trace tolerance
or an allergy-safety guarantee. Missing ingredients/warnings never prove safety. Owner-facing output must print a
warning whenever such a candidate is shown for review; never hide it in score evidence.
Later explicit owner display exception (2026-09-02): no milk warning for cheeses, including camembert. The agent
applies this user-facing exception to the raw diagnostic output and preserves the original ingredient data. Do not
claim the CLI detector was changed or that the food is allergen-free. Other affected meals still need milk/cream
warnings; this is not a blanket exemption for unrelated milk/cream sauces or side dishes.

Owner-facing review: one table row per day, two main meals stacked inside one cell, optional favorite extras below
them, main substitutions in another column of the same table. Highlight real small portions; do not show technical
IDs to the owner. Keep identifiers in CLI JSON and internal selection data. Explain favorite omissions by name.
Always use ⭐ for favorites, 🥗 for intended health-oriented choices and ⚠️ for warnings with a named reason.
After every correction, including presentation-only edits, repeat the complete multi-week recommendation in chat,
not just changed rows, a favorite extract or a file link. Preserve all days, portions, alternatives and extras.
Multiple markers may coexist when justified; a health marker is not medical clearance.
This supersedes the earlier broad-dairy interpretation and per-food-row layout; the dated correction is recorded in
`__documentations/developments/2026-09-02-interfood-specific-preferences-and-day-table.md`.

## Persistent login and account boundary

Public commands require no login. Account commands use namespace `my-assistant-interfood-dedicated-v1`. `auth start`
opens/reuses exactly one persistent dedicated Chrome profile; the owner signs in on the Interfood page. The token
stays under `foodplusz-auth-token` inside that profile. The UBH extension injects it only into a hardcoded allowlist
of first-party API calls and redacts token-like response keys. Password, token and cookie never belong in `.env`,
CLI arguments, action logs or model context.

The user-local replaceable cache lives in `%USERPROFILE%\.config\my-assistant\interfood\`; explicit preferences
are version-controlled at `current/interfood/preferences.json`. A globally installed CLI should be invoked from the
project directory or given `MA_ASSISTANT_PROJECT_ROOT`.

Use `--summary` for routine history synchronization, food identification and weekly planning so an agent receives
compact decision data instead of the complete personal record/menu payload. Full normalized snapshots and plans
are still persisted locally.

Account, cart and order commands return a PII-minimized summary by default. Use `--full` only for explicit local
diagnostics because raw upstream order details may include customer and delivery-address fields. Do not paste full
account output into agent context, tickets or logs.

Live calibration on 2026-09-01 synchronized 71 distinct orders and 664 distinct order lines (723 active units)
from 2025-03-31 through 2026-09-04 without pagination warnings or duplicate fingerprints. The current 2026-W36
projection contains eight distinct lines and ten units; two lines have quantity two. This is the regression
reference for preserving same-day multiplicity without counting the provider's shared multi-week cart projection
twice.

Cart composition is a reversible draft operation and does not imply checkout. A submitted-order change may alter
the payable amount or create an automatic/pending refund, so it requires an exact change preview, approval bound to
that preview hash, application receipt and authoritative `order-details` readback.

`order check` reads details, cancellability and overlap independently. `change-preview` fails closed unless the
order is positively identified as cancellable and overlap is positively ruled out. Its immutable receipt contains
the exact item diff and normalized price delta, refund amount/destination/status and pending customer-service
approval fields alongside the raw upstream preview. `change-apply` persists the final readback even on mismatch and
reports a verification error instead of retrying the financial effect. Immediately before any apply it re-reads
cancellability, overlap and the authoritative order, then refreshes the financial preview. A changed order, safety
decision or refund effect invalidates the receipt before approval issuance or mutation.
The direct `--menu-item-id ... --quantity ...` form keeps every other submitted line unchanged and produces a
read-only preview. Interfood only supports reducing/removing existing submitted lines: adding a new line or
increasing quantity fails locally. For a partial reduction the provider payload contains only changed cart-item
rows as `{id: cartItemId, amount: desiredQuantity}`; unchanged rows cause the upstream preview validator to reject
the request. A preview never authorizes `change-apply`.

The live preview canary reduced one current line from two units to one in preview only and returned a 2460 Ft
refund effect, entirely instant and with no pending customer-service approval. The corresponding apply command was
not called, so the submitted order remained unchanged.

`cart diff` and `cart reconcile` consume a complete desired-state JSON array of
`[{"menuItemId":35853,"quantity":2}]`. Reconcile removes current occurrences omitted from that array, enforces a
200-effect budget, reads the authoritative final cart and stores a receipt. Use `diff` first whenever the desired
file was not generated in the same task.

## Agent rules

1. Use `menu-range --weeks 3` for current/next/following discovery; do not guess calendar week arithmetic.
2. Honor `complete` and `warning`; a disabled unpublished week is not an empty menu.
3. Use stable IDs and component fields, not display-name matching alone.
4. Do not dump all 1,000+ rows into a user conversation. Filter/rank first, then show interesting, changed or
   unidentified candidates in one review batch.
5. Explicit owner preferences outrank order-history observations and any inferred preference.
6. Do not claim that menu availability proves an existing order.
7. The implementation gates exist, but live mutation is not certified until the owner-approved canary is green.
8. When the owner asks to assemble the cart, confirmed lines must actually be applied; dry-run is not completion.
9. After an uncertain write result, reload and diff. Never repeat an add/subtract/change blindly.
10. `plan week` applies explicit pairwise preferences only when both alternatives occur on the same day. Repetition
    uses quantity-aware 7/14/28-day windows by default, configurable as three strictly increasing day counts with
    `--repetition-windows`. Weekly variety independently penalizes repeated protein, preparation, side, sauce and
    category facets, not only an identical `foodId`.
11. Health/completeness scores are emitted only when every component contains the required nutrition fields. A
    partial meal never receives an invented zero or a misleading complete-meal score.
12. A lower-authority observed/inferred write is rejected at the preference-store boundary when an explicit owner
    decision already exists for the same scope/key. `food-type` can target category groups or deterministic facets
    such as `protein:gomba`; `ingredient-pattern` participates in the same reject/score path.
13. `plan week` reads the replaceable fingerprint registry. A new, missing or content-changed identity receives an
    explicit score penalty and remains in the batched owner-review list; it is never silently treated as known.
14. Use `orders patterns` to review historical evidence. Quantity two is a strong signal, not proof; never promote
    an observed pattern to `favorite` or `prefer` without owner confirmation.
15. Every new Interfood request, decision, command, failure and calibration result must be written back in the same
    change-set according to `current/principles/interfood-continuous-documentation.md`. Chat-only knowledge is not
    part of the capability.
16. Apply owner portion rules before price. If no small occurrence exists or the portion is `unspecified`, surface
    the limitation rather than claiming that the requested smaller portion was selected.
17. Long-term history contributes `historicalAffinity` only for active lines before the candidate date. The score is
    capped at 35 and uses distinct delivery days, total units and same-day multiples. A single experiment has little
    effect; explicit owner preferences remain stronger and hard rejects still win. Recent repetition remains a
    separate negative signal.
18. Saturday menu rows are delivered on Friday and are grouped into the Friday ranking pool. The plan emits one
    Friday day with `sourceDates` containing Friday and Saturday when both contribute. A selected Saturday occurrence
    retains its original Saturday date and stable `menuItemId`; compact output exposes this as candidate `menuDate`.
    Never rewrite identity before cart use.
19. Daily variety counts each facet at most once per planning day, regardless of `quantity`, and caps the historical
    facet multiplier after two prior days. This keeps variety relevant without letting two daily portions force weak
    foods above explicit chicken/favorite evidence.
20. Treat soup and dessert as optional add-ons, not main-meal coverage. Use `orders patterns --add-ons-only` to
    inspect their exact history. Five distinct historical delivery days may produce only a batched
    `favoriteCandidates` confirmation candidate; only an explicit exact-food `favorite` may become a recommendation
    or authorize a cart line.
21. Apply the same sparse rule to dessert and soup: do not create novelty/variety add-ons, recommend only explicit
    owner-confirmed favorites, and always reject fruit soup. Present variation on the main meals instead, in
    separate likely-liked and nutrition-backed lanes.
22. Never duplicate an unseen food. Quantity two requires an explicit favorite match plus prior exact-food usage.
    For two distinct foods, prefer distinct primary meal families. Owner-facing output has one row per day with
    mains stacked in a cell and explicit favorite extras below them; alternatives occupy another column of the
same table. Technical IDs stay internal.
Before presenting that table, compare the exact-food history of the owner's favorite variants. A broad favorite
family match is not evidence that every recipe is equally loved. Surface a prevented favorite as a prominent
named conflict with availability/portion/reason, not just a low-ranked alternative. Never treat an omission complaint
as permission to waive milk/cream constraints. This is a review requirement, not a new automatic ranker guarantee.
23. Treat `dietaryWarnings` as a visible safety boundary. Actual milk/cream warning overrides positive history or
    favorite matching, removes the item from the health lane and must be highlighted in review. Sour cream, yoghurt,
    curd, butter and cheese are explicitly tolerated. Missing warnings never prove allergy safety.

## Continuous documentation contract

The canonical contract is `current/principles/interfood-continuous-documentation.md`. In short: command behavior
updates this runbook and `SKILLS.md`; workflow, approval and readback behavior updates the Interfood flow;
architecture/certification changes update the Hyperplan and completion audit; confirmed preferences go through the
preference CLI; observed patterns stay derived; regression behavior updates focused tests and the journey catalogue;
material lessons receive a dated development note, semantic action log and short FAM pointer. An Interfood task is
not closed while an affected location is stale.

## Developer verification

```powershell
cd E:\Programming\Own\CURSOR\LIVE-projects\my-assistant
pnpm --dir cli run typecheck
pnpm --dir cli test
node cli/dist/cli/src/main.js interfood weeks --pretty
node cli/dist/cli/src/main.js interfood menu-range --weeks 3
node cli/dist/cli/src/main.js interfood preference list --pretty
node cli/dist/cli/src/main.js interfood plan week --pretty
```

The state-carrying journey catalogue is at `cli/src/interfood/journeys/README.md`; the operational flow is
`__agent/flows/on-demand/interfood-ordering/`.
