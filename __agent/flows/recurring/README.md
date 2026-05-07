# recurring/

Időzítve futó flow-k. Az assistant figyeli az utolsó futás dátumát és javaslatot
tesz a usernek, ha esedékes.

## Tervezett recurring flow-k

| Flow | Periódus | Mit csinál |
|---|---|---|
| `daily-review` | Naponta reggel | Tegnap tett vs. ma tervezett, P0 feladatok átfutása, deadline-ok |
| `weekly-planning` | Hetente vasárnap/hétfő | Heti prioritások, project-allokáció |
| `month-closing` | Havonta utolsó / első hét | Pénzügyi zárás, retrospektív, jövő havi célok |

## Esedékesség nyilvántartás

Minden recurring flow `_close.md` fázisa beír egy bejegyzést `log/recurring.md`-be:

```yaml
- flow: daily-review
  ran_at: 2026-05-07T08:15:00+02:00
  outcome: completed | partial | skipped
```

A következő session indulásakor ebből számolható, hogy melyik recurring flow esedékes.
