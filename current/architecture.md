# my-assistant — rendszer-architektúra (kanonikus rendszer-térkép)

> **Élő dokumentum.** Minden komponens-átalakítás után frissítendő.
>
> Az itt leírt **5 réteg** + **adatfolyam** + **FR-mapping** + **roadmap**
> a kanonikus rendszer-térkép. Új feature-ekhez először nézd meg, melyik
> réteghez tartozik.
>
> **Implementációs részletek** (cli/server/client tri-tier konkrét kódszerkezete,
> endpoint-tábla, source layout, migration cutover tervezet) → lásd:
> [`__agent/references/architecture.md`](../__agent/references/architecture.md)

---

## 1. Cél

A my-assistant a user napi életét segítő rendszer:
- **monitoring** (mit csinál, hogy van fizikailag/mentálisan, mi a state-je)
- **interakció** (CLI parancsok + chat session-ök + dashboard)
- **agent-vezérelt automatizmus** (recurring rutin emlékeztetés, anti-deferral, plan-execution)
- **session-continuity** — bármikor összeomolhat, a rendszer mindig vissza tudja venni a fonalat

Hosszú távú cél: az életcél-projekteket (3×3 tanulmány, HelloCIA, Niche Datasets) támogatni
+ a 2 fő életcélt szolgálni (világ-fejlesztés + családalapítás).

---

## 2. Réteges architektúra

```
┌──────────────────────────────────────────────────────────────────────┐
│  L5 — Agent-runtime         (CCAP futtatja, NEM a my-assistant)      │
│      A-mode (Claude API tick) | B-mode scripted | C chat (most ez)   │
└─────────────────────┬────────────────────────────────────────────────┘
                      │ HTTP POST /tick (AgentOutput JSON)
                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  L4 — Server                (server/)                                │
│      Express + SQLite + better-sqlite3 (FDP pattern)                 │
│      tick-engine (validate→tier-gate→dispatch)                       │
│      action-log + state + activity-ingest + sleep-window-infer       │
└─────────────────────┬────────────────────────────────────────────────┘
                      │ HTTP REST (envelope: ok|error, requestId, elapsedMs, …)
        ┌─────────────┼─────────────┬───────────────┬─────────────────┐
        ▼             ▼             ▼               ▼                 ▼
┌───────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────┐
│ L3 — CLI      │ │ L3 — Dash    │ │ L2 — Monit   │ │ L2 — Notify   │ │ L1 — Files   │
│  (cli/)       │ │  (client/)   │ │              │ │               │ │  (__agent/)  │
│               │ │              │ │ activity-    │ │ ma cast       │ │              │
│ ma cast       │ │ Angular 18   │ │   monitor    │ │   notify      │ │ STATUS.md    │
│ ma spotify    │ │ /status view │ │ (PS + Win32) │ │ → Google      │ │ USER_INPUT   │
│ ma … (jövő)   │ │ /actions TBD │ │              │ │   Home/Cast   │ │ log/actions/ │
│               │ │ /user-input  │ │ (jövő:)      │ │               │ │ state/       │
│               │ │ /activity    │ │ battery      │ │               │ │ triggers/    │
│               │ │              │ │ food-track   │ │               │ │ plans/       │
│               │ │              │ │ sleep-mon    │ │               │ │ principles/  │
│               │ │              │ │ interfood    │ │               │ │ feature-req/ │
└───────────────┘ └──────────────┘ └──────────────┘ └───────────────┘ └──────────────┘
```

**Megjegyzés a fallback-re:** L1 (file-rendszer) és L4 (server) **párhuzamosan**
él Phase 1-ben. Ha a server le van állva, a file-state-eb fallback van.
Ez explicit cél — soha ne legyen a rendszer "nem indul el" mert a server alszik.

---

## 3. Layer-ek részletesen

### L1 — Files (`__agent/`, `current/`)

**Mit:** plain-text source-of-truth (markdown / JSON / JSONL).

