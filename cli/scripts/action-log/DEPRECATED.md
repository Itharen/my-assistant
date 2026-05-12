# DEPRECATED — migrating to `server/`

> **Don't delete yet.** This folder remains live until the `.claude/settings.json` hooks are switched to server POSTs and the migration phase 2 lands.

The action-log writer trio (`lib.ts`, `append.ps1`, `hook.ps1`) writes to `__agent/log/actions/<day>.jsonl`. The new authoritative location is the `actions` table in `server/data/my-assistant.db`, accessible via:

- POST `http://127.0.0.1:39245/actions` — append
- GET `http://127.0.0.1:39245/actions` — list with `from/to/kind/actor/limit/offset` filters
- See `server/src/_modules/action-log/action-log.module.ts` for the API

## Migration phase

**Phase 1 (current):** file write. Live, see `__agent/log/actions/<today>.jsonl`. Used by:
- `.claude/settings.json` hooks (SessionStart, UserPromptSubmit, PostToolUse, Stop)
- `cli/src/action-log/action-log.client.ts` (the CLI's local writer — already aligned)
- `activity-monitor/logger.ps1` lifecycle events

**Phase 2:** dual-write. PowerShell + Node clients post to server first, fall back to file write on server-down.

**Phase 3:** server-only. This folder retired.

See: `current/feature-requests/server-app-architecture.md` for the full migration plan.
