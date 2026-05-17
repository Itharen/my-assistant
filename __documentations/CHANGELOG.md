# CHANGELOG — `my-assistant`

> Verzió-bump log. Minden release / jelentős milestone egy-egy entry. Format: SemVer + dátum + summary + linkek.

---

## 0.1.0 — 2026-05-08 — Initial tri-tier skeleton

**Sub-projekt verziók (mind 0.1.0):**
- `cli/package.json` → `@my-assistant/cli` v0.1.0
- `server/package.json` → `@my-assistant/server` v0.1.0
- `client/package.json` → `@my-assistant/client` v0.1.0
- `package.json` (root, monorepo) → `my-assistant` v0.1.0

**Highlights:**

- ✅ **Tri-tier monorepo** ship-elve (`cli/` + `server/` + `client/`) FDP minta szerint
- ✅ **Pattern audit:** Pattern-compliant in spirit and naming, 3 dokumentált architektúra-szintű deviation (FDP-shaped lite, lásd `__agent/references/pattern-audit.md`)
- ✅ **48 spec, 0 failure** (cli 21, server 20, client 7) Karma + Jasmine + c8 setupokkal
- ✅ **Pipeline-ok:** 3× CDP (`pipeline.cicd.config.json` per sub-project) + 1× LDP (`pipeline.config.json` root)
- ✅ **Action-log infrastruktúra:** lokál JSONL (`__agent/log/actions/`) + server SQLite tábla, dual-write Phase 1
- ✅ **Tick-engine MVP:** file-based dispatcher (`cli/scripts/agent-handlers/`) + server `POST /tick` endpoint kétszintű séma + tier-policy validálással
- ✅ **Activity ingest:** PowerShell logger `server/activity-monitor/` + server `POST /activity-sample` endpoint sleep/wake heuristic-kel
- ✅ **Reorg 2026-05-08:** `activity-monitor/` → `server/activity-monitor/`, `scripts/` → `cli/scripts/`
- ✅ **Workspace inventory:** `__agent/references/workspace-projects.md` 33 LIVE projekt + 12 NPM package + OGS-okat lefed
- ✅ **Root monorepo package.json** sub-projekt-delegate scriptekkel (prep, start = dc ldp, build, test, …)
- ✅ **`__specifications/` és `__documentations/`** struktúrák FDP minta szerint létrehozva

**Plan-ek lezárva:**
- `__agent/plans/refactor-tri-tier.plan.md` ✅ shipped 2026-05-08
- `__agent/plans/triggering-A-mode-health-check.plan.md` (v2 Phase 1 MVP shipped)

**Decisions:** lásd [`DECISIONS.md`](DECISIONS.md) DEC-MA-001..007.

**Tests:** cli 21 + server 20 + client 7 = 48 spec, 0 failure.

---

## 0.1.1 — 2026-05-09 — dc ldp Windows fix + port-allocation FDP-konvenció + reorg

**Highlights:**

- 🐛 **dc-dynamo Windows bug FIX** — `pipeline-entry.script.{ts,js}:344` `shell: 'true'` → `shell: true`. A `dc ldp` most működik Windows-on. Patch alkalmazva mind a workspace src-ben, mind a build-ben. Upstream FDP-PR előkészítve (TD-20260509-001).
- 📍 **Port allokáció FDP-konvenció szerint** — XY=24 slot lefoglalva: server `39245`, client `4224`, notif socket `39247`, service socket `39924` (Phase 2+). Igazodik a `port-env-settings.const.ts` mintához (lásd DEC-MA-009).
- ♻️ **Folder reorg** — `activity-monitor/` → `server/activity-monitor/`, `scripts/` → `cli/scripts/`. Top-level layout: csak `cli/`, `server/`, `client/` + governance (`__agent/`, `current/`, `__specifications/`, `__documentations/`).
- ✨ **Root monorepo `package.json`** — `pnpm prep`/`start`/`build`/`test` per sub-project delegate-ekkel.
- 📚 **`__specifications/` + `__documentations/`** — FDP-minta-szerinti business-spec + impl-doc mappák létrehozva (main, BACKLOG, TODO, modules, features + ARCHITECTURE, DECISIONS, CHANGELOG, dev/LOCAL_DEV_ENVIRONMENT, developments/, plans/).
- 🧹 **Temporary `concurrently`-workaround visszavonva** — sosem volt jó megoldás (nem-LDP, nincs build+test-on-save), csak a dc-bug kerülésére. A patch megoldja a gyökeret.

**Decisions:** lásd [`DECISIONS.md`](DECISIONS.md) DEC-MA-008 (dc bug fix + config-at-root rationale), DEC-MA-009 (port-allokáció).

