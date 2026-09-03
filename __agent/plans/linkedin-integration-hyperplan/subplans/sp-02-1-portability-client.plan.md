# SUBPLAN SP-LI-02.1 — Portability API Client and Schemas

**Status:** complete · **Progress:** 6/6 (100%) · **Last updated:** 2026-08-26

## Phases

1. ✅ Create one typed HTTP boundary around `api.linkedin.com/rest`.
2. ✅ Centralize API version, product endpoints, timeout and safe retry policy.
3. ✅ Parse authorization, snapshot, changelog and error responses from `unknown` with type guards.
4. ✅ Honor `Retry-After` for bounded idempotent GET retries; no retries on schema or permission failures.
5. ✅ Attach endpoint and redacted response diagnostics; command envelopes supply the invocation request ID.
6. ✅ Add success, malformed, permission, 426, 429, timeout and 5xx fixtures/variants.

## Acceptance

- No unvalidated API object crosses into domain logic.
- Version `202312` is a single constant and a `426` explains the exact configured version.
- Fetch is injected so every network outcome is automatable offline.
