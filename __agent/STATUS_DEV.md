# STATUS_DEV — Development Agent állapot

```yaml
# Cycle state (KÖTELEZŐ SSoT)
cycle: 44                                 # Cycle 44 lezárva; következő cycle 45 lesz
phase: idle                                # idle | orient | cleanup-git | audit | collect-tasks | investigate | plan-package | invokes | implement | review | verify-local | update-docs | commit-push | close-cycle

phase_notes: |
  Cycle 44 lezárva 2026-05-16 02:30 — AGB-01 task B (Maya UI diag) shipped.
  Findings AGB-03 announcement. Root cause: AUTH BLOCKER + PASSIVE error
  interceptor + SPA fallback collateral. Diag-only, no code change.
  Commit 87a8fbe. AGB-01 task A (#3b runtime-error-api) + AGB-02 (Wave UI)
  pending (AUTH ad-hoc fix kell előbb). LDP unchanged 11/11.
  Lásd log/cycles/cycle-44.md + AGB-2026-05-16-03.

# Az utolsó BEFEJEZETT cycle metadata
last_cycle:
  cycle_id: 44
  phase_completed: close-cycle
  files_modified:
    - __agent/AGENT_BUS.md
    - __agent/STATUS_DEV.md
    - __agent/log/cycles/cycle-44.md
  fr_status_changes: []
  plan_steps_marked_done: []                    # diag-only AGB-01 task B
  commit_sha: "87a8fbe"
  build_status: success
  test_status: success                          # LDP unchanged 11/11 (no code change)

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
  cycles_persisted: 8                      # cycle 4/5/6/7/21/23/35/39 — chat ESM-mig Phase 5-6 marad pending. AGB-2026-05-15-03 escalation chat-nek (no autonomous takeover per STATUS note).

# Plan-folytatás tracking
active_plan:
  path: __agent/plans/ssot-server-esm-migration.plan.md   # chat-led, dev-agent takeover-elte Phase 3.2 + Phase 6 LDP-fix-eit
  current_step: "Phase 5-6 functional finalization + Phase 1-4 cleanup"   # build/lint zold; runtime + OAuth callback még user-akció
  steps_remaining: 2                                      # Phase 5 (controllers tényleges) + Phase 6 (UI functional) — chat felelős

# Backlog snapshot (a 03-collect-tasks frissíti)
backlog_snapshot:
  green_count: 6                           # 🟢 Most-fókusz sorok száma (FR #1-3d)
  yellow_count: 15                         # 🟡 Második/harmadik hullám (+7g entertainment-integration cycle 20)
  parked_count: 9                          # 🅿️ Parkolt
  last_checked: "2026-05-13T09:05+02:00"   # M1 grooming cycle 20

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
