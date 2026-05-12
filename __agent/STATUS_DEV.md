# STATUS_DEV — Development Agent állapot

```yaml
# Cycle state (KÖTELEZŐ SSoT)
cycle: 1                                  # Cycle 1 lezárva; következő cycle 2 lesz
phase: idle                                # idle | orient | cleanup-git | audit | collect-tasks | investigate | plan-package | implement | review | verify-local | update-docs | commit-push | close-cycle

phase_notes: |
  Cycle 1 lezárva 2026-05-12T17:48+02:00 — bootstrap commit (4d4504c) +
  client typecheck baseline-fix (a-server.api-service.spec.ts Observable→Promise).
  Build zöld, test skipped (pnpm package-issue). Lásd log/cycles/cycle-1.md.

# Az utolsó BEFEJEZETT cycle metadata
last_cycle:
  cycle_id: 1
  phase_completed: close-cycle
  files_modified:
    - client/src/app/_services/api-services/a-server.api-service.spec.ts
    - __agent/STATUS_DEV.md
    - __agent/state/development-agent-tick.json
    - __agent/log/actions/2026-05-12.jsonl
    - __agent/log/cycles/cycle-1.md
  fr_status_changes: []
  plan_steps_marked_done: []
  commit_sha: "4d4504c"
  build_status: success
  test_status: not-run                     # pnpm install protobufjs@7.5.7 ERR_PNPM_IGNORED_BUILDS

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
