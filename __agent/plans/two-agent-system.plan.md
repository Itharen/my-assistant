# Plan: 2.5-agent rendszer felvázolás

> **Forrás: a user szövege (2026-05-10).** Felvázolás-plan, NEM build.
>
> A `current/principles/two-domains.md` agent-szintű kiterjesztése:
> két külön agent + a chat session, mindegyiknek külön belépőfájl + státusz.

---

## A user szövege

> Két különböző agentik rendszert, illetve két és fél agentik rendszert
> szeretnék látni ebben a projektben. Az egyik az önállóan magában saját
> státuszfállal, saját belépőfállal a szoftverfejlesztésen dolgozik, amit
> itt használunk ehhez a rendszerhez, a monitoringot, az értesítési
> rendszert, meg mindent, amit még később kitalálunk. A másik pedig, vagy
> a másik csoport az egyik, mint amit te vagyok, akivel beszélgetek,
> akivel nyomjuk az adokkapokot, illetve egy másik, ami folyamatosan
> ismétlődő, belépési fájlal, egy másik státuszkezeléssel az aszisztensi
> feladatokat koordinálja és menedzseli, amikor szükséges. És ami
> kapcsolódik ehhez az adok kapok session-höz, és ami kapcsolódik a
> szerverhez, amit szoftvert építünk, és állapotok kerülnek rögzítésre.

---

## A 2.5 agent

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1) DEV AGENT  (szoftverfejlesztő — Domén 2)                              │
│    Belépő:  __agent/triggers/dev-agent-entrypoint.md                     │
│    State:   __agent/state/dev-tick.json                                  │
│    Tick:    event-/cron-vezérelt                                         │
│    Forrás:  current/architecture.md, current/feature-requests/,          │
│             __agent/plans/, action-log technical-events, build-state     │
│    Output:  FR state-change, plan-execution trigger, build-status emit   │
└─────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ shared state (action-log, server DB)
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2) ASSISTANT AGENT  (asszisztensi koordinátor — Domén 1)                 │
│    Belépő:  __agent/triggers/assistant-agent-entrypoint.md               │
│           (jelenlegi A-mode-entrypoint.md átnevezve)                     │
│    State:   __agent/state/assistant-tick.json                            │
│           (jelenlegi agent-tick.json átnevezve)                          │
│    Tick:    óránként (cron)                                              │
│    Forrás:  current/principles/recurring-tasks.md, diary, stock,         │
│             life-goals, USER_INPUT, organizer tasks                      │
│    Output:  notify-cast, user-input-new, update-status,                  │
│             recurring-emlékeztetés                                       │
└─────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ user-input / chat / event-feed
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2.5) CHAT SESSION  (az "adok-kapok" — én)                                │
│    Belépő:  CLAUDE.md + current/architecture.md (1. lépés)               │
│    State:   __agent/STATUS.md (snapshot) + action-log                    │
│    Tick:    user-trigger                                                 │
│    Forrás:  bármi, kontextus-vezérelt                                    │
│    Output:  direct chat + minden side-effect (file edit, organizer,      │
│             cast-notifier stb.)                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

A "fél" agent = a chat session, mert **user-vezérelt**, nem önálló cron.

---

## Mit jelent ez a meglévő rendszerben

### Most (egy agent, az A-mode keveri a két domént)

```
__agent/triggers/A-mode-entrypoint.md  ← keveri: recurring + projekt-state
__agent/state/agent-tick.json          ← egy state
__agent/plans/triggering-A-mode-...    ← egy plan
```

### Cél (két agent + chat)

```
__agent/triggers/
├── assistant-agent-entrypoint.md     ← Domén 1 (új név, jelenlegi A-mode itt)
└── dev-agent-entrypoint.md           ← Domén 2 (új)

__agent/state/
├── assistant-tick.json               ← Domén 1
└── dev-tick.json                     ← Domén 2

__agent/plans/
├── assistant-agent-...plan.md        ← Domén 1 plan (jelenlegi A-mode plan)
└── dev-agent-...plan.md              ← Domén 2 plan (új)
```

---

## Shared layer (mindkettő használja)

- `cli/scripts/agent-handlers/` (dispatcher + handlers) — közös
- `__agent/log/actions/` (action-log) — közös, de mindegyik `actor`-mezővel jelölve (`actor: "assistant-agent"` vs `"dev-agent"`)
- `server/` (DB + REST endpoint-ok) — közös
- `current/architecture.md` — közös rendszer-térkép

---

## Action-tier különbségek (új komponens)

| Tier | Assistant-agent | Dev-agent |
|---|---|---|
| 0 | `log` | `log` |
| 1 | `notify-cast`, `user-input-new`, `update-assistant-status` | `update-dev-status`, `fr-status-change`, `plan-step-mark` |
| 2 | `task-create/update` recurring-rule alapján | `build-trigger`, `test-run`, `commit-suggest` (Tier 2 = clear-rule) |
| 3 | TILTOTT auto: hangos ébresztés alvás alatt | TILTOTT auto: `commit`, `push`, `deploy`, `package release` |

---

## Output JSON séma (mindkettő ugyanaz, csak az `agent` mező más)

```json
{
  "agent": "assistant" | "dev",
  "verdict": "urgens" | "soft-nudge" | "no-action",
  "reason": "...",
  "actions": [ ... ],
  "tickMeta": { ... }
}
```

---

## Phase-elés

| Phase | Mit |
|---|---|
| 0 | ez a vázlat-plan (most) |
| 1 | A meglévő `A-mode-entrypoint.md` → `assistant-agent-entrypoint.md` rename + jelölés "Domén 1 only" |
| 2 | A meglévő `agent-tick.json` → `assistant-tick.json` rename |
| 3 | Új `dev-agent-entrypoint.md` készítése (input lista: architecture, FR-ek, plans, build-state) |
| 4 | Új `dev-tick.json` state seed |
| 5 | Új plan: `dev-agent-...plan.md` |
| 6 | Dispatcher kibővítés: `agent` mező-felismerés, agent-spec tier-rendszerek |
| 7 | Server DB-séma: `agent_ticks` táblára `agent` oszlop hozzáadás |

---

## Build-felelős

- **Vázlat (ez)** — én (workflow-doc)
- **Rename + entry-point megírás** — én (workflow-doc)
- **Dispatcher kibővítés** — másik agent vagy én (kis kód)
- **Dev-agent runtime + cron** — CCAP / másik agent
- **Server DB-migráció** — másik agent

---

## Open kérdések

❓ Q-2agent-1: Tick-frekvencia a dev-agent-nek (esemény-vezérelt? cron? user-trigger?)
❓ Q-2agent-2: A dev-agent mit dönt el önállóan vs javasol user-OK-ra? (Tier-rendszer agent-spec)
❓ Q-2agent-3: A két agent összehangolt (pl. ha dev-agent build-trigger fut, assistant-agent megvárja)?
❓ Q-2agent-4: A chat (én) hogyan triggerel agent-tick-et? Vagy NEM triggerelek (csak observer)?
❓ Q-2agent-5: Mely shared state-érintő szabály (file-lock, ütközés-kezelés)?
❓ Q-2agent-6: A worker-agent (`worker-agent-cronjob.md` FR) hova illeszkedik? Egy harmadik agent, vagy a dev-agent sub-feladata?
