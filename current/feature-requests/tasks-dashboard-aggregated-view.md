# FR: Aggregált tasks-dashboard view a client/-en

> **Forrás: a user szövege (2026-05-12).**

## A user szövege

> Jó lenne, hogyha ezen a kis My Assistant projekt felületünkön
> megjelennének a feladatok valamilyen úton-módon. Kb. ugyanez, amit
> most itt összeállítottál, csak a felületen, és ugye ott a scripteknek
> kell ezt összeállítania. Mindenféle, ezerféle logika alapján, amiket
> közben itt irogatunk fel. és amin keresztül tudom jelölgetni, hogy ez
> megvolt, azt halasztjuk, ez így, az úgy...

## Cél

A `client/` (My Assistant Client, Angular 18 dashboard) — új modul:
**aggregált tasks view**, ami **a chat-szerű prioritás-listát** mutatja
**interaktívan**.

A user a felületen tudja jelölgetni:
- ✅ "megvolt" (task done)
- ⏸ "halasztjuk" (snooze N nap / specifikus dátumig)
- 🔄 "így csináljuk" / "úgy csináljuk" (komment / split / módosítás)
- 🚫 "nem releváns" (drop)

## Aggregáció — milyen forrásokból (scriptek építik össze)

A `server/` aggregálja:

| Forrás | Min |
|---|---|
| **Organizer tasks** | `fo tasks.list --filter '{"done":false}'` — magas-prio + dueDate-közeli |
| **USER_INPUT [NEW] blokkok** | `domain: tasks/calendar/stock/diary/recurring/dev/…` |
| **Recurring miss-detected** | `current/principles/recurring-tasks.md` ütemezés vs utolsó-elvégzés |
| **Overdue stock-reorder** | `current/stock/items.md` — currentQty < reorderThreshold |
| **Active FR-ek** | `current/feature-requests/*.md` Status: 🟢 Aktív |
| **Open kérdések** | `current/open-questions.md` h-fontosság + ts |
| **Pénzkereső deadline-ok** | `current/projects.md` projekt-státuszok |
| **Sleep / fit / health recurring** | `current/principles/*-system.md` |

Plus: minden tételhez **prio-érték** számolva a `priority-system.md`
szorzók szerint (priority × project-multiplier × halogatás × deadline ×
életcél-szorzó).

## Új REST endpoint a server-en

```
GET /api/tasks/aggregated
GET /api/tasks/aggregated/<id>
POST /api/tasks/aggregated/<id>/mark-done
POST /api/tasks/aggregated/<id>/snooze   { until_ts }
POST /api/tasks/aggregated/<id>/drop     { reason }
POST /api/tasks/aggregated/<id>/comment  { text }
```

## Aggregátor script (server-side)

`server/src/_modules/tasks-aggregator/` — Phase 2-höz tartozik.

Logika:
1. Olvas a fenti 8 forrásból (vagy DB-ből vagy file-ból, lásd SSoT)
2. Prio-érték számolás minden tételen
3. Cluster-bundling (kapcsolódó tételek)
4. Render-data összerakás (JSON)
5. Cache `__agent/state/aggregated-tasks-cache.json` (5p TTL?)

## Client UI vázlat

```
┌──────────────────────────────────────────────────────────────┐
│ 🔴 Most-fókusz (lejárt / urgens)                              │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ [✅] [⏸] [🚫] [💬] Kaja-rendelés Interfood — P=158       │   │
│ │ Lejárt 2 napja. (forrás: organizer task)               │   │
│ └────────────────────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ [✅] [⏸] [🚫] [💬] TERA-check — heti recurring kedd      │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                                │
│ 🟡 Most-fókusz (közepes)                                       │
│ ...                                                            │
│                                                                │
│ 🟢 Backlog (low)                                               │
│ ...                                                            │
└──────────────────────────────────────────────────────────────┘
```

Plus: szűrő (domain / project / prio / type), keresés, group-by.

## Drag-and-drop (kapcsolódás a worker-agent-FR-rel)

A `current/feature-requests/worker-agent-cronjob.md` kanban-flow-t
javasol. Két opció:
- **A**: Aggregált view = read-only-ish lista, jelöléssel (most ez)
- **B**: + Kanban view (backlog/ready/in-progress/done) drag-and-drop —
  a worker-agent ezt használja

→ Q-aggr-1: A vs B vs hybrid

## Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a FR | én ✅ |
| 1 | Server: aggregátor modul + REST endpoint | Dev Agent |
| 2 | Client: `_modules/tasks/` modul + UI | Dev Agent |
| 3 | Interactive actions (mark-done, snooze, drop, comment) | Dev Agent |
| 4 | Real-time refresh (polling vagy WebSocket) | Dev Agent |
| 5 | Drag-and-drop kanban (ha B opció) | Dev Agent (worker-agent-FR-rel együtt) |

## Open kérdések

❓ Q-aggr-1: Read-only lista (A) vs kanban-drag-drop (B)?
❓ Q-aggr-2: Real-time mód: polling (5s? 30s?) vs WebSocket?
❓ Q-aggr-3: A `snooze` művelet hogyan integrálódik (új mező az organizer task-on, vagy server-side override)?
❓ Q-aggr-4: A jelölések visszafelé hatnak az SoT-ra (pl. mark-done → `fo tasks.update done: true`) automatikusan? Vagy csak a felületi state változik?
❓ Q-aggr-5: Komment / split művelet: hova mentődik?

## Status

🟢 **MAGAS prio** — user kritikus monitoring/interakciós igény.

## Kapcsolódik

- `current/feature-requests/automatic-status-recording.md` — testvér FR (STATUS auto-rögzítés)
- `current/feature-requests/worker-agent-cronjob.md` — kanban-flow worker-agent
- `current/feature-requests/communication-forms.md` — 3 csatorna
- `__agent/triggers/development-agent-backlog.md` — Dev Agent backlog
- `current/principles/priority-system.md` — szorzó-logika
- `current/principles/mvp-focus.md` — pénzkereső prio kiemelés
