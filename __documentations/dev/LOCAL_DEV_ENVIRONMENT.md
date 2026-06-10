# Local dev environment — `my-assistant`

> Hogyan futtasd a my-assistant-et lokálban Windows-on. Új gépen ezt kell végigcsinálni.

---

## 1. Prerequisites

| Tétel | Verzió | Mire kell |
|---|---|---|
| Node.js | ≥ 20 | A 3 TS sub-projekt futtatásához |
| pnpm | ≥ 10 | Workspace package manager |
| `dc` (Dynamo CLI) | 01.15+ | LDP / CDP futtatás (`dc ldp`, `dc cdp`); npm: `@futdevpro/cli-dynamo` |
| `fo` (organizer-cli) | 1.1.10+ | Organizer test env eléréshez (lásd `cli/scripts/update-fo.ps1`) |
| Angular CLI | ≥ 18.2 | Client build + test |
| Headless Chrome | bármi recent | Karma client tesztekhez |
| PowerShell | ≥ 5.1 | activity-monitor + script-ek |

```powershell
# Globális telepítés
npm i -g pnpm rimraf @angular/cli @futdevpro/cli-dynamo
node --version  # >= 20
```

## 2. Első futás

```bash
cd E:\Programming\Own\CURSOR\LIVE-projects\my-assistant
pnpm prep                  # Telepíti a 3 sub-projektet (cli + server + client)
```

Ez ~3-5 perc (client Angular 18 deps ~700+ packages). A `prep` futtatja:

1. Root `pnpm i` (csak ez a package.json, kevés dep)
2. `cd cli && pnpm i`
3. `cd ../server && pnpm i`
4. `cd ../client && pnpm i`

### 2.1 Server-DB

A server első indításakor a SQLite DB auto-create-elődik (`server/data/my-assistant.db`). Migration az `db.core-service.ts`-ben fut, version-tracked.

### 2.2 Spotify config (csak ha a Spotify resume kell)

```bash
ma spotify auth
```

(Részletes setup: `cli/README.md` Spotify config szakasz.)

### 2.3 .env (root)

```bash
# my-assistant/.env (gitignored)
FDP_ORGANIZER_API_KEY=fdp_mcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

(Az `fo` CLI-hez kell, az organizer test env-be való belépéshez.)

## 3. Indítás

### 3.1 Teljes dev-pipeline (LDP — ajánlott)

```bash
pnpm start                 # alias: pnpm run ldp = dc ldp
```

Ez elindítja a Live Development Pipeline-t a `pipeline.config.json` alapján:

1. Watch-olja `cli/src`, `server/src`, `client/src`
2. File-change → 30s debounce → 8-step build+test loop fut: rimraf-cli-dist → tsc-cli → cli-test → rimraf-server-dist → tsc-server → server-test → client-build → client-test
3. Sikeres lefutás → `node server/dist/index.js` (re)start a 39245 porton
4. Stdout: server logja; minden építési step külön log-fájl `logs/live-dev-pipeline/` alatt

Egy flow, egyetlen process-fa, strukturált step-tracking — pontosan amit az LDP-től várunk.

> **Megjegyzés a deprecation warning-ra:** `dc ldp` futáskor egy figyelmeztetés látszik: `[dynamo-config] Deprecated location: 'pipeline.config.json' found at project root. Move it to '.dynamo/pipeline.config.json'`. **NE mozgasd át** — a `.dynamo/`-ba költözés a launcher egy másik bug-ját triggereli (cwd-resolution config-relatív, ezért `cd cli` "The system cannot find the path specified"-tal fail-el). Részletek: `__documentations/DECISIONS.md` DEC-MA-008.

### 3.2 Egyik sub-projekt önállóan

```bash
pnpm run start-server         # tsx watch src/index.ts (server)
pnpm run start-server-prod    # build + node dist/index.js (production-szerű)
pnpm run start-client         # ng serve --port=4224
pnpm run start-cli            # build + ma --help
```

### 3.3 Server prod mode

```bash
pnpm run start-server-prod
# vagy
cd server && pnpm run start-prod
```

## 4. Tesztek

```bash
pnpm test               # cli + server + client sequentially
pnpm run test-cli       # csak cli
pnpm run test-server    # csak server
pnpm run test-client    # csak client (headless Chrome)
pnpm run test:coverage  # mind a 3 c8 / karma-coverage report-tal
```

## 5. Build

```bash
pnpm run build          # cli + server + client mind production-build
pnpm run build-clean    # clean + prep + build (full reset)
pnpm run build-cli      # csak cli
pnpm run build-server   # csak server
pnpm run build-client   # csak client
```

## 6. Per-sub-projekt parancsok (közvetlen)

Néha a sub-projektben akarsz dolgozni (debug, focused dev). Akkor:

```bash
cd cli
pnpm run typecheck
pnpm test
pnpm run build-base
pnpm run discover --pretty   # bármi `ma <command>`-szerű script
```

(Hasonlóan `cd server` és `cd client`.)

## 7. activity-monitor (Windows Task Scheduler)

A logger nem fut by default. Ha akarod, hogy automatikusan induljon belépéskor:

```powershell
$action = New-ScheduledTaskAction -Execute "pwsh.exe" `
    -Argument "-NoProfile -WindowStyle Hidden -File E:\Programming\Own\CURSOR\LIVE-projects\my-assistant\server\activity-monitor\logger.ps1" `
    -WorkingDirectory "E:\Programming\Own\CURSOR\LIVE-projects\my-assistant"
