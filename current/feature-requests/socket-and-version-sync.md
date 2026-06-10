# FR: Socket-rendszer (server↔client) + auto-version-update + verzió-info bar

> **Forrás: a user szövege. SZÓ SZERINT őrizzük.** Új kiegészítés alá fűzve,
> dátum-bélyeggel. Ez egy organizer Feature Request alapanyag — később
> `fo feature-requests.create`-tel feltölthető.

---

## 2026-05-12 (23:17) — initial deklaráció

> StepSocket [WebSocket — STT] rendszert kéne kiépíteni a szerver és a kliens
> között, egyrészt azon keresztül kellene kommunikáljon az esetek nagy
> százalékában, másrészt pedig amikor a szerveren változik a verzió, akkor
> újra kell frissítsük automatikusan a klienst. A rendszerünkbe be kell
> kössük az auto-version-update-et ugyanúgy, mint a többi rendszerünkben.
> Van erre egy Dynamo CLI eszköz. A verziószámokat jó lenne valamilyen
> legalább egy infobarba belerakni a szerver és kliens verziót.

### Scope

- **Főként szerver-feature** (socket server + version broadcast)
- **Kliensen látszódjon** — kommunikáció socket-en megy, verzió-info bar, auto-reload
- **Pattern**: a többi FDP rendszerünkben (master-prompter, organizer, overseer)
  már bevett — kövessük azt

---

## Mit nyerünk

1. **Real-time kommunikáció**: poll helyett push, latency ↓, server-load ↓
2. **Auto-version-update**: server deploy után a kliens magától reload-ol
   (nincs "stale client" gondunk)
3. **Verzió-transzparencia**: info-bar / status-bar mutatja a server + client
   verziót — debug + jóváhagyási flow-hoz hasznos

---

## Pre-existing infrastruktúra (már megvan a repo-ban)

| Elem | Hely | Status |
|---|---|---|
| `DyNTS_AppExtended` ← extends `@futdevpro/nts-dynamo/socket` | `server/src/app.server.ts:20` | ✅ wired |
| `DyNTS_SocketServerService` import | `server/src/app.server.ts:20` | ✅ wired |
| `getSocketServices()` hook | `server/src/app.server.ts:157` | ⚠️ üres array |
| `version` a `getAppParameters()`-ben | `server/src/app.server.ts:61` | ✅ ott van |
| Server-side TS package.json `version` field | `server/package.json` | ✅ van |
| Client-side Server API service | `client/src/app/_services/api-services/a-server.api-service.ts` | ✅ van |
| Kliens socket-client | nincs még | ❌ TODO |

→ A szerver socket-réteg **building block-ként készen áll**, csak service-t kell hozzáadni.
A kliensen viszont a socket-réteg nincs még bekötve.

---

## Megoldás-jelöltek

### A) Transport: Socket.IO vs raw WebSocket vs SSE

| # | Transport | Pro | Kontra |
|---|---|---|---|
| 1 | **Socket.IO 4.x** (a tech stack-ben is benne van — global CLAUDE.md "Real-time: Socket.io 4.x") | rooms / namespaces / auto-reconnect / fallback / type-safe events | extra wire-overhead vs raw WS |
| 2 | Raw WebSocket (`ws`) | minimal | reconnect / heartbeat / routing kézzel |
| 3 | SSE (Server-Sent Events) | egyirányú, HTTP-friendly | nincs full duplex |

**Default ajánlás:** Socket.IO — a FDP ökoszisztéma standardja (lásd
`DyNTS_SocketServerService` is erre épül a `@futdevpro/nts-dynamo/socket`
package-ben).

### B) Auto-version-update flow

```
1. Server bootstrap → version-string (package.json) memóriába
2. Új client csatlakozik → "server:hello" event { serverVersion, ts }
3. Kliens megjegyzi a server-version-t mint "baseline"
4. Server újraindul (új deploy) → új socket connection → új serverVersion
5. Ha új != baseline → kliens:
   a) info-bar pirosra ("server updated → reload required")
   b) opcionális: 3s graceful countdown → `location.reload()`
   c) vagy user-OK gomb a banneren
```

**Pattern**: a többi FDP rendszerben már működik (master-prompter, organizer).
Kérdés Q-ver-1: pontos pattern-mapping mire utal a user — `@futdevpro/cli-dynamo`
egy konkrét `dc` parancsa, vagy az `@futdevpro/fsm-dynamo` socket-version-handler-e?

### C) Dynamo CLI tool

> "Van erre egy Dynamo CLI eszköz."

Lehetséges referenciák (verify-elendő):
- `@futdevpro/cli-dynamo` (`dc`) — kódgenerátorok, projekt-generátor
- `dc cdp` pipeline step — build-time version-bump?
- `@futdevpro/nts-dynamo` server-side `DyNTS_SocketServerService` — runtime
  version-broadcast?
