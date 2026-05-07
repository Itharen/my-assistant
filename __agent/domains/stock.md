# domain: stock

## Scope

Otthoni készletnyilvántartás (élelmiszer, háztartási cikkek, fogyóeszközök).

## Adatfájl

`data/stock.md`

## Formátum

```markdown
# stock

## {kategória}
- {tétel} | {mennyiség} | {egység} | {lejárat: opcionális}
```

## Érintett flow-k

- `event-based/on-user-input` (stock típus)
- `on-demand/shopping-trip` — készlet alapján mit kell venni
