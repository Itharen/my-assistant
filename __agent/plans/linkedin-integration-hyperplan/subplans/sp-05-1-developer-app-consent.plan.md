# SUBPLAN SP-LI-05.1 — Developer App, Product and Consent

**Status:** complete · **Progress:** 6/6 (100%) · **Last updated:** 2026-08-26

## Manual owner phases

1. ✅ Confirm eligibility through successful live LinkedIn authorization.
2. ✅ Create the Developer App using LinkedIn's required default company page (`My Handler Tool`).
3. ✅ Request/accept the Member Data Portability API (Member) product terms.
4. ✅ Generate a consented token with the documented self-service portability scope.
5. ✅ Owner selected the gitignored root `.env` and approved `LINKEDIN_MEMBER_ACCESS_TOKEN`.
6. ✅ Run `ma linkedin doctor` and store only the redacted access receipt.

## Safety

The owner handles LinkedIn's visible login and consent. The agent never asks for the LinkedIn password and never
copies the token into chat, source files, command-line arguments or action logs.
