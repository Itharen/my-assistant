# Plan — SSoT cross-subproject + Server ESM migration

> **Cél**: bevezetni az FDP-stílusú cross-subproject path mapping-et a
> my-assistant 3-rétegű repóra (cli + server + client). Ez **előfeltétele**
> a Spotify + Google integrációk frontendre vezetésének (FR:
> `current/feature-requests/google-home-integration.md`).
>
> **Forrás-elv**: `current/principles/ssot.md` — a cross-subproject pattern
> ott van részletesen leírva. Ez a plan az implementáció lépéseit rögzíti.

---

## Scope

A jelenlegi állapot:
- `cli` (TypeScript ESM, `type: module`, tsx) — működik
- `server` (TypeScript **CommonJS**, `ts-node`, nodemon) — működik, de **nem
  tudja natívan importálni a CLI ESM moduljait**
- `client` (Angular 18, TypeScript ESM, `moduleResolution: bundler`) — működik

A cél állapot:
- Server is **ESM** lesz (`type: module`, ESM tsconfig, `tsx` exec)
- Mind a 3 subproject tsconfig.json-jában path mapping a többi subprojekt source-jaira
- Minden DTO / interface kanonikus helye **`server/src/_models/...`**
- Client + CLI innen importál `import type`-pal
- Server importálhatja a CLI runtime moduljait `import`-tal (ESM-ESM)

---

## Phase 1 — Server ESM migration

### 1.1 `server/package.json`

- Hozzáadni: `"type": "module"`
- A `main` mező maradhat `"index.ts"` vagy `"build/index.js"` (mongodb dep
  miatt mostanra mindegy)
- A `scripts` blokkban:
  - `"start-dev": "ts-node ./src/index.ts"` → `"start-dev": "tsx ./src/index.ts"`
  - `"nodemon-run": "ts-node ./src/index.ts"` → `"nodemon-run": "tsx ./src/index.ts"`
  - Megtartani a `nodemon`-t mint dev-runner — a `tsx`-szel kombinálva ESM-en is megy
- Új devDep: `"tsx": "^4.7.0"` (CLI-ben már megvan, server-ben még nem)

### 1.2 `server/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",                 // CHANGED: commonjs → ES2022
    "moduleResolution": "bundler",      // CHANGED: új mező (volt: implicit "node")
    "outDir": "./build",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "importHelpers": true,
    "resolveJsonModule": true,
    "noImplicitOverride": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "sourceMap": true,
    "types": ["node", "jasmine"]
    // allowJs maradhat / nem
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

**Miért bundler resolution és nem nodenext?** A `bundler` mode nem követeli
meg a `.js` extension-t a relative import-okban (TS 5.0+ feature). Így a 20
meglévő relative import a `server/src`-ben **nem kell átírni**. A CLI is
ezt használja → konzisztens.

### 1.3 `server/nodemon.json`

A meglévő `exec: "npm run nodemon-run"` változatlan; az alatt a tsx fut majd
(1.1 miatt). A `delay: 1500ms` és `ext: "ts,json"` jó.

### 1.4 Smoke test

```powershell
cd server
pnpm i tsx
pnpm run typecheck
pnpm run start-dev
# várt: server elindul, ugyanúgy logol mint eddig
```

Ha valamelyik dep CommonJS-only és import-időben pukkan (pl. `castv2-client`,
de az csak CLI-ben van), az hibát dob. **Várt esetben minden ESM-kompatibilis**
(express ESM-mel megy, mongoose ESM-mel megy, FDP packages CommonJS-ek de a
TS interop kezeli).

---

## Phase 2 — Path mappings

### 2.1 `server/tsconfig.json` paths

```json
"paths": {
  "@server/*": [ "./src/*" ],
  "@cli/*":    [ "./../cli/src/*" ]
}
```

(A `@server/*` self-mapping is elérhető — a server-en belüli importok
deep-relative path helyett `@server/_models/...`-re cserélhetők, később.)

### 2.2 `cli/tsconfig.json` paths

```json
"paths": {
  "@cli/*":    [ "./src/*" ],
  "@server/*": [ "./../server/src/*" ]
}
```

### 2.3 `client/tsconfig.json` paths

```json
"paths": {
  "@server/*":      [ "./../server/src/*" ],
  "@server-models": [ "./src/app/_models/server-index.ts" ],
  "@server-enums":  [ "./src/app/_enums/server-index.ts" ]
}
```

