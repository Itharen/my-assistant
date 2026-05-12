# Cycle 9 — 2026-05-12

**Branch:** main
**Commit:** `ad3f26f`
**Trigger:** user-feedback — nodemon parancs npm-script-en menjen + watch rendesen

## Összefoglaló

3 finding a user kérdésére (nodemon exec + trigger/watch beállítás):

| Mit | Status | Akció |
|---|---|---|
| nodemon `exec` npm-script-en | ✅ már OK | nincs (`exec: npm run nodemon-run`) |
| nodemon `watch` rekurzív | ⚠️ HIBA | `./src/*` (1-szint) → `./src` (rekurzív) |
| `postPipelineCommand` path | ⚠️ HIBA | `server/dist/index.js` nem létezik (outDir=build, multi-root). Új `start-prod` npm script + `npm --prefix server run start-prod` |

## Új server npm script

```json
"start-prod": "node ./build/server/src/index.js"
```

## Pipeline change

`pipeline.config.json` `serverRestart.postPipelineCommand`:
- `node server/dist/index.js` → `npm --prefix server run start-prod`

Előny: a server runtime command **menet közben módosítható** a
`server/package.json`-ban (anélkül hogy a `pipeline.config.json`-t újra
kéne committolni). Pl. ha env-var-okkal vagy `--inspect`-tel akarunk
indítani, a `start-prod` script alá tesszük.

## Fázis-flow

- 00-orient: cycle 9, user-feedback alapján
- 04-investigate: `server/nodemon.json` watch elemzés + `pipeline.config.json` postPipelineCommand audit
- 06-implement: 3 mini-fix (nodemon.json + 2 fájl pipeline-hoz)
- 08-verify: `server/build/server/src/index.js` létezik (cycle 7 óta), `start-prod` path valid
- 10-commit-push: `ad3f26f`

## Build/test eredmény

Nem futott újra LDP (config-only change, `dc ldp` config-reload Q-ldp-1 nyitva).

## Stats

- **Files:** 3 (nodemon.json + server/package.json + pipeline.config.json)
- **Commit:** ad3f26f
