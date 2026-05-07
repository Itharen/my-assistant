# Organizer — referencia

**Forrás:** `E:/Programming/Own/CURSOR/LIVE-projects/organizer/`
**Server verzió:** `01.15.24` (server/package.json)
**Last verified:** 2026-05-07 (live probe: ping + capabilities + CRUD smoke test env ellen)
**Cél:** my-assistant migrációs cél; **részben már használható** (lásd SOURCE_OF_TRUTH.md)

> Ez a my-assistant rendszer ideiglenes — amikor az organizer minden modulja
> verifikált lesz, átállunk natívra. A live modul-statust **`__agent/SOURCE_OF_TRUTH.md`**
> vezeti, ez a fájl a referencia / inventory.

---

## 1. Fő modulok / domain-ek

> **Részletes inventory** (implementált + tervezett modulok, MCP capabilities, backlog):
> [`organizer-modules.md`](organizer-modules.md) — ez az SSOT a modulok terén.

Rövid áttekintés: a `server/src/_routes/` alatt **23 route mappa** van. Ezek az API
domain-jeinek felelnek meg. (Egy szülő-domain + a tételeit külön route-on kezelő
gyerek-route-ok külön mappában szerepelnek.)

### Szülő domain-ek (11 db)

| Domain | Server route | Client modul | Státusz |
|---|---|---|---|
| **tasks** | `/api/task` + `/api/task-group` | `/tasks` | ✅ kész |
| **calendar** | `/api/calendar` + `/api/calendar-event` | `/calendar` | ✅ kész |
| **notes** | `/api/notes` + `/api/note-books` | `/notes` | ✅ kész |
| **diary** | `/api/diary-entry` | (admin?) | ✅ kész |
| **shopping-list** | `/api/shopping-list` + `/api/shopping-list-item` + `/api/buyable-item` + `/api/shop` | `/shopping-list` | ✅ kész |
| **stock** | `/api/stock` + `/api/stock-item` | `/stock` | ✅ kész |
| **wallet** | `/api/wallet` + `/api/wallet-history-item` | `/wallet` | ✅ kész |
| **wish-list** | `/api/wish-list` + `/api/wish-list-item` | `/wish-list` | ✅ kész |
| **user** | `/api/user` | `/user` | ✅ kész (FDP auth alapokon) |
| **server / errors / feature-request** | `/api/server`, `/api/feature-request` | `/admin` | ✅ kész |
| **MCP** | `POST /api/mcp` | (nincs UI) | ✅ kész — lásd 2. szakasz |

### my-assistant ↔ organizer mapping

| my-assistant domain | organizer route |
|---|---|
| `tasks` | `task` + `task-group` |
| `calendar` | `calendar` + `calendar-event` |
| `notes` | `notes` + `note-books` |
| `diary` | `diary-entry` |
| `shopping` | `shopping-list` + `shopping-list-item` |
| `stock` | `stock` + `stock-item` |
| `wallet` | `wallet` + `wallet-history-item` |
| `wishlist` | `wish-list` + `wish-list-item` |

Minden my-assistant domain-nek **van organizer-pár**. Migrációkor a `data/`-ban
lévő markdown adatokat kell kanonikus organizer JSON-ba konvertálni.

---

## 2. MCP elérhetőség

**Státusz:** ✅ MŰKÖDIK (`MVP0` … `MVP8` implementálva)

### Endpoint

- **URL:** `POST /api/mcp`
- **Protocol:** JSON-RPC 2.0
- **Forrás:** `server/src/_routes/mcp/mcp.controller.ts:50-72` — egyetlen POST endpoint
- **Auth:** API key (header) **vagy** Bearer token — mindkettő user-scoped
  (lásd `Auth_ControlService.authenticate_apiKeyOrToken`)

### Server URL-ek (DevOps konfig alapján — ✅ verifikált)

| Környezet | Base URL | MCP endpoint | Státusz |
|---|---|---|---|
| **Lokál** | `http://127.0.0.1:39125/api` | `POST http://127.0.0.1:39125/api/mcp` | dev-time |
| **Test** | `https://test.organizer.futdevpro.hu/api` | `POST https://test.organizer.futdevpro.hu/api/mcp` | ✅ él |
| **Dev** | `https://dev.organizer.futdevpro.hu` | (nginx van, de self-signed TLS) | konfig kész |
| **Prod** | `https://organizer.futdevpro.hu` | — | nginx blokk **kommentelve**, nem aktív |