**Tartalom:**
| Mappa | Tartalom |
|---|---|
| `__agent/STATUS.md` | aktuális snapshot (state, last_event, active_plans, next_action) |
| `__agent/USER_INPUT.md` | `[NEW]` blokkok user → agent kommunikációhoz |
| `__agent/SOURCE_OF_TRUTH.md` | modul-szintű kanonikus forrás (organizer vs lokál) |
| `__agent/log/actions/<day>.jsonl` | append-only akció-napló (commitolt, retention=∞) |
| `__agent/state/agent-tick.json` | A-mode tick state (file-fallback) |
| `__agent/triggers/*.md` | agent-belépési instrukciók (kanonikus) |
| `__agent/plans/*.plan.md` | tervek + roadmap |
| `current/principles/*.md` | alapelvek (working-style, sleep, fit, health, priority, 3×3, …) |
| `current/feature-requests/*.md` | FR-ek (élő, nem-archív) |
| `current/diary/diary.md` | napi napló |
| `current/notes/*.md` | szabad jegyzetek |
| `current/life-goals.md` | életcélok (kanonikus) |
| `current/projects.md` | projekt-térkép + szorzók |
| `current/open-questions.md` | parkoló-pálya kérdés-log |
| `current/stt-typos.md` | STT-félrehallás minták |

**Karbantartja:** my-assistant chat session (én).

### L2 — Monitoring + Notification

**Monitoring** — a user fizikai/digitális állapotának passzív megfigyelése:

| Komponens | Mit | Status |
|---|---|---|
| `activity-monitor/` (PowerShell) | aktív ablak / process / idle-time, percenként mintavétel | ✅ él |
| Battery monitor | telefon/tablet/óra töltöttség, 40% warn | 🅿️ FR |
| Food tracking | étkezés idő/típus/mennyiség, kézi log nélkül | 🅿️ FR |
| Sleep monitor data access | Nest Hub / Wear OS / Google Fit alvás-state lekérés | 🅿️ FR research |
| Interfood scraper | rendelés-state Playwright-tal | 🅿️ FR |

**Notification** — user-felé szóló kimenet:

| Komponens | Mit | Status |
|---|---|---|
| `ma cast notify` (cli) | TTS push Google Home / Cast cluster-re | ✅ él (Phase 1.5+2 shipped) |
| Email-küldés | jövőbeli, mailhez bekötve | 🅿️ FR |
| Social-media post | jövőbeli (LinkedIn etc.) | 🅿️ FR |

### L3 — CLI (`cli/`) + Dashboard (`client/`)

**CLI** — `@my-assistant/cli` (`ma`):

```
ma cast {discover|notify|volume|preset|list-interfaces}
ma spotify {auth|status}
```

JSON envelope output (matches `fo` CLI). Minden hívás action-loggol.

**Dashboard** — `@my-assistant/client` (Angular 18):
- `/status` view (server snapshot) — implementálva
- `/actions`, `/user-input`, `/activity` — TBD

**Karbantartja:** my-assistant chat (én), de a build-elést többnyire másik agent végzi (FDP-pattern alapján).

### L4 — Server (`server/`)

`@my-assistant/server` — Express + SQLite (better-sqlite3, zero-infra):

| Endpoint | Cél |
|---|---|
| `/healthz` | health-check |
| `/status` | strukturált snapshot |
| `POST /tick` | A-mode dispatcher (validate→tier-gate→dispatch) |
| `/actions` | action-log (read paged + write) |
| `/user-input` | [NEW] blokkok (read + create + status update) |
| `POST /activity-sample` | activity-monitor sample ingest + sleep-window infer |
| `/notification/pending` | alvás-vége csomag queue |
| `POST /notification/throttle/check` | throttle-id ellenőrzés |

DB-séma 8 tábla (lásd `current/feature-requests/server-app-architecture.md`).

**Auth:** loopback = no auth; non-loopback = Bearer token.

**Karbantartja:** általában másik agent build, én a contractokat + workflow-kat.

### L5 — Agent runtime (CCAP)

| Mode | Mit | Status |
|---|---|---|
| **A) Intelligens periodikus** | óránként Claude API hívás, állapot-check, action-set kibocsátás | ✅ MVP shipped (file fallback) → bekötve a server `/tick`-be |
| **B) Scripted automatizmus** | LLM nélkül cron-task-ok (recurring miss-detect, log rotálás, diary-template, stb.) | 🟡 plan v1, NEM épült |
| **C) Élő chat** | én (most ez) | ✅ él |

