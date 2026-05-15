# STATUS_DEV — Development Agent állapot

```yaml
# Cycle state (KÖTELEZŐ SSoT)
cycle: 38                                 # Cycle 38 lezárva; következő cycle 39 lesz
phase: idle                                # idle | orient | cleanup-git | audit | collect-tasks | investigate | plan-package | implement | review | verify-local | update-docs | commit-push | close-cycle

phase_notes: |
  Cycle 38 lezárva 2026-05-15 12:10 — Dev Agent dispatcher smoke-test infra
  (commit c22c29f). sample-development-agent.json + smoke-dev script.
  Cycle 33+34 end-to-end validálva: actor=agent-dispatcher:development,
  development-agent-tick.json tickCounter 1->2, cron state érintetlen.
  LDP unchanged 11/11. Lásd log/cycles/cycle-38.md.

# Az utolsó BEFEJEZETT cycle metadata
last_cycle:
  cycle_id: 38
  phase_completed: close-cycle
  files_modified:
    - cli/scripts/agent-handlers/test/sample-development-agent.json   # ÚJ
    - cli/scripts/agent-handlers/package.json
    - cli/scripts/agent-handlers/README.md
    - __agent/STATUS_DEV.md
    - __agent/log/cycles/cycle-38.md
  fr_status_changes: []
  plan_steps_marked_done: []
  commit_sha: "c22c29f"
  build_status: success
  test_status: success                          # smoke-dev ✅ end-to-end, LDP 11/11

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
  cycles_persisted: 6                      # cycle 4/5/6/7/21/23 — Phase 3.2 cycle 7-ben takeover-elve. Maradék (Phase 5-6) chat-felelős, cycle 21+23 re-observed (no takeover).

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
