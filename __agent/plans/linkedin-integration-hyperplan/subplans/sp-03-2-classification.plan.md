# SUBPLAN SP-LI-03.2 — Unread and Needs-Reply Classification

**Status:** complete · **Progress:** 6/6 (100%) · **Last updated:** 2026-08-26

## Phases

1. ✅ Implement `needsReply`: newest live message is inbound.
2. ✅ Include evidence and deterministic sorting by oldest unanswered first, then thread ID.
3. ✅ Implement candidate unread from inbound messages with absent `readAt`.
4. ✅ Gate authoritative unread behind a persisted live-calibration record.
5. ✅ Recompute classifications after update/delete and after later outbound messages.
6. ✅ Cover empty, self-only, tie ordering, deleted-last and multi-message thread variants.

## Acceptance

- `needsReply` is deterministic and never depends on LLM judgement.
- Candidate unread is visibly labelled `unverified` before calibration.
- A later outbound event clears `needsReply` without deleting the prior evidence chain.
