# Plan: Development Agent — vázlat v1

> **Forrás:** `current/principles/system-components.md` #1 — Development Agent.
>
> Ez a komponens **vázlat-plan** — a részletes design + MVP-scope a tényleges
> build előtt finomítandó. A meglévő `assistant-agent-cron.plan.md`
> mintát követi.

---

## 1. Cél

Egy event-/cron-vezérelt agent ami a my-assistant kódbázisát fejleszti:
- Server (`server/`)
- Client (`client/`)
- CLI (`cli/`)
- Automatizmus scriptek (`cli/scripts/` + `server/_modules/`)

**Nem a user-state-et nézi** (az az Assistant Agent Cron Job dolga).
**Nem direkt build-trigger autonómmal** (Tier 3 tiltott — javaslat user-OK-ra).

## 2. Scope

### IN
- FR-állomány feldolgozása (`current/feature-requests/`)
- Plan-step-execution (Tier 2, clear-rule)
- Test-run (Tier 2)
- Architecture-konzisztencia ellenőrzés
- USER_INPUT [NEW] Domén 2 érintett blokkok feldolgozása

### OUT
- Asszisztensi state (sleep, kaja, fürdés, recurring) — Cron Job dolga
- Notify-cast hangos (kivéve ha urgens build-failure → user-input-new)
- Autonóm commit / push / deploy (Tier 3)

## 3. Inputs (a CCAP összerakja a tick-kor)

Lásd `__agent/triggers/development-agent-entrypoint.md` "Inputs" szakasz.

## 4. Decision matrix

Lásd entrypoint "Decision matrix" — `urgens` / `soft-nudge` / `no-action`.

## 5. Outputs — action-handler scriptek

A Dev Agent-spec action-típusokhoz **új handlerek** kellenek a dispatcher
mappában:

| Action type | Handler script (új) | Tier |
|---|---|---|
| `log` | (re-use: `log.ts`) | 0 |
| `user-input-new` | (re-use: `user-input-new.ts` — `domain: "dev"`) | 1 |
| `fr-status-change` | `cli/scripts/agent-handlers/src/handlers/fr-status-change.ts` | 1 |
| `plan-step-mark-done` | `…/plan-step-mark-done.ts` | 1 |
| `plan-step-start` | `…/plan-step-start.ts` | 2 (clear-rule) |
| `test-run` | `…/test-run.ts` | 2 |
| `commit-and-push` | `…/commit-and-push.ts` (Tier 2 — 2026-05-11 autonóm) | 2 |
| `production-deploy` | (placeholder — Tier 3, ne épüljön Phase 1-ben) | 3 |

A dispatcher kibővítendő `agent` mező-felismeréssel + agent-spec
tier-szabályokkal.

## 6. Hol fut

A CCAP runtime futtatja (mint az Assistant Agent Cron Job-ot is).
Tick-frekvencia: **event-vezérelt** (preferált) — pl. file-watch a
`current/feature-requests/`-en, `git push`-on, vagy USER_INPUT [NEW]
Domén 2-érintett blokkon. Cron-fallback: 4 óránként sanity-check.

## 7. State

`__agent/state/development-agent-tick.json` — séma azonos a Cron Job
state-jével (schemaVersion, lastTickAt, tickCounter, dailyTickCount,
lastVerdict, lastReason) + `agent: "development"` mező.

## 8. Konkurencia az Assistant Agent Cron Job-bal

A két agent **párhuzamosan** futhat. Megosztott state:
- `__agent/log/actions/` (action-log) — közös, `actor` mező különböztet
- `__agent/USER_INPUT.md` — közös, `domain` mező különböztet ("dev" vs "tasks/calendar/…")
- `__agent/STATUS.md` — közös, mindkettő frissítheti a maga mezőit

File-lock a state-fájlokon — már megvalósítva (`cli/scripts/agent-handlers/src/state.ts`).

## 9. MVP scope (Phase 1)

✅ **IN MVP** (én build-elem mint workflow-doc):
- Ez a plan + entrypoint
- State-fájl seed
- Dispatcher kibővítés `agent` mezővel (kis kód)

❌ **NEM MVP** (Phase 2+ — másik agent):
- Új handler-szkriptek (fr-status-change, plan-step-*, test-run)
- CCAP integráció
- Server DB-séma `agent` oszlop

## 10. Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a plan + entrypoint vázlat | én ✅ |
| 1 | Dispatcher `agent` mező support + Dev-agent log handler | én vagy másik agent |
| 2 | FR-status-change + plan-step-* handlerek | másik agent |
| 3 | CCAP integráció (event-/cron-trigger) | CCAP team |
| 4 | Server DB-migration + cost-cap szétválasztás | másik agent |

## 11. Open kérdések

❓ Q-devagent-1: Event-vezérelt vagy cron tick? (Vagy hibrid?)
❓ Q-devagent-2: A Tier 2 actions automatikus, vagy `user-input-new` javaslat-mód?
❓ Q-devagent-3: Cost-cap (USD/nap) külön a Cron Job-tól? Mennyi?
❓ Q-devagent-4: A handler-package (`cli/scripts/agent-handlers/`) közös marad, vagy szétválik agent-szerint?

## Status

📝 **v1 vázlat készen.** Várja a 3-pontos user-OK-t (vagy alapos review-t) ahhoz hogy a kódszintű build induljon.

3 pont a Phase 1 indításához:

1. **Dispatcher kibővítés** `agent: "development" | "assistant-cron"` mezővel + agent-spec tier-szabályok **OK**?
2. **Új handler-script-ek** (`fr-status-change`, `plan-step-start`, `plan-step-mark-done`, `test-run`) Phase 2-ben épülnek meg, NEM most. Phase 1 csak entrypoint + state + dispatcher-kibővítés **OK**?
3. **Tier 3 tiltott auto** (build-trigger, commit, push) — javaslat-módban USER_INPUT [NEW]-ba kerülnek **OK**?
