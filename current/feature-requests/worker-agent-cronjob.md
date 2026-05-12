# FR: Worker-agent + drag-and-drop kanban flow

> **Forrás: a user szövege (2026-05-10).**

## A user szövege

> ki kéne alakítanunk valamilyen olyan rendszert is, hogy majd indítunk
> még egy cronjob-szerű dolgozóagentet, és neki milyen feladatokat adunk
> át. összeszedjük egy valamilyen listába és ahonnan tudom drag and
> drop-pal dobálni oda, ahova már lehet csinálni és ő pedig teszi át onnan
> tovább, hogyha meg is van csinálva.

## Cél

Klasszikus **kanban-flow** worker-agent-vezérelve:

```
┌──────────────┐    drag    ┌──────────────┐  worker   ┌──────────────┐
│  Backlog     │  ────────▶│  Ready       │ ─────────▶│  In-progress │ ──▶  Done
│  (gyűjtő)    │  (user)   │  (kijelölve) │   (auto)  │  (folyamatban)│
└──────────────┘            └──────────────┘            └──────────────┘
```

A user **kanban-szerűen** dobja át a backlog-ból a "ready"-be, és onnan
a worker-agent automatikusan veszi át + dolgozik vele, majd `done`-ba teszi.

## Komponensek

| Réteg | Mit |
|---|---|
| **L1 — task-list backend** | DB-tábla a server-app-ban (oszlopok: status, priority, dependsOn, agentInstructions) |
| **L3 — Dashboard UI** | client/ Angular kanban-board komponens drag-and-drop-pal |
| **L5 — Worker-agent** | cron-tick + Claude API + dispatcher (hasonló az A-mode-hoz, de B-mode jellegű — plan-execution scope) |
| **Trigger** | a server-app polling-eljen vagy a CCAP cron-trigger-elje |

## Kapcsolódás a B-mode-hoz

A meglévő `__agent/plans/B-mode-scripted-automation.plan.md` ennek **rokon-FR**-je.
A B-mode = LLM nélküli scripted task (recurring miss-detect, log-rotálás…).

Ez **viszont LLM-es worker** — közelebb áll az A-mode-hoz, de **plan-execution**
scope-pal (nem health-check). Az eredeti `triggering-system-architecture.md` ezt
**B mode-ként** is hívta — érdemes a két FR-t összeolvasztani vagy
átnevezni.

**Javaslat (felírva, döntés nem most):** ez lesz az **"Executor agent"** vagy
**"Worker agent"** mode — külön az A-mode-tól + a (LLM-mentes) scripted-cron
módtól.

## Adat-séma vázlat

```
worker-task {
  id: uuid
  title: string
  status: 'backlog' | 'ready' | 'in-progress' | 'done' | 'failed'
  priority: number
  agentInstructions: markdown   // mit csináljon az agent
  acceptanceCriteria: string[]  // mikor "done"
  dependsOn: id[]               // előfeltétel
  createdAt, startedAt, doneAt: ISO
  resultLog: string             // worker action-log link / reference
  approvalNeeded: boolean       // user-OK kell a doneAt-előtt?
}
```

## Drag-and-drop UI

`client/` Angular — kanban-board view új modul:
- 5 oszlop: Backlog / Ready / In-progress / Done / Failed
- Drag user-driven csak `backlog → ready` és `done` finalizálás (ha approvalNeeded)
- A többi átmenet auto (worker-agent vagy server)

## Reliability-szempontok

- A worker-agent **plan-execution**-t végez = drága + kockázatos
- Tier-rendszer kiterjesztendő (az A-mode-ban felírt 0-3 tier nem fedi le)
- **Plan-approval gate** kötelező — már létezik a `working-style.md`-ben
  ("3 pontos OK vagy alapos review")

## Phase-elés

| Phase | Mit |
|---|---|
| 0 | ez a FR + B-mode összeolvasztás-döntés |
| 1 | server-app DB-séma + REST endpoint (POST/PATCH worker-task) |
| 2 | client/ kanban-board komponens drag-and-drop-pal |
| 3 | Worker-agent runtime (CCAP-ben, vagy lokál) |
| 4 | Approval-flow integráció |

## Open kérdések

❓ Q-worker-1: Összeolvasszuk a `B-mode-scripted-automation.plan.md`-vel, vagy külön rendszer?
❓ Q-worker-2: A worker-agent ki futtatja (CCAP / lokál cron / saját szerver)?
❓ Q-worker-3: Drag-and-drop pontos viselkedés (csak backlog→ready user, vagy bármelyik átmenet?)
❓ Q-worker-4: Plan-approval — minden task előtt user-OK, vagy csak Tier 2+?
❓ Q-worker-5: Hogyan illeszkedik a tier-rendszerbe (a worker plan-step-eit külön tier-ezzük)?
❓ Q-worker-6: Kapcsolódik az organizer task-rendszeréhez (importálható a `fo tasks.list`)?
