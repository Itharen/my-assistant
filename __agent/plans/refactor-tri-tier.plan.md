# Refactor: tri-tier (cli / server / client) — review & plan v0.1

**Status:** ✅ **SHIPPED 2026-05-08** — cli + server + client skeleton-ok kész, all builds zöld
**Closure note:** Phase 1-3 végrehajtva. Phase 4 docs lezárás. A részletes architectúra: [`../references/architecture.md`](../references/architecture.md). A `scripts/agent-handlers/` és `scripts/action-log/` DEPRECATED-jelölve, NEM törölve (live infra)
**Final test counts:** cli 21 specs ✅ · server 20 specs ✅ · client 7 specs ✅
**Created:** 2026-05-08
**Owner:** itharen3@gmail.com
**Forrás user-input:** "kéne csinálni egy CLI mappát, és oda áthelyezni a caster eszközt. … kéne csinálni egy szerver mappát, ahova a monitoring-nak a feature-jeit kell áttegyük. És fontos, hogy a CLI is, meg a szerver is, meg akkor már csináljunk egy klient kezdeményt is, amik pontosan ugyanarra a patternre épüljenek, mint az összes többi projektünk."

---

## 1. Executive summary

Jelenleg **5 különálló sub-projekt** van a my-assistant root-ja alatt (cast-notifier, activity-monitor, scripts/action-log, scripts/agent-handlers, scripts/update-fo.ps1). Ezek **nem követik az FDP minta** szerinti egységes szerkezetet.

A javasolt cél-struktúra: **3 fő almappa** (`cli/`, `server/`, `client/`), mindegyik az FDP pattern-t követi (`organizer-cli/cli`, `organizer/server`, `organizer/client` mintáját).

**Effort becslés:** kb. 4-6 óra végrehajtás, **ha** előbb 3 architektúra-döntést meghozunk (lásd 5. szakasz).

---

## 2. Current state inventory

### 2.1 Root-level sub-projektek

| Projekt | Típus | Fájlok | LoC (kb.) | Állapot |
|---|---|---|---|---|
| `cast-notifier/` | TS Node CLI | 13 src + 4 config | ~1500+ | Aktív, working |
| `activity-monitor/` | PowerShell logger | 1 ps1 + README | ~115 | Aktív, working |
| `scripts/action-log/` | TS lib + PS hooks | 3 fájl | ~200 | Aktív, working |
| `scripts/agent-handlers/` | TS dispatcher (saját pkg!) | 14 TS + 3 sample | ~600 | MVP shipped (3 handler) |
| `scripts/update-fo.ps1` | PS utility | 1 fájl | ~80 | Aktív, working |

### 2.2 cast-notifier — részletek

**Subcommandok:** `discover`, `notify`, `volume`, `list-interfaces`, `preset`, `spotify-status`, `spotify:auth`

**Stack:** TS ESM, tsx (dev) + tsc (build), `castv2-client`, `bonjour-service`, `msedge-tts`, `nodejs-assistant`

**Megjegyzés:** ezt a "review" round-ban már részben hozzáigazítottam az organizer-cli pattern-hez (`outDir: dist`, `prep`/`build-base`/`build-n-test` scripts, `.d.ts` violation javítva inline típusokra). De **a folder-szerkezet még flat** (`src/*.ts`), nem `src/commands/`, `src/_services/` stb.

### 2.3 activity-monitor — részletek

**Mit csinál:** percenként logol (foreground process, window title, idle time) — PowerShell + Win32 API.

**Output:** `activity-monitor/data/YYYY-MM-DD.jsonl` (gitignored, privát)
**Lifecycle event-ek:** `__agent/log/actions/YYYY-MM-DD.jsonl`-be (közös)

**Inherently OS-bound:** Win32 `GetForegroundWindow`/`GetLastInputInfo` — PS5.1+ marad. **Nem** lehet TypeScript-re portolni egyszerűen.

### 2.4 scripts/agent-handlers — részletek

**Saját npm package** (`name: agent-handlers`, private), nem a root pkg része.

