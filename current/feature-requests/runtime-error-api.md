# FR: Runtime error API — Dynamo `DyNTS_Logs_Service` bevezetés

> **Forrás: a user szövege (2026-05-12).** Kritikus + magas-prio.

## A user szövege

> A runtime error API az amúgy a Dynamo rendszereknek alaprésze.
> Elméletileg beépített feature, amit minél előbb működésre kell bírjunk.

## Cél

A `server/` (My Assistant Server, #2) integrálja a Dynamo NTS Logs-rendszerét:
- `DyNTS_Logs_Service` install a startup-ban
- `logs_endpoint` enabled — REST endpoint a Dev Agent / Cron Job számára
  hogy lekérje a runtime error-okat
- `FDPNTS_Errors_Controller` + `FDPNTS_Errors_DataService` minta

## Releváns import (a globális CLAUDE.md alapján)

```ts
import { DyNTS_Logs_Service, DyNTS_getLogsRoutingModule }
  from '@futdevpro/nts-dynamo/logs';

DyNTS_Logs_Service.getInstance().install();
DyNTS_global_settings.log_settings.logs_endpoint = { enabled: true };
// routing-ban:
const logsModule = DyNTS_getLogsRoutingModule({ authPreProcess: myAuth });
```

## Új REST endpointok (a `server/`-ben)

| Endpoint | HTTP | Cél |
|---|---|---|
| `GET /api/errors/error/get-range/:range` | GET | Runtime error-ok adott időszakra (`lastHour`, `last24h`, `last7d`) |
| `POST /api/errors/error/mark-done` | POST | Error mark-done |
| `POST /api/errors/error/mark-fixed` | POST | Error mark-fixed |
| `POST /api/errors/error/mark-done-bulk` | POST | Bulk mark-done ID-listával |

Lásd CCAP-Revisioned mintát (`E:\Programming\Own\CURSOR\LIVE-projects\ccap-revisioned\`)
és a workspace-szintű FDP-pattern.

## A Dev Agent használja

A `WORKFLOW_DEV.md` 20. alapelv (Runtime error scan) szerint:
- `02-audit` fázisban olvasás: `GET /api/errors/error/get-range/last24h`
- `13-close-cycle` fázisban mark-done a cycle-ben javított error-ok

## Auth

`loopback` Bearer-token (a `server/` Phase 1 mintát követve, `MA_AUTH_TOKEN`).

## Phase-elés

| Phase | Mit | Felelős |
|---|---|---|
| 0 | ez a FR | én ✅ |
| 1 | `DyNTS_Logs_Service` install + `logs_endpoint` enable a server-en | Dev Agent ✅ cycle 48 |
| 2 | `Errors_Controller` + `Errors_DataService` setup (FDPNTS-extend) | Dev Agent ✅ retroaktív (cycle 19-20 era) |
| 3 | `getGlobalErrorHandler()` wiring | Dev Agent ✅ retroaktív (bootstrap) |
| 4 | **A_Error_Interceptor → showError() routing** (HTTP errors propagálása a kliens central error-pipeline-on át) | Dev Agent ✅ cycle 45 |
| 4b | Action-log handler kibővítése: server error-okat ír action-log-ba is | Dev Agent ✅ cycle 46 |
| 5a | Server `/error/get-range/:range` endpoint (FDPNTS-extend refactor) | Dev Agent ✅ cycle 47 |
| 5b | Dev Agent `02-audit` client-fetch + WORKFLOW_DEV #21 frissítés | Dev Agent — pending |

## Open kérdések

❓ Q-err-api-1: A `@futdevpro/nts-dynamo` package elérhető a my-assistant `server/`-en? (npm install kell?)
❓ Q-err-api-2: A `FDPNTS_Errors_Controller` + `DataService` source-import-ok a `@futdevpro/nts-fdp-templates`-ből?
❓ Q-err-api-3: A `Errors` MongoDB collection kell-e (SQLite-on jelenleg)? Vagy SQLite-tábla `errors`?

## Status

🟢 **MAGAS prio** — Phase 2+3+4 ✅ shipped (cycle 19-20 + 45). Phase 1, 4b, 5
pending. AGB-2026-05-16-01 task A green-light → plan-doc B-mode
`__agent/plans/runtime-error-api.plan.md`.

## Kapcsolódik

- `current/principles/error-handling.md` — debug-level error-kezelés mindenhol
- `__agent/WORKFLOW_DEV.md` 20. alapelv — runtime error monitoring
- Globális `CLAUDE.md` "NTS Logs modul (szerver)" szakasz
- `current/feature-requests/server-app-architecture.md` — server-app
