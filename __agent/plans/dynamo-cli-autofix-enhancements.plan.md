# dynamo-cli-autofix-enhancements.plan

> **Cél**: a `@futdevpro/dynamo-eslint` és `@futdevpro/cli-dynamo` toolingjának
> bővítése úgy, hogy a mostani 213 manuális warning közül **a lehető legtöbbet
> automatikusan kijavítson** — kód-mutáció szintjén, nem csak validáció.
>
> **Indok**: a most lefutott `eslint --fix` 129 warning-ot levett (style), de
> a maradék 213 mind szemantikus információt igényel (JSDoc szöveg, explicit
> típus-annotáció, enum-konverzió). Ezek nagyrésze AST-alapú generátor scripttel
> automatizálható — a TS compiler tudja inferálni a hiányzó információt, és
> `ts-morph` képes belerakni a forrásba.
>
> **Hely**: ezek a scriptek vagy a `@futdevpro/dynamo-eslint` / `@futdevpro/cli-dynamo`
> packagebe kerülnek upstream (`dc fix-jsdoc`, `dc fix-types`, stb.), vagy
> egyelőre projekt-lokál scriptként a `scripts/dynamo-fix/`-be — később
> upstream-elhetők ha működnek.

---

## 🐛 Felmért tooling-hibák, amik MOST blokkolnak

### B1 — `prefer-enum-over-string-union` auto-fixer KRITIKUS bug

**Tünet**: `type Wave_Kind = 'astral' | 'mental' | 'matter'` → `type Wave_Kind = Wave_Kind;` (self-referential, tsc compile error).

**Hatás**: 6 type alias-t törte (`Wave_Kind`, `Insight_Severity`, `Capture_Kind` × server + client). Mindet kézzel kellett helyreállítani. A szabály mostantól ki van kapcsolva mindkét `eslint.config.js`-ben.

**Prioritás**: **P0** — javítsuk a fixert mielőtt máshol szétbasszuk vele a kódot.

### B2 — `dynamo-validate-imports` és `dynamo-validate-naming` pnpm-store-ban nem fut

**Tünet**: `Cannot find module '../plugin/rules/import-order'` — a script relatív require-rel keres egy belső modult, ami pnpm flat-store layoutban máshol van.

**Hatás**: a 2 standalone CLI tool használhatatlan; csak az `npx eslint`-en át jut el a kód a szabályaikhoz.

**Prioritás**: **P1** — pnpm a workspace default csomagkezelő, ez minden FDP projektet érint.

### B3 — `@angular-eslint/no-host-metadata-property` névváltás a 19-ben

**Tünet**: a dynamo-eslint `ngx` config a régi névvel hivatkozza → ESLint init-kor `TypeError`.

**Hatás**: enélkül a kliens-lint elindulni se tud. Override-oltuk `'off'`-ra, de upstream-en lecserélendő az új névre (`@angular-eslint/template/no-static-attribute-binding` vagy ami a megfelelő).

**Prioritás**: **P1** — minden Angular 19+ projektnél kerül elő.

### B4 — `require-jsdoc-description` rule false-positive `/** */\nexport class` form-on (KRITIKUS)

**Tünet**: a standard `/** JSDoc */\nexport class X {}` minta hibásan riaszt:
```
warning  Class "X" must have a JSDoc comment with description
         @futdevpro/dynamo/require-jsdoc-description
```

**Hely**: `@futdevpro/dynamo-eslint@1.15.7+1.15.8` — `build/plugin/rules/require-jsdoc-description.js` `isJSDocOnPreviousLine` function.

**Root cause**: a check így néz ki:
```js
return commentEnd === nodeStart - 1;
```
TS parser-nél a `ClassDeclaration.loc.start.line` a **parent `ExportNamedDeclaration`** start sora (vagyis az `export` kulcsszó sora) — NEM a `class` kulcsszó sora. Tehát:
```
N:   /** desc */     ← commentEnd = N
N+1: export class X  ← classStart = N+1 (a TS parser-nek)
```
A check `commentEnd === classStart - 1` → `N === N+1-1 = N` ✅ szöveg szerint mehetne, de a TS parser az `ExportNamedDeclaration` parent loc-ját adja a child `ClassDeclaration`-nek a `node.loc.start` lekérdezéskor, ami az **export** sora. Így a check `commentEnd === classStart` lesz → fail.

**Workaround a subagent által felfedezve**: ha a JSDoc az `export` és a `class` között van, akkor a rule passzol:
```
N:   export          ← parent.loc.start = N
N+1: /** desc */     ← commentEnd = N+1
N+2: class X { ... } ← classStart = N+2
```
Itt `commentEnd === classStart - 1` → `N+1 === N+2-1` ✅ pass.

**De ez a minta NEM workspace-konzisztens** — master-prompter mindenhol a `/** */\nexport class` formát használja, és nem panaszkodik (mert nem fut dynamo-eslint).

