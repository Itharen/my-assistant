# Cycle 19 — 2026-05-13

**Branch:** main
**Commit:** `8192d20`
**Trigger:** LDP runtime fail — server `EADDRINUSE 0.0.0.0:39245` (orphan)

## Összefoglaló

LDP 10/10 step ✅ DE exit 1 — postPipeline server crashed with
`EADDRINUSE`. Egy korábbi LDP run orphan szerver-process-e (PID 249848)
tartotta a portot. A `dc ldp` kill-mechanizmusa a `npm → tsx → node`
láncon nem propagált.

## Fix

`server/scripts/pre-kill-port.mjs` cross-platform pre-kill helper:
- Windows: `netstat -ano | grep :PORT` → `taskkill /F /PID`
- POSIX: `fuser -k PORT/tcp`
- ENV: `MA_SERVER_PORT` (default 39245)
- Hibatűrő (try/catch wrapper — soha ne blokkolja a start-up-ot)

`server/package.json` `start-prod`:
```
node ./scripts/pre-kill-port.mjs && node ../node_modules/tsx/dist/cli.mjs ./src/index.ts
```

## Verifikáció

- `node ./scripts/pre-kill-port.mjs` → killed PID 249848
- `netstat :39245` → free
- LDP következő futása postPipeline tisztán indul

## Stats

- **Files:** 2 (új mjs script + start-prod chain)
- **Commit:** 8192d20
- **Build status:** success
