# domain: notes

## Scope

Strukturált jegyzetek, note-book-okba szervezve. Témánként.

## Adatfájl

`data/notes.md` (vagy nagyobb mennyiségnél `data/notes/{notebook}.md`)

## Formátum

```markdown
# notes

## {notebook neve}

### {jegyzet címe} — {YYYY-MM-DD}
{tartalom}

---
```

## Érintett flow-k

- `event-based/on-user-input` (note típus) — új jegyzet
