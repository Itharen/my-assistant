# Interfood all-available-week recommendation — 2026-09-02

> PARTIALLY SUPERSEDED later on 2026-09-02: the horizon/coverage rule is unchanged. The meal selections, totals,
> broad dairy interpretation and per-food-row presentation below are historical. Current proposal:
> `current/interfood/proposals/2026-W37-W38-review.md`; correction/test evidence:
> `2026-09-02-interfood-specific-preferences-and-day-table.md`.

## Owner decision

An Interfood recommendation request without an explicit week or range defaults to every provider-enabled
current/future week. The review is coverage-aware: fully covered days are reported and excluded from new-order
recommendations; every uncovered week is presented in one batch.

## Live calibration

- Provider current week: 2026-W36.
- Enabled current/future weeks: W36, W37, W38; W39 is disabled.
- W36 is already fully covered with two active units on every Monday-Friday delivery day.
- W37 and W38 have no active order lines and therefore form the current recommendation batch.
- Recalibrated safe/varied main totals: W37 19,595 HUF / 10 portions; W38 19,650 HUF / 10 portions.
- Repeated-history soup/dessert matches remain `favoriteCandidates`, not recommendations.

## Corrections found during review

- Provider-mislabeled sweets (`Vegán kávétorta`, `Tejbegríz` as `Főétel`) and combined
  `fél adag főétel + 1 sütemény` menus are excluded from main recommendations and alternatives unless the exact
  sweet is explicitly confirmed under the sparse add-on rule.
- Protein recognition is multi-valued. Chicken no longer hides bacon/pork or beef `rostélyos` in a mixed menu.
- The later allergy/trial/semantic-variety calibration excludes warned milk/cream items, never duplicates an unseen
  exact food and avoids near-identical primary meal families when another acceptable main exists. See
  `2026-09-02-interfood-allergy-trial-and-variety.md`.
- The owner-facing proposal is `current/interfood/proposals/2026-W37-W38.md`.

## Verification

TypeScript typecheck and live W36-W38 coverage/menu reads are green. The latest two consecutive full regression
runs completed with 234 specs and zero failures (final random seeds 38096 and 59922).
