# Cycle 8 — 2026-05-12

**Branch:** main
**Commit:** `611d3e7`
**Trigger:** LDP `tsc-cli` TS5011 stubbornly fails despite cycle 7 fix

## Összefoglaló

Cycle 7-ben `cli/tsconfig.json` `rootDirs`-szel javítottam a TS5011-et, de
**LDP továbbra is failed**. Root-cause: a global `tsc` (6.0.3) szigorúan
kéri `rootDir`-t (TS6 migration), míg a CLI lokál `tsc` (5.9.3) elfogadja
a `rootDirs` alternatívát. LDP a global `tsc`-t hívja (`cd cli && tsc ...`).

## Fix

`pipeline.config.json` `steps[].command`:
- `tsc-cli`: `cd cli && tsc ...` → `cd cli && npx tsc ...`
- `tsc-server`: `cd server && tsc ...` → `cd server && npx tsc ...`

`npx tsc` a `cli/node_modules/.bin/tsc`-t használja (TS 5.9.3 — cli devDep).

## Fázis-flow

- 00-orient: cycle 8, LDP-fail (TS5011 stale után friss restart 22:48Z)
- 02-audit (LDP-first): `status.json` `tsc-cli: failed`, output.log TS5011
- 04-investigate: local `npx tsc` ✅ vs local `tsc` (global) ❌ — version diff `npx tsc --version` (5.9.3) vs `tsc --version` (6.0.3)
- 06-implement: pipeline.config.json npx-ifikáció
- 08-verify-local: `npx tsc -p cli/tsconfig.json` ✅, `npx tsc -p server/tsconfig.json` ✅
- 10-commit-push: `611d3e7`

## Tanulság

A pipeline step-eknek **mindig** a project-local toolt kell hívniuk (npx vagy
pnpm exec), nem a globálisat — a workspace globálisak verziódrift-elhetnek.
Az `npx` kis overhead, de version-stability cserébe.

(Felfedezés Q-ldp-2 felé: lint-server `eslint src`, client-build `ng build`,
client-test `ng test`, cli-test `jasmine ...` — ezek is bare CLI-k, ugyanaz
a kockázat. Cycle 9 candidate.)

## Build/test eredmény

- **CLI typecheck (emit):** ✅
- **Server typecheck (emit):** ✅
- **LDP re-run várható** (config-reload Q-ldp-1 lehet kézi `dc ldp` restart szükséges)

## Stats

- **Files:** 1 (pipeline.config.json — 2 sor change)
- **Commit:** 611d3e7
- **Build status:** success