**Belépési fájl A-mode-hoz:** `__agent/triggers/A-mode-entrypoint.md`

**Karbantartja:** my-assistant chat (én) — workflow-k karbantartása az enyém.

---

## 4. Adatfolyam — egy A-mode tick (Phase 1)

```
0:00  CCAP cron tick
        ↓
        ├── olvas: __agent/triggers/A-mode-entrypoint.md (system prompt)
        ├── összerakja inputot: STATUS.md + action-log + USER_INPUT
        │                       + recurring + diary + fo tasks.list + tick-state
        └── Claude API hívás (A-mode prompt)
                ↓
                LLM ad: AgentOutput JSON
                ↓
        ├── (opció A — server up) HTTP POST http://127.0.0.1:39200/tick
        │   server: validate → tier-gate → handler-ek → DB insert + action emit
        │   válasz: DispatchResult JSON
        │
        └── (opció B — fallback) node scripts/agent-handlers/src/dispatch.ts --file
            file-state: __agent/log/actions/<day>.jsonl + agent-tick.json
            válasz: stdout DispatchResult JSON
        ↓
        action-handlers side-effects:
        ├── log → action-log entry
        ├── user-input-new → USER_INPUT.md (file) vagy DB row
        ├── update-status → STATUS.md mező rewrite vagy DB row
        ├── notify-cast → ma cast notify shell-out (Phase 2)
        ├── task-create → fo tasks.create shell-out (Phase 2)
        └── task-update → fo tasks.update --if-match (Phase 2)
        ↓
0:05  CCAP alszik a következő tickig (1h múlva)
```

---

## 5. User-kérés → komponens mapping

A user által 2026-05-07 / 08 megfogalmazott rendszer-igények:

| User-igény | Hol implementált / lesz |
|---|---|
| Monitoring rendszer (külön) | **L2 Monitoring** — activity-monitor + jövőbeli FR-ek |
| Interakciós rendszer CLI-ben | **L3 CLI** — `cli/` `ma` |
| Dashboard-szerű felület | **L3 Dashboard** — `client/` Angular |
| DB-kapcsolat + szerver | **L4 Server** — `server/` (Express + SQLite, az FR megvalósult!) |
| Triggering AI workflow (A-mode) | **L5 A-mode** — `__agent/triggers/` + tick-engine a server-ben |
| Scripted automatizmus | **L5 B-mode** — plan v1 készen, NEM épült |
| Session-continuity | **L1 Files** + L4 server párhuzamos |
| Életcél-tracking, 3×3 system | **L1 Files** — `current/principles/` + jövőbeli L4 endpoint |
| Sleep-aware notifikáció | **L4 + L5** — server sleep-window infer + L5 A-mode tier-gate |
| Cast/Google Home notify | **L2 Notify** — `ma cast notify` |

---

## 6. Hátralévő (FR mapping, prioritáshoz)

A `current/feature-requests/` mappa élő. A high-prio nyitottak:

| FR | Layer | Prio jelzés |
|---|---|---|
| `triggering-system-architecture.md` (B-mode) | L5 | ⏳ várja A-mode tanulságait |
| `food-tracking.md` | L2 | 🟢 magas — egészségtelen szokások |
| `sleep-aware-notifications.md` | L5 | 🟢 magas — alvás védelem |
| `sleep-monitor-data-access.md` | L2 | 🟡 research |
| `device-battery-monitoring.md` | L2 | 🟡 közepes |
| `device-volume-scheduling.md` | L2 | 🟡 közepes |
| `interfood-scraper.md` | L2 | 🟡 közepes (food-tracking input) |
| `email-integration.md` | L2 | 🅿️ placeholder |
| `social-media-integration.md` | L2 | 🅿️ placeholder |
| `cross-project-notes-ingestion.md` | meta | 🅿️ out-of-scope, ~2 hét |
| `google-home-integration.md` | L2 (megvan) | ✅ Phase 1.5+2 shipped |
| `server-app-architecture.md` | L4 (megvan) | ✅ Phase 1 implementálva |
| `activity-tracking.md` | L2 (megvan) | ✅ activity-monitor él |
| `organizer-day-week-view.md` | organizer | ⏸ organizer-FR (külön rendszer) |

---

## 7. Felelősségi mátrix (ki mit csinál)