**Forrás-fájlok:**
- Nginx routing: `fdp-devops/nginx/confs/organizer.conf:43-75` (test) — Let's Encrypt cert, proxy `https://test.organizer.futdevpro.hu` → `http://test-server:4212`
- Container portok: `fdp-devops/docker-compose.test.yml:213-239` — `organizer-server` container expose `39125/39126/39127/39912`, `organizer-client` `4212`
- SSL config: `fdp-devops/webhook/ssl-config.json:44` — `test.organizer.futdevpro.hu` enabled
- Lokál port konstans: `NPM-packages/fdp-templates/src/_constants/environment/port-env-settings.const.ts:131` — `organizer_http: 39125`
- `/api` prefix: standard FDP NTS routing (`NPM-packages/fdp-templates-nts/src/_collections/global-env-settings.util.ts:60`)

> **Megjegyzés** — az nginx csak a `4212` portra (Angular client) proxiz. A `/api/*` request-ek valószínűleg az Angular static container egy belső reverse-proxy / rewrite szabályán keresztül érnek a server `39125`-re. A CLI README ezt tényként kezeli (`https://test.organizer.futdevpro.hu/api/mcp`), tehát működik.

### Tool-ok (54 darab a `mcp-tool-name.enum.ts`-ben)

Implementált handler service-ek:

| Handler | Tool-csoport | Műveletek |
|---|---|---|
| `mcp.control-service.ts` | core | `organizer.ping`, `organizer.capabilities`, `organizer.search`, `organizer.resolve` |
| `notes/mcp-notes-handler.service.ts` | `notes.*` | list, get, create, update, archive, restore, request_destruction, confirm_destruction |
| `tasks/mcp-tasks-handler.service.ts` | `tasks.*` | list, get, create, update, archive, restore |
| `calendar/mcp-calendar-handler.service.ts` | `calendar.*` | list, get, create, update, delete |
| `wallet/mcp-wallets-handler.service.ts` | `wallet.*`, `wallet.transactions.*` | CRUD |
| `shopping/mcp-shopping-handler.service.ts` | `shopping-lists.*`, `shopping-items.*` | CRUD |
| `wishlist/mcp-wishlist-handler.service.ts` | `wishlists.*`, `wishitems.*` | CRUD |
| `stocks/mcp-stocks-handler.service.ts` | `stocks.*`, `stock-items.*` | CRUD + archive/restore |
| `feature-request/mcp-feature-request-handler.service.ts` | `feature-requests.*` | list, get, create |

### Hiányzók / nyitott pontok

- **Diary** domain MCP handler — nem találtam, nincs `mcp/diary/` mappa.
  ⚠️ A `organizer.capabilities` futtatása (probe 2026-05-07) megerősítette:
  `modules: [notes, tasks, calendar, shopping, stocks, wallet]`. Wishlist és
  feature-requests CRUD parancs van, de a capabilities listában nincs.
  Diary egyáltalán nem szerepel — jelenleg `current/diary/`-ban kezeljük lokálisan.
- **User** domain MCP handler — nincs (de lehet hogy szándékos, nem akarjuk MCP-n keresztül módosítani)
- **Roadmap & státusz részletek:** `LIVE-projects/organizer/__specifications/mcp-roadmap.md`

### Config snippet (Claude Code MCP-hez, amikor használjuk)

```json
{
  "mcpServers": {
    "organizer": {
      "url": "https://test.organizer.futdevpro.hu/api/mcp",
      "transport": "http",
      "headers": {
        "X-API-Key": "<my-api-key>"
      }
    }
  }
}
```

> Megjegyzés: az MCP standard transport STDIO vagy SSE — itt egy egyedi
> JSON-RPC-over-HTTP. Ellenőrizni kell, hogy a Claude Code MCP kliens elfogadja-e
> ezt a formát közvetlenül, vagy szükséges-e egy adapter / proxy.
> Alternatíva: a `fo` CLI-t használjuk wrapper-ként (lásd 4. szakasz).

---

## 3. Tesztrendszer

### E2E (Playwright)

**Státusz:** ✅ MŰKÖDIK
**Forrás:** `LIVE-projects/organizer/e2e/`

