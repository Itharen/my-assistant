# Interfood allergy, trial quantity and semantic variety — 2026-09-02

> SUPERSEDED IN PART by the later explicit owner clarification on 2026-09-02. Sour cream, yoghurt, curd,
> butter and cheese are tolerated; only milk/cream are avoid items. The sour-cream exclusion below was an agent
> overgeneralization, not an owner rule. Table layout is one row/day with stacked meals/extras and an alternatives
> column, with no user-facing IDs. Current decision and verification:
> `2026-09-02-interfood-specific-preferences-and-day-table.md`. The earlier implementation/evidence below is
> historical, not the current operating contract or current recommendation.

## Owner decisions

- Milk and cream are allergy-related avoid items; cheese alone is exempt. Every match must be visibly warned.
- Tortilla, burrito and wrap are preferred.
- Mushroom is fallback when another acceptable food exists.
- A never-eaten food is never a two-portion trial.
- Favorite soup/dessert is displayed above the two main meals, not inside their count.
- Owner-facing food tables place one food on each row.

## Implementation

The TypeScript ranker now emits `dietaryWarnings`, applies a strong safety demotion behind safe alternatives and
excludes warned candidates from the health lane. If no safe meal exists, a selected last-resort candidate retains
the warning in both output and owner-review ambiguity. It strips trace-only milk declarations and cheese parentheticals before detection. The
conservative actual-ingredient set includes cream, sour cream, yoghurt, curd and butter; cheese is the only explicit
exception.

Quantity two now requires both an explicit favorite match and at least one earlier exact-food order. The daily
allocator first chooses different normalized primary meal families, then falls back to a same-family row only when
needed to complete quantity. Mislabeled mákosguba, diósmetélt and any food explicitly named as soup are routed away
from main-meal lanes. Wild boar participates in the pork tolerance rule.

## Live calibration

W37 and W38 were regenerated from live menus and complete persisted history. No warned candidate is in the twenty
main portions. W37 `35670` Frankfurti soup and W38 `36599` Tiramisu are history-derived add-on candidates but carry
milk/cream warnings and are excluded. W38 `36565` Székelykáposztával rakott burgonya and `36355` Csirkemell rácosan
are different foods, but both contain sour cream and are excluded. W38 `36145` camembert pumpkin risotto may be two
because camembert is an explicit favorite and this exact food has one prior order.

The recalibrated draft is `current/interfood/proposals/2026-W37-W38.md`. After documentation completion, two
consecutive full runs were green with 234 specs and zero failures (final random seeds 38096 and 59922).
