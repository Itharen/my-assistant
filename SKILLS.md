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
| `pnpm run start` | `ng serve --port=4233 --host=127.0.0.1` |
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

### LinkedIn personal inbox

- Kanonikus agent-semleges read/sync CLI: `ma linkedin`; a guided manual-send felület indítása `npm start`, agentből
  böngészőnyitás nélkül `npm run start:agent`.
- Hivatalos, read-only LinkedIn Member Data Portability API: snapshot bootstrap + incremental changelog sync.
- CLI runbook: `__documentations/dev/LINKEDIN_INBOX_CLI.md`; workspace/extension runbook:
  `__documentations/dev/LINKEDIN_WORKSPACE.md`; terv: `__agent/plans/linkedin-integration-hyperplan/`.
- A jelenlegi owner-választás szerint a token a gitignored root `.env` `LINKEDIN_MEMBER_ACCESS_TOKEN` kulcsán van;
  FDP Keystore opcionális provider. A lokális config csak credential-source/key hivatkozást tárol.
- Alap állapotgyökér: `%USERPROFILE%/.config/my-assistant/linkedin/`; nem repo és nem Source of Truth.
- Első diagnosztika: `ma linkedin auth status --pretty`, majd `ma linkedin doctor --pretty`.
- Teljes bootstrap: `ma linkedin inbox bootstrap --pretty`; biztonságos próba: `--dry-run`.
- Normál frissítés: `ma linkedin inbox sync --pretty`; a changelog 28 napos, ezért rendszeres sync kötelező.
- Lapozás: listázáskor `nextOffset` minden oldalát követni kell `null`-ig.
- Első triázs: `ma linkedin review list --state unreviewed --since-days 90 --pretty`; minden teljes thread elolvasása
  után egy atomi `ma linkedin review apply --stdin`, majd `ma linkedin inbox needs-reply --since-days 90 --pretty`.
- `technicalNeedsReplyCandidate` csak a legutolsó inbound üzenet determinisztikus technikai jelzése. A
  `needsReply` kizárólag friss, az aktuális utolsó üzenethez kötött agenti értékelésből jön; lezárás, automatizmus és
  duplikáció nem kerül a válaszsorba. Új aktivitás a review-t és a hozzá kötött draftot elavulttá teszi.
- `unread` a live kalibrációig csak candidate.
- `thread show` és `reply show` explicit content-revealing művelet; listák nem adnak vissza message/draft body-t.
- Nincs send parancs: a reply draft lokális, LinkedIn-küldést soha nem szabad állítani official write receipt nélkül.
- A saját `browser-extension/` MV3 companion csak a localhost My Assistant laphoz kap host permissiont. A Chrome
  Side Panelben a saját `/linkedin` UI-t mutatja, normál LinkedIn messaging tabot nyit, de nincs LinkedIn content
  script/host permission/DOM-hozzáférés. Build/test: `pnpm run build-browser-extension`,
  `pnpm run test-browser-extension`.
- Az unpacked extension manifest key miatt stabil ID-je `amdkdmdajbhlhfgacbodpnlkjjfioclm`. A szerver csak ezt az
  origint engedi a `/linkedin?surface=sidepanel` frame-jéhez; eltérő Chrome-ID hibás vagy régi extension-betöltést jelez.
- A UI `manual-send-reported` állapota owner-jelentés, nem API receipt. CV-csatolás és natív Send mindig kézi.
- Törlés: draft/cache csak explicit `--confirm`; a config cache purge mellett megmarad.
- Globális telepítés ezen a gépen: a tartós `PNPM_HOME=E:\pnpm\bin` hibásan `bin\bin`-t képez, ezért a javított
  értéket csak a telepítő processzre add: `$env:PNPM_HOME='E:\pnpm'; pnpm add --global '<repo>\cli'`.

### Interfood menu intelligence

- Kanonikus agent-semleges CLI: `ma interfood`; a publikus heti menühöz nem kell MCP, browser vagy login.
- Runbook: `__documentations/dev/INTERFOOD_CLI.md`; terv: `__agent/plans/interfood-integration-hyperplan/`.
- Rendelhető hetek: `ma interfood weeks --pretty`.
- Egy hét: `ma interfood menu --pretty`, vagy explicit `--year <YYYY> --week <1..53>`.
- Aktuális + következő két hét: `ma interfood menu-range --weeks 3 --pretty`.
- Lejárt normál határidő után a következő napi élő készlet: `ma interfood last-minute --pretty`. Csak az aktuális
  `isLastMinuteOrderable=true`, `disabled=false` occurrence választható; üres válasznál a nap megoldatlan marad, a
  lejárt heti étlapra nem esünk vissza. A nyers készletszámlálókból nem találunk ki maradék-képletet.
- `complete=false` és `warning` esetén kevesebb hét érhető el; ezt soha ne kezeld üres menüként.
- A `menuItemId` heti/dátumspecifikus rendelési azonosító; `foodId` az ételazonosítás egyik jele.
- A `foodId` alapján order-line-t tilos összevonni. Külön identitás a dátum/adag-specifikus `menuItemId`, az
  `orderId`, az `orderLineId` és a `quantity`; ugyanaz az étel lehet kis+teljes adag, több napon és egy nap 2×.
- A CLI adag- és 100 g-os tápértéket is ad; hiányzó mező `null`, nem nulla.
- A teljes nyers menü cache-jellegű. A usernek csak az érdekes, megváltozott vagy azonosítatlan jelölteket mutasd,
  egyetlen összegyűjtött egyeztetési körben.
- Authenticated order history a `my-assistant-interfood-dedicated-v1` persistent UBH profilból jön:
  `ma interfood auth status|start`, majd `orders sync|list|coverage|patterns`. Rutin agent-futtatásnál használd a
  `--summary` kapcsolót; account/cart/order output alapból PII-minimal summary, `--full` csak helyi diagnosztika;
  jelszó/cookie/session nem env.
- `UBH-BROKER-NOT-RUNNING-001` esetén `ubh broker start`, majd ha az `auth status` szerint a dedikált browser nem
  fut, pontosan egyszer `ma interfood auth start --pretty`. A perzisztens profil megőrzi a sessiont; futó browserre
  ne indíts újabb login ablakot, hanem a visszaadott `nextSafeAction` szerint diagnosztizálj és olvass vissza.
- Történeti jelöltek: `ma interfood orders patterns --minimum-units 2 --limit 30 --pretty`; a
  `--double-orders-only` csak azokat mutatja, amelyekből legalább egy napon összesen kettő vagy több adag volt.
  Az aktív értelmezési szabályok egyetlen SSOT-ja: `current/principles/interfood-food-preferences.md`.
- Opcionális leves/desszert feltárás: `ma interfood orders patterns --add-ons-only --minimum-units 1 --limit 30
  --pretty`. A `plan week` napi `addOns` kimenete külön kezeli őket: nem számítanak bele a napi 2 főételbe. Exact
  identity legalább 5 korábbi rendelési napon owner-confirmed liked, ezért quantity-one ajánlás lehet broad
  family/pattern favorite és score-heurisztika előtt; 1–4 nap csak evidencia. Explicit későbbi korrekció és hard
  reject felülírja.