| | |
|---|---|
| Framework | Playwright `^1.49.0` |
| Base URL (default) | `http://localhost:4212` (e2e/playwright.config.ts:17) |
| Override | `E2E_BASE_URL` env |
| Auth | Permanens user — `E2E_PERSISTENT_USER_EMAIL` + `_PASSWORD` env |
| Worker model | HTTPS (deployolt env) → 1 worker (login race-elkerülés); lokál → default parallel |
| Reporter | `html`, `json`, `list` |

**Test suite-ok:** `tests/smoke/`, `tests/navigation/`, `tests/admin/`, `tests/calendar/`, `tests/diary/`, `tests/notes/`, `tests/tasks/`, `tests/wallet/`, `tests/modules/` (utóbbi `testIgnore`-on van)

**Parancsok (e2e/ mappából):**
```bash
pnpm run prep              # install + playwright browsers
pnpm test                  # full headless
pnpm run test:headed       # látható browser
pnpm run test:smoke        # csak smoke
pnpm run test:auth         # csak auth flow
pnpm run test:navigation   # csak navigáció
pnpm run report            # HTML report megnyitás
```

### Server unit (Jasmine)

| | |
|---|---|
| Framework | Jasmine `5.10.0` |
| Coverage | c8 (HTML + text + lcov) |
| Config | `server/jasmine.json` |

**Parancsok (server/ mappából):**
```bash
npm test                # build-base + jasmine
npm run test:coverage   # c8-tal
```

### Client unit (Karma + Jasmine)

Standard Angular ng test setup (lásd `client/package.json` ha kell részlet).

### CI integráció

`pipeline.cicd.config.json` step-ek: `tsc-server` → `server-test` → `client-build` → `client-test` → `docker-build`. Master/release branch-en Docker image build is.

---

## 4. CLI — `fo`

**Státusz:** ✅ MŰKÖDIK — de **külön repo-ban** (még nincs az organizer mellé integrálva)

| | |
|---|---|
| **Forrás repo** | `LIVE-projects/organizer-cli/` (külön projekt) |
| **CLI csomag** | `cli/` almappa — `@futdevpro/organizer-cli` v1.1.10 |
| **Bin command** | `fo` |
| **Entry point** | `cli/bin/fo.js` (TypeScript ESM, `cli/src/`-ből build-elve) |
| **Default target** | `test` → `https://test.organizer.futdevpro.hu/api/mcp` |
| **Cél** | Organizer MCP action-ök hívása JSON-RPC-n keresztül, machine-friendly JSON envelope output |

### Telepítés és frissítés

**Részletes setup + always-latest workflow:** [`organizer-cli-setup.md`](organizer-cli-setup.md).

Gyors verzió a `cli/` mappából:
```bash
pnpm run build-base   # tsc build dist/-be
npm i -g --force      # globális telepítés (npm link helyett)
fo --help
```

Vagy: `pnpm run build-n-test` (egyben: prep + build + test + global install + help check).
Vagy: `scripts/update-fo.ps1` (my-assistant projekten belüli refresh script).

### Használat

```bash
fo dev-switch --target local|test          # target váltás (perzisztens)
fo tasks list
fo tasks.list --filter-status "completed" --sort-by "dueDate"
fo notes get <id>
fo tasks create --name "..." --priority 1
```

### Auth

- API key tárolva **encrypted, target-enként:**
  - `~/.config/fo/api-key.test.enc.json`
  - `~/.config/fo/api-key.local.enc.json`
- Self-signed TLS (test env) override: `FO_TLS_INSECURE=1`

### Tesztrendszer (CLI saját)

| | |
|---|---|
| Framework | Jasmine 6.0 |
| Test runner | `node dist/__tests__/jasmine-runner.js` |
| Coverage | c8 |
| Spec mappa | `cli/spec/` |
| Parancs | `pnpm test` |

### Ismert problémák (test env-en)

- ~~`tasks.create` → JSON-RPC `-32603 Internal error`~~ **FIX** (2026-05-07 verified) — `fo tasks.create --title "..."` átmegy, valós ref jön vissza, archive utána szintén OK.
- `tasks.archive --if-match <etag>` flag a CLI help példájában szerepel, de a futtatható build **nem ismeri**. Egyedül `--ref`-fel hívható. Update műveleteknél az etag-szemantika tisztázandó (`fo tasks.update --help` minden új művelet előtt).

### Tervezett integráció

