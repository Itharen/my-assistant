# Cycle 133 — Regression-tesztek a notification handlerekhez (node:test)

**Dátum:** 2026-06-02
**Commit:** `be427c5`
**Típus:** safe-orthogonal (test-coverage) — a candidate-pool blokkolt (AGB-2026-06-01-01 decision-wait)

## Trigger / kontextus

A cycle 132 eszkalációja (AGB-2026-06-01-01) decision-wait-ben; nincs válasz, nincs új
green-light. A user "continue" = haladj (§23: óvatosság-túl-interpretáció tilos). A `03/04`
felmérés döntő eredménye: **a server-zone nem verifikálható ebben a lokál env-ben** (nincs
hoisted/lokál `tsc` a server-ben, LDP stale 05-26) → server-feature (pl. #8a weather Phase 2)
nem ship-elhető E2E-zölden. A verifikálható ortogonális zóna a **cli/scripts/agent-handlers**
(130-131-ben bizonyított: `.pnpm` tsc.js build + `node dist/` futtatás).

Választott safe-orthogonal: **committed regression-tesztek** a cycle 130-131 handlerekhez —
eddig nem volt unit-coverage (csak typecheck + tsx-smoke), és a 131-ben elkapott
emoji-ByteString bug pont egy regresszió-guardot indokol.

## Mit

| Fájl | Mit |
|---|---|
| `test/notify-handlers.test.mjs` (ÚJ) | 12 teszt: discord + ntfy pure builders, HTTP-integráció lokál mock-szerverrel, error-path-ok (no-env / HTTP-4xx), **emoji-ByteString regresszió-guard** |
| `test/schema-notify.test.mjs` (ÚJ) | 10 teszt: `validateAgentOutput` a notify-discord + notify-push action-típusokra (valid + tier/priority/mention/tags hibák) |
| `package.json` | `build` + `test` script (`tsc` + `node --test test/*.test.mjs`) |
| `README.md` | "Unit teszt" szekció |

**22/22 pass**, build zöld.

## ⚙️ Tooling-döntés (§7 új-minta — objection-re jelezve)

**`node:test` (Node stdlib)**, NEM jasmine/vitest/jest:
- nulla új dependency (build-it-ourselves / minimal-deps / no-paid elvek)
- a `cli` package jasmine-on-`build/` mintáját tükrözi (compiled `dist/`-et teszt)
- az agent-handlers package-nek eddig nem volt test-runnere
- **reversible** — ha chat/user jasmine-konzisztenciát akar, átírható
- jelezve: **AGB-2026-06-02-01** (announcement, objection-window)

## Verifikáció

- **build:** `tsc -p tsconfig.json` → exit 0 ✅
- **test:** `node --test test/*.test.mjs` → **22 pass / 0 fail** ✅
- Megjegyzés: a `node --test` a compiled `dist/`-et importálja → a `test` script előbb buildel.

## Megjegyzés a server-blokkról

A #8a weather Phase 2 (rain → notify) hook-pontja kész (`weather-poll.service.ts:emitRainStart`),
és a fájl NEM része a foreign-pending ESM-mig setnek. **De** a server build nem verifikálható
lokálban → E2E-zöld ship nem garantálható. Ehhez is az AGB-2026-06-01-01 unblock (ESM-mig
befejezés vagy LDP-restart) kell. Addig a notification-réteg handler-oldala teljes + tesztelt.

## Következő

Decision-wait (AGB-2026-06-01-01 + AGB-2026-06-02-01). Ha nincs unblock/green-light és nincs
verifikálható ortogonális munka → további safe-orthogonal (pl. más handler spec-coverage:
fr-status-change / plan-step-mark-done / task-* — szintén az agent-handlers zónában).
