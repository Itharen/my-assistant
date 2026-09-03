# Interfood protein rules and history affinity — 2026-09-01

## Owner input

Chicken breast/fillet is preferred over thigh or wing; fish sticks are the only normally liked fish; beef and pork
are harder to tolerate but minced form is acceptable. Historical orders are normally valid because experimental
orders are rare, subject to later owner correction.

## Implementation

- Stored explicit chicken-cut, fish, beef, pork and minced-form decisions.
- Added normalized preference exclusions so negative protein rules can exempt `halrud` or `darált` without turning
  the exception into an unrelated positive bonus.
- Added capped long-term `historicalAffinity` from active lines strictly before the candidate date: distinct dates,
  units and same-day doubles. Maximum 35 keeps explicit preferences stronger.
- Retained the independent 7/14/28 recent-repetition penalty, so “known favorite” and “had it too recently” can both
  be true and visible in evidence.
- Corrected an observed false promotion where a vegan dish containing “darált” was boosted by the first naive
  exception representation.

Canonical owner rules: `current/principles/interfood-food-preferences.md`.

## Verification

- Final consecutive full runs: 223 specs, zero failures (random seeds 70248 and 98731).
- Live W37/W38 planning verified that fish sticks escape the general fish demotion, bolognai remains rejected,
  minced-form exceptions do not boost vegan foods, and repeated historical foods receive visible affinity evidence.

## 2026-09-02 mixed-protein correction

Live all-available-week recommendation review exposed mixed menus where the first recognized protein hid another
meat. Protein facets are now multi-valued; `bacon` maps to pork and `rostélyos` to beef, so every applicable owner
preference is scored. IF-J04 proves that a chicken-and-bacon meal carries both the chicken preference and pork
dislike instead of silently dropping either rule.
