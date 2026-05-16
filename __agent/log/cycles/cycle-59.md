# Cycle 59 — 2026-05-16

**Branch:** main
**Trigger:** plan-folytatás — FR #3f Phase 3.A+3.B+4.A bundle (client socket + version state + status-bar)
**Commit:** b504927

## Outcome

**Phase 3.A + 3.B + 4.A SHIPPED** — a kliens most kapcsolódik a server
`VersionBroadcast` socket-szervice-éhez, eltárolja a server + client
verziókat egy reaktív state-ben, és egy sticky footer status-bar-on
megjeleníti azokat. A `server:hello` + `server:version` event-eken keresztül
a kliens automatikusan szinkronban van a szerver verzió-állapotával.

## Fázis-flow

- **00-orient** → cycle 58→59, plan-folytatás (active_plan: socket-and-version-sync.plan.md)
- **04-investigate** → Explore subagent #3 verifikálta a kliens-pattern-t:
  - `DyFM_SocketClient_ServiceBase<T>` 3 abstract method (`getParams`, `getIncomingEvents`, `getSubscriptionContent`)
  - `DyFM_SocketClient_Params.socketOptions` támogatja a Socket.IO `path` option-t
  - Auto-connect a `super()` constructor-chain-ből (asyncConstructor → connectSocket)
- **06-implement** →
  - **`a-version.data-service.ts`** (Phase 3.B, ~65 LOC):
    - `A_VersionState_Interface` (serverVersion, clientVersion, lastUpdateTs, requireReload)
    - BehaviorSubject state, `current()` snapshot + `state$()` observable
    - `setServerVersion()` requireReload guard (csak ha tényleg eltér a baseline-tól, NEM első hello-ra)
    - `clearReloadFlag()` (Phase 4.B banner-dismiss future-use)
    - clientVersion build-time import a `client/package.json`-ból (Angular bundler esModuleInterop)
  - **`a-socket.control-service.ts`** (Phase 3.A, ~135 LOC):
    - `A_Socket_ControlService extends DyFM_SocketClient_ServiceBase<A_SocketSubscription_Request>`
    - `getParams()` → name='MA Version Socket', address=`window.location.origin`, **path='/socket' KRITIKUS** (DyNTS_defaultSocketPath)
    - `transports: ['websocket']` + reconnectionDelay=1000 (master-prompter minta)
    - `getIncomingEvents()` → 2 `DyFM_SocketEvent` (`server:hello`, `server:version`) → `A_Version_DataService.setServerVersion`
    - `getSubscriptionContent()` → `{ clientId }` random session-id
    - try/catch + `A_Error_ControlService.showError` minden handler-ben (alapelv #20a)
  - **`s-status-bar.component.ts/html/scss`** (Phase 4.A, ~50 + html + scss LOC):
    - Standalone Angular komponens (FormsModule nélkül, csak CommonModule)
    - Position: sticky bottom:0, z-index:100, font-family monospace
    - Subscribe `A_Version_DataService.state$()` ngOnInit-ben, cleanup ngOnDestroy
    - `formatTime(ts)` HH:mm format util
    - Responsive: mobile font-size shrink, `.disconnected` color ha nincs serverVersion
  - **Integration**:
    - `app.module.ts`: `S_StatusBar_Component` standalone import
    - `app.component.html`: `<s-status-bar/>` az app-shell aljára
    - `app.component.ts`: `inject(A_Socket_ControlService)` triggereli a singleton-auto-connect-et
    - `app.component.spec.ts`: `A_Socket_ControlService_Stub` provider, hogy a tesztben ne legyen valódi socket-attempt
- **07-review** →
  - Pattern: master-prompter `A_SocketClient_ControlService` (`@futdevpro/fsm-dynamo/socket`)
  - SSoT: `A_Version_DataService` egyetlen state-source, sub/comp ezt observe-eli
  - Error: try/catch + `A_Error_ControlService.showError` (központi pipeline FR #3b-vel egyezve)
  - Path-constraint: `'/socket'` doc-komment + Phase 3.A constraint cycle 58-ban felfedezve
- **08-verify-local** →
  - **LDP 11/11 ✅** (client-build ok, client-test 13/13 ok, lint-client ok)
  - Első round: client-test FAIL 3/13 (AppComponent spec) — A_Socket_ControlService inject DI-chain real-socket-attempt-et triggerelt karma-env-ben (localhost:9876:undefined)
  - Fix: `app.component.spec.ts`-be `A_Socket_ControlService_Stub` provider → 13/13 pass
  - **Browser-smoke** — index.html served, `<app-root>` ott van; runtime Angular render NEM tesztelt (E2E framework deferred per AGB-03 task B)
- **09-update-docs** → plan-doc Phase 3.A + 3.B + 4.A → ✅ shipped
- **10-commit-push** → `b504927` push ok (bump-version 0.1.96 → 0.1.97)

## Build/test eredmény

- **LDP:** 11/11 ✅
- **Build status:** success
- **Test status:** success (cli 26/26, server 2/2, client 13/13)
- **E2E:** deferred (AGB-03 task B külön user-OK)

## Plan-step done

- `socket-and-version-sync.plan.md` Phase 3.A ✅
- `socket-and-version-sync.plan.md` Phase 3.B ✅
- `socket-and-version-sync.plan.md` Phase 4.A ✅

## Open follow-ups

- **Cycle 60 (Phase 4.B)** — `S_VersionReloadBanner_Component` standalone, 5s countdown + manual reload + dev-mode silencer (`isDevMode()` Angular flag)
- **Phase 5-6** — külön green-light (domain-events migration + build-pipeline integration)
- **Browser-test deferred** — a runtime status-bar megjelenés + socket-connect manual-verify majd Phase 4.B után

## Stats

- **Files:** 13 (5 új komponens-fájl + 4 client-mod + plan + STATUS + cycle log + 4 version-bump)
- **LOC delta:** +334 / -6
- **Commit:** b504927
- **Build:** success
