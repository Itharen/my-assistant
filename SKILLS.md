# SKILLS.md — `CURSOR workspace (multi-project root)` tooling

Ez a fájl a projektben **ténylegesen használt** CLI-ket és eszközöket írja le, hogy a coding agent
(Codex / Claude Code) tudja, **mit mivel** kell futtatni. Kísérő fájlok: `CLAUDE.md` / `AGENTS.md`
(szabályok + architektúra). Rule: `core-agent-file-sync`.

> A `SKILLS:AUTO:BEGIN` … `SKILLS:AUTO:END` markerek közti rész **GENERÁLT** (forrás:
> `__agent/scripts/skills-md-generate.ps1`; adat: a projekt `package.json`-jai, config-fájljai,
> `__agent/scripts/` tartalma) — újrafuttatáskor **felülíródik**.
> Az azon **kívüli** rész kézi és megőrződik: oda írd a projekt-specifikus jegyzeteket.

<!-- SKILLS:AUTO:BEGIN -->
## 1. Flotta-szintű CLI-k (mindenhol elérhetők)

| CLI | Csomag | Mire való | Tipikus hívás |
|---|---|---|---|
| `dc` / `dyn-cli` | `@futdevpro/cli-dynamo` | Dynamo fejlesztői CLI: projekt-/kód-generálás, pipeline-futtatás, review, konvenció-validálás | `dc im` (interaktív), `dc cdp`, `dc ldp`, `dc rev --json` |
| `fdp` / `fdp-cli` | `@futdevpro/fdp-cli` | DevOps + Overseer lekérdezés: deploy, runner, build-report, logok, errorok | `fdp build-detail --project <p>`, `fdp errors --range 24h`, `fdp deploy-service --services <n>` |
| `dye2e` | `@futdevpro/dynamo-e2e` | E2E generátor + Visual-QA review-bundle | `dye2e generate-review-bundle`, `dye2e validate-manifest` |
| `fam` | `fdp-agent-memory` (MCP `:39265`) | Tudás-keresés / recall / szabály-lekérés — **MINDEN feladat elején** (rule: `fam-use-preferentially`) | MCP `read` a `rules` / `documents` / `codebase` táron |
| `pnpm` | — | **Az egyetlen** csomagkezelő a flottában (npm-kompatibilis) | `pnpm run prep`, `pnpm test` |

**Alap-szabályok a CLI-kre** (kanonikus: `fdp-documentations/rules/fdp-global/`):
- `fdp-use-existing-tooling` — a meglévő scriptet/CLI-t használd, ne írj sajátot mellé.
- `fdp-cli-only` — a DevOps-műveletek az `fdp` CLI-n mennek, nem kézi docker/ssh parancsokon.
- **Az NPM-scripteket ne bontsd szét** — a `pnpm test` már tartalmazza a build-lépést is.

**Pipeline-ok:**
- `dc ldp` — Live Dev Pipeline: felhúzza a LOKÁL instance-t és az ellen futtat (`pipeline.config.json`);
  státusz: `server/logs/live-dev-pipeline/status.json`.
- `dc cdp` — CI/CD Pipeline: a **deployolt test-szerver** ellen fut (`pipeline.cicd.config.json`).
  A CI-t az **Overseer** vezérli, nem a GitHub Actions (az csak webhook-trigger).

## 2. Ebben a projektben — MÉRT adatok

> Forrás: a projekt `package.json`-jai, config-fájljai és `__agent/scripts/` tartalma, beolvasva a generáláskor.

### 2.1 gyökér — `my-assistant`


| Script | Parancs |
|---|---|
| `pnpm run build` | `pnpm run build-cli ; pnpm run build-server ; pnpm run build-client ; pnpm run build-screen-waker` |
| `pnpm run ldp` | `dc ldp` |
| `pnpm run prep` | `pnpm i ; cd cli ; pnpm i ; cd ../server ; pnpm i ; cd ../client ; pnpm i ; cd ../screen-waker ; pnpm i` |
| `pnpm run start` | `dc ldp` |
| `pnpm run test` | `pnpm run test-cli ; pnpm run test-server ; pnpm run test-client ; pnpm run test-screen-waker` |
| `pnpm run test:coverage` | `pnpm run test-cli:coverage ; pnpm run test-server:coverage ; pnpm run test-client:coverage` |
| `pnpm run typecheck` | `pnpm run typecheck-cli ; pnpm run typecheck-server ; pnpm run typecheck-screen-waker` |

