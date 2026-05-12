# STATUS_DEV — Development Agent állapot

```yaml
# Cycle state (KÖTELEZŐ SSoT)
cycle: 1                                  # Első cycle indul
phase: audit                               # idle | orient | cleanup-git | audit | collect-tasks | investigate | plan-package | implement | review | verify-local | update-docs | commit-push | close-cycle

phase_notes: |
  Cycle 1 — 01-cleanup-git kész: 15 pending change (5 mod + 10 new), 0 foreign.
  Mind chat-edit (workflow bootstrap + diary + stock + state init), action-log evidenciálja.
  Commit a 10-commit-push fázisban egy bootstrap commitban. Következő: 02-audit (typecheck/test baseline).

# Az utolsó BEFEJEZETT cycle metadata
last_cycle:
  cycle_id: null                           # null amíg az első cycle le nem fut
  phase_completed: null
  files_modified: []                       # cycle-ben módosított fájlok
  fr_status_changes: []                    # { frPath, fromStatus, toStatus }
  plan_steps_marked_done: []               # { planPath, stepRef }
  commit_sha: null
  build_status: null                       # success | failed | not-run
  test_status: null                        # success | failed | not-run

# 25. alapelv (persistencia-takeover) tracking
foreign_pending:
  first_seen_cycle: null
  files: []
  fingerprint: null
  cycles_persisted: 0

# Plan-folytatás tracking
active_plan:
  path: null                               # pl. __agent/plans/development-agent.plan.md
  current_step: null                       # plan-szelet hivatkozás
  steps_remaining: 0

# Backlog snapshot (a 03-collect-tasks frissíti)
backlog_snapshot:
  green_count: 0                           # 🟢 Most-fókusz sorok száma
  yellow_count: 0                          # 🟡 Második/harmadik hullám
  parked_count: 0                          # 🅿️ Parkolt
  last_checked: null                       # ISO timestamp

# Package (26. alapelv — related-cluster)
package:
  anchor_id: null
  cluster_ids: []
  cluster_area: null
  cluster_size_estimate: null              # cycle | plan | master-plan
  included_in_this_cycle: []
  deferred_to_plan: []
```

---

## Pointers

- **Workflow**: `__agent/WORKFLOW_DEV.md`
- **Fázis-fájlok**: `__agent/phases/dev/`
- **Event-handlerek**: `__agent/events/dev/`
- **Cycle archívum**: `__agent/log/cycles/`
