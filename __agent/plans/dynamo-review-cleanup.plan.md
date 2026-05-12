# dynamo-review-cleanup.plan

> **Cél**: a `@futdevpro/dynamo-eslint` review-tool által felmért **213 warning**
> (server 74 + client 139) szisztematikus felszámolása, fáziskánt.
> A pipeline `lint-server` és `lint-client` stepje (LDP) nem-fatal → fejlesztés
> közben látszik az állapot, de nem blokkol. A cél: **0 warning** mindkét oldalon.

**Indul**: 2026-05-11. **Tool**: `@futdevpro/dynamo-eslint@1.15.7` flat config
(`server/eslint.config.js`, `client/eslint.config.js`).

---

## 📊 Kiinduló állapot

| Oldal | Warning | Top szabályok |
|---|---:|---|
| **Server** | 74 | jsdoc (50), explicit-types (20), any (2), egyéb (2) |
| **Client** | 139 | jsdoc (70), explicit-types (50), return-type (16), no-getter-logic (1), egyéb (2) |
| **Összes** | **213** | — |

**Disabled rules** (upstream bug-ok):
- `@futdevpro/dynamo/prefer-enum-over-string-union` — auto-fixer self-referential type alias-t generál (`type X = X;`); kézi konverzió lehet, de a fixer ki van kapcsolva
- `@angular-eslint/no-host-metadata-property` (csak client) — `@angular-eslint@19`-ben átnevezve, dynamo-eslint config még a régi nevet hivatkozza

---

## 🛠 Phase 1 — Quick wins (~5 warning, ~10 perc)

Cél: a top-szabályok kivételével minden egyedi szabálysértést egyenként kijavítani.

| File | Sor | Szabály | Mit kell |
|---|---|---|---|
| `server/src/app.server.ts` | ~17-19 | `no-duplicate-imports` | 2× `from '@futdevpro/nts-dynamo'` import egyesítendő (`DyNTS_StaticClient_Settings` átköltöztetése a fő import-blokkba) |
| `server/src/_routes/capture/capture.data-service.ts` | ~46 | `max-len` | 132 karakteres `DyFM_Error` config sor — törd `additionalContent`-tel külön sorra vagy húzd be az `errorCode` után line-breakkel |
| `server/src/app.server.ts` | 122 | `no-explicit-any` | `getSocketServices(): DyNTS_SocketServerService<any>[]` → `DyNTS_SocketServerService<unknown>[]` (vagy üres tuple type) |
| `server/src/app.server.ts` | 127 | `no-explicit-any` | `getGlobalErrorHandler()` callback `err: any` → `err: DyFM_AnyError` |
| `client/src/app/_services/api-services/a-server.api-service.ts` | 31 | `no-getter-logic` | `private get baseUrl(): string` → `private resolveBaseUrl(): string` (`baseUrl` getter már másolja és transformálja a value-t — getter csak property-mapping lehet) |

**Verifikáció**: `pnpm lint` mindkét oldalon — a fenti 5 sor eltűnik. Várt: 213 → 208 warning.

---

## 🛠 Phase 2 — `explicit-function-return-type` client (16 warning, ~30 perc)

Cél: arrow function-ök explicit return type annotációja.

**Érintett fájlok**:
- `client/src/app/app.routing-module.ts` — `loadChildren: () => import(...).then((m) => m.X_Module)` — minden arrow-ra explicit `Promise<...>` return type
- `client/src/main.ts` — `bootstrapModule(App_Module).catch((err) => console.error(err))` — `err: unknown`, return `void`
- `client/src/app/_modules/dashboard/_services/d-dashboard.control-service.ts` — polling timer callback (`() => void this.refresh()`) → explicit `: void`

**Pattern**:
```typescript
// rossz
const fn = (m) => m.Dashboard_Module;
// jó
const fn = (m: typeof import('./_modules/dashboard/dashboard.module')): Type<Dashboard_Module> => m.Dashboard_Module;
```

A `loadChildren` esetén az Angular által várt return típus `Promise<Type<unknown>>` vagy a konkrét modul-osztály — Angular dokumentáció alapján a `() => Promise<Type<any>>` aláírás OK lenne, de a dynamo-eslint `no-explicit-any`-vel ütközik, ezért `unknown` típuskonkretizálás kell.