**Tests:** cli 21 + server 20 + client 7 = 48 spec, 0 failure (variancia nélkül).

---

## 0.1.112 — 2026-05-16 — Wave UI + Socket-sync ship (cumulative cycle 51-68)

> **Megjegyzés:** a 0.1.2 → 0.1.111 közötti patch-bumpok (auto bump-version hook minden commit-ra) a részletes cycle-archívumban követhetők (`__agent/log/cycles/cycle-<N>.md`). Ez az entry az **összegző milestone** a 2 nagy FR funkcionális zárására.

**Sub-projekt verziók (mind 0.1.112):**
- `cli/package.json` → `@my-assistant/cli` v0.1.112
- `server/package.json` → `@my-assistant/server` v0.1.112
- `client/package.json` → `@my-assistant/client` v0.1.112
- `package.json` (root) → `my-assistant` v0.1.112

**Highlights — FR #3b-WAVE-UI Phase 2-4 ship (cycle 51-56):**

- 🌊 **Server unauth wave JSONL endpoints** — `GET /api/wave/get-from-jsonl` (read, Phase 2.A) + `POST /api/wave/log-public` (write + validáció + structured errorCodes, Phase 3.A) + `POST /api/wave/sync-jsonl` (bulk JSONL→DB sync, Phase 4.A) — `_collections/wave-jsonl.util.ts` + `_routes/wave/wave-jsonl.controller.ts`. AUTH BLOCKER bypass.
- 🩹 **Client 401 JSONL-fallback** — `D_Dashboard_ControlService.refresh()` 401 esetén automatikusan átvált a JSONL endpoint-ra (Phase 2.B) → wave-panel auth-token nélkül is megjelenik
- 🌊 **d-waves component enrichment** — mood + note + vector emoji context-card (Phase 2.C)
- 📝 **`D_WavesForm_Component`** (új standalone) — 3 level select + vector + mood + note + submit, JSONL útvonalon (Phase 3.B). Ack-wipe bug-fix cycle 65: `handleReset()` után setteljük az ack-et, különben null-ra wipe-olódott
- 🗄️ **Wave schema extension** — `level`, `wave_vector`, `mood`, `snapshotTs` (denormalizált snapshot-metadata, Phase 4 dual-write paralel JSONL + DB)
- 🔄 **Auto-sync hook** — `POST /log-public` után 3 idempotens DB-insert (Phase 4.B)

**Highlights — FR #3f socket-and-version-sync Phase 1-4 ship (cycle 57-60):**

- 🔌 **Server `VersionBroadcast_SocketServerService`** — `DyNTS_SocketServerService` extend (`@futdevpro/nts-dynamo/socket`), `getSocketServices()`-be regisztrálva (üres → 1 service). `server:hello` per-presence (Phase 2.A) + 30s tick `server:version` broadcast on package.json bump (Phase 2.B). **KRITIKUS:** path=`/socket` (DyNTS_defaultSocketPath, NEM Socket.IO default `/socket.io`).
- 🔌 **Client `A_Socket_ControlService`** — `DyFM_SocketClient_ServiceBase` extend (`@futdevpro/fsm-dynamo/socket`), `server:hello` + `server:version` handlerek → `A_Version_DataService` (Phase 3.A+3.B).
- 📊 **`S_StatusBar_Component`** (új standalone) — footer-sticky `srv vX · cli vY · ↻ HH:mm · ⚠ reload` (Phase 4.A).
- 🚨 **`S_VersionReloadBanner_Component`** (új standalone) — dev-mode (`isDevMode()`) silent 1s reload / prod-mode 5s countdown banner + Reload Now + Dismiss (Phase 4.B).

**Highlights — egyéb:**

- 🧪 **+47 client-test case** (cycle 62-65) — `A_Version_DataService` spec, `S_StatusBar` spec, `S_VersionReloadBanner` spec, `wave-jsonl-fallback.util` spec, `D_WavesForm_Component` spec
- 📚 **Architecture-ref doc-sync** (cycle 68) — socket-layer rows + test counts + cycle-roll-up header
- 📊 **M1 grooming + M2 daily report 2026-05-16** (cycle 61)
- 🚨 **`error-handling.md`** — univerzális zero-tolerance hard rule (AGB-2026-05-16-03)
- ✅ **`e2e-validation.md`** — új principle (AGB-2026-05-16-03, eszköz-választás külön user-OK)

