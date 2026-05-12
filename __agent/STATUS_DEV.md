# STATUS_DEV — Development Agent állapot

```yaml
# Cycle state (KÖTELEZŐ SSoT)
cycle: 12                                 # Cycle 12 lezárva; következő cycle 13 lesz
phase: idle                                # idle | orient | cleanup-git | audit | collect-tasks | investigate | plan-package | implement | review | verify-local | update-docs | commit-push | close-cycle

phase_notes: |
  Cycle 12 lezárva 2026-05-12 — postPipelineCommand server runtime ESM fix
  (start-prod → tsx forrás-futtatás) + M1 grooming (backlog_snapshot + active_plan
  mezők). Commit ed0b1f5. LDP várt: 10/10 step ✅ + postPipeline ✅.
  Lásd log/cycles/cycle-12.md.

# Az utolsó BEFEJEZETT cycle metadata
last_cycle:
  cycle_id: 12
  phase_completed: close-cycle
  files_modified:
    - server/package.json
    - __agent/STATUS_DEV.md
    - __agent/log/cycles/cycle-12.md
  fr_status_changes: []
  plan_steps_marked_done: []
  commit_sha: "ed0b1f5"
  build_status: success
  test_status: success                     # LDP 10/10 + start-prod no ESM error

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
  path: __agent/plans/ssot-server-esm-migration.plan.md   # chat-led, dev-agent takeover-elte Phase 3.2 + Phase 6 LDP-fix-eit
  current_step: "Phase 5-6 functional finalization + Phase 1-4 cleanup"   # build/lint zold; runtime + OAuth callback még user-akció
  steps_remaining: 2                                      # Phase 5 (controllers tényleges) + Phase 6 (UI functional) — chat felelős

# Backlog snapshot (a 03-collect-tasks frissíti)
backlog_snapshot:
  green_count: 6                           # 🟢 Most-fókusz sorok száma (FR #1-3d)
  yellow_count: 13                         # 🟡 Második/harmadik hullám
  parked_count: 9                          # 🅿️ Parkolt
  last_checked: "2026-05-12T23:20+02:00"   # M1 grooming cycle 12

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