**Verifikáció**: 208 → 192 warning.

---

## 🛠 Phase 3 — `explicit-types` (server 20 + client 50 = 70 warning, ~1.5 óra)

Cél: minden `const`/`let` változó + parameter explicit típus-annotációval rendelkezik.

**Mit kell változtatni** (példa):
```typescript
// rossz
const items = await this.getAll(true);
// jó
const items: Insight[] = await this.getAll(true);

// rossz
const fromStorage = typeof window !== 'undefined' ? localStorage.getItem(...) : null;
// jó
const fromStorage: string | null = typeof window !== 'undefined' ? localStorage.getItem(...) : null;
```

**Érintett fájlok** (top-pontok):
- **Server**: `_routes/{wave,insight,capture,dashboard,errors}/*.{data-service,controller}.ts` — `const items`, `const row`, `const body`, `const includeDismissed`, stb.
- **Client**:
  - `_services/api-services/a-server.api-service.ts` — getter belső változók
  - `_services/control-services/a-error.control-service.ts` — `fromStorage`, hasonlóan
  - `_modules/dashboard/_services/d-dashboard.{data,control}-service.ts` — `const snap`, `row`
  - `_modules/dashboard/_components/d-*.component.ts` — `@Input set` belső `const items`
  - `_modules/status/_components/s-home/s-home.component.ts` — `const status`, `details`

**Stratégia**: file-onként végigmenni, IDE auto-typing-ot használni ha lehetséges (VS Code TypeScript inferenciát ad).

**Verifikáció**: 192 → 122 warning.

---

## 🛠 Phase 4 — JSDoc batch (server 50 + client 70 = 120 warning, ~2-3 óra)

Cél: minden class + method egysoros JSDoc-leírást kap.

**Minta a master-prompter-ből**:
```typescript
/**
 * Wave time-series DAO. Provides recent-range list and inherited CRUD via the
 * DyNTS_DataService<Wave> base. Used by Capture fanout + Dashboard aggregator.
 */
export class Wave_DataService extends DyNTS_DataService<Wave> {
  /**
   * @param set.data optional Wave row to hydrate the service with
   * @param set.issuer caller id for action-log + global error handler
   */
  constructor(set: { data?: Wave; issuer: string }) {
    super(new Wave(set?.data), wave_dataParams, set.issuer);
  }

  /**
   * Returns Wave rows created within the last `rangeHours`, optionally filtered
   * by kind (`astral` / `mental` / `matter`).
   */
  async listRecent(rangeHours: number, kind?: Wave_Kind): Promise<Wave[]> {
    // ...
  }
}
```

**Batch terv**:
1. **Server data-models** (3 file × 1 class) = 3 class JSDoc + 3 constructor JSDoc = ~6 hits
2. **Server data-services** (3 file × 1 class + 2-3 method) = ~15 hits
3. **Server controllers** (4 file × 1 class + getInstance + setupEndpoints) = ~12 hits
4. **Server bootstrap** (`app.server.ts`) — 1 class + ~9 method = 10 hits
5. **Server auth + errors** (2 file × 1-2 method) = ~5 hits
6. **Client data-models / interfaces** (`server-envelope.interface.ts` interface-ek + d-*-row interfaces) = ~10 hits
7. **Client services** (`A_Server_ApiService` + 2 control services + data-service) = ~25 hits
8. **Client components** (6 standalone) = ~15 hits
9. **Client modules** (App_Module, Dashboard_Module, Status_Module) = 3 hits

**Hatékonysági tipp**: a fájlfej-kommentek (`// File leíró...`) már leírják a class célját — sokat lehet copy-paste-elni, csak `/** ... */` blokk-formátumra átalakítani.

**Verifikáció**: 122 → ~2 warning.

---

## 🛠 Phase 5 — Manual enum conversion (~6 warning, opcionális)

A `prefer-enum-over-string-union` szabály ki van kapcsolva (auto-fix broken),
de a 6 érintett type alias **manuálisan** konvertálható enummá.

