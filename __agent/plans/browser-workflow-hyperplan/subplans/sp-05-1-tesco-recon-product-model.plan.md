# SP-05.1 — Tesco reconnaissance & product model

**Status:** verified
**Evidence:** dated official-source evidence; live signed-in `alpro` canary 54/54 (48+6); ID-first tests.

## Munka

- Hivatalos/engedélyezett API, connector, export és Tesco feltételek aktuális felderítése; API-first, ha valóban
  lefedi a műveletet, browser adapter csak a fennmaradó UI-részekre.
- `shop/hu-HU` search/product/category/favourites/cart DOM contract és authenticated variants.
- Product DTO: Tesco ID, canonical name, size/unit, price/unit price, promotion, availability, category.
- Matching: exact saved product ID → preference rule → scored candidates → ambiguity gate.

## Acceptance

- [ ] `alpro` baseline 102/102 találatot traversal-ez vagy explicit partial stopot ad.
- [ ] Azonos nevű/külön kiszerelésű termékek nem keverednek.
- [ ] DOM selector drift fixture-ben reprodukálható, site-profile-ban javítható.
- [ ] Az alkalmazott hozzáférési út és ismert korlátai dátumozott evidence-ben dokumentáltak.
