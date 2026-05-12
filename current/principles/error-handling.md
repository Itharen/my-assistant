# error-handling

> **Univerzális hard rule.** A user explicit kérése (2026-05-11), szó szerint:

---

> "Általános mindenkori requirement, hogy mindenhol, mindenhol, mindenhol legyen
> nagyon-nagyon alapos hibakezelés. Ez erre a rendszerünkre is jellemző. Ebben a
> rendszerben is fel kell legyen írva mindenhova, mindenhova, mindenhova, hogy
> kurva alapos hibakezelési rendszert kell kiépni, amiknek a hibáinak mindig,
> mindig, mindig el kell jutnia az error kezelési rendszernek a táblájába, ahol
> szépen elmentésre kerül. Na most, jelenleg a felületen nem, hogy nem jelenik
> meg egy debug level descriptive error, hanem az jelenik meg, hogy object,
> object. Mindig, mindig, mindig, mindenhol, mindenhol, mindenhol kötelező a
> debug level error."

---

## Mit jelent ez konkrétan a my-assistant-ban

### 1. Szerver oldal — minden hiba teljes contextussal

- Minden throw `DyFM_Error`-ral történik:
  ```typescript
  throw new DyFM_Error({
    ...this.getDefaultErrorSettings('methodName', new Error('what happened')),
    errorCode: 'MA-<MODULE>-<CODE>',          // unique, grep-able
    additionalContent: { /* IDs, params, state-snapshot */ },
  });
  ```
- A route-level catch blockok `ensureDyFMError` / `DyFM_Error.isDyFMError` ellenőrzéssel csomagolják a plain `Error`-okat
- A globális error handler (`app.server.ts` `getGlobalErrorHandler()`) **mindig** átadja a hibát az `Errors_DataService`-nek, ami **MongoDB-be perzisztálja** (`errors` collection)
- A `/errors` route (FDPNTS_Errors_Controller subclass) kiszolgálja a perzisztált hibákat listázásra + manuális dismiss-ra

### 2. Kliens oldal — `[object Object]` SOHA

- **TILTOTT** patternek:
  - `(err as Error).message ?? String(err)` — `String(err)` `[object Object]`-et ad nem-Error-okra
  - csak `console.error(...)` — nincs UI surface
  - üres state error magyarázat nélkül
  - `catch { /* silent */ }` — silent failure tilos

- **KÖTELEZŐ** pattern:
  - `extractErrorDetails(err)` util használata, amely:
    - `DyFM_Error.getErrorMessage(err)`, `getErrorStack(err)`, `getErrorCode(err)`-rel kinyeri a teljes contextust
    - HttpErrorResponse-ból (Angular) átemeli a server-oldali DyFM_Error mezőket
    - bármilyen más error-objektumot is biztonsággal feldolgoz
  - `A_Error_ControlService.showError(err, source?)` minden hiba-jelzésre:
    - `DyNX_Message_ControlService.newErrorMessage()` — toast a felhasználónak (debug-level descriptive)
    - opcionálisan popup részletekkel (stack + errorCode + additionalContent)
    - **POST `/api/errors/error/log`** — perzisztálja az error-table-ba
  - `A_ErrorHandler_ControlService extends ErrorHandler` — Angular uncaught error-okat ugyanide routol
  - `A_Error_Interceptor` HTTP error-okat routol ugyanide
  - Komponensek SOHA nem mutatnak saját `error: string` mezőből csak részleges üzenetet — mindig delegálnak az `A_Error_ControlService`-nek

### 3. Minden új feature, minden új akció

Ami `IO` / `async` / `error-able` (HTTP request, DB write, shell-out, file system, network), arra:
- Szerver: try/catch + DyFM_Error + persist
- Kliens: extract + display + persist

Új vertical slice (DataModel + DataService + Controller) **AUTOMATIKUSAN** megkapja a teljes hiba-pipeline-t a base osztályok réven (DyNTS_DataService maga is logol DyFM_Error-ral, Controller-en a tasks-callback hibái a global error handlerhez jutnak).

---

## Pattern source

- `LIVE-projects/ccap-revisioned/CLAUDE.md` → "Unified Error Handling — Full Pipeline (CRITICAL)" szekció
- `LIVE-projects/master-prompter/server/src/_routes/server/errors/errors.data-service.ts`
- `LIVE-projects/master-prompter/client/src/app/_services/control-services/a-error-handler.control.service.ts`
- `@futdevpro/fsm-dynamo`: `DyFM_Error`, `DyFM_AnyError`, `DyFM_Error.getErrorMessage/Stack/Code`
- `@futdevpro/nts-fdp-templates`: `FDPNTS_Errors_DataService`, `FDPNTS_Errors_Controller`, `FDPNTS_Errors_ControlService`
- `@futdevpro/ngx-dynamo`: `DyNX_Message_ControlService`, `DyNX_Popup_ControlService`

## Audit ellenőrzőlista

Minden új code change-nél átfutni:

- [ ] Bármely catch blokk → loggol és perzisztál (nem silent)?
- [ ] Bármely UI display → `extractErrorDetails`-ből épül, nem `(err as Error).message`?
- [ ] HTTP error response server-side → DyFM_Error mezőkkel jön át?
- [ ] Új throw → DyFM_Error errorCode-dal + additionalContent-tel?
- [ ] `[object Object]` keresés a kódban → 0 match?
