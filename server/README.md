# `@my-assistant/server`

Express + SQLite backend for the my-assistant ecosystem. **FDP-shaped (organizer/server-mintát követi),** SQLite via `better-sqlite3` (zero-infra, FOSS-only).

Replaces what used to live in:
- `cli/scripts/agent-handlers/` (A-mode dispatcher) → `_modules/tick-engine/`
- `cli/scripts/action-log/lib.ts` (file-write log) → `_modules/action-log/` + `actions` table
- `server/activity-monitor/data/*.jsonl` (PS file write) → `_routes/activity-sample/` ingest endpoint + `activity_samples` table

Forrás-FR: `current/feature-requests/server-app-architecture.md`.

---

## Sub-folders

- **`src/`** — Express + SQLite TS forrás (FDP backend layout, lásd lentebb)
- **`activity-monitor/`** — Windows-host PowerShell logger; percenként mintát vesz az aktív ablak / process / idle-time-ról és POST-olja a `/activity-sample` endpoint-ra. Lásd `server/activity-monitor/README.md`.
- **`spec/support/`** — jasmine config
- **`data/`** — SQLite DB file (gitignored)

---

## Folder layout (FDP backend pattern)

```
server/
├── src/
│   ├── _assets/                       # static assets (empty for now)
│   ├── _collections/
│   │   └── environment.ts             # env config (port, db path, auth token, bind host)
│   ├── _enums/
│   │   ├── action-status.enum.ts      # ok | failed | skipped
│   │   ├── tick-verdict.enum.ts       # urgens | soft-nudge | no-action
│   │   ├── user-input-status.enum.ts  # new | done | dropped
│   │   └── server-route.enum.ts       # canonical HTTP paths
│   ├── _models/
│   │   ├── data-models/               # one DAO per SQLite table
│   │   │   ├── agent-tick.data-model.ts
│   │   │   ├── action.data-model.ts
│   │   │   ├── user-input.data-model.ts
│   │   │   ├── notify-throttle.data-model.ts
│   │   │   ├── pending-notification.data-model.ts
│   │   │   ├── sleep-event.data-model.ts
│   │   │   ├── recurring-state.data-model.ts
│   │   │   └── activity-sample.data-model.ts
│   │   ├── control-models/            # transient DTOs (added on demand)
│   │   └── interfaces/
│   │       ├── envelope.interface.ts  # JSON envelope contract (matches `fo` CLI)
│   │       └── agent-action.interface.ts  # AgentOutput / AgentAction types
│   ├── _modules/
│   │   ├── action-log/                # action-log writer (server side)
│   │   ├── tick-engine/               # validate → tier-gate → dispatch
│   │   │   ├── agent-output.validator.ts
│   │   │   ├── tier-policy.const.ts
│   │   │   └── tick-engine.module.ts
│   │   └── activity-ingest/           # activity-monitor sample handler + sleep-window inference
│   ├── _routes/                       # one folder per domain endpoint
│   │   ├── healthz/
│   │   ├── tick/
│   │   ├── action/
│   │   ├── user-input/
│   │   ├── status/
│   │   ├── activity-sample/
│   │   └── notification/
│   ├── _services/
│   │   ├── api-services/              # outbound API clients (none yet)
│   │   ├── control-services/
│   │   │   └── envelope.control-service.ts
│   │   └── core-services/
│   │       ├── auth.core-service.ts   # bearer token middleware
│   │       └── db.core-service.ts     # SQLite + migrations
│   ├── app.server.ts                  # Express init + route registration
│   └── index.ts                       # process entry, env load, listen
├── spec/support/jasmine.json          # test runner config
├── pipeline.cicd.config.json          # FDP CI/CD pipeline
├── package.json
├── tsconfig.json
├── .env.sample
├── .gitignore
└── README.md
```

---

## Setup

```bash
cd server
cp .env.sample .env       # optional — defaults work for loopback dev
pnpm install
pnpm run build-base
pnpm test
pnpm start                # node dist/index.js
# or:
pnpm run start-dev        # tsx watch (rebuild on save)
```

---

## Endpoints (Phase 1)

| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | `/healthz` | — | `{ status, schemaVersion, uptimeSeconds }` |
| GET | `/status` | — | server snapshot (latest tick, activity state, recent actions) |
| POST | `/tick` | AgentOutput JSON | DispatchResult (validation + execution detail) |
| GET | `/actions` | `from?, to?, kind?, actor?, limit?, offset?` | paged action-log items |
| POST | `/actions` | `{ actor, kind, summary, ... }` | new action row |
| GET | `/user-input` | `status=new\|done\|dropped` | user-input blocks |
| POST | `/user-input` | `{ title, kind, body, domain?, source? }` | new row |
| PATCH | `/user-input/:id` | `{ status }` | updated row |
| POST | `/activity-sample` | `{ ts, idleSeconds, processName?, windowTitle? }` | stored row + auto-derived sleep events |
| GET | `/notification/pending` | — | undelivered queue |
| POST | `/notification/throttle/check` | `{ throttleId, minIntervalMs, text? }` | `{ shouldFire, previousFiredAt }` |

Every response is a JSON envelope: `{ ok, action, requestId, elapsedMs, result\|error }`.

---

## Auth

- Loopback (127.0.0.1, default) — auth disabled, server trusts the local user
- Non-loopback bind — `MA_AUTH_TOKEN` env var REQUIRED, sent as `Authorization: Bearer <token>`
- GET endpoints over loopback always pass through (diagnostic-friendly)

---

## DB

SQLite via `better-sqlite3`. File default: `server/data/my-assistant.db` (gitignored).

Schema migration is built-in (`db.core-service.ts` — version-tracked, transactional). Adding a new column? Push a new entry onto the `MIGRATIONS` array; existing DBs auto-upgrade on next `getDb()` call.

WAL mode + foreign keys ON.

---

## Tests + coverage

```bash
pnpm test                 # build-base + jasmine
pnpm run test:coverage    # c8 (text + lcov + html)
```

Tests use `openDbAt(filePath)` against a temp DB so they don't touch the singleton.

---

## CI/CD

`pipeline.cicd.config.json` — FDP Overseer pipeline (install → build → test → coverage → discord-notify). Runs `dc cdp` locally or via push.

---

## Migration from file-based scripts

Phase 1 (now): server runs in parallel with `__agent/log/actions/*.jsonl` and `__agent/state/agent-tick.json`. Both are sources of truth — clients can write to either.

Phase 2: client wrappers (cli, activity-monitor, Claude hooks) switch to POSTing the server. File-based stays as fallback when server is down.

Phase 3: file state becomes archive-only.

Phase 4: file state retired.
