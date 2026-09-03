# SUBPLAN SP-LI-01.2 — Credential Source and Authorization Contract

**Status:** complete · **Progress:** 5/5 (100%) · **Last updated:** 2026-08-26

## Phases

1. ✅ Define injected `LinkedInSecretProvider` and `CommandRunner` interfaces.
2. ✅ Implement environment and optional FDP CLI lookup without logging secret values.
3. ✅ Persist only credential-source metadata and the approved key name in local configuration.
4. ✅ Redact tokens, message bodies and participant identifiers from errors/action logs.
5. ✅ Add missing-key/malformed-output, redaction and failure-path tests.

## Owner gate

Owner selected the gitignored root `.env` and approved `LINKEDIN_MEMBER_ACCESS_TOKEN` on 2026-08-26.

## Acceptance

- Default live source is the gitignored project-root `.env`; no command-line secret or tracked token file.
- Token lifetime/expiry may be logged; token value may not.
- Tests prove secrets do not appear in envelopes, stderr or action-log records.
- Optional FDP mode retains project-level in-memory parsing; the owner live setup does not depend on FDP access.
