# event-based/

Esemény hatására automatikusan futó flow-k. NEM user-trigger, hanem feltétel-trigger.

## Tervezett event-based flow-k

| Flow | Trigger | Mit csinál |
|---|---|---|
| `on-user-input` | `USER_INPUT.md`-ben új `[NEW]` blokk | parse → routing a megfelelő domain-hez |
| `on-deadline-warning` | `data/tasks.md`-ben P-feladat deadline < 24h | figyelmeztetés a következő interakcióban |
| `on-flow-resume` | Session indul, `STATUS.md` nem `idle` | folytatás az utolsó fázistól |
| `on-recurring-due` | Esedékes recurring flow | javaslat a usernek hogy futtassuk |

## Mikor fut

Minden session indulásakor az assistant **első dolga**:

1. `on-flow-resume` ellenőrzés (van-e megszakadt flow?)
2. `on-user-input` ellenőrzés (van-e `[NEW]` blokk?)
3. `on-recurring-due` ellenőrzés
4. `on-deadline-warning` ellenőrzés

Ezek **NEM kizáróak** — több is futhat egyszerre, sorrendben.
