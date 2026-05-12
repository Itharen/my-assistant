# STATUS_DEV — Development Agent állapot

```yaml
# Cycle state (KÖTELEZŐ SSoT)
cycle: 7                                  # Cycle 7 lezárva; következő cycle 8 lesz
phase: idle                                # idle | orient | cleanup-git | audit | collect-tasks | investigate | plan-package | implement | review | verify-local | update-docs | commit-push | close-cycle

phase_notes: |
  Cycle 7 lezárva 2026-05-12 — LDP tsc-cli TS5011 fix (cli/tsconfig.json rootDirs +
  cli/bin/ma.js path update). Foreign-pending takeover authorized (cycles_persisted: 3).
  Commit 3d22143. CLI tsc (emit) + jasmine + smoke mind zöld.
  Lásd log/cycles/cycle-7.md.

# Az utolsó BEFEJEZETT cycle metadata
last_cycle:
  cycle_id: 7
  phase_completed: close-cycle
  files_modified:
    - cli/tsconfig.json
    - cli/bin/ma.js
    - __agent/log/cycles/cycle-7.md
  fr_status_changes: []
  plan_steps_marked_done:
    - { planPath: __agent/plans/ssot-server-esm-migration.plan.md, stepRef: "Phase 3.2 (CLI type-extraction emit fix)" }
  commit_sha: "3d22143"
  build_status: success
  test_status: success                     # CLI 21 spec, jasmine zöld; smoke ma --help OK

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
  cycles_persisted: 4                      # cycle 4/5/6/7 — Phase 3.2 cycle 7-ben takeover-elve. Maradék (Phase 5-6) még chat-felelős.

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
