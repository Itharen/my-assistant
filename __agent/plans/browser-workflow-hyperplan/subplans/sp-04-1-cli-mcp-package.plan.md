# SP-04.1 — CLI/MCP package parity

**Status:** verified
**Evidence:** package/bin, self-start doctor, CLI capabilities, real MCP in-memory transport parity.

## Munka

- Egyetlen published package: executable CLI, bridge és MCP stdio entrypoint.
- CLI minden capabilityt elér; MCP minimális active surface + capability invoke.
- Self-start, doctor, version/capabilities és machine-readable help.

## Acceptance

- [ ] Friss gépen dokumentált install után agent CLI-ből használhatja.
- [ ] MCP down esetén ugyanaz a workflow CLI-n végrehajtható.
- [ ] Minden command/tool azonos golden contract fixture-t teljesít.
