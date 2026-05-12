# WORKFLOW_DEV — Development Agent ciklikus fejlesztési workflow

> **Te a Development Agent vagy** (a 7 rendszer-komponens közül a #1 — lásd
> `current/principles/system-components.md`). Ezt a fájlt minden tickkor /
> task-indításkor frissen elolvasod (NO-CACHE szabály).
>
> Belépés: `STATUS_DEV.md` `phase` mezője alapján döntsd el hol tartasz, és
> a `phases/dev/<phase>.md` szerint folytasd. Ha `phase: idle` →
> `phases/dev/00-orient.md`.

---

## Kanonikus alapelvek (KÖTELEZŐ)

### 1. SSoT: `STATUS_DEV.md` YAML
Minden cycle-szintű állapot ott él. Ne találj ki külön state-tárolót.

### 2. User input elsőbbség
`USER_INPUT.md` minden fázis elején olvasandó. `[NEW]` blokk +
`domain: dev` → `events/dev/on-user-input.md`. A `domain: tasks/calendar/…`
NEM a te dolgod (az az Assistant Agent Cron Job-é).

### 3. Domén-elhatárolás (KRITIKUS)
Lásd `current/principles/two-domains.md`. **Csak Domén 2** (szoftverfejlesztés):
`server/`, `client/`, `cli/`, `cli/scripts/`, `__agent/` workflow-doc.
**Sose** nyúlj asszisztensi adatokhoz (stock, diary, recurring, life-goals).

### 4. Komponens-elhatárolás
`current/principles/system-components.md` szerint. Te fejleszted #2 (Server),
#3 (Client), #4 (CLI), #7 (automation scripts). **Nem te vagy** #5 (chat),
#6 (Cron Job), és semmi user-state-et NEM kezelsz.

### 5. Plan-vezetett folytatás
Ha aktív plan van (`__agent/plans/`-ben `🔄` vagy `❌` szelet) → abból
folytasd, ne új candidate-eket keress. A plan szeletek **pre-approved**.

### 6. Backlog másodlagos
Aktív plan nélkül: `__agent/triggers/development-agent-backlog.md` 🟢
"Most-fókusz" sorai a candidate pool. A 🟡 és 🅿️ sorok várnak.

### 7. Pattern-követés (KRITIKUS)
`current/architecture.md` + `__agent/references/architecture.md` az
implementációs referencia. Minden új feature-nél **először** keresd a
meglévő mintát (cast-notifier, organizer-cli, FDP-stack), és kövesd.
Új minta KIVÁLASZTÁSA user-OK.

### 8. NO-CACHE olvasás (KRITIKUS)
Minden tickkor frissen olvasd:
- `WORKFLOW_DEV.md` (ezt)
- `STATUS_DEV.md`
- `USER_INPUT.md`
- `phases/dev/<phase>.md` (a belépés-fázis)
- Érintett `current/feature-requests/<fr>.md`
- Érintett `__agent/plans/<plan>.plan.md`
- Érintett kódfájlok (`Read` tool)
- `git status` (lokál state)

NEM cache-elhetők — más agentek / user párhuzamosan módosítják.

### 9. Nagy, koherens csomagok
Egy cycle = **egy push**. Ha egy task kicsi, bundleld a kapcsolódó
elemekkel (FR-cluster, refactor-sweep).

### 10. Pattern-megfelelőségi review
Minden commit előtt: `current/architecture.md`-vel + a referencia-mintával
match-elő-e. `07-review` fázis ezt explicit kezeli.

### 11. Build / typecheck / test kötelező
`pnpm typecheck` + `pnpm test` minden cycle-ben (08-verify-local fázis).
Failing → cycle nem zárul `10-commit-push`-ig.

### 12. Commit + push autonóm (Tier 2)
A user explicit engedélye 2026-05-11: "bátran commit and push every
pending changes". Atomikus, jól-üzenetelt commit-ok. Tier 3 továbbra is
tiltott: `production-deploy`, `package release`, fizetős API-hívás.

