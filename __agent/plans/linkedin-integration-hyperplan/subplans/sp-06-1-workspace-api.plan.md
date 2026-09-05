# SUBPLAN — SP-LI-06-1 Workspace API

**Status:** complete — 2026-09-05
**Parent:** `../master-plans/mp-06-guided-manual-send-workspace.plan.md`

- [x] Define server-owned, client-consumable LinkedIn workspace DTOs.
- [x] Reuse `LinkedInStore`, `summarizeInbox`, `getThread` and draft analyzer functions.
- [x] Add paged/filterable inbox, thread+draft read, draft create and draft-status endpoints.
- [x] Add `manual-send-reported` as explicit local evidence, never delivery proof.
- [x] Validate all query/body input and map errors to debug-rich HTTP responses without message bodies in logs.
- [x] Cover pagination, empty/not-initialized, draft persistence and manual-ack transitions.
