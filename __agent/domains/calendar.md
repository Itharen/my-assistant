# domain: calendar

## Scope

Naptár események: fix időpontok, ismétlődő események, deadline-ok időpontként.

## Adatfájl

`data/calendar.md`

## Formátum

```markdown
# calendar

## {YYYY-MM-DD}
- {HH:mm}-{HH:mm} {esemény címe}
  - Helyszín: {opcionális}
  - Résztvevők: {opcionális}
  - Megjegyzés: {opcionális}

## Recurring
- **Hetente {nap} {HH:mm}** — {esemény}
- **Havonta {nap} {HH:mm}** — {esemény}
```

## Érintett flow-k

- `recurring/daily-review` — mai események betöltése az `_intake`-ben
- `recurring/weekly-planning` — heti calendar áttekintés
- `event-based/on-user-input` (calendar típus) — új esemény felvétel
