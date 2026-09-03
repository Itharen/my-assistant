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

### LinkedIn personal inbox

- Kanonikus agent-semleges CLI: `ma linkedin`; MCP, browser extension és Computer Use nem szükséges és nincs fallback.
- Hivatalos, read-only LinkedIn Member Data Portability API: snapshot bootstrap + incremental changelog sync.
- Runbook: `__documentations/dev/LINKEDIN_INBOX_CLI.md`; terv: `__agent/plans/linkedin-integration-hyperplan/`.
- Titok kizárólag FDP Keystore-ban; a lokális config csak project/branch/environment/key hivatkozást tárol.
- Alap állapotgyökér: `%USERPROFILE%/.config/my-assistant/linkedin/`; nem repo és nem Source of Truth.
- Első diagnosztika: `ma linkedin auth status --pretty`, majd `ma linkedin doctor --pretty`.
- Teljes bootstrap: `ma linkedin inbox bootstrap --pretty`; biztonságos próba: `--dry-run`.
- Normál frissítés: `ma linkedin inbox sync --pretty`; a changelog 28 napos, ezért rendszeres sync kötelező.
- Lapozás: listázáskor `nextOffset` minden oldalát követni kell `null`-ig.
- `unread` a live kalibrációig csak candidate; `needs-reply` determinisztikusan a legutolsó üzenet irányából jön.
- `thread show` és `reply show` explicit content-revealing művelet; listák nem adnak vissza message/draft body-t.
- Nincs send parancs: a reply draft lokális, LinkedIn-küldést soha nem szabad állítani official write receipt nélkül.
- Törlés: draft/cache csak explicit `--confirm`; a config cache purge mellett megmarad.
- Globális telepítés ezen a gépen: a tartós `PNPM_HOME=E:\pnpm\bin` hibásan `bin\bin`-t képez, ezért a javított
  értéket csak a telepítő processzre add: `$env:PNPM_HOME='E:\pnpm'; pnpm add --global '<repo>\cli'`.

### Interfood menu intelligence

- Kanonikus agent-semleges CLI: `ma interfood`; a publikus heti menühöz nem kell MCP, browser vagy login.
- Runbook: `__documentations/dev/INTERFOOD_CLI.md`; terv: `__agent/plans/interfood-integration-hyperplan/`.
- Rendelhető hetek: `ma interfood weeks --pretty`.
- Egy hét: `ma interfood menu --pretty`, vagy explicit `--year <YYYY> --week <1..53>`.
- Aktuális + következő két hét: `ma interfood menu-range --weeks 3 --pretty`.
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
- Történeti jelöltek: `ma interfood orders patterns --minimum-units 2 --limit 30 --pretty`; a
  `--double-orders-only` csak azokat mutatja, amelyekből legalább egy napon összesen kettő vagy több adag volt.
  Ez megfigyelt bizonyíték, nem explicit preferencia; csak owner-megerősítés után használd a `preference set`-et.
- Opcionális leves/desszert feltárás: `ma interfood orders patterns --add-ons-only --minimum-units 1 --limit 30
  --pretty`. A `plan week` napi `addOns` kimenete külön kezeli őket: nem számítanak bele a napi 2 főételbe. Exact
  identity legalább 5 korábbi rendelési napon csak `favoriteCandidates` megerősítési jelölt; recommendation kizárólag
  explicit owner-confirmed exact-food `favorite` lehet, és csak az jogosíthat későbbi kosárjavaslatra.
- Explicit preferencia: `preference set|compare|portion|list`; az SSOT `current/interfood/preferences.json`.
  Általános névminta: `preference set --scope food-name-pattern`; adagválasztás:
  `preference portion --pattern <névrészlet> --prefer small|full [--except-pattern <névrészlet>]`.
  A planner csak tényleges `small|full` occurrence-re alkalmazza; `unspecified` adagot nem talál ki.
  `preference set` mellett ismételhető `--except-pattern`: a teljes normalizált ételszövegben talált kivétel
  kikapcsolja az adott szabályt (például hal dislike, kivéve halrud; marha/sertés dislike, kivéve darált).
- Teljes kívánt kosárhoz először `cart diff --items-file ...`, majd jóváhagyott összeállításnál
  `cart reconcile --items-file ...`; a fájlban nem szereplő meglévő sorokat a reconcile eltávolítja.
- Azonosítás és terv: `foods identify|list`, `plan week`, `nutrition compare`.
- Ha az owner külön hét/időtartomány nélkül kér Interfood-ajánlást, először `weeks`, majd minden nem disabled,
  current/future hétre `orders coverage` + `plan week`; az összes lefedetlen napot egy batch-ben mutasd. A teljesen
  lefedett napokat ne rendeld újra, csak jelezd a kihagyásukat.
- A napi alapértelmezett igény 2 adag: `plan week --meals-per-day 2`, illetve
  `orders coverage --expected-per-day 2`. A recommendation sorok `quantity` összege számít, nem a sorszám.
  Normálisan két külön food identity kell; small+full ugyanabból nem két étel. Explicit `favorite` exact sorból
  `quantity=2` csak akkor lehet, ha az exact ételt már rendelték legalább egyszer; ismeretlen/kísérleti étel soha
  nem 2×. Két külön identitynél is előbb eltérő elsődleges ételcsaládot válassz.
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
- Fix jelölések: ⭐ kedvenc, 🥗 egészségesebbnek szánt/tekintett választás, ⚠️ figyelmeztetés a konkrét okkal.
  Korrekció után mindig a TELJES többhetes ajánlás jön újra a chatben, nem csak módosult sorok vagy fájllink.
- A compact candidate `dietaryWarnings` mezőjét mindig kiemelten jelenítsd meg. Kizárólag tej/tejszín allergiajel
  minden biztonságos étel mögé sorol és health lane-ből kizár; ha jobb jelölt híján mégis bekerül, a warning maradjon
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
