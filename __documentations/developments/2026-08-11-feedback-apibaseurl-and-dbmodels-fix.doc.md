# Feedback-rendszer: `apiBaseUrl` defekt + hiányzó `account` DB-model regisztráció

- **Dátum:** 2026-08-11
- **Scope:** `client/src/app/app.module.ts`, `server/src/app.server.ts`, `server/src/_collections/` (új), bedrock dep-bump
- **Bug-osztály:** BFR-ADVENTOR-012 (`apiBaseUrl`) + `DyNTS-DS0-C00` (dependency-regisztráció)
- **Kiváltó ok:** a B-F4 bedrock-review során derült ki, hogy a `provideFdpnxFeedbackFabPlugin()`
  **4** flotta-fogyasztója közül **3** még mindig explicit `apiBaseUrl: ''`-t ad át. A my-assistant
  a BFR-012 eredeti flotta-listáján **nem szerepelt** — ez a doksi ezt a rést zárja.

---

## 1. Mit mértünk (a fix ELŐTTI állapot)

| Mit | Mért érték | Forrás |
|---|---|---|
| Kliens `apiBaseUrl` | `''` (üres string) | `client/src/app/app.module.ts:48` **@HEAD (fix előtt)** |
| `environments/` mappa | **NINCS** | `client/src` bejárás |
| Szerver API base | `/api` | `server/src/app.server.ts:97` (`getApiBasePath()`) — fix utáni sorszám |
| Feedback route mount | `/feedback` → `Feedback_Controller` | `app.server.ts:133–134` — fix utáni sorszám |
| `FDP_account_dataParams` regisztrálva | **NEM** | `app.server.ts` `dbModels` lista |
| `FDP_feedback` / `FDP_feedbackVote` regisztrálva | igen | ugyanott |
| Szerver bedrock (deklarált) | nts-fdp-templates **1.15.28**, nts-dynamo 1.15.74, fsm 1.15.9, fdp-templates 1.15.24 | `server/package.json` |
| Kliens bedrock (deklarált) | ngx-fdp-templates **18.15.15**, ngx-dynamo 18.15.9, fsm 1.15.9, fdp-templates 1.15.24 | `client/package.json` |
| `overrides:` csapda | **nincs** — mindkét workspace `@futdevpro/*` wildcardot használ | `package.json` |

> ⚠️ **„Ne másolj vakon!"** — az adventor-fix `environment.api.baseUrl`-t állít át. Ez a projekt
> **nem használ `environments/` mappát**, tehát az a minta itt **nem alkalmazható**. A prototyper-nél
> és a master-prompternél ugyanez az érték `'MISSING'` scaffold-placeholder volt; a vak másolás ott
> `MISSING/feedback/...` URL-t eredményezett volna.

---

## 2. A két defekt — és miért fedte el egymást

### 2.a Kliens: `apiBaseUrl: ''`

A `DyNX_ApiService` **konkatenál** (`url = baseUrl + endpoint`), tehát üres base mellett a hívás a
`/feedback/...` útra megy. A szerver SPA-catch-all-ja csak az `/api` + `/auth-api` prefixet zárja ki
→ a válasz **200 + `text/html`** → JSON-parse hiba → **néma** üres panel.

### 2.b Szerver: hiányzó `FDP_account_dataParams`

A `feedback` és a `feedbackVote` model `accountId` mezője `dependencyDataName: 'account'`-ot deklarál.
A teljes bukás-lánc a **telepített** artefaktumokban kimérve (nem feltételezés):

1. `feedback.accountId → "account"` és `feedbackVote.accountId → "account"` — igazolva a kontroll-méréssel (lásd §4).
2. Az `account` **nem** volt a `dbModels`-ben; a framework csak az `archiveModel`-t fűzi hozzá
   (`nts-dynamo/build/_services/core/global.service.js:91`), az `nts-fdp-templates` **semmit** —
   tehát a regisztrációs készlet pontosan az app listája volt.
3. `DyNTS_DataService.lookForDependencyDataSettings()` **`depSettings.length === 1`** esetén **mohón**
   feloldja a függőséget a konstruktorban (`base/data.service.js:1856–1867`) — a feedback-nek pontosan
   1 ilyen mezője van, tehát ez az ág fut.
4. `DyNTS_GlobalService.getDBServiceByKey('account')` hiányzó kulcsra **`throw`**-ol
   (`core/global.service.js:281–293`).
5. A dobás a data-service konstruktorának `try`-jában landol → **`DyNTS-DS0-C00`**, `level: critical`
   (`base/data.service.js:104–115`).

**Következmény:** a feedback data-service **fel sem épül** → a `/api/feedback/*` endpointok buknak —
miközben a `tsc`, a build és az összes többi teszt **zöld marad**.

### 2.c A maszkolás

A 2.b **csak azért nem látszott**, mert a 2.a miatt a kérések a szerverig **el sem jutottak**.
Ha csak a klienst javítottuk volna, a fix „elrontotta" volna a rendszert: az üres panel helyett
500-as hibát kaptunk volna. **Ezért kellett a kettőnek együtt mennie.**

---

## 3. A javítás

