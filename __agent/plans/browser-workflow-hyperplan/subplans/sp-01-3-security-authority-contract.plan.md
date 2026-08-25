# SP-01.3 — Security, authority & approval contract

**Status:** verified
**Evidence:** domain policy, loopback test, single-use scope/expiry approval tests and audit log.

## Munka

- Action-tier: read-only, reversible mutation, external communication, irreversible/financial.
- Action-time approval checkout/payment/CAPTCHA/sensitive transmission előtt.
- Namespace-level allowlist, target-domain policy, secret/profile isolation és prompt-injection boundary.

## Acceptance

- [ ] Approval-token egyszer használható, scope- és expiry-kötött.
- [ ] A weboldal tartalma nem emelhet authority-t.
- [ ] Minden tiltás/approval/effect action-logban evidence-szel látszik.
