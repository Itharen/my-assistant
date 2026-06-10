# SSoT — Single Source Of Truth (KRITIKUS)

> **Forrás: a user szövege (2026-05-12).**

---

## 2026-05-12 — alaptézis

> az SSOT!!! Single Source Of Truth.

(Háromszoros felkiáltójellel — maximális hangsúly.)

---

## Univerzális szabály

**Minden adat-elemnek** (egy state, egy szabály, egy konstans, egy konfig,
egy projekt-prio, egy task-státusz, egy felhasználói preferencia) **EGY**
és **csak egy** kanonikus forráshelye van. Minden más másolat / hivatkozás
**oda mutat vissza**, nem **mellé** él.

## Mit jelent gyakorlatban

### Ha egy adatot több helyen használunk

✅ **Helyesen:**
- Egy kanonikus fájl (a SoT)
- A többi hely csak **hivatkozást** tartalmaz az SoT-ra (`Forrás: <path>`)
- Vagy a többi hely automatikusan generálódik az SoT-ból

❌ **Helytelenül:**
- Ugyanaz az érték / lista / szabály több fájlban duplikálva
- "Időről időre szinkronizáljuk" → drift garantált

### Ha egy SoT-fájl frissül

- Minden hivatkozó hely **frissítendő-jelölt** (Dev Agent 09-update-docs
  fázis része)
- A frissítés **automatikus** vagy **explicit task** legyen — soha nem
  "majd észreveszem"

---

## A my-assistant SoT-térképe (KANONIKUS)

| Adat | Kanonikus SoT | Másolatok / cache |
|---|---|---|
| Komponens-elhatárolás | `current/principles/system-components.md` | hivatkozások mindenhol |
| Domén 1/2 elhatárolás | `current/principles/two-domains.md` | hivatkozások |
| Architektúra (5 réteg) | `current/architecture.md` | implementáció-cache: `__agent/references/architecture.md` |
| Tri-tier impl-szerkezet | `__agent/references/architecture.md` | — |
| Cron Job tick-state | `__agent/STATUS_ASSIST.md` | dispatcher-belső cache: `__agent/state/assistant-agent-cron-tick.json` |
| Dev Agent cycle-state | `__agent/STATUS_DEV.md` | dispatcher-belső cache: `__agent/state/development-agent-tick.json` |
| Workspace projekt-prio | `E:\Programming\Own\CURSOR\documentations\live-projects-priorities.md` (külső) | cache: `__agent/references/workspace-projects.md` |
| FR állapot | `current/feature-requests/<fr>.md` (mindegyik FR a saját SoT-ja) | backlog: `__agent/triggers/development-agent-backlog.md` (cache) |
| Plan állapot | `__agent/plans/<plan>.plan.md` | — |
| User életcél | `current/life-goals.md` | hivatkozások |
| Projekt-szorzók | `current/projects.md` | hivatkozások |
| Recurring-szabály | `current/principles/recurring-tasks.md` | — |
| Stock | `current/stock/items.md` | shopping-listák abból generálódnak |
| 3×3 state | `__agent/state/3x3-log.jsonl` (append-only history) + `STATUS_ASSIST.three_by_three.current` (latest cache) | diary jegyzet |
| Action-log | `__agent/log/actions/<day>.jsonl` (append-only) | NINCS cache — minden olvasó frissen olvas |
| CCAP CLI parancsok | `__agent/references/ccap/REFERENCE.md` (generálva `ccap skill-doc`-kal) | — |
| STT-typos | `current/stt-typos.md` | — |
| Open-questions | `current/open-questions.md` | — |
| Diary | `current/diary/diary.md` | — |
| Hookok config | `.claude/settings.json` | — |
| Globális workspace-szabályok | `E:\Programming\Own\CURSOR\CLAUDE.md` (külső) | — |
| Projekt-szintű szabályok | `E:\Programming\Own\CURSOR\LIVE-projects\my-assistant\CLAUDE.md` | — |

---

## Anti-pattern (NE TEDD)

- ❌ Ugyanaz a 7-komponens lista 3 fájlban másolva (FRISSÍTÉSI POKOL)
- ❌ "Néha kézzel szinkronizáljuk" → drift
- ❌ FR állapota a backlog-ban és az FR-ben **eltérő** — egy az SoT (az FR
  fájl), a backlog cache
- ❌ Több STATUS.md fájl egymástól független állapot-leírással

---

## Kapcsolódás a workflow-ba

A Dev Agent **minden** `09-update-docs` fázis kötelező lépése:
- A cycle-ben módosított adatok SoT-ja kanonikusan frissítve?
- A cache-ek/hivatkozások karbantartva?
- Drift-jelölt fájlok ellenőrizve?

A chat (én) **minden új adat-felvétel előtt** megnézi:
- Van-e már SoT erre?
- Ha igen, oda írok, NEM új helyre
- Ha nincs, létrehozok egy SoT-fájlt, és máshová csak hivatkozást

---

## Kapcsolódik

- `current/principles/system-components.md` — a 7-komponens kanonikus tér
- `current/principles/working-style.md` — én = vezénylő, workflow-doc karbantart
- `__agent/WORKFLOW_DEV.md` 1. alapelv — SSoT a STATUS_DEV.md YAML
- `__agent/WORKFLOW_ASSIST.md` 1. alapelv — SSoT a STATUS_ASSIST.md YAML

