# SP-02.1 — Bootstrap, session & health

**Status:** verified
**Evidence:** J-005 cold-start/reconnect/missing-extension health; Windows ETIMEDOUT fix.

## Munka

- Self-start/ensure-running, single-primary lock, version check és documented recovery.
- Chrome/extension/bridge/session health model; login-required és stale-tab külön állapot.
- Boot timeout diagnosztika: phase, dependency, elapsed, next safe action.

## Acceptance

- [ ] Cold start, already-running, concurrent start és broken-extension variáns tesztelt.
- [ ] Timeout után nincs vak retry; health evidence dönti el a recovery-t.
- [ ] Agent reconnect nem veszíti el a persistent sessiont.
