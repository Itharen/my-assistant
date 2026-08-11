# A deprecated `@futdevpro/ngx-dynamo-models` eltávolítása — és a duplikált `fsm-dynamo` VALÓDI oka

- **Dátum:** 2026-08-11
- **Scope:** `client/package.json`, `server/package.json` (1-1 sor)
- **Előzmény:** a [feedback-fix doksi](./2026-08-11-feedback-apibaseurl-and-dbmodels-fix.doc.md) §5.b mellékleletében
  jelzett, akkor **szándékosan nem javított** dep-higiéniai lelet lezárása.

---

## 1. Az eltávolítás — biztonságos, mérve

| Ellenőrzés | Eredmény |
|---|---|
| Peer-függőség a csomagra (kliens + szerver, teljes `.pnpm` bejárás) | **0** |
| Sima dep-függőség rá | **0** |
| Importálja-e bármelyik telepített bedrock-bundle | **0** |
| Importálja-e a saját forrás (`client/src` + `server/src`) | **0** |

A csomag **deprecated** (a saját npm-metaadata: *„Moved to `@futdevpro/fsm-dynamo/ngx-models`"*), és
mindkét oldal `dependencies`-ében szerepelt. Eltávolítva: `client/package.json` + `server/package.json`, 1-1 sor.

---

## 2. 🔴 A duplikáció NEM szűnt meg — és nem is szűnhetett

Ez a **korábbi diagnózisom pontosítása**. A várt eredmény az volt, hogy az `ngx-dynamo-models@1.15.8`
kemény peer-pinje (`@futdevpro/fsm-dynamo: 1.15.8`) okozza a második példányt. **A mérés cáfolja:**

```
pnpm why @futdevpro/fsm-dynamo      # az eltavolitas UTAN, MINDKET oldalon:

@futdevpro/fsm-dynamo@1.15.8
└─┬ @futdevpro/dynamo-eslint@1.15.8
  └── @my-assistant/{client,server} (devDependencies)   ← EZ a valodi ok
```

A megmaradó második példányt a **`@futdevpro/dynamo-eslint@1.15.8`** húzza be — **mindkét oldalon**,
és **devDependencyként**. Az `ngx-dynamo-models` eltávolítása tehát önmagában helyes és hasznos
(egy deprecated, használaton kívüli **runtime**-függőséggel kevesebb), de a duplikációt **nem** oldja meg.

### Amit ez a kockázat-értékelésről mond

A korábbi „duplikált framework-singleton" megfogalmazásom **túlzó volt erre a párra**. Az NG0203 /
dual-singleton osztály a **futásidejű bundle-ben** együtt élő példányokról szól. Itt viszont:

- a `dynamo-eslint`-re **0** hivatkozás van a `client/src`-ben és a `server/src`-ben (mérve);
- kizárólag az `eslint.config.js` / `eslint.config.cjs` hivatkozik rá.

⇒ A második `fsm-dynamo` példány **lint-időben** él, az Angular prod-bundle-ba **nem kerülhet be**.
A **futásidejű** kockázat tehát ennél a duplikációnál **nulla**.

> Megjegyzés a `.pnpm` könyvtárról: a példány-számlálás önmagában félrevezető — a `.pnpm` store-ban
> árva könyvtárak is maradhatnak. A **döntő** mérés a függőségi gráf (`pnpm why`), nem a `find`.

---

## 3. Amit SZÁNDÉKOSAN nem tettem

**Nem bumpoltam a `dynamo-eslint`-et.** Nem volt a scope-ban, önálló verifikációt igényelne, és a
fentiek szerint **nincs futásidejű haszna** — a duplikáció megszüntetése itt kozmetikai. Ha később
mégis cél, az önálló lane: a `dynamo-eslint` újabb verziójának peer-igényét kell kimérni.

---

## 4. Verifikáció (LOKÁLIS — a projektben nincs CI)

| Ellenőrzés | Eredmény |
|---|---|
| `pnpm i` (szerver / kliens) | ✅ EXIT 0 / 0 |
| `npx tsc --noEmit` (szerver) | ✅ EXIT 0 |
| `pnpm run build-base` (szerver) | ✅ EXIT 0 |
| `npx jasmine` (szerver) | ✅ **15 spec, 0 hiba** |
| `ng build --configuration production` | ✅ EXIT 0 |
| `ng test` (kliens) | ✅ **126/126 SUCCESS** |

⚠️ **A projektben NINCS CI** (se `pipeline.cicd.config.json`, se `.github/workflows/` — mérve
2026-08-11), tehát a fenti verifikáció **kizárólag lokális**. Nincs olyan automatizmus, ami ezt
egy későbbi commitnál újrafuttatná.