- `@futdevpro/ngx-dynamo` kliens-oldali socket-client + reload-handler?

→ **Pattern-mapping kötelező első lépés** (CLAUDE.md "Pattern-based Development").
Mielőtt egy sort is írunk: nézzük meg master-prompter / organizer kliens-szerver
páros hogyan csinálja. Legvalószínűbb hely:
- `NPM-packages/dynamo-ngx/` → kliens socket-client + version-handler
- `NPM-packages/dynamo-nts/` → szerver socket-broadcaster
- `NPM-packages/dynamo-cli/` → setup / scaffold generátor

---

## Architektúra (szerver-oldal)

```
server/src/_services/
   socket/
      socket-server.service.ts           # belépési pont, getSocketServices()-ben regisztrálva
      version-broadcast.service.ts       # "server:hello", "server:version" events
      [domain]-socket.service.ts         # per-domain push (weather alert / spotify event / ...)
```

- `getSocketServices()` array-be rakjuk az új service-eket
- Auth interceptor a socket connection-ön (a meglévő `A_Auth` mintát követve)
- Heartbeat / ping-pong default Socket.IO-val ingyen
- **Action-log** lifecycle (start/stop) + per-event (high-volume eseteket csak aggregálva)

### Eseménycsalád (vázlat)

| Channel | Direction | Payload | Mire |
|---|---|---|---|
| `server:hello` | S→C | `{ version, ts, env }` | connect-kor + reconnect-kor |
| `server:version` | S→C | `{ version, requireReload?: boolean }` | runtime version change |
| `client:hello` | C→S | `{ clientVersion, ts }` | client identify |
| `domain:weather:alert` | S→C | `{ alert }` | OMSZ alert push |
| `domain:spotify:event` | S→C | `{ event }` | playback event push |
| `domain:tasks:updated` | S→C | `{ taskRefs[] }` | invalidate kliens cache |
| `client:action` | C→S | `{ action, payload }` | command-channel (REST helyett) |

---

## Architektúra (kliens-oldal)

```
client/src/app/_services/
   socket/
      a-socket.client-service.ts            # Socket.IO client wrapper, auto-reconnect
      a-version-watch.control-service.ts    # server-version diff → reload trigger
   ...

client/src/app/_components/
   status-bar/
      status-bar.component.ts               # info-bar: server-version + client-version
```

- **Status-bar** (footer / header sávban) mindig mutatja: `srv: v1.2.3 | cli: v0.4.0`
- **Auto-reload UX**: subtle banner "Új szerver verzió — frissítsd / 5 másodperc múlva auto-reload" → user-OK vagy timeout
- Pattern követjük az FDP `ngx-dynamo` / `fdp-templates-ngx` minta szerint

---

## Adat-séma (vázlat)

```ts
ServerHelloPayload {
  version: string;       // "1.2.3" - SemVer from package.json
  ts: string;            // ISO timestamp
  env: 'dev' | 'test' | 'prod';
  buildHash?: string;    // git commit short hash (build-time inject)
}

VersionChangePayload {
  version: string;
  previousVersion: string;
  requireReload: boolean;     // hard reload kell-e, vagy csak info
  graceSec?: number;          // hány másodperc countdown az auto-reload előtt
}
```

---

## Phase-elés

| Phase | Mit |
|---|---|
| 0 | ez a FR (most) |
| 1 | **Pattern-mapping research** — master-prompter / organizer hogy csinálja, Dynamo CLI mely modulja a forrás (`@futdevpro/ngx-dynamo`? `cli-dynamo`?) |
| 2 | **Server socket wire-up** — első `DyNTS_SocketServerService` regisztrálása `getSocketServices()`-ben + `server:hello` event |
| 3 | **Client socket-client + status-bar** — `a-socket.client-service.ts` + `status-bar.component.ts`, server + client verzió kijelzés |
| 4 | **Auto-version-update** — kliens-oldali version-watch + reload UX (banner + countdown + manual override) |
| 5 | **Domain-events migráció** — meglévő REST-poll cseréje socket-push-ra fokozatosan (weather alert, spotify event, tasks updated, ...) |
| 6 | **Build-pipeline integráció** — `dc cdp` step / `dc ldp` step automatikusan inject-elje a `buildHash`-t a `version`-be (vagy package.json bump pre-commit hook-ban) |

---

## Open kérdések

