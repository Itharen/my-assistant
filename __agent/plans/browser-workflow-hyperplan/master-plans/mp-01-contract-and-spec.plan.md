# MP-01 — Contract & Spec Alignment

**Status:** verified · **Progress:** 3/3 · **Depends on:** —

## Cél

A user új követelményeit és a közös agent-contractot a tool specifikációjában, verziózott sémáiban és
traceability ledgerében kanonizálni, implementáció előtt.

## Subplanek

- [SP-01.1](../subplans/sp-01-1-spec-gap-amendment.plan.md) — spec-gap amendment
- [SP-01.2](../subplans/sp-01-2-universal-contract.plan.md) — universal CLI/MCP workflow contract
- [SP-01.3](../subplans/sp-01-3-security-authority-contract.plan.md) — security/authority/approval contract

## Acceptance

- [x] Cross-agent, pagination és tuning REQ-ek explicit, user-approved specben szerepelnek.
- [x] CLI/MCP sémák contract-versionnel és capability negotiationnel definiáltak.
- [x] Minden REQ-nek pontos primary MP/SP ownere és evidence-típusa van.

**Evidence:** tool `__specifications/main.md`, `dsgn-012`, `server/schemas/workflow.schema.json`.
