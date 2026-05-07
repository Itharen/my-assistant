# flows/

Workflow definíciók. Három kategória:

- `recurring/` — időzített / periodikus flow-k (napi, heti, havi)
- `on-demand/` — user-trigger flow-k (alkalmilag indítva)
- `event-based/` — esemény hatására automatikusan futó flow-k

Lásd `../WORKFLOW.md` a flow szerkezeti konvencióihoz.

## Flow névadás

`{flow-nev}` legyen kebab-case, beszédes:
- `daily-review`, `weekly-planning`, `month-closing`
- `shopping-trip-planning`, `project-kickoff`, `expense-report`

## Új flow létrehozása

1. Mappa: `flows/{kategoria}/{flow-nev}/`
2. Kötelező fájlok: `README.md`, `_intake.md`, `_close.md`
3. Opcionális: tetszőleges számú `_subflow-N-{nev}.md`
4. **Új flow csak user jóváhagyással** kerülhet be (lásd `WORKFLOW.md` Authority szekció)
