# domain: wishlist

## Scope

Kívánságlisták — jövőbeli vásárlási tervek, nem azonnaliak.

## Adatfájl

`data/wishlist.md`

## Formátum

```markdown
# wishlist

## {kategória}
- {tétel} | {becsült ár} | {prioritás} | {forrás-link: opcionális}
```

## Érintett flow-k

- `event-based/on-user-input` (wishlist típus)
- `on-demand/month-closing` `_subflow-3-planning` — wishlist tételek tervezése
