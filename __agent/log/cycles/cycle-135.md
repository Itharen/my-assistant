# Cycle 135 — File-I/O handler regression-tesztek (fr-status-change + plan-step-mark-done)

**Dátum:** 2026-06-04
**Commit:** `8f706ed`
**Típus:** safe-orthogonal (test-coverage) — candidate-pool blokkolt (AGB-2026-06-01-01 decision-wait)

## Trigger / kontextus

Nincs új green-light / nincs válasz az eszkalációkra. User "continue" = haladj (§23).
A node:test coverage kiterjesztése a **file-mutáló** handlerekre (cycle 31 óta teszteletlenek) —
ezek autonóm írják az FR/plan fájlokat, így regresszió = korrupt FR/plan. Magas érték.

## Domén-2 izolációs megoldás

A handlerek abszolút path-t fogadnak (`resolve*Path` → `isAbsolute`). A teszt:
- `MY_ASSISTANT_ROOT` → friss tmp dir (`__agent/log/actions` + `CLAUDE.md`) → az action-log oda ír
- Az FR/plan fájlok abszolút temp-path-ok → a valódi `current/` / `__agent/` SOHA nem érintett
- `test.after` → tmp törlés
- `node --test` per-fájl külön process → `paths.js` cache izolált; a lazy `projectRoot()`
  az első handler-híváskor a temp-root-ot cache-eli (top-level env-set elég, dynamic import után)

Verifikálva: a cycle után `git status current/ __agent/{plans,STATUS}` tiszta — nincs pollúció.

## Mit

| Fájl | Tesztek | Mit |
|---|---|---|
| `test/fr-status-change.test.mjs` (ÚJ) | 5 | sikeres Status-csere; **csak-a-blokkon-belül** (body-decoy érintetlen); FILE-NOT-FOUND / STATUS-MISSING / STATUS-MISMATCH |
| `test/plan-step-mark-done.test.mjs` (ÚJ) | 5 | list-item ✅ append; tábla-cella ✅ a záró `|` elé; **idempotens** skip (nincs dupla ✅); STEP-NOT-FOUND / FILE-NOT-FOUND |
| `README.md` | — | 50 teszt + Domén-2 izoláció note |

**Összesen 50/50 pass** (40 + 10), build zöld.

## Coverage-állapot (agent-handlers)

| Modul | Coverage |
|---|---|
| `tiers.ts`, `schema.ts` | ✅ (cycle 133-134) |
| `handlers/notify-discord.ts`, `notify-push.ts` | ✅ (cycle 133) |
| `handlers/fr-status-change.ts`, `plan-step-mark-done.ts` | ✅ **cycle 135** |
| `handlers/notify-cast.ts`, `ccap-notify.ts` | ⏳ shell-out mock kell (spawn intercept) |
| `throttle.ts`, `state.ts` | ⏳ file-I/O (temp-izoláció, mint most) |
| `handlers/{log, update-status, user-input-new}.ts` | ⏳ file-append (temp-izoláció) |

## Következő

Decision-wait változatlan (AGB-2026-06-01-01 — 3 napja válasz nélkül). A maradék coverage
alacsonyabb-értékű (shell-out mock / triviális file-append). **Érdemi feature-haladás
továbbra is unblock-döntést igényel** (LDP-restart server-verifikációhoz / ESM-mig / CCAP RAG).
A safe-orthogonal coverage-mélyítés közelít a diminishing-returns ponthoz.
