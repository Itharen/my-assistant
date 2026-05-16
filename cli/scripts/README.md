# cli/scripts/

Helper scriptek és segéd-projektek a my-assistant rendszer karbantartásához.

## Aktuális tartalom

### Önálló scriptek

| Script | Mit csinál | Mikor futtasd |
|---|---|---|
| `update-fo.ps1` | A `fo` CLI legfrissebb verzióját telepíti (git pull + build + global install + ping verify). Részletek: [`../../__agent/references/organizer-cli-setup.md`](../../__agent/references/organizer-cli-setup.md). | Új gép setup; vagy ha a CLI változott (új release / bugfix) |

### Sub-projektek (saját package.json + tsconfig.json)

| Path | Mit csinál | Részletek |
|---|---|---|
| `action-log/` | PS hook + append wrapper-ek a `ma action-log emit` CLI command-re. `.claude/settings.json` hookok ezt hívják (SessionStart / UserPromptSubmit / PostToolUse / Stop). | `DEPRECATED.md` + FR `current/feature-requests/action-log-cli-command.md` Phase 2 (cycle 25 ship) |
| `agent-handlers/` | Dual-agent JSON dispatcher (Assistant Cron + Development Agent). Per-agent state-routing, közös throttle, 9 handler-type (log, user-input-new, update-status, notify-cast, ccap-notify, task-create, task-update, fr-status-change, plan-step-mark-done). LDP-coverage (`tsc-agent-handlers` step). | `agent-handlers/README.md` |

## Használat

### `update-fo.ps1` (PowerShell, Windows):

```powershell
E:\Programming\Own\CURSOR\my-assistant\cli\scripts\update-fo.ps1
```

Ha execution policy hiba: `powershell -ExecutionPolicy Bypass -File cli\scripts\update-fo.ps1`.

### `agent-handlers/` (dispatcher):

```bash
# Smoke teszt
cd cli/scripts/agent-handlers
pnpm smoke           # log-handler smoke (test/sample-output.json)
pnpm smoke-multi     # multi-handler smoke
pnpm smoke-dev       # Dev Agent routing smoke (cycle 33+34 validation)

# CCAP integráció (production):
echo '<agent-output-json>' | node cli/scripts/agent-handlers/src/dispatch.ts
```

### `action-log/` (hook):

`.claude/settings.json` automatikusan hívja. Manuális test:
```powershell
& powershell -File cli\scripts\action-log\append.ps1 -Actor "claude" -Kind "note" -Summary "test"
```

## Hozzáadási konvenció

- PowerShell scriptek: `*.ps1` (Windows-os primary platform)
- TS sub-projektek: saját `package.json` + `tsconfig.json` (lásd `agent-handlers/`)
- Minden script kommentált header-rel kezdődjön (cél, használat példa)
- **Error handling kötelező** (per `current/principles/error-handling.md`):
  - PS: `$ErrorActionPreference = 'Continue'` + strukturált stderr emit
    (`[System.Console]::Error.WriteLine` + `MA-*` error codes), no silent swallow
  - TS: Result-pattern / propagate / strukturált `MA-*` codes — NO silent swallow

## LDP coverage

A `pipeline.config.json` watch-paths az alábbi scope-okat fedi le (cycle 32 óta):
- `cli/scripts/agent-handlers/src/` (`tsc-agent-handlers` step)
- `cli/scripts/agent-handlers/tsconfig.json` + `package.json`

PS scriptek (`update-fo.ps1`, `action-log/*.ps1`) **nincsenek** LDP-watch-on
— manual verify (ezek kivételek, lassan változnak).
