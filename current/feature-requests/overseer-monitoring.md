# FR: Overseer monitoring — rendszer-állapot tracking

> **Forrás: a user szövege (2026-05-12).**

## A user szövege

> Nem ártanám, hogy azt is valahogy monitorozzuk, hogy az Overseer-ben éppen
> a rendszereink hogy állnak.

## Cél

Az Overseer (FDP CI/CD orchestrator) saját Overseer dashboard-ján élő
projekt-státuszokat ad ki:
- Pipeline run-ok (success/failed/warning)
- Deployment status
- Build report-ok
- Runtime error API-k

Ezt **monitorozzuk** a my-assistant-ből, hogy a user-nek **chat-rétegen át**
látható legyen hogy a saját projektjei éppen hogy állnak (anélkül hogy
manuálisan megnyitná az Overseer-t).

## Releváns API-k

Az `fdp` CLI (FDP-cli) ezekre épülő parancsokkal érhető el az Overseer:
- `fdp project-statuses` — projektek aktuális state-je
- `fdp build-results` — build report-ok
- `fdp build-detail --project <name>` — részletes CDP report
- `fdp pipeline-jobs` — aktív/queued pipeline jobok
- `fdp runner-status` — runner container + job állapot
- `fdp server-logs --tail 200` — Overseer szerver logok
- `fdp errors --range 24h` — szerver error-ok

Lásd: globális `CLAUDE.md` (`E:/Programming/Own/CURSOR/CLAUDE.md`) "FDP CLI
DevOps commands" szakasz.

## Megoldás

Két szint:

### A) Assistant Agent Cron Job input-bővítés (Phase 1)

A `WORKFLOW_ASSIST.md` `02-read-context` fázisba új input:
```
fdp project-statuses --json
```

A Cron Job a következő tickkor látja, ha valamelyik projekt failed / warning.

### B) Külön automation script (Phase 2 — #7)

`cli/scripts/overseer-poll.ts` ami percenként pollozza az Overseer-t és
ír egy `__agent/state/overseer-status.json` cache-t (gitignored).

A Cron Job innen olvas (gyorsabb, kevesebb fdp-hívás).

## Status

🟢 **Aktív FR** (új igény). Backlog 🟡 második hullámba.

## Open kérdések

❓ Q-overseer-1: Mely projekteket figyeljük (mind / fő-prio listán szereplő?)
❓ Q-overseer-2: Anomália-küszöb (1 failed pipeline → notify? 24h warning streak?)
❓ Q-overseer-3: Sleep-aware: alvás alatt csak pending-csomagba?
❓ Q-overseer-4: A `fdp` CLI mostani auth-konfig-szinten elérhető a Cron Job runtime-jából?

## Kapcsolódik

- `current/feature-requests/ccap-session-monitoring.md` — testvér FR (auto-session monitor)
- `__agent/phases/assist/02-read-context.md` — input-forrás bővítés
- Globális `CLAUDE.md` — FDP CLI DevOps commands