---

## 2026-05-08 — kiegészítés: cross-subproject pattern (TypeScript)

> Egyrészt mivel TypeScript rendszer, másrészt mivel amúgy is ez a pattern
> mindig és mindenkor, használhatunk cross-referenzt a különféle
> subprojektjeink között. Menj körbe, nézzél körül, más rendszerekben ezt
> hogy csináljuk, általában van, a kliencen szoktuk főként használni, a
> szerverről a data modelleket. Ugyanezt a patternt fogjuk megcélozni itt is.
>
> Arra kell csak majd nagyon odafigyelni ennél, hogy ezek a klasszok, meg
> ezek a fájlok nem használhatnak olyan dolgot, ami például nincsen a
> kliencen. szükség, akkor egy extension-t csinálunk, és az extension-t
> fogja kizárólagosan a szerver használni, de a base class-t meg mindenki.

### A pattern (FDP-style — `master-prompter` minta)

A 3 subproject (`cli`, `server`, `client`) között az SSoT-ot **TypeScript path
mapping-gel** valósítjuk meg — NEM npm-package, NEM duplikáció.

```
client/tsconfig.json paths:
  "@server/*":      [ "./../server/src/*" ]                  ← raw direct mapping
  "@server-models": [ "./src/app/_models/server-index.ts" ]   ← barrel re-export
```

→ Client-fájl így importál:
```typescript
import type { Foo, Bar } from '@server-models';
```

A TS resolve-olja a server-oldali source fájlt **build/compile-time-ban**.

### Cross-reference irányok (my-assistant)

```
client → server (csak TYPES, FDP-szerű)
   paths:    @server/*, @server-models
   szabály:  csak `import type` — runtime kód NEM hívható

server → cli (RUNTIME, integrációkhoz)
   paths:    @cli/*
   szabály:  server controllers használják a CLI integration-szolgáltatásait
             (spotify-client, google-assistant-client, cast-client) library-ként

cli → server (csak TYPES)
   paths:    @server/*
   szabály:  CLI is innen veszi a kanonikus type-okat
```

**Egyirányú a runtime függőség**: csak `server → cli`. A CLI standalone marad
(server futása nélkül is használható).

### Type ownership szabály

| Mit | Hol él | Ki importálja |
|---|---|---|
| **DTO interfészek** (config, status, snapshot) | `server/src/_models/interfaces/...` | client + cli + server |
| **Mongoose data-models** (osztályok DB-shape-ekkel) | `server/src/_models/data-models/...` | client csak `import type`, server runtime |
| **Control models** (helper class, computed mezők) | `server/src/_models/control-models/...` | client + server |
| **Enums** | `server/src/_enums/...` | mind |
| **Integration runtime** (Cast/Spotify/Google API hívások) | `cli/src/{cast,spotify,google}/` | server runtime; client SOHA |

### Base + Extension elv

Ha egy class olyat használ amit a kliens **nem tud** (pl. `node:fs`,
`node:http`, `castv2-client`, `mongoose`):

1. **Base class** kliens-importálható fájlban — csak DTO mezők, computed
   getterek, helper logika node-specifikus dolog **nélkül**
2. **Extension** server-only fájlban — extends Base-t, hozzáadja a Node-API-t
   használó metódusokat
3. Server az extension-t használja, kliens a base-t

Példa séma:
```
server/src/_models/data-models/foo.data-model.ts          ← Base (kliens-importálható)
server/src/_models/data-models/foo.extension.data-model.ts ← Extension (server-only mongoose-szal)
client → import { Foo } from '@server-models'              ← base-t kapja
server → import { FooExtension } from '@server/_models/...' ← extension-t használja
```

### Kritikus implementációs feltételek

1. **TypeScript csak**: minden subproject TypeScript, build/runtime config
   konzisztens (ESM mindenhol — keverés `await import()` mintát igényel).
2. **`import type`** kötelező mindenhol ahol type-only import van — különben
   bundler/runtime megpróbálja behúzni a teljes modult, ami szerver-only
   függőségeket vinne a kliensbe.
3. **Path mapping mindkét végpontban**: a forrás (server) és minden konzument
   (client/cli) tsconfig.json-jában is ott van.
4. **Barrel file** ergonomikus aliasokhoz (`@server-models`) — raw `@server/*`
   mindig elérhető fallback-ként.

### Mit NEM csinálunk

- **Nem hozunk létre `shared/` package-et** — a path mapping ezt megoldja
- **Nem publish-olunk semmit npm-re** — minden monorepo-belül marad
- **Nem futtatunk runtime sync-et** (kódgenerálás, fájlmásolás)

### Implementációs státusz (élő)

- 2026-05-08: terv kész, lépésenként bevezetve (`__agent/plans/ssot-server-esm-migration.plan.md`)
  1. Server ESM-re upgrade (különben CommonJS server nem tud ESM CLI-t natívan importálni)
  2. Path mapping bekonfigurálás mindhárom subprojectbe
  3. Types mozgatás `cli/src/{spotify,google}/`-ből → `server/src/_models/interfaces/integrations/`
  4. Client barrel létrehozás (`client/src/app/_models/server-index.ts`)
  5. Server controllers + client UI moduláris konzumálással
