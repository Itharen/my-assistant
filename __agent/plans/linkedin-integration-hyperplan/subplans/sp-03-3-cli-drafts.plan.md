# SUBPLAN SP-LI-03.3 — Agent-Neutral CLI and Reply Drafts

**Status:** complete · **Progress:** 8/8 (100%) · **Last updated:** 2026-08-26

## Phases

1. ✅ Wire `linkedin` into the existing two-level `ma` command tree without disturbing dirty user changes.
2. ✅ Implement configure/auth-status/doctor envelopes.
3. ✅ Implement bootstrap/sync with dry-run and pretty output.
4. ✅ Implement paged inbox list, unread, needs-reply and thread show.
5. ✅ Implement draft create/list/show/delete using body-file or stdin; never a send command.
6. ✅ Add help, exit codes, argument validation and redacted invocation logging.
7. ✅ Implement confirmed local cache purge, including messages, drafts, cursor and calibration state.
8. ✅ Document generic agent invocation and stable machine-readable result examples.

## Acceptance

- Every command is usable from any shell/agent through the same installed CLI.
- List commands never print full content unless `thread show` explicitly requests it.
- The command tree contains no hidden browser or Computer Use fallback.
- Cache/draft deletion requires an explicit confirmation flag and produces a redacted receipt.