### 2.4 Validation

```powershell
cd server && pnpm typecheck
cd ../cli && pnpm typecheck
cd ../client && npx tsc --noEmit
```

Mindenhol zöld kell legyen. (A path mapping-ek csak akkor okoznak hibát ha
ténylegesen használjuk őket — ezen a ponton csak konfig.)

---

## Phase 3 — Type extraction (canonical types → server)

### 3.1 Új mappa

```
server/src/_models/interfaces/integrations/
├── spotify.interface.ts        ← SpotifyConfig, PlaybackSnapshot, SpotifyDevice
├── google.interface.ts         ← GoogleAssistantConfig, GoogleInstalledCreds, GoogleRuntimeConfig, QueryOptions, QueryResult
└── cast.interface.ts           ← CastDevice, NetIface, CastVolumeState (ahol kell)
```

Pure-type fájlok, csak `export interface` / `export type` — semmi runtime
import.

### 3.2 CLI modulokat ráállítani

A jelenlegi `cli/src/spotify/spotify.client.ts` típusait kivenni, helyette:
```typescript
import type {
  SpotifyConfig,
  PlaybackSnapshot,
  SpotifyDevice,
} from '@server/_models/interfaces/integrations/spotify.interface';
```

Ugyanígy `cli/src/google/google-assistant.client.ts`. Cast-ra (most még) nem
kell, de a mintát ott is alkalmazzuk amikor a frontend-irányt kiépítjük.

### 3.3 Verifikáció

```powershell
cd cli && pnpm typecheck
# 0 hiba — a types most a server-ből jönnek
```

---

## Phase 4 — Barrel files (client)

### 4.1 `client/src/app/_models/server-index.ts`

```typescript
// Re-export minden client-számára-elérhető type-ot a server kanonikus modeljeiből.
// FDP-pattern (master-prompter mintára).

export type {
  SpotifyConfig,
  PlaybackSnapshot,
  SpotifyDevice,
} from '@server/_models/interfaces/integrations/spotify.interface';

export type {
  GoogleInstalledCreds,
  GoogleRuntimeConfig,
  GoogleAssistantConfig,
  QueryResult,
} from '@server/_models/interfaces/integrations/google.interface';

// Existing data-models (capture, wave, insight) — ahogy bejönnek
// (most csak a frontend-fogyasztott part)
```

### 4.2 (opcionális) `client/src/app/_enums/server-index.ts`

Ha lesz enum-okat re-exportálni, ide. Egyelőre nincs.

---

## Phase 5 — Server controllers (Spotify + Google)

### 5.1 `server/src/_routes/spotify/`

```
spotify.controller.ts        DyNTS_Controller-t terjeszti
  endpoints:
    GET  /status              spotify-status.command-mintára (loadConfig, ensureFreshToken, getCurrentPlayback, listDevices)
    GET  /auth/start          OAuth URL generálás, state ment session-be
    GET  /auth/callback       code → tokens, ment cli/config/spotify.json-be
    POST /resume              wrap a CLI sendResume-ját

spotify.data-service.ts      üzleti logika; importálja a CLI client-et:
                             import { ensureFreshToken, getCurrentPlayback, listDevices, transferPlayback }
                             from '@cli/spotify/spotify.client'
```

### 5.2 `server/src/_routes/google/`

```
google.controller.ts         DyNTS_Controller
  endpoints:
    GET  /status              loadConfig + tokens-file check (status.command-mintára)
    GET  /auth/start          OAuth URL gen
    GET  /auth/callback       code → tokens + device registration → save
    POST /query               sendTextQuery wrap

google.data-service.ts       importálja a CLI client + auth-flow exporttal
```

### 5.3 Auth callback URL-ek update

A CLI flow eddig saját temp http-server-en figyelt (port 9876 + 9877). A
server-mode-ban a meglévő `/api` prefix alá megy a callback:
- Spotify: `http://127.0.0.1:39245/api/spotify/auth/callback` (Spotify dashboard-on hozzáadandó)
- Google: `http://localhost:39245/api/google/auth/callback` (GCP redirect_uris frissítendő)

**Ez user-akció** — egyszer kell, mindkét dashboardon. A plan végén egy
explicit checklist a usernek.

### 5.4 `app.server.ts`

