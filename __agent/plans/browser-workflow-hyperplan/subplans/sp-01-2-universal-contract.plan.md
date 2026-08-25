# SP-01.2 — Universal CLI/MCP workflow contract

**Status:** verified
**Evidence:** `workflow.schema.json`, validator tests, real MCP parity J-007.

## Munka

- JSON Schema: RunRequest/RunState/Observation/Effect/Checkpoint/TraversalResult/EvidenceBundle.
- `contractVersion`, capability discovery, backwards-compatible negotiation és typed error taxonomy.
- CLI JSON-envelope és MCP tool response ugyanazon golden contract suite-on.

## Acceptance

- [ ] Minden public shape verziózott és gépileg validálható.
- [ ] Unknown capability/újabb contract leíró hibával fail-closed.
- [ ] CLI↔MCP parity automatikusan tesztelt.
