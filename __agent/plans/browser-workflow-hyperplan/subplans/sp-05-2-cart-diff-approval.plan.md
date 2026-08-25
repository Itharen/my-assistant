# SP-05.2 — Cart diff, mutations & approval

**Status:** verified
**Evidence:** user-authorized dedicated UBH 34-line cart build: 34/34 canonical IDs, 81 db, `missing=[]`, `extra=[]`;
canonical runbook, `unverifiedCartLines` fail-close és independent final cart audit automatán zöld.

## Munka

- Existing cart full traversal; normalized desired-vs-actual diff.
- Bounded add/increment/decrement/remove effects, line- és cart-summary postconditionnel.
- Dry-run manifest; checkout/slot/payment határnál action-time approval és exact preview.

## Acceptance

- [ ] Ugyanaz a diff kétszeri futtatásakor a második no-op.
- [ ] Partial mutation után resume csak a hiányzó effecteket hajtja végre.
- [ ] Checkout/fizetés soha nem történik explicit action-time user confirmation nélkül.
