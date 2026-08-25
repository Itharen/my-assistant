# MP-06 — E2E, Evals & Observability

**Status:** verified · **Progress:** 3/3 · **Depends on:** MP-02..05

**Evidence:** 40 feature tests + 13 journey tests, bidirectional catalog, metrics/failure clustering, canonical
runbook contract és 34-line dedicated live write audit zöld.

## Cél

Feature-katalógus, cross-feature journey-k, controlled fixture-ek, live read-only canary és mérhető
reliability SLO bizonyítsa a rendszert; teszt-darabszám önmagában nem coverage.

## Subplanek

- [SP-06.1](../subplans/sp-06-1-fixtures-feature-e2e.plan.md) — fixtures + feature-E2E
- [SP-06.2](../subplans/sp-06-2-user-journeys-live-canary.plan.md) — user journeys + live canary
- [SP-06.3](../subplans/sp-06-3-observability-evals.plan.md) — observability + evals

## Acceptance

- [x] Feature↔journey traceability mindkét irányban teljes.
- [x] Pagination/session/drift/partial/approval + Tesco optimistic-write/unknown-quantity variánsok automaták.
- [x] Reliability dashboard run/effect/postcondition/tuning metrikákat ad.
