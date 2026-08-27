# Tesco email reconciliation — decision record

**Date:** 2026-08-27

## Outcome

The source Gmail now has a user-confirmed, narrow forwarding filter for Tesco
final order summaries. The next naturally arriving matching message will verify
runtime delivery. The current manually forwarded message proves that the
existing `ma email` readonly path can retrieve the authoritative final order
result.

## Decision

Do not build a continuously running mailbox monitor. Tesco ordering happens
roughly every 2–3 weeks, so the first useful automation is a one-shot,
agent-agnostic TypeScript CLI command built on the existing email client:

```text
ma tesco reconcile --latest-email --dry-run --pretty
```

It will identify the trusted Tesco message class, parse final line outcomes,
compare them with the planned cart and emit a deterministic report. It will not
write stock by default. Organizer/stock mutation remains behind explicit
approval and readback until that integration is verified.

## Security and reliability boundaries

- Persist only order-line reconciliation data; redact address, phone and
  payment-card metadata.
- Use message/order identity for idempotency.
- Unknown templates and ambiguous product rows fail closed as `unresolved`.
- No polling. A later automatic trigger is justified only if a true push event
  can invoke the same command without creating a permanent monitoring loop.

## Related sources

- `__documentations/EMAIL-FORWARDING-SETUP.md`
- `current/feature-requests/tesco-integration.md`
- `__agent/plans/browser-workflow-hyperplan/subplans/sp-05-3-reconciliation-organizer.plan.md`
