# Phase 03 — Collect tasks

> Candidate pool összeállítás priority-sorrendben.

## Forrás-sorrend (KRITIKUS)

1. **Failing build / test az audit-ban** (#0 priority)
2. **Aktív plan-folytatás** (`STATUS_DEV.active_plan` nem null)
3. **USER_INPUT `[NEW]` `domain: dev` blokkok** (interrupt)
4. **Backlog 🟢 "Most-fókusz"** sorok (`__agent/triggers/development-agent-backlog.md`)
5. **Pending FR Status: 🟢 Aktív** állományok `current/feature-requests/`-ben
6. **Backlog 🟡 második hullám**
7. **Fallback**: nincs candidate → 13-close-cycle "no-op"

## Mit csinálj

1. Olvasd be a backlog-fájlt
2. Listázd a `current/feature-requests/*` fájlokat amelyekben `Status: 🟢`
3. USER_INPUT `[NEW]` `domain: dev` blokkok
4. STATUS_DEV `active_plan` ha van

## Candidate-pool kialakítása

- **Egy cycle = 1-5 task** (Related-cluster — 26. alapelv: kapcsolódó
  tételek bundle-ölve)
- Anchor task + cluster-scan azonos `area` / érintett kódbázis-rész
- Cycle-méret túl nagy → `05-plan-package` B mód (plan-doc)

## STATUS_DEV update

```yaml
backlog_snapshot:
  green_count: N
  yellow_count: M
  parked_count: K
  last_checked: ISO

package:
  anchor_id: <FR-name vagy task-id>
  cluster_ids: [...]
  cluster_area: cli|server|client|workflow
  cluster_size_estimate: cycle | plan | master-plan
```

## Action-log emit

```json
{ "kind": "decision", "summary": "Collect-tasks: N candidate, anchor=X, area=Y" }
```

## Kilépés

`STATUS_DEV.phase` → `investigate`
