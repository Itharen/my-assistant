# Organizer — fő modulok inventory

**Forrás:** `LIVE-projects/organizer/`
**Last verified:** 2026-05-07
**Cél:** átfogó, könnyen áttekinthető lista arról, **hogy az organizer rendszer milyen modulokból áll** — implementált és tervezett szinten egyaránt. Ez a doksi az SSOT a modulok terén; a többi referencia (pl. [`organizer.md`](organizer.md), [`organizer-cli-setup.md`](organizer-cli-setup.md)) ide hivatkozik.

> Ha az itt szereplő listával lefedett funkcionalitásra van szükségünk a my-assistant rendszerben, akkor ahelyett hogy újra-implementálnánk, ezt használjuk natívan amint stabilizálódik.

---

## 1. Implementált modulok (server + client kódban)

9 user-facing modul van élesben + 1 system-level (auth). Forrás: `server/src/_routes/` mappák, `client/src/app/_modules/`, `server/src/_routes/mcp/{handler}/`.

| # | Modul | Server route mappák | Client UI | MCP tool-ok | my-assistant pár |
|---|---|---|---|---|---|
| 1 | **Tasks** | `task` + `task-group` | ✅ `/tasks` | ✅ `tasks.*` | `domains/tasks.md` |
| 2 | **Notes** | `notes` + `note-books` | ✅ `/notes` | ✅ `notes.*` | `domains/notes.md` |
| 3 | **Calendar** | `calendar` + `calendar-event` | ✅ `/calendar` | ✅ `calendar.*` | `domains/calendar.md` |
| 4 | **Diary** | `diary-entry` | ✅ (admin?) | ❌ **nincs MCP** | `domains/diary.md` |
| 5 | **Shopping List** | `shopping-list` + `shopping-list-item` + `shop` + `buyable-item` | ✅ `/shopping-list` | ✅ `shopping.*` | `domains/shopping.md` |
| 6 | **Stock** | `stock` + `stock-item` | ✅ `/stock` | ✅ `stocks.*` | `domains/stock.md` |
| 7 | **Wallet** | `wallet` + `wallet-history-item` | ✅ `/wallet` | ✅ `wallet.*` (read-only) | `domains/wallet.md` |
| 8 | **Wish List** | `wish-list` + `wish-list-item` | ✅ `/wish-list` | ✅ `wishlist.*` | `domains/wishlist.md` |
| 9 | **Feature Request** | `feature-request` | ❌ csak admin | ✅ `feature-requests.*` | (nincs my-assistant pár) |
| — | _User / Auth_ | `user` + `auth-redirect` | ✅ `/user` | ❌ szándékos | (system, nincs domain) |

**Kapcsolat a my-assistant `domains/`-jaival:** mind a 8 my-assistant domain-nek **van organizer-pár**. Migrációkor a `data/{domain}.md` markdown adatok a megfelelő organizer modulba mennek (mező-map a domain doksikban).

### Capabilities (élő test env, `fo organizer.capabilities`)

A test szerver `2026-05-07`-én **6 modult** sorol fel `capabilities`-ben:

```
notes, tasks, calendar, shopping, stocks, wallet
```

Hiányzó capabilities-ből (de kódban van handler): `wishlist`, `feature-requests`, `diary`. Ezek vagy MVP6-MVP8-ban vannak, vagy a capabilities lista csak a "stable" modulokat hozza.

### MCP MVP fázisok (a 8 implementált handler szerint)

| MVP | Handler-ek | Modulok |
|---|---|---|
| MVP0 | `mcp.control-service.ts` | core (`organizer.ping/capabilities/search/resolve`) |
| MVP1-3 | `notes/`, `tasks/` | Notes, Tasks (CRUD + archive/restore) |
| MVP5 | `calendar/` | Calendar (CRUD) |
| MVP6 | `shopping/`, `wallet/`, `wishlist/` | Shopping, Wallet, Wishlist (CRUD) |
| MVP7 | `stocks/` | Stock (CRUD + archive) |
| MVP8 | `feature-request/` | Feature Request (list, get, create) |

Forrás: `server/src/_routes/mcp/_enums/mcp-tool-name.enum.ts` + `LIVE-projects/organizer/__specifications/mcp-roadmap.md`.

---

## 2. Tervezett modulok (specs van, kód még nincs)

Forrás: `__specifications/modules/*.md` és `__specifications/features/org-*.md`. Ezek a modulok **nem érhetők el még** sem MCP-n, sem UI-n keresztül.

