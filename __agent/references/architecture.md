# my-assistant — tri-tier architecture (implementációs referencia)

**Last verified:** 2026-05-08
**Status:** Phase 1 ship-elve (cli + server + client skeleton)
**Forrás-plan:** [`../plans/refactor-tri-tier.plan.md`](../plans/refactor-tri-tier.plan.md)

> **Magasszintű rendszer-térkép** (5 layer modell, FR-mapping, roadmap,
> felelősségi mátrix) → lásd: [`../../current/architecture.md`](../../current/architecture.md)
>
> Ez a fájl a **konkrét impl-részleteket** tartja: tri-tier kódszerkezet,
> endpoint-tábla, source layout, cutover tervezet.

A my-assistant rendszer **3 fő almappára** tagolódik, mind az FDP minta szerint felépítve. A három projekt egymással HTTP-n / shell-en kommunikál — egyik sem importálja a másikat fordítási időben.

---

## Toplevel

```
my-assistant/
├── __agent/                        # GOVERNANCE (workflow, status, plans, references)
├── current/                        # USER LIVE STATE (principles, FRs, diary, ...)
├── cli/                            # ★ TS Node CLI — `ma cast {discover|notify|volume|preset}`, `ma spotify {auth|status}`
│   └── scripts/                    # project-helper scripts (update-fo.ps1, action-log/, agent-handlers/) — moved here 2026-05-08
├── server/                         # ★ Express + SQLite — tick-engine, action-log, activity-ingest
│   └── activity-monitor/           # PowerShell logger (OS-bound, ingests into this server) — moved here 2026-05-08
├── client/                         # ★ Angular 18 — UI for status, action-log, user-input
├── README.md
├── CLAUDE.md
└── pipeline.config.json                # ★ workspace-level LDP (`dc ldp` runs this)
```

> Per-sub-project **CDP** (`pipeline.cicd.config.json`) él külön a `cli/`, `server/`, `client/` mappákban.
> A root-szintű **LDP** (`pipeline.config.json`) mindhárom layert egyszerre építi és teszteli, és restart-olja a server-t változás után.

### Pipeline-ok (FDP konvenció: CDP + LDP páros)

| Pipeline | Hol | Mit fut | Hogyan |
|---|---|---|---|
| **LDP** (Live Dev) | `my-assistant/pipeline.config.json` | watch `cli/src`, `server/src`, `client/src` → 8-step build+test (cli → server → client) → restart `node server/dist/index.js` | `dc ldp` a root-ból |
| **CDP-cli** | `cli/pipeline.cicd.config.json` | install → build → test → coverage → discord-notify | `dc cdp` cli/-ben (push-trigger) |
| **CDP-server** | `server/pipeline.cicd.config.json` | install → build → test → coverage → discord-notify | `dc cdp` server/-ben (push-trigger) |
| **CDP-client** | `client/pipeline.cicd.config.json` | install → build → test → coverage → discord-notify | `dc cdp` client/-ben (push-trigger) |

