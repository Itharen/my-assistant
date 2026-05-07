# daily-review / _subflow-3-blockers

## Cél

Azonosítani a mai feladatok blokkolóit, hogy ne pazaroljunk időt rájuk feleslegesen.

## Lépések

Minden ma választott feladatra:

1. Van-e olyan **input** amire vársz? (más embertől, külső rendszerből)
2. Van-e olyan **döntés** amit előbb meg kell hozni?
3. Van-e olyan **erőforrás** ami nincs meg? (eszköz, hozzáférés, dokumentáció)

Minden blokkolóhoz jegyezd fel `data/tasks.md`-ben:
```
- [ ] {feladat} (P1)
  - 🚫 Blokkolva: {mire vár}
  - 📅 Felülvizsgálat: {dátum}
```

Ha **minden** mai feladat blokkolva → ALARM, javasolj alternatívát (P3 backlog, vagy
proaktív blokkoló-feloldás).

## Output

Folytatás → `_close.md`
