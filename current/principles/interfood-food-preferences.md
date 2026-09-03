# Interfood food and portion preferences

Owner-confirmed rules, 2026-09-01. The machine-readable source is
`current/interfood/preferences.json`; this document preserves the reasoning and the boundary around uncertain cases.

## Confirmed

1. **Bolognai: hard reject.** The Interfood bolognai is consistently bad and overly sweet; a large percentage is
   discarded. Match the normalized food-name pattern `bolognai`, not only historical `foodId=119`, so renamed or new
   bolognai occurrences are also excluded.
2. **Kuszkusz: actively prefer/search.** Surface couscous dishes prominently, but do not let this positive signal
   override a disliked ingredient or another hard reject. Historical examples prove that the couscous can appear
   with an otherwise unwanted component.
3. **Portion reduction.** The owner is currently trying to eat less. Lasagne should use the small portion whenever a
   small occurrence exists. Other clearly high-volume/filling meals should also default to small during review.
4. **Mashed-potato exception.** The small-portion reduction rule does not apply to meals containing
   `burgonyapüré`; when both occurrences exist, prefer the full one.
5. **Chicken cuts.** Prefer `csirkemell` / `jércemell` / fillet. Chicken thigh (`csirkecomb`) and wing
   (`csirkeszárny`) are disliked and should be demoted.
6. **Fish.** Fish sticks (`halrud...`) are acceptable only as a fallback when there is no better candidate. They are
   not a favorite. Other fish dishes are disliked by default; the fish type rule carries a `halrud` exception and
   the separate `fallback` stance strongly demotes, but does not reject, fish sticks.
7. **Beef and pork.** Both are harder for the owner's body to tolerate and are demoted. Minced (`darált`) form is an
   explicit exception and is acceptable, but minced meat is not automatically a positive preference by itself.
   Mixed-protein meals must apply every detected protein rule: chicken must not hide bacon/pork or a beef
   `rostélyos` component.
8. **History is normally valid evidence.** Experimental orders are rare, so repeated historical orders may provide
   capped positive affinity during recommendation. Explicit corrections always override history, as with bolognai.
9. **Rakott burgonya.** Strong favorite. It remains a high-volume meal, so choose the small occurrence when one is
   available; liking the food does not cancel the current eat-less portion rule.
10. **Explicit full-portion exceptions.** Camembert must not be small. Chicken-breast-paprikash-like meals
    (`csirkemell paprikás`, `csirkepaprikás`) may also be full because their full serving is not large in practice.
11. **Thai chicken with rice noodles.** The recent experience was discouraging, so `thai csirke...` is demoted while
    better alternatives are preferred. This is not a blanket rejection of tofu, peanut or every rice-noodle dish.
12. **Tofu and peanut.** Both are explicitly acceptable/neutral, not allergens or negative preference signals.
13. **Milk/cream allergy boundary.** Milk and cream are avoid-level dietary hazards. Every matching candidate must
    carry a prominent `ÉTELALLERGIA` warning, be strongly demoted behind every safe alternative and be excluded
    from the health lane. If no safe candidate exists and it nevertheless appears, the warning must stay visible.
    **Owner clarification, 2026-09-02:** only milk and cream are the avoid items. Sour cream (`tejföl`), yoghurt,
    curd (`túró`), butter and cheese are explicitly tolerated; do not extend the rule to all dairy. Their own
    parenthetical milk declarations are not standalone added milk. **Later explicit owner display correction:**
    do not show milk warnings for cheeses, including camembert; the former blanket warning on breaded camembert
    is superseded. This is the owner's cheese exception, not a declaration of medical safety. Other affected
    meals still need milk/cream review; unrelated sauces/sides do not inherit a blanket exception just because a
    meal contains some cheese. Trace-only `may contain milk` text is not an actual-ingredient
    match; this parsing distinction is NOT medical clearance or owner-confirmed tolerance of traces. Missing
    ingredients or warnings must never be described as allergy-safe. A real ingredient warning overrides history.
14. **Tortilla, burrito and wrap.** These food-name families are preferred and should be surfaced when otherwise
    safe; they remain subject to the allergy and other negative rules.
15. **Mushroom.** Mushroom-containing meals are fallback choices. Prefer another acceptable meal whenever one is
    available; mushroom is not a hard reject.
16. **Tried pulled-chicken BBQ tortilla:** disliked (exact food identity recorded in preferences). The positive
    tortilla-family rule does not override this specific experience.
