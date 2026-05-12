# Cycle 12 — 2026-05-12

**Branch:** main
**Commit:** `ed0b1f5`
**Trigger:** LDP minden step ✅ DE exit 1 — postPipelineCommand server runtime fail + M1 grooming carry-over

## Összefoglaló

Cycle 11 után az LDP minden step zöld (10/10), de `exit 1` a
`postPipelineCommand` miatt: `node ./build/server/src/index.js` →
`ERR_MODULE_NOT_FOUND './app.server'` (Node ESM strict relative-import-ban
kéri a `.js` extension-t, az SSoT plan `moduleResolution: bundler` viszont
TS-side OK-t ad).

**Quick fix:** `start-prod` futtassa a forrást tsx-szel (ugyanaz mint
`nodemon-run`). Hosszú-távon: vagy minden importba `.js`, vagy
`moduleResolution: NodeNext`.

Plusz: **M1 grooming carry-over cycle 10 óta** — STATUS_DEV
backlog_snapshot + active_plan mezők eddig null-ok voltak. Most kitöltve.

## 2 fix

### 1. `server/package.json` start-prod

```diff
- "start-prod": "node ./build/server/src/index.js",
+ "start-prod": "node ../node_modules/tsx/dist/cli.mjs ./src/index.ts",
```

Verifikáció: `timeout 8 npm run start-prod` exit 0, no `ERR_MODULE_NOT_FOUND`.

### 2. STATUS_DEV grooming

- `backlog_snapshot`: green=6, yellow=13, parked=9, last_checked=ISO
- `active_plan`: ssot-server-esm-migration.plan (chat-led, takeover-elt
  Phase 3.2 + Phase 6 LDP-fix). steps_remaining=2 (Phase 5/6 functional)

## Fázis-flow

- 00-orient: cycle 12, LDP exit 1 anchor + M1 carry-over
- 02-audit (LDP-first): minden step ✅ DE exit 1 → output.log → ERR_MODULE_NOT_FOUND
- 04-investigate: ESM relative-import .js requirement, fix-options weighed
- 06-implement: start-prod → tsx + STATUS_DEV grooming mezők
- 08-verify-local: `timeout 8 npm run start-prod` exit 0
- 10-commit-push: `ed0b1f5`

## Grooming (M1)

| Mit | Inventory | Akció |
|---|---|---|
| FR-állomány | 35 fájl | nincs változás (cycle 4-11 LDP-fix munka nem érintett FR-t) |
| Backlog | 6🟢 / 13🟡 / 9🅿️ | snapshot frissítve STATUS_DEV-ben |
| Plan-archive | 8 plan | ssot-plan most active_plan-ként regisztrálva |
| Action-log size | 33 sor (2026-05-12) | nincs rotálás-szükség |

## Build/test eredmény

- **LDP minden step:** ✅ (cycle 11 óta)
- **postPipeline `start-prod`:** ✅ ESM-error eltűnt (tsx)

## Stats

- **Files:** 2 (server/package.json + STATUS_DEV.md)
- **Commit:** ed0b1f5
- **Build status:** success
