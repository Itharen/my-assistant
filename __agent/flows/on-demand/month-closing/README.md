# month-closing

**Mikor fut:** hónap utolsó hetében vagy a következő hónap elején.
**Tipikus időtartam:** 30-60 perc.

## Cél

Havi zárás három független szempontból:

1. **Pénzügy** — bevétel/kiadás összegzés, wallet domain frissítés
2. **Feladat-retro** — előző havi célok teljesülése
3. **Tervezés** — következő havi célok kitűzése

## Fázisok

1. `_intake.md` — milyen hónapot zárunk, van-e kontextus
2. `_subflow-1-financial.md` — pénzügy
3. `_subflow-2-retro.md` — feladat-retro
4. `_subflow-3-planning.md` — jövő havi tervezés
5. `_close.md` — output mentés, log

A három subflow **független**, akár sorrend-cserélhető a user preferenciája szerint.

## Output

- `data/wallet.md` — havi összesítés szekció
- `log/monthly/{YYYY-MM}.md` — havi retro + jövő havi célok