17. **Less pasta.** Pasta dishes are fallback; replace cabbage pasta when another acceptable main exists. This
    does not demote tortillas, burritos or wraps as a family.
18. **Brassói and vadas:** disliked. `Vadas` describes that dish style, not every wild-game meat.
19. **Potatoes:** preferred. Rice/rice-risotto dishes should trial an actual small occurrence when offered, while
    retaining camembert, mashed-potato and chicken-paprikash full-portion exceptions. Never invent a small size.
20. **Fruit with meat:** disliked, including peach or pineapple chicken. Berry sauce with cheese is not covered.

## Daily quantity rule

- The default requirement is **two food portions per delivery day**, not one.
- The plan and coverage commands therefore default to `2`; a plan is complete only when the sum of recommendation
  `quantity` values is two for every planning day.
- Normally use two distinct foods. Never satisfy the rule by selecting the small and full occurrence of the same
  food as if they were different meals.
- An explicitly confirmed `favorite` is a strong candidate and may use one exact occurrence with `quantity=2`.
  Camembert is confirmed for this behavior; rakott-burgonya occurrences are also favorites.
- A food never previously eaten must never be proposed with `quantity=2`, even if a broad name-pattern favorite
  matches it. Duplication requires at least one earlier exact-food order. Trial/novelty is always quantity one.
- For the normal two-distinct-food path, prefer different primary meal families, not only different `foodId` values.
  Near-identical variants such as the same Western chicken steak with the same side must not crowd out a genuinely
  different acceptable meal. If no different safe family exists, complete quantity is still the fallback priority.
- Repeated historical quantity is evidence that should have triggered clarification, but history alone never turns
  a food into an explicit favorite or authorizes duplication.

## Default recommendation horizon

- When the owner asks for an Interfood recommendation without naming a week or date range, inspect **every currently
  enabled current/future week** returned by the provider, not just the next week.
- Read order coverage before presenting the proposal. Omit already fully covered days from new-order
  recommendations, but state which available week or days were skipped and why.
- Keep all uncovered weeks in one batched review so the owner can compare variety across the complete currently
  orderable horizon. A disabled week is not available and must not be invented from its week number.

## Friday and Saturday menu rule

The Saturday Interfood menu is delivered on Friday. It is therefore not a separate Saturday meal-ordering day:

- normally order no separate Saturday meal;
- rank Friday and Saturday menu occurrences in one Friday decision pool;
- choose a Saturday-menu occurrence for Friday only when Friday has no better choice or the Saturday occurrence is
  genuinely better;
- retain the occurrence's original Saturday `menuItem.date` and `menuItemId` when adding it to the cart, while the
  plan exposes Friday as the decision/delivery date plus both upstream `sourceDates`.

## Optional soup and dessert rule

- Soup and dessert are optional **additional items** on top of the two required main portions; neither can satisfy
  or reduce main-meal coverage.
- When an explicit favorite is available, display it on its own `+` line BELOW the two main meals in the SAME daily
  cell. It remains visibly additional and never replaces either main meal.
- Keep them in separate daily `soup` and `dessert` recommendation slots and default each selected extra to quantity
  one. No extra is required on every day.
- An add-on recommendation requires an explicit owner-confirmed exact-food `favorite`. Repeated order history alone
  never creates a soup or dessert recommendation.
- Exact repeated history remains discovery evidence. The same `foodId` on at least five distinct historical
  delivery days may appear only in `favoriteCandidates`, batched for owner confirmation; it is not a recommendation
  and cannot authorize a cart mutation.
- A similar name with a different identity does not inherit either the historical evidence or the favorite decision.
- **Fruit soup is a hard reject.** The machine-readable `food-type:meal:gyumolcsleves` rule matches only soup-category
  foods whose names identify fruit; it must not reject fruit-flavoured desserts or savoury lemon soup.
- Dessert is intentionally sparse: recommend it only when an explicit owner-confirmed exact-food favorite is
  available. Do not suggest unknown sweets or dessert alternatives merely for variety; having dessert only on those
  few favorite days is the desired behavior.
- Soup follows the same rule: only an explicit owner-confirmed exact-food favorite may be recommended, and no
  experimental soup alternatives are generated. Fruit soup is always excluded.
