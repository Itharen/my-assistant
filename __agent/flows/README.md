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

## 🔴 KÖTELEZŐ: minden flow README-je a HASZNÁLATI EMLÉKEZTETŐVEL kezdődik

A flow-kat tipikusan **kontextus-kompaktálás után** olvassa az agent, amikor a szabályok már
kiestek a fejéből. Ezért minden `README.md` a `__agent/workflow-rules.md` §1-ben definiált
fejléc-blokkal indul (ki vagy · minden workflow szabálya · belépési pont · a flow saját
szabályai · adatforrás · kilépési feltétel).

⛔ **Fejléc-blokk nélküli flow-t nem futtatunk** — előbb pótoljuk.

## Új flow létrehozása

1. Mappa: `flows/{kategoria}/{flow-nev}/`
2. Kötelező fájlok: `README.md` (**a fejléc-blokkal kezdve**), `_intake.md`, `_close.md`
3. Opcionális: tetszőleges számú `_subflow-N-{nev}.md`
4. Ha a user szava indokolta → a **szó szerinti** szöveg `current/principles/` alá is
5. Felvenni a `__agent/capabilities/CATALOG.md`-be — **`⏳ jóváhagyásra vár`** státusszal
6. **Új flow csak user jóváhagyással** kerülhet be (lásd `WORKFLOW.md` Authority szekció)
