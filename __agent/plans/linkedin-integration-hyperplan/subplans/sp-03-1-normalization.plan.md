# SUBPLAN SP-LI-03.1 — Message and Thread Normalization

**Status:** complete · **Progress:** 5/5 (100%) · **Last updated:** 2026-08-26

## Phases

1. ✅ Define normalized message/cache/draft/calibration schema version `1.0.0`.
2. ✅ Resolve self URN from authorization evidence and derive inbound/outbound direction.
3. ✅ Map snapshot rows and changelog message activities into the same message identity.
4. ✅ Derive thread summaries at query time from sorted non-deleted messages.
5. ✅ Preserve raw snapshot rows and count unresolved/unsupported events without corrupting valid messages.

## Acceptance

- Every classification points to its message ID and rule version.
- Same message observed through snapshot and changelog is one normalized entity.
- Timestamp ties have a deterministic identity-based ordering.
