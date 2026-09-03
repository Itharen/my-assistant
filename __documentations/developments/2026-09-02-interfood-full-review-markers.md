# Interfood — fixed markers and complete review replay, 2026-09-02

## Explicit owner decisions

- Always mark favorites ⭐ and warnings ⚠️ with the concrete warning reason.
- Use 🥗 for health-oriented choices, including selected mains where supported; not medical certification.
- After any correction, reproduce the entire recommendation: all available weeks, daily portions,
  alternatives in the same table, and favorite extras below the two mains. A file link alone is insufficient.
- Do not display milk warnings for cheeses, including camembert. This supersedes the previous unresolved
  camembert display question; it does not waive milk/cream review for unrelated dishes, sauces or sides.

Canonical rules: `current/principles/interfood-food-preferences.md`; continuous-documentation contract:
`current/principles/interfood-continuous-documentation.md`. Machine preference was saved through
`ma interfood preference set --scope ingredient-pattern --key sajt --stance neutral --reason ...`.
Original ingredient data and raw CLI diagnostics remain intact. No code change or claim of allergen safety.

## Current complete proposal

`current/interfood/proposals/2026-W37-W38-review-3.md` with exact occurrence mapping in
`2026-W37-W38-selection-3.json` supersedes version 2. W37: 19,170 HUF / 10 main portions;
W38: 18,940 HUF / 10; combined: 38,110 HUF / 20, extras excluded. Breaded camembert is prominent
and full-sized; rare camembert risotto is not treated as equivalent historical affinity and is not doubled.
The pork-sausage potato casserole and candidate extras remain for owner review.

Public menu occurrences were freshly checked on September 2; account coverage is from the September 1
snapshot, not a newly verified account state. No cart/order mutation, checkout or payment occurred.

## Impact and verification

Repository-wide free-pattern sweep:
`rg -l -g '*.md' -g '!**/node_modules/**' -g '!**/dist/**' 'Owner-facing.*(table|review)|Owner-tábla|Interfood.*(ajánl|recommend)' .`
returned 9 files: SKILLS, previous review, principles, CLI runbook, three dated recommendation notes,
ranking subflow and flow README. Current contracts were updated; historical notes remain historical and
the previous proposal is marked superseded. Feature request, hyperplan and completion audit were additionally
updated through their dependency pointers. Immutable specifications were not edited.

Verification: parse the selection JSON; confirm two main portions per day and recomputed weekly totals;
check fresh-menu occurrence/date/portion identity and availability, fixed markers and no cheese milk warning;
read back the canonical preference and documentation changes. No code tests rerun: documentation/preferences
and proposal-only change, not a dietary-detector implementation. Preserve existing unrelated workspace edits.
