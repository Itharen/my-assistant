# domain: wallet

## Scope

Pénzügyi tételek: bevétel, kiadás, kategorizálva. Havi összesítés.

## Adatfájl

`data/wallet.md`

## Formátum

```markdown
# wallet

## {YYYY-MM}

### Income
- {YYYY-MM-DD} | {Ft} | {forrás} | {kategória}

### Expense
- {YYYY-MM-DD} | {Ft} | {leírás} | {kategória: fix / élelmiszer / egyéb}

### Havi zárás
(month-closing flow tölti ki)
```

## Kategóriák (kiadás)

- `fix` — lakás, közüzem, előfizetések
- `élelmiszer`
- `közlekedés`
- `egyéb`

(Bővíthető user igény szerint.)

## Érintett flow-k

- `on-demand/month-closing` `_subflow-1-financial` — havi összesítés
- `on-demand/expense-tracking` — vegyes tételek berögzítése
- `event-based/on-user-input` (wallet típus) — új tétel
