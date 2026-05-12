# Phase 03 — Collect tasks

> Candidate pool összeállítás priority-sorrendben.

## Forrás-sorrend (KRITIKUS)

> **User-OK 2026-05-12:** A `#0a / #0b / #0c` priority-szintek (LDP / CDP /
> runtime error) megelőznek **mindent mást**. Ezek "egészségi" jellegű
> javítások — a rendszer már él, valami benne hibás → fixálni kell
> mielőtt új feature-höz nyúlnánk.

| # | Priority | Forrás | Handler |
|---|---|---|---|
| **#0** | Failing build / test az audit-ban | `02-audit` output | `on-build-fail` / `on-test-fail` |
| **#0a** | **LDP error** (`dc ldp` watch-pipeline fail) | `cli/__agent/log/actions/*.jsonl` `actor:"ldp"` `kind:"error"` (Phase 2+) | `events/dev/on-ldp-fail.md` |
| **#0b** | **CDP error** (`dc cdp` / Overseer pipeline fail) | `fdp build-results` / GitHub Actions (Phase 2+) | `events/dev/on-cdp-fail.md` |
| **#0c** | **Runtime error** (server/client/cli futás közben) | `__agent/log/actions/<today>.jsonl` `kind:"error"` + server errors-table | `events/dev/on-runtime-error.md` |
| **#1** | Aktív plan-folytatás | `STATUS_DEV.active_plan` nem null | folytatás `05-plan-package`-ből |
| **#2** | USER_INPUT `[NEW]` `domain: dev` (interrupt) | `__agent/USER_INPUT.md` | `events/dev/on-user-input.md` |
| **#3** | Backlog 🟢 "Most-fókusz" | `__agent/triggers/development-agent-backlog.md` | `04-investigate` |
| **#4** | Pending FR Status: 🟢 Aktív | `current/feature-requests/*` | `04-investigate` |
| **#5** | Backlog 🟡 második hullám | `__agent/triggers/development-agent-backlog.md` | `04-investigate` |
| **#6** | **Fallback** — nincs candidate | — | `13-close-cycle` "no-op" |

## Phase 1 megjegyzés

`#0a` (LDP) és `#0b` (CDP) **Phase 2+** — a my-assistant projektben még
nincs `pipeline.config.json` / `pipeline.cicd.config.json` setup. Az
event-handler-ek készen állnak (lásd `events/dev/on-ldp-fail.md`,
`on-cdp-fail.md`), de **most no-op** ezekre a forrásokra.

`#0c` (runtime error) **Phase 1-ben aktív** az action-log-on át —
`__agent/log/actions/<today>.jsonl` `kind:"error"` entries adják a forrást.

## Mit csinálj

1. **`#0a/0b/0c` health-check FIRST** (Phase 2 LDP/CDP, Phase 1 runtime):
   - Runtime error scan: `grep '"kind":"error"' __agent/log/actions/<today>.jsonl`
   - Phase 2: `dc ldp` state-check + `fdp build-results --project my-assistant`
   - Ha találat → ugrás megfelelő event-handler-re, **ne** folytasd a candidate-collect-et
2. Olvasd be a backlog-fájlt
3. Listázd a `current/feature-requests/*` fájlokat amelyekben `Status: 🟢`
4. USER_INPUT `[NEW]` `domain: dev` blokkok
5. STATUS_DEV `active_plan` ha van

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