### 3.a Kliens — a mező **elhagyása** (nem `'/api'`-ra állítása)

```ts
provideFdpnxFeedbackFabPlugin({
  defaultProjectId: 'my-assistant',
})
```

Miért az elhagyás a legrobusztusabb (master-prompter-minta): a bedrock defaultja **`/api`**, így egy
későbbi flotta-szintű változás automatikusan ideér. A lánc a **telepített 18.15.74** ellen igazolva:

- `provideFdpnxFeedbackFabPlugin(config)` → `useValue: config` — **verbatim**, nem injektál defaultot;
- `get baseUrl()` → `configured === undefined` → **`return '/api'`**.

Az explicit `''` NEM ér célt: a `??`/`undefined`-ág nem lép be (a bedrock ilyenkor egyszeri warningot ír).

### 3.b Szerver — SSOT `dbModels` collection + a hiányzó `account`

Új fájl: `server/src/_collections/db-models.collection.ts` (minta: `adventor/server/src/_collections/`).
Az `app.server.ts` innen regisztrál, hogy a lista ne driftelhessen szét a guard-specektől.

**Import-kiterjesztés (szándékos eltérés a szomszédoktól):** a collection relatív importjai `.js`-esek,
míg a többi szerver-fájl extensionless. Indok — mérve: a szerver `tsx`-szel, **közvetlenül a TS-forrásból**
fut (`node ../node_modules/tsx/dist/cli.mjs ./src/index.ts`), ott az extensionless is feloldódik; a specek
viszont a `build/`-ból, **plain Node ESM** alatt (`"type": "module"`), ahol a kiterjesztés kötelező.
A modult mindkettő behúzza, ezért a `.js` az egyetlen közös metszet. A tranzitív ripple **1 fájl** (a lánc
további 3 fájlja levél — nincs relatív importja). Ugyanez a minta: `sleep-state.service.spec.ts`.

### 3.c Regressziós háló — `db-models.collection.spec.ts`

5 guard, **vacuity-guarddal** (üres listán minden állítás triviálisan átmenne):

| Guard | Mit fog meg | Forrás |
|---|---|---|
| lista nem üres (`> 3`) | a spec elvakulása | saját (az adventor-guardból hiányzik) |
| minden `dependencyDataName` regisztrálva | **a `DyNTS-DS0-C00` bug-osztály** | adventor-minta |
| `dataName`-ek egyediek | a `createDBService` first-wins néma skip-je | adventor-minta |
| minden elemnek van nem-üres `dataName`-je | hibás/üres model-params | adventor-minta |
| feedback-domain teljes (feedback + feedbackVote + account) | célzott regresszió | saját |

**Pattern-forrás:** `adventor/server/src/_collections/db-models.collection.spec.ts` (3 guard) —
ellenőrizve és átvéve; a listánk annak **szuperhalmaza**.

### 3.d Dep-bump

| Csomag | Szerver | Kliens |
|---|---|---|
| `fdp-templates` | 1.15.24 → **1.15.106** | 1.15.24 → **1.15.106** |
| `fsm-dynamo` | 1.15.9 → **1.16.35** | 1.15.9 → **1.16.35** |
| `nts-dynamo` | 1.15.74 → **1.15.133** | — |
| `nts-fdp-templates` | 1.15.28 → **1.15.114** | — |
| `ngx-dynamo` | — | 18.15.9 → **18.17.65** |
| `ngx-fdp-templates` | — | 18.15.15 → **18.15.74** |

A briefben csak 2 bump szerepelt; a peer-követelmények miatt **oldalanként 4** kellett.
A **telepített** (nem csak deklarált) verziók visszaellenőrizve.

---

## 4. Kontroll-mérés (kötelező — a guard nem-vakságának bizonyítéka)

Ideiglenesen kivéve az `FDP_account_dataParams` a listából → `npx jasmine`:

```
1) MINDEN deklaralt `dependencyDataName` regisztralva van (DyNTS-DS0-C00 bug-osztaly)
   Expected $.length = 2 to equal 0.
   Unexpected $[0] = 'feedback.accountId → "account"' in array.
   Unexpected $[1] = 'feedbackVote.accountId → "account"' in array.
2) a feedback-domain teljes: ...
   Expected [ 'wave', 'insight', 'capture', 'fdp_errors', 'feedback', 'feedbackVote' ] to contain 'account'.

15 specs, 2 failures
```

A `[wave, insight, capture, fdp_errors, feedback, feedbackVote]` lista **bitre a fix előtti állapot** —
tehát a defekt **mérve**, nem következtetve. Visszaállítás után: **15 spec, 0 hiba.**

> A kontroll-mérés a **végleges** spec-készlettel (5 guard) futott újra, nem egy korábbi köztes
> állapottal — így az idézett kimenet a ténylegesen commitolt kódot tükrözi.

---

## 5. Verifikáció

