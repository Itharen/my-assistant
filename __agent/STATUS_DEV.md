# STATUS_DEV — Development Agent állapot

```yaml
# Cycle state (KÖTELEZŐ SSoT)
cycle: 4                                  # Cycle 4 lezárva; következő cycle 5 lesz
phase: idle                                # idle | orient | cleanup-git | audit | collect-tasks | investigate | plan-package | implement | review | verify-local | update-docs | commit-push | close-cycle

phase_notes: |
  Cycle 4 lezárva 2026-05-12 — LDP #0a fix: server-test "No specs" (spec_dir
  build mismatch + placeholder spec) + client-test NG0304 (CUSTOM_ELEMENTS_SCHEMA).
  Commit 576912a. CLI 21 / Server 2 / Client 13 spec mind zöld.
  Lásd log/cycles/cycle-4.md. Foreign pending: chat (#5) ESM migration plan in-progress (rögzítve).

# Az utolsó BEFEJEZETT cycle metadata
last_cycle:
  cycle_id: 4
  phase_completed: close-cycle
  files_modified:
    - server/spec/support/jasmine.json
    - server/src/app.server.spec.ts
    - client/src/app/app.component.spec.ts
    - pnpm-workspace.yaml
    - __agent/log/cycles/cycle-4.md
  fr_status_changes: []
  plan_steps_marked_done: []
  commit_sha: "576912a"
  build_status: success
  test_status: success                     # CLI 21, Server 2, Client 13 — mind zöld

foreign_pending:
  first_seen_cycle: 4
  files:
    - __agent/plans/ssot-server-esm-migration.plan.md
    - server/tsconfig.json (mod)
    - server/package.json (mod, also auto-modified during commit)
    - server/src/app.server.ts (mod)
    - server/src/_models/interfaces/ (new dir)
    - cli/src/google/google-assistant.client.ts (mod)
    - cli/src/spotify/spotify.client.ts (mod)
    - cli/tsconfig.json (mod)
    - client/tsconfig.json (mod)
  fingerprint: "chat-esm-migration-in-progress-2026-05-12"
  cycles_persisted: 1

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
