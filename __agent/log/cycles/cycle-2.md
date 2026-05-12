# Cycle 2 — 2026-05-12

**Branch:** main
**Commit:** `efc4f28`
**Trigger:** user-OK 2026-05-12 — `03-collect-tasks` priority bővítés

## Összefoglaló

Workflow-extension: LDP > CDP > runtime > minden más priority hozzáadva
a `03-collect-tasks`-hoz. 3 új event-handler + WORKFLOW_DEV event-tábla +
`02-audit` pipeline-state placeholder.

## Fázis-flow (fast-path)

- 00-orient → 06-implement (közvetlen, user-OK workflow change)
- 06-implement → 3 új handler + 2 fázis-fájl + WORKFLOW_DEV
- 08-verify-local → cli/server/client typecheck mind zöld
- 10-commit-push → `efc4f28`

## Új event-handlerek

| Handler | Phase | Cél |
|---|---|---|
| `events/dev/on-ldp-fail.md` | 2+ | `dc ldp` watch-pipeline fail |
| `events/dev/on-cdp-fail.md` | 2+ | `dc cdp` / Overseer pipeline fail |
| `events/dev/on-runtime-error.md` | **1** | action-log `kind:"error"` scan |

## Priority-tábla (03-collect-tasks)

```
#0   build/test fail (audit)
#0a  LDP fail            ← ÚJ
#0b  CDP fail            ← ÚJ
#0c  runtime error       ← ÚJ
#1   aktív plan
#2   USER_INPUT [NEW] dev
#3   backlog 🟢
#4   FR Status 🟢
#5   backlog 🟡
#6   fallback (close-cycle no-op)
```

## Build/test eredmény

- **Typecheck:** ✅ cli/server/client mind zöld
- **Test:** ⏸️ skipped (pnpm package-issue Q-package-1 továbbra is)

## Open kérdések

- Q-package-1 továbbra is nyitva (protobufjs build-issue → `pnpm test` blokk)

## Stats

- **Files:** 22 modified/created
- **Commit:** efc4f28
- **Build status:** success
- **Test status:** not-run