| Type alias | Konvertált forma |
|---|---|
| `server: Wave_Kind` | `enum Wave_Kind { astral = 'astral', mental = 'mental', matter = 'matter' }` |
| `server: Insight_Severity` | `enum Insight_Severity { info, notice, warn, urgent }` (string values) |
| `server: Capture_Kind` | `enum Capture_Kind { text, energy, mood, voice }` |
| `client: A_WaveKind` | mirror Wave_Kind |
| `client: A_InsightSeverity` | mirror Insight_Severity |
| `client: A_CaptureKind` | mirror Capture_Kind |

**Megfontolás**: 
- Pro: dynamo-pattern (enum keyName + kebab-case value); enum-érték type narrowing
- Kontra: szerver↔kliens DTO-knál stringként utazik a JSON-on; enum vs string union viselkedése a JSON.parse után identikus
- A FDP-Dev-Naming rule szerint enum: `keyNameIsCamelCase = 'value-is-kebab-case'` — Wave_Kind nyilván már így van (`astral = 'astral'`), de a teljes átállás non-trivial mivel minden hivatkozást módosítani kell (`Wave_Kind` mint type marad, de érték-szinten `Wave_Kind.astral` vagy `'astral'` használat)

**Halasszuk** ha a többi 0-ra ment.

---

## 🛠 Phase 6 (opcionális) — Dynamo-eslint upstream frissítés

Jelenleg `@futdevpro/dynamo-eslint@1.15.7`. A 1.15.8 elérhető. Frissítés:
- Ellenőrizni, hogy a `prefer-enum-over-string-union` auto-fix bug ki van-e javítva
- Ellenőrizni, hogy az `@angular-eslint/no-host-metadata-property` szabály ki van-e cserélve a v19-es névre
- Ha igen, az `eslint.config.js`-ben az override-okat el lehet távolítani

---

## 📅 Időbecslés

| Phase | Manuális idő |
|---|---|
| 1 — Quick wins | ~10 min |
| 2 — return-type | ~30 min |
| 3 — explicit-types | ~1.5 h |
| 4 — JSDoc batch | ~2.5 h |
| 5 — enum conversion | ~30 min (opc.) |
| 6 — upstream upgrade | ~10 min (opc.) |
| **Total kötelező (1-4)** | **~4.5 h** |
| **Total + opcionális** | **~5.5 h** |

---

## ▶️ Mit csinálunk most

**Default**: Phase 1 azonnal (10 perces gyors round). Phase 2-4 ütemezhető
napokra szétbontva — minden phase önállóan zárható, build mindig zöld marad.

**LDP integráció**: a `pipeline.config.json` mostantól minden file-changekor
futtatja a `lint-server` és `lint-client` stepeket (non-fatal). A status.json-ban
látszik mindig az aktuális warning-szám → real-time visszacsatolás a cleanup
előrehaladásáról.

---

## 🔗 Tooling alternatíva — automatizáljuk a manuális részt

A Phase 2-4 nagyrésze (~206 warning) **scripttel automatizálható**, ha a
`@futdevpro/dynamo-eslint` / `@futdevpro/cli-dynamo` tool-jait felfejlesztjük:

- `dc fix-jsdoc` (S1) — 120 warning generálható AST + file-header alapján
- `dc fix-explicit-types` (S2) — 70 warning ts-morph + TS infer
- `dc fix-return-types` (S3) — 16 warning, csak a pnpm-flat-store bug fix kell
- `dc fix-enum-from-union` (S4) — a jelenleg broken auto-fixer cseréje

**Részletes terv**: [`dynamo-cli-autofix-enhancements.plan.md`](./dynamo-cli-autofix-enhancements.plan.md)

**Becsült dev-idő**: ~5.5 nap a script-build, utána 1 paranccsal lemegy
ami most ~4.5 óra manuális. Sőt cross-project hatás — minden FDP projekt
profitál belőle.

**Döntés**: kis projekt (my-assistant) — érdemes lehet először a manuális
Phase 1-et lefuttatni, aztán ha látjuk a tényleges idő-megtakarítást,
build-eljük a scripteket upstream.
