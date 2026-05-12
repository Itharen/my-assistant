# STATUS_DEV — Development Agent állapot

```yaml
# Cycle state (KÖTELEZŐ SSoT)
cycle: 3                                  # Cycle 3 lezárva; következő cycle 4 lesz
phase: idle                                # idle | orient | cleanup-git | audit | collect-tasks | investigate | plan-package | implement | review | verify-local | update-docs | commit-push | close-cycle

phase_notes: |
  Cycle 3 lezárva 2026-05-12 — Q-package-1 (protobufjs pnpm build-script approval) fix.
  Commit 0f3c7a1. cli/pnpm-workspace.yaml + cli/README setup doc. CLI pnpm test
  now green (21 specs). Új blocker: Q-package-2 (@futdevpro/ngx-dynamo-models 404 server-en).
  Lásd log/cycles/cycle-3.md.

# Az utolsó BEFEJEZETT cycle metadata
last_cycle:
  cycle_id: 3
  phase_completed: close-cycle
  files_modified:
    - cli/pnpm-workspace.yaml
    - cli/README.md
    - current/open-questions.md
    - __agent/STATUS_DEV.md
    - __agent/log/cycles/cycle-3.md
  fr_status_changes: []
  plan_steps_marked_done: []
  commit_sha: "0f3c7a1"
  build_status: success
  test_status: success                     # CLI 21 specs, 0 failures (server/client skip)

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
