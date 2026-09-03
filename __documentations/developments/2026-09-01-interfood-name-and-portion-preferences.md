# Interfood food-name and portion preferences — 2026-09-01

## Owner need

The existing exact-food/type preference model could not faithfully express “all bolognai”, “actively look for
couscous” or “prefer a small lasagne portion, with mashed-potato dishes exempt”. Encoding only historical food IDs
would miss renamed/new occurrences, while a prose-only portion rule would not affect planning.

## Implementation

- Added `food-name-pattern` to preference scope; matching uses the same normalized Hungarian-aware name contract as
  the registry.
- Added durable explicit portion rules with food-name pattern, preferred `small|full` occurrence and repeatable
  exclusions.
- Ranking emits evidence only for recognized full/small occurrences. Preferred portion is score-neutral and the
  non-preferred occurrence is demoted by 90, so portion policy cannot manufacture a food preference.
- Legacy `1.0.0` preference files without `portionRules` load as an empty rule list.
- IF-J04 proves a bolognai name-pattern hard reject and lasagne small-portion selection across persisted state.

Canonical owner reasoning: `current/principles/interfood-food-preferences.md`.

## Verification

- Final consecutive full runs: 223 specs, zero failures (random seeds 29572 and 80377).
- Live W37 plan readback: couscous preference selects the 2026-09-09 couscous candidate; bolognai does not survive
  hard-reject filtering; the portion rule no longer boosts lasagne above unrelated foods.
- Global `ma` installation reads back both name-pattern entries and the persisted portion rule.
