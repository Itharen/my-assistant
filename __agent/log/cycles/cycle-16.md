# Cycle 16 — 2026-05-12

**Branch:** main
**Commit:** `8c509bc`
**Trigger:** user-kérdés "mi van a globál error handling-gel?"

## Összefoglaló

Audit: server + client ✅, **CLI hiányzott**. Cycle 16 fix: CLI top-level
global error handler (uncaughtException + unhandledRejection + main.catch
action-log emit).

## Audit eredmény

| Komponens | Status | Forrás |
|---|---|---|
| **Server** | ✅ wired | `app.server.ts:78` `getGlobalErrorHandler()` → `Errors_DataService.handleInternalError()` → Mongo `fdp_errors` |
| **Client** | ✅ wired | `A_ErrorHandler_ControlService` (Angular `ErrorHandler` provider) + `a-error.interceptor.ts` (HTTP) + `error-extract.util.ts` |
| **CLI** | ⚠️ → ✅ | Cycle 16-ban kapta meg: `uncaughtException` + `unhandledRejection` handler + `main().catch` action-log emit |

## Fix

`cli/src/main.ts` top-level (import-time, NEM await):
```typescript
process.on('uncaughtException', (err) => {
  stderr.write(...);
  void logAction({ kind: 'error', summary: '...', extra: { stack, name } })
    .finally(() => process.exit(1));
});
process.on('unhandledRejection', (reason) => { ... });
```

`main().catch(...)` bővítés: stderr + action-log emit (eddig csak stderr).

## Lefedi

- Sync error a handler-on kívül (timer / import-time / setImmediate)
- Unhandled Promise rejection (pl. fire-and-forget Promise)
- `main()` rejection (eddig csendben elsikkadt action-log szempontból)

## Build/test eredmény

- `npx tsc --noEmit` ✅
- `npx tsc -p tsconfig.json` (emit) ✅
- `jasmine` ✅ 21 specs, 0 failures
- `ma --help` smoke ✅

## Stats

- **Files:** 1 (cli/src/main.ts)
- **Commit:** 8c509bc
- **Build status:** success