A bootstrap-ben regisztrálni az új controller-eket:
```typescript
import { Spotify_Controller } from './_routes/spotify/spotify.controller';
import { Google_Controller } from './_routes/google/google.controller';
// ... + a getRoutingModules() vagy hasonló override-ban listázni
```

A pontos regisztráció-séma a meglévő controller-ek (Capture, Wave) mintájára.

---

## Phase 6 — Client integrations module

### 6.1 Új feature-modul

```
client/src/app/_modules/integrations/
├── integrations.module.ts                  lazy route /integrations
├── i-home/i-home.component.ts              landing — link gomb a sub-modulokhoz
├── i-spotify/i-spotify.component.ts        status panel + Re-auth button + current playback display
├── i-google/i-google.component.ts          status panel + Re-auth + test-query input
└── _services/
    └── i-integrations.api-service.ts        thin wrapper a server endpoint-okhoz
```

### 6.2 `A_Server_ApiService` extension

A meglévő `a-server.api-service.ts`-be új metódusok (vagy külön
`i-integrations.api-service.ts`-be):
```typescript
async getSpotifyStatus(): Promise<SpotifyStatus> { ... }
async startSpotifyAuth(): Promise<{ url: string }> { ... }
async getGoogleStatus(): Promise<GoogleStatus> { ... }
async startGoogleAuth(): Promise<{ url: string }> { ... }
async sendGoogleQuery(text: string): Promise<QueryResult> { ... }
```

(A `SpotifyStatus`, `GoogleStatus` types `@server-models`-ből jönnek — de
ha még nincsenek mint top-level interface-ek, létrehozandók a Phase 3-ban.)

### 6.3 Routing

`app.routing-module.ts`-be új route:
```typescript
{ path: A_Route.integrations, loadChildren: () => import('./_modules/integrations/integrations.module').then(m => m.Integrations_Module) }
```

A `A_Route` enumban új tag: `integrations = 'integrations'`.

---

## Validation summary (per phase)

| Phase | Verify command | Várt eredmény |
|---|---|---|
| 1 (ESM) | `cd server; pnpm typecheck && pnpm run start-dev` | ts-node-helyett tsx fut, server elindul |
| 2 (paths) | `pnpm typecheck` mindhárom subprojectben | 0 hiba |
| 3 (types) | `cd cli; pnpm typecheck` | 0 hiba, `cli/src/spotify/spotify.client.ts`-ben types most `@server/...`-ből |
| 4 (barrel) | `cd client; npx tsc --noEmit` | 0 hiba |
| 5 (controllers) | server elindul, manual: `curl http://localhost:39245/api/spotify/status` | JSON válasz |
| 6 (UI) | `cd client; pnpm start`, böngésző: `http://localhost:4224/integrations` | UI render, status panel látszik |

---

## User action checklist (ezeket Te csinálod)

1. **GCP OAuth client redirect URI frissítés** (Phase 5 előtt):
   - https://console.cloud.google.com/apis/credentials → OAuth 2.0 Client ID (Desktop app)
   - "Authorized redirect URIs"-be hozzáadni: **`http://localhost:39245/api/google/auth/callback`**
   - Save (a `http://localhost` is megmarad mint fallback a CLI-flow-hoz)

2. **Spotify OAuth client redirect URI frissítés** (Phase 5 előtt):
   - https://developer.spotify.com/dashboard → app → Settings
   - "Redirect URIs"-be hozzáadni: **`http://127.0.0.1:39245/api/spotify/auth/callback`**
   - Save (a `http://127.0.0.1:9876/callback` megmarad fallback-nek a CLI-flow-hoz)

3. **Re-auth a frontendről** (Phase 6 utáni teszt):
   - Megnyitni `http://localhost:4224/integrations`
   - Spotify panel → "Re-auth" gomb → browser dance → vissza
   - Google panel → "Re-auth" → browser dance → vissza

---

## Risks & rollbacks

- **Server ESM migráció elakadása**: ha valamelyik FDP package CommonJS-only
  és nem interop-ol → rollback Phase 1, marad ts-node + commonjs, és server
  → cli runtime-ot `await import()`-tal hívjuk (kicsit kevésbé tiszta de működik)
- **Path mapping ütközés**: ha valami transitively beránt egy server-only
  package-et a kliensbe → `import type` szigorítása, és/vagy Base+Extension
  szétválasztás
- **OAuth callback URL** mismatch → user-action checklist 1+2 pontot
  ellenőrizni
