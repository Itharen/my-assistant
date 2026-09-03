# SUBPLAN SP-LI-02.2 — Historical Snapshot Bootstrap and Atomic Store

**Status:** complete · **Progress:** 7/7 (100%) · **Last updated:** 2026-08-26

## Phases

1. ✅ Implement complete `INBOX` snapshot traversal using server-supplied next links.
2. ✅ Treat `paging.total` as advisory; stop only on verified terminal evidence.
3. ✅ Detect repeated next links, page cycles, no-progress and excessive-page budgets.
4. ✅ Distinguish LinkedIn snapshot processing/not-ready from a verified empty `INBOX` result.
5. ✅ Normalize and deduplicate historical messages before persistence.
6. ✅ Write a schema-versioned cache atomically under the user-local state root.
7. ✅ Prove not-ready/interrupted/malformed bootstrap keeps the previous complete cache unchanged.

## Cache contract

The store contains normalized messages, non-secret sync metadata, drafts and calibration state. It excludes OAuth
material. Temporary files use exclusive creation, sync and atomic rename; cleanup failures remain observable.

## Acceptance

- Bootstrap reports source pages, normalized count, duplicate count and terminal reason.
- Partial traversal never replaces a complete cache.
- State-root resolution works identically from source, compiled and globally installed CLI execution.
