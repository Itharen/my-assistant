# DEPRECATED — migrated to `server/`

> **Don't delete yet.** This folder remains live until the migration is fully cut over.

The A-mode dispatcher logic has been migrated to:

- `server/src/_modules/tick-engine/` — validator, tier-policy, dispatch
- `server/src/_routes/tick/` — `POST /tick` HTTP endpoint
- `server/src/_models/data-models/agent-tick.data-model.ts` — DB persistence (was `__agent/state/agent-tick.json`)
- `server/src/_models/data-models/action.data-model.ts` — action-log table (was `__agent/log/actions/*.jsonl`)

## Migration phase

**Phase 1 (current):** dual-write. The CCAP runtime can still call `node scripts/agent-handlers/src/dispatch.ts < agent-output.json` — that path keeps working. Switching to server-based dispatch (`curl -X POST http://127.0.0.1:39245/tick`) is opt-in and parallel.

**Phase 2:** CCAP wrapper switches to server POST. Falls back to file-based dispatcher only if server is down.

**Phase 3:** file-based dispatcher retired (this folder deleted).

See: `current/feature-requests/server-app-architecture.md` for the full migration plan.

## Why both still exist

- `.claude/settings.json` SessionStart/PostToolUse hooks call `scripts/action-log/append.ps1` → file write. Switching them to `curl` server requires server-running guarantee.
- The CCAP / B-mode scheduled runs use `node scripts/agent-handlers/src/dispatch.ts` directly — no server dependency.
- File-state is forensic-friendly: a JSONL log opens in any editor, a SQLite DB needs `sqlite3 my-assistant.db ".tables"`.

When the server is consistently up + monitored, we'll cut over. Until then both are valid.
