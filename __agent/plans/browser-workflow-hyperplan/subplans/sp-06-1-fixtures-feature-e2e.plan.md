# SP-06.1 — Controlled fixtures & feature-E2E

**Status:** verified
**Evidence:** 24 feature tests, six pagination variants, security/tuning/cold-start fixtures.

## Munka

- Local fixture-site minden pagination, cart, modal, session és drift variánssal.
- Feature-katalógus: bootstrap/read/act/verify/checkpoint/resume/traverse/cart/approval/error.
- Automata multivariáció: happy/error/edge/partial/fallback/decline/composition.

## Acceptance

- [ ] Feature-katalógus 100%-ához automata E2E tartozik.
- [ ] Thin render/URL teszt nem számít feature coverage-nek.
- [ ] Kritikus feature red/skip esetén release-gate piros.
