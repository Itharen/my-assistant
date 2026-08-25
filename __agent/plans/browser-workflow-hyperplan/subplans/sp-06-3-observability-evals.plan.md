# SP-06.3 — Observability & evals

**Status:** verified
**Evidence:** correlated JSONL action log, metrics summary, repeated-error fixture clustering and tuning eval.

## Munka

- Metrics: success/postcondition rate, retry, resume, traversal completeness, duplicate prevention, approval latency.
- Error taxonomy + redacted evidence bundle + site/profile/contract version dimensions.
- Eval corpus: product matching, selector/role fallback, pagination decisions és stop-reason correctness.

## Acceptance

- [ ] Egy run minden rétegen `runId/requestId/effectId` alapján trace-elhető.
- [ ] SLO breach konkrét failure-clustert és fixture-kandidátust ad.
- [ ] Tuning előtt/után eval-delta mérhető.
