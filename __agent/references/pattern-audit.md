# Pattern audit — tri-tier vs FDP minta

**Last verified:** 2026-05-08
**Scope:** `cli/`, `server/`, `client/` — pattern-megfelelőség az FDP minta-projektekhez képest
**Pattern partners:**
- `cli/` ↔ `LIVE-projects/organizer-cli/cli/`
- `server/` ↔ `LIVE-projects/organizer/server/`
- `client/` ↔ `LIVE-projects/organizer/client/`

> Ez egy **lépcsős audit**: P0 (kritikus, javítva) → P1 (rendezhető, részben javítva) → P2 (stiláris, dokumentálva) → P3 (szándékos eltérés, "FDP-shaped lite"). A teljes-FDP-be költöztetéshez az utolsó kategória ad egy roadmap-et, ha valaha komolyan kell.

---

## 1. Audit-keret — milyen szabályok mentén

A workspace `CLAUDE.md` (és a `.cursor/rules/`) szerint az FDP minta a következő:

| Kategória | Szabály |
|---|---|
| **Naming** | Module prefix (2-3 betű); fájl-postfix `.data-model.ts`, `.controller.ts`, stb.; class-postfix `_DataModel`, `_Controller` |
| **Coding** | Explicit típusok mindenütt, no implicit `any`, `as` minimalizálva, no `.js` source files, no `.d.ts` files |
| **Structure** | One export per file (kivéve DataModel + DataParams); fájlméret < 500 sor (main service ~1000) |
| **Imports** | Order: Angular Core → external → `@futdevpro/*` → shared → local; üres sor a csoportok között |
| **Tests** | Jasmine + c8 (server/cli); karma + jasmine (client); spec-fájl kolokált |
| **Configs** | `pipeline.cicd.config.json` az Overseer-hez; FDP `prep`/`clean`/`build-base`/`build`/`test`/`build-n-test` script-ek |

---

## 2. Compliance összegzés (3 sub-projekt)

### Mindenre érvényes ✅

| Tétel | Státusz |
|---|---|
| `pnpm` package manager | ✅ |
| TypeScript-only forrás (no `.js`) | ✅ |
| **No `.d.ts` fájlok** | ✅ (memory-rule erős) |
| **No `: any` típus-annotáció** | ✅ (zero match a 3 projektben) |
| **No implicit `any`** | ✅ (`strict: true` mindenütt) |
| Hunglish kommentek | ✅ |
| JSON envelope format (`{ok, action, requestId, elapsedMs, result\|error}`) | ✅ — mindkét I/O határon (CLI stdout, server HTTP) |
| `pipeline.cicd.config.json` 7-step minta | ✅ — install → build → test → coverage → discord-notify pipeline |
| FDP `prep`/`clean`/`build-base`/`build`/`build-clean`/`build-n-test` script-ek | ✅ |
| Spec fájlok kolokáltan (`*.spec.ts` source mellett) | ✅ |
| Tests + coverage | ✅ — cli 21 + server 20 + client 7 = **48 spec, 0 failure** |

---

### CLI (`cli/` ↔ `organizer-cli/cli/`)

