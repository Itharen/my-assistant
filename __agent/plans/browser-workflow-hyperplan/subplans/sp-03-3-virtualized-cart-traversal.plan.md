# SP-03.3 — Virtualized/cart traversal

**Status:** verified
**Evidence:** virtual-500 fixture; cart quantity authoritative postcondition + stable product ID effects.

## Munka

- DOM recycling és viewport-window kezelés stable item keyvel.
- Cart mutation után re-observe teljes vagy targeted traversal; scroll-position nem identity.
- Large-cart fixture: increment/decrement/remove, lazy price summary és concurrent badge update.

## Acceptance

- [ ] 500+ item virtual listből minden stable ID egyszer kerül ki.
- [ ] Recycled DOM node nem okoz item-keverést.
- [ ] Mutation után cart total + line quantity authoritative postcondition.
