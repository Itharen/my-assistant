# month-closing / _subflow-1-financial

## Cél

Adott hónap pénzügyi zárása.

## Lépések

1. **Bevétel összesítés** — `data/wallet.md` "income" tételei a hónapra
2. **Kiadás összesítés** kategóriánként:
   - Fix költségek (lakás, közüzem, előfizetések)
   - Élelmiszer
   - Egyéb
3. **Megtakarítás** = bevétel - kiadás
4. **Eltérés** az előző hónaphoz képest (% és abszolút)
5. **Anomáliák** — kiugró tételek (előző hó átlag +50%)

## Output

`data/wallet.md` aljára egy havi összesítés szekció:

```markdown
## {YYYY-MM} havi zárás
- Bevétel: {Ft}
- Kiadás: {Ft}
  - Fix: {Ft}
  - Élelmiszer: {Ft}
  - Egyéb: {Ft}
- Megtakarítás: {Ft} ({+/- %} az előző hóhoz)
- Anomáliák: {lista vagy "nincs"}
```
