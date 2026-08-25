# MP-04 — Cross-Agent Distribution

**Status:** verified · **Progress:** 3/3 · **Depends on:** MP-01, MP-02

## Cél

A képesség ne egyetlen assistant vagy prompt sajátja legyen: telepíthető package, univerzális CLI,
MCP és vékony consumer-adapterek adják ugyanazt a contractot minden agentnek. A böngésző execution plane
helyi marad; távoli agent hitelesített relayen kér run-t, közvetlen port-expozíció nélkül.

## Subplanek

- [SP-04.1](../subplans/sp-04-1-cli-mcp-package.plan.md) — package + CLI + MCP parity
- [SP-04.2](../subplans/sp-04-2-agent-adapters-matrix.plan.md) — agent adapters/compatibility matrix
- [SP-04.3](../subplans/sp-04-3-namespaces-onboarding-docs.plan.md) — namespaces/onboarding/docs

## Acceptance

- [x] CLI önmagában teljes baseline; MCP kiesésekor nincs képességvesztés.
- [x] Codex, Claude Code, CCAP, FDP Assistant és My Assistant onboarding verifikált.
- [x] Consumerenként session/config/log namespace izolált és korrelálható.
- [x] Local és remote agent-topológia, lease, queue, cancel és handoff automatán tesztelt.

**Evidence:** J-006/J-007, `2026-08-23-agent-compatibility.md`, My Assistant `browser-workflows.md`.
