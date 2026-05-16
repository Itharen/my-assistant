# Plan — Socket-rendszer (server↔client) + auto-version-update + verzió-info bar (FR #3f)

> **Cél:** WebSocket-alapú kétirányú real-time csatorna a server és a client közt,
> verzió-broadcast a deploy-ok után (auto-reload UX), és minden felületen
> látható verzió-info-bar (`server vX · client vY`).
>
> **Forrás-FR:** `current/feature-requests/socket-and-version-sync.md`
> **AGB green-light:** AGB-2026-05-16-05 (chat → dev-agent, 2026-05-16T02:15)
> **Plan-mode:** B (dev-agent autonóm tervezés a green-light után)
> **Cycle:** 57 (plan-package) → implementáció 58+

---

## Audit (cycle 57 elején)

### Server (alap-építőkocka kész)

- ✅ `DyNTS_AppExtended` extends `@futdevpro/nts-dynamo/socket` — wired in `app.server.ts:49`
- ✅ `DyNTS_SocketServerService` import — `app.server.ts:20`
- ⚠️ `getSocketServices()` — **ÜRES tömb** (`app.server.ts:157`). Ide kell az új service-eket regisztrálni
- ✅ `version` mező a `getAppParams()`-ben — `app.server.ts:63`
- ✅ Server-side TS `package.json` `version` field auto-bump-el (`dc bump-version` + bump-version-hook)
- ❌ `Notification_SocketServerService` / hasonló — nincs még
- ❌ `version-broadcast` service — nincs még

### Client (réteg hiányzik)

- ❌ `A_Socket_ControlService` / hasonló — nincs (csak HTTP REST `A_Server_ApiService`)
- ❌ Status-bar komponens (verzió-info) — nincs
- ❌ Verzió-watch + reload UX — nincs

### Pattern-research kimenete (cycle 57, master-prompter)

**Server-side pattern** (master-prompter):
- `LIVE-projects/master-prompter/server/src/_services/socket-services/notification.socket-server-service.ts`
- Class extends `DyNTS_SocketServerService<DyNTS_SocketPresence, MP_SocketSubscription_Request>`
- Registration: `app.server.ts` `getSocketServices()` → `[ Notification_SocketServerService.getInstance(), ... ]`
- API: `this.sendEventForId(userId, eventKey, payload, issuer)` per-client, `this.broadcastEvent(eventKey, content, issuer)` server-wide

**Client-side pattern** (master-prompter):
- `LIVE-projects/master-prompter/client/src/app/_services/control-services/a-socket-client.control-service.ts`
- Class extends `DyFM_SocketClient_ServiceBase<FDP_SocketSubscription_Request>` from `@futdevpro/fsm-dynamo/socket`
- Handler reg: `getIncomingEvents()` → `DyFM_SocketEvent[]` array
- Built-in reconnect: `socketOptions: { reconnectionDelay: 1000 }`
- Lifecycle: `effect()` watcher login state-en

**Version-broadcast / auto-reload pattern:**
- ❌ **NEM létezik** master-prompter-ben vagy organizer-ben. **Design-from-scratch**.

**Dynamo CLI tools (Q-ver-1 resolution):**
- `dc bump-version` (`dc bv`) — patches root `package.json` + syncs subprojects + regenerates TS constants. Path: `NPM-packages/dynamo-cli/src/_commands/bump-version/bump-version.ts`
- `dc setup-version-hook` — Husky pre-commit hook auto-bumphoz
- **Már működik my-assistant-ben!** A bump-version hook bumpolja a root + 3 subproject `package.json`-t commit-kor (lásd legutóbbi cycle 56 close: `0.1.91 → 0.1.92`)

**Status-bar (Q-ver-3 resolution):**
- ❌ NEM létezik referencia projektben — design-from-scratch
- Pattern-rokon: `ad-server-status` (master-prompter admin module) — error summary, de nem version

---

## Open Q-resolution (research alapján)

