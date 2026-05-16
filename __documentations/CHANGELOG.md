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