**További scriptek (csak név):** `activity-monitor` · `build-clean` · `build-cli` · `build-client` · `build-screen-waker` · `build-server` · `clean` · `clean-cli` · `clean-client` · `clean-screen-waker` · `clean-server` · `prepare` · `start-cli` · `start-client` · `start-screen-waker` · `start-server` · `start-server-prod` · `stocks:mirror` · `test-cli` · `test-cli:coverage` · `test-client` · `test-client:coverage` · `test-screen-waker` · `test-server` · `test-server:coverage` · `typecheck-cli` · `typecheck-screen-waker` · `typecheck-server` · `update-fo`

### 2.2 `cli/` — `@my-assistant/cli`

- **Telepített CLI-parancs (`bin`):** `ma` → `./bin/ma.js`

| Script | Parancs |
|---|---|
| `pnpm run build` | `npm run build-base && npm test` |
| `pnpm run build-base` | `rimraf ./dist && tsc -p tsconfig.json` |
| `pnpm run prep` | `npm i -g pnpm rimraf && pnpm i` |
| `pnpm run test` | `npm run build-base && jasmine --config=spec/support/jasmine.json` |
| `pnpm run test:coverage` | `npm run build-base && c8 --reporter=text --reporter=lcov --reporter=html jasmine --config=spec/support/jasmine.json` |
| `pnpm run typecheck` | `tsc --noEmit` |

**További scriptek (csak név):** `build-clean` · `build-n-test` · `clean` · `discover` · `google:auth` · `google:query` · `google:status` · `list-interfaces` · `notify` · `prepack` · `preset` · `soft-clean` · `spotify:auth` · `spotify:status` · `volume`

**Felismert eszközök a dependency-kből:** Jasmine (unit teszt) (`jasmine`) · TypeScript (`tsc`) (`typescript`)

### 2.3 `client/` — `@my-assistant/client`


| Script | Parancs |
|---|---|
| `pnpm run build` | `npm run build-base && npm test` |
| `pnpm run build-base` | `ng build --configuration production --base-href /` |
| `pnpm run lint` | `eslint src` |
| `pnpm run lint:fix` | `eslint src --fix` |
| `pnpm run prep` | `npm i -g pnpm rimraf @angular/cli && pnpm i` |
| `pnpm run start` | `ng serve --port=4224 --host=127.0.0.1` |
| `pnpm run test` | `ng test --watch=false --browsers=ChromeHeadless` |
| `pnpm run test:coverage` | `ng test --watch=false --browsers=ChromeHeadless --code-coverage` |
| `pnpm run validate:imports` | `dynamo-validate-imports` |
| `pnpm run validate:naming` | `dynamo-validate-naming` |

**További scriptek (csak név):** `build-clean` · `clean` · `ng` · `soft-clean`

**Felismert eszközök a dependency-kből:** Angular CLI (`ng`) (`@angular/cli`) · Dynamo ESLint konfiguráció (`@futdevpro/dynamo-eslint`) · ESLint (`eslint`) · Karma (Angular teszt-runner) (`karma`) · TypeScript (`tsc`) (`typescript`)

### 2.4 `screen-waker/` — `@my-assistant/screen-waker`


| Script | Parancs |
|---|---|
| `pnpm run build` | `tsc` |
| `pnpm run start` | `node build/index.js` |
| `pnpm run test` | `vitest run` |
| `pnpm run typecheck` | `tsc --noEmit` |

**További scriptek (csak név):** `clean` · `install:startup` · `start:background` · `start:dev` · `uninstall:startup`

**Felismert eszközök a dependency-kből:** TypeScript (`tsc`) (`typescript`) · Vitest (`vitest`)

### 2.5 `server/` — `@my-assistant/server`


