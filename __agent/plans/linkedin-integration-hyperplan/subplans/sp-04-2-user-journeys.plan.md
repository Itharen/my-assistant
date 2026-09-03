# SUBPLAN SP-LI-04.2 — Stateful User Journeys and Diagnostics

**Status:** complete · **Progress:** 7/7 (100%) · **Last updated:** 2026-08-26

## Phases

1. ✅ Automate LI-J01 configuration/access → bootstrap → historical thread.
2. ✅ Automate LI-J02 incremental inbound → unread/needsReply.
3. ✅ Automate LI-J03 thread state → later outbound clears needsReply with boundary dedupe.
4. ✅ Automate LI-J04 interrupted refresh → old cache → resume success.
5. ✅ Automate LI-J05 missing/available secret → API → token absence from cache/log.
6. ✅ Automate LI-J06 declined purge → confirmed purge → no derived local data.
7. ✅ Maintain a journey catalogue with feature traceability and cleanup assertions.

## Acceptance

- Each journey reuses state created by its previous step.
- Each step asserts business state and not only URLs/process success.
- Temporary state roots and logs are hard-deleted at journey end.