$trigger = New-ScheduledTaskTrigger -AtLogon
Register-ScheduledTask -TaskName "my-assistant-activity-logger" `
    -Action $action -Trigger $trigger `
    -Description "my-assistant L2 activity logger" `
    -RunLevel Limited
```

(Részletek: `__specifications/features/activity-monitoring.md` §5.)

## 8. CI/CD pipeline (CDP) lokálisan

Minden sub-projekt CDP-jét lokálban is futtathatod a `dc cdp`-vel:

```bash
cd cli && dc cdp        # cli pipeline
cd ../server && dc cdp  # server pipeline
cd ../client && dc cdp  # client pipeline
```

Push-on automatikusan fut az Overseer-ben (kell hozzá az org-szintű webhook + Overseer-secret env var).

## 9. Útvonal-térkép

| Mit akarsz | Hova menj |
|---|---|
| Workspace inventory (33 projekt) | `__agent/references/workspace-projects.md` |
| Architecture | `__documentations/ARCHITECTURE.md` (rövid) + `__agent/references/architecture.md` (részletes) |
| Spec belépő | `__specifications/main.md` |
| Pattern audit | `__agent/references/pattern-audit.md` |
| Decisions log | `__documentations/DECISIONS.md` |
| Mi van most folyamatban | `__agent/STATUS.md` |
| Mi a TODO mostantól | `__specifications/TODO.md` |
| Mi a backlog | `__specifications/BACKLOG.md` |

## 10. Hibaelhárítás

### "node-gyp build failed" (better-sqlite3 install)

A `server/package.json` tartalmazza `pnpm.onlyBuiltDependencies: ["better-sqlite3"]`. Ha a build mégis fail:

```bash
cd server
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Karma + Headless Chrome nem indul

Ellenőrizd hogy van rendszer-szinten Chrome. Ha nincs: telepítsd vagy állíts be `CHROME_BIN` env-et.

### "MA_AUTH_TOKEN required" hiba

A server non-loopback (0.0.0.0) bind-on auth tokent vár. Vagy:
- Maradj loopback-on (`MA_BIND_HOST=127.0.0.1`)
- Vagy adj meg `MA_AUTH_TOKEN`-t a `.env`-ben

### dc parancs nem található

Telepítsd globálisan: `npm i -g @futdevpro/cli-dynamo`. Ellenőrzés: `dc --version` (várt: 01.15+).

### fo parancs nem található

A `cli/scripts/update-fo.ps1` script telepíti. Lásd: `cli/README.md` Spotify config szakasz, vagy `__agent/references/organizer-cli-setup.md`.
