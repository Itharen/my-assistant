# domain: diary

## Scope

Napló bejegyzések — szabad szöveges, dátumhoz kötve.

## Adatfájl

`data/diary.md` (vagy hónaponként: `data/diary/{YYYY-MM}.md`)

## Formátum

```markdown
# diary

## {YYYY-MM-DD}
{szabad szöveg}

---
```

## Érintett flow-k

- `event-based/on-user-input` (diary típus)
