# Interfood Friday/Saturday and fallback planning — 2026-09-01

Owner calibration corrected four planning assumptions: camembert and chicken-paprikash-like meals use full
portions; fish sticks are a fallback rather than a favorite; rakott burgonya is strongly liked; and tofu/peanut are
acceptable. The recent Thai chicken/rice-noodle experience was negative, so that named family is demoted without
inventing a blanket tofu, peanut or rice-noodle rejection.

The earlier mashed-potato exception is now executable as `burgonyapüré=>full`; otherwise the price tie-break could
still select the small occurrence despite the owner saying that portion reduction does not apply there.

The planner now models the provider's delivery semantics: Saturday menu occurrences are delivered Friday and join
Friday's candidate pool. It emits one Friday plan, lists all contributing upstream `sourceDates`, and preserves the
selected occurrence's original `menuDate` and ID for cart operations, including compact output. A new `fallback`
stance gives a strong non-rejecting demotion. IF-J04 now proves both fallback behavior and a cross-date
Friday/Saturday choice.

Canonical writeback: `current/interfood/preferences.json`,
`current/principles/interfood-food-preferences.md`, the ordering flow, CLI runbook, `SKILLS.md`, journey catalogue,
Hyperplan and completion audit.

Final verification closed with two consecutive full green runs: 229 specs, zero failures (random seeds 31918 and
24864).

Follow-up owner correction: every delivery day needs two portions. The planner and coverage defaults are now two;
recommendations carry exact quantity. Normally two distinct foods are selected, while an explicit favorite may use
one occurrence with quantity two. Small/full variants cannot fill the two slots. Variety is day-aware and capped so
the doubled daily requirement does not promote weak meals merely because the preferred protein appeared earlier.
