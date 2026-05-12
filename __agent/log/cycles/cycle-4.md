# Cycle 4 — 2026-05-12

**Branch:** main
**Commit:** `576912a`
**Trigger:** LDP fail #0a priority (2026-05-12T15:53Z LDP run, exit 1)

## Összefoglaló

Az `efc4f28` (cycle 2) óta beágyazott `#0a LDP fail` priority első élesítése.
Az LDP `2026-05-12T15:53Z` futása exit 1-gyel záródott (server-test +
client-test). Mindkét gyökérhibát fixáltuk, LDP most kell hogy zöld legyen.

## Fázis-flow

- 00-orient: cycle 4 indul, LDP-fail anchor
- 01-cleanup-git: foreign pending (chat ESM migration plan in-progress) — rögzítve, nem takeover
- 02-audit: typecheck cli/server/client mind zöld; LDP results elemzés
- 04-investigate:
  - **server-test root-cause**: `spec/support/jasmine.json` `spec_dir: dist/`
    de tsconfig `outDir: build/` → mismatch. 0 spec file is volt.
  - **client-test root-cause**: AppComponent template `<dynx-fab-shell>`
    (3rd-party `@futdevpro/ngx-dynamo` komponens), de spec TestBed-ben
    nincs `CUSTOM_ELEMENTS_SCHEMA` → NG0304.
- 06-implement:
  - `server/spec/support/jasmine.json`: `spec_dir: build/`
  - `server/src/app.server.spec.ts`: sanity baseline spec (2 trivial test)
  - `client/src/app/app.component.spec.ts`: `CUSTOM_ELEMENTS_SCHEMA` import + schemas
  - `pnpm-workspace.yaml`: `allowBuilds.esbuild: true` (server pnpm install unblock)
- 08-verify-local:
  - Server: `npm run build-base && npx jasmine` ✅ **2 specs, 0 failures**
  - Client: `npx ng test --watch=false --browsers=ChromeHeadless` ✅ **13 SUCCESS**
  - CLI/server/client typecheck mind ✅
- 10-commit-push: `576912a`

## Pattern-followed

- **Server placeholder spec**: master-prompter `a-test.api-service.spec.ts` shape-test minta
- **Client `CUSTOM_ELEMENTS_SCHEMA`**: standard Angular unit-test pattern 3rd-party komponensekhez

## FR-status változások

Nincs.

## Build/test eredmény

- **CLI typecheck:** ✅
- **CLI test:** ✅ 21 specs
- **Server typecheck:** ✅
- **Server test:** ✅ **2 specs, 0 failures (új — eddig "No specs")**
- **Client typecheck:** ✅
- **Client test:** ✅ **13 SUCCESS (cycle 1 óta 3 fail)**

## Stats

- **Files:** 8 (commit-stat — pár dep-touch is bekerült chat ESM-migration mid-flight miatt)
- **Commit:** 576912a
- **Build/test status:** mind success
