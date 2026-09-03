# Interfood owner corrections, exact dairy boundary and daily review — 2026-09-02

## Decisions and source of truth

Canonical full owner rules: `current/principles/interfood-food-preferences.md`; persisted explicit decisions:
`current/interfood/preferences.json` (written through the preference CLI). Only milk and cream are avoid items.
Sour cream, yoghurt, curd, butter and cheese are tolerated. The prior broad dairy filter was an agent mistake,
not an owner restriction. Its historical development note is visibly marked superseded; no historical rule was
silently erased. Independently added milk/cream remains warned, even in an otherwise tolerated cheesy meal.

Other additive corrections: exact pulled-chicken BBQ tortilla dislike; brassói/vadas dislike (not all game meat);
less pasta; potatoes preferred; small rice/rice-risotto trials with existing full-portion exceptions; fruit with
meat disliked, not berry sauce with cheese. Owner tables have one row/day, stacked mains and extras below them,
alternatives in the same table, and no technical IDs in user-facing output.

## Implementation and regressions

- Preference entries were written sequentially with `preference set` and `preference portion` and reloaded.
- The milk/cream detector no longer broadens into other dairy. Parenthetical declarations inside tolerated dairy
  do not create standalone milk/cream matches. Separate milk or cream still produces a prominent warning.
- Main ranking uses rejection/warning/negative-preference tiers ahead of numeric scores. Family variety stays in
  the non-negative pool when it can supply the daily target. Exact dislikes cannot be canceled by broad positives.
- Pasta and fruit-meat facets preserve the tortilla/cheese exceptions. Regression tests exposed Hungarian
  inflections `tésztával`, `rizzsel`, `ananásszal`; these are now recognized. Sweet plum derelye is excluded from
  main lanes and handled by the sparse dessert rule.
- Four persisted correction journeys cross save/reload, menu normalization and business selection/warnings,
  then delete their temporary directories. They extend IF-J04, not replace its other variants or feature tests.

## Reproduce the review

From the project root, use `node cli/dist/cli/src/main.js interfood` (or installed `ma interfood`) with:

1. `preference list --pretty` to read the canonical local state.
2. `weeks --pretty` for provider-enabled current/future weeks.
3. `orders coverage --year 2026 --week 36 --expected-per-day 2 --pretty`, repeated for W37/W38. Coverage reads the
   persisted account snapshot, so always inspect `syncedAt`; it does NOT prove a fresh account sync.
4. `plan week --year 2026 --week 37 --meals-per-day 2 --health-mode balanced --summary --pretty`, repeated for W38.
5. `menu --year 2026 --week 37` (and W38) for exact occurrence/ingredient/portion checks when needed.

Review is not a cart mutation. Before any later order operation, refresh the account snapshot, resolve current
occurrences/prices, and follow the existing cart/readback and preview/approval boundaries.

## Live evidence and owner-facing artifact

- Enabled current/future: W36/W37/W38; W39 disabled. Coverage snapshot is explicitly dated
  `2026-09-01T06:19:06.968Z`: W36 covered, W37/W38 not covered. No fresh-sync claim.
- W38 sour-cream-only Székelykáposztával rakott burgonya and Csirkemell rácosan are restored, and are different foods.
- W37 rántott camembert with potatoes lists standalone milk, not just cheese. Frankfurti soup lists cream.
  Tiramisu lists milk powder. None is selected. Trace-only text is not a standalone ingredient match, but its
  tolerability was not confirmed by the owner and is not represented as medical clearance.
- Owner review: `current/interfood/proposals/2026-W37-W38-review.md`; exact machine identity mapping:
  `current/interfood/proposals/2026-W37-W38-selection.json`. The prior proposal is marked superseded.
- W37 reviewed main total 18,900 HUF / 10 portions; W38 19,070 HUF / 10 portions. Every day is exactly two.
  Lúdláb and bean soup remain conditional confirmation candidates, visibly below mains and excluded from totals.
- Known review limitation: the old literal `thai csirke` preference misses intervening adjectives in
  `Thai csípős kesudiós csirkemellragu`. The reviewer applied the already-confirmed Thai-chicken preference and
  substituted the published small Caesar salad on W37 Tuesday. This override is explicit in the selection JSON;
  raw planner output is not an approved order. Do not infer a new favorite or a blanket Thai/tofu dislike.

## Verification and documentation impact

Build/typecheck and 238 specs passed with seed 45747 after all code changes (earlier green seed 53134 was before
the parenthetical/fruit-inflection refinements). Initial failing regressions exposed the inflection bugs rather
than being weakened. Final clean review/test evidence is appended below after the closing checks.

Updated active rule/principles, preference data, flow, runbook, SKILLS, feature-request decisions, journey catalogue,
Hyperplan/audit, proposal and historical stale banners. Impact search found obsolete broad-dairy/per-food-row claims
only in explicitly superseded historical notes. FAM is a recall pointer; versioned documents remain authoritative.

Operational pitfall: nested `orders coverage --help` is not supported by the current CLI parser. Use the documented
runbook command contract; the rejected help invocation did not mutate account state.

## Closing review evidence

- Final regression run: 238 specs, zero failures, seed 48396; preceding post-code-change run was seed 45747.
- Clean review pass 1: inspected dairy matching (including standalone milk after tolerated parentheticals),
  preference-tier allocation, four state-carrying correction journeys, live ingredients and the reviewed selection.
  No additional defect in the delivered correction; the literal Thai-pattern limitation is explicitly preserved.
- Clean review pass 2: independently checked ten daily rows, exactly two units/day, totals 18,900/19,070 HUF,
  absence of user-facing IDs and direct-ingredient warnings on selected mains, actual small-portion identities,
  conditional extra visibility, source freshness and active-document consistency. No further finding.
- `git diff --check` passed (existing LF/CRLF notices only). Unrelated worktree changes were left untouched.
- FAM decision pointer updated and read back successfully. No cart/order mutation and no capability-release claim
  beyond this preference/review correction; the existing owner-approved live canary gate remains pending.
