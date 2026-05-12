# FR: Server-application + DB tervezet (más agent buildeli)

> **Forrás: a user szövege (2026-05-08 reggel).**
>
> "azt hiszem, hogy nem ártana, hogyha ennek lenne egy DB kapcsolata is,
> szóval akkor oda valószínűleg egy rendes szerver alkalmazást kéne csináljunk,
> amihez Abban egy tervezetet kéne elkészíteni, meg leírni, hogy mi mindent
> várunk el tőle, és majd átadom egy másik agentnek, hogy csinálja meg."
>
> ⚠️ **Az én scope-om: TERVEZET írása**, NEM build. A buildet a user másik
> agentnek adja át.

---

## Miért kell server-app

Jelenleg minden state file-alapú (`__agent/state/*.json`,
`__agent/log/actions/*.jsonl`, `current/*.md`). Ez Phase 1-re jó, de:

| Korlát | Példa |
|---|---|
| Konkurencia | 3 session (chat / cron / scripted) ugyanazt a fájlt írhatja → race |
| Lekérdezés | "hány tick volt a múlt héten" — JSONL-en grep, lassú nagy logon |
| Aggregáció | sleep-history × tick-verdict trendek → SQL-szerű kell |
| Cross-machine | ha a CCAP cloudban fut, a fájlok lokálban vannak → szinkron-pánasz |
| Throttle / queue persistencia | notify-throttle.json read-modify-write patternek romlanak |
| Skálázás | egy nap 24 tick × 5 action = 120 entry/nap; egy év = ~44 ezer; OK file-ban, de aggregátor szar |

Egy szerver-alkalmazás (DB-vel) ezeket megoldja.

---

## Mit várunk el (functional requirements)

### Endpoint-ok (core)

| Endpoint | HTTP | Cél |
|---|---|---|
| `POST /tick` | POST | Az A-mode dispatcher (most file-alapú) helyett ide POST-ol |
| `GET /state/agent-tick` | GET | utolsó tick state |
| `GET /actions?from=&to=` | GET | action-log paged + filter |
| `POST /actions` | POST | új action-log entry (a hookok ide POST-olnak action-log helyett) |
| `GET /user-input?status=new` | GET | nyitott user-input blokkok |
| `POST /user-input` | POST | új user-input blokk |
| `PATCH /user-input/:id` | PATCH | status update (`new` → `done`) |
| `GET /status` | GET | STATUS.md mezők strukturáltan |
| `PATCH /status` | PATCH | STATUS field update (next_action stb.) |
| `GET /notifications/pending` | GET | alvás-vége csomag — pending notifications queue |
| `POST /notifications/throttle/check` | POST | throttle-id ellenőrzés (utolsó kibocsátás óta) |
| `GET /sleep-window` | GET | jelenlegi alvás-state (sleep-system + activity-monitor inferálva) |
| `GET /recurring/due` | GET | aktuálisan esedékes recurring task-ok |

### Adat-modellek (DB séma vázlat)

```sql
-- Tick history
CREATE TABLE agent_ticks (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  verdict TEXT CHECK (verdict IN ('urgens', 'soft-nudge', 'no-action')),
  reason TEXT,
  input_digest TEXT,
  is_sleeping BOOLEAN,
  raw_output JSONB,
  duration_ms INT
);
CREATE INDEX idx_ticks_ts ON agent_ticks(ts DESC);

-- Action log (replaces JSONL)
CREATE TABLE actions (
  id BIGSERIAL PRIMARY KEY,
  tick_id BIGINT REFERENCES agent_ticks(id),
  ts TIMESTAMPTZ NOT NULL,
  actor TEXT NOT NULL,
  kind TEXT NOT NULL,
  summary TEXT NOT NULL,
  ref TEXT,
  extra JSONB,
  status TEXT  -- 'ok' | 'failed' | 'skipped'
);
CREATE INDEX idx_actions_ts ON actions(ts DESC);
CREATE INDEX idx_actions_kind ON actions(kind);

-- User input blocks
CREATE TABLE user_inputs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  domain TEXT,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'new',  -- 'new' | 'done' | 'dropped'
  processed_at TIMESTAMPTZ,
  source TEXT  -- 'user' | 'agent'
);

-- Notify throttle
CREATE TABLE notify_throttle (
  throttle_id TEXT PRIMARY KEY,
  last_fired_at TIMESTAMPTZ NOT NULL,
  text TEXT
);

-- Pending notifications (alvás-vége csomag)
CREATE TABLE pending_notifications (
  id BIGSERIAL PRIMARY KEY,
  queued_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  payload JSONB NOT NULL,
  delivered_at TIMESTAMPTZ
);

-- Sleep events (wake/sleep markers)
CREATE TABLE sleep_events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  kind TEXT CHECK (kind IN ('wake', 'sleep', 'inferred-sleep', 'inferred-wake')),
  source TEXT  -- 'user-chat' | 'sleep-monitor' | 'activity-monitor-infer'
);

-- Recurring task tracking
CREATE TABLE recurring_state (
  task_key TEXT PRIMARY KEY,  -- e.g. 'cleaning', 'walk', 'food-order'
  last_done_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ,
  miss_count INT DEFAULT 0
);
```

