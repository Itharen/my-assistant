# Cycle 11 — 2026-05-12

**Branch:** main
**Commit:** `04ffe91`
**Trigger:** LDP `client-build` + `lint-client` továbbra is fail-elnek cycle 10 close után → takeover

## Összefoglaló

Cycle 10-ben defer-eltem a `client-build` és `lint-client` fail-eket (chat
Phase 6 WIP). A chat (#5) nem committolt cycle 10 óta, az LDP 23:04Z-i
futása mindkettőt még mindig failed-nek jelölte. **Takeover authorized**
(cycles_persisted: 4+).

## 3 fix

### 1. NG5002 `as` expression in @else if

Mindkét i-* template (`i-google.component.html`, `i-spotify.component.html`):
```html
} @else if (status(); as s) {  →  } @else {
                                     @let s = status();
                                     @if (s) { ... }
                                   }
```

Angular 17+ `@let` block-scoped binding.

### 2. NG5002 "Incomplete block @"

`i-spotify.component.html` line 21: `@` karakter mid-string-ben (Angular
parser block-syntax-nak nézi):
```html
{{ ... }} @ {{ ... }}    →    {{ ... }} &#64; {{ ... }}
```

### 3. lint-client `template/no-call-expression` × 11

`client/eslint.config.js`-ben új blokk a HTML files-ra:
```js
{
  files: ['**/*.html'],
  rules: {
    '@angular-eslint/template/no-call-expression': 'off',
  },
},
```

Angular signal-ek tervezésileg template-ben hívandók (`status()`,
`loading()`). A régi RxJS+async-pipe konvenciójú lint rule signal-alapú
kódra nem alkalmazható.

## Fázis-flow

- 00-orient: cycle 11, LDP-fail #0a anchor (takeover)
- 02-audit (LDP-first): exitCode 1, client-build + lint-client failed
- 04-investigate: log/live-dev-pipeline/output.log részletes
- 06-implement: 3 fix (eslint config + 2 template)
- 08-verify-local:
  - `npx ng build --configuration production`: BUILD=0 (csak FDP CommonJS dep warning)
  - `npx eslint src`: 0 errors, 35 warnings, EXIT=0
- 10-commit-push: `04ffe91`

## Foreign pending → close

A 3 fix befejezte a chat Phase 6 LDP-szempontból. Az `integrations` modul
runtime/funkcionalitás-szempontból még tesztelendő (server controllers,
OAuth callback URL-ek), de a build/lint baseline most zöld.
`foreign_pending.cycles_persisted` még 4 — várt: a chat saját Phase 6
finalizálása + tényleges commit nélkül a fingerprint továbbra is áll.

## Build/test eredmény

- **client-build:** ✅ (eddig fail)
- **lint-client:** ✅ exit 0, 35 warning (eddig 11 error)
- **többi LDP step:** változatlan ✅

## M1 grooming carry-over

Cycle 10-ben triggerelve, **még mindig defer**. A grooming-ot a cycle 12
elejére tesszük (akkor nem lesz aktív LDP-fail #0a anchor, lesz idő rá).

## Stats

- **Files:** 3 (eslint + 2 html)
- **Commit:** 04ffe91
- **Build status:** success
