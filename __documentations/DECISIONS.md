# Decisions log — `my-assistant`

> Tartós architektúra- és design-döntések, indoklással. Cél: `_post-mortem` debugging-nál tudjuk **miért** lett valami úgy, ahogy van.
>
> Convention (matches `ccap-revisioned/__documentations/DECISIONS.md`): minden döntés ID-vel (`DEC-MA-NNN`), dátummal, a hozzá tartozó plan / FR / discussion linkkel. Reverzibilitás opcionális.

---

## DEC-MA-001 — FDP-shaped lite (no `@futdevpro/*` packages)

**Dátum:** 2026-05-08
**Forrás:** `__agent/plans/refactor-tri-tier.plan.md` 5.1 architektúra-döntés
**Decision:** A server és client NEM importál `@futdevpro/*` packages-t. Csak a folder-layout, naming convention és test/CI-CD setup követi az FDP mintát.

**Indok:**
- "Build-it-ourselves" elv (`current/principles/build-it-ourselves.md`)
- Single-user lokál tool — a teljes FDP framework overkill
- Easier maintenance (fewer dependency-version churn)
- Reverzibilitás: a folder-layout pre-emptívan FDP-konform, később `@futdevpro/*`-t pulled in lehet

**Reverzibilitás:** ~2 nap effort (lásd Pattern audit P3).

---

## DEC-MA-002 — SQLite (better-sqlite3) instead of MongoDB+mongoose

**Dátum:** 2026-05-08
**Forrás:** `__agent/plans/refactor-tri-tier.plan.md` 5.2 architektúra-döntés; `current/feature-requests/server-app-architecture.md`
**Decision:** A server SQLite-ot használ (`better-sqlite3` lib) MongoDB+mongoose helyett.

**Indok:**
- Single-user lokál — Mongo container infra túl heavy
- Zero-cost (FOSS, zero-infra)
- A FR explicit alternative-ként elfogadta SQLite-ot
- A SQL séma a FR-ben már 1:1 átültethető (PostgreSQL-be is, ha cloud kell)

**Reverzibilitás:** Phase 3+ ha cloud sync kell, írunk egy PG / Mongo adapter-t a DAO-réteg fölé.

---

## DEC-MA-003 — ESM + `module: ESNext` (server)

**Dátum:** 2026-05-08
**Forrás:** `__agent/references/pattern-audit.md` §5.2
**Decision:** A server ESM mode-ban épül (`type: "module"`, `module: ESNext`), NEM CommonJS — pedig az organizer/server CommonJS.

**Indok:**
- Új projekt, nincs legacy
- FDP maga is ESM-re mozdul (organizer-cli ESM)
- Stricter type checking, modern tooling (tsx, vitest-future)

**Reverzibilitás:** mass-rename minden `.js` ESM importot — kb. 1h munka, de szükségtelen, amíg az organizer-cli is ESM marad.

---

## DEC-MA-004 — Function-based controllers (no `DyNTS_Controller`)

**Dátum:** 2026-05-08
**Forrás:** `__agent/plans/refactor-tri-tier.plan.md` (FDP-shaped lite)
**Decision:** Server controllerek `register*(router)` function-ök, NEM osztályok extends `DyNTS_Controller`.

**Indok:**
- Csak akkor érdemes class-based-re váltani, ha `@futdevpro/nts-dynamo`-t pulled in (lásd DEC-MA-001)
- Plain Express idiom egyszerűbb / debugability
- Singleton overhead nem kell (instance-per-request mintázat hibahez vezet)

**Reverzibilitás:** ~2-3h refactor, ha valaha pulled in `@futdevpro/nts-dynamo`.

---

## DEC-MA-005 — Hibrid storage: organizer-fed vs lokál markdown

**Dátum:** 2026-05-07
**Forrás:** `__agent/SOURCE_OF_TRUTH.md`, `current/principles/methodology-authority.md`
**Decision:** Modulonként eldől, hogy az adat az organizer test env-ben (`fo` CLI write/read) vagy lokál `current/{modul}/` markdown-ban él. A `__agent/SOURCE_OF_TRUTH.md` a kanonikus tábla.