A memóriában rögzített backlog item ("Organizer CLI Integration"): az `organizer-cli` projektet
a fő `organizer/` repo-ba kell beintegrálni server/client mellé, hogy egy repo-ban legyen
minden. Jelenleg külön CI/CD-vel megy (lásd `LIVE-projects/organizer-cli/pipeline.cicd.config.json`).

---

## 5. Egyéb belépési pontok

### Web UI
- **Port:** `4212` (dev), Angular 18.2.13 + Material + Tailwind
- **Modulok:** `/main`, `/admin`, `/user`, `/calendar`, `/tasks`, `/notes`, `/shopping-list`, `/stock`, `/wish-list`, `/wallet`

### WebSocket (Socket.IO 4.8.1)
- **Service:** `Notification_SocketServerService`
- **Port:** ugyanaz mint HTTP (egy origin)

### Database
- **MongoDB** — default `mongodb://0.0.0.0:29017/organizer` (env `MONGO_URL`-rel felülírható)

### Külső integrációk (a server package.json-ben)
- `openai` 5.23.2 — AI feature-ökhöz
- `@leonardo-ai/sdk` 4.18.1 — kép generálás
- `nodemailer` — email
- `pdfkit` — PDF export

### Specifikációk

`LIVE-projects/organizer/__specifications/` alatt — ha a my-assistant rendszer
egy domain-jét bővíteni kell, először nézd meg, az organizer már lespecifikálta-e:

- `main.md`, `organizer-specifications.md`, `technical-specifications.md`
- `mcp-roadmap.md`
- `BACKLOG.md`, `TODO.md`
- `modules/{tasks, notes, calendar, shopping-list, diary, stocks, ai-assistant, health-nutrition, shop-trip}.md`
- `features/org-{tasks, notes, calendar, ...}.md`
- `task-priority.md` ← **érdekes** a my-assistant prioritás-séma esetleges összehangolásához

---

## 6. Mit jelent ez a my-assistant számára

### Most azonnal használható (organizer-ből)

| Komponens | Elérhetőség | Hogyan |
|---|---|---|
| Test env Web UI | ✅ él | `https://test.organizer.futdevpro.hu` |
| Test env MCP | ✅ él | `POST https://test.organizer.futdevpro.hu/api/mcp` |
| `fo` CLI | ✅ telepíthető | `LIVE-projects/organizer-cli/cli/` → `pnpm build-base && npm i -g --force` |
| Lokál dev (saját gép) | ✅ ha elindítod | `cd LIVE-projects/organizer/server && npm start` |

> **Tehát amit napi szinten ténylegesen használhatunk:** a `fo` CLI a test env ellen.
> Ezzel a my-assistant `data/tasks.md`-ben tárolt feladatok **átemelhetők organizer-be már most**,
> ha akarjuk — bár ehhez `tasks.create` jelenleg bug-os a test env-en, lásd CLI ismert problémák.

### Amint az organizer használhatóvá válik (production-ready)
1. **MCP-n keresztül natívan** olvasható/írható lesz minden domain — a my-assistant flow-k átfordíthatók: a `data/` markdown helyett MCP `tools/call`-ok (vagy `fo` CLI hívások)
2. **Migráció:** my-assistant `data/{domain}.md` → organizer JSON modellek `fo` CLI-vel; mező-map a my-assistant `domains/{X}.md` "Migráció organizer-be" szekciójában

### Triggerek a migrációhoz (modul-szintenként, nem globálisan)

A modulkövetkezi átkapcsolás (`organizer-partial` → `organizer-verified`) a
`SOURCE_OF_TRUTH.md` "Verifikációs kritériumok" listáját követi. Globális
trigger-listának már nincs értelme — modulonként haladunk.

Általános alapok (✅ már megvannak):
- [x] CLI elérhető — `fo` v1.1.10 működik
- [x] Test env nginx + SSL konfigurálva, él
- [x] `tasks.create` test env-en zöld (probe 2026-05-07)

Még mindig nyitva (egész system-szintű):
- [ ] E2E smoke tesztek zöldek a test env ellen (organizer e2e)
- [ ] Naponta többször használt UX — bizalom hogy nem szakad el adat
- [ ] Prod env aktiválva (jelenleg az nginx blokk **kommentelve** van)
- [ ] **Diary MCP handler** elkészítése (jelenleg `current/diary/`-ban lokál)