| Komponens | Karbantart | Build (új feature) |
|---|---|---|
| `__agent/`, `current/`, principles, FR-ek, plans, triggers | **én (chat)** | én |
| `cli/` | én | általában másik agent (FDP-pattern alapján) |
| `server/` | én | másik agent |
| `client/` | én | másik agent |
| `scripts/agent-handlers/` | én | én |
| `scripts/action-log/` | én | én |
| `activity-monitor/` | én | én |
| Agent-runtime (A-mode tick / B-mode cron) | CCAP | CCAP |
| organizer rendszer | organizer team | organizer team (FR-en át kommunikálunk) |

---

## 8. Roadmap (high-level)

### Phase 1 — most, élő

- [x] L1 Files (kiépítve, action-log infra él)
- [x] L2 Monitoring partial: activity-monitor él
- [x] L2 Notification: `ma cast notify` Phase 1.5+2
- [x] L3 CLI: `ma cast`, `ma spotify`
- [x] L3 Dashboard: client/ skeleton + status view
- [x] L4 Server: `server/` Phase 1 (8 endpoint, 8 tábla, file-fallback)
- [x] L5 A-mode: dispatcher + entry-point + 3 handler MVP
- [x] Architecture doc (this file)

### Phase 2 — közeljövő

- [ ] L5 A-mode → server `/tick` integráció (file-fallback marad)
- [ ] L5 A-mode handlers Phase 2: notify-cast (valódi cast-shell), task-create/update (`fo`-shell)
- [ ] L4 server: sleep-window infer (`activity-sample` ingest → DB-derive)
- [ ] L2 food-tracking Phase 1 (hibrid prompt)
- [ ] L3 Dashboard: actions / user-input / activity views

### Phase 3 — közép-táv

- [ ] L5 B-mode scripted (recurring miss-detect, log rotálás, diary-template)
- [ ] L2 sleep-monitor research → API integráció
- [ ] L2 battery / volume-schedule
- [ ] L2 interfood-scraper

### Phase 4 — hosszabb táv

- [ ] L2 email + social-media
- [ ] Cross-project ingestion + vektorizálás
- [ ] HelloCIA "10% finishing" task-decomposition + execution
- [ ] Mobil dashboard (PWA)

---

## 9. Adatfolyam-elvek (kanonikus)

1. **Action-log mindenütt** — minden réteg (CLI, server, agent, scripts) action-log entry-t emit minden műveletre. Vagy DB-be (server up) vagy file-ba (fallback).
2. **JSON envelope formátum** — minden CLI / API / agent output `{ ok, action, requestId, elapsedMs, result|error }`.
3. **Tier-gate központilag** — agent-output action-tier 0-3, dispatch-time érvényesítve (file-mód: `scripts/agent-handlers/src/tiers.ts`; server-mód: `server/src/_modules/tick-engine/tier-policy.const.ts`).
4. **Sleep-aware kötelező** — minden user-felé szóló trigger respect az alvás-állapotot.
5. **Build-it-ourselves** — FOSS only, no paid solutions (lásd `principles/`).
6. **FDP-konzisztens kód** — naming, imports, structure (CLAUDE.md globális).
7. **Backwards-compatible refactor** — file-state és server párhuzamos, nincs big-bang csere.

---

## 10. Hova mutatok vissza minden ticken / új session-ön

| Cél | Fájl |
|---|---|
| **Agent-belépés** | `__agent/triggers/A-mode-entrypoint.md` |
| **Snapshot** | `__agent/STATUS.md` |
| **History** | `__agent/log/actions/<today>.jsonl` |
| **Architektúra** (ez a fájl) | `current/architecture.md` |
| **Workflow contract** | `__agent/plans/triggering-A-mode-health-check.plan.md` |
| **Életcélok** | `current/life-goals.md` |
| **Projektek + szorzók** | `current/projects.md` |
| **Alapelvek index** | `current/principles/` |
| **Open kérdések** | `current/open-questions.md` |
| **FR-ek** | `current/feature-requests/` |

**Új feature gondolkodása mindig itt kezdődik:**
1. Melyik **layer** (L1-L5)?
2. Van-e már **FR** rá?
3. Mi a **dependency**?
4. **Ki** építi (én vagy másik agent)?