| Q# | Eredeti kérdés | Resolution (cycle 57 research) |
|---|---|---|
| Q-ver-1 | Melyik Dynamo CLI eszköz / package? | `dc bump-version` server-side + `@futdevpro/nts-dynamo/socket` server-szolg-base + `@futdevpro/fsm-dynamo/socket` client-szolg-base |
| Q-ver-2 | Reload UX: néma / banner / countdown? | **Banner + 5s countdown + manual reload gomb** (default), néma fallback ha 0s grace |
| Q-ver-3 | Status-bar elhelyezés? | **Layout footer, mindig látható**. Mobile: collapsible |
| Q-ver-4 | Build-hash inject? | Phase 6, `dc bump-version` post-hook bővítés vagy saját pre-commit |
| Q-ver-5 | Auth socket-en? | **JWT token a connect handshake-ben** (`io.auth.token = localStorage.authToken`); ha üres → unauth public-socket-only |
| Q-ver-6 | Reconnect-policy? | Built-in Socket.IO (1s delay), no max retry (a master-prompter mintát követjük) |
| Q-ver-7 | REST → socket migráció heurisztikája? | Phase 5 — push-szerű events socket-re, read-heavy/low-freq REST marad. Konkrét lista cycle 60+ |
| Q-ver-8 | Verzió-mismatch direction? | **Csak server > client** triggerel reload. Lefelé NEM (downgrade nem realisztikus) |
| Q-ver-9 | LDP restart során verzió? | **Néma reload dev-módban** (`FDP_ENV==='local'`), banner+countdown prod-ban |

Új Q-k (research kimenete):
| Q# | Kérdés | Fontosság |
|---|---|---|
| Q-ver-10 | Socket-server registration order — `getSocketServices()`-en belül több service esetén |  low |
| Q-ver-11 | DyNTS_SocketPresence subscription model — needs deeper read for Phase 2 | medium |

---

## Phase-elés (cycle-onkénti scope, becsült)

| Phase | Mit | Status | Cycle |
|---|---|---|---|
| 0 | FR doc | ✅ | (forrás) |
| 1 | **Pattern-research** (master-prompter socket pattern) | ✅ cycle 57 | shipped (lásd Audit szakasz) |
| **2.A** | **Server: VersionBroadcast_SocketServerService** — `getSocketServices()`-be regisztrálva, `server:hello` boot broadcast | ✅ cycle 58 | shipped |
| **2.B** | **Server: 30s tick interval** version-check + `server:version` broadcast HA változott | ✅ cycle 58 | shipped |
| **3.A** | **Client: A_Socket_ControlService** — `DyFM_SocketClient_ServiceBase` extend, path='/socket', server:hello+server:version handlers | ✅ cycle 59 | shipped |
| **3.B** | **Client: A_Version_DataService** — BehaviorSubject state (serverVersion + clientVersion + lastUpdateTs + requireReload) | ✅ cycle 59 | shipped |
| **4.A** | **Status-bar component** (`s-status-bar.component`) — sticky footer, server + client + last-update + reload-flag | ✅ cycle 59 | shipped |
| **4.B** | **Auto-reload UX** — `S_VersionReloadBanner_Component` (5s countdown + Reload Now + Dismiss + dev-mode silent reload) | ✅ cycle 60 | shipped |
| **5.A** | **Server: domain-events push util** — `broadcastDomainEvent(topic, op, payload)` a VersionBroadcast szervice-en, schema `{topic, op:create\|update\|delete, payload, ts}` | ✅ cycle 80 | shipped |
| **5.B** | **Server: wave-jsonl `/log-public` push hook** — `domain:wave` create event broadcast a controller-mutation után | ✅ cycle 80 | shipped |
| **5.B-extra** | **Server: insight/capture/wave-auth create+dismiss hooks** — `domain:<topic>` push (REST endpoints meglévők) | ✅ cycle 81 | shipped |
| **5.C** | **Client: A_Socket subscribe + dispatch** — `domain:wave/insight/capture/task` handlerek → `D_Dashboard_ControlService.refresh()` trigger | 🚧 cycle 82-83 |  |
| **6.A** | **Server: build-hash + version response headers** (Express middleware) | ⏭️ skipped | DyNTS-ben nincs clean middleware hook (private `startExpresses`); a socket `server:hello` + `/api/version` endpoint lefedi az use case-t |
| **6.B** | **Server: GET /api/version endpoint** (unauth, json: version + bootTime + gitSha + env) | ✅ cycle 80 | shipped |
| **6.C** | **LDP integráció** — build-time git-sha inject (`MA_BUILD_HASH` env, `dc bump-version` post-hook) | 🚧 cycle 84 |  |

**Cycle 57 ezzel a planning-fázist zárja.** Cycle 58 Phase 2.A+2.B (server-side) bundle indul.

---

## Phase 2.A — Server: VersionBroadcast_SocketServerService

### Új fájl: `server/src/_services/socket-services/version-broadcast.socket-server-service.ts`

