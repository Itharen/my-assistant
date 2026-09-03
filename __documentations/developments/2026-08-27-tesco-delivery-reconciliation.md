# Tesco delivery reconciliation — 2026-08-27

## Outcome

The final Tesco order summary for order `3331-8817-62` reports zero substituted
items and zero unavailable items. The user confirmed that this order was
delivered. Therefore the product lines in that summary are the authoritative
stock increments for this reconciliation.

The agent-built cart was only a draft. Products present in the earlier desired
manifest but absent from the final summary were removed by the user before
checkout; they are not failed Tesco lines and remain open stock shortages.

No delivery address, phone number, payment data, or other unnecessary personal
data is persisted in this document.

## Confirmed delivered lines

| Quantity | Product |
|---:|---|
| 2 | Karaván Toast cheddar 100 g |
| 1 | Magyar Tejföl 12%, 330 g |
| 2 | Magyar Tejföl 12%, 140 g |
| 1 | Président sós vaj 200 g |
| 2 | Tesco Edam 300 g |
| 2 | Tesco coleslaw 180 g |
| 1 | Bella mini burek 480 g |
| 2 | Buitoni Piccolinis three-cheese, 9 × 30 g |
| 1 | Valdor Zizu 500 g |
| 3 | Alpro caramel dessert |
| 1 | Alpro dark chocolate dessert |
| 9 | Abonett cheese-chive sandwich |
| 10 | Alpro vanilla soy drink 1 l |
| 2 | Coca-Cola Cherry Zero 1.75 l |
| 2 | Coca-Cola Zero 1.75 l |
| 1 | Dreher Gold 6 × 0.5 l pack — six stock units |
| 1 | Fanta Zero lemon-elderflower |
| 1 | Fanta Zero orange |
| 3 | Grill Master tortilla 4 × 62.5 g |
| 4 | HELL Zero White Peach 250 ml |
| 2 | Jar Lemon 450 ml |
| 3 | Kinley Ginger Ale Zero 1.5 l |
| 1 | Kinley Tonic Zero 1.5 l |
| 2 | Mr Muscle Power Gel 1 l |
| 2 | Protect cockroach and ant spray |
| 1 | Springforce paper towel, 4 rolls |
| 2 | Sprite Zero 1.75 l |
| 2 | XIXO Peach Ice Tea Zero 1.5 l |

## Remaining confirmed shortages for the next draft cart

The machine-readable manifest is
`current/shopping/tesco-cart-desired-2026-08-27.json`. It contains 52 definite
units across 18 products, including the water conversions:

- Primavera: 2 shrink-wrapped packs = 12 bottles.
- Szentkirályi extra-carbonated: 1 shrink-wrapped pack = 6 bottles.
- Mizse: add the per-order maximum of 2 shrink-wrapped packs = 12 bottles;
  carry 3 packs = 18 bottles forward.

Viennetta and Tesco Mini Mix are availability-gated. Cold cuts and the Negro
trial remain one batched user-decision group and do not block clear products.

## Durable interpretation

Future reconciliations must compare three separate states:

1. the agent's desired draft manifest;
2. the final Tesco order confirmation after user edits;
3. actual delivered items when delivery differs from confirmation.

Only state 3, or state 2 when the user confirms an exact delivery with no
delivery discrepancy, increments stock. Draft-only lines remain open and are
automatically proposed again in the next cart.