| Modul | Spec fájl | Mit fed le | Státusz |
|---|---|---|---|
| **AI Assistant** | `modules/ai-assistant.md` + `features/org-ai-assistant.md` | NLP-vezérelt asszisztens, szöveg/hang parancsok, kontextus-aware válaszok, multilingual | tervezve |
| **Health & Nutrition** | `modules/health-nutrition.md` | Recept-kezelés, főzési/sütési event-ek calendar-ban, táplálkozási log, testadat tracking, workout log | tervezve |
| **Shop Trip** | `modules/shop-trip.md` + `features/org-shop-trip.md` | Interaktív bolt-térképek, termék-helyzet, route optimization, real-time navigáció, csoportos vásárlás | tervezve |
| **Smart Home** | `features/org-smart-home.md` | IoT device integráció, automation rules, energia tracking, biztonsági rendszerek, környezet monitoring | tervezve |
| **Waver** | `features/org-waver.md` | 3-rétegű wellness tracking: Astral (érzelmi), Mental (kognitív), Material (fizikai) — külön wave graph-ok | draft, user validation kell |
| **Work Push** | `features/org-work-push.md` | Check-in push rendszer, auto worklog, AI plan-vs-reality reconciliation, napi rutinok, sleep mode | tervezve |
| **Priority Management** | `features/org-priority.md` | Beszélgetés-alapú prioritizálás (nincs klasszikus UI), súlyozott logika tömeges műveletekhez | tervezve |
| **Org Fit** | `features/org-fit.md` | Egészség és fitness tracking (testdata, workouts, nutrition integráció) | tervezve, részben átfedő Health & Nutrition-nel |

> **Megjegyzés:** néhány "feature" valójában cross-cutting concern (Priority, Work Push), nem önálló modul. A pontos scope a spec-fájlokban olvasható.

---

## 3. Backlog: mi hiányzik az implementált modulokhoz

Az `__specifications/BACKLOG.md` és `TODO.md` szerint a meglévő modulokon belül még tervezett bővítések:

### Tasks
- Auto-planning (nehézség / elérhetőség / felhasználói szokások alapján) → ebből lesz Daily Tasks
- Napi task-bundling (reasonable / minimum / stretch pack)
- Task dependencies (parent-child, blocker, auto-deadline)
- Task templates (előre definiált + egyedi)
- Bulk operations (cross-module tömeges műveletek)
- **Quick Add overlay** — chat-bubble task/note/event hozzáadáshoz, intelligens ügynökkel (`TD-20260416-010`)

### Wallet
- MCP read-only → safe write ops bővítés (`TD-20260223-009`)

### Diary
- Full implementáció: DB entity, voice / video / text upload auto-deriválással (`TD-20260212-002`)
- **MCP handler hiányzik** — jelenleg nem érhető el MCP-ből

### Infrastructure / cross-cutting
- Full MCP/CLI audit — "vibekóded" code review (`TD-20260416-011`, **High**)
- E2E test suite az organizer-hez (`TD-20260416-012`, **High**)

---

## 4. Mit jelent ez a my-assistant számára

### Most (2026-05-07)

A 8 my-assistant domain közül mindegyiket **átemelhetjük natívra** az organizer-be, **kivéve a diary-t** (nincs MCP handler). A `wallet` jelenleg MCP-ből csak read-only — írni UI-n keresztül kell.

### Amikor migrálunk
A migráció a `domains/{X}.md` fájlokban dokumentált mező-map alapján történik. A `data/{X}.md` markdown adatok JSON-ba konvertálódnak és `fo {modul}.create` parancsokkal kerülnek be. (Részletes migrációs flow: `flows/on-demand/migrate-to-organizer/` — még nem létezik, létrehozandó akkor amikor a triggerek zöldek, lásd [`organizer.md`](organizer.md) §6.)

### Tervezett organizer modulok és a my-assistant
A 8 tervezett modul közül egyik sincs benne a my-assistant scope-ban. Ha valamelyik életszerű igénnyé válik **mielőtt** az organizer-ben elkészül, akkor lehet érdemes a my-assistant-ban egy ideiglenes domain-t létrehozni — de ez **explicit user döntés**, nem default.

Specifikusan:
- **AI Assistant** — már most is használjuk Claude-on keresztül, nem hiányzik
- **Health & Nutrition / Org Fit** — ha kell, my-assistant-ban kezdhetnénk egy `health` domain-nel
- **Work Push** — átfedés a `daily-review` flow-val; nincs sürgős igény
- **Waver, Smart Home, Shop Trip, Priority Mgmt** — niche, várjuk meg az organizer-ben

---

## 5. Kapcsolódó referenciák

- [`organizer.md`](organizer.md) — teljes organizer áttekintés (port-ok, MCP, e2e, CLI)
- [`organizer-cli-setup.md`](organizer-cli-setup.md) — `fo` CLI telepítés és karbantartás
- `LIVE-projects/organizer/__specifications/main.md` — spec index (82 REQ kód)
- `LIVE-projects/organizer/__specifications/mcp-roadmap.md` — MCP MVP roadmap
- `LIVE-projects/organizer/__specifications/BACKLOG.md` és `TODO.md` — folyamatos backlog
- `__agent/domains/` — my-assistant domain definíciók (organizer mező-map-pel)
