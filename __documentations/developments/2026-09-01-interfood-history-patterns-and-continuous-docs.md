# Interfood history patterns and continuous documentation — 2026-09-01

## Why

The owner requested two durable capabilities: learn from the complete historical order sample—including the strong
signal of ordering two units on one delivery day—and continuously document every future Interfood operating lesson.

## Shipped behavior

- `ma interfood orders patterns` derives deterministic food and category evidence from the persisted complete
  history.
- Aggregation preserves quantity, distinct dates, distinct orders, full/small/unknown portions and same-day totals.
- Inactive/cancelled lines do not influence the report.
- `--minimum-units`, `--double-orders-only` and `--limit` create a compact batch for owner review.
- Observations are deliberately not written to the explicit preference store.
- IF-J03 now carries paginated history through persistence, resume, coverage and quantity-aware pattern derivation.
- The mandatory writeback matrix is canonical in
  `current/principles/interfood-continuous-documentation.md` and referenced from both agent files, the flow, runbook
  and skills catalogue.

## Verification

After correcting the IF-J03 assertion to the existing snapshot/report field contract, the final two consecutive
full runs completed with 221 specs and zero failures (random seeds 38599 and 34323). The agent-file twin check also
reported 80 pairs checked with zero drift or missing files.