| Ellenőrzés | Eredmény |
|---|---|
| `npx tsc --noEmit` (szerver) | ✅ EXIT 0 |
| `pnpm run build-base` (szerver) | ✅ EXIT 0 |
| `npx jasmine` (szerver) | ✅ **15 spec, 0 hiba** (10 meglévő + 5 új) |
| `pnpm i` (kliens) | ✅ EXIT 0 |
| `npx ng build --configuration production` | ✅ EXIT 0 |
| `ng test --watch=false --browsers=ChromeHeadless` | ✅ **126/126 SUCCESS** |
| Telepített verziók | ✅ 1.15.106 / 01.16.35 / 18.17.65 / 18.15.74 |
| Bedrock `/api` default a telepített bundle-ben | ✅ kimérve |
| Kontroll-mérés | ✅ a guard bukik a fix nélkül |

### ⚠️ `unverified` — élesben nem igazolt

- **A `/api/feedback/*` endpointok élő 200-as válasza.** A szervert nem bootoltuk fel Mongo ellen, és
  élő HTTP-hívás nem történt. A bukás-lánc **statikusan végig kimérve** (§2.b), de a javítás utáni
  **élő** helyes működés ebben a session-ben **nem verifikált**.
- **A feedback-panel böngészőben.** Vizuális/e2e ellenőrzés nem futott.

Mindkettő a következő élő indításkor ellenőrizendő.

### ⚠️ A regressziós háló **NEM fut CI-ben**

A projektben **nincs CI**: se `pipeline.cicd.config.json`, se `.github/workflows/` (mérve, 2026-08-11).
A `db-models.collection.spec.ts` tehát **csak lokálisan** fut (`npx jasmine`) — a guard valós védelmet
csak akkor ad, ha valaki futtatja. Ez **nem** ennek a lane-nek a scope-ja (a CI bevezetése önálló
döntés), de a háló értékének korrekt megítéléséhez tudni kell. Amíg nincs CI, a szerver-spec
futtatása a commit előtti kézi lépés része.

### Megjegyzés az `account` kollekcióról

A my-assistant auth-ja **token-alapú** (`Auth_ControlService extends FDPNTS_Auth_ServiceBase`, JWT
validáció + accountId-kinyerés); a szerveren **semmi más nem hivatkozik** az `account` modellre
(mérve). Az `FDP_account_dataParams` felvétele tehát tisztán **additív**: a data-service létrejöttéhez
kell, nem meglévő viselkedést módosít. Ugyanez a minta fut élesben az adventorban.
Az account-kollekció **tartalmi** feltöltöttsége (a feedback-listák szerző-adatai) élesben
**nem verifikált**.

---

## 5.b Melléklelet — duplikált `fsm-dynamo` példány (NEM javítva, scope-on kívül)

A lock-diff átnézésekor kiderült, hogy a kliensen **két `fsm-dynamo` példány** van fizikailag telepítve:

```
node_modules/.pnpm/@futdevpro+fsm-dynamo@1.15.8_...
node_modules/.pnpm/@futdevpro+fsm-dynamo@1.16._5a58e7facc6cdd76ebace8248dd4642a
```

**Ok (mérve):** a `@futdevpro/ngx-dynamo-models@1.15.8` **kemény peer-pinje**
(`'@futdevpro/fsm-dynamo': 1.15.8`) egy második másolatot kényszerít ki. A csomag maga
**deprecated** — a saját npm-metaadata mondja: *„Moved to `@futdevpro/fsm-dynamo/ngx-models`
(DyFM_ prefix). This package is deprecated; migrate your imports."*

**Két mérés, ami a döntést eldönti:**

1. **NEM regresszió**: a duplikáció **HEAD-en is megvolt** (`fsm-dynamo@1.15.8` + `@1.15.9`),
   tehát nem ez a bump hozta be — csak továbbviszi (`1.15.8` + `1.16.35`).
2. **A csomag használaton kívüli**: `@futdevpro/ngx-dynamo-models` **0 forrásfájlban** van
   importálva — sem a kliensen, sem a szerveren.

**Miért kockázat:** duplikált framework-példány = duplikált singleton/globális beállítás. A Dynamo
maga is erre figyelmeztet a hibaüzenetében (*„please check if it is using the same node_modules
as the app"*).

**Ajánlás (külön lane):** a `@futdevpro/ngx-dynamo-models` **eltávolítása** mindkét `package.json`-ból
— várhatóan egysoros változás oldalanként, ami megszünteti a duplikációt. **Szándékosan NEM része
ennek a commitnak**: pre-existing, a defekt javításához nem szükséges, és önálló re-install +
re-build + re-teszt ciklust igényel mindkét oldalon.

---

## 6. Megjegyzések

- A `server/pnpm-lock.yaml` **gitignore-olt** (`server/.gitignore:7`) — projekt-konvenció, ezért nem
  kerül commitba; a kliens lock viszont tracked. A szerver-oldali CI a `package.json` range-ekből old fel.
- A `__documentations/BEDROCK-FRS.md` **üres** (csak sablon) — nincs lezárandó igény; a bedrock-oldali
  javítás már publikálva van (ngx-fdp-templates 18.15.74).
- **Scope-on kívül hagyva** (szándékosan): a feedback UX-átalakítás (flag ikon / dark-mode / önálló
  page + FAB-panel csak New). Ez bedrock-oldalon már készül egy másik session-ben; a fogyasztói
  migráció külön lane.
