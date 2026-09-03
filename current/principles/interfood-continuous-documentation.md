# Interfood continuous documentation contract

**Owner directive (2026-09-01):** every new Interfood request, decision, tool behavior, calibration result,
failure mode and operating lesson must be documented continuously. Knowledge that exists only in a chat is not
considered part of the capability.

## Same-change writeback

Every Interfood change must update every affected durable location in the same change-set:

| New knowledge | Required durable writeback |
|---|---|
| CLI command, flag, input/output, example or pitfall | `__documentations/dev/INTERFOOD_CLI.md` and `SKILLS.md` |
| Workflow order, approval gate, readback or recovery rule | `__agent/flows/on-demand/interfood-ordering/` |
| Architecture, milestone, limitation or certification state | Hyperplan and completion audit |
| Owner-confirmed favorite, dislike, comparison or food-type preference | `ma interfood preference set|compare`; canonical data in `current/interfood/preferences.json` |
| Observed history pattern | Derived pattern report only; never promote to an explicit preference without owner confirmation |
| Tested user behavior or regression | Focused spec plus the journey catalogue; cross-feature behavior also needs a state-carrying journey |
| Material implementation lesson or failure | Dated development note, semantic action-log entry and a short FAM pointer |

If a change affects several rows, all of them apply. `AGENTS.md` and `CLAUDE.md` remain twins from the first `##`
heading and must be updated together.

## Minimum documentation content

Document enough that a new human or AI agent can execute the operation without the original conversation:

1. purpose and when to use it;
2. exact command and required state/authentication;
3. complete pagination or range semantics;
4. input and output meaning, including stable identifiers and quantity/portion behavior;
5. approval and safety boundary;
6. authoritative readback and recovery after uncertain results;
7. at least one realistic example;
8. known limitations and the date/evidence of live calibration.

## Preference inference boundary

Historical ordering is evidence, not an owner decision. `orders patterns` may nominate candidates using active
order lines, exact quantities, distinct delivery dates, distinct orders, portion classes and same-day totals.
Quantity two on a day is deliberately surfaced, but cancellation, ordering for another person or a one-off choice
can produce the same signal. The agent therefore reviews candidates in a batch and asks the owner to confirm them.
Only confirmed candidates become explicit preferences.

## Close gate

An Interfood task is not complete until affected documentation, tests/journeys, action log and—when the knowledge
is broadly reusable—the FAM recall pointer have been updated. Documentation drift is a product regression.