**Plan-ek lezárva (Phase 1-4 functionally):**
- `wave-panel-ui.plan.md` Phase 2-4 ✅ shipped (cycle 51-56)
- `socket-and-version-sync.plan.md` Phase 1-4 ✅ shipped (cycle 57-60)
- Phase 5+6 mindkettőhöz külön green-light vár (AGB-2026-05-16-04 wave Phase 5a-d, AGB-2026-05-16-18 FR #3f Phase 5-6)

**Tests:** cli 26 + server 2 + client 60 = **88 spec, 0 failure** (volt: 21+20+7 = 48 a 0.1.1-nél; a server-test csökkenés a `DyNTS_AppExtended` switch + ESM-mig miatt — pattern shift LDP-integration testing felé)

**Cycle stats:** 18 cycle (51-68) egy napon belül; ~3000+ LOC delta; 14 ship-commit + 13 close-commit + 2 maintenance commit

**Decisions:** lásd [`DECISIONS.md`](DECISIONS.md) (új DEC-MA-* sorok pending — Q-WAVE-2/3 denormalized pattern, DyNTS path=/socket constraint, dev-silent reload UX)

---

## 0.1.171 — 2026-05-17 — FR #3g full ship + Wave/Socket Phase 5 + spec-coverage burst (cumulative cycle 69-108)

> **Megjegyzés:** ez a milestone két marathon-burst-öt fed le egy napon belül: AGB-19 zöldlámpa-flotta (Wave Phase 5, FR #3f Phase 5, FR #5/#8a Phase 1) és AGB-24 (Reports/Dev/User I/O panel teljes szériája Phase 1-6). 22 ship-commit + 18 close-commit, ~2500 LOC delta.

**Sub-projekt verziók (mind 0.1.171):**
- `cli/package.json` → `@my-assistant/cli` v0.1.171
- `server/package.json` → `@my-assistant/server` v0.1.171
- `client/package.json` → `@my-assistant/client` v0.1.171
- `package.json` (root) → `my-assistant` v0.1.171

**Highlights — Wave Phase 5 (cycle 80-89, AGB-2026-05-16-19 green-light):**

- 📈 **X-tengely density-aware ticks** (Phase 5a) — wave-panel x-tick formátum a range alapján (h/d/w/m)
- 📈 **Sin/cos least-squares fit overlay** (Phase 5b) — 3-paraméteres `y=A·sin(ωt)+B·cos(ωt)+C` regresszió, period-scan SSR-alapon, lunar default 29.5d (`wave-sinusoid-fit.util.ts`)
- 🎛 **Interval picker + localStorage persist** (Phase 5c) — user-választott rangeHours [1..24×365], `ma:wave-range-hours` kulcs
- 🖼 **Fullscreen toggle + ESC** (Phase 5d)
- 💬 **Per-point hover tooltip** (Phase 5e.1) — native tooltip (no Material dep)
- 🌫 **Wave marker overlay** (Phase 5e.2+.3) — `GET /api/wave/markers` action-log-szűrt (`event_class IN [törés, megoszló-erő, 3x3-trigger]`), kliens render emojikkel a chart-on (`wave-markers.util.ts` + `wave-markers.controller.ts`)

**Highlights — FR #3f Phase 5+6 socket-push (cycle 80-82, AGB-2026-05-16-19):**

- 📡 **Server `broadcastDomainEvent(topic, op, payload)`** — `VersionBroadcast_SocketServerService` bővítés: minden mutation után `domain:<topic>` push. Csatlakozási pontok: wave/insight/capture/wave-jsonl/auth-wave (Phase 5.A+5.B-extra)
- 📡 **Client `A_DomainEvent_DataService`** — Subject-event-bus, `A_Socket_ControlService` domain:* handler emit-tel rá (Phase 5.C)
- 🔄 **`D_Dashboard_ControlService` push-driven refresh** — `DASHBOARD_TOPICS = {wave,insight,capture}` subscription, no-polling-delay frissítés
- 🌐 **`GET /api/version` endpoint** (Phase 6.B) — server runtime version exposed (6.A skipped DyNTS-limitation miatt, 6.C build-hash inject deferred)

**Highlights — FR #5 + #8a Phase 1 (cycle 90-91, AGB-2026-05-16-19 🟡 unlock):**

- 🌧 **`WeatherPoll_Service`** — OpenMeteo polling (15min interval, 5s grace), dry→rain transition: action-log emit (`kind:'note'` + `event_class:'3x3-trigger'` + `subtype:'rain'`) + domain-event broadcast (`weather.create`). `GET /api/weather/snapshot` lekérhető (No-paid-solutions principle: OpenMeteo unauth).
- 😴 **`SleepState_Service`** + `GET /api/sleep-state` — env-overrideable window (default 02:00-10:00 wrap-around), Cron Job sleep-aware filter számára (FR #5 Phase 1 MVP). MA_SLEEP_START_HOUR / MA_SLEEP_END_HOUR env-flag.

**Highlights — AGB-20/22/17-01 + AGB-23 fixes (cycle 92-94):**

- 🔐 **AGB-20 AUTH BLOCKER fix** — `Auth_ControlService` loopback-bypass (MA_LOCAL_DEV=true + req.ip ∈ {127.0.0.1, ::1, ::ffff:127.0.0.1}). Server `.env` gitignored — minden `/api/*` most 200 dev-en (volt: 401)
- 📢 **AGB-22 notification position fix** — `verticalPosition: 'bottom'` explicit a DyNX_Message-CS-hez (default top eltakarja a header-t) + defensive global CSS top-padding fallback
- 🖥 **AGB-17-01 Activity-monitor Phase 1** — `Get-AppCategory` state-change detect (idle-transition, app-category-change, screen-locked/unlocked, machine-wake), PS 5.1 compat fix (`??` → if-else), path-fix (`scripts/` → `cli/scripts/` reorg-aware)

**Highlights — AGB-24 FR #3g Reports/Dev/User I/O panel TELJES (cycle 95-105, 11 cycle):**

- 📊 **3 panel route** — `/reports` (R_Home: FR-board kanban + cycle history + recent ships), `/reports/dev-io` (R_DevIO: status-dev + action-log stream + AGENT_BUS), `/reports/user-io` (R_UserIO: USER_INPUT inbox + open-Q outbox)
- 🌐 **9 GET endpoint** unauth — `/reports/{frs,cycles,recent-ships,status-dev,agent-log,agent-bus,user-input,open-questions,active-plans,blockers}`
- ✏️ **3 POST endpoint** inline-write — `/reports/user-input` (új [NEW] blokk), `/reports/user-input/done` ([NEW]→[DONE] toggle), `/reports/agent-bus/reply` (AGB inline-reply + status-shift OPEN→ANSWERED/ACTED/DROPPED). `server/_collections/reports.util.ts` 1130L (parsing helpers + write transformers)
- 📡 **Phase 5 socket-push auto-refresh** — server `broadcastDomainEvent('user-input'|'agent-bus', ...)`, client R_DevIO+R_UserIO subscribe → silent `refreshFromPush()` no-flicker
- 🗺 **Phase 6 blockers + roadmap** — `listActivePlans()` (15 plan parsing: title, totalPhases via `## Phase N.X — title`, completedPhases via `**N.X** ... ✅` scope-table) + `listBlockers()` (OPEN AGBs kind=question|block OR stale>24h, announcement-szűréssel)
- 🎨 **R_Home kanban** (4 col: 🟢/🚀/✅/🅿️) + plan-progress-bar + blocker-list with age-badge

**Highlights — spec-coverage burst (cycle 106-108):**

- 🧪 **`wave-sinusoid-fit.util.spec.ts`** (12 it) — fitSinusoid LSQ recovery + null/degenerate + SSR + pickBestPeriod candidates + sampleSinFit clamp
- 🧪 **`error-extract.util.spec.ts`** (16 it) — plain Error + string + HttpErrorResponse 5 ág + DyFM_Error 3 ág + unknown/circular fallback + source param
- 🧪 **`d-dashboard.data-service.spec.ts`** (14 it) — BehaviorSubject state (loading/snapshot/error/markers) + 2 static helper (seriesFor / latestValue)

**Plan-ek lezárva (Phase 5 functionally):**
- `wave-panel-ui.plan.md` Phase 5a-e ✅ shipped
- `socket-and-version-sync.plan.md` Phase 5 ✅ shipped (Phase 6.C deferred)

**Tests:** cli 26 + server 2 + client 74 = **102 spec, 0 failure** (88 → 102 a Phase 5 + spec-coverage marathon-nal)

**Cycle stats:** 40 cycle (69-108) ~24h-n belül; ~2500 LOC delta; 22 ship-commit + 18 close-commit. Bump-version 0.1.112 → 0.1.171 (59 patch-bumps).

**Decisions:** lásd [`DECISIONS.md`](DECISIONS.md) (új DEC-MA-* sorok pending — broadcastDomainEvent topic-route, loopback auth-bypass + MA_LOCAL_DEV env-flag, push-driven silent refresh).

---

## Convention új release-hez

```markdown
## X.Y.Z — YYYY-MM-DD — Rövid cím

**Sub-projekt verziók:** ...

**Highlights:**
- ✅ / 🐛 / ✨ / ⚡ / ♻️ / 📚

**Plan-ek lezárva:**
- ...

**Tests:** N spec, M failure.
```
