# Workspace projects — információcsomag

**Last verified:** 2026-05-08
**Scope:** A teljes `E:/Programming/Own/CURSOR/` workspace projektjei és dokumentációi. Belépőpont a "milyen projektek vannak, hogyan kapcsolódnak, hol olvasok többet" kérdésekhez.

---

## 1. Absolut útvonalak — quick reference

### A) Központi dokumentációs csomag (közös, projekt-független)

Ez a workspace-szintű docsify alapú doksi, az FDP/OGS-szintű referenciákat itt kell keresni:

```
E:\Programming\Own\CURSOR\documentations\
```

**Belépőpontok ott:**
- `E:\Programming\Own\CURSOR\documentations\README.md` — teljes index
- `E:\Programming\Own\CURSOR\documentations\_sidebar.md` — docsify navigáció
- `E:\Programming\Own\CURSOR\documentations\live-projects-priorities.md` — **élő prioritás-mátrix** (HIGH/MEDIUM/LOW/NOT PRIORITY)
- `E:\Programming\Own\CURSOR\documentations\guidelines\` — fejlesztési irányelvek (`ai/`, `company/`, `development/`, `project-structures/`, `typescript/`)
- `E:\Programming\Own\CURSOR\documentations\specifications\` — package + service specs (`dynamo-packages/`, `fdp-packages/`, `services/`)
- `E:\Programming\Own\CURSOR\documentations\plans\` — globális tervek (pl. `global-feedback-system/`)
- `E:\Programming\Own\CURSOR\documentations\research\` — kutatási jegyzetek
- `E:\Programming\Own\CURSOR\documentations\temporary-notes\` — átmeneti munkajegyzetek
- `E:\Programming\Own\CURSOR\documentations\design-plans\` — design direction explorations

### B) Workspace-szintű governance / agent

```
E:\Programming\Own\CURSOR\CLAUDE.md                     # workspace-level Claude utasítások (FDP minta, naming, importek, push protokoll)
E:\Programming\Own\CURSOR\__agent\                      # workspace-szintű agent state container
```

### C) OGS-szintű központi dokumentáció (külön klaszter)

```
E:\Programming\Own\CURSOR\OGS-projects\__agent\         # OGS-shared agent rendszer (PRINCIPLES, CONVENTIONS, WORKFLOW, CCAP)
E:\Programming\Own\CURSOR\OGS-projects\documents\       # OGS GDD-k, legal, policies
  ├── Goldaholic\                                       # Goldaholic Game Design Document
  ├── Legal\
  └── Policies\