```typescript
// Pattern source: master-prompter Notification_SocketServerService
import { DyNTS_SocketPresence, DyNTS_SocketServerService } from '@futdevpro/nts-dynamo/socket';

interface VersionSubscription_Request {
  // Eleinte üres — broadcast-only, később per-domain subscription
  domains?: string[];
}

export class VersionBroadcast_SocketServerService
  extends DyNTS_SocketServerService<DyNTS_SocketPresence, VersionSubscription_Request> {

  static getInstance(): VersionBroadcast_SocketServerService {
    return VersionBroadcast_SocketServerService.getSingletonInstance();
  }

  /** Hívja: app.server.ts startup-kor + 30s tickre. */
  broadcastServerVersion(version: string, previousVersion?: string): void {
    this.broadcastEvent('server:version', {
      version,
      previousVersion,
      requireReload: !!previousVersion && previousVersion !== version,
      ts: new Date().toISOString(),
    }, 'version-broadcast');
  }

  /** Új kliens csatlakozik → server:hello event. */
  onClientConnect(presence: DyNTS_SocketPresence, version: string): void {
    this.sendEventForId(presence.socketId, 'server:hello', {
      version,
      ts: new Date().toISOString(),
      env: process.env.FDP_ENV ?? 'local',
    }, 'version-broadcast');
  }
}
```

### `app.server.ts` integráció

```typescript
// app.server.ts (line 157, getSocketServices())
getSocketServices(): DyNTS_SocketServerService<any>[] {
  return [
    VersionBroadcast_SocketServerService.getInstance(),
  ];
}

// Új lifecycle hook (startup + 30s tick)
override async onStartup(): Promise<void> {
  const v = VersionBroadcast_SocketServerService.getInstance();
  const currentVersion: string = version; // package.json import
  v.broadcastServerVersion(currentVersion);

  // 30s poll-tick: ha version változott (pl. dev-LDP rebuild után), broadcast
  setInterval((): void => {
    const newVersion: string = require('../package.json').version;
    if (newVersion !== currentVersion) {
      v.broadcastServerVersion(newVersion, currentVersion);
    }
  }, 30_000);
}
```

### Error-handling (alapelv #20a)

- `broadcastServerVersion` try/catch — Socket.IO send-error → `emitServerActionLog(kind: 'error', errorCode: 'MA-SOCKET-VERSION-BROADCAST-FAIL')`
- Reconnect-loop hibák — `DyNTS_SocketServerService` base kezeli, fallback action-log

### LDP-validation

- `tsc-server` zöld
- `server-runtime` restart automatikus
- Smoke (manuálisan): `wscat -c ws://127.0.0.1:39245` → connect → várd a `server:hello` event-et

---

## Phase 3.A — Client: A_Socket_ControlService

### Új fájl: `client/src/app/_services/control-services/a-socket.control-service.ts`

```typescript
// Pattern source: master-prompter A_Socket_ControlService (a-socket-client.control-service.ts)
import { DyFM_SocketClient_ServiceBase, DyFM_SocketEvent } from '@futdevpro/fsm-dynamo/socket';

interface A_SocketSubscription_Request {
  domains?: string[];
}

@Injectable({ providedIn: 'root' })
export class A_Socket_ControlService extends DyFM_SocketClient_ServiceBase<A_SocketSubscription_Request> {

  getIncomingEvents(): DyFM_SocketEvent<any>[] {
    return [
      new DyFM_SocketEvent({
        eventKey: 'server:hello',
        tasks: [async (content) => this.handleServerHello(content)],
      }),
      new DyFM_SocketEvent({
        eventKey: 'server:version',
        tasks: [async (content) => this.handleServerVersion(content)],
      }),
    ];
  }

  private handleServerHello(content: { version: string; ts: string; env: string }): void {
    // Tárolja a baseline-t a A_Version_DataService-ben (Phase 3.B)
  }

  private handleServerVersion(content: { version: string; previousVersion?: string; requireReload: boolean }): void {
    // Ha requireReload && version !== current baseline → Phase 4.B reload UX trigger
  }
}
```

### Client app.module integráció

- Provide `A_Socket_ControlService` in root injector
- Connect-lifecycle: `effect()` watcher az auth state-en (master-prompter minta)
- Reconnect: built-in `socketOptions: { reconnectionDelay: 1000 }`

---

## Phase 3.B — Client: A_Version_DataService