**Belépési pont:** `node src/dispatch.ts < agent-output.json`
**Felelősség:** A-mode agent JSON output-ját validálja és végrehajtja (kétszintű séma + tier check).

**Handler-ek:** `log` (T0), `user-input-new` (T1), `update-status` (T1), `notify-cast` (T2 placeholder), `task-create` (T2 placeholder), `task-update` (T2 placeholder).

### 2.5 scripts/action-log

**3 fájl:**
- `lib.ts` — TypeScript writer (cast-notifier importálja)
- `append.ps1` — PowerShell writer (activity-monitor + Claude hookok használják)
- `hook.ps1` — Claude Code SessionStart/UserPromptSubmit/PostToolUse/Stop hookok

**Output:** `__agent/log/actions/YYYY-MM-DD.jsonl` (közös tér, append-only).

### 2.6 Server FR — már van tervezet

`current/feature-requests/server-app-architecture.md` v1 — készen van, de **másik agent buildelni**. Endpoint-séma + DB séma + tech-stack ott definiálva. **Ha a refactor part of this**, akkor a server-skeleton az FR alapján készül.

---

## 3. Target structure — FDP pattern szerint

### 3.1 Top-level layout

```
my-assistant/
├── __agent/                # GOVERNANCE (változatlan marad)
├── current/                # USER STATE (változatlan marad)
├── cli/                    # ★ ÚJ — minden CLI tool ide
├── server/                 # ★ ÚJ — Express + DB persistent layer
├── client/                 # ★ ÚJ — Angular UI skeleton
├── activity-monitor/       # marad (OS-bound PS)
├── scripts/                # marad (project-level helper-ek: update-fo.ps1)
├── README.md
├── CLAUDE.md
└── ... (config-fájlok)
```

### 3.2 cli/ — javasolt szerkezet

**Pattern partner:** `LIVE-projects/organizer-cli/cli/`

```
cli/
├── bin/
│   └── ma.js                         # vagy fo-szerű, pl. "mam" (my-assistant master)
├── src/
│   ├── commands/                     # subcommandok per fájl, organizer-cli mintát követve
│   │   ├── cast-discover.command.ts
│   │   ├── cast-notify.command.ts
│   │   ├── cast-volume.command.ts
│   │   ├── cast-preset.command.ts
│   │   ├── cast-list-interfaces.command.ts
│   │   ├── spotify-auth.command.ts
│   │   ├── spotify-status.command.ts
│   │   └── (jövőbeli: server-tick, action-log, ...)
│   ├── cast/                         # cast-domain helpers (volt cast-notifier/src/)
│   │   ├── cast-client.ts            # volt cast.ts
│   │   ├── discover.ts
│   │   ├── server.ts                 # MP3 mini-server
│   │   ├── tts.ts
│   │   ├── volume.ts
│   │   ├── groups.ts
│   │   └── presets.ts
│   ├── spotify/
│   │   ├── spotify.client.ts         # volt spotify.ts
│   │   └── spotify-auth.flow.ts      # volt spotify-auth.ts
│   ├── output/
│   │   └── envelope.ts               # JSON envelope (volt envelope.ts)
│   ├── action-log/
│   │   └── action-log.client.ts      # volt action-log.ts (cast-notifier-ből)
│   ├── utils/
│   │   └── parse-args.helpers.ts     # numericOption, stringOption, parseList stb.
│   └── main.ts                       # CLI entry, dispatch a commands/-be
├── config/                           # marad (groups.json, spotify.json, ...)
├── package.json                      # @my-assistant/cli (vagy hasonló)
├── tsconfig.json
├── README.md
└── .gitignore
```

**Fő különbségek a jelenlegi cast-notifier-hez képest:**
1. Folder-szervezett `src/` — domain szerinti almappák (cast/, spotify/, output/, ...)
2. `commands/` mappa — subcommand-fájlok 1-1 fájlonként (organizer-cli mintát követve)
3. `bin/<command>.js` — globális telepíthetőség (later)
4. Helye: `cli/` (volt `cast-notifier/`)

