# Modul: `server/` — `@my-assistant/server`

**Pattern partner:** `LIVE-projects/organizer/server/` (FDP-shaped lite)
**Implementációs referencia:** `__documentations/ARCHITECTURE.md` 2. szakasz + [`server/README.md`](../../server/README.md).
**Forrás-FR:** `current/feature-requests/server-app-architecture.md`

---

## 1. Cél

Express + SQLite backend a my-assistant ecosystem persistent állapotának. **FDP-shaped lite**: az FDP backend folder layout-ot tükrözi (`_routes/`, `_models/`, `_services/`, `_modules/`, `_collections/`, `_enums/`), de **NEM** importál `@futdevpro/*` packages-t (Build-it-ourselves elv).

## 2. Tárolás

- **DB:** SQLite via `better-sqlite3`, file `server/data/my-assistant.db` (gitignored)
- **Migration:** auto-migrate `db.core-service.ts`-ben, version-tracked `schema_meta` táblán
- **WAL mode + foreign keys ON**

## 3. Endpointok (Phase 1)

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | DB readiness probe |
| GET | `/status` | server-wide snapshot (latest tick, activity, recent actions) |
| POST | `/tick` | A-mode dispatcher — validates AgentOutput JSON, persists, runs handlers |
| GET / POST | `/actions` | action-log list + append (replaces JSONL file write) |
| GET / POST / PATCH | `/user-input` | user-input blokkok ([NEW] → [DONE] flow) |
| POST | `/activity-sample` | activity-monitor PowerShell logger ingest |
| GET | `/notification/pending` | undelivered queue (alvás alatt accumulated) |
| POST | `/notification/throttle/check` | de-dup gate |

Minden válasz JSON envelope: `{ ok, action, requestId, elapsedMs, result | error }` — a CLI mintáját követi, hogy a két layer kompatibilis legyen.

## 4. Auth

- **Loopback (127.0.0.1, default):** auth disabled, server trusts the local user
- **Non-loopback bind:** `MA_AUTH_TOKEN` env var REQUIRED, `Authorization: Bearer <token>`
- GET endpoints loopback-on mindig pass-through (diagnosztikai célra)

## 5. Konfig (`server/.env.sample`)

| Env var | Default | Leírás |
|---|---|---|
| `MA_SERVER_PORT` | `39245` | TCP listen port (FDP konvenció: 39XY5 tartomány) |
| `MA_BIND_HOST` | `127.0.0.1` | Bind cím (loopback default) |
| `MA_DB_PATH` | `data/my-assistant.db` | SQLite file path (relatív a server/ root-hoz) |
| `MA_AUTH_TOKEN` | `""` | Bearer token (kötelező ha non-loopback bind) |

## 6. Adat-modellek (8 SQLite tábla)

| Tábla | DAO osztály | Forrás-szabály / use case |
|---|---|---|
| `agent_ticks` | `AgentTick_DataModel` | A-mode tick history (verdict, reason, raw output, duration) |
| `actions` | `Action_DataModel` | Action-log entries (replaces `__agent/log/actions/*.jsonl`) |
| `user_inputs` | `UserInput_DataModel` | `[NEW]` / `[DONE]` blokkok USER_INPUT.md-ből |
| `notify_throttle` | `NotifyThrottle_DataModel` | De-dup throttle (per `throttle_id`) |
| `pending_notifications` | `PendingNotification_DataModel` | Alvás-alatti queue (drain on wake) |
| `sleep_events` | `SleepEvent_DataModel` | Wake / sleep markerek (user-stated + activity-infered) |
| `recurring_state` | `RecurringState_DataModel` | Recurring task state (last_done, next_due, miss_count) |
| `activity_samples` | `ActivitySample_DataModel` | activity-monitor sample-ek (1/min) |

## 7. Tick engine (POST /tick)

Az A-mode agent egy strukturált JSON-t (`AgentOutput`) küld. A server:

