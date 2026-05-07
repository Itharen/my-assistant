# on-demand/

User-trigger flow-k. Akkor futnak, ha a user explicit elindítja.

## Tervezett on-demand flow-k

| Flow | Mikor fut | Mit csinál |
|---|---|---|
| `month-closing` | Havi zárásnál | Pénzügy + retro + jövő havi tervezés |
| `project-kickoff` | Új projekt indulásánál | Scope, milestones, első task-ok bontása |
| `shopping-trip` | Vásárlás előtt | Shopping-list optimalizálás (bolt, sorrend) |
| `expense-tracking` | Vegyes kiadások berögzítésekor | Wallet domain feltöltése |
| `weekly-planning` | (átfedés recurring-gal, lehet on-demand is) | Heti terv |
| `quarterly-review` | Negyedévente | Hosszú távú célok újraértékelése |

## Flow indítás

User mondja: "futtassuk a {flow-nev}-et" vagy "csináljunk {flow-nev}-et".
Az assistant:

1. Ellenőrzi, létezik-e a flow `flows/on-demand/{flow-nev}/`
2. Ha nem létezik → kérdezi a usert, csináljunk-e új flow definíciót (jóváhagyás kell)
3. Ha létezik → `_intake.md`-vel kezd
