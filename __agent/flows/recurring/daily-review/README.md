# daily-review

> 🧭 **HASZNÁLATI EMLÉKEZTETŐ — ne ugord át.**
> **Ki vagy:** `__agent/IDENTITY.md` (Honnie) · **Minden workflow szabálya:**
> `__agent/workflow-rules.md` · **Belépési pont:** `__agent/ENTRY.md`
> **Mindhármat FRISSEN olvasd be** — kompaktálás után a fejedben már nincsenek meg.
>
> **Ehhez a flow-hoz tartozó külön szabályok:** `current/principles/sleep-system.md` (a „reggel" a csúszó ciklushoz igazodik, nem naptári) · `current/principles/priority-system.md` · `current/principles/task-list-minimum-length.md` (legalább 10 elem)
> **A flow adatforrása(i):** ⚠️ **előbb `__agent/SOURCE_OF_TRUTH.md`** — feladatok: `fo tasks.*` · napló: `current/diary/`
> **Kilépési feltétel (a kész definíciója):** a user látta a tegnapi zárást, a mai tervet és a blokkolókat — és tudja, mi a következő konkrét lépés.

---


**Periódus:** napi (reggel)
**Tipikus időtartam:** 5-10 perc

## Cél

Napi indulás: tisztában legyek a P0/P1 feladatokkal, ne csússzanak el deadline-ok,
és legyen egy reális napi terv.

## Fázisok

1. `_intake.md` — kontextus betöltés, user "ma mire fókuszálsz?" kérdés
2. `_subflow-1-yesterday.md` — tegnapi review (mit csináltunk, mi maradt)
3. `_subflow-2-today.md` — mai prioritások, deadline-ok ellenőrzése
4. `_subflow-3-blockers.md` — blokkolók azonosítása
5. `_close.md` — napi terv lementése `data/tasks.md`-be

## Output

- `data/tasks.md` frissítve — mai feladatok kijelölve
- `log/daily/{YYYY-MM-DD}.md` — napi log bejegyzés
- `STATUS.md` reset → `idle`
