# STATUS_DEV — Development Agent állapot

```yaml
# Cycle state (KÖTELEZŐ SSoT)
cycle: 28                                 # Cycle 28 lezárva; következő cycle 29 lesz
phase: idle                                # idle | orient | cleanup-git | audit | collect-tasks | investigate | plan-package | implement | review | verify-local | update-docs | commit-push | close-cycle

phase_notes: |
  Cycle 28 lezárva 2026-05-14 08:00 — error-handling cleanup Phase 3 SHIPPED
  (google/spotify 3 swallow). safe-call helper áthelyezve cast/internal →
  utils. Teljes 18 swallow eltüntetve a cli/-ből (Phase 1+2+3). LDP 10/10 ✅,
  cli-test 26/26 változatlan. AGB-03 announcement chat-nek. Phase 4 (server
  FR #3b) külön plan + green-light. Lásd log/cycles/cycle-28.md.

# Az utolsó BEFEJEZETT cycle metadata
last_cycle:
  cycle_id: 28
  phase_completed: close-cycle
  files_modified:
    - cli/src/utils/safe-call.ts                # áthelyezve cast/internal-ből
    - cli/src/cast/cast-client.ts               # safe-call import path update
    - cli/src/cast/volume.ts
    - cli/src/cast/discover.ts
    - cli/src/cast/tts.ts
    - cli/src/google/google-assistant.client.ts
    - cli/src/spotify/spotify.client.ts
    - __agent/AGENT_BUS.md
    - __agent/STATUS_DEV.md
    - __agent/log/cycles/cycle-28.md
  fr_status_changes: []
  plan_steps_marked_done:
    - { planPath: "__agent/plans/error-handling-cleanup.plan.md", stepRef: "Phase 3 — google/spotify swallow (3 helyen) + helper áthelyezés" }
  commit_sha: "6b5c53c"
  build_status: success
  test_status: success                      # cli=26/26 (változatlan), server=2/2, client=13/13

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
