# domain: shopping

## Scope

Bevásárló-listák. Több párhuzamos lista lehet (pl. "Heti bevásárlás", "Barkács", "Gyógyszertár").

## Adatfájl

`data/shopping.md`

## Formátum

```markdown
# shopping

## Active lists

### {lista neve}
- [ ] {tétel} | {mennyiség} | {bolt-preferencia: opcionális}

## Completed (archive)
- {YYYY-MM-DD} | {lista neve} | {tételszám}
```

## Érintett flow-k

- `on-demand/shopping-trip` — vásárlás előtt: bolt-szerinti rendezés, sorrend
- `event-based/on-user-input` (shopping típus) — új tétel listához
