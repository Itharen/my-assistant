# FR: User I/O + Dev Agent I/O + Reports panel a my-assistant felületen

> **Forrás: user 2026-05-16 ~20:55** — felület-on látni az agent-kommunikációt + project-status-okat.

## User szövege

> nem ártana am a my asissstant felületre egy user IO/dev agent IO és egy
> riports amin keresztül látom, hogy mi hogy áll... mi van kész, mi in
> progress és mi a terv

## Cél

3 új panel a my-assistant kliensen, hogy a user **láthassa és kezelhesse** mindent ami az agentekkel + projektekkel történik — anélkül hogy a fájlokba kelljen néznie.

## A 3 panel

### 1. User I/O panel — két-irányú kommunikáció

| Komponens | Mit |
|---|---|
| **Inbox view** | `__agent/USER_INPUT.md` `[NEW]` blokkok megjelenítése — chat-stílusban (legújabb felül), kibontható |
| **Outbox view** | Cron Job / Dev Agent kérdései a user felé (USER_INPUT-ba escalated AGB-k, `open-questions.md` AA) szekció) |
| **Quick input** | Form: típus (task / feedback / approval / rejection / FR / instruction) + domain + szöveg → POST → `USER_INPUT.md` új `[NEW]` blokk |
| **Status toggle** | `[NEW]` → `[DONE]` átállítás egy gombbal |

### 2. Dev Agent I/O panel — agent-activity feed

| Komponens | Mit |
|---|---|
| **Live cycle status** | `STATUS_DEV.md` aktuális `cycle`, `phase`, `phase_notes` (auto-refresh socket-push-on) |
| **Action-log stream** | `__agent/log/actions/<today>.jsonl` filtered `actor:"development-agent"` — színkód: ship=zöld, decision=kék, note=szürke, error=piros, flow-start/end=lila |
| **AGENT_BUS view** | `AGENT_BUS.md` bejegyzések tab-elve: **TO chat** / **FROM chat** / all; status-szín (OPEN/ANSWERED/ACTED/DROPPED) |
| **Cycle history** | utolsó N cycle (`__agent/log/cycles/`) collapsible kártyák: cycle-ID + summary + commit |
| **Inline-válasz** | AGB-bejegyzésekre directly válaszolhat user (POST → AGB-update + chat-notify) |

### 3. Reports panel — projekt status board

| Komponens | Mit |
|---|---|
| **FR-board (kanban)** | 4 oszlop: **🟢 Aktív · 🚀 In-progress · ✅ Done · 🅿️ Parked**. Source: `current/feature-requests/*.md` Status mező + backlog hivatkozás + last action-log ship-entry |
| **Phase-progress bar** | Minden FR-en: Phase 1/2/.../N pipe-okkal, ✅/🚀/⏸ jelöléssel |
| **Backlog-snapshot** | `__agent/triggers/development-agent-backlog.md` strukturáltan: 🟢 most-fókusz, 🟡 második hullám, 🅿️ parkolt; pri-rendezve |
| **Recent ships** | utolsó 7-14 nap `kind:"ship"` entries, commit-link + FR-ref + LOC-delta |
| **Roadmap** | aktív plan-doc-ok (`__agent/plans/*.plan.md`) — current step + remaining steps |
| **Blockers** | `OPEN` AGB-k `Kind:question|block` + 24h+ régiek (eszkaláció kandidátus) |

## Data-források (összegzés)

| Source | Cél-panel |
|---|---|
| `__agent/USER_INPUT.md` | User I/O Inbox |
| `current/open-questions.md` AA) | User I/O Outbox |
| `__agent/STATUS_DEV.md` | Dev I/O cycle status |
| `__agent/log/actions/*.jsonl` | Dev I/O activity feed + Reports recent-ships |
| `__agent/AGENT_BUS.md` | Dev I/O bus + Reports blockers |
| `__agent/log/cycles/*.md` | Dev I/O cycle history |
| `current/feature-requests/*.md` | Reports FR-board |
| `__agent/triggers/development-agent-backlog.md` | Reports backlog-snapshot |
| `__agent/plans/*.plan.md` | Reports roadmap |

## Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a FR | chat ✅ |
| 1 | **Reports panel** — FR-board + recent-ships (read-only, legkönnyebb start) | Dev Agent |
| 2 | **Dev I/O panel** — cycle status + action-log stream + AGB read | Dev Agent |
| 3 | **User I/O panel** — read (USER_INPUT + open-Q) | Dev Agent |
| 4 | **Inline-write**: USER_INPUT új-blokk form + AGB inline-válasz form | Dev Agent |
| 5 | **Socket-push** integráció (FR #3f Phase 5) — auto-refresh új AGB / action / ship-re | Dev Agent |
| 6 | Backlog-snapshot + roadmap + blockers (Reports kiegészítés) | Dev Agent |

## Server-feltétel

- Új REST endpoint-ok kellenek a fájl-olvasásra: `GET /api/agent-bus/list`, `GET /api/status-dev`, `GET /api/cycles/list`, `GET /api/fr/list`. Mind **unauth** (loopback-only) — összhangban az AGB-20 auth-fix patternjével.
- Vagy: a meglévő `/log-public` minta szerint write-restricted, read-open dev-en.

## Status

🟢 **Aktív FR.** Backlog **#3g** (a `#3b-WAVE-UI` és `#3f` után, párhuzamosan). User-prio: **magas** — a my-assistant központi UX hiánya.

## Kapcsolódik

- `current/principles/client-visualization.md` — minden feature-höz kötelező UI (univerzális hard rule)
- `current/feature-requests/tasks-dashboard-aggregated-view.md` (#3d) — egy testvér Reports-tipusú panel
- `current/feature-requests/socket-and-version-sync.md` (#3f Phase 5) — push-update infra
- `current/feature-requests/rag-context-injection.md` Phase 7 — context inspector (testvér panel)
- `__agent/AGENT_BUS.md` — adatforrás
