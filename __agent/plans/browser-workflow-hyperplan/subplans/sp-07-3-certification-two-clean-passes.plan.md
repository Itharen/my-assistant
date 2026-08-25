# SP-07.3 — Certification & two clean passes

**Status:** in-progress — two clean passes green; final ledger waits for SP-05.3
**Evidence:** 2026-08-25 két egymást követő változatlan-candidate `pnpm verify`: passzonként 40/40 unit +
13/13 E2E. Final 7/7 MP, 21/21 SP ledger SP-05.3 után zárható.

## Munka

- Full audit: HP↔MP↔SP status, REQ traceability, code, tests, CI, docs, package, adapters, live evidence.
- Pass evidence immutable reportban; bármely finding után fix-forward és streak reset.
- Két egymást követő teljesen tiszta pass kötelező.

## Acceptance

- [x] 1. full pass: 0 finding.
- [x] 2. full pass: 0 finding, az első után változatlan release candidate-en.
- [ ] Completion ledger 7/7 MP, 21/21 SP és minden evidence linket tartalmaz.
