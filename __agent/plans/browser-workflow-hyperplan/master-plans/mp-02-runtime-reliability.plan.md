# MP-02 — Runtime Reliability Core

**Status:** verified · **Progress:** 3/3 · **Depends on:** MP-01

## Cél

A browser-runtime működése explicit state machine, evidence-alapú postcondition, idempotens effect és
checkpoint/resume köré épüljön; a bootstrap és session-hibák diagnosztizálhatóan gyógyuljanak.

## Subplanek

- [SP-02.1](../subplans/sp-02-1-bootstrap-session-health.plan.md) — bootstrap/session/health
- [SP-02.2](../subplans/sp-02-2-state-machine-idempotency.plan.md) — state machine/idempotency
- [SP-02.3](../subplans/sp-02-3-checkpoint-recovery-evidence.plan.md) — checkpoint/recovery/evidence

## Acceptance

- [x] Semmilyen action nem fut precondition nélkül és nem lesz success postcondition nélkül.
- [x] Ismételt effect ugyanazzal az `effectId`-val nem dupláz.
- [x] Crash/reconnect után a run pontosan az utolsó verified checkpointtól folytatódik.
- [x] Több agent versenyénél lease/mutex védi a profilt és a globális OS-input csatornát.

**Evidence:** `server/src/runtime/`, `test/contract.spec.ts`, J-001/J-005/J-008.