**Megoldás amit alkalmaztunk**: a my-assistant `eslint.config.js`-ben `require-jsdoc-description` `'off'`-ra állítva (mindkét oldal). A workspace-szerinti standard pattern (`/** */\nexport class`) megmarad, lint zöld. Upstream fix után visszakapcsolható.

**Upstream javítási javaslat**: a rule helyetti `isJSDocOnPreviousLine`-ban:
```js
// jelenleg
return commentEnd === nodeStart - 1;

// helyett
return commentEnd === nodeStart - 1 || commentEnd === nodeStart;
```
Vagy: ha a node `parent.type === 'ExportNamedDeclaration'`, akkor `parent.loc.start.line` helyett `node.loc.start.line`-t használni (azaz az export-keyword-mentes class-start sort).

**Prioritás**: **P1** — minden dynamo-eslint-et futtató projekt érinti.

---

## 🛠 Új auto-fixerek, amik a maradék 213 warningot felszámolhatnák

### S1 — `dc fix-jsdoc` — JSDoc auto-generálás (120 warning levehető)

**Mit**: minden class + method + interface + exported function elé `/** ... */` blokk-komment generálása, ha még nincs.

**Algoritmus** (ts-morph):
```
foreach SourceFile:
  fileHeader = read leading line-comments (//-os) az első import előtt
  foreach ClassDeclaration without leading JSDoc:
    description = fileHeader vagy "{ClassName_humanized}" (camelCase → words)
    emit `/** ${description} */` a class fölé
  foreach MethodDeclaration without leading JSDoc:
    description = "{methodName_humanized}" + ha public + signature releváns
    foreach Parameter:
      `@param {name} description-from-name`
    if returnType !== void:
      `@returns description-from-returnType`
    emit JSDoc blokkot
```

**Kockázat**: a leírások generikusak lesznek (`"User data service"` valós szöveg nélkül). Megoldás: a generátor csak hiányzó JSDoc-ra ír; ha a fejlesztő finomítja, az marad — második futás nem írja felül.

**Költség**: ~1 nap saját implementáció ts-morph-fal, vagy fele nap ha a [`eslint-plugin-jsdoc`](https://github.com/gajus/eslint-plugin-jsdoc) `require-jsdoc` szabályának van auto-fix opciója (van, de minimal stub-okat ír).

**Prioritás**: **P2** — a legnagyobb warning-kategória.

### S2 — `dc fix-explicit-types` — típus-annotáció injektálás (70 warning levehető)

**Mit**: `const X = await asyncFn()` → `const X: AwaitedReturn = await asyncFn()`. Hasonlóan `let` változókra és destructuring-ra.

**Algoritmus** (ts-morph + TS compiler API):
```
foreach SourceFile:
  program = createProgram([file], tsconfig)
  checker = program.getTypeChecker()
  foreach VariableDeclaration without explicit type:
    inferredType = checker.getTypeAtLocation(declaration.initializer)
    typeString = checker.typeToString(inferredType, ...)
    if typeString tartalmaz `any` → skip (`no-explicit-any` szabály érintené)
    insertText(declaration.name, `: ${typeString}`)
```

**Kockázat**: a typeChecker néha túl bonyolult típus-stringet ad (`Promise<readonly { x: number }[]>` helyett `Wave[]` lenne szebb). Megoldás: ha a type-stringben van `<` és > 60 karakter, importálja a definíciót és használja a rövid névvel — vagy hagyja kézi finomításra.

**Költség**: ~2 nap ts-morph + type-string normalizálás.

**Prioritás**: **P3** — második legnagyobb warning-kategória.

### S3 — `dc fix-return-types` — arrow function return type injektálás (16 warning levehető)

**Mit**: ugyanaz mint S2, de függvény-szignatúrákra. A `dc fix-return-types` parancs **már létezik** a `@futdevpro/dynamo-eslint`-ben (`dynamo-fix-return-types` bin) — csak ki kell pucolni, hogy fusson pnpm flat-store-ban (lásd B2 fix).

**Prioritás**: **P3** — ha B2-t megjavítjuk, ingyen jön.

### S4 — `dc fix-enum-from-union` — REPLACES B1 broken auto-fixer

**Mit**: `export type X = 'a' | 'b' | 'c'` → `export enum X { a = 'a', b = 'b', c = 'c' }`.

**Algoritmus**:
```
foreach SourceFile:
  foreach TypeAliasDeclaration with string-literal-union initializer:
    members = extract literal strings
    enumKeys = camelCase each (vagy szótár-szabály alapján)
    replaceNode with `export enum ${alias.name} { ${enumKeys.map(k=>`${k} = '${value}'`)} }`
  
  // critical: minden hivatkozást is konvertálni:
  foreach Identifier ami az alias-t hivatkozza VALUE-szintű kontextusban
  (pl. `kind === 'astral'`):
    skip (TypeScript automatikusan kompatibilis marad ha string-enum)
  foreach Identifier ami value-position-ben `'astral'` literal-t használ a típushoz:
    convert `'astral'` → `Wave_Kind.astral` (opcionális, csak ha a fájl már importálja az enumot)
```

**Kockázat**: az értékhasználatok kétértelműek (`'astral'` lehet bárhol). Pragmatikus megoldás: csak a type alias-t konvertálja, az értékeket hagyja stringnek — TS string-enum kompatibilis a string literal-lal.

**Prioritás**: **P0** (mert B1 csere) — a meglévő broken fixert ki kell vágni mindenképp.

### S5 — `dc fix-all` — meta-runner

**Mit**: `dc fix-all` sorrendben fut:
```
1. eslint --fix          (style, import-order, padding, comma, curly, brackets)
2. dc fix-enum-from-union (S4 — replaces B1)
3. dc fix-explicit-types  (S2)
4. dc fix-return-types    (S3 — meglévő, B2 fix után)
5. dc fix-jsdoc           (S1)
6. tsc --noEmit           (verify, fail ha bármi szétment)
```

**Prioritás**: **P4** — a fenti scriptek shipped után kell, koordinációs réteg.

---

## 📅 Build-out ütemezés

| Phase | Script | Becsült dev-idő | Hatás (warning) |
|---|---|---|---|
| **1** | B1 fix (broken `prefer-enum` auto-fix) + S4 (`fix-enum-from-union`) — ezek egymás duáljai | ~0.5 nap | 6 |
| **2** | B2 fix (pnpm flat-store) — `dynamo-validate-imports/naming` újraéledése | ~0.5 nap | — (tool-funkcionalitás) |
| **3** | B3 fix (Angular-19 rule rename a dynamo-eslint upstream config-ban) | ~0.5 nap | — (config-cleanup) |
| **4** | S3 (`fix-return-types`) — meglévő, csak B2 után megy | ~0.5 nap | 16 |
| **5** | S2 (`fix-explicit-types`) — új ts-morph script | ~2 nap | 70 |
| **6** | S1 (`fix-jsdoc`) — új ts-morph script | ~1 nap | 120 |
| **7** | S5 (`fix-all`) — runner | ~0.5 nap | — (koordináció) |
| **Total** | | **~5.5 nap dev** | **212 warning → 1** |

---

## 🎯 Hol implementáljuk

| Opció | Pro | Kontra |
|---|---|---|
| **A) `my-assistant/scripts/dynamo-fix/`** | Azonnal indulhat, semmi upstream koordináció. Tesztelhető | Csak my-assistant-on van. CCAP, Master Prompter, etc. nem profitál. |
| **B) Upstream `@futdevpro/dynamo-eslint`-ben** | Minden FDP projekt megkapja. Hosszú távon a helye | Külön repo, PR review, publish — lassabb iteráció |
| **C) Upstream `@futdevpro/cli-dynamo`-ban (`dc fix-*` commandok)** | A `dc` CLI a fejlesztők kéznél lévő eszköze; egységes interfész | Még jobban szét van osztva (ESLint plugin vs CLI tool) |

