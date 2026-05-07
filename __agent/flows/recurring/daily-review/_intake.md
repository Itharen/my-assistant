# daily-review / _intake

## Kontextus betöltés

Olvasd be a következőket:

1. `data/tasks.md` — összes aktív feladat
2. `data/calendar.md` — mai naptár események
3. `log/daily/{tegnap}.md` — tegnapi log (ha létezik)
4. `log/recurring.md` — utolsó daily-review futás

## User input — kérdések

Tedd fel a usernek (egyszerre, listában):

1. **Hogy aludtál / milyen energiaszinten vagy ma?** (befolyásolja mennyi P1+ fér bele)
2. **Van valami fix időpont ma, ami nincs a calendar-ben?**
3. **Van olyan feladat amit ma mindenképp le kell zárni?**
4. **Bármi új ami tegnap óta felmerült?** (ha igen → `USER_INPUT.md`-be új blokk)

## Output

`STATUS.md` frissítés:
```yaml
state: flow-active
active_flow: recurring/daily-review
active_phase: _subflow-1-yesterday
```

Ezután → `_subflow-1-yesterday.md`
