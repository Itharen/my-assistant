# SP-05.3 — Delivery reconciliation & Organizer feedback

**Status:** review — Organizer write gate
**Evidence:** delivery outcomes automated; shopping is `organizer-partial`, so live write+readback awaits approval.

## Munka

- Order confirmation + electronic delivery note parser, product ID/name/quantity/substitution mapping.
- Ordered vs offered vs accepted/delivered diff; missing/rejected/substituted outcome.
- Organizer shopping read; write a jelenlegi `organizer-partial` authority szerint approval/verification gate-tel.

## Acceptance

- [ ] Minden ordered line pontos outcome-ot vagy explicit unresolved állapotot kap.
- [ ] Missing item nem sikkad el; deduplikált retry metadata-val visszakerül.
- [ ] Organizer write visszaolvasással és action-log correlationnel bizonyított.