| Script | Parancs |
|---|---|
| `pnpm run build` | `npm run build-base` |
| `pnpm run build-base` | `rimraf ./build && tsc` |
| `pnpm run lint` | `eslint src` |
| `pnpm run lint:fix` | `eslint src --fix` |
| `pnpm run prep` | `npm i -g pnpm rimraf nodemon copyfiles jasmine typescript && pnpm i` |
| `pnpm run start` | `npm run prep && nodemon` |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run validate:imports` | `dynamo-validate-imports` |
| `pnpm run validate:naming` | `dynamo-validate-naming` |

**További scriptek (csak név):** `build-clean` · `clean` · `nodemon-run` · `start-dev` · `start-prod`

**Felismert eszközök a dependency-kből:** Dynamo ESLint konfiguráció (`@futdevpro/dynamo-eslint`) · ESLint (`eslint`) · Express (`express`) · Mongoose (MongoDB ODM) (`mongoose`) · nodemon (watch-restart) (`nodemon`) · Socket.IO (`socket.io`) · TypeScript (`tsc`) (`typescript`)

### Konfigurációk és belépési pontok (jelenlévő fájlok)

- `.dynamo` — Dynamo CLI projekt-konfiguráció
- `.husky` — Git hookok (pre-commit gate)
- `__agent` — Agent-workflow mappa (STATUS / USER_INPUT / phases / scripts)
- `__specifications` — Specifikációk + TODO/BACKLOG task-források
- `__documentations` — Projekt-dokumentáció (ARCHITECTURE / DECISIONS / BEDROCK-FRS / CHANGELOG)
<!-- SKILLS:AUTO:END -->

## 3. Projekt-specifikus jegyzetek (KÉZI — a generátor nem írja felül)

_Ide jön minden, amit mérésből nem lehet kiolvasni: buktatók, kötelező sorrendek, környezeti előfeltételek,
credential-lelőhely, „ezt sose futtasd" figyelmeztetések. Ha itt üres, az annyit jelent: még nincs feljegyezve —
NEM azt, hogy nincs ilyen (`core-no-guessing`)._

### `ubh` — közös reliable browser workflow

- Tool repo: `E:/Programming/Own/CURSOR/LIVE-projects/unblockable-browser-handler-tool`.
- Minden agent baseline-ja ugyanaz a CLI; MCP csak azonos-contractú natív csatorna.
- Health: `node <tool>/server/build/src/index.js doctor --pretty`; discovery: `... capabilities --pretty`.
- Profilkötések SSOT-ja: `__agent/config/browser-profiles.json`.
- Tesco canonical namespace: `my-assistant-tesco-dedicated-v3`. Ezt minden agent közösen, változatlanul használja;
  nem agentnév és nem verzió, új suffix/profil létrehozása tilos.
- Ajánlott browser: dedikált persistent profil, egyszeri kézi login. Existing Chrome mód lehetséges, de az extensiont
  abban a profilban explicit telepíteni/párosítani kell. Jelszó/cookie/token soha nem env.
- Tesco/live mutation előtt olvasd: `__agent/references/browser-workflows.md` és `__agent/SOURCE_OF_TRUTH.md`.
- A teljes, kanonikus Tesco-kosár algoritmus az UBH repo
  `__documentations/TESCO-CART-RUNBOOK.md` fájlja; a My Assistant referencia csak consumer-overlay.
- Kötelező Tesco gate: canonical DOM product ID, per-effect readback, `unverifiedCartLines` fail-close, batch trolley
  audit, végül exact ID-halmaz + összdarabszám. Postcondition-hiba után vak retry tilos.
- `shopping = organizer-partial`: Organizer write csak explicit user approval + verify + readback után.
- Checkout/payment/CAPTCHA/sensitive transmission mindig action-time confirmation.

### Organizer stock mirror

- Kanonikus workspace-parancs: `pnpm stocks:mirror`; telepített/linkelt CLI esetén: `ma stocks mirror --pretty`.
- Teljes `stocks.list` + stockonként teljes `stock-items.list`, minden `nextCursor` követésével.
- Output: `current/stock/organizer-mirror.json`; a kézi `current/stock/items.md`-t soha nem írja felül.
- Biztonságos próba: `ma stocks mirror --dry-run --pretty`.
