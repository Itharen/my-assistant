# MASTERPLAN MP-LI-03 — Inbox Intelligence, Drafts and CLI

**Last updated:** 2026-08-26

## STATUS

| Subplan | Weight | Progress | Status |
|---|---:|---:|---|
| SP-LI-03.1 — Message and thread normalization | 1 | 1/1 | ✅ complete |
| SP-LI-03.2 — Unread and needs-reply classification | 1 | 1/1 | ✅ complete |
| SP-LI-03.3 — Agent-neutral CLI and reply drafts | 1 | 1/1 | ✅ complete |
| **Overall** | **3** | **3/3 (100%)** | **complete** |

## Outcome

Every agent can ask the CLI for paged thread summaries, candidate/verified unread messages, deterministic
needs-reply results and complete reply context, then save a draft without sending externally.

## Subplans

- [SP-LI-03.1](../subplans/sp-03-1-normalization.plan.md)
- [SP-LI-03.2](../subplans/sp-03-2-classification.plan.md)
- [SP-LI-03.3](../subplans/sp-03-3-cli-drafts.plan.md)

## Exit evidence

- Stable documented command and JSON contracts.
- Direction/evidence classification tests.
- Draft lifecycle tests and explicit no-send invariant.
