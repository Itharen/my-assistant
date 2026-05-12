# FR: Server ESM proper module resolution

> **Forrás: dev-agent cycle 12 (2026-05-12).** Technikai tartozás —
> az SSoT server ESM migration utáni fennmaradó runtime-rés.

## Kontextus

A cycle 7-12 során az SSoT cross-subproject + Server ESM migration nagy
részben kész:
- ✅ server `type: module`
- ✅ `moduleResolution: bundler` (TS-side OK)
- ✅ `rootDirs` + `paths` setup
- ✅ LDP `tsc-server` zöld
- ⚠️ **Runtime futtatás** problémás: a Node ESM strict relative-import
  resolution-höz `.js` extension kell minden `import './x'`-ben, de a
  forrás `.ts`-ek extension nélkül importálnak (bundler mode konvenció)

**Workaround (cycle 12):** `start-prod` script tsx-szel a forrást futtatja
(`node ../node_modules/tsx/dist/cli.mjs ./src/index.ts`), nem a build
output-ot. Ezért a `tsc-server` build-artifact runtime-on nincs használva.

## Cél

Tisztává tenni a server runtime ESM resolution-t úgy, hogy a build output
direktben futtatható legyen Node-dal (`node ./build/server/src/index.js`).

## Opciók

| Opció | Mit | Pros | Cons |
|---|---|---|---|
| A | Minden relative import-ba `.js` (codemod) | Tiszta ESM-konform | Sok fájl (≈ minden `*.ts` a `server/src/`-ben) |
| B | `moduleResolution: "NodeNext"` + `module: "NodeNext"` | TS kényszeríti az `.js`-t | Egyszerre kell minden import átírva, plus a `bundler` előny elveszik |
| C | tsx mint canonical runtime (jelenlegi workaround) | Nincs változtatás | "Production"-name félrevezető; build wasted; node-only env-ekre nem skálázható |
| D | TS `tsconfig` `paths` + bundle a server-t (esbuild/rollup) | Egy file output | Build complexity nő |

## Javaslat

**A opció** (codemod `.js` extension). Codemod script ti-ts-szerű
projekteken bevett pattern; egyszeri munka, jövőbiztosabb. Master-prompter
+ ccap-revisioned mintát nézhetjük (ha náluk megvan).

## Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a FR | dev-agent ✅ |
| 1 | Codemod script (`scripts/add-js-extension.ts`) — minden `import` a `server/src/**.ts`-ben + relative path → `+'.js'` | dev-agent |
| 2 | Run codemod + tsc verify + LDP green | dev-agent |
| 3 | `server/package.json` `start-prod` revert: `node ./build/server/src/index.js` | dev-agent |
| 4 | Verifikáció: LDP postPipeline a build output-ot futtatja | dev-agent |

## Acceptance criteria

- `npm --prefix server run start-prod` a build output-ot indítja (NEM tsx-szel)
- `server/build/` egy önálló futtatható artifact
- LDP postPipeline → server runtime zöld

## Status

🟡 **Második hullám** — technikai tartozás, nem blokkol. A jelenlegi
tsx-workaround stabil. Aktiválható amikor production deployment relevánssá
válik (Phase 2+).

## Kapcsolódik

- `__agent/plans/ssot-server-esm-migration.plan.md` — anya-plan
- `__agent/log/cycles/cycle-12.md` — workaround forrása
- `current/principles/ssot.md` — cross-subproject pattern
