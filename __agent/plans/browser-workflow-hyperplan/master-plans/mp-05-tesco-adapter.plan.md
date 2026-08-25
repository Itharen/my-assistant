# MP-05 — Tesco Vertical Slice

**Status:** review/Organizer-gate · **Progress:** 2/3 · **Depends on:** MP-02, MP-03, MP-04

**Evidence:** Tesco live read-only 54/54 + dedicated 34-line cart-write audit green; canonical runbook, cart audit,
unknown-quantity fail-close és adapter tests zöld. Organizer delivery feedback marad nyitva.

## Cél

A Tesco `shop/hu-HU` felülethez külön site-adapter és domain-workflow készüljön, amely teljes listát olvas,
terméket old fel, kosár-diffet alkalmaz/ellenőriz, majd rendelés után visszacsatol.

## Subplanek

- [SP-05.1](../subplans/sp-05-1-tesco-recon-product-model.plan.md) — reconnaissance/product model
- [SP-05.2](../subplans/sp-05-2-cart-diff-approval.plan.md) — cart diff/mutations/approval
- [SP-05.3](../subplans/sp-05-3-reconciliation-organizer.plan.md) — delivery reconciliation/Organizer

## Acceptance

- [x] Product matching ID-first, confidence- és preference-alapú.
- [x] Cart műveletek diff-alapúak, oldalanként/elemenként postconditionnel és független final trolley-audittal.
- [ ] Hiányzó/helyettesített termékek kontrolláltan visszakerülnek a kanonikus shopping modulba.