**Default ajánlás**: **A + B párhuzamosan**.
- A: gyors PoC script-ek `my-assistant/scripts/`-ben, működjenek azonnal a my-assistant-on
- B: ha bizonyítottak (1 hét futás után 0 új hibát okoznak), upstream PR a `dynamo-eslint`-be / `cli-dynamo`-ba

---

## ⚠️ Tanulság a B1 corruption-ből

Új auto-fixer **soha ne menjen production-ba** a következő gate-ek nélkül:
1. **Smoke test**: a fixer fut egy "kanonikus" sample fájlon (`samples/poc-violations.ts`), output-ot diff-eljük az elvárt `samples/poc-fixed.ts`-szel. Ha eltér → hibás.
2. **tsc-noEmit gate**: a fixer output mindig át kell menjen `tsc --noEmit`-en. Ha nem megy át → revert.
3. **Build gate**: a fixer output mindig át kell menjen `pnpm build`-en. Ha nem megy át → revert.
4. **Idempotent**: a fixer kétszeri lefutása ugyanazt az output-ot adja (no oscillation).

Ezek a gate-ek `dc fix-*` parancsokba opcionálisan beépítendők (`--dry-run`, `--verify`, `--no-tsc-gate` toggle).

---

## 🔗 Kapcsolódó plan

- `dynamo-review-cleanup.plan.md` — mostani manuális cleanup terv. Ennek a script-build-nek a hatása: **Phase 2-4 (~150 warning) automatizálható**, csak Phase 1 (~5 quick win) marad kézi.

---

## ▶️ Mit csinálunk most

**Default ajánlás**: nem indítjuk a script-buildet azonnal; előbb a manuális cleanup-ot (Phase 1) lefuttatjuk a `dynamo-review-cleanup.plan.md` szerint — a maradék ~208 warning-tól látjuk, melyik scripteknek lenne a legnagyobb hatása. Ha a JSDoc warningok > 100, indítsuk S1-et. Ha a explicit-types > 50, indítsuk S2-t.

**Alternative**: ha a 213 warning-os állapot zavar és bulk-fixet akarsz, indítsuk **S4** + **S1**-et (a 2 legtöbb warning-ot lefedő scripteket) projekt-lokál PoC-ként.

Döntés a userre.