1. **Validate** — schema-check, max 5 action / tick, tier-konzisztencia, task-create description-ben "Forrás-szabály:" kötelező
2. **Tier gate** — minden action-en (sleep-window-ban Tier 0 fut, Tier 1+ skip; Tier 3 mindig blokkolva)
3. **Persist** — egy `agent_ticks` row + N `actions` row a tick-hez
4. **Execute** — ismert action-handler-ek futnak (`log` working, `user-input-new` / `update-status` / `notify-cast` / `task-create` / `task-update` Phase 2 placeholder)
5. **Response** — `DispatchResult` (succeeded / failed / skipped count + per-action detail)

Részletes tick-engine spec: [`../features/tick-engine.md`](../features/tick-engine.md).

## 8. Activity ingest

Az `activity-monitor` PowerShell logger percenként POST-ol egy mintát a `/activity-sample`-re. A server:

1. Tárol egy `activity_samples` row-t
2. Kiszámítja a sleep / wake event markereket (heuristic: ha `idleSeconds >= 8h`, `inferred-sleep`; következő `idleSeconds < 600s` → `inferred-wake`)
3. Ezek a `sleep_events` táblába mennek

Az activity-monitor a server **része** organizatórikusan (`server/activity-monitor/`), de PowerShell-ben marad (Win32 API). Részletes spec: [`../features/activity-monitoring.md`](../features/activity-monitoring.md).

## 9. Action-log

A server az action-log "ground truth" tárolásának canonical helye. Részletes spec: [`../features/action-log.md`](../features/action-log.md).

## 10. Migráció a file-state-ről

- **Phase 1 (jelenleg):** server párhuzamosan fut a file-alapú `__agent/log/actions/*.jsonl`-lel és a `cli/scripts/agent-handlers/`-rel. Mindkettő source-of-truth.
- **Phase 2:** `.claude/settings.json` hookok és a CCAP runtime cutover-elnek server-POST-ra (file fallback amikor a server le van állítva)
- **Phase 3:** file-state archive-only
- **Phase 4:** file-state retired

Forrás-FR: `current/feature-requests/server-app-architecture.md` (4-fázisú migrációs út).

## 11. Technikai elvárások

| Tétel | Érték |
|---|---|
| Stack | TS ESM, Express 4, better-sqlite3 11, Node 20+ |
| Dev | tsx watch |
| Build | tsc → `dist/` |
| Tests | Jasmine 5 + c8 |
| CI/CD | `server/pipeline.cicd.config.json` 7-step FDP minta |

## 12. Fájl-struktúra (FDP backend pattern)

```
server/
├── src/
│   ├── _assets/
│   ├── _collections/             # environment.ts (config)
│   ├── _enums/                   # tick-verdict, action-status, user-input-status, server-route
│   ├── _models/
│   │   ├── data-models/          # 8 DAOs (one per SQLite table)
│   │   ├── control-models/       # transient DTOs
│   │   └── interfaces/           # envelope, agent-action contracts
│   ├── _modules/
│   │   ├── action-log/           # write API to actions table
│   │   ├── tick-engine/          # validator + tier-policy + dispatch
│   │   └── activity-ingest/      # sample → DB + sleep inference
│   ├── _routes/                  # 7 controllers (one folder each)
│   ├── _services/
│   │   ├── api-services/
│   │   ├── control-services/     # envelope helpers
│   │   └── core-services/        # auth + db
│   ├── app.server.ts             # Express init + route registration
│   └── index.ts                  # process entry
├── activity-monitor/             # ★ PowerShell logger (Win32 API, ingests into this server)
├── spec/support/jasmine.json
├── pipeline.cicd.config.json
├── package.json
├── tsconfig.json
├── .env.sample
└── data/                         # SQLite DB (gitignored)
```

## 13. Kapcsolódó

- Implementációs referencia: `__documentations/ARCHITECTURE.md`
- Pattern audit: `__agent/references/pattern-audit.md`
- Forrás-FR: `current/feature-requests/server-app-architecture.md`
