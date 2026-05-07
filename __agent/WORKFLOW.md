# WORKFLOW — governance

A my-assistant **workflow-alapú** rendszer. Minden tevékenység egy flow-ba
illeszkedik. A flow-k három kategóriába tartoznak:

| Kategória | Mikor fut | Példa |
|---|---|---|
| **recurring** | Időzítve / periodikusan | napi review, heti tervezés, hónapzárás |
| **on-demand** | User-trigger | konkrét projekt-tervezés, vásárlás-tervezés |
| **event-based** | Esemény hatására | új USER_INPUT érkezett, deadline közeleg |

## Flow szerkezet

Minden flow egy mappa az `__agent/flows/{kategoria}/{flow-nev}/` alatt, és a
következő fájlokat tartalmazza:

```
{flow-nev}/
├── README.md           # mit csinál ez a flow, mikor fut
├── _intake.md          # input gyűjtés (user kérdések, kontextus)
├── _subflow-1-*.md     # első sub-flow (egy adott domain feldolgozása)
├── _subflow-2-*.md     # második sub-flow
├── _subflow-N-*.md     # N. sub-flow
└── _close.md           # lezárás, output, log
```

A sub-flow-k **párhuzamosan** is futhatnak, ha függetlenek (lásd `_intake.md`-ben
deklarálva). Soros flow-knál sorrendben kell végigmenni.

## Belépési pontok

1. **Bootstrap / új session:**
   - Olvasd `STATUS.md` → ha `state != idle`, folytasd ott
   - Olvasd `USER_INPUT.md` → ha van `[NEW]` blokk, `on-user-input` event
   - Egyébként: kérdezd meg a usert mit csináljunk, vagy futtass egy esedékes recurring flow-t

2. **Flow indítás:**
   - User-trigger: `on-demand/{flow-nev}` futtatása
   - Időzítve: `recurring/{flow-nev}` ha esedékes (lásd `recurring/README.md`)
   - Esemény: `event-based/{flow-nev}` automatikus

## Phase-ek (egy flow-n belül)

| Fázis | Mit csinál |
|---|---|
| `_intake` | Input gyűjtés a usertől, kontextus betöltés |
| `_subflow-N` | Egy domain / sub-task feldolgozása |
| `_close` | Output mentés (`data/`-ba), `log/`-ba bejegyzés, `STATUS.md` reset |

## Event-ek

| Event | Trigger | Művelet |
|---|---|---|
| `on-user-input` | `USER_INPUT.md`-ben `[NEW]` blokk | parse → routing a megfelelő domain-hez/flow-hoz |
| `on-flow-interrupted` | Session vége flow közben | `STATUS.md`-be aktuális fázis mentve, következő session folytatja |
| `on-deadline-approaching` | `data/tasks.md`-ben deadline < 24h | figyelmeztetés a következő interakcióban |
| `on-approval-needed` | Flow javasol egy akciót | `state: awaiting-approval`, várjon user input-ra |
| `on-recurring-due` | Recurring flow esedékes | javaslat a usernek hogy futtassuk |

## Prioritás (feladat-szinten)

A `data/tasks.md` és más domain-ek feladatait az alábbi prioritás-séma szerint
rangsoroljuk:

| Tier | Jelölés | Mikor |
|---|---|---|
| P0 | 🔴 | Azonnali / blokkoló / lejárt deadline |
| P1 | 🟠 | Ezen a héten |
| P2 | 🟡 | Ezen a hónapon belül |
| P3 | 🟢 | Backlog, nincs konkrét deadline |

## Authority — mit szabad, mit nem

**Az assistant ÖNÁLLÓAN megteheti:**
- `data/` alatti fájlokat olvasni / írni
- `log/` alatti fájlokat írni
- `plans/` alatti fájlokat tervezni (de jóváhagyás kell végrehajtás előtt)
- `STATUS.md` frissítése
- `USER_INPUT.md` blokkokat `[DONE]`-ra állítani feldolgozás után

**Az assistant CSAK JÓVÁHAGYÁSSAL teheti:**
- Új flow definíció létrehozása (`flows/` alá)
- Domain bővítés / shrinkage (`domains/` változás)
- Külső rendszer felé akció (pl. email küldés, file írás `my-assistant/`-on kívülre)
- `WORKFLOW.md` / `CONTEXT.md` módosítása

## Migrációs alapelv

Minden adatformátum úgy legyen tervezve, hogy az **organizer** sémájával
kompatibilis legyen — később egyszerű export/import legyen.