- Explicit preferencia: `preference set|compare|portion|list`; a gépi projekció `current/interfood/preferences.json`,
  az ember által olvasható normatív SSOT `current/principles/interfood-food-preferences.md`.
  Több `preference set` írás ugyanabba a JSON-store-ba **mindig sorosan** fusson: külön processzek párhuzamos
  read-modify-write-ja elveszítheti az egyik frissítést. Minden batch után célzott `preference list` readback kell.
  Általános névminta: `preference set --scope food-name-pattern`; adagválasztás:
  `preference portion --pattern <névrészlet> --prefer small|full [--except-pattern <névrészlet>]`.
  A planner csak tényleges `small|full` occurrence-re alkalmazza; `unspecified` adagot nem talál ki.
  `preference set` mellett ismételhető `--except-pattern`: a teljes normalizált ételszövegben talált kivétel
  kikapcsolja az adott szabályt (például hal dislike, kivéve halrud; marha/sertés dislike, kivéve darált).
- Teljes kívánt kosárhoz először `cart diff --items-file ...`, majd jóváhagyott összeállításnál
  `cart reconcile --items-file ...`; a fájlban nem szereplő meglévő sorokat a reconcile eltávolítja.
- A Last Minute végleges rendelés a provider szerint nem mondható le. A draft kosárkezelés után is közvetlenül a
  véglegesítés előtt friss `last-minute` readback és külön owner-megerősítés szükséges.
- Azonosítás és terv: `foods identify|list`, `plan week`, `nutrition compare`.
- Ha az owner külön hét/időtartomány nélkül kér Interfood-ajánlást, először `weeks`, majd minden nem disabled,
  current/future hétre `orders coverage` + `plan week`; az összes lefedetlen napot egy batch-ben mutasd. A teljesen
  lefedett napokat ne rendeld újra, csak jelezd a kihagyásukat.
- A napi alapértelmezett igény 2 adag: `plan week --meals-per-day 2`, illetve
  `orders coverage --expected-per-day 2`. A recommendation sorok `quantity` összege számít, nem a sorszám.
  Normálisan két külön food identity kell; small+full ugyanabból nem két étel. `quantity=2` csak explicit
  **exact-food** `favorite` jelölésből lehet, ha az exact ételt már rendelték legalább egyszer; broad family/pattern
  favorite nem jogosít duplázásra, ismeretlen/kísérleti étel pedig soha nem 2×. Két külön identitynél is előbb
  eltérő elsődleges ételcsaládot válassz.
- A leves és desszert opcionális `+ tétel`: a napi két főétel mellett, nem helyette. A planner a kategória alapján
  kizárja őket a főétel-allokációból és külön `soup` / `dessert` slotban kezeli őket.
- Levest és desszertet csak explicit owner-confirmed exact-food kedvencként ajánlj. Ismeretlen vagy pusztán
  változatossági add-on alternatívát ne adj; a history csak közös megerősítési jelöltet képezhet. Gyümölcsleves hard
  reject (`food-type:meal:gyumolcsleves`). Fél főételt ismeretlen süteménnyel csomagoló menü se kerüljön automatikus
  főétel-ajánlásba vagy alternatívába.
- A változatosság a főételre vonatkozik: a compact plan napi `alternatives` és `healthOrientedAlternatives` mezőit
  külön mutasd be. Utóbbi csak teljes energy/protein/salt adaton alapuló relatív heurisztika. Mindkettő identity-
  deduplikált, és egyik alternatíva sem automatikus plusz kosártétel.
- Egy táblázatsor/nap: a két főétel egymás alatt egy cellában, a kedvenc leves/desszert alattuk külön `+` soron.
  Alternatívák ugyanennek a táblának másik oszlopában. ID-k csak a belső gépi adatban; a usernek nem kellenek.
- Fix jelölések: ⭐ kedvenc, 🥦 egészségesebbnek szánt/tekintett választás, ⚠️ figyelmeztetés a konkrét okkal,
  🍲 leves és 🍰 desszert. A jelölések kombinálódnak (például `🍲 ⭐`).
  Üres add-on esetén ne írj `nincs leves` / `nincs desszert` placeholder sort.
  Korrekció után mindig a TELJES kért horizontú ajánlás jön újra a chatben, nem csak módosult sorok vagy fájllink.
- A compact candidate `dietaryWarnings` mezőjét mindig kiemelten jelenítsd meg. Kizárólag tej/tejszín allergiajel
  health lane-ből kizár; nem kedvencet biztonságos étel mögé sorol, de explicit ⭐ kedvencet nem tolhat félre. A
  warning a kiválasztott kedvenc mellett is maradjon
  látható. Tejföl, joghurt, túró, vaj és sajt explicit rendben van (owner-pontosítás 2026-09-02); a korábbi tágabb
  értelmezés felülírva. Későbbi explicit owner-pontosítás: sajtoknál, így camembertnél nincs tejjelzés; más érintett
  ételeknél marad a tej/tejszín figyelmeztetés. Ez személyes megjelenítési kivétel, nem biztonsági igazolás. History nem írja
  felül; figyelmeztetés hiánya nem allergénmentességi igazolás. Kedvenc kihagyását magyarázd el név szerint.
- A kedvenc konkrét változatát és exact előzményeit nézd: a gyakran rendelt rántott camembertet nem helyettesíti
  automatikusan egy egyszer rendelt camembertes rizottó. Kedvenc–korlátozás ütközést kiemelt döntési pontként
  mutass, ne rejtsd az alternatívák közé. A kedvencek hiányolása nem allergiaszabály-feloldás.
- Tortilla/burrito/wrap pozitív névminta. Gomba `fallback`: ha van más elfogadható étel, azt válaszd.
- A kipróbált tépett csirkés BBQ tortilla exact dislike. Krumpli preferált; tészta fallback; brassói/vadas és
  gyümölcsös hús dislike. Rizs/rizottó kisadag-próba, tényleges occurrence és a korábbi teljesadagos kivételek szerint.
  A `rizs` portion pattern a `rizzsel` alakot is felismeri. A negatív döntést pozitív családminta vagy variety nem
  írhatja felül. A szilvalekváros derelye nem főétel-alternatíva: a ritka desszert-kedvenc szabály szerint kezelendő.
- Teljes összetevő-listát ellenőrizz: a névben nem jelzett alma vagy a szárnyas vagdaltban lévő csirkecomb is
  döntési szempont. Az ilyen review-csere nem új explicit user-preferencia. Ha a fiókszinkron nem megy, nyilvános
  menüből készülhet ajánlás, de a cache pontos dátumát és a friss fiókállapot hiányát jelezni kell.
- A planner alapértelmezett ismétlési ablakai 7/14/28 nap; szükség esetén
  `plan week --repetition-windows 7,14,28` formában három szigorúan növekvő napértékkel állíthatók.
- A `fallback` stance erős hátrasorolás, de nem kizárás: csak jobb elfogadható jelölt hiányában kerül elő.
- Quinoa, kuszkusz és bulgur aktívan keresett/preferált; ez nem írja felül a társított negatív összetevőt.
  Exact `food:2131` Mexikói húsos, babos tortilla kedvenc, és `food:323` Házi lecsó virslivel, bulgurral előbbre
  való `food:38` Székelykáposzta csirkemellből ételnél.
- A szombati Interfood-menü pénteken érkezik. A `plan week` a pénteki és szombati occurrence-öket egyetlen pénteki
  poolban rangsorolja, a kimenet `sourceDates` mezője jelzi a forrásnapokat; a kiválasztott sor eredeti dátuma/ID-je
  a candidate `menuDate`/`menuItemId` mezőjében változatlan marad a kosárhoz.
