# SP-04.2 — Agent adapters & compatibility matrix

**Status:** verified
**Evidence:** dated compatibility matrix; authenticated relay auth/queue/cancel/origin E2E.

## Munka

- Consumers: Codex, Claude Code, CCAP, FDP Assistant, My Assistant; további agent generic CLI-ként.
- Adapter csak transport/config/approval-notification; workflow logic nem duplikálódhat.
- Matrix: local/remote execution, install, discovery, namespace, resume, approval, evidence, error handling.
- Remote agent → authenticated local dispatcher/CCAP relay → local `ubh`; loopback bridge nem kerül internetre.
- Queue/lease/cancel/handoff contract megakadályozza, hogy több agent ugyanazt a Chrome-profilt egyszerre vezérelje.

## Acceptance

- [ ] Minden felsorolt consumer teljes read/traverse/dry-run reference journey-t futtat.
- [ ] Nincs consumer-specifikus fork a common core-ban.
- [ ] Contract drift compatibility testben bukik, nem runtime közepén.
- [ ] Remote relay request originje, authority-je és result evidence-e végig korrelált.
