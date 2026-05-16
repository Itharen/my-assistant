# Plan — Runtime error API (FR #3b)

> **Cél:** Teljes runtime error pipeline a my-assistant rendszerben — kliens
> hibái szervernek POST-olódnak, perzisztálódnak (`fdp_errors` collection),
> Dev Agent `02-audit` lekéri őket.
>
> **Forrás-FR:** `current/feature-requests/runtime-error-api.md`
> **AGB green-light:** AGB-2026-05-16-01 task A (chat → dev-agent, 2026-05-16T01:35)
> **Cycle 44 diag-előzmény:** AGB-2026-05-16-03 — UI láthatóság findings.

---

## Audit (cycle 45 elején — retroaktív állapot)

A FR szakaszai **nagyrészt már ship-elve** (cycle 19-20 era + bootstrap),
nem teljesen audit-elve. Cycle 45 task A scope-ja a **valódi gap** azonosítása
és lezárása.

### Server (mind ship-elve)

- ✅ `server/src/_routes/errors/errors.controller.ts` — POST `/api/errors/error/log` + GET `/api/errors/error/list`
- ✅ `server/src/_routes/errors/errors.data-service.ts` — `Errors_DataService` `handleInternalError`
- ✅ `app.server.ts` `getGlobalErrorHandler()` → `Errors_DataService.handleInternalError` (line 161+)
- ✅ `FDP_errors_dataParams` regisztrálva `dbModels`-ben (line 83)
- ⚠️ **NEM** extends `FDPNTS_Errors_Controller` — standalone implementation
- ❌ `GET /api/errors/error/get-range/:range` endpoint — FR-specified, hiányzik
- ❌ `DyNTS_Logs_Service.getInstance().install()` — nincs a startup-ban
- ❌ Unauth log endpoint (a 401-loop elkerüléshez kellene)

### Client (mind ship-elve)

- ✅ `A_Error_ControlService.showError()` — normalize + console + toast + persist POST `/errors/error/log`
- ✅ `A_ErrorExtract_Util.extract()` — DyFM_Error / HttpErrorResponse / Error / string normalize
- ✅ `A_ErrorHandler_ControlService implements ErrorHandler` — uncaught exceptions → `showError(err, 'uncaught')`
- ⚠️ `A_Error_Interceptor` **PASSIVE** — csak `console.error()`, nem hív `showError()`-t (cycle 44 diag-finding)
- ✅ `A_Error_ControlService.persistToServer()` swallow try/catch — recursive error védve (FR-szempontból)

### Dev Agent audit oldal (Phase 5+ — pending)

- ❌ `02-audit` még nem fetch-el a `/api/errors/error/get-range`-ből (action-log marad a forrás per WORKFLOW_DEV #21)
- ❌ Action-log handler kibővítése: server error-okat ír action-log-ba is (Phase 4 FR-spec)

---

## Phase-elés (FR-séma + valódi állapot)

| Phase | Mit | Status | Cycle |
|---|---|---|---|
| 0 | FR doc | ✅ | (forrás) |
| 1 | `DyNTS_Logs_Service` install + `logs_endpoint` enable | ✅ cycle 48 | shipped |
| 2 | `Errors_Controller` + `Errors_DataService` setup | ✅ shipped (cycle ~19-20 era) | retroaktív |
| 3 | `getGlobalErrorHandler()` wiring | ✅ shipped | retroaktív |
| **4** | **A_Error_Interceptor → showError** (HTTP errors propagálása) | ✅ cycle 45 | shipped |
| **4b** | **Action-log emit minden server-error-on** (Errors_DataService.handleInternalError override) | ✅ cycle 46 | shipped |
| 5a | **Server `/error/get-range/:range` endpoint** (FDPNTS-extend refactor) — bónusz: unauth `/error/log` is | ✅ cycle 47 | shipped |
| 5b | Dev Agent `02-audit` fetch + WORKFLOW_DEV #21 frissítés (client-side) | 🚧 pending | later |
| 6 | Dev Agent `02-audit` integráció (`/error/get-range` endpoint + fetch) | 🚧 pending | later |

### Cycle 45 scope (Phase 4)

**Minimal, focused, low-risk:**

`A_Error_Interceptor.intercept()` enhancement:
- Catch HttpErrorResponse → call `A_Error_ControlService.showError(err, 'http')` BEFORE rethrow
- Recursion-guard: skip `showError()` if `req.url` includes `/errors/error/log` (don't error-report the error-reporter)
- Toast + persist now triggered automatically for ALL HTTP failures (not just `await call().catch(showError)` patterns)

Ez közvetlenül oldja a user-fájdalom "hibát dobál, nem rögzíti" részét:
- HTTP 401 → toast "AuthHeader missing!" + persist attempt (silently fails, but toast is visible)
- HTTP 5xx → toast + persist
- Network error → toast + persist

**Konstans kihagyás:**
- Az AUTH BLOCKER **továbbra is megmarad** — addig minden API hívás 401-et ad, csak most már látható lesz a felületen (toast). Az ad-hoc fix opciók chat-döntésre várnak (AGB-03 task B summary).
- A 401-error-of-error-endpoint: a `persistToServer` swallow try/catch elkapja, console.warn ír — nincs infinite loop.

---

## Phase 5-6 (későbbi cycle-ek)

**Phase 5:** Action-log emit minden server-side error-on. Az `Errors_DataService.handleInternalError` után logAction call az új error code-dal.

**Phase 6:** Dev Agent `02-audit` fetch:
- Új endpoint: `GET /api/errors/error/get-range/:range` (`lastHour|last24h|last7d`)
- Auth: loopback bypass (lásd AUTH ad-hoc opciók)
- WORKFLOW_DEV #21 phase-doc update — action-log-ról az API-ra váltás (vagy mindkettő)

---

## Validation summary

| Phase | Verify | Várt |
|---|---|---|
| 4 (cycle 45) | LDP cli-test + tsc-client + smoke (manual: hit 401-es endpoint, toast jelenjen meg) | error pipeline most automata HTTP-re is |

---

## Risks & rollbacks

- **Toast-spam**: ha minden HTTP error toast-ot dob, és a kliens auto-poll-ol 401-en, toast halmozódhat. **Mitigáció:** `A_Error_ControlService` már `newErrorMessage()` timeout-tal megjeleníti (10s default) — egy toast vesz vissza-vissza, de nem unlimited. Phase 4 elfogadja ezt; Phase 4.5-ben dedup ha kell.
- **Recursion**: `/errors/error/log` 401 → showError → POST → 401 → ... A `persistToServer` swallow try/catch elkapja, nincs loop. Plusz az interceptor `url`-szűrő dedupol.
- **Existing patterns**: a `notify` / `dashboard.snapshot` flow-k `try { await call() } catch (err) { showError(err) }` mintát használhatnak — most ezek **DUPLA toast**-ot kapnának. **Mitigáció:** interceptor-ban set a request-en egy `req.context.set(SKIP_AUTO_ERROR, true)` flag-et opcionálisan, de Phase 4-ben **NEM** scope-elem (későbbi cycle ha probléma).

---

## Status

🔄 **Phase 4 cycle 45-ben.** Phase 1+5+6 külön cycle / chat-engagement.
