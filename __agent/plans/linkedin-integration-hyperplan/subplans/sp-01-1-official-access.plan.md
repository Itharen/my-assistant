# SUBPLAN SP-LI-01.1 — Official Access and Eligibility

**Status:** complete · **Progress:** 5/5 (100%) · **Last updated:** 2026-08-26

## Phases

1. ✅ Document the official product, endpoints, scope, eligibility and default-company requirement.
2. ✅ Add a read-only `doctor` contract that reports configuration, credential and API readiness.
3. ✅ Validate the Member Data Portability product through a live authorization probe.
4. ✅ Verify the authenticated member identity and consent timestamp via `memberAuthorizations`.
5. ✅ Record redacted access evidence and failure diagnostics.

## Acceptance

- EEA eligibility is never inferred from IP; live LinkedIn authorization is the authority.
- A 403/permission/scope error is reported as access-not-provisioned, never retried blindly.
- No message data is requested before consent and product readiness are verified.
