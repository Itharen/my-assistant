# Cycle 134 — Tier-gating + schema-core regression-tesztek

**Dátum:** 2026-06-03
**Commit:** `67b84bd`
**Típus:** safe-orthogonal (test-coverage) — candidate-pool blokkolt (AGB-2026-06-01-01 decision-wait)

## Trigger / kontextus

Nincs új green-light / nincs válasz az eszkalációkra (AGB-06-01-01, 06-02-01). User "continue"
= haladj (§23). A cycle 133 node:test mintáját kiterjesztem a dispatcher **biztonsági magjára**.

A file-I/O handlerek (fr-status-change / plan-step-mark-done) tesztelése temp-dir izolációt
igényelne (`MY_ASSISTANT_ROOT` env caching + Domén-2 pollúció-kockázat: FR/plan/action-log
fájlok). Helyette **pure-logic, nulla file-I/O** célok: `tiers.ts` + `schema.ts` core.

## Mit

| Fájl | Tesztek | Mit |
|---|---|---|
| `test/tiers.test.mjs` (ÚJ) | 5 | `gateAction`: Tier 0 mindig OK, Tier 1/2 sleep-gate, Tier 3 soha auto. A dispatcher security-core-ja. |
| `test/schema-core.test.mjs` (ÚJ) | 13 | top-level (verdict/reason/tickMeta/max-5-action/agent-mező) + core action-típusok (log / user-input-new / update-status / task-create **Forrás-szabály kényszer** / task-update / ismeretlen-type) |
| `README.md` | — | Unit teszt szekció frissítve (40 teszt) |

**Összesen 40/40 pass** (22 cycle 133 + 18 új), build zöld.

## Miért ezek a célok (érték)

- **`gateAction`** a Tier-alapú auto-execution kapuőre — ha elromlik, Tier 3 (production-deploy /
  fizetős API) auto-futhatna, vagy sleep-window alatt hangos noti menne. Security-kritikus → guard.
- **`schema.ts` Tier-2 "Forrás-szabály" kényszer** — a task-create autonóm létrehozást
  szabályozza; regressziója csendes adat-szennyezést okozna.

## Verifikáció

- **build:** `tsc -p tsconfig.json` → exit 0 ✅
- **test:** `node --test test/*.test.mjs` → **40 pass / 0 fail** ✅

## Coverage-állapot (agent-handlers)

| Modul | Coverage |
|---|---|
| `tiers.ts` (gateAction) | ✅ cycle 134 |
| `schema.ts` (validateAgentOutput) | ✅ cycle 133 (notify) + 134 (core) |
| `handlers/notify-discord.ts` | ✅ cycle 133 |
| `handlers/notify-push.ts` | ✅ cycle 133 |
| `handlers/{fr-status-change, plan-step-mark-done}.ts` | ⏳ file-I/O — temp-dir izoláció kell (későbbi) |
| `handlers/{notify-cast, ccap-notify}.ts` | ⏳ shell-out mock kell (későbbi) |
| `throttle.ts`, `state.ts`, `action-log.ts`, `paths.ts` | ⏳ file-I/O (későbbi) |

## Következő

Decision-wait változatlan (AGB-2026-06-01-01). Ha továbbra sincs unblock: a maradék
safe-orthogonal coverage (file-I/O handlerek temp-dir izolációval, ha a Domén-2-pollúció
biztonságosan elkerülhető `MY_ASSISTANT_ROOT`-tal egy tmp `__agent/`-re mutatva).