**Indok:**
- Az organizer fokozatosan érik be — Phase 1-ben nem stabil, Phase 2-3-ban várhatóan az lesz
- Modul-szintű migráció (nem big-bang)
- A user kanonikus szabályai (current/principles/) sosem mozognak — ott marad a végleges minta

**Reverzibilitás:** modulonként, lásd SOURCE_OF_TRUTH.md "Migrációs flow" — `local` → `organizer-verified` átmenet 4 lépéses.

---

## DEC-MA-006 — Move activity-monitor under server, scripts under cli

**Dátum:** 2026-05-08
**Forrás:** user request "Az Activity Monitornak bele kéne kerülni a szerverbe, a scripteknek pedig a CLI-be"
**Decision:**
- `activity-monitor/` → `server/activity-monitor/` (organizatórikusan a server-hez tartozik, mert a server ingestion endpoint-jára POST-ol)
- `scripts/` → `cli/scripts/` (a CLI-szintű automatizációk a CLI-hez tartoznak)

**Indok:**
- Logikai kohézió: az activity-monitor data-flow-ja a server felé megy, a script-ek a CLI-szintűek (update-fo, action-log writers, agent-handlers)
- Tisztább top-level layout (csak 3 fő almappa: cli/server/client)

**Reverzibilitás:** trivial mv (~5 min) + path-update (~30 min, lásd action-log konfig + CLAUDE.md path-references).

---

## DEC-MA-007 — Root monorepo package.json + workspace LDP

**Dátum:** 2026-05-08
**Forrás:** user request "szeretnék egy package.json-t a myassistant root-ba, hogy onnan is elindíthassam a dolgokat"
**Decision:** Root `package.json` jött létre, monorepo-szintű scriptekkel (`prep`, `start` = `dc ldp`, `build`, `test`, per-sub-projekt delegate-ek). Workspace-szintű LDP (`pipeline.config.json`) már korábban létezett.

**Indok:**
- Egy belépőpont mindenhez (kevesebb cd / sub-folder navigation)
- ccap-revisioned (monorepo FDP minta) is pontosan ezt csinálja

**Reverzibilitás:** trivial törlés ha nem kell.

---

## DEC-MA-008 — `dc ldp` Windows-bug fix (workspace-szintű patch)

**Dátum:** 2026-05-09 (revízió `concurrently` workaround-ot törölve — soha nem volt jó megoldás)
**Forrás:** user pnpm start futtatás → `spawnSync true ENOENT` hiba; user explicit kérés: NE legyen concurrently sehol, az LDP egy flow legyen
**Decision:** A bug-ot a workspace dc-dynamo source-ban is + build-ben is patchel-jük (egy karakteres javítás). A `pnpm start` MARAD `dc ldp`. A pipeline.config.json a my-assistant root-ban marad (NEM `.dynamo/`-ban, mert a launcher a configDir-ből veszi a cwd-t a step-eknek, és a step-parancsok project-root-ról várnak relatív path-okat).

**A bug + fix:**
- **Hely:** `NPM-packages/dynamo-cli/{src,build}/_commands/live-dev-pipeline/scripts/pipeline-entry.script.{ts,js}:line 344-414`
- **Régi (broken):** `shell: 'true'` (literális string)
- **Új (fix):** `shell: true` (boolean)
- **Hatás Windows-on:** `'true'` mint shell-binary ENOENT → execSync azonnali fail az első step-en
- **Hatás Linux-on:** `/usr/bin/true` no-op → "látszott működni" de a parancs valójában nem futott (silent corruption)

**Második fix — config helye:**
- **NEM** `.dynamo/pipeline.config.json` — a `live-dev-pipeline.js:142` `cwd: state.resolved.configDir` miatt a wrapper cwd-je `.dynamo/` lenne, és a step-parancsok (pl. `cd cli && rimraf ./dist`) project-root-ra hivatkoznak → "The system cannot find the path specified."
- **Igen** `pipeline.config.json` (root) — deprecation warning kiír, de **nem-fatal** és a step-parancsok cwd-jét helyesen tartja
- **Trade-off:** a deprecation warning látszik minden `dc ldp` futáson; viszont az LDP _ténylegesen_ működik