- A hosszú távú, teljes history pozitív `historicalAffinity` evidenciát ad (napok + mennyiség + dupla napok,
  maximum 35 pont); a közeli ismétlés ettől független negatív jel, az explicit user-döntés mindig erősebb.
- A pairwise preferencia csak akkor pontoz, ha az adott napon mindkét alternatíva elérhető. A változatosság külön
  bünteti az ismételt fehérjét, elkészítést, köretet, szószt és kategóriát. Hiányos tápértékből nem készül nulla.
- Explicit user-preferenciát alacsonyabb authority-jű order/inferred jel nem írhat felül. `food-type` kategóriára
  vagy determinisztikus facetre (például `protein:gomba`) célozhat; `ingredient-pattern` hard rejectet is adhat.
- A planner beolvassa a fingerprint registry-t; a new/missing/changed identitás pontozott bizonytalanság és egyetlen
  batchelt user-review része, nem automatikusan ismert étel.
- Kosárírás: `cart show|add|set|subtract|remove|clear`; minden mutáció után authoritative cart readback.
- Leadott rendelés: `order show|check|change-preview|change-apply`; csak immutable preview + exact-hash explicit approval +
  final `order-details` readback után. Csak csökkentés/törlés támogatott, részleges previewban kizárólag a változó
  cart-item sor küldhető. Apply előtt kötelező az order/safety/refund preview újbóli ellenőrzése; drift esetén stop.
- Kötelező command-scope: cart `show|add|set|subtract|remove|clear|diff|reconcile`, illetve submitted-order
  `show|check|change-preview|change-apply`. A cart user-kért, egyértelmű sorai ténylegesen alkalmazandók;
  a leadott order change pénzügyi preview-hashhez kötött külön approvalt igényel.
- Folyamatos dokumentáció: minden új Interfood-kérés, működési tapasztalat és döntés ugyanabban a change-setben
  kerüljön az összes érintett helyre; kötelező mátrix: `current/principles/interfood-continuous-documentation.md`.
- Aktuális, képes My Assistant nézet publikálása: `ma interfood recommendation publish --selection <selection.json>
  [--review <review.md>] --pretty`. Ez fail-closed módon élő menühöz ellenőriz, majd kizárólag a stabil
  `current/interfood/latest-recommendation.json` snapshotot írja; a felület és API csak ezt olvassa.
- Étel-visszajelzés: `ma interfood feedback add --menu-item-id <id> --rating
  loved|liked|neutral|disliked|waste --reason "..." [--eaten-on YYYY-MM-DD] --pretty`, illetve `feedback list`.
  A visszajelzés rangsorolási evidencia, nem írja át némán az explicit preferenciákat.
- Napok közti átcsoportosítás: `plan week --carry-over-mode review` (alapértelmezett) csak review-köteles 4→0
  lehetőséget ad. Tárolhatóság/melegíthetőség megerősítése nélkül nem kerülhet kosárba; `off` kikapcsolja.

### Konzol-pulzus — mi történik a rendszerben (`SystemPulse_Service`)

- **Nem parancs, hanem a szerver folyamatos kimenete.** Az LDP terminálablakában **percenként
  EGY sor** jelenik meg. Valódi, **rögzített** sor a futó rendszerből *(2026-09-07 09:20)*:
  ```
  🫀 09:20 · fut 1p │ 💬 Discord ✅ Honnie#6234 (50mp, 0 üz) │ 🏠 jelenlét ✅ tétlen (45mp) │ 📬 ⚠️ 3 üzenet vár │ ↩ kimenő 9p
  ```
  ⭐ **Ez a konkrét sor mutatta meg, hogy 3 üzenet vár** — a `📬 ⚠️` rész pontosan azt a
  dolgát végezte, amiért a sor létezik.
- ⭐ **Ránézésre olvasható:** ha valami baj van, 🔴 vagy ⚠️ jelenik meg **a sorban** —
  `🔴 HALOTT (12p)` · `🔴 nincs életjel` · `🔴 ELAVULT` · `⚠️ 2 üzenet vár`.
- 🔴 **A valóságot méri, nem a konfigurációt:** az életjel- és minta-fájlok FRISSESSÉGÉBŐL
  dolgozik. ⚠️ Ne keverd az LDP `status.json`-jával: ott a `serverRunning: false` az LDP belső
  „restart pending" jelzése, **nem** a szerver valós állapota.
- **Nem helyettesíti a `ma comm doctor`-t:** a pulzus nyers tényeket mutat (hány üzenet vár,
  mikor ment ki az utolsó); az **értékelés** — például a válasz-kötelezettség — a `doctor` dolga.
- Hol: `server/src/_services/system-pulse.service.ts`. A sor formázása tiszta függvény
  (`composePulseLine`), 14 teszttel.

### Beszédfelismerés — `cli/src/stt/` (FDP AI, helyi)

- **A saját, HELYI szolgáltatásunk** (`http://127.0.0.1:38321`), ⛔ nem fizetős.
  A pontos, **mért** szerződés: `__documentations/dev/FDP_AI_STT.md`.
- **`transcribeAudio()`** — nyers audio-bájtok POST-tal, `Content-Type` + `Filename` fejléccel.
  ⛔ **NEM multipart.** Hibát **nem dob**: leíró eredményt ad `remedy`-vel.
- ⭐ **`composeMirrorMessage()` — a TÜKÖR-ÜZENET kötelező.** Egy félrehallott hangüzenetre adott
  magabiztos válasz **rosszabb, mint a semmi**; a tükör az egyetlen pont, ahol az owner **még a
  cselekvés előtt** elkaphatja a félreértést.
- **`inspectTranscript()` — hallucináció-őr.** Whisper csendre/zajra ismert felirat-töredékeket
  ad vissza (`Продолжение следует…`, `Thanks for watching!`), és a válasz `status: processed`.
  Az őr **soha nem dob el szöveget, csak MEGJELÖL** — a döntés a useré.
- 🔴 **Időtúllépésnél ELŐSZÖR A RENDSZER-RAM-OT nézd, ne a GPU-t.** Mérve 2026-09-07: 93%-os
  RAM mellett 5 perc alatt sem futott le; közvetlenül utána ugyanaz a fájl **77,6 mp**.
  Owner: *„90% usage felett várakozik"*.
- ⛔ **Az FDP AI-hoz SOHA nem nyúlunk** — nincs újraindítás, leállítás, modell-unload.
  Owner: *„Ahhoz soha ne nyúlj!"* → `current/principles/fdp-ai-never-restart.md`.

#### 🎙️ `SttRetryQueue` — a fel nem ismert hang NEM vész el (`stt.retry-queue.ts`)

**Mért hiány 2026-09-07:** 16 sikeres felismerés mellett **2 hangüzenet teljesen elveszett**
(5 perces időtúllépés), mert nem volt újrapróbálás.

- 🔴 **A BÁJTOKAT teszi el, NEM az URL-t** — a Discord letöltési linkje aláírt és **lejár**.
- ⏳ **2 → 5 → 15 → 45 perc**, összesen **5 próba**. A lépcsők **növekvők**: a sűrű
  újrapróbálás nem ügyesebb, csak többször fut ugyanabba a RAM-falba.
- ⭐ **SOHA nem fut két felismerés egyszerre** (`sttInFlight` a figyelőben). Ez maga az
  alkalmazkodás: az újrapróbáló nem tetézheti azt a RAM-csúcsot, ami ellen létezik.
  Owner: *„Ezt nem kell megoldani, csak azt ahogy alkalmazkodunk ehhez."*