### Új fájl: `client/src/app/_services/data-services/a-version.data-service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class A_Version_DataService {
  private state$: BehaviorSubject<A_Version_State> = new BehaviorSubject<A_Version_State>({
    serverVersion: null,
    clientVersion: BUILD_VERSION,  // build-time injected (Phase 6)
    lastUpdateTs: null,
  });

  setServerVersion(version: string): void { /* state-update */ }
  current(): A_Version_State { return this.state$.value; }
  observable(): Observable<A_Version_State> { return this.state$.asObservable(); }
}
```

### A `BUILD_VERSION` build-time inject

Phase 6-ig egyszerűen `'dev'` literal vagy `package.json` import (Angular build-time). Phase 6 wire-up: webpack DefinePlugin / Angular environment.ts.

---

## Phase 4.A — Status-bar component

### Új komponens: `client/src/app/_components/s-status-bar/s-status-bar.component.ts`

```typescript
@Component({
  standalone: true,
  selector: 's-status-bar',
  template: `
    <div class="status-bar">
      <span>🖥 {{ state.serverVersion ?? '—' }}</span>
      <span class="sep">·</span>
      <span>🖱 {{ state.clientVersion }}</span>
      @if (state.lastUpdateTs) {
        <span class="sep">·</span>
        <span class="muted">↻ {{ formatTime(state.lastUpdateTs) }}</span>
      }
    </div>
  `,
  // Mobile: collapsible (Q-ver-3)
})
export class S_StatusBar_Component { /* state from A_Version_DataService */ }
```

### Layout integráció

`client/src/app/app.component.html` aljára: `<s-status-bar/>`.

---

## Phase 4.B — Auto-reload UX

### Új komponens: `client/src/app/_components/s-version-reload-banner/s-version-reload-banner.component.ts`

- Show ha `A_Version_DataService.state.requireReload === true`
- 5s countdown timer + "Reload Now" gomb + "Dismiss" gomb
- Dev-mode (`environment.production === false`) → néma reload (no banner)

---

## Adatvédelem / authority

- Verzió-broadcast **Domén 2** (server-side, no user-data) — szabadon implementálható
- Socket-channel auth: Phase 5+ ha user-data push-jaira kerül sor; jelen Phase 1-4-ben unauth (public version-only)

---

## Acceptance criteria (Phase 2-4 összesen)

1. ✅ Server `getSocketServices()` non-empty (legalább `VersionBroadcast_SocketServerService` regisztrálva)
2. ✅ Server boot → `server:hello` event minden új kliens-connection-re
3. ✅ Server 30s tick → ha `package.json` `version` változott, `server:version` broadcast
4. ✅ Client Socket.IO connect on app-start, auto-reconnect 1s delay
5. ✅ Status-bar mindig látható, mutatja `server vX · client vY · last-update HH:mm`
6. ✅ Server-version-change → reload-banner (prod) / néma reload (dev)
7. ✅ Minden socket hibapont action-log + `MA-SOCKET-*` errorCode (alapelv #20a)
8. ✅ LDP 11/11 zöld minden Phase végén

---

## Rizikók / open kérdések

| Q-ID | Kérdés | Mitigáció |
|---|---|---|
| Q-ver-11 | DyNTS_SocketPresence subscription model — needs deeper read | Cycle 58 Phase 2 elején DyNTS source-ot olvasunk |
| Q-ver-12 | Socket.IO connection a HTTP-only server-en? Külön socket-port? | DyNTS_AppExtended same-port multiplex (Socket.IO ws-upgrade-en megy) |
| Q-ver-13 | Auth-blocker-el együtt? | A jelen socket-channel unauth (public version-only) — nem érinti az auth-decision-t |

---

## Cycle-onkénti scope (becsült)

- **Cycle 57** — Phase 1 (research) + plan-doc B-mode ✅ (this cycle, doc-only)
- **Cycle 58** — Phase 2.A + 2.B (server-side socket service + 30s tick + boot broadcast) — ~150-200 LOC
- **Cycle 59** — Phase 3.A + 3.B + 4.A (client socket service + version data-service + status-bar) — ~250-300 LOC
- **Cycle 60** — Phase 4.B (reload-banner UX + dev-mode silencer) — ~100-150 LOC
- **Cycle 61+** — Phase 5 (domain-events migráció, külön green-light)
- **Cycle 62+** — Phase 6 (build-pipeline / build-hash inject, külön green-light)

**Total estimate:** 4 cycle (57-60) Phase 1-4-re. Phase 5-6 később, külön user-OK.

---

## Status

🚧 Phase 1 ✅ (cycle 57 research). Phase 2.A indul cycle 58-ban — server-side
`VersionBroadcast_SocketServerService` + `getSocketServices()` reg + 30s tick.