| Q# | Kérdés | Fontosság |
|---|---|---|
| Q-ver-1 | Melyik Dynamo CLI eszköz / package konkrétan? (`@futdevpro/cli-dynamo` dc parancs / `@futdevpro/ngx-dynamo` client / `@futdevpro/nts-dynamo` server / mind?) — verify reference projektből | high |
| Q-ver-2 | Reload UX: néma reload, vagy banner+OK, vagy countdown? Default javaslat: 5s countdown banner + manual reload gomb. | medium |
| Q-ver-3 | Status-bar elhelyezés: footer / header / külön widget? Mindig látható, vagy collapsible? | low |
| Q-ver-4 | Build-hash inject pipeline-on (commit short hash) — `dc cdp` step támogatja-e már, vagy saját pre-commit hook? | medium |
| Q-ver-5 | Auth socket-en: a meglévő `A_Auth` JWT-vel ugyanúgy, vagy külön socket-token? | medium |
| Q-ver-6 | Reconnect-policy: exponential backoff default OK? Max retry? | low |
| Q-ver-7 | Mely REST-endpointokat **migráljuk** socket-re Phase 5-ben (és melyek maradnak REST)? Heuristika: read-heavy + low-frequency = REST marad; push-szerű = socket. | medium |
| Q-ver-8 | Verzió-mismatch policy: csak server > client esetén reload, vagy fordítva is (downgrade)? | low |
| Q-ver-9 | LDP (live dev pipeline) restart során a verzió változik-e? Ha igen, dev-módban néma reload, prod-módban banner? | medium |

---

## Error-handling — Dynamo pattern kötelező 🔴

Magas prio követelmény (`current/principles/error-handling.md`):
- **Szerver**: socket-event-handler-ek try/catch + `DyFM_Error` errorCode-dal
  (`MA-SOCKET-<CODE>`) + `additionalContent` (event-name, clientId, payload-keys)
  → globális handler → `Errors_DataService` perzisztál
- **Kliens**: `a-socket.client-service` minden error-t `A_Error_ControlService.showError(err, 'socket')`-en át mutat (no `[object Object]`)
- **Reconnect-loop hibák**: debug-level descriptive, perzisztálva — silent retry tilos
- **Version-mismatch hiba** (pl. proto-incompatibility): DyFM_Error `MA-SOCKET-VERSION-MISMATCH` + reload UX trigger
- Lásd `current/feature-requests/runtime-error-api.md` (🟢 backlog 3b)

## Kapcsolódó

- `current/principles/error-handling.md` — debug-level error kötelező mindenhol
- `current/feature-requests/runtime-error-api.md` — runtime error API (Dynamo Logs Service)
- `server/src/app.server.ts` — `DyNTS_AppExtended` + `getSocketServices()` belépési pont
- `client/src/app/_services/api-services/a-server.api-service.ts` — meglévő REST server API client
- `current/principles/build-it-ourselves.md` — saját client wrapper, FDP minta követve
- `current/principles/ssot.md` — a server a verzió SSoT-ja, a kliens passzív listener
- Master Prompter / Organizer / Overseer — pattern-mapping referencia projektek (CLAUDE.md "Pattern-based Development" szakasz)
- `@futdevpro/nts-dynamo/socket` — már bekötve
- `@futdevpro/ngx-dynamo` — kliens socket-client valószínű forrása

---

## Migráció organizer-be (later)

| Lokál | Organizer |
|---|---|
| Cím | `title: "Socket-rendszer + auto-version-update + verzió-info bar"` |
| Initial deklaráció | `description` (markdown) |
| Phase-elés | `task-group` sub-task-okkal (Phase 1-6) |
| Open kérdések | `acceptanceCriteria[]` |
| Kapcsolódó | `relatedRefs[]` |

---

## Status

🅿️ Felírva. Phase 0 kész. Server-oldali socket-réteg már building-block szinten
megvan (`DyNTS_AppExtended` + üres `getSocketServices()`). Phase 1 (pattern-mapping
research) a következő — mielőtt kódot írunk, **kötelező** a master-prompter /
organizer kliens-szerver páros megnézése a pontos Dynamo CLI tool azonosítására.

---

## 2026-05-16 — megerősítés + LDP integráció

> Szeretném, hogyha a felület kapcsolódna a szerverhez WebSocket-tel,
> szeretném, hogyha a kommunikáció nagyja azon a WebSocket-en keresztül
> történne, és amikor a szerver verzió update-elődik, akkor a klienc
> töltődjön újra. Ezt mind a WebSocket-en keresztül szeretném, hogyha
> jeleztetnénk. Szeretném, hogyha az LDP-ben benne lenne a verzió update
> is, valamint a felületen is jelenjen meg a verzió.

### Új scope-elemek (2026-05-16)

- **LDP `pipeline.config.json`** bővítendő **`version-bump` step**-pel:
  szerver deploy idejekor `server/package.json` `version` bump (patch/minor)
  → commit → kliens broadcast trigger
- **Felület verzió-info bar** (status-bar a layout alján vagy header-ben):
  `server v1.X.Y · client v1.A.B · last-update HH:mm`

### User-priorizálás 2026-05-16

🟢 **Most-fókusz** — backlog `#3f` (a `wave-panel` család után, de SOR-szinten ide kerül).
A FR self-contained, **NEM blokkoló** az ESM-migrációra, **ortogonális**
(server socket service add + client socket-client add + version-bar component).
