# SP-07.1 — Staged rollout

**Status:** verified
**Evidence:** fixture + live shadow read + dry-run diff + dedicated stage-3 34-line write/final audit green;
canonical runbook and regression suite shipped. Personal-plugin source valid; Codex Store CLI refresh host ACL issue
is distribution follow-up, nem a cross-agent CLI/MCP core acceptance hiánya.

## Munka

- Stage 0 fixture-only; Stage 1 live shadow read; Stage 2 dry-run diff; Stage 3 supervised reversible writes;
  Stage 4 reconciliation; Stage 5 további site-adapterek.
- Promotion gate minden stage-hez evidence/SLO/known-issues alapján.
- Kill switch és fail-closed policy pénzügyi vagy authority drift esetére.

## Acceptance

- [ ] Egy stage sem kerülhető át zöld upstream evidence nélkül.
- [ ] Stage 1/2 nincs external mutation.
- [ ] Incident után fix-forward + új promotion evidence szükséges.