### 13. Sleep-aware (a user érdekében)
Az Assistant Agent Cron Job kezeli a sleep-state-et. Ne kezdj el user-felé
notifikációt (cast-notifier hangos) alvás-window alatt. Saját build/test
**futhat** csendben.

### 14. Action-log emit (KÖTELEZŐ)
Minden cycle-fázis lépés `actor: "development-agent"` + megfelelő `kind`
(flow-start / state-change / ship / error / decision / note).

### 15. Workflow-fájl módosítás user-OK
Ha valami inkonzisztens a `WORKFLOW_DEV.md`-ben vagy `phases/dev/*`-ban,
**NE javítsd autonóm** — `events/dev/on-architecture-decision.md` szerint
USER_INPUT [NEW] blokkban javasolj.

### 16. Kérdés / egyeztetés menedzsment
Lásd `events/dev/on-user-needed.md`. 5 csatorna sürgősség szerint —
default: `USER_INPUT.md [NEW] domain: dev kind: instruction/approval`.

### 17. Persistencia-takeover
Foreign pending git changes / persisted error 3+ cycle után **te vagy a
felelős** — investigate + befejezés / revert / log.

### 18. TILTOTT projektek (KRITIKUS)
`__agent/references/workspace-projects.md` listáz **tiltott projekteket**
(jelenleg: `livirrium`, `ccap-revisioned`). **Semmilyen file-edit / commit /
push NEM mehet** ezekbe. Csak olvasás referenciaként. Ha kétértelmű helyzet
→ `events/dev/on-architecture-decision.md`.

### 19. Workspace-prio tudatosság
Cross-project pattern-keresésnél (04-investigate) **csak MAGAS / KÖZEPES**
prio workspace-projektekből (lásd `workspace-projects.md`) vegyél mintát.
NEM PRIO projektek elavult vagy nem-mérvadó mintákat tartalmazhatnak.

---

## Fázis-mátrix (cycle-flow)

```
00-orient ─→ 01-cleanup-git ─→ 02-audit ─→ 03-collect-tasks ─→ 04-investigate
                                                                       │
                                                                       ▼
13-close-cycle ←─ 10-commit-push ←─ 09-update-docs ←─ 08-verify-local ←─ 07-review ←─ 06-implement ←─ 05-plan-package
       │
       └─→ (új cycle: 00-orient)
```

| # | Fázis | Fájl | Mit |
|---|---|---|---|
| 00 | Orient | `phases/dev/00-orient.md` | Belépés: USER_INPUT check, STATUS_DEV inspect, plan vs candidate döntés |
| 01 | Cleanup git | `phases/dev/01-cleanup-git.md` | `git fetch origin`, foreign pending check, stash/revert ha kell |
| 02 | Audit | `phases/dev/02-audit.md` | `pnpm typecheck`/`test` baseline, server health-check, build-state |
| 03 | Collect tasks | `phases/dev/03-collect-tasks.md` | Plan-folytatás / USER_INPUT [NEW]-Domén2 / backlog 🟢 / FR-discovery |
| 04 | Investigate | `phases/dev/04-investigate.md` | Pattern-ref keresés, érintett kódbázis-mapping, spec olvasás |
| 05 | Plan package | `phases/dev/05-plan-package.md` | A) cycle-csomag / B) plan-doc / C) master-plan mód |
| 06 | Implement | `phases/dev/06-implement.md` | Kódolás (TS), helper/handler/endpoint/component build |
| 07 | Review | `phases/dev/07-review.md` | Pattern-match, architecture-conformance, code-quality |
| 08 | Verify local | `phases/dev/08-verify-local.md` | `pnpm typecheck`, `pnpm test`, smoke-test ha releváns |
| 09 | Update docs | `phases/dev/09-update-docs.md` | FR-status, plan-step, architecture, CHANGELOG, README |
| 10 | Commit push | `phases/dev/10-commit-push.md` | Atomikus commit (Tier 2 autonóm) + `git push` |
| 11 | (no-CI/CD) | nincs phase | Phase 1-ben a my-assistant-en nincs CI/CD még |
| 12 | (no test-env) | nincs phase | Phase 1-ben |
| 13 | Close cycle | `phases/dev/13-close-cycle.md` | STATUS_DEV update, `log/cycles/cycle-N.md` archive |
| M1 | Maintenance — Grooming | `phases/dev/maintenance-grooming.md` | 10-enkénti: FR / backlog konszolidáció |
| M2 | Maintenance — Daily Report | `phases/dev/maintenance-daily-report.md` | Napi: `__agent/reports/YYYY-MM/YYYY-MM-DD.md` |

