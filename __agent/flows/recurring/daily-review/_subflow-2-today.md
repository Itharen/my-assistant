# daily-review / _subflow-2-today

## Cél

Mai prioritások véglegesítése. Nem több, mint amennyi reálisan belefér.

## Lépések

1. **Calendar check:** `data/calendar.md` — mai fix időpontok (mennyi szabad idő marad?)
2. **Deadline check:** `data/tasks.md` — bármi P0 (lejárt vagy ma esedékes)?
3. **Energia-allokáció:**
   - P0 mindenképp → kerüljön ma "in-progress"-be
   - P1-ből annyi férjen be, amennyi az `_intake`-ben mért energiához passzol
   - P2/P3 csak ha tényleg van helye

4. Javasolj egy mai feladat-listát a usernek **döntésre** (max 5-7 elem).

## Approval gate

State → `awaiting-approval`. Várd meg a user OK-ját.
Ha módosítást kér, alkalmazd, és kérj újra OK-t.

## Output

Folytatás → `_subflow-3-blockers.md`
