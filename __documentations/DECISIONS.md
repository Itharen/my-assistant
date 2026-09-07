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

## DEC-MA-010 — Wave snapshot metadata denormalizált a 3 exploded sorra

**Dátum:** 2026-05-16
**Forrás:** `wave-panel-ui.plan.md` Q-WAVE-2 + Q-WAVE-3, cycle 56 (FR #3b-WAVE-UI Phase 4.A)
**Decision:** Egy JSONL snapshot row (`{ ts, astral, mental, material, wave_vector, mood, note }`) a Wave DB-be explode-olódik 3 sorra (astral/mental/matter), és a snapshot-szintű metadata (`wave_vector`, `mood`, `snapshotTs`, `note`) **mind a 3 row-ra denormalizálva** kerül be. Plusz: `level` (eredeti szint-string, pl. "very-low") szintén minden rowon. `snapshotTs+kind` adja az idempotency-kulcsot.

**Indok:**
- Query-egyszerűség: bármely Wave row önállóan elég kontextust hordoz a UI-nak (mood-card, vector-emoji) — nem kell join vagy snapshot-tábla lookup
- Marginal storage cost: `mood` rövid text (max 120 char), `wave_vector` enum-string, `level` rövid string → ~50-100 byte / row, 3× duplikálva
- Idempotens bulk-sync: `findDataList({ snapshotTs, kind })` egyszerű dedup, NEM kell composite-key tervezés
- Alternatíva (külön WaveSnapshot collection) elvetve: 2-collection join komplexitás > storage savings
- A `Wave` schema bővítés backward-compatible (mind opt.), régi sorok validak

**Reverzibilitás:** Közepes — ha egyszer külön WaveSnapshot tábla kell, egy migration script lekérdezi a unique `snapshotTs`-eket, beilleszti egy új collection-be, és a 4 redundáns mezőt törli a Wave-rowról. ~50-100 LOC migration + index-frissítés.

---

## DEC-MA-011 — DyNTS socket path = `/socket` (NEM Socket.IO default `/socket.io`)

**Dátum:** 2026-05-16
**Forrás:** cycle 58 smoke-test (FR #3f Phase 2.A), Explore agent verification `node_modules/@futdevpro/nts-dynamo/build/_collections/default-socket-path.const.js`
**Decision:** A kliens-oldali socket connect **kötelezően** a `path: '/socket'` option-nal csatlakozik (`DyNTS_defaultSocketPath` const). NEM hagyatkozunk a Socket.IO defaultjára (`/socket.io`).

**Indok:**
- Az `@futdevpro/nts-dynamo` framework saját default-path-ot definiál (`DyNTS_defaultSocketPath = '/socket'`) — server-side beállítva a `DyNTS_AppExtended` socket-server setup-jában
- A `/socket.io` GET-eket a `DyNTS_AppExtended` static-client SPA fallback elnyeli → "CONNECT_ERROR server error" / "websocket error" a kliensen
- Smoke-test cycle 58: 2 failed attempt (websocket-only + default-transport mind connect_error), majd `{ path: '/socket' }` után immediate success → `subscriptionSuccessful` + `server:hello`
- A `a-socket.control-service.ts` `getParams()`-ben explicit `socketOptions.path = '/socket'`. Master-prompter convention-on át (env-ből) működik, my-assistant-en explicit kódba írva — egyszerűbb tracing/debug-hoz

**Reverzibilitás:** Trivial — ha a DyNTS valaha átvált `/socket.io` default-ra (upstream change), a kliens `getParams()`-ben 1-LOC change (`delete socketOptions.path` vagy `path: '/socket.io'`).

---

## DEC-MA-012 — Server-version-bump → dev-mode silent reload, prod-mode 5s countdown banner

**Dátum:** 2026-05-16
**Forrás:** `socket-and-version-sync.plan.md` Q-ver-9, cycle 60 (FR #3f Phase 4.B)
**Decision:** A `S_VersionReloadBanner_Component` az `A_Version_DataService.requireReload` event-re a következőképp reagál:
- **Dev-mode** (`isDevMode() === true`, no `--prod` build flag): 1s grace timeout, majd silent `window.location.reload()`. Banner NEM jelenik meg.
- **Prod-mode** (`isDevMode() === false`): banner megjelenik felül-sticky pozícióval, 5s countdown timer, "Reload Now" + "Dismiss" gombok. Countdown 0-nál auto-reload. Dismiss → `clearReloadFlag` + countdown cancel, user a következő version-bump-ra újra prompt-olódik.

**Indok:**
- Dev-mode rendszeres LDP-rebuild + `dc bump-version` commit-okat triggerel — banner megzavarná a dev workflow-t. Silent 1s grace lehetővé teszi a server-restart befejezését + state-flush-t a reload előtt
- Prod-mode user-visibility kritikus: ha a server újraindul (deploy / verzió-bump), a kliens stale-állapotba kerülhet. A countdown + manual control mind UX-best-practice
- `alreadyTriggered` flag — observer multiple-emission (BehaviorSubject replay) edge-case kezelése → exactly-once trigger
- Cycle 65 spec-jellegű regression test megerősíti a viselkedést (jasmine.clock + spyOn-on-protected pattern)

**Reverzibilitás:** Trivial — ha mindkét módra ugyanazt akarjuk (pl. mindig banner), `handleStateChange` `isDevMode()` elágazás eltávolítása. ~5 LOC.

---

## DEC-MA-013 — Loopback auth-bypass `MA_LOCAL_DEV` env-flag-gel

**Dátum:** 2026-05-17
**Forrás:** AGB-2026-05-17-AUTH-FIX (cycle 92), eredeti probléma: minden `/api/*` 401-et adott dev-en mert a kliens nem tartott JWT-t a localStorage-ben
**Decision:** Az `Auth_ControlService.authenticate_tokenSelf` wrapper-elve van: ha `MA_LOCAL_DEV === 'true'` env-flag és `req.ip` ∈ {`127.0.0.1`, `::1`, `::ffff:127.0.0.1`}, akkor a JWT-check skipped. Production-ban a flag üres / `'false'` — semmilyen bypass nem aktív.

**Indok:**
- A my-assistant dev-en single-machine loopback only. JWT-store implementálása dev-en költséges + a server-side egy-user kontextus, nincs multi-user attack surface
- Az `MA_LOCAL_DEV` env-flag explicit opt-in — soha nem default-true. `.env` gitignored
- `req.ip` ellenőrzés a permissive `isLoopbackIp()` matcher-rel — IPv6-mapped IPv4 forma (`::ffff:127.0.0.1`) is fed
- A bypass NEM ki-be kapcsolható runtime-on — startup-time check, így nincs poison-attack a flag-en at request-time
- Foreign-network endpoint exposure-t megakadályozza a `req.ip` non-loopback fallback (továbbra is auth-required)

**Reverzibilitás:** Trivial — `Auth_ControlService` konstruktor-wrap eltávolítása + `.env`-ből `MA_LOCAL_DEV` kihúzása, ~10 LOC. Production-deploy esetén az env-flag csak ne legyen beállítva.

---

## DEC-MA-014 — `broadcastDomainEvent(topic, op, payload)` topic-route push pattern

**Dátum:** 2026-05-17
**Forrás:** FR #3f Phase 5.A (cycle 80), `socket-and-version-sync.plan.md`
**Decision:** A `VersionBroadcast_SocketServerService` egyetlen `broadcastDomainEvent(topic, op, payload)` metódussal ad ki minden szerver-oldali mutation-t a kliensnek. Wire-format: `eventKey = 'domain:' + topic`, content = `{ topic, op, payload, ts }`. A kliens egyetlen `handleDomainEvent` route-ol az `A_DomainEvent_DataService` Subject-bus-ra. Feature-modulok (Dashboard, Reports panels) saját filter-rel topic-szerint feliratkoznak.

**Indok:**
- A_Socket NEM ismeri a feature-modulokat (loose coupling) — csak emit-el a bus-ra, a subscriber dolga a route-olás
- Új topic bevezetése = 1 sor a kliens `eventKey: 'domain:<topic>'` listához + 1 sor a server caller-nél. Nincs server↔client interface-szerződés széles felülettel
- Wave / insight / capture / wave-jsonl / weather / sleep + cycle 104-től user-input / agent-bus — mind ugyanazt a pattern-t használja
- Pull-vs-push: a polling 30s default + push azonnali frissítés komplementer
- Op-mező (`'create' | 'update' | 'delete'`) — explicit lifecycle, a kliens dönthet hogy refresh vagy merge

**Reverzibilitás:** Közepes — ha el akarjuk dobni a push réteget, minden subscriber `events$()` callout-ot el kell távolítani, és visszamenni tisztán polling-ra. Becsléssel ~50 LOC + 5 fájl. A `broadcastDomainEvent`-emit-eket a server-en simán no-op-ra rakhatjuk minden funkció megőrzésével.

---

## DEC-MA-015 — Reports panel push-driven silent `refreshFromPush()` no-flicker

**Dátum:** 2026-05-17
**Forrás:** FR #3g Phase 5 (cycle 104), AGB-24
**Decision:** A R_UserIO + R_DevIO `ngOnInit()` után subscribe a `domainEvent_DS.events$()`-re. Domain-event-relevánsra (`REFRESH_TOPICS` Set match) NEM a teljes `ngOnInit()` újrahívás, hanem dedikált `refreshFromPush()` metódus, ami `isLoading = true` flag-et NEM állít be. Az API-hívás során a régi UI marad a helyén, az új adat hangtalanul felülírja a tömböket.

**Indok:**
- Inicializációs (`ngOnInit`) loading-spinner indokolt — nincs adat
- Pushra-frissítéskor a user éppen olvas-ír — flicker (spinner → adat) zavaró + UI-state-loss (scroll-pozíció, expanded inbox row, nyitott reply-form)
- Hiba esetén az error-toast-on át értesül a user, a régi adat megmarad — graceful degradation
- Idempotens subscribe (`if (!this.domainSub) ...`) + OnDestroy cleanup — multiple `ngOnInit` (pl. component re-mount) nem hoz létre duplikált subscription-t

**Reverzibilitás:** Trivial — a `refreshFromPush()` helyett `this.ngOnInit()` hívás visszahozza a loading-flickert. ~3 LOC.

---

## DEC-MA-016 — A teljes Organizer stock külön, gépi read-model mirrorba kerül

**Dátum:** 2026-08-23
**Forrás:** `current/feature-requests/organizer-stock-mirror.md`
**Decision:** A `ma stocks mirror` minden `stocks.list` és `stock-items.list` oldalt kiolvas, majd a teljes nyers
Organizer-tartalmat atomikusan a `current/stock/organizer-mirror.json` fájlba írja. A generált fájl nem írhatja felül
a kézzel gondozott `current/stock/items.md` recovery/working mirrort.

**Indok:**
- Az Organizer marad a célrendszer és egyetlen távoli owner; a lokális JSON csak újragenerálható read-model.
- A külön gépi fájl megőrzi az összes mezőt és könnyen fogyasztható minden agentből.
- Az atomikus csere megakadályozza, hogy hálózati, parse- vagy pagination-hiba fél snapshotot hagyjon hátra.
- Az elkülönítés megvédi a jelenlegi user-inputot attól, hogy az üres vagy részleges Organizer-állapot letörölje.

**Reverzibilitás:** Triviális — a snapshot törölhető és újragenerálható; az Organizer-adatot a parancs nem módosítja.

---

## DEC-MA-017 — Interfood API-first read layer, authenticated browser boundary

**Dátum:** 2026-09-01
**Forrás:** `current/feature-requests/interfood-scraper.md`, HP-IF-001
**Decision:** Az aktuális és jövőbeli heti menük, kategóriák és tápértékek elsődleges forrása az Interfood
first-party publikus API-ja, amelyet az agent-semleges `ma interfood` CLI normalizál. A user-specifikus
rendeléselőzmény és későbbi rendelésírás külön, dedikált persistent UBH Interfood-sessionből működik. A teljes heti
menü újragenerálható cache; a tartós preference/food registry csak érdekes, kiválasztott, új vagy megváltozott
ételeket kurál.

**Indok:**
- A publikus API élőben igazoltan stabil azonosítókat, árakat, kategóriát, összetevőket és részletes tápértéket ad;
  a DOM-scraping itt szükségtelen és törékenyebb lenne.
- A publikus és account-specifikus trust boundary szétválasztása csökkenti a login/session kitettséget.
- A dedikált profil megőrzi a login állapotát anélkül, hogy személyes böngészőablakot vagy tabokat fókuszálna.
- A kurált registry elkerüli több száz irreleváns heti sor szükségtelen tartós feldolgozását.

**Reverzibilitás:** A CLI adapter cserélhető, mert a normalizált modell a consumer contract. Az authenticated
adapter külön komponens, ezért a publikus olvasó változtatása nélkül lecserélhető.

---

## DEC-MA-018 — Interfood cart composition and submitted-order change are separate state machines

**Dátum:** 2026-09-01
**Forrás:** owner requirement, `current/feature-requests/interfood-scraper.md`, HP-IF-001
**Decision:** Az Interfood capability kötelezően támogatja mind az új rendelési kosár tényleges összeállítását,
mind a már leadott, még módosítható rendelés változtatását. A kosár szerkeszthető draft; a user által kért,
egyértelmű tételeket újabb execution-confirmation nélkül fel kell venni. A már leadott rendelés változtatása külön
state machine: eredeti order read → immutable diff és pénzügyi/refund preview → preview-hashhez kötött explicit
approval → apply → authoritative order-details readback.

**Indok:**
- Az Interfood frontend külön first-party cart add/subtract/remove/clear és submitted-order change endpointokat
  használ; a két művelet kockázata és visszafordíthatósága eltér.
- A draft-kosár összeállításának túlzott confirmation-gate-je akadályozná a user explicit végrehajtási kérését.
- A leadott rendelés módosítása árkülönbözetet, automatikus vagy függő refundot okozhat, ezért a pontos hatást a
  mutation előtt látni és jóváhagyni kell.
- Timeout vagy részleges válasz után a readback+diff akadályozza meg a duplikált add/subtract műveleteket.

**Live calibration:** 2026-09-01-én a read-only 2→1 submitted-order preview igazolta, hogy a részleges provider
payload csak a módosított `{id: cartItemId, amount: desiredQuantity}` sorokat fogadja; változatlan sorokkal 422-t
ad. A válasz `refund_value` + `parts` mezőiből külön instant és pending refund számítható. Apply nem futott.

**Reverzibilitás:** A command surface és state-machine adapter cserélhető; a cart/order trust-boundary és receipt
contract megmarad. Élő mutáció csak owner-approved canary után tekinthető kalibráltnak.

---

## DEC-MA-019 — Interfood history preserves food, occurrence, order-line and quantity separately

**Dátum:** 2026-09-01
**Forrás:** owner requirement, `current/feature-requests/interfood-scraper.md`, live 2026-W37 menu measurement
**Decision:** A rendeléselőzmény minden oldalát beolvassuk, és külön identitásként kezeljük a reusable `foodId`-t,
a dátum+adag-specifikus `menuItemId`-t, az `orderId`-t, az `orderLineId`-t és a `quantity`-t. Deduplikálás nem
történhet ételnév vagy `foodId` alapján. A napi coverage darabszám-alapú evidence-ből készül.

**Indok:**
- Élő W37 menüben ugyanaz a Gombapaprikás ugyanazon a napon két külön occurrence: `A` teljes és `AK` kis adag,
  külön ID-val és árral.
- Ugyanaz az étel több napon is megjelenhet, ezért a dátum az occurrence része.
- Egy menütételből egy napra két darab is rendelhető; boolean „rendelve” állapot elveszítené a második adagot.
- A pontos history, módosítási diff, ár/refund preview és változatossági számítás ugyanarra a veszteségmentes modellre
  támaszkodik.

**Reverzibilitás:** A normalizáló schema verziózható, de az identitásszintek összevonása adatvesztő lenne, ezért
visszafelé csak újraszinkronizált raw order-historyból állítható helyre.

---

## DEC-MA-020 — Interfood secretless agent bridge and split persistence

**Dátum:** 2026-09-01
**Forrás:** HP-IF-001, owner „vidd végig a hyper plan-t”
**Decision:** Az Interfood bearer token és browser device ID kizárólag a tartós UBH-profil content scriptjében
olvasható. A CLI csak egy hardcoded operation allowlisten keresztül kap redaktált account payloadot. A provider
account az Interfoodnál marad; a teljes order snapshot és receipt user-local cache, az explicit preferenciák
verziókezelt lokális SoT-ja `current/interfood/preferences.json`.

**Indok:**
- Minden agent ugyanazt a CLI-szerződést használhatja anélkül, hogy credentialt kapna.
- A dedikált profil megtartja a bejelentkezést, de nem érinti vagy fókuszálja a user normál böngészőablakait.
- A preferenciák tartós döntések és auditálhatók; a nagy account payload cserélhető cache, nem repository-adat.
- Cart és submitted-order módosítás külön tier/state machine, így a pénzügyi hatás exact-hash approvalhoz köthető.

**Reverzibilitás:** Az UBH adapter más hitelesített transportra cserélhető a `ma interfood` szerződés megtartásával;
a verziózott local state migrációt igényel, de az upstream accountot nem módosítja.

---

## DEC-MA-021 — Expired Interfood days use live Last Minute inventory with a separate finalization gate

**Dátum:** 2026-09-05
**Forrás:** owner request, `current/feature-requests/interfood-scraper.md`, live Interfood endpoint/frontend/FAQ
**Decision:** Lejárt normál határidejű, lefedetlen következő napnál kizárólag a publikus
`GET /api/v1/menu/last-minute` aktuális occurrence-ei használhatók rendelhetőségi forrásként. A CLI megőrzi a
provider orderability flaget, időablakot és nyers számlálókat, de saját készletképletet nem vezet le. Üres válasznál
a nap megoldatlan marad. Mivel a provider szerint a Last Minute rendelés nem mondható le, véglegesítése friss
inventory readbackhez és külön, azonnali owner-megerősítéshez kötött. Owner-reviewban a leves 🍲, a desszert 🍰.

**Indok:**
- A normál heti menü a deadline után nem bizonyítja, hogy az occurrence még rendelhető.
- A Last Minute készlet dinamikus: a live kalibráció során rövid időn belül 45-ről 44-re változott, miközben a két
  kiválasztott occurrence rendelhető maradt.
- Az upstream `isLastMinuteOrderable`/`disabled` állapot erősebb bizonyíték, mint egy dokumentálatlan számítás a
  szolgáltató belső számlálóiból.
- A nem lemondható véglegesítés kockázata nagyobb, mint egy visszafordítható kosárdrafté.

**Reverzibilitás:** A publikus adapter endpointja cserélhető a stabil `ma interfood last-minute` JSON-szerződés
megtartásával. A külön finalizációs kapu csak új owner-döntéssel lazítható.

---

## DEC-MA-022 — Chrome Side Panel companion, native LinkedIn page and manual-send evidence

**Dátum:** 2026-09-05
**Forrás:** `__agent/plans/linkedin-integration-hyperplan/master-plans/mp-06-guided-manual-send-workspace.plan.md`
**Decision:** A My Assistant saját, vendor-semleges MV3 Chrome Side Panel bővítményt használ a vezetett LinkedIn
munkamódhoz. A valódi LinkedIn top-level lap marad; a panel kizárólag a saját localhost UI-t mutatja. A bővítmény
nem kér LinkedIn host permissiont, nem olvas/manipulál DOM-ot, és nem küld üzenetet. A `manual-send-reported`
kizárólag owner-jelentés, nem API receipt. A manifest key stabil extension-ID-t rögzít; a szerver csak a dedikált
`?surface=sidepanel` válasznál és csak ennek az exact extension originnek enged frame-elést. Minden normál útvonal
megtartja az alapértelmezett `SAMEORIGIN` védelmet.

**Indok:**
- a LinkedIn iframe-et saját frame policy és szerződési határ tiltja;
- natív Split View létrehozó webes/extension API nincs igazolva;
- a Side Panel egy ablakban tartja a saját workflow-t és a natív LinkedInt anélkül, hogy a LinkedIn oldalt
  automatizálná;
- a meglévő cache/draft SSOT újrahasználata megakadályozza a CLI és UI állapotának szétcsúszását.

**Reverzibilitás:** A companion kikapcsolható vagy eltávolítható; a `/linkedin` UI és a `ma linkedin` CLI ettől
függetlenül működik. A natív-tab fallback megmarad.

---

## DEC-MA-023 — Explicit Interfood favorite precedes warnings but retains them

**Dátum:** 2026-09-05
**Forrás:** owner correction, `current/principles/interfood-food-preferences.md`
**Decision:** A hard reject továbbra is kizár. Utána az explicit favorite rangja megelőzi a warning és negatív
preferencia tier-eket, ezért a kedvenc figyelmeztetés mellett is a főajánlásban marad. A figyelmeztetés kötelezően
látható, a tej/tejszínnel jelölt étel továbbra sem kerülhet health lane-be. Az owner-tábla egészségjelölője 🥦, és
nem renderel üres leves-/desszerthelyőrző sort.

**Indok:** A korábbi warning-first rendezés a kedvenceket alternatívába tolta, így a megjelenítés nem követte az
owner explicit prioritását. A ⭐+⚠️ együttes jelölés veszteség nélkül mutatja mind a preferenciát, mind a kockázatot.

**Reverzibilitás:** A comparator tier-sorrendje és a prezentációs marker módosítható, de owner-döntés nélkül nem
gyengíthető vissza; az IF-J04 regresszió előbb jelezné a változást.

---

## DEC-MA-024 — Message-bound semantic LinkedIn reply queue

**Dátum:** 2026-09-06
**Forrás:** `__agent/plans/linkedin-integration-hyperplan/master-plans/mp-07-semantic-reply-triage.plan.md`
**Decision:** A legutolsó inbound üzenet kizárólag `technicalNeedsReplyCandidate`. A **Válaszra vár** queue-ba
csak az a thread kerülhet, amelynek az aktuális legutolsó üzenetéhez friss, magyarázható agenti vagy owneri review
kapcsolódik, és annak kategóriája `priority-direct-project`, `actionable` vagy `clarification-needed`. A review és
az agentdraft az értékelt message ID-hoz kötött; új aktivitás mindkettőt automatikusan elavulttá teszi. Az
agentfüggetlen SSOT-writeback a `ma linkedin review` CLI.

**Indok:** Az üzenet iránya nem hordoz beszélgetési jelentést: recruiter-elutasítás, automatikus kampány vagy a
user korábbi válaszára érkező lezárás ugyanúgy inbound. A teljes threadet használó szemantikai döntés megszünteti
ezeket a hamis pozitívokat, miközben az exact-message binding megakadályozza, hogy új üzenetre régi döntést vagy
draftot használjunk.

**Reverzibilitás:** A kategóriák és rangsor verziózott cache-migrációval bővíthetők. A direction-only döntésre
visszaállás tudatos biztonsági regresszió lenne, ezért az LI-J08 release-gate védi.

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

---

## DEC-MA-010 — 🔴 A DEC-MA-009 port-kiosztás ÜTKÖZIK (XY=24 foglalt) + a relay port-igénye

**Dátum:** 2026-09-07
**Forrás:** owner — *„Fdp templates ben lévő minták alapján vegyünk fel portokat."*
**Státusz:** ⏳ **owner-döntésre vár** (a relay-részre javaslat, a my-assistant-részre kérdés)

### 🔴 A LELET: a DEC-MA-009 feltevése MA MÁR NEM IGAZ

A DEC-MA-009 (2026-05-09) azt írta: *„XY=24 jelenleg üres az `port-env-settings.const.ts`-ben —
biztonságosan használható"*. **Ez ma nem áll.** Megmérve a kanonikus SSOT-ban:

```
E:/Programming/Own/CURSOR/NPM-packages/fdp-templates/src/_constants/environment/port-env-settings.const.ts

204:  nicheDatasetsSpace_client: 4224,
205:  nicheDatasetsSpace_http: 39245,
207:  nicheDatasetsSpace_notificationSocket: 39247,
```

⇒ A **my-assistant jelenlegi portjai (39245, 4224) a `niche-datasets-space`-é**.

| | |
|---|---|
| ⚠️ **Ma miért nem robban** | a my-assistant **csak RAVEN-en, lokálisan** fut; az nds máshol. Az ütközés **lappangó**, nem aktív. |
| 🔴 **Mikor robbanna** | ha a my-assistant bármely része **PLO KOON-ra** (test szerver) kerülne — ott az nds **tényleg fut**. |
| 📌 **Miért most derült ki** | mert a relay **oda települ**, és ezért kellett a port-kiosztást komolyan megnézni |

⚠️ **A `my-assistant` NINCS BENNE a SSOT-ban.** *(A `fdpAssistant` = XY 21 egy **másik** projekt —
„FDP Assistant" —, nem ez.)* Vagyis a 24-es slotot a my-assistant **sosem regisztrálta**;
a DEC-MA-009 „előre allokált" reménye nem valósult meg, az nds pedig időközben elvitte.

### A szabad slotok — mérve

A SSOT legmagasabb kiosztott azonosítója **32** (`fdpWatchNReview`: 4232 / 39325).
**A 33-tól felfelé szabad** — ellenőrizve: `4233 / 39335 / 39337 / 4234 / 39345` egyike sem szerepel.

⚠️ **Mellékes, de fontos:** a FAM-ban lévő emlékeztető *(„War Factory 24 · Niche Datasets 25 ·
FAM 26")* **ELAVULT** — a fájl szerint `warFactory` = **06**, `nicheDatasetsSpace` = **24**,
`fdpPal` = **25**. ⇒ **A FÁJL a SSOT, nem a memória-jegyzet.**

### Javaslat

| Mi | XY | Portok |
|---|---|---|
| ⭐ **`my-assistant-relay`** *(új, a relay)* | **34** | `39345` http · `39347` notif · *(kliens nincs)* |
| ❓ **`my-assistant`** *(a meglévő, ütköző)* | **33** | `39335` http · `4233` kliens · `39337` notif |

**A relay-re a 34 biztonságos** — szabad slot, és a relay az egyetlen rész, ami közös hosztra megy.

**A my-assistant átköltöztetése (24 → 33) KÜLÖN döntés**, mert:
- ⚠️ érinti a futó szervert, az LDP-konfigot, a `.env`-et és a doksikat *(a DEC-MA-009 szerint
  a felület kicsi: „`grep 39245 | wc -l` mutatja a teljes felületet")*;
- ⛔ **de amíg nem tesszük meg, a my-assistant szervert NEM szabad PLO KOON-ra deployolni.**

### Regisztráció

Ha az owner jóváhagyja, a slot(ok) **be is kerülnek** a `port-env-settings.const.ts`-be —
különben megismétlődik ugyanez: egy másik projekt szépen elviszi a „szabadnak hitt" slotot.
⚠️ Az `fdp-templates` **bedrock-csomag**, a my-assistant projekten **kívül** ⇒ az oda írás
külön owner-jóváhagyást igényel *(vagy BEDROCK-FRS-t)*.
