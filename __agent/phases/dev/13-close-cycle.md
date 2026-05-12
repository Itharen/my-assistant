# Phase 13 — Close cycle

> Cycle archív + STATUS_DEV reset idle-re.

> Megjegyzés: a CCAP-minta `11-cicd-check` + `12-verify-test-env`
> fázisai a my-assistant Phase 1-ben még NEM relevánsak (nincs pipeline,
> nincs staging). Ezért közvetlenül `10-commit-push` → `13-close-cycle`.

## Mit csinálj

1. **Cycle log írás:** `__agent/log/cycles/cycle-<N>.md`
   - Cycle szám + datum + branch + commit-sha
   - Mit csináltunk (összefoglaló 5-10 sor)
   - FR-status változások
   - Plan-step done
   - Build/test eredmény
   - Open kérdések / blocker-ek (ha van)

2. **STATUS_DEV reset:**
   ```yaml
   cycle: N (megmarad)
   phase: idle
   phase_notes: |
     Cycle N lezárva — <1-mondat összefoglaló>.
   last_cycle:
     cycle_id: N
     phase_completed: close-cycle
     # files_modified, fr_status_changes, plan_steps_marked_done, commit_sha, build/test_status megmarad
   active_plan:
     # ha plan-step volt: steps_remaining csökken; ha 0 → active_plan.path = null
   ```

3. **Action-log:**
   ```json
   { "kind": "flow-end",
     "summary": "Cycle N close — sha=..., FR-shipped: X, build+test zöld",
     "extra": { "cycle": N, "commit": "...", "stats": {...} } }
   ```

4. **Maintenance trigger ellenőrzés:**
   - 10-enkénti cycle? → `phases/dev/maintenance-grooming.md` a következő cycle elején
   - Új naptári nap óta nem volt daily-report? → `phases/dev/maintenance-daily-report.md`

## Output

A cycle most lezárt. A következő tickkor a `00-orient`-ből indul újra.

## Kilépés

`STATUS_DEV.phase` → `idle`
