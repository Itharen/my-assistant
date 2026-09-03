# Interfood journey catalog

These are serial, state-carrying business journeys. Unit/adapter specs remain additive and do not count as a
journey substitute.

| ID | Test file | Features crossed | Business outcome | Automated variants |
|---|---|---|---|---|
| `IF-J01` | `../interfood.journey-e2e.spec.ts` | current week → published weeks → menu requests → normalization | Stable IDs, dates, portions and nutrition reach the agent | full range; fewer published weeks; malformed schema |
| `IF-J02` | `../interfood.planning-journey-e2e.spec.ts` | normalized menu → identity preview → commit → fresh registry reload → change detection → ranking review | Known foods are reusable while changed/unidentified foods remain visible | new; dry preview; unchanged; changed fingerprint; absent upstream food ID; changed-identity penalty |
| `IF-J03` | `../interfood.account-journey-e2e.spec.ts` | authenticated pagination → persisted snapshot → fresh service resume → coverage + historical pattern derivation | Complete history preserves date, portion and quantity evidence and surfaces same-day doubles without auto-promoting preference | terminal pagination; small+full same day; quantity-two signal; missing day; persisted resume |
| `IF-J04` | `../interfood.planning-journey-e2e.spec.ts` | persisted preferences + history → Friday/Saturday delivery grouping → two-serving allocation + independent add-ons → likely-liked and nutrition-backed main alternatives → varied weekly selection | Owner decisions, fallback foods, allergy warnings, exact quantities, delivery-day semantics, preference exceptions, long-term affinity, recent repetition and measured main-meal alternatives materially alter recommendations | favorite quantity=2 only after prior exact usage; unseen favorite stays quantity one; two distinct foods; near-duplicate primary-family avoidance with completion fallback; main-alternative identity dedupe; complete-nutrition health lane; incomplete/allergy-warning exclusion; milk/cream warning with cheese/trace exception; fruit-soup type hard-reject; mislabeled cake/tejbegríz/mákosguba/diósmetélt and generic-category soup excluded from main coverage; exact add-on with 5+ history days remains confirmation candidate; only explicit exact-food favorite becomes add-on recommendation; add-on novelty suppressed; fallback-selected-only-without-better-option; food-name hard-reject; small/full portion rules; rule exception; Friday+Saturday merged pool; historical affinity; pairwise; multi-protein including wild boar; ingredient hard-reject; source precedence; protein variety; 7/14/28 quantity windows; custom windows |
| `IF-J05` | `../interfood.account-journey-e2e.spec.ts` | complete desired cart → reconcile → authoritative readback → diff → cleanup | The reversible draft converges exactly and can resume from authoritative state | multi-line quantities; removal; empty cleanup |
| `IF-J06` | `../interfood.account-journey-e2e.spec.ts` | order details → persisted immutable preview → fresh service resume → approval → apply → final readback | A financial change applies exactly once only after exact approval | success; owner decline/no apply; persisted resume |
| `IF-J07` | `../interfood.planning-journey-e2e.spec.ts` | component nutrition → completeness/health comparison → selection | Partial nutrition remains unknown rather than becoming zero | complete; incomplete; comparable alternative |

The provider adapters and failure branches are additionally covered by `../interfood.account-service.spec.ts` and
the focused API/normalizer/store specs. Live calibration has verified public menus, complete authenticated history,
cart/order safety reads and a non-mutating submitted-order financial preview. The synthetic journeys deliberately
use an in-memory authenticated transport so they are deterministic and cannot affect the owner's account.

IF-J04 correction variants also live in `../interfood.preference-corrections.spec.ts`: save explicit decisions →
reload from disk → rank normalized menus → assert two portions/actual occurrence/warning boundary → remove the
temporary store. They cover tolerated sour cream/yoghurt/curd/butter/cheese (including parenthetical milk), separately
added milk/cream, broad-family versus exact dislike, pasta/fruit-meat inflections, sweet derelye main-lane exclusion,
and real small rice portions with the full camembert exception. These extend, not replace, the original IF-J04.

The only remaining live release gate is the explicitly owner-approved reversible cart canary. A submitted-order
financial apply is a different operation and always needs its own fresh preview-hash approval.
