# USER-INPUT.md — my-assistant (projekt-specifikus)

> Projekt-specifikus user-direktívák archívuma. A cross-rendszer/global direktívák a
> `documentations/USER-INPUT.md`-ben (NagyGlobál). Pattern: lásd a global USER-INPUT.md fejlécét.

---

### [REQUIREMENT] (UI-my-assistant-E2E-FEATURE)  ❌

  priority: high
  source: user 2026-06-10/11 (global UI-20260610-001 unified-rollout + UI-20260611-001 CWV-mandatory leképezése)
  area: testing/e2e/feature-coverage
  scope: project (my-assistant)
  linked-policy-doc: documentations/guidelines/development/e2e-three-layer-architecture.md
  details: Ebben a projektben meg kell írni az ÁTFOGÓ end-to-end FEATURE teszteket — NEM csak smoke-ot. Az "X% e2e coverage" = a feature-ök X%-a (a főbb feature-ök nagy része) ② feature-E2E-vel lefedve, és KÖTELEZŐ a kompozíció + edge-case + variáns-kimenet (doctrine §2b). Frontend esetén a ③ CWV is kötelező (UI-20260611-001).

> [user, globálisan minden projektre] "Az end-to-end tesztek nem csak smoke-teszteket jelentenek, hanem teljes feature teszteket. Ha egy user input 75%-os end-to-end lefedettséget kér, az azt jelenti, hogy a feature-ök 75%-a, a főbb feature-ök nagy része legyen lefedve end-to-end testekkel. Kompozícióra és edge-case-re és variáns kimenetre is gondolnunk kell. Minden frontend-LIVE e2e-jébe a CWV ③ réteg kötelező."

**Hivatkozás (visszakövethetőség):**
- Rollout-terv: `documentations/plans/e2e-3layer-rollout/` — HYPERPLAN, `subs/SUB-my-assistant.md` (§2 kritikus-journey lista: fő flow + kompozíció + edge + variáns), DISPATCH, AUDIT, BEDROCK-FRS, PROGRESS (napló).
- Doctrine: `documentations/guidelines/development/e2e-three-layer-architecture.md` (§2b coverage-szemantika) + `e2e-foundation-standard.md` + `e2e-three-layer-rollout-checklist.md`.
- Foundation (élő): `@futdevpro/dynamo-e2e@1.17.x` (FDP_StandardFormSuite_Generator) + `@futdevpro/fdp-e2e-helpers@1.15.33` (FDPLoginFlowHelper + FDP_FormCatalog + CWV).

**Státusz:** ❌ open — az ① smoke (+ ahol kész a ③ CWV) megvan/folyamatban; a ② ÁTFOGÓ feature-coverage (kompozíció/edge/variáns) hátravan.