**Az LDP minta partner-je:** `LIVE-projects/organizer/pipeline.config.json` (organizer's full-stack LDP) — ami csak `server/` és `client/`-et watch-ol; mi 3 layert (`cli/` is). debounce 30s, server-grace 120s, step-timeout 10min — ugyanaz.

---

## 1. cli/  → `@my-assistant/cli` (`ma`)

| | |
|---|---|
| **Bin** | `ma` |
| **Stack** | TS ESM, Node 20+, tsx (dev) + tsc (build) |
| **Output** | JSON envelope (`{ok, action, requestId, elapsedMs, result\|error}`) — matches `fo` CLI |
| **Action-log** | Every invocation emits to `__agent/log/actions/<day>.jsonl` |
| **Pattern partner** | `LIVE-projects/organizer-cli/cli/` |
| **Tests** | jasmine + c8 (21 specs) |
| **CI/CD** | `cli/pipeline.cicd.config.json` — install → build → test → coverage |

### Subcommand tree
```
ma cast    {discover, notify, volume, preset, list-interfaces}
ma spotify {auth, status}
```

### Source layout (FDP-shaped)
```
cli/src/
├── main.ts                         # two-level dispatch (group → subcommand)
├── commands/                       # 1 file per subcommand
├── cast/                           # cast protocol domain (cast-client, discover, mp3-server, tts, volume, groups, presets, notify-orchestrator)
├── spotify/                        # web API client + OAuth flow
├── output/                         # JSON envelope helpers
├── action-log/                     # writer that walks up to find __agent/log/actions/
└── utils/                          # parse-args helpers
```

### What's gone
- `cast-notifier/` — fully migrated. Source moved into `cli/src/cast/` and `cli/src/spotify/`. Old folder deleted.

---

## 2. server/  → `@my-assistant/server` (Express + SQLite)

| | |
|---|---|
| **Port** | `39245` (default, configurable via `MA_SERVER_PORT`) |
| **Bind** | `127.0.0.1` (loopback-only by default; non-loopback requires `MA_AUTH_TOKEN`) |
| **DB** | SQLite via `better-sqlite3` — file at `server/data/my-assistant.db` (gitignored) |
| **Schema** | Auto-migrating; version tracked in `schema_meta` table |
| **Pattern partner** | `LIVE-projects/organizer/server/` |
| **Tests** | jasmine + c8 (20 specs) |
| **CI/CD** | `server/pipeline.cicd.config.json` |

### Endpoints (Phase 1)

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | DB readiness probe |
| GET | `/status` | server-wide snapshot (latest tick, activity, recent actions) |
| POST | `/tick` | A-mode dispatcher — validates AgentOutput JSON, persists, runs handlers |
| GET / POST | `/actions` | action-log list + append (replaces JSONL file write) |
| GET / POST / PATCH | `/user-input` | user-input blocks ([NEW] → [DONE] flow) |
| POST | `/activity-sample` | activity-monitor ingest |
| GET | `/notification/pending` | undelivered queue (during sleep) |
| POST | `/notification/throttle/check` | de-dup gate |

### Source layout (FDP backend pattern)
```
server/src/
├── _assets/
├── _collections/                   # environment.ts (config)
├── _enums/                         # tick-verdict, action-status, user-input-status, server-route
├── _models/
│   ├── data-models/                # 8 DAOs (one per SQLite table)
│   ├── control-models/             # transient DTOs
│   └── interfaces/                 # envelope, agent-action contracts
├── _modules/
│   ├── action-log/                 # write API to actions table
│   ├── tick-engine/                # validator + tier-policy + dispatch
│   └── activity-ingest/            # sample → DB + sleep inference
├── _routes/                        # 7 controllers (one folder each)
├── _services/
│   ├── api-services/
│   ├── control-services/           # envelope helpers
│   └── core-services/              # auth + db
├── app.server.ts                   # Express init + route registration
└── index.ts                        # process entry
```

### Migration phase from file-state

Phase 1 (now): server runs in parallel with `__agent/log/actions/*.jsonl`, `__agent/state/agent-tick.json`, `scripts/agent-handlers/`. Both work; both are sources of truth.

Phase 2: client wrappers POST to server first, file-write as fallback.

Phase 3: file-state retired.

See `current/feature-requests/server-app-architecture.md`.

---

## 3. client/  → `@my-assistant/client` (Angular 18)

| | |
|---|---|
| **Port (dev)** | `4224` (`ng serve`) |
| **Stack** | Angular 18.2, NgModule mode, Karma + Jasmine |
| **Pattern partner** | `LIVE-projects/organizer/client/` |
| **Tests** | karma + jasmine + headless Chrome (7 specs) |
| **CI/CD** | `client/pipeline.cicd.config.json` |

### Modules (Phase 1)

| Module | Path | Status |
|---|---|---|
| **status** | `/status` | placeholder — calls `GET /status` and renders the snapshot |

Future modules (Phase 2): `actions`, `user-input`, `activity`, `recurring`.

### Source layout (FDP frontend pattern)
```
client/src/app/
├── _collections/                   # api-config.const.ts
├── _components/                    # global components prefixed `a-`
├── _enums/                         # a-route, a-storage-key
├── _interceptors/                  # a-auth (Bearer), a-error (global log)
├── _models/                        # server-envelope.interface.ts
├── _modules/                       # feature modules (lazy-loaded)
│   └── status/
│       ├── status.module.ts
│       └── _components/s-home/
├── _services/
│   └── api-services/a-server.api-service.ts
├── _styles/
├── app.component.{ts,html,scss}
├── app.module.ts
└── app.routing-module.ts
```

---

## How they connect

```
                    ┌──────────────────┐
                    │   client (UI)    │
                    │  Angular @ 4224  │
                    └─────────┬────────┘
                              │ HTTP (envelope)
                    ┌─────────▼────────┐
       ┌─────HTTP──▶│   server (API)   │◀──HTTP──┐
       │           │  Express @ 39245 │         │
       │           │   SQLite DB      │         │
       │           └─────────┬────────┘         │
       │                     │                  │
       │                     ▼                  │
       │              writes/reads              │
       │           server/data/*.db             │
       │                                        │
   ┌───┴────┐                              ┌────┴───────────┐
   │  cli   │                              │activity-monitor│
   │(`ma`)  │                              │   (PS logger)  │
   └────────┘                              └────────────────┘
       │                                        │
       └────emit────▶ __agent/log/actions/ ◀────┘
                  (file fallback during Phase 1)
```

---

## Setup (single new machine)

```bash
# 1. CLI
cd cli
pnpm install
pnpm run build-base
npm i -g --force                    # install `ma` globally
ma --help

# 2. Server
cd ../server
cp .env.sample .env                 # optional — defaults work for loopback dev
pnpm install
pnpm run build-base
pnpm start &                        # listens on 127.0.0.1:39245

# 3. Client
cd ../client
pnpm install
pnpm run build-base
pnpm start                          # browser at http://127.0.0.1:4224
```

All three run independently. Lokál dev: server runs in background, cli writes to action-log directly, client polls server.

---

## Tests + CI/CD parity (FDP minta-konzisztencia)

| Project | Test framework | Coverage | CI/CD config |
|---|---|---|---|
| cli | jasmine 5 | c8 (text + lcov + html) | `cli/pipeline.cicd.config.json` |
| server | jasmine 5 | c8 (text + lcov + html) | `server/pipeline.cicd.config.json` |
| client | karma + jasmine | karma-coverage | `client/pipeline.cicd.config.json` |

Mindhárom CI/CD pipeline ugyanazt a 7-step mintát követi (organizer-cli mintát):
1. discord-start
2. install
3. build
4. test
5. coverage
6. pipeline-report (Overseer)
7. discord-result

---

## Naming convention összegzés

| Artifact | Pattern | Példa |
|---|---|---|
| CLI subcommand file | `<name>.command.ts` | `discover.command.ts` |
| CLI domain helper | `<name>.ts` (under `<domain>/`) | `cast/cast-client.ts` |
| Server controller | `<entity>.controller.ts` | `tick.controller.ts` |
| Server data-model (DAO) | `<entity>.data-model.ts` | `agent-tick.data-model.ts` |
| Server module class | `<Name>_Module` | `TickEngine_Module` |
| Server enum | `<name>.enum.ts` | `tick-verdict.enum.ts` |
| Client component class | `<Prefix>_<Name>_Component` | `S_Home_Component` |
| Client component selector | `<prefix>-<name>` | `s-home` |
| Client module class | `<Name>_Module` | `Status_Module` |
| Client interceptor | `A_<Name>_Interceptor` | `A_Auth_Interceptor` |
| Client service | `<Prefix>_<Name>_<Type>` | `A_Server_ApiService` |
| Test file | `<name>.spec.ts` | sibling of source |

---

## Sub-projektekbe szervezett dolgok (2026-05-08 reorg)

| Eredeti hely | Új hely | Miért |
|---|---|---|
| `activity-monitor/` (root) | `server/activity-monitor/` | A logger a server-re POST-ol (ingestion endpoint), tartozzon hozzá szervezetileg |
| `scripts/` (root) | `cli/scripts/` | A scriptek többségét CLI-szintű automatizációk hívják (update-fo, action-log writer trio, agent-handlers dispatcher); a CLI-be tartoznak |

### Részletek

- **`server/activity-monitor/`** — Marad PowerShell (Win32 API, OS-bound). NEM TS-be portoljuk. A samples továbbra is a `server/activity-monitor/data/` mappába megy (gitignored), a lifecycle event-ek a központi `__agent/log/actions/`-ba.
- **`cli/scripts/update-fo.ps1`** — `fo` CLI globális frissítés (organizer-cli telepítés). Nem `ma` subcommand, project-helper marad.
- **`cli/scripts/action-log/`** — DEPRECATED, `.claude/settings.json` hookok ezt hívják (path frissítve a settings.json-ban). Phase 2 cutover: hookok → server POST (`/actions`).
- **`cli/scripts/agent-handlers/`** — DEPRECATED, CCAP / cron közvetlenül hívja (`node cli/scripts/agent-handlers/src/dispatch.ts`). Phase 2 cutover: server POST (`/tick`).

### Mi NEM költözik soha

- `__agent/` — Governance
- `current/` — User live state
- root-level `pipeline.config.json` — workspace-szintű LDP, mindhárom layer-t koordinálja
