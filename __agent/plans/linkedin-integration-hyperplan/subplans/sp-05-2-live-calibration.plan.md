# SUBPLAN SP-LI-05.2 — Live Canary, Unread Calibration and Handoff

**Status:** in progress · **Progress:** 2/7 (29%) · **Last updated:** 2026-08-26

## Phases

1. ✅ Run read-only historical bootstrap and record counts/terminal evidence.
2. ✅ Run a second bootstrap/sync to prove idempotency.
3. ❌ Observe one new inbound event through changelog without exposing its content in logs.
4. ❌ Compare one read and one unread conversation manually against LinkedIn UI.
5. ❌ Persist the calibration result and enable or reject authoritative unread mode.
6. ❌ Verify needsReply against at least three owner-reviewed conversations.
7. ❌ Install/link CLI, smoke from a fresh terminal and finalize the runbook.

Live evidence: 4 snapshot pages, 3,394 normalized messages, zero unresolved messages. The repeated incremental
sync received one inclusive-boundary event, skipped it as a duplicate, applied zero mutations and retained the
same cursor and message count.

## Acceptance

- Live writes and UI automation remain absent.
- Any schema mismatch becomes a redacted fixture and code/test update before rollout continues.
- The final report distinguishes verified, inferred, unsupported and deferred capabilities.