**Mi NEM jó megoldás (és ezért elvetve):**
- ❌ `concurrently` (server-dev + client-dev parallel) — **nem LDP**, nincs build+test-on-save, nincs server-restart koordinálás, nincs strukturált log
- ❌ `.dynamo/pipeline.config.json` + relatív path-ok átírása (`cd ../cli` stb.) — a step-konfig csúnyább lesz, és inkonzisztens az organizer/-mintával

**Reverzibilitás:**
- A workspace dc-dynamo patch egy karakteres, persistent (commit-elve a workspace-be a következő commit-tal)
- Ha a dc-dynamo upstream is fix-elve lesz (FDP-PR a `@futdevpro/cli-dynamo`-be), a globálisan telepített `dc` újratelepítés után automatikusan kapja
- Az `.dynamo/`-ba költözés akkor lesz biztonságos, ha a dc-dynamo `live-dev-pipeline.js:142` cwd-resolution-jét javítják (configDir → projectRoot, pl. parent-of-`.dynamo/`)

**Forrás-fix upstream javaslat (FDP-PR):** lásd `__specifications/TODO.md` TD-20260509-001.

---

## DEC-MA-009 — Port allocation: XY=24 (FDP konvenció)

**Dátum:** 2026-05-09
**Forrás:** user request "hasonló port kiosztást kéne használni mint az FDP projekteknél"
**Decision:** A my-assistant az FDP port-konvencióhoz illeszkedő `XY=24` projekt-azonosítót kapja. Konkrét portok:

| Cél | Port | FDP minta-formula |
|---|---|---|
| Server HTTP | `39245` | `39XY5` ahol XY=24 |
| Server HTTPS (Phase 2+) | `39246` | `39XY6` |
| Server notification socket (Phase 2+) | `39247` | `39XY7` |
| Server service socket (Phase 2+) | `39924` | `399XY` |
| Client (dev) | `4224` | `42XY` |

**Indok:**
- Az FDP `port-env-settings.const.ts` (`@futdevpro/fdp-templates`) egységes konvenció szerint allokálja a portokat. A formula: `39XY5` http, `39XY6` https, `39XY7` notif socket, `39XY8` chat socket, `399XY` service socket, `42XY` client.
- FDP projektek 00-23 közötti XY-okat használnak (legutolsó: livirrium=23). XY=24 az **első üres slot a sorban** — természetes folytatás.
- Eddig 39200/4213 port-ok voltak (semleges választás), ezek nem ütköztek de nem is illeszkedtek a mintába. A user explicit kérése a konvenció-illesztés.
- Ha a my-assistant valaha "real" FDP projektté válik, az XY=24 slot előre allokált — a `@futdevpro/fdp-templates`-be felvehető lesz **konfliktus nélkül**.

**Konkurencia (figyelembe vettem):**
- XY=24 jelenleg üres az `port-env-settings.const.ts`-ben — biztonságosan használható
- Ha a FDP egyszer XY=24-et másra akarja használni, **regisztrálni kell**: vagy tegyük be most a const-ba `myAssistant_*` mezőkkel, vagy "reserve" megjelölés a kommentben
- Reserved 90+ tartományt ütköznek (pl. `39907` = social_serviceSocket vs `39907` = "project XY=90 notif socket") — ezért NEM választottunk 90+ slotot

**Reverzibilitás:** trivial — egy `intFromEnv('MA_SERVER_PORT', 39XX5)` default-ot változtat + 4 referencia a config-ban, kódban, doksiban (`grep 39245 | wc -l` mutatja a teljes felületet).

**Followup:** Ha a my-assistant FDP-be kerül (akár csak hivatalosan-tracked-ként), be kell írni a `@futdevpro/fdp-templates/src/_constants/environment/port-env-settings.const.ts`-be:
```ts
/** 24 my-assistant */
myAssistant_client: 4224,
myAssistant_http: 39245,
/* myAssistant_https: 39246, */
myAssistant_notificationSocket: 39247,
myAssistant_serviceSocket: 39924,
```
Ez egy külön FDP-PR, a my-assistant scope-on kívül.

---

## Convention új DEC-hez

```markdown
## DEC-MA-NNN — Rövid cím

**Dátum:** YYYY-MM-DD
**Forrás:** plan / FR / discussion link
**Decision:** Mit döntöttünk.

**Indok:**
- Pont 1
- Pont 2

**Reverzibilitás:** Becslés effort-ra ha valaha visszafordítjuk.
```
