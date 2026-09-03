# MASTERPLAN MP-LI-05 — Live Onboarding and Calibrated Rollout

**Last updated:** 2026-08-26

## STATUS

| Subplan | Weight | Progress | Status |
|---|---:|---:|---|
| SP-LI-05.1 — Developer App, product and consent | 1 | 1/1 | ✅ complete |
| SP-LI-05.2 — Live canary, unread calibration and handoff | 1 | 0/1 | ⚠️ 2/7 phases complete |
| **Overall** | **2** | **1/2 (50%)** | **live inbox green; unread calibration pending** |

## Outcome

The owner completes LinkedIn's visible consent flow, the token is placed in the gitignored root `.env`, and a read-only
canary proves historical bootstrap plus incremental messages before unread is declared authoritative.

## Subplans

- [SP-LI-05.1](../subplans/sp-05-1-developer-app-consent.plan.md)
- [SP-LI-05.2](../subplans/sp-05-2-live-calibration.plan.md)

## Exit evidence

- Redacted access receipt: product, scope, token expiry and consent timestamp only.
- Live counts and cursor evidence without message content.
- Manual owner comparison of one read and one unread conversation.
- Installed CLI smoke from a fresh terminal.