### Auth

- Lokál (loopback) → no auth Phase 1-re
- Cloud → Bearer token (env-ből)
- A `fo`-CLI mintáját követjük (encrypted store)

### Observability

- `/healthz` endpoint
- Strukturált log (JSON, az action-log-formával kompatibilis)
- Prometheus metrics (opcionális, de jó volna): tick-count, action-count by status, sleep-window-aktiv-time

---

## Tech-stack javaslatok

| Komponens | Default | Alternatíva |
|---|---|---|
| Nyelv | **Node.js + TypeScript** (consistency a meglévő scripts/-tel) | Go / Rust ha perf-kritikus |
| Framework | **Express 4.x** vagy **NestJS** (FDP minta) | Fastify |
| DB | **MongoDB 8.x** (FDP minta, mongoose) | PostgreSQL ha SQL preferencia |
| Migráció | mongoose / TypeORM | — |
| Deploy | Docker Compose (FDP minta) | systemd / NSSM |
| Port | 39200-as tartomány (FDP minta nem ütközik) | bárhova |

⚠️ **FDP-konzisztencia ajánlott** — a globális `CLAUDE.md` (`E:/Programming/Own/CURSOR/CLAUDE.md`) FDP minták szerinti backend-ot vár (Express, MongoDB, mongoose, FDP-naming). Ha az másik agent ezt followolja, a meglévő dev-environment-be illeszkedik (Docker Compose, fdp-cli, stb.).

---

## Migrációs út (file-state → DB)

| Fázis | Mit | Hogyan |
|---|---|---|
| 0 | DB schema + endpoint-ok build | másik agent |
| 1 | Dispatcher dual-write: ÍR mind file-ba mind DB-be | én (workflow-bővítés) |
| 2 | Olvasás DB-ből | én |
| 3 | File-state read-only / archive | én |
| 4 | File-state retire | én |

→ Nincs **big-bang** csere. A meglévő MVP működik, lépésenként cserélünk.

---

## Mit NE csináljon a server-app

- Ne hívjon Claude API-t (a CCAP dolga)
- Ne futtasson cron-t (CCAP / system scheduler)
- Ne legyen "intelligens" — ez egy **dumb persistent layer**, nem agent

---

## Hand-off package (a build-elő agent kapja)

Amikor az másik agentnek átadod ezt:

1. **Ezt az FR-t** (kontextus + endpoint + séma)
2. **`__agent/triggers/A-mode-entrypoint.md`** (mit fog hívni)
3. **`scripts/agent-handlers/src/types.ts`** (action JSON kontrakt)
4. **`scripts/agent-handlers/src/schema.ts`** (validáció minta)
5. **`__agent/log/actions/README.md`** (action-log formátum)
6. **`current/principles/build-it-ourselves.md`** + **`no-paid-solutions.md`** (univerzális constraint)
7. **A globális `CLAUDE.md`** (FDP-konvenciók)

---

## Open kérdések

❓ Q-server-1: Mongo vs PostgreSQL?
❓ Q-server-2: Egy server-app az egész my-assistant rendszernek, vagy modul-szintűen több?
❓ Q-server-3: Cloud vagy on-prem? (latency, pénz, secret-handling)
❓ Q-server-4: Saját repo, vagy a my-assistant/server alá?
❓ Q-server-5: API-design: REST elég, vagy GraphQL/gRPC kell későbbi cross-language usage miatt?
❓ Q-server-6: A "másik agent" — CCAP via the agent-system, vagy ad-hoc Claude session?

---

## Status

✅ **Phase 1 implementálva** (2026-05-08, másik agent által).

**Hely:** `server/` — `@my-assistant/server`.

**Stack:** Express + TypeScript + better-sqlite3 (SQLite) — eltér az itt
javasolt MongoDB-től, **de jobb választás** zero-infra (no Mongo daemon, single
file DB, gyorsabb dev, könnyebb backup). Az FDP-pattern viszont megőrizve:
`_modules/`, `_models/data-models/`, `_routes/`, FDP naming.

**Implementált endpoint-ok:** `/healthz`, `/status`, `POST /tick`, `/actions` (GET+POST), `/user-input` (GET+POST+PATCH), `POST /activity-sample`, `/notification/pending`, `POST /notification/throttle/check`.

**8 DB-tábla:** `agent_ticks`, `actions`, `user_inputs`, `notify_throttle`,
`pending_notifications`, `sleep_events`, `recurring_state`, `activity_samples`.

**Auth:** loopback = no auth, non-loopback = `MA_AUTH_TOKEN` Bearer.

**Részletek:** `server/README.md`. Architektúra-mapping: `current/architecture.md` L4.

A migrációs flow Phase 1-2-3-4 él (file-fallback aktív, dual-write Phase 2-höz).
