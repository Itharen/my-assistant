# `__agent/triggers/` — Agent belépőfájlok + beüzemelési protokoll

> A my-assistant rendszer **két autonóm agentet** futtat (lásd
> `current/principles/system-components.md` #1 és #6). Ez a mappa
> tartalmazza mindkét **belépőfájlt** — a CCAP runtime ezeket olvassa
> minden tick / task-indítás előtt.
>
> A chat session (#5, én) **vezényli** a két agentet ezeken a fájlokon
> keresztül (`current/principles/full-autonomy-expectation.md`).

---

## A két autonóm agent

| Agent | Belépőfájl | State-fájl | Plan | Tick |
|---|---|---|---|---|
| **Assistant Agent Cron Job** (#6) | `assistant-agent-cron-entrypoint.md` | `__agent/state/assistant-agent-cron-tick.json` | `__agent/plans/assistant-agent-cron.plan.md` | óránként (cron) |
| **Development Agent** (#1) | `development-agent-entrypoint.md` | `__agent/state/development-agent-tick.json` | `__agent/plans/development-agent.plan.md` | event-vezérelt + 4 óránként sanity-fallback |

---

## Beüzemelési protokoll (CCAP felé)

### Assistant Agent Cron Job (#6)

```yaml
agent_name: assistant-agent-cron
schedule: hourly
system_prompt: __agent/triggers/assistant-agent-cron-entrypoint.md
state_file: __agent/state/assistant-agent-cron-tick.json
dispatcher: cli/scripts/agent-handlers/src/dispatch.ts   # node, --file=<agent-output.json>
inputs:
  - __agent/STATUS.md
  - __agent/log/actions/<today>.jsonl (utolsó 100 sor)
  - __agent/USER_INPUT.md
  - current/principles/recurring-tasks.md
  - current/diary/diary.md (utolsó nap)
  - fo tasks.list --filter '{"done":false}' --limit 30
  - __agent/state/assistant-agent-cron-tick.json
tier_policy:
  T0: log                       # mindig
  T1: notify-cast, user-input-new, update-status   # alvás alatt gate-elt
  T2: task-create, task-update                      # clear-rule kell
  T3: TILTOTT auto (task-archive / fizetős API / production-deploy)
  # commit+push 2026-05-11 óta Tier 2 — autonóm
```

### Development Agent (#1)

```yaml
agent_name: development-agent
schedule: event-driven       # file-watch + 4h fallback
events_watched:
  - current/feature-requests/**         # új FR
  - __agent/USER_INPUT.md (Domén 2 [NEW])
  - git push / merge
  - failing build / failing tests
system_prompt: __agent/triggers/development-agent-entrypoint.md
state_file: __agent/state/development-agent-tick.json
dispatcher: cli/scripts/agent-handlers/src/dispatch.ts   # Phase 2 — agent mező-support kell
inputs:
  - __agent/STATUS.md
  - current/architecture.md
  - current/principles/system-components.md
  - __agent/log/actions/<today>.jsonl
  - __agent/USER_INPUT.md
  - current/feature-requests/
  - __agent/plans/
  - __agent/state/development-agent-tick.json
  - git status / git log -10
  - (opc) pnpm typecheck / test outputs
tier_policy:
  T0: log
  T1: user-input-new, fr-status-change, plan-step-mark-done
  T2: plan-step-start, test-run                     # clear-rule (plan-step ref) kell
  T3: TILTOTT auto (production-deploy, package release, fizetős API)
  T2-be került: commit-and-push (autonóm — user-engedély 2026-05-11)
```

---

## Feladat-átadás protokoll (chat-ből vezénylés)

Amikor a chat (#5, én) új feladatot **átad** valamelyik agentnek:

### Asszisztensi feladat → Cron Job

1. **Rögzítés**: `__agent/USER_INPUT.md`-be `[NEW]` blokk + `domain` mező
   ("tasks" / "calendar" / "stock" / stb.)
2. **Vagy** principle / recurring-rule frissítés a `current/principles/`-ben
3. Cron Job a következő tickkor felveszi (max 1 óra)
4. Vagy: ha urgens → manuális tick-trigger (`node cli/scripts/agent-handlers/src/dispatch.ts --file …`)

### Szoftverfejlesztési feladat → Dev Agent

1. **Rögzítés**: új `current/feature-requests/<feature>.md` fájl
2. **Vagy**: meglévő FR `Status` mező változtatás `🅿️ Parkolva` → `🟢 Aktív`
3. **Vagy**: `__agent/plans/<plan>.plan.md` új vagy frissített plan
4. **Vagy**: `__agent/USER_INPUT.md` `[NEW]` blokk `domain: "dev"`
5. Dev Agent a következő event-tickkor felveszi

### Akut / chat-szintű manuális kérés

Ha a feladat **azonnali** (chat-flow), a chat (#5) **közvetlenül** elvégzi
Tier 0-1 szinten (file-edit, action-log, organizer task-create). Tier 2+
átadás történik a Cron Job-ra vagy Dev Agent-re.

---

## Indítás-checklist (CCAP team / másik agent)

| # | Lépés | Status |
|---|---|---|
| 1 | `assistant-agent-cron-entrypoint.md` olvasható és aktuális | ✅ |
| 2 | `development-agent-entrypoint.md` olvasható és aktuális | ✅ |
| 3 | `assistant-agent-cron-tick.json` state-seed létezik | ✅ (`schemaVersion: 1`) |
| 4 | `development-agent-tick.json` state-seed létezik | ✅ |
| 5 | `cli/scripts/agent-handlers/` dispatcher build-elt + smoke-zöld | 🟡 pnpm env-issue, kódszinten oké |
| 6 | Dispatcher `agent` mező-support (Phase 2 — Dev Agent integráció) | 🅿️ NEM épült (Dev Agent Phase 1) |
| 7 | CCAP cron beállítás: Cron Job óránként | 🅿️ CCAP team |
| 8 | CCAP event-watch beállítás: Dev Agent file-watch + fallback | 🅿️ CCAP team |
| 9 | Cost-cap konfiguráció (külön Cron / Dev) | 🅿️ CCAP team |
| 10 | Sleep-aware integráció (Cron Job state olvasás a Dev Agent-ből) | 🅿️ Phase 2 |
| 11 | Server-side tick-engine `agent` oszlop a DB-ben | 🅿️ Dev Agent munkálkodja |
| 12 | Watchdog (heartbeat ha valamelyik agent leáll) | 🅿️ Phase 3 |

---

## Action-log emit (mindkét agentnek)

Mindkét agent a közös action-logba ír (`__agent/log/actions/<today>.jsonl`).
Megkülönböztetés az `actor` mezőben:
- `actor: "assistant-agent-cron"`
- `actor: "development-agent"`
- `actor: "agent-dispatcher"` (a dispatcher saját logjai)

A chat (#5, én) `actor: "claude"`. A user kézzel: `actor: "user"`.

---

## Konkurencia + state-megosztás

A két agent **párhuzamosan** futhat. Közös state:

| Fájl | Konkurencia-szabály |
|---|---|
| `__agent/log/actions/*.jsonl` | append-only, atomikus `appendFile` — biztos OK |
| `__agent/USER_INPUT.md` | file-lock a handler-en (jelenleg nincs — Phase 2 javítás) |
| `__agent/STATUS.md` | file-lock a handler-en (jelenleg nincs — Phase 2 javítás) |
| `__agent/state/*-tick.json` | `*.lock` sentinel file-locking (a `state.ts`-ben már megvalósítva) |

---

## Pointerek a részletekhez

- **Kanonikus komponens-elhatárolás**: `current/principles/system-components.md`
- **Domén-elhatárolás**: `current/principles/two-domains.md`
- **Autonómia-elvárás**: `current/principles/full-autonomy-expectation.md`
- **Architektúra L1-L5**: `current/architecture.md`
- **Tri-tier (cli/server/client) impl-referencia**: `__agent/references/architecture.md`
- **Action-log schema**: `__agent/log/actions/README.md`
- **Dispatcher kód**: `cli/scripts/agent-handlers/`