```

### D) Per-project doc-belépőpontok

Lásd a **3., 4., 5. szekciót** alább — minden projektnél fel van tüntetve a saját
README / `__documentations/` / `__specifications/main.md` absolut útvonala.

---

## 2. Workspace top-level layout

```
E:\Programming\Own\CURSOR\
├── CLAUDE.md                    # workspace-level Claude instructions
├── LIVE-projects\               # 32 production / WIP application
├── NPM-packages\                # 12 reusable @futdevpro/* packages + tgz-collection
├── OGS-projects\                # OldLight Gaming Studio projects
├── TEMPLATE-projects\           # FDP project scaffold templates
├── documentations\              # ★ központi docsify dokumentáció
├── fdp-devops\                  # Docker Compose stack-ek (local/test/prod)
├── fdp-github-actions\          # Reusable GitHub Actions workflowok
├── my-assistant\                # ← ITT VAGYUNK: a personal life-management projekt
├── __agent\                     # workspace-szintű agent state
└── sync.ffs_db                  # FreeFileSync DB
```

---

## 3. NPM-packages — reusable libraries

**Scope-root:** `E:\Programming\Own\CURSOR\NPM-packages\`

13 csomag (12 forrás + 1 artefactum). Mind `@futdevpro/*` namespace-en, pnpm-mel,
TypeScript 5.5.4-gyel. Build output mindenkinél `../tgz-collection/`-ba megy
(local linking).

| Mappa | Csomag | Verzió | Cél | Típus |
|---|---|---|---|---|
| `dynamo-builder-models` | `@futdevpro/dynamo-builder-models` | 01.15.10 | Full-stack model collection a Dynamo framework-höz | TS lib |
| `dynamo-cli` | `@futdevpro/cli-dynamo` | 01.15.42 | Dynamo CLI (`dc` command), project scaffolding | CLI |
| `dynamo-eslint` | `@futdevpro/dynamo-eslint` | 1.15.7 | Shared ESLint configs + validators (`dynamo-validate-imports`, `dynamo-fix`, …) | eslint config + CLI |
| `dynamo-fsm` | `@futdevpro/fsm-dynamo` | 01.15.8 | Full-stack models AI (OpenAI/Anthropic/Google), crypto, messaging, socket | TS lib |
| `dynamo-ngx` | `@futdevpro/ngx-dynamo` | 1.0.0-local | Angular 18 lib a Dynamo framework-höz (20+ komponens) | Angular lib |
| `dynamo-ngx-models` | `@futdevpro/ngx-dynamo-models` | 01.15.7 | Angular Dynamo frontend modellek | TS lib |
| `dynamo-nts` | `@futdevpro/nts-dynamo` | 01.15.15 | NodeTS backend framework (Discord bot, AI, OAuth2) | Server lib |
| `fdp-cli` | `@futdevpro/fdp-cli` | 01.15.25 | FDP CLI (`fdp` command), DevOps + Discord notify | CLI |
| `fdp-templates` | `@futdevpro/fdp-templates` | 01.15.23 | FDP projektek modelljei (account, auth, AI, organizer, token-service) | TS lib |
| `fdp-templates-ngx` | `@futdevpro/ngx-fdp-templates` | 1.0.0-local | Angular 18 FDP templates | Angular lib |
| `fdp-templates-nts` | `@futdevpro/nts-fdp-templates` | 01.15.25 | NodeTS FDP templates (auth service base, errors controller, user data) | Server lib |
| `master-control-mcp` | `@futdevpro/master-control-mcp` | 1.1.3 | MCP CLI (`mcm` command) — file system snapshot + utilities | CLI |
| `tgz-collection` | — | — | Bundled .tgz fájlok local linking-hez | Artifact folder |

### Inter-package dependency graph

```
dynamo-eslint (shared, dev-only)
    ↑ used by all packages

fsm-dynamo (core)
    ↑ peer of: nts-dynamo, ngx-dynamo, ngx-dynamo-models

dynamo-cli (cli-dynamo, dc command)
    ├─ dynamo-builder-models
    ├─ fsm-dynamo
    └─ nts-dynamo

ngx-dynamo (Angular)
    └─ ngx-dynamo-models

fdp-cli (fdp command)
    ├─ cli-dynamo
    ├─ dynamo-builder-models
    ├─ fdp-templates
    ├─ fsm-dynamo
    ├─ nts-dynamo
    └─ nts-fdp-templates

fdp-templates-ngx
    ├─ fsm-dynamo
    ├─ ngx-dynamo-models
    ├─ fdp-templates
    └─ ngx-dynamo

fdp-templates-nts
    ├─ fsm-dynamo (peer)
    ├─ nts-dynamo (peer)
    └─ fdp-templates (peer)
```

### Two-layer architecture

- **Dynamo layer** (alsó): generic full-stack framework-elemek (models, services, AI, sockets, errors)
- **FDP-templates layer** (felső): Dynamo-ra épülő FDP-specific minták (auth-service base, user models, errors controller, organizer endpoints, token service)

**Convention:** minden NPM package-en belül a forrás `src/` alatt, build a `build/` alatt.
A `package.json` tipikusan a `tgz-collection/` mappába build-tgz-zel publikál
local linking-hez.

### Doc entry points (per package)

A legtöbb NPM package-nek nincs külön README — a központi specifikáció
itt van: `E:\Programming\Own\CURSOR\documentations\specifications\dynamo-packages\`
és `E:\Programming\Own\CURSOR\documentations\specifications\fdp-packages\`.

---

## 4. LIVE-projects — production / WIP applications

**Scope-root:** `E:\Programming\Own\CURSOR\LIVE-projects\`

32 alkalmazás (+ `__agent/` system folder). Lentebb prioritás-csoportok szerint.
A prioritás-mátrix forrása:
`E:\Programming\Own\CURSOR\documentations\live-projects-priorities.md`.

> **Megjegyzés a prioritás-mátrixról:** a jelölt prioritás (HIGH/MEDIUM/LOW/NOT)
> a workspace-szintű triázs alapján van, nem feltétlenül a my-assistant prioritása.
> A my-assistant scope-on belül az `organizer` + `organizer-cli` a legfontosabb
> (a personal data backend).

---

### 4.1 🔴 HIGH priority — critical infrastructure

| Projekt | Mit csinál | Stack | Doc-belépő (absolute) |
|---|---|---|---|
| **overseer** | CI/CD orchestrator + monitoring dashboard, runner orchestration | Node + Angular + MongoDB | `E:\Programming\Own\CURSOR\LIVE-projects\overseer\__documentations\` |
| **fdp-auth-service** | Authentication microservice (JWT, OAuth2, account mgmt) | Express + TS | `E:\Programming\Own\CURSOR\LIVE-projects\fdp-auth-service\README.md` |
| **fdp-token-service** | Token package purchasing, Stripe/SimplePay/GooglePay | Express + payment | `E:\Programming\Own\CURSOR\LIVE-projects\fdp-token-service\__specifications\main.md` |
| **fdp-ftp-service** | FTP file transfer service (TLS) | Node FTP server | `E:\Programming\Own\CURSOR\LIVE-projects\fdp-ftp-service\__specifications\` |
| **futdevpro** | FDP main marketplace: account system, projektek, fundraising, voting | Angular + Express + Mongo | `E:\Programming\Own\CURSOR\LIVE-projects\futdevpro\__documentations\` + `__specifications\main.md` |
| **master-prompter** | Reference auth/language integration project (FDP minta) | Angular + Express | `E:\Programming\Own\CURSOR\LIVE-projects\master-prompter\__specifications\main.md` |

### 4.2 🟠 MEDIUM priority

| Projekt | Mit csinál | Stack | Doc-belépő |
|---|---|---|---|
| **dum** | Game/projekt (specs) | Web Game | `E:\Programming\Own\CURSOR\LIVE-projects\dum\__specifications\` |
| **fdp-e2e-full** | Playwright end-to-end tesztek FDP full-stack-ra | Playwright | `E:\Programming\Own\CURSOR\LIVE-projects\fdp-e2e-full\README.md` + `__specifications\main.md` |
| **ideology-forum** | Community forum ideológia / problémák / megoldások | Angular + Express | `E:\Programming\Own\CURSOR\LIVE-projects\ideology-forum\__documentations\` |
| **helocia** | Free dating/friendship app, 1-10 rating, two-tier matching | Full-stack | `E:\Programming\Own\CURSOR\LIVE-projects\helocia\__documentations\` + `__specifications\main.md` |
| **organizer** | ⭐ Multi-device personal OS (tasks, calendar, notes, shopping, stock, wallet, AI assistant) | Express + Angular + Mongo | `E:\Programming\Own\CURSOR\LIVE-projects\organizer\__documentations\` + `__specifications\main.md` |

### 4.3 🟡 LOW priority — paused / legacy

| Projekt | Mit csinál | Doc-belépő |
|---|---|---|
| **organizer-cli** | ⭐ CLI (`fo` command) az organizer-hez | `E:\Programming\Own\CURSOR\LIVE-projects\organizer-cli\README.md` + `cli\__documentations\` |
| **social-service** | Auth scaffolding, minimal | `E:\Programming\Own\CURSOR\LIVE-projects\social-service\README.md` |
| **warbots-distribution-server** | Warbots game distribution (client + backend) | `E:\Programming\Own\CURSOR\LIVE-projects\warbots-distribution-server\__specifications\` |
| **livirrium** | Simulation game (world, plants, performance) | `E:\Programming\Own\CURSOR\LIVE-projects\livirrium\__documentations\` + `__specifications\main.md` |
| **ccap-revisioned** | `@futdevpro/ccap` Agent architecture (CLI + server + client + e2e) | `E:\Programming\Own\CURSOR\LIVE-projects\ccap-revisioned\__documentations\` + `__specifications\main.md` |
| **war-factory** | Factory-RTS hibrid (Factorio-szerű produkció + war) | `E:\Programming\Own\CURSOR\LIVE-projects\war-factory\__documentations\` + `__specifications\main.md` |

### 4.4 ⚪ NOT PRIORITY — shelved / archived

| Projekt | Mit csinál | Doc-belépő |
|---|---|---|
| **voice-overlay** | Audio/voice overlay system | `E:\Programming\Own\CURSOR\LIVE-projects\voice-overlay\__documentations\` |
| **adventor** | AI tabletop RPG engine | `E:\Programming\Own\CURSOR\LIVE-projects\adventor\__documentations\` + `__specifications\main.md` |
| **art-tarot** | Tarot Angular + Node | `E:\Programming\Own\CURSOR\LIVE-projects\art-tarot\__specifications\main.md` |
| **code-documentation-master** | AI auto-doc generator + GitHub OAuth | `E:\Programming\Own\CURSOR\LIVE-projects\code-documentation-master\__specifications\main.md` |
| **fdp-ai** | (placeholder, nearly empty) | — |
| **fdp-tools-extension** | VS Code extension — terminal → Cursor input | `E:\Programming\Own\CURSOR\LIVE-projects\fdp-tools-extension\README.md` + `__documentations\` |
| **ccap** | Root monorepo (trainer, speech-recognition, model-test, executioner) | `E:\Programming\Own\CURSOR\LIVE-projects\ccap\__documentations\` + `__specifications\main.md` |
| **ccap-vscode-extension** | VS Code extension Socket.IO real-time | `E:\Programming\Own\CURSOR\LIVE-projects\ccap-vscode-extension\README.md` |
| **fdp-pal** | FDP-PAL architecture (technical spec) | `E:\Programming\Own\CURSOR\LIVE-projects\fdp-pal\__documentations\` + `__specifications\main.md` |
| **fdp-assistant** | FDP-staff onboarding assistant (monthly closing checklist) | `E:\Programming\Own\CURSOR\LIVE-projects\fdp-assistant\__documentations\` + `__specifications\main.md` |
| **fdp-speech-paste** | Windows speech recognition + clipboard paste | `E:\Programming\Own\CURSOR\LIVE-projects\fdp-speech-paste\README.md` |
| **fury** | Fury IDE (AI-first dev env) | `E:\Programming\Own\CURSOR\LIVE-projects\fury\__documentations\` + `__specifications\main.md` |
| **johnnies** | Game project (specs) | `E:\Programming\Own\CURSOR\LIVE-projects\johnnies\README.md` + `__documentations\` |
| **nd-space** | Niche datasets storage container | (minimal) |
| **dynamo-builder** | Dynamic client/server builder + CI/CD pipeline | `E:\Programming\Own\CURSOR\LIVE-projects\dynamo-builder\__specifications\` |
| **coordinator** | Orchestration (server + client + e2e) | `E:\Programming\Own\CURSOR\LIVE-projects\coordinator\README.md` + `__documentations\` + `__specifications\main.md` |

---

## 5. OGS-projects — OldLight Gaming Studio

**Scope-root:** `E:\Programming\Own\CURSOR\OGS-projects\`

| Mappa | Cél | Stack | Doc-belépő |
|---|---|---|---|
| `__agent\` | OGS-shared agent rendszer (workflow, conventions) | shared infra | `E:\Programming\Own\CURSOR\OGS-projects\__agent\README.md` + `PRINCIPLES.md`, `CONVENTIONS.md`, `WORKFLOW.md`, `CCAP.md`, `stacks/`, `templates/` |
| `documents\` | Központi OGS dokumentációk (GDD, jogi, policy) | docs | `E:\Programming\Own\CURSOR\OGS-projects\documents\Goldaholic\`, `Legal\`, `Policies\` |
| `goldaholic\` | Goldaholic Unity játék | Unity 6000.3 + C# + FDP framework | `E:\Programming\Own\CURSOR\OGS-projects\goldaholic\CLAUDE.md` + `.cursor\` |
| `oldlight-bot\` | Discord bot backend | Node.js + nts-dynamo | `E:\Programming\Own\CURSOR\OGS-projects\oldlight-bot\__specifications\` + `__clickup-docs\` |
| `oldlight-site\` | OGS website (frontend + backend) | Angular + Node | `E:\Programming\Own\CURSOR\OGS-projects\oldlight-site\__documentations\` + `__specifications\` |

---

## 6. Workspace meta — DevOps, Templates, Github Actions

### `fdp-devops\` (✅ critical)

```
E:\Programming\Own\CURSOR\fdp-devops\
```

- Docker Compose stack-ek (local / test / prod / ogs / latest / fdp-runners)
- Nginx gateway konfiguráció (13+ domain TLS terminálás)
- Webhook szerver (deployment automatizáció, SSL manager, Overseer event reporting)
- Per-service restart automatizáció (`fdp deploy-service`)
- FDP Pipeline Runners config

**Doc:**
- `E:\Programming\Own\CURSOR\fdp-devops\CLAUDE.md` — DevOps-specifikus Claude utasítások (compose-fájlok, runner-image build, stb.)
- `E:\Programming\Own\CURSOR\fdp-devops\__documentations\` — összes változtatás Hunglish doksiban

### `fdp-github-actions\`

```
E:\Programming\Own\CURSOR\fdp-github-actions\
```

Reusable GitHub Actions a FDP projektekhez (build / test / deploy reusable workflowok).

### `TEMPLATE-projects\`

```
E:\Programming\Own\CURSOR\TEMPLATE-projects\
```

FDP project scaffold templates (backend / frontend / full-stack mintaprojektek).

---

## 7. Hogyan kapcsolódnak — high-level dependency map

```
                   ┌─────────────────────────────────────────────┐
                   │         documentations/ (central)           │
                   │  guidelines, specs, priorities, plans       │
                   └─────────────────────────────────────────────┘
                                    △ referenced by all
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
   ┌─────────┐            ┌─────────────────┐         ┌──────────────────┐
   │ NPM-pkg │ depends ←─ │  LIVE-projects  │         │  OGS-projects    │
   │ (12)    │            │  (32)           │         │  (3 + shared)    │
   └─────────┘            └─────────────────┘         └──────────────────┘
        │                           │                           │
        │ tgz-collection            │ docker compose            │ Unity + bot + site
        │ for local dev             │ (fdp-devops)              │
        ▼                           ▼                           ▼
   ┌─────────┐            ┌─────────────────┐         ┌──────────────────┐
   │ build/  │            │ docker images   │         │ Steam? Web?      │
   │ tgz/    │            │ + Overseer      │         │ Discord?         │
   └─────────┘            └─────────────────┘         └──────────────────┘
```

### Két fő stack-réteg

1. **Dynamo réteg** (alsó-szintű, generic):
   `dynamo-builder-models`, `dynamo-fsm`, `dynamo-nts`, `dynamo-ngx`, `dynamo-ngx-models`, `dynamo-eslint`
2. **FDP-templates réteg** (felső-szintű, FDP-specific):
   `fdp-templates`, `fdp-templates-ngx`, `fdp-templates-nts`

A LIVE-projektek tipikusan a **felső rétegből** importálnak (`@futdevpro/fdp-templates`,
`@futdevpro/nts-fdp-templates`, `@futdevpro/ngx-fdp-templates`), és onnan az alsó
rétegre csak tranzitíven hivatkoznak.

### Cross-project relationships (kulcs)

- **overseer** orchestrálja az összes FDP projektet (CI/CD pipeline-ok, runner-ek)
- **fdp-auth-service** → minden user-facing projekt (futdevpro, organizer, master-prompter, helocia, …) ide auth-ol be
- **fdp-token-service** → fizető projektek ide POST-olnak charge-ot (adventor, code-documentation-master, fury)
- **fdp-ftp-service** → fájl-uploadot igénylő projektek (futdevpro user-feltöltés, organizer attachments)
- **futdevpro** = FDP main marketplace; minden FDP projekt itt jelenik meg fundraising / voting target-ként
- **master-prompter** = a **referencia auth/language minta** — új FDP project mindig innen másol

---

## 8. Jelen rendszer (my-assistant) helye

A `my-assistant` egy **NEM-FDP, csak personal-use** projekt; a workspace-en
belül **nem szabad** módosítani semmilyen FDP/OGS forrást innen. Csak fogyasztói
relációk:

| my-assistant viszonya | Cél |
|---|---|
| **organizer** | Migration target — `fo` CLI-n keresztül a personal data ide kerül később |
| **organizer-cli** | A `fo` CLI-t használjuk (telepítve, lásd [`organizer-cli-setup.md`](organizer-cli-setup.md)) |
| **fdp-auth-service** | Az `fo` CLI ide auth-ol be (organizer test env API key) |
| **fdp-devops** | Az organizer test env itt fut (Docker Compose stack) |
| **`documentations/live-projects-priorities.md`** | Az **organizer** prio státuszának forrása ott van — ha ott LOW lesz, my-assistant migráció kockázatos |

---

## 9. Hogyan használd ezt a doksit

### Új session: nincs konkrét projekt-fókusz
- Olvasd a 2. szekciót (top-level layout) + 8. szekciót (my-assistant viszonya)

### Egy konkrét projektre van szükséged (pl. "milyen az organizer auth-ja?")
1. Keresd a 4. szekcióban (LIVE) — talán a 4.2 (organizer = MEDIUM)
2. Nyisd meg a doc-belépőt: `E:\Programming\Own\CURSOR\LIVE-projects\organizer\__documentations\`
3. Részletek a my-assistant scope-ban: [`organizer.md`](organizer.md), [`organizer-modules.md`](organizer-modules.md)

### Egy NPM package-re van szükséged (pl. "mit csinál az nts-dynamo?")
1. Keresd a 3. szekcióban
2. Központi spec: `E:\Programming\Own\CURSOR\documentations\specifications\dynamo-packages\dynamo_packages.md`
3. Forrás: `E:\Programming\Own\CURSOR\NPM-packages\dynamo-nts\src\`

### Cross-project query (pl. "mely projektek használnak fdp-auth-service-t?")
A `documentations/live-projects-priorities.md` ad egy klasszifikációt, de a
**konkrét depenedncia-mátrix nincs központilag karbantartva** — `package.json`-okból
kell összeolvasni. Egy potenciális follow-up: dependency-mátrix script.

### "Mit nem tudok itt megtalálni?"
- Operatív / runtime szintű info (mely service fut épp, mely deploy-ban) → **Overseer dashboard**: `https://test.overseer.futdevpro.hu`
- ClickUp issue-k / milestone-ok → `__clickup-docs\` per-projektben (pl. `oldlight-bot\__clickup-docs\`)
- Jelenleg-folyó-munka → `documentations\temporary-notes\`

---

## 10. Karbantartás

Ez egy **snapshot** doksi, **2026-05-08**-i állapotú. A workspace fejlődik,
elfáradhat. Frissítendő amikor:
- Új LIVE projekt jön létre / régit törlünk
- NPM package verzió jelentősen ugrik (nagy major)
- A `live-projects-priorities.md` átsorol egy projektet
- Új OGS projekt indul

A snapshot frissítéséhez: futtass egy fresh inventory-t a `LIVE-projects/`,
`NPM-packages/`, `OGS-projects/` mappákon és vesd össze a 3-4-5. szekcióval.
