# MP-07 — Rollout, Tuning & Certification

**Status:** in-progress · **Progress:** 2/3 · **Depends on:** MP-05, MP-06

**Evidence:** redacted tuning corpus + versioned replay/canary promotion tests green; stage-3 dedicated write
acceptance és két változatlan-candidate full verify passz zöld. Final ledger SP-05.3 után zárható.

## Cél

Staged rollouttal kockázat nélkül aktiválni a Tesco és későbbi site-workflow-kat, majd failure-corpus és
site-profile promotion segítségével folyamatosan hangolni és két tiszta teljes pass-szal certifikálni.

## Subplanek

- [SP-07.1](../subplans/sp-07-1-staged-rollout.plan.md) — shadow/dry-run/supervised rollout
- [SP-07.2](../subplans/sp-07-2-tuning-profile-lifecycle.plan.md) — tuning/profile lifecycle
- [SP-07.3](../subplans/sp-07-3-certification-two-clean-passes.plan.md) — certification/two clean passes

## Acceptance

- [x] Write-képesség csak green read-only és dry-run evidence után aktiválódik.
- [x] Minden tuning-változás corpus replay + canary után promotálható.
- [ ] Hyperplan csak két egymást követő 0-hibás full re-verification után kész.
