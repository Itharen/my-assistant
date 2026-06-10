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
| **#5** | Backlog 🟡 második hullám — **NEM blokkolt** chat-OK-ra | `__agent/triggers/development-agent-backlog.md` | `04-investigate` |
| **#5b** | **Safe-orthogonal munka** (test-coverage, doc-sync, refactor, spec-write, dead-code prune) | meglévő kódbázis | `04-investigate` → `06-implement` (kis cycle) |
| **#5c** | **Eszkaláció** — ha 2+ consecutive cycle no actionable green/yellow + safe-orth → USER_INPUT `[NEW]` `kind: instruction` `domain: dev` "Dev Agent waiting / what next?" + `AGENT_BUS` `[OPEN] To: chat` request | — | chat-felelős |
| **#6** | **Fallback** — TRUE no-op csak akkor, ha #3-#5c mind kimerült + escalation már ki van küldve | — | `13-close-cycle` "no-op", **max 1 consecutive** |

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

## Anti-stall szabály (KRITIKUS — 2026-05-16)

**A Dev Agent NEM AKADHAT MEG.** A `heartbeat → 7h várakozás → user-frusztráció`
minta tilos. Konkrét szabályok:

### "Green-light vár" NEM blokkoló — default-yes

- A 🟢 backlog tételek **ALAPÉRTELMEZETT zöld** — chat-OK csak akkor szükséges,
  ha a FR doc-ja vagy egy AGB explicit "GREEN-LIGHT vár"-t jelez
- A 🟡 backlog tételek **AUTONÓM indíthatóak**, ha:
  - Ortogonálisak az `active_plan`-nel és a `foreign_pending`-gel
  - LDP zöld marad
  - NEM master-plan / NEM Tier 3 (deploy / paid API / production release)
  - NEM workspace-szintű változtatás (Workflow alapelv 18 — scope-restriction)
- Saját interpretáció **TILOS** ("plan-scope user-OK alá tartozik" típusú
  óvatosság) — ha a workflow nem mond explicit blokkot, **HALADJ**

### Heartbeat-limit

- **Max 1 consecutive heartbeat-only cycle**. A 2. cycle-től kötelező:
  1. **Safe-orthogonal munka** (#5b): test-coverage bővítés, spec-fájl-írás
     hiányzó komponensekhez, doc-sync, dead-code prune, type-tightening
  2. **Eszkaláció** (#5c): ha a safe-orthogonal pool **is** kimerült (cycle-log-ban
     kifejtve, miért), `USER_INPUT.md [NEW]` + `AGENT_BUS [OPEN] To: chat`
     entry-vel — **NEM** csak heartbeat-elés

### Mit jelent a "safe-orthogonal kimerült"

A Dev Agent EXPLICITEN állítsa hogy próbálta:
- 3+ komponens / service / handler **spec-coverage**-e <80% → bővíthető
- meglévő doc-eltérések (FR-ek vs kód) → sync-elhető
- dead/unreachable code → audit + prune
- type-alias / interface tightening (any → specific)
- new principle vagy FR cross-link doc-ban

Ha mindegyik **bizonyíthatóan** ki van merítve → csak akkor `no-op`.

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