- Add-on recognition is category-aware with a narrow food-name fallback for provider misclassification (for example
  a cake, mákosguba or diósmetélt published under `Vegán`, or tejbegríz published as `Főétel`); such an item must not leak into either
  main-meal alternative lane.
- Any item whose food name identifies it as a soup is routed to the soup add-on lane even when the provider assigns
  a generic/vegan/main category. This also prevents an unconfirmed soup+main bundle from silently consuming a main
  slot.
- A combined menu explicitly containing an unconfirmed bundled dessert (for example `fél adag főétel + 1
  sütemény`) is likewise excluded from automatic main-meal recommendations and alternatives.

## Main-meal alternatives

Variety applies to the actual daily meals. Alongside the selected two-main-meal plan, show two separate same-day
review lanes whenever candidates exist:

- up to three **likely-liked alternatives**, ranked by explicit preferences, repeated history, recent repetition,
  portion rules and variety evidence;
- up to three **health-oriented alternatives**, requiring complete energy/protein/salt data and no negative owner
  preference. Rank relatively by protein density adjusted for salt density, then protein density, salt density and
  energy. Display the measurements; this is a transparent planning heuristic, not a medical claim.

Both lanes deduplicate small/full occurrences by food identity and exclude already selected meals. An alternative
is a substitution choice, never an automatic additional cart line.
Owner-facing tables have ONE ROW PER DAY. Stack the two mains on separate lines in the same cell, with any favorite
extra below them. Put main alternatives in another column of the SAME table, not a separate table. Highlight actual
small portions. Omit technical IDs from user-facing output; preserve them in machine data for exact cart operations.
Do not silently drop a favorite: explain any actual milk/cream or other conflict by food name in the review.
**Permanent display contract, owner decisions 2026-09-02:** always mark favorites with ⭐, intended health-oriented
choices with 🥗, and warnings with ⚠️ plus the specific reason. 🥗 is a comparative ingredient/nutrition-based
judgment, not medical clearance. Multiple markers may coexist where appropriate, without inventing favorite status.
After every correction, including formatting-only corrections, re-present the ENTIRE current recommendation across
all available uncovered weeks: all days, portions, alternatives and extras, preserving unchanged rows. Changed
rows, a favorites fragment or a file link alone are not enough. The cheese milk-display decision above is settled;
do not keep asking the same milk-warning question about camembert.
**Favorite salience, owner correction 2026-09-02:** build the review around the actual repeatedly chosen favorite
foods, with variety/health options as alternatives. A broad `camembert` match does not make a once-ordered pumpkin
risotto equivalent to the repeatedly ordered breaded camembert with potatoes. Lead with the exact favorite and
its dated availability. If milk/cream or another existing constraint prevents its default selection, show that
favorite prominently as a pending conflict decision; do not erase it behind an ordinary substitution. This changes
review visibility, NOT the allergy boundary: the latest complaint is not approval to ignore separately added milk.

**Superseded interpretation, owner correction 2026-09-02:** the earlier broad dairy detector and one-food-per-table-
row layout were incorrect. Their historical record remains in
`__documentations/developments/2026-09-02-interfood-allergy-trial-and-variety.md`; the clarified rules above govern.

## Still uncertain

- **Milánói:** it may be the acceptable alternative to bolognai, but the owner is no longer sure whether the
  Interfood milánói was also bad. Keep it neutral and include it in the next relevant review; do not infer `prefer`
  from the contrast alone.
- **“High-volume/filling” classification:** lasagne is deterministic. Other foods are reviewed from their name,
  components, weight and available small/full occurrences; no gram threshold is invented until calibrated with the
  owner.

## Operational readback

```powershell
ma interfood preference list --pretty
```

The expected state contains a `food-name-pattern:bolognai=hard-reject`, a
`food-name-pattern:kuszkusz=prefer`, and a lasagne `portionRule` preferring `small` with `burgonyapüré` excluded.
It also contains chicken-cut name patterns, a fish-type dislike excepting `halrud`, a separate
`food-name-pattern:halrud=fallback`, beef/pork dislikes excepting `darált`, and neutral records for `darált`, tofu
and peanut. Rakott burgonya is a favorite with a small-portion rule; camembert and chicken-paprikash patterns prefer
full portions; `thai csirke` is demoted. It also contains `tortilla|burrito|wrap=prefer`,
`protein:gomba=fallback` and `allergen:milk-cream=avoid`.
The portion rules also include `burgonyapüré=>full` so price cannot accidentally turn the exception into a small
serving.