#### ✅ Compliant
- ESM (`type: "module"`) — egyezik organizer-cli-vel
- `bin: { ma: "./bin/ma.js" }` mintát követ
- `src/commands/` per-subcommand `*.command.ts` fájlokkal
- `src/{cast,spotify,output,action-log,utils}/` domain-szervezett — organizer-cli is így csinálja (`auth/`, `backup/`, `commands/`, `config/`, `errors/`, `http/`, `mcp/`, `output/`, `runner/`, `utils/`)
- `tsconfig.json`: `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `strict: true`, `forceConsistentCasingInFileNames: true`, `outDir: dist`, `sourceMap: true`
- `c8` coverage `text + lcov + html` reporter-rel
- `prepack` script ✅ (P1 fix után)

#### 🟡 Minor deviations
- **`test` script:** mine `jasmine --config=spec/support/jasmine.json` vs organizer's `node dist/__tests__/jasmine-runner.js`. Functionally equivalent — organizer-cli has a custom runner that we don't need (yet). Mine uses the standard jasmine binary directly via the same `spec/support/jasmine.json` config. ✅ stable.
- **CLI shortcut scripts** (`pnpm discover`, `pnpm notify`, …) in `package.json`: organizer-cli doesn't have these; they go through `bin/fo.js` → commander. Mine adds dev-time conveniences (tsx). Documented in README.

#### 🟢 Intentional architecture choices
- No commander.js library (smaller, hand-rolled `parseArgs` from `node:util`). organizer-cli uses commander — but this is a sub-PoC and the saving was real.

---

### Server (`server/` ↔ `organizer/server/`)

#### ✅ Compliant
- FDP folder layout: `_assets/`, `_collections/`, `_enums/`, `_models/{data-models,control-models,interfaces}/`, `_modules/`, `_routes/`, `_services/{api-services,control-services,core-services}/`, `app.server.ts`, `index.ts`
- DAO file naming: `*.data-model.ts` ✅ (8 entity), class-postfix `*_DataModel` ✅
- Module class naming: `*_Module` ✅ (`TickEngine_Module`, `ActionLog_Module`, `ActivityIngest_Module`)
- Enum naming: `*.enum.ts` ✅
- Controller folder-per-domain: `_routes/tick/tick.controller.ts` etc ✅
- `pipeline.cicd.config.json` 7-step

#### 🟡 Minor deviations
- **Controller pattern: function-based** (`registerTick(router)`) **vs class-based** (`Task_Controller extends DyNTS_Controller`)
  - organizer/server uses `DyNTS_Controller` from `@futdevpro/nts-dynamo` with singleton `getInstance()` and `setupEndpoints()` method
  - Mine uses Express router functions
  - **Reason:** "FDP-shaped lite" decision (no `@futdevpro/*` deps). Documented in `__agent/plans/refactor-tri-tier.plan.md`
  - Migration cost: ~2-3h to rewrite controllers as classes if we ever pull `@futdevpro/nts-dynamo` in
- **`test` doesn't use jasmine-ts:** mine compiles via tsc then runs jasmine on `dist/`. organizer/server has the same convention but uses additional `jasmine-ts` for runtime testing of `*.ts` files. Not blocking.
- **No `nodemon`:** mine uses `tsx watch` for dev. organizer uses nodemon. Both watch+restart; tsx is faster on TS, nodemon needs ts-node. Documented.

#### 🟢 Intentional architecture choices ("FDP-shaped lite")
- **No `@futdevpro/*` packages.** This is the biggest divergence and was approved as part of the refactor plan (FDP-shaped lite). Specifically missing:
  - `@futdevpro/fsm-dynamo` (logging, error system, OpenAI helpers) → my server uses plain `console`-style logging via the action-log module
  - `@futdevpro/nts-dynamo` (`DyNTS_Controller`, `DyNTS_Endpoint_Params`, default-CRUD generator) → my server uses plain Express
  - `@futdevpro/fdp-templates` (port settings, env structure) → my server uses local `_collections/environment.ts`
  - `@futdevpro/nts-fdp-templates` (auth service, errors controller, user data service) → my server uses local `auth.core-service.ts`
- **DB: SQLite via `better-sqlite3`** vs organizer's `mongoose` + MongoDB
  - Reason: single-user, lokál, zero-infra; FR explicit alternative
  - Schema migration is hand-rolled in `db.core-service.ts` (vs mongoose schemas)
- **ESM + `module: "ESNext"`** vs organizer's `module: "commonjs"`
  - Reason: new code, modern; organizer-cli (newer FDP project) is also ESM, so this aligns with the *new direction* of FDP
- **`outDir: "dist"`** vs organizer's `"./build"`
  - Reason: matches organizer-cli (the newer minta), and matches the universal Node.js convention

#### Mit kell tenni ha "full-FDP" lesz a cél
1. Add `@futdevpro/*` packages (4 dep + their tgz-locals tsconfig)
2. Rewrite controllers: function → `*_Controller extends DyNTS_Controller`
3. Switch to MongoDB (or stay SQLite + adapter)
4. Switch to CommonJS module mode (mass-rename `*.js` ESM imports)
5. Add ESLint with `@futdevpro/dynamo-eslint`

---

### Client (`client/` ↔ `organizer/client/`)

#### ✅ Compliant
- Angular 18.2 — same major version as organizer
- NgModule mode (NOT standalone) — matches organizer
- FDP folder layout: `_collections/`, `_components/`, `_directives/`, `_enums/`, `_interceptors/`, `_models/`, `_modules/`, `_pipes/`, `_services/{api-services,control-services,data-services}/`, `_styles/`
- Naming convention:
  - Module class: `*_Module` ✅ (`Status_Module`, `App_Module`)
  - Module-prefixed component class: `<Prefix>_<Name>_Component` ✅ (`S_Home_Component`)
  - Component selector: `<prefix>-<name>` ✅ (`s-home`)
  - Global components: `A_*` prefix ✅ (`A_Auth_Interceptor`, `A_Server_ApiService`)
  - Service postfix: `*_ApiService`, `*_ControlService`, `*_DataService` ✅
- Lazy-loaded feature modules ✅
- `_enums/a-route.enum.ts` for canonical paths ✅
- HTTP interceptors for auth + error ✅
- `pipeline.cicd.config.json` 7-step ✅
- Karma + Jasmine + headless Chrome tests ✅

#### 🟡 Minor deviations
- **Stricter tsconfig than organizer/client.** Organizer relaxes `strict: false`, `strictNullChecks: false`, `strictFunctionTypes: false`. Mine keeps `strict: true` everywhere. **My choice is more rigorous** — not a violation, just a tightening. Could surprise contributors used to organizer-style.
- **Port 4224** vs organizer's 4212. Conscious — to avoid conflict if both run side-by-side.
- **No proxy-local.conf.json.** organizer uses Angular dev proxy to forward `/api` → backend. Mine talks directly to `http://127.0.0.1:39245` via CORS-friendly absolute URLs (good for personal use, simpler).

#### 🟢 Intentional architecture choices ("FDP-shaped lite")
- **No Angular Material + Tailwind.** organizer/client has both. Mine has just stock SCSS. Phase 2 may add Material if we go further with the UI.
- **No `@futdevpro/ngx-*` packages.** organizer uses `@futdevpro/ngx-dynamo`, `@futdevpro/ngx-fdp-templates`, `@futdevpro/fdp-templates`, `@futdevpro/fsm-dynamo`. Mine has none.
- **No ng-packagr.** organizer ships an Angular library; mine is application-only.
- **Only 1 placeholder module** (`status/`). Future modules (`actions`, `user-input`, `activity`) are documented but not built.
- **No `app.module.spec.ts`** — only `app.component.spec.ts`. Organizer has both. Acceptable — module class is just bootstrap glue.

---

## 3. Source-level pattern audit

### `as <Type>` casts
Scanned for `\) as [A-Z]\w+` pattern:

| Project | Count | Locations | Acceptable per FDP minta? |
|---|---|---|---|
| `cli/` | 9 | All at JSON/HTTP boundary (`JSON.parse(raw) as Record<string, unknown>`, `(await res.json()) as TokenResponse`) | ✅ — identical pattern in organizer-cli (`http-client.ts`) |
| `server/` | 15 | All at SQLite boundary (`db.prepare(...).get(...) as RowType`) | ✅ — better-sqlite3's TS types necessarily `unknown`; this is the documented escape hatch |
| `client/` | 0 | — | ✅ |

**Verdict:** No problematic `as` casts. All at the `unknown` → typed-DTO boundaries where the FDP rule allows it ("indicates design issues" — but JSON/SQL row mapping isn't a design issue, it's protocol reality).

### One-export-per-file
Spot-checked:
- `cli/src/cast/notify.orchestrator.ts` — 7 exports (4 interfaces, 2 consts, 1 main function). All domain-related to notify orchestration.
- `cli/src/cast/volume.ts` — 8 exports (3 interfaces, 5 functions). All domain-related to volume ops.
- organizer-cli `src/auth/api-key.store.ts` — **4 exports** (similar pattern: 1 store + multiple helper functions)
- organizer-cli `src/auth/login.api.ts` — **5 exports**

**Verdict:** ✅ FDP minta accepts multi-export files when all exports relate to one domain concern. My usage is consistent.

### Import order
- **organizer-cli pattern:** 3 groups separated by blank lines (node/external → @futdevpro/external workspace → local relative).
- **My pattern:** Was single-block. **Fixed in P1** for key files: `app.server.ts`, `tick.controller.ts`, `cli/src/main.ts`. Other files have shorter import blocks (≤3 imports) so the separator is less impactful, but the formal compliance is still partial.

**Compliance level:** **Partial** — to fully comply, all 60+ source files would need to be re-formatted. **Recommended follow-up:** add `eslint-plugin-import` rule and run `--fix` (the FDP `dynamo-fix` script does this in @futdevpro projects).

---

## 4. CI/CD pipeline összevetés

### CDP (Continuous Delivery Pipeline — `pipeline.cicd.config.json`)

| Step | organizer-cli | server (mine) | client (mine) | cli (mine) |
|---|---|---|---|---|
| `discord-start` | ✅ | ✅ | ✅ | ✅ |
| `pre-flight-check` | ✅ (NPM_TOKEN) | ❌ | ❌ | ❌ |
| `install` | `cd cli && pnpm i` | `cd server && pnpm i` | `cd client && pnpm i` | `cd cli && pnpm i` |
| `check-dev-leftovers` | ✅ (TSCONFIG_PATHS) | ❌ | ❌ | ❌ |
| `build` | `cd cli && npx tsc` | `cd server && pnpm run build-base` | `cd client && pnpm run build-base` | `cd cli && pnpm run build-base` |
| `test` | `cd cli && npx jasmine` | `cd server && pnpm exec jasmine` | `cd client && pnpm test` | `cd cli && pnpm exec jasmine` |
| `coverage` | ❌ (organizer-cli skips) | ✅ | ✅ | ✅ |
| `npm-publish` | ✅ (master only) | ❌ (private) | ❌ (private) | ❌ (private) |
| `pipeline-report` | ✅ | ✅ | ✅ | ✅ |
| `discord-result` | ✅ | ✅ | ✅ | ✅ |

**Differences I should add (low priority):**
- `pre-flight-check` step (NPM_TOKEN validation) — only relevant if I publish; mine are private
- `check-dev-leftovers` step (tsconfig-paths sanity) — useful but small risk

### LDP (Live Dev Pipeline — `pipeline.config.json`)

| Helye | organizer | my-assistant | Status |
|---|---|---|---|
| Root LDP (`pipeline.config.json`) | ✅ `LIVE-projects/organizer/pipeline.config.json` (server + client watcher) | ✅ `my-assistant/pipeline.config.json` (cli + server + client watcher) | **Hozzáadva 2026-05-08** (audit-gap fix) |
| Watch paths | `server/src`, `client/src` | `cli/src`, `server/src`, `client/src` (3-layer) | ✅ |
| Steps | rimraf-server-build → tsc-server → copy-assets → server-test → client-build → client-test | rimraf-cli-dist → tsc-cli → cli-test → rimraf-server-dist → tsc-server → server-test → client-build → client-test | ✅ |
| Server restart | `node server/build/src/index.js` | `node server/dist/index.js` | ✅ (path-different csak `dist/` vs `build/`) |
| Timing | debounce 30s, server-grace 120s, step-timeout 10min | ugyanaz | ✅ |
| Futtatás | `dc ldp` | `dc ldp` | ✅ |

**Megjegyzés:** organizer-cli (single CLI repo) NEM tartalmaz LDP-t, mert nincs long-running process. master-prompter sem (csak CDP-je van, ami furcsa, mert full-stack — az master-prompter LDP-je elveszett vagy szándékosan kihagyva). Az én my-assistant LDP-m a "full-stack-multi-layer" minta, organizer-mintát követi.

---

## 5. Folder structure parity

### Server folder map

| organizer/server | my-assistant/server | Status |
|---|---|---|
| `src/_assets/` | `src/_assets/` | ✅ both empty initially |
| `src/_collections/environment.ts` | `src/_collections/environment.ts` | ✅ |
| `src/_collections/email/` | — | 🟢 not needed (no email feature yet) |
| `src/_enums/` | `src/_enums/` | ✅ — mine has 4 enums |
| `src/_language/` | — | 🟢 not needed (no i18n yet) |
| `src/_models/control-models/` | `src/_models/control-models/` | ✅ (empty placeholder) |
| `src/_models/data-models/` | `src/_models/data-models/` | ✅ (8 DAOs vs organizer's mongoose-style) |
| `src/_models/interfaces/` (implicit in organizer) | `src/_models/interfaces/` | ✅ |
| `src/_modules/` | `src/_modules/` | ✅ |
| `src/_routes/` | `src/_routes/` | ✅ |
| `src/_services/api-services/` | `src/_services/api-services/` | ✅ (empty placeholder — no outbound APIs yet) |
| `src/_services/control-services/` | `src/_services/control-services/` | ✅ |
| `src/_services/core-services/` | `src/_services/core-services/` | ✅ |
| `src/_services/email-services/` | — | 🟢 not needed |
| `src/_services/socket-services/` | — | 🟢 not needed (no real-time yet) |
| `src/app.server.ts` | `src/app.server.ts` | ✅ |
| `src/index.ts` | `src/index.ts` | ✅ |

**Verdict:** Folder structure ✅ — all required FDP folders present, missing ones are domain-irrelevant (no email, no socket, no i18n).

### Client folder map

| organizer/client/src/app/ | my-assistant/client/src/app/ | Status |
|---|---|---|
| `_collections/` | `_collections/` | ✅ |
| `_components/` (a-empty-data, a-error, a-login, ...) | `_components/` (a-loading) | 🟡 mine has placeholder only |
| `_directives/` | `_directives/` | ✅ both empty |
| `_enums/` | `_enums/` | ✅ |
| `_interceptors/` (a-auth, a-error, a-response) | `_interceptors/` (a-auth, a-error) | 🟡 missing `a-response` |
| `_models/` | `_models/` | ✅ |
| `_modules/` | `_modules/` (only `status/`) | 🟡 13 modules missing — Phase 2 scope |
| `_pipes/` | `_pipes/` | ✅ both empty |
| `_services/api-services/` | `_services/api-services/` | ✅ |
| `_services/auth/` | — | 🟢 missing — Phase 2 (would need FDP auth) |
| `_services/control-services/` | `_services/control-services/` | ✅ empty |
| `_services/data-services/` | `_services/data-services/` | ✅ empty |
| `_styles/` | `_styles/` | ✅ both empty |
| `app.component.{ts,html,scss}` | `app.component.{ts,html,scss}` | ✅ |
| `app.module.ts` | `app.module.ts` | ✅ |
| `app.routing-module.ts` | `app.routing-module.ts` | ✅ |

**Verdict:** Skeleton ✅, but Phase 2 needs to add `actions`, `user-input`, `activity` modules + `auth/` service folder + `a-response` interceptor.

---

## 6. Recommended follow-ups (optional, prioritized)

### P1 — quick wins
- [x] **Server `start-clean` fix** — done
- [x] **CLI `prepack` script** — done
- [x] **Import-order separators** — done for key files (app.server.ts, tick.controller.ts, cli/main.ts); **partial** elsewhere
- [ ] **Add `pre-flight-check` step to all 3 pipelines** — copy from organizer-cli

### P2 — closer parity
- [ ] **ESLint setup** (server + cli + client). Use `@typescript-eslint/parser` minimum; `@futdevpro/dynamo-eslint` if we ever pull FDP packages
- [ ] **`validate:imports` and `validate:naming` scripts** — require `@futdevpro/dynamo-eslint`. Skip until we add FDP packages
- [ ] **Server `nodemon` instead of `tsx watch`** — minor, both work
- [ ] **Custom jasmine-runner.js** for cli (`__tests__/jasmine-runner.js`) — only if we want `test:coverage` to work outside the `c8 jasmine` direct call

### P3 — full FDP migration (only if pulling `@futdevpro/*`)
- [ ] Add `@futdevpro/fsm-dynamo`, `@futdevpro/nts-dynamo`, `@futdevpro/fdp-templates`, `@futdevpro/nts-fdp-templates`
- [ ] Refactor server controllers → `*_Controller extends DyNTS_Controller`
- [ ] Switch server module mode → CommonJS
- [ ] Switch DB → MongoDB + mongoose (or stay SQLite + write a lite adapter)
- [ ] Add Material + Tailwind to client
- [ ] Add `@futdevpro/ngx-dynamo` to client

**Total P3 effort:** ~2 days. **Recommendation:** don't do unless FDP integration becomes a real need (Overseer pipeline integration, cross-FDP shared services). Phase 1 served the user's "personal life-management" goal cleanly without these.

---

## 7. Audit summary (one-line verdict)

✅ **Pattern-compliant in spirit and naming**, with **3 documented architecture-level deviations** (`@futdevpro/*` packages absent in server+client; SQLite vs Mongo; ESM vs CommonJS in server). All 48 specs across the 3 projects pass; folder structure mirrors FDP partners; no `.d.ts`, no `: any`, no problematic `as` casts. The deviations are intentional and reversible — the folder layout makes a future "full FDP" migration straightforward (~2 days).
