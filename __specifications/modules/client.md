# Modul: `client/` — `@my-assistant/client`

**Pattern partner:** `LIVE-projects/organizer/client/`
**Implementációs referencia:** `__documentations/ARCHITECTURE.md` 3. szakasz + [`client/README.md`](../../client/README.md).

---

## 1. Cél

Angular 18 frontend a my-assistant ecosystem-hez. Egyetlen single-user UI, ami a `server/` HTTP endpointjait fogyasztja. NgModule mode (NEM standalone), FDP minta szerinti folder layout, lazy-loaded feature modulok.

## 2. Phase 1 scope

A Phase 1 skeleton **egyetlen** placeholder modult tartalmaz:

| Modul | Path | Mit csinál |
|---|---|---|
| `status` | `/status` | `GET /status`-t hív, és a JSON snapshotot kirajzolja (server-time, uptime, ticks-today, latest tick, activity state, recent actions) |

Phase 2-ben hozzáadandó: `actions`, `user-input`, `activity`, `recurring`. Lásd `__specifications/BACKLOG.md`.

## 3. Funkcionális elvárások

### 3.1 Connect a server-hez

- **Default base URL:** `http://127.0.0.1:39245` (matches `server/.env.sample`)
- **Override:** `localStorage["ma.server-base-url"]`
- **Auth token:** `localStorage["ma.auth-token"]` ha jelen — `Authorization: Bearer <token>` minden HTTP request-ben (interceptor)
- Loopback dev mode: token nem kötelező (server trusts loopback)

### 3.2 Routing

- `/` → redirect `/status`
- `/status` → `Status_Module` (lazy-loaded)
- `**` → fallback redirect `/status`

Új modul beillesztése: 1 új folder `_modules/<name>/`, 1 új enum-érték `_enums/a-route.enum.ts`, 1 új lazy-load `app.routing-module.ts`-ben.

### 3.3 Interceptors (KÖTELEZŐ)

| Interceptor | Felelősség |
|---|---|
| `A_Auth_Interceptor` | Bearer token hozzáadása ha localStorage-ban van |
| `A_Error_Interceptor` | Globális HTTP hiba-log (Phase 2: routing-toast service-re) |

### 3.4 Naming convention

(matches organizer/client)

| Artifact | Pattern | Példa |
|---|---|---|
| Module class | `<Name>_Module` | `Status_Module`, `App_Module` |
| Module-prefixed component class | `<Prefix>_<Name>_Component` | `S_Home_Component` |
| Module-prefixed selector | `<prefix>-<name>` | `s-home` |
| Global component class | `A_<Name>_Component` | `A_Loading_Component` |
| Global component selector | `a-<name>` | `a-loading` |
| Service postfix | `*_ApiService`, `*_ControlService`, `*_DataService` | `A_Server_ApiService` |
| Interceptor | `A_<Name>_Interceptor` | `A_Auth_Interceptor` |

## 4. Technikai elvárások

| Tétel | Érték |
|---|---|
| Stack | Angular 18.2 (NgModule mode), SCSS, RxJS 7 |
| Dev | `ng serve --port=4224 --host=127.0.0.1` |
| Build | `ng build --configuration production` → `dist/client/` |
| Tests | Karma + Jasmine + headless Chrome |
| CI/CD | `client/pipeline.cicd.config.json` 7-step FDP minta |
| Test count | 7 spec (Phase 1 skeleton) |

## 5. Fájl-struktúra (FDP frontend pattern)

```
client/src/app/
├── _collections/                 # api-config.const.ts
├── _components/                  # global components prefixed `a-`
├── _directives/
├── _enums/
│   ├── a-route.enum.ts           # canonical routes
│   └── a-storage-key.enum.ts     # localStorage keys
├── _interceptors/
│   ├── a-auth.interceptor.ts
│   └── a-error.interceptor.ts
├── _models/
│   └── server-envelope.interface.ts
├── _modules/
│   └── status/                   # Phase 1: only placeholder
│       ├── status.module.ts
│       └── _components/s-home/
├── _pipes/
├── _services/
│   ├── api-services/
│   │   └── a-server.api-service.ts
│   ├── control-services/
│   └── data-services/
├── _styles/
├── app.component.{ts,html,scss}
├── app.module.ts
└── app.routing-module.ts
```

## 6. Eltérések organizer/client-től (szándékos)

- **NgModule mode** ✅ matches partner (NEM standalone)
- **Tailwind / Material:** ❌ mine NEM (Phase 2-re)
- **Angular Material services / `@futdevpro/ngx-*` packages:** ❌ mine NEM
- **proxy-local.conf.json:** ❌ mine NEM (mine talks directly to absolute URL)
- **Strict tsconfig:** ✅ szigorúbb, mint organizer (organizer relaxes `strict: false`)
- **Port:** 4224 (organizer 4212) — szándékosan eltérő, hogy lehessen párhuzamosan futtatni

## 7. Kapcsolódó

- Implementációs referencia: `__documentations/ARCHITECTURE.md`
- Pattern audit: `__agent/references/pattern-audit.md` 4. szakasz
- Forrás-FR-ek: nincs explicit FR (a UI a server endpointjait konzumálja, ami a server-FR-jén alapul)
