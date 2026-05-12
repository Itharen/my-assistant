# STATUS_DEV — Development Agent állapot

```yaml
# Cycle state (KÖTELEZŐ SSoT)
cycle: 2                                  # Cycle 2 lezárva; következő cycle 3 lesz
phase: idle                                # idle | orient | cleanup-git | audit | collect-tasks | investigate | plan-package | implement | review | verify-local | update-docs | commit-push | close-cycle

phase_notes: |
  Cycle 2 lezárva 2026-05-12 — workflow-extension (LDP/CDP/runtime priority).
  Commit efc4f28. 3 új event-handler + 03-collect-tasks priority table +
  02-audit pipeline-state placeholder + WORKFLOW_DEV event-tábla.
  Lásd log/cycles/cycle-2.md.

# Az utolsó BEFEJEZETT cycle metadata
last_cycle:
  cycle_id: 2
  phase_completed: close-cycle
  files_modified:
    - __agent/events/dev/on-ldp-fail.md
    - __agent/events/dev/on-cdp-fail.md
    - __agent/events/dev/on-runtime-error.md
    - __agent/phases/dev/02-audit.md
    - __agent/phases/dev/03-collect-tasks.md
    - __agent/WORKFLOW_DEV.md
    - __agent/STATUS_DEV.md
    - __agent/log/cycles/cycle-2.md
  fr_status_changes: []
  plan_steps_marked_done: []
  commit_sha: "efc4f28"
  build_status: success
  test_status: not-run                     # Q-package-1 továbbra is nyitva

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
