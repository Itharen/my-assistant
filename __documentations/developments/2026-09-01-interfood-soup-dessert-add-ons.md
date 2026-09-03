# Interfood optional soup and dessert add-ons — 2026-09-01

## Owner request

Frequently ordered desserts and soups should be discoverable from complete history and orderable as optional
additional items. They are not replacements for either of the two daily main portions.

## Implemented contract

- `orders patterns --add-ons-only` filters the persisted history by soup/dessert category and preserves exact food
  identity, category, units, distinct dates, orders, portion split and same-day multiplicity.
- `plan week` emits independent daily `addOns` slots for `dessert` and `soup`; these never consume main-meal
  quantity.
- A quantity-one recommendation requires an explicit owner-confirmed exact-food favorite. The exact same `foodId`
  on at least five distinct historical delivery days becomes only a batched `favoriteCandidates` confirmation item.
- Weak history, novel foods and similar names with different identities are suppressed. No preference or cart write
  is inferred.

## Live W37/W38 calibration

The exact live favorite candidates are Frankfurti leves (18 prior days), Tiramisu (8), Lúdláb szelet (11) and
Bableves házi kolbásszal (8). They remain unrecommended until explicit confirmation. Bécsi krémes and Ischler each
have three prior days and are suppressed rather than exposed as alternatives.
`Tojásleves (fitt)` has a different food identity from the five-day historical `Tojásleves`, so it is not silently
promoted.

## Verification

- TypeScript typecheck is green.
- The state-carrying IF-J04 proves two main meals plus independent dessert and soup slots, five-day history remaining
  a candidate, explicit-favorite promotion, and weak novelty suppression.
- The reusable history command was run against the persisted complete account snapshot and returned the expected
  category-aware exact identities.
- The installed `ma` entry point accepts `orders patterns --add-ons-only`; two consecutive full runs completed with
  231 specs and zero failures (random seeds 02504 and 79173).

## Owner calibration — 2026-09-02: variety alternatives

> **Superseded later on 2026-09-02:** the owner clarified that variety alternatives apply to main meals, not to
> desserts or soups. This paragraph records the intermediate interpretation; the correction below is authoritative.

The owner explicitly requested alternatives even when a history-safe soup/dessert default exists: “a változatosság
gyönyörködtet”. The operating rule now presents up to three score-ranked same-day alternatives with distinct food
identities, price and history status. Small/full occurrences of the same food are deduplicated. Alternatives are
substitutions for review, not automatic extra cart lines. IF-J04 protects the three-alternative and identity-dedupe
behavior.

The post-calibration certification completed two consecutive full runs with 231 specs and zero failures (random
seeds 08567 and 22165). The installed CLI live read returned exactly three distinct-food alternatives beside each
of the four W37/W38 history-safe add-ons.

## Owner correction — 2026-09-02: main-meal variety, sparse add-ons

- Fruit soups are disliked and now use the explicit typed hard reject `meal:gyumolcsleves`.
- Dessert and soup are offered only when an exact food is an explicit owner-confirmed favorite. Even strong repeated
  history remains only a confirmation candidate. Unknown/novel add-ons and add-on alternatives are suppressed; it
  is acceptable to have these extras only on the few days when a confirmed favorite is available.
- Variety applies to main meals. The plan now emits separate distinct-food likely-liked and health-oriented lanes.
  Health-oriented candidates require complete energy/protein/salt data, exclude negative preferences and expose
  their protein/salt density and energy measurements. The ranking is a transparent relative heuristic, not a
  medical conclusion.

The latest owner clarification explicitly extends the sparse dessert rule to soups. This paragraph supersedes every
earlier statement in this note that allowed five-day history to become an add-on recommendation or exposed weak
add-on alternatives.

Live W38 verification also exposed `Vegán kávétorta` under the provider's generic `Vegán` category. A narrow
food-name fallback now classifies unmistakable dessert identities before main-meal ranking, and IF-J04 protects the
item from main recommendations and both main alternative lanes.

Final certification completed TypeScript typecheck, live W37/W38 reads, and two consecutive full runs with 232
specs and zero failures (random seeds 28728 and 29972). Both live weeks contained zero unconfirmed add-on
recommendations; the four repeated-history foods appeared only under `favoriteCandidates`.