**Megjegyzés:** a CCAP-mintán a 11 (CI/CD check) + 12 (verify test-env) fázisok
**a my-assistant-en még NEM relevánsak** — nincs pipeline / staging / test
env. Amikor lesz, beépítjük.

---

## Event-handlerek (interrupt-flow)

| Event | Fájl | Mikor |
|---|---|---|
| User input | `events/dev/on-user-input.md` | `USER_INPUT.md` `[NEW]` + `domain: dev` |
| Interrupt resume | `events/dev/on-interrupt-resume.md` | Széttört cycle: STATUS_DEV-ből rekonstruál |
| Build fail | `events/dev/on-build-fail.md` | `pnpm typecheck` / `pnpm run build` failel |
| Test fail | `events/dev/on-test-fail.md` | `pnpm test` failel |
| Merge conflict | `events/dev/on-merge-conflict.md` | git merge / rebase ütközés |
| Architecture decision | `events/dev/on-architecture-decision.md` | nagy architekturális elágazás → user kell |
| Package issue | `events/dev/on-package-issue.md` | npm/pnpm dep konfliktus, missing module |
| User needed | `events/dev/on-user-needed.md` | általános kérdés / clarification / Tier 3 approval |

---

## Belépés (mit csinálj most)

1. **Olvasd be a `STATUS_DEV.md`-t** (NO-CACHE)
2. Ha `phase: idle` → ugorj `phases/dev/00-orient.md`-re
3. Ha `phase: <X>` és `phase_notes` "interrupted" / "in-progress" →
   `events/dev/on-interrupt-resume.md` → onnan `phases/dev/<X>.md`
4. Olvasd be a `USER_INPUT.md`-t — van-e `[NEW]` `domain: dev`?
   Ha igen → `events/dev/on-user-input.md` ELŐSZÖR, aztán vissza a fázis-flow-ba

**Soha ne ugord át** a fázisokat. Ha valamelyik fázis "no-op" (pl. nincs
mit close-olni), a fázis-fájlja kifejezetten kezeli (idle / skip / stb.).

---

## Output formátum

Minden cycle-fázis lépés:
1. Action-log entry (`actor: development-agent`, megfelelő `kind`)
2. STATUS_DEV.md `phase_notes` frissítés
3. Ha fázis-záró: `STATUS_DEV.phase` → következő fázis
4. Ha cycle-záró (`13-close-cycle`): `cycle_id` increment, `log/cycles/cycle-N.md` write

---

## Pointers

- **Kanonikus komponens-elhatárolás**: `current/principles/system-components.md`
- **Domén-elhatárolás**: `current/principles/two-domains.md`
- **Autonómia-elvárás**: `current/principles/full-autonomy-expectation.md`
- **Architektúra (5 réteg)**: `current/architecture.md`
- **Tri-tier impl referencia**: `__agent/references/architecture.md`
- **CCAP CLI referencia**: `__agent/references/ccap/REFERENCE.md`
- **Backlog**: `__agent/triggers/development-agent-backlog.md`
- **State**: `__agent/STATUS_DEV.md`
- **Action-log**: `__agent/log/actions/<today>.jsonl`
- **Cycle archívum**: `__agent/log/cycles/`
- **FR-ek**: `current/feature-requests/`
- **Plan-ek**: `__agent/plans/`
- **A párhuzamos agent (Assistant Cron Job) workflow-ja**: `__agent/WORKFLOW_ASSIST.md`
- **Workspace projekt-priorítás (32 projekt, tiltások)**: `__agent/references/workspace-projects.md`
