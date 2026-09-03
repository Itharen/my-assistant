# SUBPLAN SP-LI-04.1 — Feature, Contract and Security Tests

**Status:** complete · **Progress:** 8/8 (100%) · **Last updated:** 2026-08-26

## Phases

1. ✅ Authorization and secret-provider feature tests.
2. ✅ Snapshot and changelog contract-parser tests.
3. ✅ Pagination, cycle, timeout, retry and partial-result tests.
4. ✅ Atomic store, interruption retention and corrupt-cache fail-closed tests.
5. ✅ Normalization, unread and needs-reply tests.
6. ✅ CLI envelope, help, invalid-argument and draft lifecycle tests.
7. ✅ Security assertions for tokens/content in logs, fixtures and tracked output.
8. ✅ Snapshot-not-ready versus empty-inbox and confirmed/declined purge tests.

## Acceptance

- Success, rejection, partial, fallback and permission-restricted variants are automated.
- No live LinkedIn call is required for the offline release gate.
- Coverage gaps are reported against the feature catalogue, not raw spec count.