- ✅ A **később** felismert szöveg ugyanúgy a **kötegbe** kerül — a tükör önmagában kevés
  volna: a tartalom attól még nem jutna el hozzám.
- 🔴 **5 próba után az owner MEGKAPJA**, hogy elveszett. A néma eldobás pontosan úgy néz ki,
  mintha meg sem érkezett volna az üzenet.
- ⚠️ A **gyanús átirat NEM kerül a sorra**: az nem múló zavar, hanem maga az eredmény.
- 👀 **Láthatóság:** a konzol-pulzus kiírja (`🎙️ N hang újrapróbálásra vár`) — de csak ha van.
- Tárhely: `~/.config/my-assistant/stt-retry/` *(⛔ nem a repóban — nyers hangfelvételek)*.

#### 👂 Fül-reakció + válasz-lánc (`discord.voice-acknowledge.ts`)

> **Owner (2026-09-07):** *„nem typing kell, amikor hangüzenetfeldolgozás van, hanem tudsz-e
> dobni egy fül emojit a hangüzenetekre, és tudsz-e riplájolni a hangüzenetekre"*

- 👂 A **fül-reakció a felismerés ELÉ** kerül — RAM-terhelésnél percekig tart, addig ez az
  egyetlen jel arról, **melyik** üzeneten dolgozom. *(A „gépel…" csatorna-szintű, ezt nem tudta.)*
- ↩ Az átirat **válaszként** megy a hangüzenetre → a Discordon **tartósan összekötve** marad.
- 🔴 A válasz-út **ugyanazt a szerződést** teljesíti, mint a küldő: `splitForDiscord` +
  `recordOutbound('ack')`. Egy gyorsabb út, ami közben kikapcsol egy őrt, rosszabb a lassúnál.
- Bukásnál **visszaesik** a csatorna-küldésre; részleges bukásnál külön jelzi, hogy az átirat
  **csonkán** látszik.

### 🔊 Hang-csatorna — a három megfigyelő (T-22, 2026-09-07)

A lánc: hang-kapcsolat → **átemelt CCAP-felvevő** → WAV → a mi STT-nk → köteg + tükör.
⛔ Az átemelt kódhoz **nem nyúlunk** — mindhárom eszköz **mellé** került.

| Fájl | Mit ad |
|---|---|
| `voice-drop-probe.ts` | 🔍 a WAV-életciklus figyelése ⇒ **hány MÁSODPERC** beszéd veszett el némán |
| `voice-missed-speech.ts` | 🔇 ami nem jutott át, az is **látszik** a hang-csatornában — **összevonva** |
| `voice-cues.ts` | 🔊 **hangjelzések** a CCAP eredeti hangjaival |

- ⭐ **Miért nem elég a `detected − delivered`:** összemossa a **beleolvadt** megszólalást
  *(nem veszteség)* a felvevő **eldobásával** *(veszteség)*. A fájl-szintű mérés választja szét.
- 🔇 **`MA_VOICE_CUES=off`** — a hangjelzések azonnali kikapcsolása kódmódosítás nélkül
  *(hangszóró-visszacsatolás esetére)*. ⏱️ **Két sáv, két fék:** „hallak" **3 s**, kimenetel **0,8 s**
  — közös fékkel a „hallak" **elnyelné** az eldobás-jelzést (t≈1,4 s).
- 📊 **A MÉRÉS KIOLVASÁSA — egy parancs** *(ne grep-elj kézzel)*:
  ```bash
  ma comm voice-funnel                    # ⭐ gördülő 12 óra — ÁTÍVEL az éjfélen
  ma comm voice-funnel --hours 24         # hosszabb ablak
  ma comm voice-funnel --day 2026-09-08   # egy konkrét naptári nap
  ma comm voice-funnel --json --pretty    # gépi envelope
  ```
  🔴 **Miért gördülő ablak az alap** *(mérve 2026-09-08 00:51)*: az owner ébrenléte **csúszik**,
  tehát egy éjfélen átnyúló beszélgetés naptári napokra bontva **kettévágódna** — és egyik nap sem
  mutatná az igazi arányt. ⚠️ Ez a rosszabbik hiba: **nem hibázik, csak nem mond igazat.**
  ⭐ A tetején az **ÁTVITELI ARÁNY** áll — az a szám, amit az owner kérdezett *(„egy százaléka
  ment át")*. 🔴 **5 megszólalás alatt „KEVÉS MINTA"-ként jelzi**, hogy még nem lehet
  következtetni — pontosan az a túlállítás, amiért 22:08-kor jogos kritikát kaptam.
- ⚠️ **BUKTATÓ:** a fő `tsc` önmagában **nem elég** — az átemelt fa külön projekt:
  ```bash
  cd cli && npx tsc -p tsconfig.transplanted.json && npx tsx scripts/transplanted-build-fix.ts
  ```
  Enélkül a `_modules` **futásidőben nem létezik**, és a zöld típus-ellenőrzés **elfedi**.

Részletek: `__documentations/dev/VOICE_CONTROL_REFERENCE.md` §8.

### Kezbesitesi ertesito — „most ment el neked X uzenet" (`discord.receipt.ts`)

> **Owner-KORREKCIO (2026-09-07 10:29):** *„Nem kell folyton irni, hogy megvannak az
> uzenetek... Eleg ha a typing frissitve van es esetleg arrol kuldhetsz egy rovid 2 szavas
> valaszt, hogy na most ment el neked x uzenet"*

- ⛔ **A VARAKOZASROL NEM szolunk** kulon uzenetben — arrol a **„gepel…"** jelzes beszel.
  ⚠️ **HANGUZENETNEL MAS:** ott a **👂 ful-reakcio** a varakozas jelzese, nem a typing — mert
  az megmondja, **MELYIK** uzeneten dolgozom *(owner-korrekcio 2026-09-07 12:26)*.
  *(Elobb „megerkezett, dolgozom" nyugtat kuldtem; az owner szerint ez sok volt, es igaza
  van: ugyanazt mondta el meg egyszer, szavakkal.)*
- ✅ **A KULDES pillanataban** megy egy **tomondat**: `📨 Átment 3 üzeneted.`
  Ez az egyetlen pillanat, amirol a „gepel…" **nem tud beszelni**.
- **A „gepel…" felso korlatja 15 → 45 perc.** A 15 perc rendszeresen lejart egy valodi
  munka kozepen, es onnantol nema volt a csatorna. ⚠️ A **szelep megmaradt**: a
  `false`-„gepel…" incidens megmutatta, miert kell felso korlat — egy beragadt allapot igy
  meg mindig **magatol gyogyul**.
- 🔴 Az ertesito **NEM valasz**: a kimeno naploban `kind: 'ack'`, es a
  valasz-kotelezettseg-ellenorzes kihagyja.

⭐ **A tanulsag:** nem eleg **jelezni**; a jelzesnek azt kell mondania, amit a tobbi jel NEM
mond el. A redundans visszajelzes nem megnyugtat, hanem **zajja valik**.

### Tavvezerles-szuro a jelenletben (`presence.remote-session.ts`)

> **Owner (2026-09-07):** *„lehet megzavartam a jelenlet figyelest tavvezerlessel..."*

- 🔴 **A problema, MERVE:** a RustDesk a **KONZOL-munkamenetbe injektalja a bevitelt**
  (`query session` -> `console`, nem `rdp-tcp`), ezert a tavoli kattintas **bajtra ugyanugy
  nez ki**, mint a helyi. Az uresjarati idobol ez SOHA nem lesz megkulonboztetheto.
- ⭐ **A megoldas:** nem az inputot vizsgaljuk, hanem hogy volt-e **nyitott tavoli munkamenet**.
  A RustDesk kapcsolat-kezeloje (`%APPDATA%\RustDesk\log\cm`) naplozza:
  `Got new connection` -> kezdet, `connection closed` -> veg.
- **Elo bizonyitek:** a 09:15:33-as „aktiv" minta a **09:15:27 -> 09:23:10** kozotti tavoli
  munkamenetbe esik. Ez oldotta meg a reggeli rejtelyt.
- ⚠️ **A FAJLNEV NEM A MUNKAMENET IDEJE.** A RustDesk forgatja a naplot, es az uj fajl a
  **KOVETKEZO** munkamenet idejerol kapja a nevet: a `..._09-15-27.log` valojaban a
  **09-05 07:52:27**-es munkamenetet tartalmazza. ⛔ Mindig a TARTALMAT elemezd.
- **Az eredmeny `unknown`, NEM `no`:** attol, hogy tavolrol nyult a gephez, meg LEHET itthon.
  A nem tudas kulon allapot — es a hangszoros kapu erre TILT.
- Ha nincs RustDesk vagy a naplo olvashatatlan: ures lista = „nem tudunk tavoli munkamenetrol",
  vagyis a jelenlet annyit tud, amennyit eddig is — nem kevesebbet.

### Mikor megy ki a koteg — a felteteles sor (`decideFlush`)

> **Owner (2026-09-07):** *„ha running vagy van message a queue-ban akkor csak gyujtunk"*

```
1. biztonsagi szelep (a legregebbi tetel tul reg var)  -> KULD, foglaltsag ellenere is
2. a session dolgozik                                   -> gyujtunk
3. a CCAP soraban MAR ALL egy tetel                     -> gyujtunk   <- ez hianyzott
4. a sor ZAROLT                                         -> gyujtunk   <- ez is
5. az osszegyujtesi ablak meg tart                      -> gyujtunk
   kulonben                                             -> KULD, EGY promptban
```

- 🔴 **Mert hiany (2026-09-07):** a dontes **csak** a `isBusyProcessing`-et nezte. Van egy res:
  a session eppen nem „dolgozik", de a CCAP soraban **mar all** egy tetel. Ilyenkor a kuldes
  nem varakoztat, hanem **beall a sorba** — vagyis **kulon futas** lesz belole, pont az
  ellenkezoje annak, amiert a kotegeles letezik. Az owner ezt **elesben vette eszre**.
- ⚠️ A **biztonsagi szelep** a tele/zarolt sort is felulirja — kulonben egy beragadt sor mellett
  a koteg **orokre** allna.

### A koteg-prompt idobelyege ES KORA (`discord.batch-composer.ts`)

> **Owner-otlet (2026-09-07):** *„Ezeket a discord inputjaimat, lehet hasznos lenne ellatni
> timestamp-el"*

Az **abszolut idobelyeg** mar korabban is ott volt; ami hianyzott, az a **KOR**:

```
INCOMING_USER_MSG_ON_DISCORD: 2 uj uzenet Discordon (idorendben, osszevonva).
*(kezbesitve: 2026-09-07 10:35)*

### Uzenet [1/2] - 2026-09-07 09:00 *(1 o 35 perce - ⚠️ REGI, nezd meg, aktualis-e meg)*
Mikor induljak?

### Uzenet [2/2] - 2026-09-07 10:34
Ez most jott.
```

- 🔴 **Miert szamit:** a koteg csak akkor megy ki, amikor a session felszabadul — ez akar **egy
  ora** is lehet. Puszta abszolut idobelyegbol nem tunik fel, hogy egy keres mar **elavult**:
  a *„mikor induljak?"* egy oraval kesobb egeszen mast jelent, es a rossz valasz rosszabb,
  mint a kesoi.
- A **kezbesites ideje** kulon sorban all — enelkul nincs mihez viszonyitani a kort.
- **Friss uzenetnel (< 2 perc) nincs kor-jelzes** — ott csak zaj lenne.

### A koteg FRISSITESE kikuldes elott (`discord.batch-refresh.ts`)

> **Owner (2026-09-07):** *„Jo lenne ha a discord msg kezeles frissitene kuldes elott a
> msg-eket. (Ha idokozben meg gyujtes/kuldes elott javitom/modositom, akkor a friss menjen neked."*

- A koteg akar **percekig gyulhet**, amig a session dolgozik. Ha ezalatt kijavitasz egy
  elgepelest vagy atfogalmazol egy utasitast, a **friss** valtozat megy at.
- **Mikor fut:** pontosan a **kuldes pillanataban** (`flush({ beforeSend })`), NEM a
  15 mp-es koron. Igy nem kerdezzuk le a Discordot feleslegesen percenkent negyszer.
- 🔴 **`force: true` a lekerdezesnel** — a discord.js alapbol a **gyorsitotarbol** adna vissza
  a **regi, szerkesztes elotti** szoveget, es a frissites nemán hatastalan maradna.

**A harom eset szandekosan kulon van kezelve:**

| Allapot | Mit teszunk | Miert |
|---|---|---|
| `present` | a **friss** szoveget vesszuk | ez a keres |
| `deleted` *(Discord `10008`)* | **kiejtjuk** a kotegbol | ha visszavontad, ne cselekedjek ra |
| `unknown` *(halozat, jogosultsag, idotullepes)* | **valtozatlanul megtartjuk** | ⛔ egy halozati hiba NEM torolhet uzenetet |

- 🔴 **URES friss tartalom SOSEM ir felul meglevot.** A **hanguzenet** miatt kritikus: ott a
  kotegben az **atirat** all, a Discord-uzenet torzse viszont ures — enelkul a frissites pont
  az utolso lepesnel torolne ki a felismert szoveget.
- 🔴 **A kozben erkezett uzenet megmarad** (`store.applyPendingRefresh` osszefesul, nem
  felulir): a frissites halozati korokbol all, tehat eltart — egy sima felulirás az ezalatt
  erkezett uzenetet **nemán eldobna**.
- A frissites elmaradasa **sosem allitja meg a kikuldest** — olyankor a regi tartalom megy at.

### Hangüzenet Discordon — a teljes út (`discord.voice-message.ts`)

```
Discord hanguzenet  ->  szuro (hangot is elfogad)  ->  👂 FUL-REAKCIO  ->  letoltes
                    ->  FDP AI STT  ->  ⭐ TUKOR VALASZKENT a hanguzenetre
                    ->  megjelolt atirat a kotegbe

                        bukas eseten:  🎙️ ujraprobalo sor (2/5/15/45 perc, 5 proba)
```

- 🔴 **MERT BLOKKOLO, ezert keszult:** a Discord-hanguzenet **ures szoveggel** erkezik, a hang
  csatolmany — a szuronk pedig az ures tartalmat *„nincs mit atadni"* indokkal **eldobta**.
  A hanguzenetek tehat **nemán elvesztek**. Regresszio-teszt orzi *(a 8 uj szuro-teszt kozott)*.
- ⭐ **Bizonytalan vagy sikertelen felismeresnel a kotegbe SEMMI nem kerul.** A tukor-uzenet
  kimegy *(„NEM cselekszem ra")*, es varunk. Egy felrehallott mondat a kotegben mar az owner
  **szo szerinti utasitasanak latszana** — inkabb ne ertsuk, mint felreertsuk.
- **A kotegbe kerulo szoveg MEG VAN JELOLVE:** `🎙️ HANGÜZENET — gépi átirat …, NEM gépelt szöveg`.
- **Vedokorlatok:** max **25 MB** *(a letoltott MERET is ellenorizve, nem csak a Discord
  allitasa)* · 60 mp letoltesi idokorlat · ures fajl = hiba · **duplikatum-szures a DRAGA lepes
  ELOTT** (a Discord ujrakuldhet egy esemenyt; enelkul masodik tukor-uzenet menne ki).
- **A backfill is ezen az uton megy** — kulonben a leallas alatt erkezett hanguzenet URES
  tartalommal kerulne a kotegbe, vagyis a backfill pont azt veszitene el, amiert letezik.
- ⛔ A csatolmany-linkek **NEM kerulnek a koteg-fajlba**: alairtak es lejarnak.
- ⚠️ A biztonsagi hatar valtozatlan: a hang **nem keruli meg** a kuldo-/csatorna-ellenorzest.

### Kommunikációs csatorna — CCAP-híd, hangszórós kapu, tick

- **Ki vagyok a CCAP-ban:** `ma ccap whoami --pretty` — a `CLAUDE_CODE_SESSION_ID`-t párosítja a
  CCAP `/api/cc-session` rekordjával, és visszaadja a CC session-t + a CCAP instance-t. **Nincs
  beégetett azonosító**: a `ccs-…` indításonként változhat, ezért mindig futásidőben oldjuk fel.
- **Foglalt vagyok-e:** `ma ccap runtime --pretty` — `isBusyProcessing`, a CCAP sorának hossza,
  zárolás. A Discord-kötegelő ebből dönt.
- **Csatorna-diagnosztika:** `ma comm doctor` — tételes lista arról, mi él, mi hiányzik, és
  **mi a teendő**. Alapból ember-olvasható, `--json` gépi. Hibás/részleges állapotnál nem-nulla
  kilépési kód. ⚠️ Az `unknown` KÜLÖN állapot: ami nem mérhető, az sosem „rendben".
- 🔴 **A figyelő GAZDÁJA a SZERVER** (owner, 2026-09-06): a `my-assistant` szerver indítja,
  felügyeli és **újraindítja** (`server/src/_services/discord-listener.service.ts`). Normál
  üzemben tehát **nem kell külön indítani semmit** — elég, hogy a szerver fut (LDP alatt
  folyamatosan). A felügyelő a gyermek **utolsó kimeneti sorait** a hiba-bejegyzésbe teszi, és
  friss idegen életjel esetén **nem indít másodikat**.
- **Discord-figyelő kézi indítása:** `ma comm listen` — **hosszan futó** parancs, a kapcsolat addig
  él, amíg fut (Ctrl+C állítja le). Csak az **owner** üzeneteit fogadja el, csak a **dedikált
  csatornából**; a saját botunk üzeneteit kiszűri (visszhang-hurok ellen). ⛔ Közvetlenül SEMMIT
  nem küld a CC sessionbe — csak a **kötegbe tesz**, a bejuttatás a CCAP `prompt` végpontján megy.
  Hiányzó token/azonosító esetén **tisztán, teendővel** bukik el, nem verem-nyommal.
- ⭐ **A kiküldés AUTOMATIKUS** (2026-09-06): a figyelő **15 mp-enként** megnézi, kiküldhető-e a
  köteg. 🔴 **Mért hiány, ez javította:** eddig a figyelő CSAK gyűjtött, a kiküldéshez **kézzel**
  kellett `ma comm flush`-t futtatni — így az owner üzenete a köteg-fájlban állt, és kívülről
  pontosan úgy nézett ki, mintha meg sem érkezett volna.
- 🔴 **Honnan tudod, hogy a figyelő ÉL:** 60 mp-enként **életjelet** ír; a `ma comm doctor`
  a jel **frissességét** nézi. Elhallgatott jel → `broken` + *„a Discordon írt üzeneteid NEM
  jutnak el hozzám"*. (A jelenlét-figyelő 112 napig volt halott, mert nem volt ilyen jel.)
- **Discord-köteg kézi kiküldése:** `ma comm flush [--force]`. Normál üzemben **nem kell** — a
  figyelő magától küld; ez a diagnosztikai/kényszerített út. A köteg **csak igazolt átadás után** ürül.
- **Kimenő üzenet:** ⭐ **`ma comm say --file <út>`** — EZ AZ AJÁNLOTT ÚT. A szöveg fájlból jön, tehát a shell/burkoló **nem tudja elvágni**. 🔴 **Mért ok (2026-09-07):** Windowson az `npx`/`cmd` burkoló a többsoros `--text` argumentumot **az első újsornál levágta**, és a rendszer minden szintje sikert jelentett rá — a napi kommunikáció ~90%-a így veszett el.
  ⭐ **Küldés után VISSZAOLVAS** és hosszt hasonlít: `verifiedIntact` + `verifyDetail`. ⚠️ `verifiedIntact: false` esetén a `sent: true` **NEM siker**.
- Rövid, egysoros üzenethez marad a `--text`. A 2000 karakteres korlát fölött **sorhatáron** darabol, és rögzíti a kimenő naplót (ebből dönt a válasz-kötelezettség és a „gépel…” jelzés).
  rögzíti a kimenő naplóba. Erre épül a **válasz-kötelezettség** ellenőrzése: ha az utolsó
  bejuttatott bejövő üzenet ÚJABB, mint az utolsó kimenő válasz, a `ma comm doctor` `degraded`-et
  jelez — mert a leggyakoribb csendes hiba az, hogy csak a sessionben válaszolok.
- ⌨️ **„gépel…" visszajelzés** (owner-kérés, 2026-09-06): amíg van várakozó üzenet **vagy**
  válasz-tartozás, a bot **7 mp-enként** frissíti a Discord gépelés-jelzést (a Discordé ~10 mp
  után lejár). **15 perc** után magától leáll — az örökké gépelő bot félrevezetőbb, mint a néma.
- **Státusz-kivonat:** `ma status digest` — elmúlt / egy órán belül / ma / dátum nélküli magas
  prioritású. ⚠️ Az `fo tasks.list` **alapból csak 10 tételt** ad (`totalCount` 131!), ezért a
  kivonat **végiglapoz**; forrás-hiba esetén `HIÁNYOS` fejléc + nem-nulla kilépési kód.
- **Tick száraz futása:** `ma tick plan` — megmutatja, mit tenne most (Daytime/Nighttime ág,
  csatorna, érintett tételek). **Nem küld semmit.** Minden döntést naplóz, a csendeset is.
- 🔴 **Hangszórós kapu:** a `ma cast notify` mostantól **csak ÉBREN + ITTHON** állapotban szólal
  meg (ITTHON = használja a gépét; ÉBREN = itthon-jel VAGY Discord-válasz +1 óra). **Ismeretlen
  jel ⇒ tilt.** Kézi felülbíráláshoz `--force` — mindig naplózódik.
- ⭐ **A jelenlét-figyelőt is a SZERVER indítja** (2026-09-06): a `PresenceMonitor_Service` a
  `server/activity-monitor/logger.ps1`-et futtatja felügyelten. Tehát **nincs külön teendő** —
  ha fut az LDP (és alatta a szerver), a kapu adata is gyűlik.
  🔴 **Miért:** ez a figyelő **112 napig volt halott**, mert ütemezett feladaton múlt, amit
  senki nem ellenőrzött.
- **Tartalék** (ha a szerver NEM fut): `pwsh -File scripts/install-autostart.ps1 -Mode apply` —
  egy szkript, mindkét szolgáltatás, AtLogon indul, hiba esetén újraindul; módosítás nélküli
  ellenőrzés: `-Mode check`, eltávolítás: `-Mode remove`. A szerver felismeri, ha az ütemezett
  feladat már fut, és **nem indít másodikat**.
- **Buktatók (mértek):** a Windows PowerShell 5.1 **ANSI-ként** olvassa a `.ps1`-et → ékezetes
  szöveg töri a parse-t, ezért **UTF-8 BOM** kell · a `Join-Path` 3-argumentumos alakja csak PS7+.
- Terv: `__agent/plans/discord-two-way-hyperplan/` · szabályok:
  `__agent/flows/recurring/hourly-assistant-tick/README.md` · beállítás:
  `__documentations/dev/DISCORD_BOT_SETUP.md`.

### 🎙️ `ma stt` — hangüzenet ↔ transzkript nyilvántartás (T-68)

```bash
  ma stt pending                  # a FELOLDATLANOK munkalistája — megvan-e még a hang?
  ma stt transcript <messageId>   # mi hangzott el benne — vagy MIÉRT nem tudjuk
  ma stt retry <messageId>        # 🔁 VISSZAMENŐLEGES feloldás a megőrzött hangból
```

**Miért létezik** *(owner, 2026-09-08 15:31)*: *„a rendszernek rögzítenie kéne, hogy melyik
üzenetekhez melyik transzkript tartozik, illetve melyik üzeneteknek nem sikerült a transzkript,
és ilyenkor ezeket majd **visszamenőlegesen is fel kell tudjad oldani**."*

🔴 **A mért blokkoló, ami ezt lehetetlenné tette:** a `SttRetryQueue.remove()` a feladáskor a
**hangot is törölte** ⇒ mire kérnéd, már **nincs mit** újrapróbálni. Most a sor a feladás
**pillanatában** átadja a hangot a nyilvántartásnak *(`onGiveUp` horog)*.

| Állapot | Mit őrzünk |
|---|---|
| ✅ `resolved` | a **szöveget** *(a siker is bekerül — a párosítás önmagában érték)* |
| 🔴 `failed` | a **hangot** + az okot + a próbaszámot ⇒ **újrapróbálható** |

⭐ **A `retry` a kötegbe is beteszi** a késve feloldott szöveget — különben megvolna, de nem
jutna el az asszisztenshez.

⚠️ **A `messageId` a válasz-referenciából jön:** ha az owner egy üzenetre **válaszol**, a
`referencedMessageId` végigmegy a láncon *(Discord → figyelő → köteg)*, és azzal hívható a
`transcript` / `retry`.

📌 Tárolás: `~/.config/my-assistant/stt-ledger/` — ⛔ nem a repóban *(nyers felhasználói tartalom)*.

### 🎤 BULI-ZAJ szűrés — a nyitott mikrofon (2026-09-12)

🔴 **MÉRT PROBLÉMA:** a nyitott mikrofon **EGY este alatt 722 érzékelést / 259 felvételt**
termelt *(normál nap: 123/9)*, és ebből **16** volt valódi input. A gép is megérezte: a
`comm doctor` 120 s fölé nyúlt, a memória 100,5/127 GB-on állt. ⇒ **Kapacitás-probléma.**

⭐ **A SZABÁLY — a mért, labelled korpuszból:**

```
ZAJ  =  NEM magyar   ÉS   (≤ 30 karakter  VAGY  ≤ 6 szó)
```

| Jel | Mért alap |
|---|---|
| **magyar-jel** *(magyar betű VAGY gyakori magyar szó)* | zaj **0/21** · valódi **15/15** ⇒ hibátlanul szétvág |
| **≤ 30 karakter / ≤ 6 szó** | a valódi **minimum 33 karakter / 7 szó** volt ⇒ a küszöb alatta |

⛔ **A HOSSZÚ, nem magyar szöveget NEM szűri** — az owner kikötése: *„használ angol
szakszavakat, és egy hosszabb angol mondat lehet valódi."*
⭐ A magyar-jel a **rövid** magyar válaszokat *(„Igen, csináld.")* is megvédi.

📊 **Visszamérve 427 mintán** *(3 korpusz, több nap)*: **0** magyar szöveg esett a zaj-ágba.

🔇 **A ZAJRA CSEND:** ⛔ nincs hangjelzés és ⛔ nincs kiesés-jelentés *(243 jelentés maga lenne
a zaj)*. ⭐ A tölcsérben viszont **külön sorban** látszik, és **kimarad az átviteli arány
nevezőjéből** *(nem az owner megszólalási kísérlete)*:

```
🎤  buli-zaj (megszűrve) ......... 12
🔴 NYITOTT MIKROFON GYANÚJA: 84 zaj-tétel 10 perc alatt (küszöb: 12, mért normál csúcs: 4)
```

⚠️ A **12 / 10 perc** küszöb is mért: a normál ablakok csúcsa **4**, a bulié **42-84** — a
küszöb a köztes üres sávban van. ⛔ A hangos figyelmeztetést az **asszisztens** küldi, a
rendszer csak a **szignált** adja.

📌 A teljes mérés + ami szándékosan kimaradt: `__documentations/dev/VOICE_NOISE_FILTER.md`.

### 😴 Az ÉBRENLÉT-DÖNTÉS — mérésből, ⛔ nem órarendből (2026-09-12)

🔴 **MÉRT PROBLÉMA:** a `/api/sleep-state` **fix órarendből** tippelt *(`02:00-10:00 = alvás`)*.
A teljes jelenlét-adaton *(5 698 perc-minta, 8 nap)* megmérve a tipp **35-44%-ban ELTÉR** a
mérhető valóságtól — gyakorlatilag **érme-feldobás**. Ok: a **csúszó, ~26 órás** alvás-ciklus.

⭐ **MOST:** `ébren? = friss aktivitás-minta VAGY friss Discord-válasz (+1 óra)`.
⛔ **Nem új implementáció:** a jelenlét-olvasó és az owner-szabály **már megvolt** — a döntés
**egy helyre** került, és a **hangszóró-kapu** meg a **szerver** is **azt** használja.

| Ág | `isAwake` | Következmény |
|---|---|---|
| ⭐ ébren *(aktív mérés vagy Discord ≤1 óra)* | `true` | megszólalhat *(ha itthon is van)* |
| 😴 alszik *(friss mérés, régóta tétlen)* | `false` | néma |
| 🔴 **nincs adat** | `false` | **néma** |

> ⚠️ **BIZONYTALANSÁGNÁL AZ „ALSZIK" ÁG NYER** — a téves csend olcsó, a téves hangos nem.
> Az `unknown` ⛔ nem „valószínűleg ébren", és ez **be van építve** az `isAwake` mezőbe.

⭐ **A döntés INDOKLÁSSAL jön** *(melyik jel, milyen friss)*, ⛔ nem puszta logikai érték —
a `comm doctor` ebből írja a sorát:

```
ma comm doctor      →  ⭐ „Ébrenlét-döntés forrása: Mérésből: ÉBREN — a gépét használja…"
                       🟡 ha a figyelő nem fut: „a mérés NEM olvasható ⇒ a biztonságos ág"
```

📌 A teljes mérés + a handoff két példájának korrekciója: `__documentations/dev/AWAKE_DECISION.md`.

### ✍️ LinkedIn POSZT-piszkozat panel — `/linkedin/posts` (2026-09-11)

**Egy lista a megírt poszt-piszkozatokról + posztonként egy másolható szövegdoboz.**
⭐ A profil-panel receptje: a LinkedIn API **csak olvas** ⇒ a cél a **súrlódás-mentes átvitel**,
⛔ nem az automatizálás.

| Amit ad | |
|---|---|
| posztonként **másolható** szöveg | ⭐ egy gomb = egy poszt, ⛔ nem egy nagy blob |
| karakterszám **/ 3 000** + túllógás-jelzés | ⭐ a **beillesztés ELŐTT** derül ki |
| **„kiposztoltam" pipa** | ha félbeszakad, tudja, hol tartott |
| az **indoklás** *(„miért így szól")* | a döntéshez a **miért** kell, nem csak a szöveg |

📂 **A piszkozatok helye — két fájl piszkozatonként:**

```
current/linkedin/post-drafts/<ÉÉÉÉ-HH-NN-cím>.body.txt   ← EZ megy ki (a poszt szövege)
current/linkedin/post-drafts/<ÉÉÉÉ-HH-NN-cím>.md         ← az indoklás (nem kötelező)
```

⚠️ **⛔ NEM a `current/linkedin/drafts/`** — az **üzenet-válaszokat** tartalmaz *(thread-hez
kötve, óradíjjal és telefonszámmal)*, és azok az owner sorrendjében a **harmadik** tétel.

🔴 **A poszt szövegét a rendszer ⛔ nem generálja és nem módosítja** — a tartalmi szabályok:
`current/principles/linkedin-post-writing.md`.

⭐ **Üres állapotban is beszél:** *„Még nincs poszt-piszkozat"* + **hova** kell írni a fájlt.

📌 Részletek + a mért korrekció a piszkozat-helyről: `__documentations/dev/LINKEDIN_POST_DRAFTS.md`.

### 🎙️ A HOSSZÚ hangüzenet — darabolva ismerjük fel (2026-09-11)

🔴 **MÉRT KORLÁT:** az FDP AI felismerő **30,0 másodpercnél** befagy — a 56,9 mp-es felvételből
**295** karaktert adott, a felezettjéből **627**-et. ⇒ A hosszabb üzenetek **vége levágódott**,
és ez a mérésben **nem is látszott**: a csonka átirat ✅ **sikerként** számolt.

⭐ **Most:** a 30 mp-nél hosszabb hangot **≤28 mp-es darabokra** bontjuk *(csendnél vágva)*, és
az átiratokat összefűzzük. Élesben igazolva: **295 → 641** és **299 → 445** karakter.

⛔ **Az FDP AI szolgáltatáshoz NEM nyúltunk** *(`fdp-ai-never-restart`)* — a darabolás
teljesen a mi oldalunkon van.

🔴 **A JELÖLÉS KIMONDJA** *(⛔ néma darabolás nincs)*:

```
🎙️ gépi átirat · 🧩 3 részletben ismerve (30 mp-es ablak)
🎙️ gépi átirat · 🔴 1 részlet felismerése ELBUKOTT — a szöveg HIÁNYOS
🎙️ gépi átirat · ⚠️ 1 vágás beszéd közben esett — ott szó csúszhatott el
```

📊 **A tölcsér-jelentésben új sor:** `🧩 darabolva ismerve (>30 mp)` — ⚠️ **az átviteli arány
ettől NEM javul**, mert a csonkolás soha nem is szerepelt benne; ez a sor mutatja, hogy a
mechanizmus dolgozik.

📌 A teljes mérés, a kizárt gyanúk és a mért állandók: `__documentations/dev/VOICE_LONG_AUDIO.md`.

### 🗓️ `ma calendar` — a nap eseményei (munkanaptár, 2026-09-11)

```bash
  ma calendar today                     # a mai nap: kezdés, vége, cím, helyszín/link, résztvevők
  ma calendar today --day 2026-09-12    # más nap — HELYI időben értelmezve
  ma calendar today --json --pretty     # gépi kimenet
```

**Miért létezik** *(owner, 2026-09-11 12:19)*: *„a **munkanaptár** előre kerül."* 🔴 A mért ok:
a 11:00-as mítingről a rendszer **csak azt tudta, hogy van** — kivel, miről, hol: semmi. Az
ébresztés lefutott, a **felkészítés** nem.

⭐ **NEM zöldmezős:** a Google OAuth desktop-flow **már él** *(Gmail)*, ezért ez `+1 scope`
*(`calendar.readonly`)* + vékony kliens + **egy** parancs volt.

🔴 **A HIÁNYZÓ ENGEDÉLY KIMONDOTT HIBA, ⛔ nem üres lista** — *„az üres naptár és a
nincs-jogosultság kívülről ugyanúgy néz ki."* Kódok: `MA-CALENDAR-AUTH-REQUIRED` ·
`MA-CALENDAR-SCOPE-MISSING` · `MA-CALENDAR-READ-FAILED`. A **teendő a hibaüzenetben** van.
⇒ Az üres nap is mondatot kap: *„a naptár OLVASHATÓ volt, és a napon NINCS esemény."*

⚠️ **BUKTATÓ 1 — a fiók neve `default`, ⛔ NEM `primary`.** Élő proba: `primary`-vel
`MA-EMAIL-CONFIG-MISSING`. A névütközés csapdája: a Google-oldalon a **naptár** azonosítója
`primary` — az más dolog.

⚠️ **BUKTATÓ 2 — a scope bővítése a MEGLÉVŐ tokennek NEM ad jogot.**
🙋 **Owner-kapus lépés:** `ma email auth --account default` *(böngésző + kattintó jóváhagyás)*.
Addig a parancs **helyesen** `MA-CALENDAR-SCOPE-MISSING`-et ad.

⭐ **Forrás-független:** a szerződés **egy fájl**
*(`cli/src/calendar/calendar-reader.contract.ts`)*; Microsoft/`.ics`-olvasónál a parancs
felülete és a kimenet alakja **változatlan**.

📌 Részletek + a teljes mérés: `__documentations/dev/WORK_CALENDAR.md`.

## ⚠️ MÉRT CSAPDA — a `/tmp` NEM ugyanaz bashben és a Windows-Pythonban (2026-09-11)

Git Bash `/tmp` ≠ a Python által látott `/tmp`. Ha a cwd az `E:` meghajtón van, a Windows-Python
a `/tmp/x.txt`-t **`E:\tmp\x.txt`**-ként oldja fel *(drive-relatív gyökér)* — ott pedig **régi,
azonos nevű fájl** lehet.

🔴 **Mért következmény:** egy bash-heredokkal írt `/tmp/row.txt`-et a Python **egy korábbi
session hagyatékaként** olvasott be, és **rossz sort szúrt be** a `CLAUDE.md`-be — hibaüzenet
nélkül. Két kör ment el rá, mire kiderült.

**Recept:**
- ⛔ Ne adj át adatot bash → Python között `/tmp`-n keresztül.
- ✅ **Ágyazd be az adatot magába a szkriptbe** *(a `.py` forrás UTF-8-ként olvasódik)*, vagy
  használj **abszolút Windows-utat**.
- ✅ **Írás után OLVASD VISSZA** ugyanabban a futásban, és **írasd ki az eredményt** —
  a „nem dobott hibát" ⛔ nem bizonyíték.
