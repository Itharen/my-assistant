# `@my-assistant/client`

Angular 18 frontend for the my-assistant ecosystem. **FDP-shaped (`organizer/client`-mintát követi).** Talks to `@my-assistant/server` over HTTP.

---

## Folder layout (FDP frontend pattern)

```
client/
├── src/
│   ├── app/
│   │   ├── _collections/                  # constants, config (api-config.const.ts)
│   │   ├── _components/                   # global components, prefixed `a-`
│   │   ├── _directives/                   # custom directives (none yet)
│   │   ├── _enums/
│   │   │   ├── a-route.enum.ts            # canonical routes
│   │   │   └── a-storage-key.enum.ts      # localStorage keys
│   │   ├── _interceptors/
│   │   │   ├── a-auth.interceptor.ts      # Bearer token from localStorage
│   │   │   └── a-error.interceptor.ts     # global HTTP error log
│   │   ├── _models/
│   │   │   └── server-envelope.interface.ts
│   │   ├── _modules/                      # feature modules (lazy-loaded)
│   │   │   └── status/                    # /status — server snapshot view
│   │   │       ├── status.module.ts
│   │   │       └── _components/s-home/
│   │   ├── _pipes/                        # custom pipes (none yet)
│   │   ├── _services/
│   │   │   ├── api-services/
│   │   │   │   └── a-server.api-service.ts
│   │   │   ├── control-services/
│   │   │   └── data-services/
│   │   ├── _styles/                       # global SCSS
│   │   ├── app.component.{ts,html,scss}
│   │   ├── app.module.ts
│   │   └── app.routing-module.ts
│   ├── main.ts
│   ├── index.html
│   └── styles.scss
├── angular.json
├── pipeline.cicd.config.json              # FDP CI/CD pipeline
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
└── README.md
```

Naming convention (matches organizer/client):
- Global components → `A_*` prefix (template selector `a-*`)
- Module-prefixed components → first letter of module (`S_Home_Component` for `status` module, selector `s-home`)
- Services → `*_ApiService`, `*_ControlService`, `*_DataService`
- NgModules → `*_Module`

---

## Setup

```bash
cd client
pnpm install
pnpm run build-base
pnpm test
pnpm start                # ng serve on http://127.0.0.1:4224
```

---

## Connecting to the server

The client talks to `@my-assistant/server` (see `../server/`). Defaults:

- Base URL: `http://127.0.0.1:39245` (override via `localStorage["ma.server-base-url"]`)
- Auth token: read from `localStorage["ma.auth-token"]` if present (loopback dev mode doesn't need it)

To set in browser dev console:
```js
localStorage.setItem('ma.server-base-url', 'https://my-server:39245');
localStorage.setItem('ma.auth-token', 'YOUR_TOKEN');
```

---

## Tests + coverage

```bash
pnpm test                 # ng test in headless Chrome, run-once
pnpm run test:coverage    # + code-coverage report
```

Spec files: `src/**/*.spec.ts` (Karma + Jasmine, the standard Angular testbed).

---

## CI/CD

`pipeline.cicd.config.json` — FDP Overseer pipeline (install → build → test → coverage → discord-notify).

---

## Modules (Phase 1 scope)

| Module | Path | Status |
|---|---|---|
| **status** | `/status` | placeholder — calls `GET /status` and renders the snapshot |
| _actions_ | `/actions` | TBD — paged action-log viewer |
| _user-input_ | `/user-input` | TBD — pending blocks + form to submit new ones |
| _activity_ | `/activity` | TBD — activity-monitor stream |

Phase 2 will add the remaining modules. The skeleton is wired so a new module is just:

1. New folder under `src/app/_modules/<name>/`
2. Module + routing
3. Add to `_enums/a-route.enum.ts`
4. Add lazy-load in `app.routing-module.ts`
5. Add nav link in `app.component.html`