### 3.3 server/ — javasolt szerkezet

**Pattern partner:** `LIVE-projects/organizer/server/`

```
server/
├── src/
│   ├── _assets/
│   ├── _collections/
│   │   └── environment.ts            # PORT, DB_URL, AUTH_TOKEN, TZ, ...
│   ├── _enums/
│   │   ├── action-status.enum.ts
│   │   ├── tick-verdict.enum.ts
│   │   └── server-route.enum.ts
│   ├── _models/
│   │   ├── data-models/              # Mongoose modellek a DB-hez
│   │   │   ├── agent-tick.data-model.ts
│   │   │   ├── action.data-model.ts
│   │   │   ├── user-input.data-model.ts
│   │   │   ├── notify-throttle.data-model.ts
│   │   │   ├── pending-notification.data-model.ts
│   │   │   ├── sleep-event.data-model.ts
│   │   │   └── recurring-state.data-model.ts
│   │   ├── control-models/
│   │   │   └── tick-input.control-model.ts
│   │   └── interfaces/
│   │       └── ...
│   ├── _modules/
│   │   ├── action-log/               # action-log writer logic
│   │   ├── tick-engine/              # tick-validator, dispatch
│   │   └── activity-ingest/          # activity-monitor adatfogadás
│   ├── _routes/
│   │   ├── _constants/
│   │   ├── tick/
│   │   │   ├── tick.controller.ts
│   │   │   └── tick.data-service.ts
│   │   ├── action/
│   │   │   ├── action.controller.ts
│   │   │   └── action.data-service.ts
│   │   ├── user-input/
│   │   │   ├── user-input.controller.ts
│   │   │   └── user-input.data-service.ts
│   │   ├── status/
│   │   │   ├── status.controller.ts
│   │   │   └── status.data-service.ts
│   │   ├── activity-sample/
│   │   │   ├── activity-sample.controller.ts
│   │   │   └── activity-sample.data-service.ts
│   │   ├── notification/
│   │   │   ├── notification.controller.ts
│   │   │   └── notification.data-service.ts
│   │   └── healthz/
│   │       └── healthz.controller.ts
│   ├── _services/
│   │   ├── api-services/
│   │   ├── control-services/
│   │   │   └── action-log.control-service.ts
│   │   └── core-services/
│   │       └── .auth-service.ts
│   ├── app.server.ts                 # Express init, route registration
│   └── index.ts                      # process entry
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

**Mit fed le:**
- A jelenlegi `scripts/agent-handlers/` dispatcher LOGIC-ja a `_modules/tick-engine/`-be migrálódik
- Az `__agent/log/actions/` JSONL helyett **DB tábla** (`actions` mongoose-modell)
- Az activity-monitor PS script a `POST /activity-sample` endpoint-ra POST-ol (helyette: `activity-monitor/data/`-ba ír file-t)
- Az FR `server-app-architecture.md` endpoint-jai mind itt élnek

**Migrációs út (file-state → DB):**
A FR-ben (`server-app-architecture.md`) lefektetett 4-fázisú rollout. **Phase 1 dual-write** alatt a régi rendszer marad, a server csak ír.

### 3.4 client/ — javasolt szerkezet

**Pattern partner:** `LIVE-projects/organizer/client/`

```
client/
├── src/
│   ├── app/
│   │   ├── _collections/
│   │   ├── _components/
│   │   │   ├── a-empty-data/
│   │   │   ├── a-error/
│   │   │   ├── a-login/                  # ha kell auth
│   │   │   └── a-loading/
│   │   ├── _enums/
│   │   │   ├── a-route.enum.ts
│   │   │   └── server-index.ts
│   │   ├── _interceptors/
│   │   │   ├── a-auth.interceptor.ts
│   │   │   └── a-error.interceptor.ts
│   │   ├── _models/
│   │   ├── _modules/
│   │   │   ├── action-log/                # view: actions stream + filter
│   │   │   ├── status/                    # view: STATUS snapshot + tick history
│   │   │   ├── user-input/                # CRUD: új/feldolgozandó input-ok
│   │   │   └── activity/                  # view: activity-monitor agg
│   │   ├── _services/
│   │   │   ├── api-services/              # HTTP calls a server-ünkre
│   │   │   ├── control-services/
│   │   │   └── data-services/
│   │   ├── _styles/
│   │   ├── app.component.ts
│   │   ├── app.module.ts
│   │   └── app.routing-module.ts
│   ├── assets/
│   ├── environments/
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
├── tsconfig.json
└── ... (Angular boilerplate)
```

**Skeleton scope:**
- Csak alapváz, **1 placeholder modul** (pl. `status/` ami a `GET /status`-t hívja és kirajzolja JSON-ban)
- Tailwind + Material — FDP minta szerint
- Auth: Phase 1-ben loopback-only, később FDP auth
- Port: `4201` v. `4213` (FDP konvenció: 421x)

---

## 4. Migration mapping — fájl szinten

### 4.1 cast-notifier → cli/

| Jelenlegi hely | Új hely | Művelet |
|---|---|---|
| `cast-notifier/src/index.ts` | `cli/src/main.ts` | move + refactor (commands/-be dispatcheljen) |
| `cast-notifier/src/cast.ts` | `cli/src/cast/cast-client.ts` | move |
| `cast-notifier/src/discover.ts` | `cli/src/cast/discover.ts` | move |
| `cast-notifier/src/server.ts` | `cli/src/cast/mp3-server.ts` | move + rename (clearer name) |
| `cast-notifier/src/tts.ts` | `cli/src/cast/tts.ts` | move |
| `cast-notifier/src/volume.ts` | `cli/src/cast/volume.ts` | move |
| `cast-notifier/src/groups.ts` | `cli/src/cast/groups.ts` | move |
| `cast-notifier/src/presets.ts` | `cli/src/cast/presets.ts` | move |
| `cast-notifier/src/spotify.ts` | `cli/src/spotify/spotify.client.ts` | move + rename |
| `cast-notifier/src/spotify-auth.ts` | `cli/src/spotify/spotify-auth.flow.ts` | move + rename |
| `cast-notifier/src/notify.ts` | `cli/src/cast/notify.orchestrator.ts` | move + rename |
| `cast-notifier/src/envelope.ts` | `cli/src/output/envelope.ts` | move |
| `cast-notifier/src/action-log.ts` | `cli/src/action-log/action-log.client.ts` | move + rename |
| `cast-notifier/config/*.json` | `cli/config/*.json` | move |
| `cast-notifier/package.json` | `cli/package.json` | refactor (új scripts) |
| `cast-notifier/tsconfig.json` | `cli/tsconfig.json` | move |
| `cast-notifier/README.md` | `cli/README.md` | refactor |
| (új) | `cli/src/commands/*.command.ts` | **CREATE** — egy fájl/subcommand |
| (új) | `cli/src/utils/parse-args.helpers.ts` | **CREATE** (kiemelni az index.ts-ből) |

### 4.2 scripts/action-log → server/ + cli/

| Jelenlegi hely | Új hely | Művelet |
|---|---|---|
| `scripts/action-log/lib.ts` | `cli/src/action-log/action-log.client.ts` (CLI fele) + `server/src/_modules/action-log/` (server fele) | **SPLIT** — egy klient + egy szerver szelvény |
| `scripts/action-log/append.ps1` | `server/scripts/append.ps1` | move (referenciaként marad PS-ig) |
| `scripts/action-log/hook.ps1` | `.claude/scripts/hook.ps1` (vagy server/scripts/) | move |

### 4.3 scripts/agent-handlers → server/

| Jelenlegi hely | Új hely | Művelet |
|---|---|---|
| `scripts/agent-handlers/src/dispatch.ts` | `server/src/_modules/tick-engine/dispatch.ts` | move |
| `scripts/agent-handlers/src/handlers/*` | `server/src/_modules/tick-engine/handlers/*` | move |
| `scripts/agent-handlers/src/schema.ts` | `server/src/_modules/tick-engine/schema.ts` | move |
| `scripts/agent-handlers/src/types.ts` | `server/src/_models/interfaces/agent-action.interface.ts` | move + rename |
| `scripts/agent-handlers/src/state.ts` | `server/src/_services/control-services/agent-state.control-service.ts` | move + rename |
| `scripts/agent-handlers/src/tiers.ts` | `server/src/_collections/tier-policies.const.ts` | move |
| `scripts/agent-handlers/src/paths.ts` | `server/src/_collections/paths.const.ts` | move |
| `scripts/agent-handlers/src/action-log.ts` | merged with action-log.control-service.ts | merge |
| `scripts/agent-handlers/test/*.json` | `server/src/_modules/tick-engine/__tests__/sample-*.json` | move |
| `scripts/agent-handlers/package.json` | (törlésre) — beolvad a server/ pkg-be | delete |
| `scripts/agent-handlers/tsconfig.json` | (törlésre) | delete |

### 4.4 activity-monitor (változás)

**Marad a helyén** — OS-bound PS, nem migrálódik server-be. **De:**
- A logger.ps1-be új capability: opcionálisan POST-ol a server-re (`POST /activity-sample`)
- Default: marad file-write (`activity-monitor/data/`)
- Ha a server fut: dual-write (file + HTTP)

### 4.5 scripts/update-fo.ps1

**Marad a helyén** — project-level helper, nem cli/server/client koncept.

---

## 5. Architektúra-döntések — user-input szükséges

Mielőtt egy sort is mozgatok, **3 kritikus döntés** kell:

### 5.1 ❓ FDP framework "full" vagy "lite"?

| Opció | Mit jelent | Pro | Con |
|---|---|---|---|
| **A. Full FDP** | `@futdevpro/fsm-dynamo`, `@futdevpro/nts-dynamo`, `@futdevpro/fdp-templates`, `@futdevpro/nts-fdp-templates` packages | Konzisztens minden FDP-projekttel; kész auth/error/log; CCAP/Overseer integrálható | Heavy dep; learning-curve; FDP-internal API-k változnak; build complexity nő |
| **B. FDP-shaped** | Ugyanaz a folder-layout + naming, de plain Express + Mongoose + saját logger | Lightweight; "build-it-ourselves" elvvel konzisztens; gyorsabb ship | Konvencióra ráhúzva nem teljes; később ha mégis FDP kell, ismét refactor |

**Javaslat:** **B. FDP-shaped** — illeszkedik a `current/principles/build-it-ourselves.md` + `no-paid-solutions.md` filozófiához. Ha később mégis kell, a folder-layout már stimmel.

### 5.2 ❓ Server DB: MongoDB vs PostgreSQL?

| Opció | Pro | Con |
|---|---|---|
| **MongoDB** | FDP minta; mongoose; flex-schema (jó az evolving action types-hoz) | Egy plus dep + Docker container |
| **PostgreSQL** | SQL aggregáció és reporting könnyebb; a FR-ben már SQL séma | Migration tool kell; schema rigid |
| **SQLite** | Zero infra; file-alapú; perfect single-user | Nincs FDP-konzisztencia |

**Javaslat:** **SQLite** — a my-assistant single-user, lokál; zero-cost (no-paid-solutions); a FR-féle SQL séma 1:1 átültethető. A később migrálható PostgreSQL-be ha tényleg cloud kell (FR Q-server-3).

### 5.3 ❓ CLI bin command name?

| Opció | Pro | Con |
|---|---|---|
| `ma` | Rövid, "my-assistant" rövidítés | Magyar "ma" (=today) félreérthető a doksiban |
| `mam` | "my-assistant master" | Ismeretlen, nem-FDP-szerű |
| `mast` | hangulatos | Nem-szakmai |
| `myassist` | Egyértelmű | Hosszú |
| `caster` | A user maga is "caster"-nek hívta | Csak a cast-funkcióra utal, túl szűk |

**Javaslat:** **`ma`** — rövid, a project-name-mel összhangban. A "ma" docs-konfliktust oldjuk azzal hogy a doksiban "ma CLI" vagy `my-assistant` teljes névként hivatkozunk rá.

---

## 6. Fázisos sequencing

### Phase 0 — döntés (most)
- 5.1, 5.2, 5.3 user-confirmation
- Ez a plan-fájl jóváhagyása

### Phase 1 — cli/ migration (1-2 óra)
- `cast-notifier/` → `cli/` move
- Folder-restructure (`src/cast/`, `src/spotify/`, `src/output/`, `src/action-log/`, `src/utils/`, `src/commands/`)
- `src/index.ts` split → `src/main.ts` + `src/commands/*.command.ts`
- `package.json` rebrand (`@my-assistant/cli` v. hasonló)
- `bin/ma.js` létrehozás
- Test: `pnpm typecheck` + smoke-test (`pnpm discover`)
- Update minden `current/principles/cast-notifier-defaults.md` jellegű hivatkozás
- Update CLAUDE.md path-ok

### Phase 2 — server/ skeleton (2-3 óra)
- `server/` skeleton FDP-shaped layout-tal
- `_routes/` 6-7 alap endpoint (tick, action, user-input, status, activity-sample, healthz)
- `_models/data-models/` 7 mongoose-szerű (vagy SQLite tábla) modell
- Express + adapter (SQLite javasolt)
- `index.ts` + `app.server.ts`
- `agent-handlers` dispatcher migráció ide (`_modules/tick-engine/`)
- Phase 1: dual-write (file + DB), nem big-bang
- README + smoke-test (curl-vel)

### Phase 3 — client/ skeleton (1-2 óra)
- Angular CLI-vel `ng new client` az FDP `_modules/_components/_services/` struktúrával manuálisan beállítva
- 1 placeholder modul (`status/`) ami a `GET /status`-t hívja
- Tailwind + Material setup
- Port: 4213 (vagy hasonló FDP-stílus)

### Phase 4 — wiring + docs (1 óra)
- `__agent/references/architecture.md` ÚJ — a tri-tier dokumentum
- Update `__agent/CONTEXT.md` és `CLAUDE.md` az új layout-tal
- `__agent/SOURCE_OF_TRUTH.md` bővítés: action-log forrása, status forrása, stb.
- Update `current/feature-requests/server-app-architecture.md` status: building → built (Phase 2 után)

---

## 7. Risks / open questions

- **Activity-monitor ↔ server**: ha a server nem fut, az activity-monitor file-write-ban marad. Backward-compat kérdés.
- **Action-log dual-write konflikt**: a Claude hookok (`hook.ps1`) most file-ba írnak. Refactor után server-re POST-olnak? Ha a server le van állítva, mi történik?
- **Agent-handlers self-test**: a `pnpm smoke` jelenleg a saját pkg-ben fut. Migration után a server `pnpm test` része kell legyen.
- **`cast-notifier-defaults.md` path-referencia**: minden hely ami `cast-notifier`-re hivatkozik update-elendő.
- **`scripts/agent-handlers/package.json` deletion**: ha a CCAP runtime ezt a path-ot hívja explicit (`node scripts/agent-handlers/src/dispatch.ts`), akkor break. Ellenőrizni kell hol van hivatkozva.

---

## 8. Final question to user

❓ Ha jóváhagyod a 3 architektúra-döntést (5.1-5.3), elkezdjem **Phase 1**-et (cli/ refactor) most? VAGY:
- (a) Csak a plan jóváhagyása + szakaszosan kérdezzek
- (b) Pakold össze a 3 phase-t egy rohamban
- (c) Csak a cli/-t most, server/ + client/ később

Default ajánlás: **(c)** — a cli/ refactor a "tested terrain", server/ skeleton egy nagyobb design-question (FR még nyitott), client/ pedig csak akkor érdekes, ha van mire nézni.
